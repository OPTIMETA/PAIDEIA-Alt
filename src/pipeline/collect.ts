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

/** 코스의 미수집(pending) 강의들을 수집. noteId 지정 시 그 노트만(transcriptUpdated 대응). */
export async function collectCourse(courseId: string, onlyNoteId?: number): Promise<CollectResult> {
  if (!hasAltRuntime()) throw new Error("Alt 런타임에서만 수집할 수 있습니다.");

  const lectures = await getLectures(courseId);
  let topics = await getTopics(courseId);
  const examPoints = await getExamPoints(courseId);
  const updated = [...lectures];
  let ingested = 0;
  let skippedNoTranscript = 0;
  const errors: { noteId: number; message: string }[] = [];

  for (let i = 0; i < updated.length; i++) {
    const lec = updated[i];
    if (onlyNoteId != null && lec.noteId !== onlyNoteId) continue;
    if (onlyNoteId == null && lec.status === "ingested") continue;
    try {
      const content = await alt.notes.getContent(lec.noteId);
      const transcript = content.transcript ?? "";
      if (!transcript.trim()) {
        skippedNoTranscript++;
        continue;
      }
      const res = await ingestTranscript(transcript, lec.noteId);
      topics = mergeTopics(topics, res.topics);
      // 같은 노트 재수집 시 중복 방지: 해당 noteId의 기존 examPoint 제거 후 추가
      const kept = examPoints.filter((p) => p.noteId !== lec.noteId);
      kept.push(...res.examPoints);
      examPoints.length = 0;
      examPoints.push(...kept);
      updated[i] = { ...lec, status: "ingested", ingestedAt: new Date().toISOString() };
      ingested++;
    } catch (e) {
      // 삼키지 않고 기록 → 호출부가 사용자에게 표시
      errors.push({ noteId: lec.noteId, message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (ingested > 0) {
    await setTopics(courseId, topics);
    await setExamPoints(courseId, examPoints);
    await setLectures(courseId, updated);
  }
  return {
    topics,
    examPoints,
    lectureCount: lectures.length,
    ingested,
    skippedNoTranscript,
    errors,
  };
}
