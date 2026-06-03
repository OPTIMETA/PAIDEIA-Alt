// 수집(Accrue) 배선 (plan.md §3.2, §8) — 연결된 강의 노트의 트랜스크립트를 읽어
// 토픽/시험신호로 추출·병합·저장한다. Alt 런타임 전용(alt.notes + alt.ai 필요).
import { alt, hasAltRuntime } from "@/alt/client";
import {
  getExamPoints,
  getLectures,
  getTopics,
  setExamPoints,
  setLectures,
  setTopics,
} from "@/alt/storage";
import { ingestTranscript, mergeTopics } from "@/pipeline/ingest";
import { pickStructuredModel } from "@/alt/ai";
import type { ExamPoint, Topic } from "@/lib/schemas";

export type CollectResult = {
  topics: Topic[];
  examPoints: ExamPoint[];
  /** 코스에 연결된 강의 수 (0이면 연결 안 됨) */
  lectureCount: number;
  /** 실제 추출 성공한 강의 수 */
  ingested: number;
  /** 트랜스크립트가 비어 건너뛴 강의 수 */
  skippedNoTranscript: number;
  /** 강의별 실패(AI 등) — 삼키지 않고 표면화 */
  errors: { noteId: number; message: string }[];
};

/** 진행상태 콜백 (done/total/현재 라벨) — 가운데 진행 팝업이 구독. */
export type CollectProgress = (done: number, total: number, label: string) => void;

/** 동시 추출 상한 — Alt AI 프록시 과부하 방지하면서 다강의 수집 가속. */
const CONCURRENCY = 4;

type CollectOpts = { onlyNoteId?: number; onProgress?: CollectProgress };

/** 코스의 미수집(pending) 강의들을 수집. onlyNoteId 지정 시 그 노트만(transcriptUpdated 대응). */
export async function collectCourse(courseId: string, opts: CollectOpts = {}): Promise<CollectResult> {
  const { onlyNoteId, onProgress } = opts;
  if (!hasAltRuntime()) throw new Error("Alt 런타임에서만 수집할 수 있습니다.");

  const lectures = await getLectures(courseId);
  let topics = await getTopics(courseId);
  const examPoints = await getExamPoints(courseId);
  const updated = [...lectures];

  // 수집 대상 인덱스 선별
  const targets: number[] = [];
  for (let i = 0; i < updated.length; i++) {
    const lec = updated[i];
    if (onlyNoteId != null && lec.noteId !== onlyNoteId) continue;
    if (onlyNoteId == null && lec.status === "ingested") continue;
    targets.push(i);
  }

  const base = {
    lectureCount: lectures.length,
    ingested: 0,
    skippedNoTranscript: 0,
    errors: [] as { noteId: number; message: string }[],
  };
  if (targets.length === 0) return { topics, examPoints, ...base };

  // #4 최적화 ①: 모델은 루프 밖에서 1회만 선택(기존엔 강의마다 models.list() 호출).
  onProgress?.(0, targets.length, "모델 준비…");
  const model = await pickStructuredModel();
  if (!model) throw new Error("Alt 런타임/모델이 없습니다 — 인앱에서 실행하세요.");

  // #4 최적화 ②: 강의별 추출(느린 AI 호출)을 동시성 제한으로 병렬 처리.
  type Outcome =
    | { i: number; kind: "ok"; topics: Topic[]; examPoints: ExamPoint[] }
    | { i: number; kind: "skip" }
    | { i: number; kind: "error"; message: string };
  const outcomes: Outcome[] = [];
  let done = 0;
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const t = cursor++;
      if (t >= targets.length) break;
      const i = targets[t];
      const lec = updated[i];
      try {
        const content = await alt.notes.getContent(lec.noteId);
        const transcript = content.transcript ?? "";
        if (!transcript.trim()) {
          outcomes.push({ i, kind: "skip" });
        } else {
          const res = await ingestTranscript(transcript, lec.noteId, model);
          outcomes.push({ i, kind: "ok", topics: res.topics, examPoints: res.examPoints });
        }
      } catch (e) {
        outcomes.push({ i, kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
      done++;
      onProgress?.(done, targets.length, `강의 ${done}/${targets.length} 분석`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, () => worker()));

  // 병합은 순차(공유 topics/examPoints 레이스 방지). 인덱스 순으로 결정적 결과.
  let ingested = 0;
  let skippedNoTranscript = 0;
  const errors: { noteId: number; message: string }[] = [];
  outcomes.sort((a, b) => a.i - b.i);
  for (const o of outcomes) {
    const lec = updated[o.i];
    if (o.kind === "skip") {
      skippedNoTranscript++;
      continue;
    }
    if (o.kind === "error") {
      errors.push({ noteId: lec.noteId, message: o.message });
      continue;
    }
    topics = mergeTopics(topics, o.topics);
    const kept = examPoints.filter((p) => p.noteId !== lec.noteId);
    kept.push(...o.examPoints);
    examPoints.length = 0;
    examPoints.push(...kept);
    updated[o.i] = { ...lec, status: "ingested", ingestedAt: new Date().toISOString() };
    ingested++;
  }

  if (ingested > 0) {
    await setTopics(courseId, topics);
    await setExamPoints(courseId, examPoints);
    await setLectures(courseId, updated);
  }
  return { topics, examPoints, lectureCount: lectures.length, ingested, skippedNoTranscript, errors };
}
