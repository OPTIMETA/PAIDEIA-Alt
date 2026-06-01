import { useCallback, useMemo, useState } from "react";
import { Activity, Database, Radar, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAltRuntime } from "@/alt/client";
import { listCourseIds } from "@/alt/storage";
import { runtimeSpike } from "@/alt/ai";
import { t } from "@/lib/i18n";

type SpikeResult = { modelCount: number; structuredModel: string | null };

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
    <main className="min-h-screen p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        {/* 글래스 상단바 (Shell) */}
        <header className="glass flex items-center justify-between gap-4 p-4">
          <div>
            <div className="flex items-center gap-2">
              <Radar className="size-5" />
              <h1 className="text-2xl font-extrabold">{t("app.title")}</h1>
              <span className="mono text-[10px] text-muted-foreground">by Optimeta</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("app.tagline")}</p>
          </div>
          <Badge variant={isAlt ? "default" : "secondary"}>
            {isAlt ? t("runtime.connected") : t("runtime.preview")}
          </Badge>
        </header>

        {/* 2D 결정 맵 미리보기 (Viz — Phase 2에서 d3 force로 교체) */}
        <Card className="brut">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="size-5" /> 2D 결정 맵 (미리보기)
            </CardTitle>
            <CardDescription>X=시험확률 · Y=자신감 — 골드존은 '지금', 함정존은 '버려도 안전'</CardDescription>
          </CardHeader>
          <CardContent>
            <QuadrantPreview />
          </CardContent>
        </Card>

        {/* 코스 / 런타임 스파이크 (Component — 브루탈) */}
        <section className="grid gap-4 md:grid-cols-2">
          <Card className="brut">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" /> 코스
              </CardTitle>
              <CardDescription>
                storage <span className="mono">course:*</span> (Phase 0 스캐폴드)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loaded ? (
                courses.length > 0 ? (
                  <ul className="text-sm">
                    {courses.map((c) => (
                      <li key={c} className="mono">
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
              <Button variant="secondary" className="brut-press" onClick={loadCourses}>
                {t("course.load")}
              </Button>
            </CardContent>
          </Card>

          <Card className="brut">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" /> 런타임 스파이크
              </CardTitle>
              <CardDescription>
                <span className="mono">models.list().supportsTools</span> — Alt 안에서만 의미
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {spike ? (
                <div className="space-y-1 text-sm">
                  <p>
                    모델 수: <span className="mono">{spike.modelCount}</span>
                  </p>
                  <p>
                    구조화 모델: <span className="mono">{spike.structuredModel ?? "—"}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isAlt ? t("spike.hint.alt") : t("spike.hint.preview")}
                </p>
              )}
              <Button
                variant="secondary"
                className="brut-press"
                onClick={runSpike}
                disabled={!isAlt}
              >
                {t("spike.run")}
              </Button>
            </CardContent>
          </Card>
        </section>

        {error ? <p className="mono text-xs text-destructive">{error}</p> : null}

        {/* 타이포그래피 스펙 (Pretendard Thin/Regular/ExtraBold · 자간 -5%) */}
        <Card className="brut">
          <CardHeader>
            <CardTitle>타이포그래피 — Pretendard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-4xl font-thin">D-7 · 자간 -5%</p>
            <p className="text-base font-normal">Regular — 본문/문제 텍스트. 유저는 수식 안 친다, 말한다.</p>
            <p className="text-lg font-extrabold">ExtraBold — 제목·라벨·브루탈 강조</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/** 정적 4분면 미리보기. Phase 2에서 d3 force + Lombardi 아크로 교체. */
function QuadrantPreview() {
  const nodes: { x: number; y: number; r: number; label: string; hot?: boolean }[] = [
    { x: 78, y: 26, r: 13, label: "대각화", hot: true },
    { x: 62, y: 40, r: 9, label: "그람슈미트" },
    { x: 30, y: 34, r: 7, label: "고유값" },
    { x: 24, y: 74, r: 6, label: "위상" },
    { x: 70, y: 78, r: 8, label: "일차독립" },
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-64 w-full" role="img" aria-label="2D 결정 맵 미리보기">
      <line x1="50" y1="4" x2="50" y2="96" stroke="var(--powder-500)" strokeWidth="0.4" strokeDasharray="2 2" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="var(--powder-500)" strokeWidth="0.4" strokeDasharray="2 2" />
      <text x="95" y="46" textAnchor="end" fontSize="3.2" fill="var(--powder-400)">시험확률 →</text>
      <text x="52" y="8" fontSize="3.2" fill="var(--powder-400)">자신감 ↑</text>
      {/* Lombardi 아크 (실선=직접, 점선=간접) */}
      <path d="M30 34 Q 55 20 78 26" fill="none" stroke="var(--powder-400)" strokeWidth="0.5" />
      <path d="M62 40 Q 71 32 78 26" fill="none" stroke="var(--powder-400)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
      {nodes.map((n) => (
        <g key={n.label}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="none"
            stroke={n.hot ? "var(--hot)" : "var(--powder-300)"}
            strokeWidth={n.hot ? 1.2 : 0.7}
          />
          <text x={n.x} y={n.y - n.r - 1.5} textAnchor="middle" fontSize="3" fill="var(--powder-200)">
            {n.label}
          </text>
        </g>
      ))}
      <text x="78" y="50" textAnchor="middle" fontSize="2.8" fill="var(--hot)">🔥 지금</text>
      <text x="24" y="92" textAnchor="middle" fontSize="2.8" fill="var(--powder-500)">⚠ 버려도 안전</text>
    </svg>
  );
}
