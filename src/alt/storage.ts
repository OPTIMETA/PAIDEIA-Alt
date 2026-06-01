// course:* storage repository (plan.md §6.1). zod 검증 + 스키마 버저닝.
// Alt 밖(프리뷰)에서는 인메모리 목으로 폴백 — UI 개발용 (보안 동작은 모사하지 않음).
import { z } from "zod";
import { alt, hasAltRuntime } from "@/alt/client";
import type { PluginStorageValue } from "alt-plugin-sdk";
import {
  SCHEMA_VERSION,
  courseIndexSchema,
  courseMetaSchema,
  examPointSchema,
  lectureSchema,
  topicSchema,
} from "@/lib/schemas";
import type { CourseMeta, ExamPoint, Lecture, StudySession, Topic } from "@/lib/schemas";

const memory = new Map<string, PluginStorageValue>();

// SDK pluginStorageKeySchema 와 동일 규칙. 프리뷰 목도 검증해 Alt와 동일하게 실패시킨다
// (AGENTS.md: 보안 동작을 '되는 것처럼' 목하지 말 것 → 키 규칙은 그대로 강제).
const KEY_RE = /^[a-zA-Z0-9._:-]+$/;
function assertKey(key: string): void {
  if (key.length > 160 || !KEY_RE.test(key)) {
    throw new Error(`Invalid storage key (must match ^[a-zA-Z0-9._:-]+$, ≤160): ${key}`);
  }
}

async function kvGet(key: string): Promise<PluginStorageValue | undefined> {
  assertKey(key);
  if (hasAltRuntime()) return alt.storage.get(key);
  return memory.get(key);
}

async function kvSet(key: string, value: PluginStorageValue): Promise<void> {
  assertKey(key);
  if (hasAltRuntime()) {
    await alt.storage.set(key, value);
    return;
  }
  memory.set(key, value);
}

/** 타입드 객체 → plain JSON(PluginStorageValue). 바이너리 불가, 중첩 OK. */
function toStorage(value: unknown): PluginStorageValue {
  return JSON.parse(JSON.stringify(value)) as PluginStorageValue;
}

const K = {
  index: "course:index",
  meta: (id: string) => `course:${id}:meta`,
  lectures: (id: string) => `course:${id}:lectures`,
  examPoints: (id: string) => `course:${id}:examPoints`,
  topics: (id: string) => `course:${id}:topics`,
  session: (id: string, ts: string) => `course:${id}:session:${ts}`,
};

// ── 코스 인덱스 ──
export async function listCourseIds(): Promise<string[]> {
  const parsed = courseIndexSchema.safeParse(await kvGet(K.index));
  return parsed.success ? parsed.data.ids : [];
}

export async function addCourseId(id: string): Promise<void> {
  const ids = await listCourseIds();
  if (!ids.includes(id)) ids.push(id);
  await kvSet(K.index, toStorage({ schemaVersion: SCHEMA_VERSION, ids }));
}

// ── 메타 ──
export async function getMeta(id: string): Promise<CourseMeta | null> {
  const parsed = courseMetaSchema.safeParse(await kvGet(K.meta(id)));
  return parsed.success ? parsed.data : null;
}

export async function setMeta(id: string, meta: CourseMeta): Promise<void> {
  await kvSet(K.meta(id), toStorage(meta));
}

// ── 강의 ──
export async function getLectures(id: string): Promise<Lecture[]> {
  const parsed = z.array(lectureSchema).safeParse(await kvGet(K.lectures(id)));
  return parsed.success ? parsed.data : [];
}

export async function setLectures(id: string, lectures: Lecture[]): Promise<void> {
  await kvSet(K.lectures(id), toStorage(lectures));
}

// ── 토픽 (2D 결정 맵 노드) ──
export async function getTopics(id: string): Promise<Topic[]> {
  const parsed = z.array(topicSchema).safeParse(await kvGet(K.topics(id)));
  return parsed.success ? parsed.data : [];
}

export async function setTopics(id: string, topics: Topic[]): Promise<void> {
  await kvSet(K.topics(id), toStorage(topics));
}

// ── examPoints (교수 발화 시험신호) ──
export async function getExamPoints(id: string): Promise<ExamPoint[]> {
  const parsed = z.array(examPointSchema).safeParse(await kvGet(K.examPoints(id)));
  return parsed.success ? parsed.data : [];
}

export async function setExamPoints(id: string, points: ExamPoint[]): Promise<void> {
  await kvSet(K.examPoints(id), toStorage(points));
}

// ── 작전지도 세션 ──
export async function saveSession(id: string, session: StudySession): Promise<void> {
  await kvSet(K.session(id, session.ts), toStorage(session));
}
