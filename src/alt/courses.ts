// 코스 repository (plan.md §3, §6.1) — 멀티코스 목록·생성·시드.
import {
  addCourseId,
  getLectures,
  getMeta,
  listCourseIds,
  purgeCourse,
  setExamPoints,
  setLectures,
  setMeta,
  setTopics,
} from "@/alt/storage";
import { SCHEMA_VERSION } from "@/lib/schemas";
import type { CourseMeta, Lecture } from "@/lib/schemas";
import {
  DEMO_COURSE_ID,
  DEMO_COURSE_NAME,
  DEMO_EXAM_DATE,
  demoExamPoints,
  demoTopics,
} from "@/lib/demo";

export type CourseRef = { id: string; meta: CourseMeta };

export async function listCourses(): Promise<CourseRef[]> {
  const ids = await listCourseIds();
  const out: CourseRef[] = [];
  for (const id of ids) {
    const meta = await getMeta(id);
    if (meta) out.push({ id, meta });
  }
  return out;
}

function slug(name: string): string {
  // ⚠️ id는 storage 키(course:<id>:meta)에 들어간다. 키 규칙은 ^[a-zA-Z0-9._:-]+$ 뿐이라
  // 한글 등 비-ASCII가 들어가면 alt.storage.set이 throw한다 → id는 반드시 ASCII-safe.
  const ascii = name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `c-${ascii || "course"}-${Date.now().toString(36)}`;
}

export async function createCourse(
  name: string,
  examDate: string | null,
  lectures: Lecture[] = [],
  lang = "ko",
): Promise<string> {
  const id = slug(name);
  await addCourseId(id);
  await setMeta(id, { schemaVersion: SCHEMA_VERSION, name, examDate, lang });
  if (lectures.length > 0) await setLectures(id, lectures);
  return id;
}

/** 기존 코스에 강의 노트를 추가(노트가 나중에 생겨도 재임포트 가능). noteId 기준 중복 제거. */
export async function addLectures(courseId: string, incoming: Lecture[]): Promise<Lecture[]> {
  const existing = await getLectures(courseId);
  const have = new Set(existing.map((l) => l.noteId));
  const merged = [...existing, ...incoming.filter((l) => !have.has(l.noteId))];
  await setLectures(courseId, merged);
  return merged;
}

/** 코스명·시험일 수정. id는 storage 키라 불변 — 메타만 갱신한다. */
export async function updateCourseMeta(
  id: string,
  patch: { name?: string; examDate?: string | null },
): Promise<void> {
  const meta = await getMeta(id);
  if (!meta) return;
  await setMeta(id, { ...meta, ...patch });
}

/**
 * 코스 삭제 — Exam Radar에서 이 코스 항목과 파생 데이터만 제거(되돌릴 수 없음).
 * Alt의 강의 녹음·전사는 그대로 남는다.
 */
export async function deleteCourse(id: string): Promise<void> {
  await purgeCourse(id);
}

/** 코스가 하나도 없으면 데모(선형대수)를 시드하고 그 id를 반환. */
export async function ensureSeedCourse(): Promise<void> {
  const ids = await listCourseIds();
  if (ids.length > 0) return;
  await addCourseId(DEMO_COURSE_ID);
  await setMeta(DEMO_COURSE_ID, {
    schemaVersion: SCHEMA_VERSION,
    name: DEMO_COURSE_NAME,
    examDate: DEMO_EXAM_DATE,
    lang: "ko",
  });
  await setTopics(DEMO_COURSE_ID, demoTopics);
  await setExamPoints(DEMO_COURSE_ID, demoExamPoints);
}
