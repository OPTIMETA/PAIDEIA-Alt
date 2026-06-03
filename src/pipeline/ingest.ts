// 수집 파이프라인 (plan.md §6.2, Phase 1) — 강의 트랜스크립트 → 토픽 + 교수 발화 시험신호.
// generateObject(supportsTools 게이트) 사용. Alt 런타임에서만 동작(alt.ai 필요).
import { extractObject } from "@/alt/ai";
import { extractionSchema } from "@/lib/schemas";
import type { Extraction, ExamPoint, Topic } from "@/lib/schemas";
import type { PluginAiModelId } from "alt-plugin-sdk";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function topicId(name: string, index: number): string {
  return `t-${index}-${name.replace(/\s+/g, "-").slice(0, 24)}`;
}

function buildPrompt(transcript: string): string {
  return `너는 시험대비 분석가다. 아래 강의 트랜스크립트에서:
1) 핵심 토픽을 추출하고 각 토픽의 '시험 출제 확률' examProb(0~1)을 추정하라.
   교수가 반복·강조하거나 "시험에 나온다 / 여기 밑줄 / 이게 핵심"이라 말한 토픽일수록 높다.
2) 교수의 명시적 시험신호 발화(examPoints)를 인용으로 뽑아라. 각 항목: quote, topicName, timestampMs(없으면 null), weight(0~1).
새 내용을 생성하지 말고 트랜스크립트에 실제로 존재하는 것만 추출하라.

[트랜스크립트]
${transcript}`;
}

/** 단일 강의 트랜스크립트를 토픽/시험신호로 추출. 모델은 호출부에서 1회 선택해 주입(루프당 재선택 방지). */
export async function ingestTranscript(
  transcript: string,
  noteId: number,
  model: PluginAiModelId,
): Promise<{ topics: Topic[]; examPoints: ExamPoint[] }> {
  const ex: Extraction = await extractObject(extractionSchema, buildPrompt(transcript), model);

  const topics: Topic[] = ex.topics.map((tp, i) => ({
    id: topicId(tp.name, i),
    name: tp.name,
    examProb: clamp01(tp.examProb),
    confidence: null,
    triage: "unrated",
    posOverride: null,
    appearsInNoteIds: [noteId],
  }));

  const examPoints: ExamPoint[] = ex.examPoints.map((p) => ({
    source: "transcript",
    quote: p.quote,
    noteId,
    timestampMs: p.timestampMs,
    topicId: topics.find((tt) => tt.name === p.topicName)?.id ?? "",
    weight: clamp01(p.weight),
  }));

  return { topics, examPoints };
}

/**
 * 강의 누적 재랭킹 (plan §2.1 C): 같은 토픽이 여러 강의에 반복 등장하면
 * examProb를 위로 끌어올리고(noisy-OR류) appearsInNoteIds를 합집합한다.
 * 사용자가 설정한 confidence/posOverride는 보존.
 */
export function mergeTopics(existing: Topic[], incoming: Topic[]): Topic[] {
  const byName = new Map(existing.map((tt) => [tt.name, { ...tt }]));
  for (const inc of incoming) {
    const cur = byName.get(inc.name);
    if (!cur) {
      byName.set(inc.name, inc);
      continue;
    }
    cur.examProb = clamp01(1 - (1 - cur.examProb) * (1 - inc.examProb * 0.6));
    cur.appearsInNoteIds = Array.from(new Set([...cur.appearsInNoteIds, ...inc.appearsInNoteIds]));
  }
  return Array.from(byName.values());
}
