import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Map as MapIcon, PanelLeft, Plus, Scissors, Sparkles } from "lucide-react";
import logoUrl from "@/assets/optimeta-logo.svg";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DecisionMap } from "@/viz/DecisionMap";
import { TriageSession } from "@/flows/TriageSession";
import { OpsMap } from "@/flows/OpsMap";
import { NewCourse } from "@/flows/NewCourse";
import { Welcome } from "@/flows/Welcome";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { alt, hasAltRuntime } from "@/alt/client";
import {
  getExamPoints,
  getTopics,
  getUiFlag,
  setExamPoints as saveExamPoints,
  setTopics as saveTopics,
  setUiFlag,
} from "@/alt/storage";
import { createCourse, ensureSeedCourse, listCourses, type CourseRef } from "@/alt/courses";
import { collectCourse } from "@/pipeline/collect";
import { mergeTopics } from "@/pipeline/ingest";
import { budgetCut, totalCostMin } from "@/lib/budget";
import { dDay, triageFor } from "@/lib/triage";
import { t } from "@/lib/i18n";
import { DEMO_COURSE_ID, demoExtraExamPoints, demoExtraTopics } from "@/lib/demo";
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
  const [status, setStatus] = useState<string | null>(null);
  const [gapMode, setGapMode] = useState(false);
  const [growth, setGrowth] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 코스 목록 로드 (없으면 데모 시드)
  useEffect(() => {
    let alive = true;
    void (async () => {
      await ensureSeedCourse();
      const cs = await listCourses();
      if (!alive) return;
      setCourses(cs);
      setActiveId((cur) => cur ?? cs[0]?.id ?? null);
      if (!(await getUiFlag("welcomed"))) setWelcomeOpen(true);
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
  const allUnrated = topics.length > 0 && topics.every((tp) => tp.confidence === null);

  // 토픽별 교수 발화 신호(증거) — 가중치 내림차순
  const pointsByTopic = useMemo(() => {
    const m = new Map<string, ExamPoint[]>();
    for (const p of examPoints) {
      const arr = m.get(p.topicId) ?? [];
      arr.push(p);
      m.set(p.topicId, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => b.weight - a.weight);
    return m;
  }, [examPoints]);
  const signalCounts = useMemo(
    () => new Map([...pointsByTopic].map(([k, v]) => [k, v.length] as const)),
    [pointsByTopic],
  );

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
    (
      id: string,
      patch: {
        examProb: number;
        confidence: number | null;
        posOverride?: { x: number; y: number } | null;
      },
    ) => {
      setTopics((prev) => {
        const next = prev.map((tp) =>
          tp.id === id
            ? {
                ...tp,
                examProb: patch.examProb,
                confidence: patch.confidence,
                posOverride:
                  patch.posOverride !== undefined ? patch.posOverride : tp.posOverride,
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
          tp.id === id
            ? { ...tp, confidence, posOverride: null, triage: triageFor(tp.examProb, confidence) }
            : tp,
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
        setStatus(`코스 생성 실패: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [],
  );

  // 수집(Accrue) — Alt: 연결 강의 ingest. 성장 diff 표시.
  const handleCollect = useCallback(
    async (noteId?: number) => {
      if (!activeId) return;
      setCollecting(true);
      setStatus(null);
      try {
        // noteId 지정(transcriptUpdated) → 그 노트만 재수집(이미 ingested여도). 없으면 pending 전체.
        const res = await collectCourse(activeId, noteId);
        setTopics(res.topics);
        setExamPoints(res.examPoints);
        if (res.ingested > 0) {
          setGrowth(`강의 ${res.ingested}개 수집`);
          window.setTimeout(() => setGrowth(null), 4000);
        }
        // 결과를 항상 표시(빈 강의·트랜스크립트 없음·실패도 무반응 금지)
        const parts: string[] = [];
        if (res.lectureCount === 0)
          parts.push("연결된 강의가 없습니다 — '새 코스'에서 강의 녹음 노트를 연결하세요.");
        if (res.ingested > 0) parts.push(`${res.ingested}개 강의 수집 완료.`);
        if (res.skippedNoTranscript > 0)
          parts.push(`${res.skippedNoTranscript}개는 트랜스크립트가 비어 건너뜀.`);
        if (res.errors.length > 0) parts.push(`실패 ${res.errors.length}건 — ${res.errors[0].message}`);
        if (parts.length === 0) parts.push("새로 수집할 강의가 없습니다(이미 수집됨).");
        setStatus(parts.join(" "));
      } catch (e) {
        setStatus(`수집 실패: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setCollecting(false);
      }
    },
    [activeId],
  );

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
        unsub = await alt.events.subscribe("transcriptUpdated", (payload) => {
          void handleCollect(payload.noteId);
        });
      } catch {
        /* noop */
      }
    })();
    return () => {
      if (unsub) void unsub();
    };
  }, [activeId, handleCollect]);

  // 첫 실행 환영 닫기(+영속)
  const dismissWelcome = useCallback(() => {
    setWelcomeOpen(false);
    void setUiFlag("welcomed", true);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 — 코스 목록 (반응형: 접기 가능, 좁은 화면에서 더 좁게) */}
      {sidebarOpen ? (
        <aside className="glass flex w-56 shrink-0 flex-col border-r p-4 xl:w-60">
        <div className="mb-7 flex items-center gap-2.5">
          <img src={logoUrl} alt="OPTIMETA" className="size-8 shrink-0" />
          <div className="leading-tight">
            <p className="text-base font-normal">{t("app.title")}</p>
            <p className="text-xs text-muted-foreground">by OPTIMETA</p>
          </div>
        </div>

        <p className="mb-1.5 px-1 text-xs font-normal uppercase text-muted-foreground">
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
              {c.id === DEMO_COURSE_ID ? (
                <span className="rounded border px-1 text-xs text-muted-foreground">예시</span>
              ) : null}
              <span className="text-xs text-muted-foreground">{dDay(c.meta.examDate)}</span>
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
      ) : null}

      {/* 디테일 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass flex items-center justify-between gap-3 overflow-x-auto border-b px-4 py-3 sm:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="사이드바 토글"
            >
              <PanelLeft className="size-4" />
            </button>
            <div className="flex items-baseline gap-2 whitespace-nowrap sm:gap-3">
              <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground lg:inline">
                {courseName}
              </span>
              <span className="text-2xl font-normal tabular-nums">
                {dDay(examDate)}
              </span>
              <span className="hidden text-xs text-muted-foreground lg:inline">
                {topics.length} 토픽 · 골드존 {goldCount}
              </span>
              {growth ? (
                <span className="text-xs font-normal" style={{ color: "var(--accent-1)" }}>
                  ↑ {growth}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground md:flex">
              <span className="hidden lg:inline">예산</span>
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
                className="w-20 lg:w-28"
                style={{ accentColor: "var(--accent-1)" }}
                aria-label="시간 예산"
              />
              <span className="mono w-10 text-foreground">
                {budget == null ? "전체" : `${(budget / 60).toFixed(1)}h`}
              </span>
              {budget != null ? <span className="hidden lg:inline">· 절약 {savedMin}분</span> : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant={gapMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setGapMode((v) => !v)}
                title="가르친 것 vs 시험낼 것 (시험신호 없는 토픽 흐리게)"
              >
                <Eye className="size-4" />
                <span className="hidden lg:inline">갭</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={isAlt ? () => void handleCollect() : handleDemoGrow}
                disabled={collecting}
              >
                <Sparkles className="size-4" />
                {collecting ? (
                  <span>수집 중…</span>
                ) : (
                  <span className="hidden lg:inline">{isAlt ? "수집" : "데모 강의"}</span>
                )}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpsOpen(true)}>
                <MapIcon className="size-4" />
                <span className="hidden md:inline">학습 로드맵</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setSessionOpen(true)}
                className={allUnrated ? "animate-pulse" : undefined}
              >
                <Scissors className="size-4" />
                <span className="hidden sm:inline">오늘의 컷</span>
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
              signalCounts={signalCounts}
            />
            {topics.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center px-8 text-center">
                <p className="max-w-sm text-sm text-muted-foreground">
                  이 코스에 <b className="text-foreground">강의 녹음</b>을 연결하고{" "}
                  <b className="text-foreground">수집</b>하면, 교수가 강조한 시험 핫존이 채워집니다.
                </p>
              </div>
            ) : allUnrated ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                <div className="frost rounded-full border px-4 py-1.5 text-xs text-muted-foreground">
                  {topics.length}개 토픽 수집됨 · <b className="text-foreground">오늘의 컷</b>으로
                  분류하면 골드존이 나타납니다 →
                </div>
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
                pointsByTopic={pointsByTopic}
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
                signalCounts={signalCounts}
                onClose={() => setOpsOpen(false)}
              />
            ) : null}

            {wizardOpen ? (
              <NewCourse onCreate={handleCreateCourse} onClose={() => setWizardOpen(false)} />
            ) : null}
          </div>
        </div>

        {status ? (
          <div className="flex items-center justify-between gap-3 border-t px-6 py-2 text-xs text-muted-foreground">
            <span>{status}</span>
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="shrink-0 transition-colors hover:text-foreground"
            >
              닫기
            </button>
          </div>
        ) : null}
      </div>

      {welcomeOpen ? (
        <Welcome
          onNewCourse={() => {
            dismissWelcome();
            setWizardOpen(true);
          }}
          onClose={dismissWelcome}
        />
      ) : null}
    </div>
  );
}
