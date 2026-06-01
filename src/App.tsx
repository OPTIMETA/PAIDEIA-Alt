import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Eye, Plus, Radar, Scissors, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecisionMap } from "@/viz/DecisionMap";
import { TriageSession } from "@/flows/TriageSession";
import { OpsMap } from "@/flows/OpsMap";
import { NewCourse } from "@/flows/NewCourse";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { alt, hasAltRuntime } from "@/alt/client";
import {
  getExamPoints,
  getTopics,
  setExamPoints as saveExamPoints,
  setTopics as saveTopics,
} from "@/alt/storage";
import { createCourse, ensureSeedCourse, listCourses, type CourseRef } from "@/alt/courses";
import { collectCourse } from "@/pipeline/collect";
import { mergeTopics } from "@/pipeline/ingest";
import { runtimeSpike } from "@/alt/ai";
import { budgetCut, totalCostMin } from "@/lib/budget";
import { dDay, triageFor } from "@/lib/triage";
import { t } from "@/lib/i18n";
import { demoExtraExamPoints, demoExtraTopics } from "@/lib/demo";
import type { ExamPoint, Lecture, Topic } from "@/lib/schemas";

export default function App() {
  const isAlt = useMemo(() => hasAltRuntime(), []);
  const [courses, setCourses] = useState<CourseRef[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [examPoints, setExamPoints] = useState<ExamPoint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [budget, setBudget] = useState<number | null>(null);
  const [spike, setSpike] = useState<string | null>(null);
  const [gapMode, setGapMode] = useState(false);
  const [growth, setGrowth] = useState<string | null>(null);

  // 코스 목록 로드 (없으면 데모 시드)
  useEffect(() => {
    let alive = true;
    void (async () => {
      await ensureSeedCourse();
      const cs = await listCourses();
      if (!alive) return;
      setCourses(cs);
      setActiveId((cur) => cur ?? cs[0]?.id ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 활성 코스 데이터 로드
  useEffect(() => {
    if (!activeId) return;
    let alive = true;
    void (async () => {
      const tp = await getTopics(activeId);
      const ep = await getExamPoints(activeId);
      if (!alive) return;
      setTopics(tp);
      setExamPoints(ep);
      setSelectedId(null);
      setBudget(null);
    })();
    return () => {
      alive = false;
    };
  }, [activeId]);

  const activeMeta = courses.find((c) => c.id === activeId)?.meta ?? null;
  const courseName = activeMeta?.name ?? "—";
  const examDate = activeMeta?.examDate ?? null;

  const total = useMemo(() => totalCostMin(topics), [topics]);
  const { cut, savedMin } = useMemo(() => budgetCut(topics, budget), [topics, budget]);
  const goldCount = topics.filter((tp) => tp.triage === "gold").length;
  // Taught vs Tested 렌즈: 시험신호(examPoint) 없는 토픽 = 가르쳤지만 시험낼 신호 없음
  const noSignalIds = useMemo(
    () =>
      new Set(
        topics.filter((tp) => !examPoints.some((p) => p.topicId === tp.id)).map((tp) => tp.id),
      ),
    [topics, examPoints],
  );
  const dimmedIds = gapMode ? noSignalIds : cut;

  const selectedTopic = topics.find((tp) => tp.id === selectedId) ?? null;
  const selectedPoints = useMemo(
    () => examPoints.filter((p) => p.topicId === selectedId),
    [examPoints, selectedId],
  );

  const persist = useCallback(
    (next: Topic[]) => {
      if (activeId) void saveTopics(activeId, next);
    },
    [activeId],
  );

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
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleRate = useCallback(
    (id: string, confidence: number) => {
      setTopics((prev) => {
        const next = prev.map((tp) =>
          tp.id === id ? { ...tp, confidence, triage: triageFor(tp.examProb, confidence) } : tp,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleDrop = useCallback(
    (id: string) => {
      setTopics((prev) => {
        const next = prev.map((tp) => (tp.id === id ? { ...tp, triage: "drop" as const } : tp));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleCreateCourse = useCallback(
    async (name: string, date: string | null, lectures: Lecture[]) => {
      try {
        const id = await createCourse(name, date, lectures);
        const cs = await listCourses();
        setCourses(cs);
        setActiveId(id);
        setWizardOpen(false);
      } catch (e) {
        // 조용한 실패 방지 — 저장 키/값 오류 등을 표면화
        setSpike(`코스 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [],
  );

  // 수집(Accrue) — Alt: 연결 강의 ingest. 성장 diff 표시.
  const handleCollect = useCallback(async () => {
    if (!activeId) return;
    try {
      const res = await collectCourse(activeId);
      setTopics(res.topics);
      setExamPoints(res.examPoints);
      setGrowth(`강의 ${res.ingested}개 수집`);
      window.setTimeout(() => setGrowth(null), 4000);
    } catch (e) {
      setSpike(e instanceof Error ? e.message : String(e));
    }
  }, [activeId]);

  // 프리뷰: 데모 강의 병합으로 Accrue(코스가 자란다) + 성장 diff 시연
  const handleDemoGrow = useCallback(() => {
    const existing = new Set(topics.map((tp) => tp.name));
    const delta = demoExtraTopics.filter((tp) => !existing.has(tp.name)).length;
    setTopics((prev) => {
      const next = mergeTopics(prev, demoExtraTopics);
      persist(next);
      return next;
    });
    setExamPoints((prev) => {
      const next = [...prev, ...demoExtraExamPoints];
      if (activeId) void saveExamPoints(activeId, next);
      return next;
    });
    setGrowth(`+${delta} 토픽`);
    window.setTimeout(() => setGrowth(null), 4000);
  }, [topics, persist, activeId]);

  // transcriptUpdated 구독 → 재수집 (Accrue, Alt 전용)
  useEffect(() => {
    if (!hasAltRuntime() || !activeId) return;
    let unsub: (() => Promise<void>) | null = null;
    void (async () => {
      try {
        unsub = await alt.events.subscribe("transcriptUpdated", () => {
          void handleCollect();
        });
      } catch {
        /* noop */
      }
    })();
    return () => {
      if (unsub) void unsub();
    };
  }, [activeId, handleCollect]);

  const runSpike = useCallback(async () => {
    try {
      const r = await runtimeSpike();
      setSpike(`models ${r.models.length} · tooled ${r.structuredModel ?? "—"}`);
    } catch (e) {
      setSpike(e instanceof Error ? e.message : String(e));
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 — 코스 목록 */}
      <aside className="glass flex w-60 shrink-0 flex-col border-r p-4">
        <div className="mb-7 flex items-center gap-2.5">
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

        <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          코스
        </p>
        <nav className="flex-1 space-y-0.5 overflow-auto">
          {courses.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm"
              style={
                c.id === activeId
                  ? { background: "var(--accent-soft)", color: "var(--accent-1)" }
                  : { color: "var(--fg-500)" }
              }
            >
              <span className="flex-1 truncate">{c.meta.name}</span>
              <span className="text-[10px] text-muted-foreground">{dDay(c.meta.examDate)}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-4" /> 새 코스
          </button>
        </nav>

        <Badge variant={isAlt ? "default" : "secondary"} className="mt-3 w-fit">
          {isAlt ? t("runtime.connected") : t("runtime.preview")}
        </Badge>
      </aside>

      {/* 디테일 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass flex items-center justify-between gap-4 border-b px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="text-sm text-muted-foreground">{courseName}</span>
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {dDay(examDate)}
            </span>
            <span className="text-xs text-muted-foreground">
              {topics.length} 토픽 · 골드존 {goldCount}
            </span>
            {growth ? (
              <span className="text-xs font-semibold" style={{ color: "var(--accent-1)" }}>
                ↑ {growth}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>예산</span>
              <input
                type="range"
                min={0}
                max={Math.max(total, 60)}
                step={15}
                value={budget ?? total}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setBudget(v >= total ? null : v);
                }}
                className="w-28"
                style={{ accentColor: "var(--accent-1)" }}
                aria-label="시간 예산"
              />
              <span className="mono w-12 text-foreground">
                {budget == null ? "전체" : `${(budget / 60).toFixed(1)}h`}
              </span>
              {budget != null ? <span>· 절약 {savedMin}분</span> : null}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={gapMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setGapMode((v) => !v)}
                title="가르친 것 vs 시험낼 것 (시험신호 없는 토픽 흐리게)"
              >
                <Eye className="size-4" /> 갭
              </Button>
              <Button variant="ghost" size="sm" onClick={isAlt ? handleCollect : handleDemoGrow}>
                <Sparkles className="size-4" /> {isAlt ? "수집" : "데모 강의"}
              </Button>
              <Button variant="ghost" size="sm" onClick={runSpike} disabled={!isAlt}>
                <Activity className="size-4" /> 스파이크
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpsOpen(true)}>
                작전지도
              </Button>
              <Button size="sm" onClick={() => setSessionOpen(true)}>
                <Scissors className="size-4" /> 오늘의 컷
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-4">
          <div className="frost relative h-full w-full overflow-hidden rounded-xl border">
            <DecisionMap
              topics={topics}
              onChange={handleChange}
              onSelect={setSelectedId}
              dimmedIds={dimmedIds}
            />
            {topics.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <p className="text-sm text-muted-foreground">
                  강의를 연결하면 토픽이 채워집니다.
                </p>
              </div>
            ) : null}

            {selectedTopic ? (
              <EvidenceDrawer
                topic={selectedTopic}
                points={selectedPoints}
                onClose={() => setSelectedId(null)}
              />
            ) : null}

            {sessionOpen ? (
              <TriageSession
                topics={topics.filter((tp) => tp.triage !== "drop")}
                onRate={handleRate}
                onDrop={handleDrop}
                onClose={() => setSessionOpen(false)}
              />
            ) : null}

            {opsOpen ? (
              <OpsMap
                topics={topics}
                cut={cut}
                savedMin={savedMin}
                examDate={examDate}
                courseName={courseName}
                onClose={() => setOpsOpen(false)}
              />
            ) : null}

            {wizardOpen ? (
              <NewCourse onCreate={handleCreateCourse} onClose={() => setWizardOpen(false)} />
            ) : null}
          </div>
        </div>

        {spike ? <p className="mono px-6 pb-2 text-xs text-muted-foreground">{spike}</p> : null}
      </div>
    </div>
  );
}
