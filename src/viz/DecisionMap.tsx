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
  onChange?: (id: string, patch: { examProb: number; confidence: number | null }) => void;
  onSelect?: (id: string) => void;
  dimmedIds?: ReadonlySet<string>;
};

const PAD_X = 96;
const PAD_TOP = 54;
const BAND_H = 70; // 하단 '미평가' 띠
const PAD_BOTTOM = 44;

function isHot(examProb: number, confidence: number | null): boolean {
  return examProb >= 0.6 && confidence !== null && confidence <= 1;
}

function radius(examProb: number): number {
  return 9 + examProb * 17; // 9~26 (라벨 공간 확보 위해 축소)
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function layout(examProb: number, confidence: number | null, w: number, h: number) {
  const ratedTop = PAD_TOP;
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  const tx = PAD_X + examProb * (w - 2 * PAD_X);
  const ty =
    confidence === null
      ? h - BAND_H / 2 - PAD_BOTTOM / 2
      : ratedBottom - (confidence / 3) * (ratedBottom - ratedTop);
  return { tx, ty };
}

function invert(x: number, y: number, w: number, h: number) {
  const ratedTop = PAD_TOP;
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  const examProb = Math.min(1, Math.max(0, (x - PAD_X) / (w - 2 * PAD_X)));
  if (y > ratedBottom + 6) return { examProb, confidence: null };
  const raw = ((ratedBottom - y) / (ratedBottom - ratedTop)) * 3;
  const confidence = Math.min(3, Math.max(0, Math.round(raw)));
  return { examProb, confidence };
}

export function DecisionMap({ topics, onChange, onSelect, dimmedIds }: Props) {
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
      dimsRef.current = { w: Math.max(420, cr.width), h: Math.max(360, cr.height) };
      retarget();
      rerender();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { w, h } = dimsRef.current;
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const nodes: SimNode[] = topics.map((t) => {
      const { tx, ty } = layout(t.examProb, t.confidence, w, h);
      const old = prev.get(t.id);
      return {
        id: t.id,
        name: t.name,
        examProb: t.examProb,
        confidence: t.confidence,
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

    const sim = forceSimulation<SimNode>(nodes)
      .force("x", forceX<SimNode>((d) => d.tx).strength(0.16))
      .force("y", forceY<SimNode>((d) => d.ty).strength(0.16))
      .force("collide", forceCollide<SimNode>((d) => d.r + 16))
      .stop();
    for (let i = 0; i < 340; i++) sim.tick();
    simRef.current = sim;
    rerender();
    return () => {
      sim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  function retarget() {
    const { w, h } = dimsRef.current;
    for (const n of nodesRef.current) {
      const { tx, ty } = layout(n.examProb, n.confidence, w, h);
      n.tx = tx;
      n.ty = ty;
    }
    const sim = simRef.current;
    if (sim) {
      sim.alpha(0.6);
      for (let i = 0; i < 260; i++) sim.tick();
      sim.stop();
      rerender();
    }
  }

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
        sim.alphaTarget(0.3).restart();
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
        sim.on("tick", null);
        sim.alphaTarget(0);
        sim.stop();
      }
      const { w, h } = dimsRef.current;
      const next = invert(n.fx ?? n.x, n.fy ?? n.y, w, h);
      n.fx = null;
      n.fy = null;
      onChange?.(id, next);
    } else {
      n.fx = null;
      n.fy = null;
      onSelect?.(id);
    }
  }

  const { w, h } = dimsRef.current;
  const nodes = nodesRef.current;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  const cx = PAD_X + 0.5 * (w - 2 * PAD_X);
  const cy = PAD_TOP + 0.5 * (ratedBottom - PAD_TOP);
  const hoverNeighbors = hovered ? (neighbors.get(hovered) ?? new Set<string>()) : new Set<string>();

  // 라벨 충돌 회피: 중요도 순(골드>호버>시험확률)으로 배치, 겹치면 숨김
  type Placed = { x: number; y: number; w: number; h: number };
  const placed: Placed[] = [];
  const labelFor = new Map<string, { text: string; size: number; anchor: "start" | "middle" | "end" }>();
  const ordered = [...nodes].sort((a, b) => {
    const pa = (a.id === hovered ? 3 : 0) + (a.hot ? 2 : 0) + a.examProb;
    const pb = (b.id === hovered ? 3 : 0) + (b.hot ? 2 : 0) + b.examProb;
    return pb - pa;
  });
  for (const n of ordered) {
    const forced = n.id === hovered || hoverNeighbors.has(n.id);
    const size = n.id === hovered ? 13 : 11;
    const text = forced ? n.name : truncate(n.name, 18);
    const boxW = text.length * size * 0.6;
    const boxH = size * 1.1;
    const ly = n.y + n.r + size + 2;
    let anchor: "start" | "middle" | "end" = "middle";
    let bx = n.x - boxW / 2;
    if (n.x < PAD_X + boxW / 2) {
      anchor = "start";
      bx = n.x - size * 0.3;
    } else if (n.x > w - PAD_X - boxW / 2) {
      anchor = "end";
      bx = n.x - boxW + size * 0.3;
    }
    const box: Placed = { x: bx, y: ly - boxH, w: boxW, h: boxH + 2 };
    const overlaps = placed.some(
      (p) => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y,
    );
    // 골드/호버/이웃은 항상 표시, 그 외는 겹치면 숨김
    if (forced || n.hot || !overlaps) {
      labelFor.set(n.id, { text, size, anchor });
      placed.push(box);
    }
  }

  return (
    <div ref={wrapRef} className="h-full w-full">
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
        <line x1={cx} y1={PAD_TOP - 14} x2={cx} y2={ratedBottom + 6} stroke="var(--line)" strokeWidth={1} />
        <line x1={PAD_X - 14} y1={cy} x2={w - PAD_X + 14} y2={cy} stroke="var(--line)" strokeWidth={1} />
        <line
          x1={PAD_X - 14}
          y1={ratedBottom + 6}
          x2={w - PAD_X + 14}
          y2={ratedBottom + 6}
          stroke="var(--line)"
          strokeDasharray="4 5"
          strokeWidth={1}
        />

        {/* 모서리 라벨 (faint, 노드 영역 밖) */}
        <g fontSize={12} fill="var(--fg-700)">
          <text x={PAD_X - 14} y={PAD_TOP - 18}>자신감 ↑</text>
          <text x={w - PAD_X + 14} y={ratedBottom + 26} textAnchor="end">시험확률 →</text>
          <text x={w - PAD_X + 10} y={PAD_TOP - 2} textAnchor="end">유지만</text>
          <text x={PAD_X - 10} y={PAD_TOP - 2}>이미 안전</text>
          <text x={PAD_X - 10} y={ratedBottom - 6} fill="var(--fg-500)">버려도 안전</text>
          <text x={w - PAD_X + 10} y={ratedBottom - 6} textAnchor="end" fill="var(--accent-1)">
            🔥 지금 (골드존)
          </text>
          <text x={PAD_X - 10} y={h - 16}>미평가</text>
        </g>

        {/* backbone 아크 (faint) */}
        <g fill="none" stroke="var(--fg-700)" strokeWidth={1} opacity={hovered ? 0.06 : 0.16}>
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
            >
              {n.hot ? <circle r={n.r + 6} fill="var(--accent-soft)" /> : null}
              <circle
                r={n.r}
                fill={
                  n.hot ? "var(--accent-1)" : n.id === hovered ? "rgba(0,0,0,0.06)" : "#ffffff"
                }
                stroke={n.hot ? "var(--accent-1)" : "var(--line-strong)"}
                strokeWidth={n.hot ? 1.5 : 1}
              />
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
              y={n.y + n.r + lab.size + 2}
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
              }}
            >
              {lab.text}
            </text>
          );
        })}
      </svg>
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
