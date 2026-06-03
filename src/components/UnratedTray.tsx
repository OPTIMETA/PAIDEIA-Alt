// 미평가 트레이 (#5) — 새로 생성된(아직 분류 안 된) 노드를 오른쪽 패널에 모아둔다.
// 맵으로 드래그&드롭하면 드롭 높이가 자신감(Y)을 정하며 분류된다(맵의 onDrop 참조).
import type { Topic } from "@/lib/schemas";

export function UnratedTray({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) return null;
  const sorted = [...topics].sort((a, b) => b.examProb - a.examProb);
  return (
    <aside className="frost flex w-44 shrink-0 flex-col overflow-hidden rounded-xl border xl:w-52">
      <div className="shrink-0 border-b px-3 py-2.5">
        <p className="text-sm">미평가 {topics.length}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">지도로 끌어다 놓으면 분류돼요</p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
        {sorted.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", t.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className="cursor-grab rounded-lg border px-2.5 py-2 text-xs transition-colors hover:bg-[var(--cod-700)] active:cursor-grabbing"
            style={{ background: "var(--cod-900)" }}
            title="맵으로 드래그해 분류"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{t.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {Math.round(t.examProb * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
