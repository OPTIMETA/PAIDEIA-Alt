import { z } from "zod";

/** storage 스키마 버전 — 모든 구조화 값에 부착 (plan.md §6.1, 마이그레이션 대비) */
export const SCHEMA_VERSION = 1;

export const courseIndexSchema = z.object({
  schemaVersion: z.number().int(),
  ids: z.array(z.string()),
});
export type CourseIndex = z.infer<typeof courseIndexSchema>;

export const courseMetaSchema = z.object({
  schemaVersion: z.number().int(),
  name: z.string(),
  examDate: z.string().nullable(), // ISO date or null
  lang: z.string().default("ko"),
});
export type CourseMeta = z.infer<typeof courseMetaSchema>;

export const lectureSchema = z.object({
  noteId: z.number(),
  title: z.string(),
  status: z.enum(["pending", "ingested"]),
  ingestedAt: z.string().nullable().default(null),
});
export type Lecture = z.infer<typeof lectureSchema>;

/** 교수 발화 시험신호 (plan.md §2.2 / §6.1) */
export const examPointSchema = z.object({
  source: z.literal("transcript"),
  quote: z.string(),
  noteId: z.number(),
  timestampMs: z.number().nullable(),
  topicId: z.string(),
  weight: z.number().min(0).max(1),
});
export type ExamPoint = z.infer<typeof examPointSchema>;

/** triage 상태 — 4분면 + 보조 (plan.md §3.1) */
export const triageStateSchema = z.enum([
  "gold", // 시험확률 높음 × 자신감 낮음 = 지금 당장
  "keep", // 유지만
  "safe", // 이미 안전
  "trap", // 버려도 안전 (함정존)
  "later",
  "drop",
  "unrated",
]);
export type TriageState = z.infer<typeof triageStateSchema>;

export const topicSchema = z.object({
  id: z.string(),
  name: z.string(),
  examProb: z.number().min(0).max(1), // X축
  confidence: z.number().int().min(0).max(3).nullable(), // Y축, null = 미평가
  triage: triageStateSchema.default("unrated"),
  posOverride: z
    .object({ x: z.number(), y: z.number() })
    .nullable()
    .default(null), // 드래그 재조정 (preference override)
  appearsInNoteIds: z.array(z.number()).default([]),
});
export type Topic = z.infer<typeof topicSchema>;

/** 작전지도 = triage 세션 출력 (plan.md §3.5) */
export const studySessionSchema = z.object({
  ts: z.string(),
  budgetMin: z.number().nullable(),
  goldTopicIds: z.array(z.string()),
  droppedTopicIds: z.array(z.string()),
  savedMin: z.number(),
  planMd: z.string(),
});
export type StudySession = z.infer<typeof studySessionSchema>;

/** AI 추출용 — 강의 transcript → topics + examPoints (plan.md §6.2) */
export const extractionSchema = z.object({
  topics: z.array(
    z.object({
      name: z.string(),
      examProb: z.number().min(0).max(1),
    }),
  ),
  examPoints: z.array(
    z.object({
      quote: z.string(),
      topicName: z.string(),
      timestampMs: z.number().nullable(),
      weight: z.number().min(0).max(1),
    }),
  ),
});
export type Extraction = z.infer<typeof extractionSchema>;
