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

async function kvDelete(key: string): Promise<void> {
  assertKey(key);
  if (hasAltRuntime()) {
    await alt.storage.delete(key);
    return;
  }
  memory.delete(key);
}

// 전체 키 열거 — course:<id>:* 일괄 삭제(코스 정리)에 사용.
async function kvKeys(): Promise<string[]> {
  if (hasAltRuntime()) return Object.keys(await alt.storage.list());
  return [...memory.keys()];
}

/** 타입드 객체 → plain JSON(PluginStorageValue). 바이너리 불가, 중첩 OK. */
function toStorage(value: unknown): PluginStorageValue {
  return JSON.parse(JSON.stringify(value)) as PluginStorageValue;
}

// 코스 비종속 UI 플래그(ui:*) — 온보딩 1회 표시 등
export async function getUiFlag(key: string): Promise<boolean> {
  return (await kvGet(`ui:${key}`)) === true;
}
export async function setUiFlag(key: string, value: boolean): Promise<void> {
  await kvSet(`ui:${key}`, value);
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

export async function removeCourseId(id: string): Promise<void> {
  const ids = (await listCourseIds()).filter((x) => x !== id);
  await kvSet(K.index, toStorage({ schemaVersion: SCHEMA_VERSION, ids }));
}

/**
 * 코스 정리 — 플러그인 저장소의 course:<id>:* (메타·강의 연결·토픽·시험신호·세션)만
 * 지우고 인덱스에서 뺀다. Alt의 노트(강의 녹음·전사)는 건드리지 않는다:
 * 이 플러그인엔 notes 쓰기 권한이 없고, noteId 참조만 보관하므로 그 참조만 사라진다.
 */
export async function purgeCourse(id: string): Promise<void> {
  const prefix = `course:${id}:`;
  for (const key of await kvKeys()) {
    if (key.startsWith(prefix)) await kvDelete(key);
  }
  await removeCourseId(id);
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

// ── 학습 로드맵 세션 ──
export async function saveSession(id: string, session: StudySession): Promise<void> {
  await kvSet(K.session(id, session.ts), toStorage(session));
}
