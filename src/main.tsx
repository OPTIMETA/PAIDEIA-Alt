import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Pretendard self-host (CDN 금지 — 샌드박스). dynamic-subset: 필요한 글리프만 로드.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
