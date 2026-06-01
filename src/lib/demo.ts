// 프리뷰/데모 시드 — Alt 밖(브라우저)에서 맵·인터랙션을 확인하기 위한 가짜 코스.
// Alt 런타임에서는 실제 ingest(트랜스크립트 → 추출)가 이 자리를 대체한다.
import type { Topic } from "@/lib/schemas";

export const DEMO_COURSE_ID = "demo-linear-algebra";
export const DEMO_COURSE_NAME = "선형대수";
export const DEMO_EXAM_DATE = "2026-06-09"; // D-7 기준(today 2026-06-02)

// examProb(X, 0~1) · confidence(Y, 0~3 | null=미평가) · appearsInNoteIds(아크 연결)
export const demoTopics: Topic[] = [
  { id: "t1", name: "대각화", examProb: 0.93, confidence: 1, triage: "gold", posOverride: null, appearsInNoteIds: [1, 3, 5] },
  { id: "t2", name: "고유값·고유벡터", examProb: 0.86, confidence: 2, triage: "keep", posOverride: null, appearsInNoteIds: [1, 3] },
  { id: "t3", name: "그람-슈미트", examProb: 0.72, confidence: 0, triage: "gold", posOverride: null, appearsInNoteIds: [4, 5] },
  { id: "t4", name: "정사영", examProb: 0.64, confidence: 1, triage: "gold", posOverride: null, appearsInNoteIds: [4] },
  { id: "t5", name: "특이값분해(SVD)", examProb: 0.81, confidence: 0, triage: "gold", posOverride: null, appearsInNoteIds: [5, 6] },
  { id: "t6", name: "선형변환", examProb: 0.58, confidence: 2, triage: "keep", posOverride: null, appearsInNoteIds: [2, 3] },
  { id: "t7", name: "기저·차원", examProb: 0.55, confidence: 3, triage: "safe", posOverride: null, appearsInNoteIds: [2] },
  { id: "t8", name: "행렬식", examProb: 0.42, confidence: 3, triage: "safe", posOverride: null, appearsInNoteIds: [1, 2] },
  { id: "t9", name: "일차독립", examProb: 0.38, confidence: 2, triage: "safe", posOverride: null, appearsInNoteIds: [2] },
  { id: "t10", name: "내적공간", examProb: 0.49, confidence: 1, triage: "keep", posOverride: null, appearsInNoteIds: [4] },
  { id: "t11", name: "여인수 전개", examProb: 0.21, confidence: 0, triage: "trap", posOverride: null, appearsInNoteIds: [1] },
  { id: "t12", name: "크라메르 공식", examProb: 0.18, confidence: 1, triage: "trap", posOverride: null, appearsInNoteIds: [1] },
  { id: "t13", name: "선형연립방정식", examProb: 0.62, confidence: null, triage: "unrated", posOverride: null, appearsInNoteIds: [6] },
  { id: "t14", name: "직교대각화", examProb: 0.7, confidence: null, triage: "unrated", posOverride: null, appearsInNoteIds: [5, 6] },
];
