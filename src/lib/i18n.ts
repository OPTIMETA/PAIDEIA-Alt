// 키 기반 i18n (plan.md §10). host UI 언어를 alt.settings.get("language")로 감지(정규 패턴,
// alt-quiz-plugin 참고). 프리뷰(Alt 밖)는 navigator.language 폴백. 번역은 점진 확장.
import { alt, hasAltRuntime } from "@/alt/client";

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

let lang: "ko" | "en" = "ko";

function resolve(lc: string | null | undefined): "ko" | "en" {
  return lc && lc.toLowerCase().startsWith("en") ? "en" : "ko";
}

/** host 언어 감지. Alt: settings("language"), 프리뷰: navigator. main.tsx에서 렌더 전 호출. */
export async function initLocale(): Promise<void> {
  if (hasAltRuntime()) {
    try {
      const v = await alt.settings.get("language");
      lang = resolve(typeof v === "string" ? v : null);
      return;
    } catch {
      /* 호스트 없음/실패 → navigator 폴백 */
    }
  }
  if (typeof navigator !== "undefined") lang = resolve(navigator.language);
}

export function t(key: string): string {
  const dict = lang === "en" ? en : ko;
  return dict[key] ?? ko[key] ?? key;
}
