// 키 기반 i18n 스캐폴드 (plan.md §10, Phase 0). 번역은 Phase 4에서 채움.
// alt.locale은 SDK에 없음 → navigator.language로 감지 (Alt webview·프리뷰 공통).
type Dict = Record<string, string>;

const ko: Dict = {
  "app.title": "Exam Radar",
  "app.tagline": "공부 적게, 점수 더 — 무엇을 버릴지부터 정하라",
  "runtime.connected": "Alt 런타임 연결됨",
  "runtime.preview": "로컬 브라우저 프리뷰",
  "course.empty": "아직 코스가 없습니다. 강의 녹음을 연결해 시작하세요.",
  "course.load": "코스 로드",
  "spike.run": "스파이크 실행",
  "spike.hint.alt": "실행해서 supportsTools를 확인",
  "spike.hint.preview": "Alt 런타임에서 실행하세요",
};

const en: Dict = {
  "app.title": "Exam Radar",
  "app.tagline": "Study less, score more — decide what to cut first",
  "runtime.connected": "Alt runtime connected",
  "runtime.preview": "Local browser preview",
  "course.empty": "No course yet. Connect a lecture recording to start.",
  "course.load": "Load courses",
  "spike.run": "Run spike",
  "spike.hint.alt": "Run to check supportsTools",
  "spike.hint.preview": "Run inside the Alt runtime",
};

const lang: "ko" | "en" =
  typeof navigator !== "undefined" && navigator.language.startsWith("en") ? "en" : "ko";

const dict: Dict = lang === "en" ? en : ko;

export function t(key: string): string {
  return dict[key] ?? ko[key] ?? key;
}
