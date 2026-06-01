import { useCallback, useMemo, useState } from "react";
import { Activity, Database, Map as MapIcon, Radar, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAltRuntime } from "@/alt/client";
import { listCourseIds } from "@/alt/storage";
import { runtimeSpike } from "@/alt/ai";
import { t } from "@/lib/i18n";

type SpikeResult = { modelCount: number; structuredModel: string | null };

const NAV: { icon: typeof Radar; label: string; active?: boolean }[] = [
  { icon: Radar, label: "Radar", active: true },
  { icon: Scissors, label: "오늘의 컷" },
  { icon: MapIcon, label: "작전지도" },
];

export default function App() {
  const isAlt = useMemo(() => hasAltRuntime(), []);
  const [courses, setCourses] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [spike, setSpike] = useState<SpikeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setCourses(await listCourseIds());
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const runSpike = useCallback(async () => {
    try {
      const r = await runtimeSpike();
      setSpike({ modelCount: r.models.length, structuredModel: r.structuredModel });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── 사이드바 (반투명 머티리얼) ── */}
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
                className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
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

      {/* ── 디테일 ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 탑바 (반투명) */}
        <header className="glass flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="text-sm text-muted-foreground">선형대수</span>
            <span className="text-3xl font-semibold tabular-nums tracking-tight">D-7</span>
          </div>
          <Button size="sm">작전지도</Button>
        </header>

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <p className="text-sm text-muted-foreground">{t("app.tagline")}</p>

            {/* 2D 결정 맵 (hero) */}
            <Card className="frost">
              <CardHeader>
                <CardTitle className="text-base">2D 결정 맵</CardTitle>
                <CardDescription>
                  X = 시험확률 · Y = 자신감 — 골드존은 '지금', 함정존은 '버려도 안전'
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuadrantPreview />
              </CardContent>
            </Card>

            <section className="grid gap-4 md:grid-cols-2">
              <Card className="frost">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="size-4 text-muted-foreground" /> 코스
                  </CardTitle>
                  <CardDescription>
                    storage <span className="mono">course:*</span> · Phase 0
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loaded ? (
                    courses.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {courses.map((c) => (
                          <li key={c} className="mono text-fg-300">
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("course.empty")}</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">아직 로드 안 함.</p>
                  )}
                  <Button variant="secondary" size="sm" onClick={loadCourses}>
                    {t("course.load")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="frost">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="size-4 text-muted-foreground" /> 런타임 스파이크
                  </CardTitle>
                  <CardDescription>
                    <span className="mono">models.list().supportsTools</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {spike ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        모델 수 <span className="mono text-foreground">{spike.modelCount}</span>
                      </p>
                      <p className="text-muted-foreground">
                        구조화 모델{" "}
                        <span className="mono text-foreground">{spike.structuredModel ?? "—"}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isAlt ? t("spike.hint.alt") : t("spike.hint.preview")}
                    </p>
                  )}
                  <Button variant="secondary" size="sm" onClick={runSpike} disabled={!isAlt}>
                    {t("spike.run")}
                  </Button>
                </CardContent>
              </Card>
            </section>

            {error ? <p className="mono text-xs text-destructive">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 정적 4분면 미리보기. Phase 2에서 d3 force + Lombardi 아크로 교체. */
function QuadrantPreview() {
  const nodes: { x: number; y: number; r: number; label: string; hot?: boolean }[] = [
    { x: 78, y: 26, r: 12, label: "대각화", hot: true },
    { x: 62, y: 40, r: 9, label: "그람슈미트" },
    { x: 30, y: 34, r: 7, label: "고유값" },
    { x: 24, y: 74, r: 6, label: "위상" },
    { x: 70, y: 78, r: 8, label: "일차독립" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-64 w-full" role="img" aria-label="2D 결정 맵 미리보기">
      <line x1="50" y1="6" x2="50" y2="94" stroke="var(--line-strong)" strokeWidth="0.3" />
      <line x1="6" y1="50" x2="94" y2="50" stroke="var(--line-strong)" strokeWidth="0.3" />
      <text x="93" y="46" textAnchor="end" fontSize="3" fill="var(--fg-700)">
        시험확률 →
      </text>
      <text x="52" y="9" fontSize="3" fill="var(--fg-700)">
        자신감 ↑
      </text>
      {/* Lombardi 아크 (실선=직접, 점선=간접) */}
      <path d="M30 34 Q 55 20 78 26" fill="none" stroke="var(--fg-700)" strokeWidth="0.4" />
      <path
        d="M62 40 Q 71 32 78 26"
        fill="none"
        stroke="var(--fg-700)"
        strokeWidth="0.4"
        strokeDasharray="1.5 1.5"
      />
      {nodes.map((n) => (
        <g key={n.label}>
          {n.hot ? (
            <circle cx={n.x} cy={n.y} r={n.r + 3} fill="var(--accent-soft)" />
          ) : null}
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="none"
            stroke={n.hot ? "var(--accent-1)" : "var(--line-strong)"}
            strokeWidth={n.hot ? 1 : 0.6}
          />
          <text x={n.x} y={n.y - n.r - 1.5} textAnchor="middle" fontSize="2.8" fill="var(--fg-300)">
            {n.label}
          </text>
        </g>
      ))}
      <text x="78" y="49" textAnchor="middle" fontSize="2.6" fill="var(--accent-1)">
        지금
      </text>
      <text x="24" y="92" textAnchor="middle" fontSize="2.6" fill="var(--fg-700)">
        버려도 안전
      </text>
    </svg>
  );
}
