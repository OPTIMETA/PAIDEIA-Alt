import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Map as MapIcon, Radar, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecisionMap } from "@/viz/DecisionMap";
import { TriageSession } from "@/flows/TriageSession";
import { hasAltRuntime } from "@/alt/client";
import { getTopics, setTopics as saveTopics } from "@/alt/storage";
import { runtimeSpike } from "@/alt/ai";
import { dDay, triageFor } from "@/lib/triage";
import { t } from "@/lib/i18n";
import { DEMO_COURSE_ID, DEMO_COURSE_NAME, DEMO_EXAM_DATE, demoTopics } from "@/lib/demo";
import type { Topic } from "@/lib/schemas";

const NAV: { icon: typeof Radar; label: string; active?: boolean }[] = [
  { icon: Radar, label: "Radar", active: true },
  { icon: Scissors, label: "오늘의 컷" },
  { icon: MapIcon, label: "작전지도" },
];

export default function App() {
  const isAlt = useMemo(() => hasAltRuntime(), []);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [spike, setSpike] = useState<string | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const courseId = DEMO_COURSE_ID;

  useEffect(() => {
    let alive = true;
    void (async () => {
      let loaded = await getTopics(courseId);
      // 프리뷰(Alt 밖): 데모 시드로 맵을 채워 인터랙션을 확인
      if (loaded.length === 0 && !hasAltRuntime()) {
        loaded = demoTopics;
        await saveTopics(courseId, loaded);
      }
      if (alive) setTopics(loaded);
    })();
    return () => {
      alive = false;
    };
  }, [courseId]);

  // 드래그 재조정 = preference override → triage 재계산 + 영속
  const handleChange = useCallback(
    (id: string, patch: { examProb: number; confidence: number | null }) => {
      setTopics((prev) => {
        const next = prev.map((tp) =>
          tp.id === id
            ? {
                ...tp,
                examProb: patch.examProb,
                confidence: patch.confidence,
                triage: triageFor(patch.examProb, patch.confidence),
              }
            : tp,
        );
        void saveTopics(courseId, next);
        return next;
      });
    },
    [courseId],
  );

  // 오늘의 컷: 한 번의 선택 = 자신감 + triage
  const handleRate = useCallback(
    (id: string, confidence: number) => {
      setTopics((prev) => {
        const next = prev.map((tp) =>
          tp.id === id ? { ...tp, confidence, triage: triageFor(tp.examProb, confidence) } : tp,
        );
        void saveTopics(courseId, next);
        return next;
      });
    },
    [courseId],
  );

  const handleDrop = useCallback(
    (id: string) => {
      setTopics((prev) => {
        const next = prev.map((tp) => (tp.id === id ? { ...tp, triage: "drop" as const } : tp));
        void saveTopics(courseId, next);
        return next;
      });
    },
    [courseId],
  );

  const runSpike = useCallback(async () => {
    try {
      const r = await runtimeSpike();
      setSpike(`models ${r.models.length} · tooled ${r.structuredModel ?? "—"}`);
    } catch (e) {
      setSpike(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const goldCount = topics.filter((tp) => tp.triage === "gold").length;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 */}
      <aside className="glass flex w-60 shrink-0 flex-col justify-between border-r p-4">
        <div className="space-y-7">
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-8 place-items-center rounded-lg"
              style={{ background: "var(--accent-soft)" }}
            >
              <Radar className="size-4" style={{ color: "var(--accent-1)" }} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold">{t("app.title")}</p>
              <p className="text-[11px] text-muted-foreground">by Optimeta</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <div
                key={item.label}
                onClick={() => item.label === "오늘의 컷" && setSessionOpen(true)}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
                style={
                  item.active
                    ? { background: "var(--accent-soft)", color: "var(--accent-1)" }
                    : { color: "var(--fg-500)" }
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <Badge variant={isAlt ? "default" : "secondary"} className="w-fit">
          {isAlt ? t("runtime.connected") : t("runtime.preview")}
        </Badge>
      </aside>

      {/* 디테일 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="text-sm text-muted-foreground">{DEMO_COURSE_NAME}</span>
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {dDay(DEMO_EXAM_DATE)}
            </span>
            <span className="text-xs text-muted-foreground">
              {topics.length} 토픽 · 골드존 {goldCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={runSpike} disabled={!isAlt}>
              <Activity className="size-4" /> 스파이크
            </Button>
            <Button size="sm" onClick={() => setSessionOpen(true)}>
              <Scissors className="size-4" /> 오늘의 컷
            </Button>
          </div>
        </header>

        {/* 큰 결정 맵 (hero) */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="frost relative h-full w-full overflow-hidden rounded-xl border">
            <DecisionMap topics={topics} onChange={handleChange} />
            {topics.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <p className="text-sm text-muted-foreground">강의를 연결하면 토픽이 채워집니다.</p>
              </div>
            ) : null}
            {sessionOpen ? (
              <TriageSession
                topics={topics.filter((tp) => tp.triage !== "drop")}
                onRate={handleRate}
                onDrop={handleDrop}
                onClose={() => setSessionOpen(false)}
              />
            ) : null}
          </div>
        </div>

        {spike ? <p className="mono px-6 pb-2 text-xs text-muted-foreground">{spike}</p> : null}
      </div>
    </div>
  );
}
