// 프리뷰/데모 시드 — Alt 밖(브라우저)에서 맵·인터랙션을 확인하기 위한 가짜 코스.
// Alt 런타임에서는 실제 ingest(트랜스크립트 → 추출)가 이 자리를 대체한다.
import type { ExamPoint, Topic } from "@/lib/schemas";

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

// 교수 발화 시험신호 (plan.md §2.2) — 토픽 클릭 시 증거 드로어에 표시
export const demoExamPoints: ExamPoint[] = [
  { source: "transcript", quote: "대각화는 매 학기 시험에 반드시 나옵니다. 손으로 직접 해보세요.", noteId: 3, timestampMs: 754000, topicId: "t1", weight: 0.95 },
  { source: "transcript", quote: "여기 대각화 가능 조건, 이거 밑줄 치세요.", noteId: 5, timestampMs: 312000, topicId: "t1", weight: 0.8 },
  { source: "transcript", quote: "고유값 구하는 건 기본 중의 기본, 틀리면 안 됩니다.", noteId: 1, timestampMs: 1820000, topicId: "t2", weight: 0.7 },
  { source: "transcript", quote: "그람-슈미트는 계산이 길어서 시험에 잘 냅니다. 연습 많이 하세요.", noteId: 4, timestampMs: 2010000, topicId: "t3", weight: 0.85 },
  { source: "transcript", quote: "SVD는 올해 특히 강조합니다. 응용문제로 나올 거예요.", noteId: 5, timestampMs: 880000, topicId: "t5", weight: 0.9 },
  { source: "transcript", quote: "정사영의 기하적 의미를 묻는 문제를 좋아합니다.", noteId: 4, timestampMs: 1450000, topicId: "t4", weight: 0.6 },
  { source: "transcript", quote: "행렬식은 계산만 정확하면 됩니다. 비중은 크지 않아요.", noteId: 2, timestampMs: 640000, topicId: "t8", weight: 0.3 },
  { source: "transcript", quote: "크라메르 공식은 참고만, 시험엔 거의 안 냅니다.", noteId: 1, timestampMs: 2400000, topicId: "t12", weight: 0.15 },
  { source: "transcript", quote: "직교대각화, 이번에 새로 강조하는 부분입니다.", noteId: 6, timestampMs: 540000, topicId: "t14", weight: 0.7 },
];
