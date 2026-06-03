// 2D 결정 맵 (plan.md §3.1, §3.4, §14.5) — 큰 인터랙티브 Lombardi 사분면.
// X=시험확률, Y=자신감. forceX/Y로 데이터 좌표에 앵커 + forceCollide로 겹침 방지.
// 드래그=재조정(override), 클릭=증거 드로어(onSelect), 호버=연결·라벨 강조.
// 라벨은 충돌 회피(겹치면 숨김)·말줄임·다크 헤일로로 가독성 확보.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forceCollide, forceSimulation, forceX, forceY, type Simulation } from "d3";
import type { Topic } from "@/lib/schemas";

type SimNode = {
  id: string;
  name: string;
  examProb: number;
  confidence: number | null;
  posOverride: { x: number; y: number } | null;
  hot: boolean;
  r: number;
  tx: number;
  ty: number;
  noteIds: number[];
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type Edge = { a: string; b: string; w: number };

type Props = {
  topics: Topic[];
  onChange?: (
    id: string,
    patch: {
      examProb: number;
      confidence: number | null;
      posOverride?: { x: number; y: number } | null;
    },
  ) => void;
  onSelect?: (id: string) => void;
  dimmedIds?: ReadonlySet<string>;
  signalCounts?: ReadonlyMap<string, number>;
};

// 패딩을 화면 크기에 비례(클램프) — 작은 창에서 과한 여백 방지, 큰 창에서도 적정.
function pads(w: number, h: number) {
  return {
    PAD_X: Math.round(Math.max(48, Math.min(110, w * 0.085))),
    PAD_TOP: Math.round(Math.max(36, Math.min(58, h * 0.09))),
    BAND_H: 0, // '미평가' 띠 제거(#5) — 미평가 노드는 오른쪽 트레이로. 전 높이를 자신감 축에 사용.
    PAD_BOTTOM: Math.round(Math.max(38, Math.min(58, h * 0.085))),
  };
}

// 가로축 정규화 — 전사 기반이라 examProb가 다 높게 몰리는(오른쪽 쏠림) 문제 보정.
// 코스 안 토픽들의 상대 위치로 펼쳐, 절대값이 비슷해도 축 폭을 충분히 쓰게 한다.
const X_INSET = 0.07; // 좌우 끝 여백(가장자리 박힘 방지)
function probRange(topics: { examProb: number }[]): { lo: number; hi: number } {
  if (topics.length === 0) return { lo: 0, hi: 1 };
  const ps = topics.map((t) => t.examProb);
  return { lo: Math.min(...ps), hi: Math.max(...ps) };
}
function normFrac(examProb: number, lo: number, hi: number): number {
  const f = hi > lo ? (examProb - lo) / (hi - lo) : 0.5;
  return X_INSET + (1 - 2 * X_INSET) * Math.min(1, Math.max(0, f));
}

function isHot(examProb: number, confidence: number | null): boolean {
  return examProb >= 0.6 && confidence !== null && confidence <= 1;
}

function radius(examProb: number): number {
  return 4 + examProb * 11; // 4~15 (NODEPROMPT: 작은 노드, weight 비례)
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// 라벨 폭 추정 — 한글/CJK는 거의 정사각(≈size), 라틴/숫자는 좁음. 충돌 회피 정확도용.
function labelWidth(text: string, size: number): number {
  let w = 0;
  for (const ch of text) {
    w += /[　-鿿가-힯＀-￯]/.test(ch) ? size * 0.96 : size * 0.52;
  }
  return w;
}

function layout(
  examProb: number,
  confidence: number | null,
  posOverride: { x: number; y: number } | null,
  w: number,
  h: number,
  lo: number,
  hi: number,
) {
  const { PAD_X, PAD_TOP, BAND_H, PAD_BOTTOM } = pads(w, h);
  const ratedTop = PAD_TOP;
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  const tx = PAD_X + normFrac(examProb, lo, hi) * (w - 2 * PAD_X);
  let ty: number;
  if (posOverride) {
    // 드래그로 둔 자리 그대로(연속). 세로 스냅 없음.
    const cf = Math.min(3, Math.max(0, posOverride.y));
    ty = ratedBottom - (cf / 3) * (ratedBottom - ratedTop);
  } else if (confidence === null) {
    ty = h - BAND_H / 2 - PAD_BOTTOM / 2;
  } else {
    ty = ratedBottom - (confidence / 3) * (ratedBottom - ratedTop);
  }
  return { tx, ty };
}

function invert(x: number, y: number, w: number, h: number, lo: number, hi: number) {
  const { PAD_X, PAD_TOP, BAND_H, PAD_BOTTOM } = pads(w, h);
  const ratedTop = PAD_TOP;
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  // 정규화된 가로 위치를 다시 examProb로 환산(layout의 역).
  const frac = (x - PAD_X) / (w - 2 * PAD_X);
  const unf = Math.min(1, Math.max(0, (frac - X_INSET) / (1 - 2 * X_INSET)));
  const examProb = Math.min(1, Math.max(0, hi > lo ? lo + unf * (hi - lo) : (lo + hi) / 2));
  // 미평가 띠가 없어졌으므로 맵 어디에 놓든 자신감 0~3으로 분류된다(맨 아래 = 0).
  const cf = Math.min(3, Math.max(0, ((ratedBottom - y) / (ratedBottom - ratedTop)) * 3));
  return { examProb, confidence: Math.round(cf), cf };
}

export function DecisionMap({ topics, onChange, onSelect, dimmedIds, signalCounts }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dimsRef = useRef({ w: 960, h: 600 });
  const nodesRef = useRef<SimNode[]>([]);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const dragId = useRef<string | null>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const [, setTick] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 960, h: 600 });
  const rerender = useCallback(() => setTick((tk) => tk + 1), []);

  // 모든 관계(같은 노트 공동출현) + 노드당 backbone 1개 (헤어볼 방지)
  const { backbone, neighbors } = useMemo(() => {
    const all: Edge[] = [];
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const shared = topics[i].appearsInNoteIds.filter((n) =>
          topics[j].appearsInNoteIds.includes(n),
        ).length;
        if (shared > 0) {
          const w = shared * 10 + Math.min(topics[i].examProb, topics[j].examProb);
          all.push({ a: topics[i].id, b: topics[j].id, w });
        }
      }
    }
    // 노드별 최강 1개만 backbone으로(중복 제거)
    const best = new Map<string, Edge>();
    for (const t of topics) {
      let top: Edge | null = null;
      for (const e of all) {
        if (e.a !== t.id && e.b !== t.id) continue;
        if (!top || e.w > top.w) top = e;
      }
      if (top) {
        const key = [top.a, top.b].sort().join("|");
        if (!best.has(key)) best.set(key, top);
      }
    }
    const neighborMap = new Map<string, Set<string>>();
    for (const e of all) {
      (neighborMap.get(e.a) ?? neighborMap.set(e.a, new Set()).get(e.a)!).add(e.b);
      (neighborMap.get(e.b) ?? neighborMap.set(e.b, new Set()).get(e.b)!).add(e.a);
    }
    return { backbone: [...best.values()], allEdges: all, neighbors: neighborMap };
  }, [topics]);

  const hoverEdges = useMemo(() => {
    if (!hovered) return [];
    const out: Edge[] = [];
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        if (topics[i].id !== hovered && topics[j].id !== hovered) continue;
        const shared = topics[i].appearsInNoteIds.filter((n) =>
          topics[j].appearsInNoteIds.includes(n),
        ).length;
        if (shared > 0) out.push({ a: topics[i].id, b: topics[j].id, w: shared });
      }
    }
    return out;
  }, [hovered, topics]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(420, Math.round(cr.width));
      const h = Math.max(360, Math.round(cr.height));
      dimsRef.current = { w, h };
      // size 변경 → 시뮬레이션 effect 재실행 → 노드가 새 크기에 맞춰 재배치
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { w, h } = size;
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    // 가로 정규화 범위는 코스 전체(트레이 포함) 기준 — 트레이↔맵 이동 시 위치 일관.
    const { lo, hi } = probRange(topics);
    // 맵에는 분류된(평가된) 노드만. 미평가(confidence===null)는 오른쪽 트레이가 담당(#5).
    const nodes: SimNode[] = topics
      .filter((t) => t.confidence !== null)
      .map((t) => {
      const { tx, ty } = layout(t.examProb, t.confidence, t.posOverride, w, h, lo, hi);
      const old = prev.get(t.id);
      return {
        id: t.id,
        name: t.name,
        examProb: t.examProb,
        confidence: t.confidence,
        posOverride: t.posOverride,
        hot: isHot(t.examProb, t.confidence),
        r: radius(t.examProb),
        tx,
        ty,
        noteIds: t.appearsInNoteIds,
        x: old?.x ?? tx + Math.cos(t.id.length * 1.7) * 8,
        y: old?.y ?? ty + Math.sin(t.id.length * 1.7) * 8,
      };
    });
    nodesRef.current = nodes;

    const firstLayout = prev.size === 0;
    const sim = forceSimulation<SimNode>(nodes)
      .velocityDecay(0.55) // 관성↓ → 흔들림 적게, 부드럽게 정착
      .alphaDecay(0.05) // ~1.2s에 걸쳐 식음
      .force("x", forceX<SimNode>((d) => d.tx).strength(0.16))
      .force("y", forceY<SimNode>((d) => d.ty).strength(0.16))
      .force("collide", forceCollide<SimNode>((d) => d.r + 13));
    simRef.current = sim;
    if (firstLayout) {
      // 첫 배치: 깜빡임 없이 정돈된 상태로 시작(애니메이션 없음)
      sim.stop();
      for (let i = 0; i < 300; i++) sim.tick();
      sim.on("tick", rerender);
      rerender();
    } else {
      // 크기·데이터 변경: 이전 위치에서 새 자리로 부드럽게 글라이드
      sim.on("tick", rerender);
      sim.alpha(0.6).restart();
    }
    return () => {
      sim.on("tick", null);
      sim.stop();
    };
  }, [topics, size]);

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault();
    dragId.current = id;
    movedRef.current = false;
    downAt.current = { x: e.clientX, y: e.clientY };
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) {
      n.fx = n.x;
      n.fy = n.y;
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e: PointerEvent) {
    const id = dragId.current;
    const svg = svgRef.current;
    if (!id || !svg) return;
    if (!movedRef.current && downAt.current) {
      const dist = Math.hypot(e.clientX - downAt.current.x, e.clientY - downAt.current.y);
      if (dist <= 4) return;
      movedRef.current = true;
      const sim = simRef.current;
      if (sim) {
        sim.on("tick", rerender);
        sim.alphaTarget(0.12).restart(); // 낮은 목표 알파 → 드래그 중 떨림 적게
      }
    }
    const rect = svg.getBoundingClientRect();
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) {
      n.fx = ((e.clientX - rect.left) / rect.width) * dimsRef.current.w;
      n.fy = ((e.clientY - rect.top) / rect.height) * dimsRef.current.h;
    }
  }

  function onPointerUp() {
    const id = dragId.current;
    dragId.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    const n = nodesRef.current.find((x) => x.id === id);
    if (!n || !id) return;
    if (movedRef.current) {
      const sim = simRef.current;
      if (sim) {
        // 급정지 대신 목표 알파 0 → 부드럽게 식으며 제자리에 정착
        sim.alphaTarget(0);
      }
      const { w, h } = dimsRef.current;
      const { lo, hi } = probRange(topics);
      const r = invert(n.fx ?? n.x, n.fy ?? n.y, w, h, lo, hi);
      n.fx = null;
      n.fy = null;
      onChange?.(id, {
        examProb: r.examProb,
        confidence: r.confidence,
        posOverride: { x: r.examProb, y: r.cf },
      });
    } else {
      n.fx = null;
      n.fy = null;
      onSelect?.(id);
    }
  }

  const { w, h } = size;
  const { PAD_X, PAD_TOP, BAND_H, PAD_BOTTOM } = pads(w, h);
  const nodes = nodesRef.current;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  const cx = PAD_X + 0.5 * (w - 2 * PAD_X);
  const cy = PAD_TOP + 0.5 * (ratedBottom - PAD_TOP);
  const hoverNeighbors = hovered ? (neighbors.get(hovered) ?? new Set<string>()) : new Set<string>();

  // 라벨 충돌 회피: 중요도 순 배치, 아래→위 스태거, 둘 다 겹치면 숨김(호버/골드는 폴백 표시)
  type Placed = { x: number; y: number; w: number; h: number };
  const placed: Placed[] = [];
  const labelFor = new Map<
    string,
    { text: string; size: number; anchor: "start" | "middle" | "end"; y: number }
  >();
  const ordered = [...nodes].sort((a, b) => {
    const pa = (a.id === hovered ? 3 : 0) + (a.hot ? 2 : 0) + a.examProb;
    const pb = (b.id === hovered ? 3 : 0) + (b.hot ? 2 : 0) + b.examProb;
    return pb - pa;
  });
  for (const n of ordered) {
    const forced = n.id === hovered || hoverNeighbors.has(n.id);
    const size = n.id === hovered ? 14 : 12;
    const text = forced ? n.name : truncate(n.name, 16);
    const boxW = labelWidth(text, size);
    const boxH = size * 1.1;
    let anchor: "start" | "middle" | "end" = "middle";
    let bx = n.x - boxW / 2;
    if (n.x < PAD_X + boxW / 2) {
      anchor = "start";
      bx = n.x - size * 0.3;
    } else if (n.x > w - PAD_X - boxW / 2) {
      anchor = "end";
      bx = n.x - boxW + size * 0.3;
    }
    const fits = (baseY: number): Placed | null => {
      const box: Placed = { x: bx, y: baseY - boxH, w: boxW, h: boxH + 2 };
      const ov = placed.some(
        (p) => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y,
      );
      return ov ? null : box;
    };
    const below = n.y + n.r + size + 2;
    const above = n.y - n.r - 4;
    let chosenY: number | null = null;
    const b1 = fits(below);
    if (b1) {
      chosenY = below;
      placed.push(b1);
    } else {
      const b2 = fits(above);
      if (b2) {
        chosenY = above;
        placed.push(b2);
      } else if (forced || n.hot) {
        chosenY = below; // 겹쳐도 표시(골드/호버는 숨기지 않음)
      }
    }
    if (chosenY !== null) labelFor.set(n.id, { text, size, anchor, y: chosenY });
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* 범례 — 맵 위 별도 줄(겹침 방지) */}
      <div className="shrink-0 px-3 pb-1 pt-1.5 text-xs leading-tight text-muted-foreground">
        가로는 <b className="text-foreground">시험 확률</b>, 세로는 <b className="text-foreground">자신감</b>입니다 ·{" "}
        <span style={{ color: "var(--accent-1)" }}>●</span> 골드존은 지금 할 곳 · 🎙 교수가 강조한 부분
      </div>
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          // 트레이(#5)에서 끌어온 미평가 노드를 드롭 → 드롭 높이가 자신감(Y)을 정함.
          // examProb(X=신호)는 그대로 유지하고 자신감만 부여해 분류 완료.
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          const svg = svgRef.current;
          if (!id || !svg) return;
          const t = topics.find((x) => x.id === id);
          if (!t) return;
          const rect = svg.getBoundingClientRect();
          const dy = ((e.clientY - rect.top) / rect.height) * h;
          const { lo, hi } = probRange(topics);
          const inv = invert(0, dy, w, h, lo, hi);
          onChange?.(id, { examProb: t.examProb, confidence: inv.confidence, posOverride: null });
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className="touch-none select-none"
          role="img"
          aria-label="2D 결정 맵"
        >
        {/* 사분면 가이드 */}
        <line x1={cx} y1={PAD_TOP - 14} x2={cx} y2={ratedBottom} stroke="var(--line)" strokeWidth={1} />
        <line x1={PAD_X - 14} y1={cy} x2={w - PAD_X + 14} y2={cy} stroke="var(--line)" strokeWidth={1} />

        {/* 모서리 라벨 (faint, 노드 영역 밖) */}
        <g fontSize={12} fill="var(--fg-700)">
          <text x={w - PAD_X + 14} y={ratedBottom + 26} textAnchor="end">시험 확률 →</text>
          <text x={w - PAD_X + 10} y={PAD_TOP - 2} textAnchor="end">유지만</text>
          <text x={PAD_X - 10} y={PAD_TOP - 2}>이미 안전</text>
          <text x={PAD_X - 10} y={ratedBottom - 6} fill="var(--fg-500)">버려도 안전</text>
          <text x={w - PAD_X + 10} y={ratedBottom - 6} textAnchor="end" fill="var(--accent-1)">
            🔥 지금 (골드존)
          </text>
        </g>

        {/* backbone 아크 (faint) */}
        <g
          fill="none"
          stroke="var(--fg-700)"
          strokeWidth={1}
          opacity={hovered ? 0.06 : 0.16}
          style={{ transition: "opacity 220ms ease" }}
        >
          {backbone.map((e, i) => {
            const a = byId.get(e.a);
            const b = byId.get(e.b);
            if (!a || !b) return null;
            return <path key={i} d={arc(a.x, a.y, b.x, b.y)} />;
          })}
        </g>

        {/* 호버 노드의 연결 (강조) */}
        {hovered ? (
          <g fill="none" stroke="var(--accent-1)" strokeWidth={1.2} opacity={0.55}>
            {hoverEdges.map((e, i) => {
              const a = byId.get(e.a);
              const b = byId.get(e.b);
              if (!a || !b) return null;
              return <path key={i} d={arc(a.x, a.y, b.x, b.y)} />;
            })}
          </g>
        ) : null}

        {/* 노드 */}
        {nodes.map((n) => {
          const dim = dimmedIds?.has(n.id) ?? false;
          const active = n.id === hovered || hoverNeighbors.has(n.id);
          const faded = hovered != null && !active;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              onPointerDown={(e) => onPointerDown(e, n.id)}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered((cur) => (cur === n.id ? null : cur))}
              className="cursor-grab active:cursor-grabbing"
              opacity={dim ? 0.22 : faded ? 0.4 : 1}
              style={{ transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            >
              <circle
                r={n.id === hovered ? n.r * 1.25 : n.r}
                fill={n.hot ? "var(--accent-1)" : n.id === hovered ? "#c4c4c4" : "#e2e2e2"}
                stroke={n.hot ? "none" : "var(--line-strong)"}
                strokeWidth={1}
                style={{
                  transition: "r 220ms cubic-bezier(0.22, 1, 0.36, 1), fill 200ms ease, stroke 200ms ease",
                }}
              />
              {signalCounts && (signalCounts.get(n.id) ?? 0) > 0 ? (
                <text x={n.r * 0.82} y={-n.r * 0.82 + 3} fontSize={12} textAnchor="middle">
                  🎙
                </text>
              ) : null}
            </g>
          );
        })}

        {/* 라벨 (충돌 회피 통과분, 헤일로) — 노드 위에 그려 가독성 */}
        {nodes.map((n) => {
          const lab = labelFor.get(n.id);
          if (!lab) return null;
          const dim = dimmedIds?.has(n.id) ?? false;
          const faded = hovered != null && n.id !== hovered && !hoverNeighbors.has(n.id);
          return (
            <text
              key={n.id}
              x={n.x}
              y={lab.y}
              textAnchor={lab.anchor}
              fontSize={lab.size}
              fill={n.hot ? "var(--accent-1)" : "var(--fg-100)"}
              opacity={dim ? 0.3 : faded ? 0.35 : 1}
              style={{
                pointerEvents: "none",
                paintOrder: "stroke",
                stroke: "var(--cod-1000)",
                strokeWidth: 3.5,
                strokeLinejoin: "round",
                transition: "opacity 200ms ease",
              }}
            >
              {lab.text}
            </text>
          );
        })}
        </svg>
      </div>
    </div>
  );
}

/** 곡선 아크 (Lombardi) — 직선의 수직 방향으로 살짝 휘게. */
function arc(ax: number, ay: number, bx: number, by: number): string {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const norm = Math.hypot(dx, dy) || 1;
  const curve = Math.min(50, norm * 0.16);
  const qx = mx - (dy / norm) * curve;
  const qy = my + (dx / norm) * curve;
  return `M${ax},${ay} Q${qx},${qy} ${bx},${by}`;
}
