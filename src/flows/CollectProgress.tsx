// 수집 진행 팝업 — '만들기' 직후 자동 수집 시 가운데에 떠서 노드 생성 진행률을 보여준다.
// total=0(준비 단계)이면 비결정 바, 이후 done/total 결정 바.
export function CollectProgress({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="absolute inset-0 z-50 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" />
      <div className="frost anim-panel relative w-[min(92%,420px)] rounded-2xl border p-6 text-center">
        <p className="text-xs text-muted-foreground">수집</p>
        <p className="mt-1 text-xl font-normal">노드 생성 중…</p>

        <div
          className="mt-5 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--cod-700)" }}
        >
          {total > 0 ? (
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%`, background: "var(--accent-1)" }}
            />
          ) : (
            <div className="h-full w-1/3 animate-pulse rounded-full" style={{ background: "var(--accent-1)" }} />
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {label}
          {total > 0 ? ` · ${pct}%` : ""}
        </p>
      </div>
    </div>
  );
}
