import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 폰트 self-host (CDN 금지 — 샌드박스). DM Sans = Latin(NODEPROMPT 형식), Pretendard = 한글 폴백.
import "@fontsource/dm-sans/300.css";
import "@fontsource/dm-sans/400.css";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";
import App from "./App.tsx";
import { initLocale } from "@/lib/i18n";

// host 언어를 먼저 감지한 뒤 렌더 (실패해도 기본값으로 렌더).
void initLocale().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
