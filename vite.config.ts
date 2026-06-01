import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // 상대경로 에셋 — Alt는 dist/index.html을 alt-plugin:// 프로토콜로 로드하므로
  // 절대경로(/assets/…)는 해석되지 않아 흰 화면이 된다. ./assets/… 로 강제.
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
