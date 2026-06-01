// Alt SDK 경계 가드 (plan.md §10 — window.alt 가드 + 로컬 프리뷰 목).
// 모든 호스트 호출은 이 모듈을 통해 런타임 유무를 확인한 뒤 수행한다.
export { alt } from "alt-plugin-sdk";

/** Alt 런타임(window.alt) 존재 여부. 없으면 로컬 브라우저 프리뷰. */
export function hasAltRuntime(): boolean {
  return typeof window !== "undefined" && "alt" in window;
}
