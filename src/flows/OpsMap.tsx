// 작전지도 (plan.md §3.5 출력) — triage 결과 1페이지: 지금 할 것(골드존) · 버린 것 · 절약 시간.
// 복사(공유) + PAIDEIA 전환 CTA.
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dDay } from "@/lib/triage";
import type { Topic } from "@/lib/schemas";

export function OpsMap({
  topics,
  cut,
  savedMin,
  examDate,
  courseName,
  onClose,
}: {
  topics: Topic[];
  cut: ReadonlySet<string>;
  savedMin: number;
  examDate: string | null;
  courseName: string;
  onClose: () => void;
}) {
  const now = topics
    .filter((t) => t.triage === "gold" && !cut.has(t.id))
    .sort((a, b) => b.examProb - a.examProb);
  const dropped = topics.filter((t) => cut.has(t.id) || t.triage === "trap");

  const summary = [
    `[${courseName} · ${dDay(examDate)}] Exam Radar 작전지도`,
    ``,
    `지금 할 것 (골드존):`,
    ...now.map((t) => `· ${t.name} — 시험확률 ${Math.round(t.examProb * 100)}%`),
    ``,
    `버려도 안전: ${dropped.map((t) => t.name).join(", ") || "—"}`,
    `절약: 약 ${savedMin}분`,
    ``,
    `— Optimeta PAIDEIA`,
  ].join("\n");

  const copy = () => {
    void navigator.clipboard?.writeText(summary);
  };

  return (
    <div className="absolute inset-0 z-30 grid place-items-center p-4">
      <div className="glass absolute inset-0" />
      <div className="frost relative max-h-[88%] w-[min(94%,560px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              작전지도 · {courseName} · {dDay(examDate)}
            </p>
            <p className="text-xl font-normal">지금 이걸 해라</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-5 space-y-2">
          {now.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              골드존이 비었습니다. 오늘의 컷으로 분류하세요.
            </p>
          ) : (
            now.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="mono text-sm font-normal" style={{ color: "var(--accent-1)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-normal">{t.name}</span>
                <span className="text-xs text-muted-foreground">{Math.round(t.examProb * 100)}%</span>
              </div>
            ))
          )}
        </div>

        <div className="mb-5 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <span className="font-normal text-foreground">버려도 안전</span> · {dropped.length}개 · 절약 약{" "}
          {savedMin}분
          <p className="mt-1 line-clamp-2">{dropped.map((t) => t.name).join(", ") || "—"}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" onClick={copy}>
            <Copy className="size-4" /> 복사
          </Button>
          <Button size="sm" onClick={onClose}>
            맵으로
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          더 깊은 드릴·채점·반복은 PAIDEIA Study OS에서
        </p>
      </div>
    </div>
  );
}
