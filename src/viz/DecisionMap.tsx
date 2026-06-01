// 2D 결정 맵 (plan.md §3.1, §3.4, §14.5) — 큰 인터랙티브 Lombardi 사분면.
// X=시험확률, Y=자신감. forceX/Y로 데이터 좌표에 앵커 + forceCollide로 겹침 방지.
// 노드 드래그 = preference override (시험확률·자신감 재조정).
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

type Edge = { a: string; b: string };

type Props = {
  topics: Topic[];
  onChange?: (id: string, patch: { examProb: number; confidence: number | null }) => void;
};

const PAD_X = 70;
const PAD_TOP = 44;
const BAND_H = 76; // 하단 '미평가' 띠
const PAD_BOTTOM = 40;

function isHot(examProb: number, confidence: number | null): boolean {
  return examProb >= 0.6 && confidence !== null && confidence <= 1;
}

function radius(examProb: number): number {
  return 16 + examProb * 30;
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

export function DecisionMap({ topics, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dimsRef = useRef({ w: 960, h: 600 });
  const nodesRef = useRef<SimNode[]>([]);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const dragId = useRef<string | null>(null);
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((tk) => tk + 1), []);

  // 아크: 같은 노트에 함께 등장한 토픽 쌍 (Lombardi 관계)
  const edges = useMemo<Edge[]>(() => {
    const out: Edge[] = [];
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const shared = topics[i].appearsInNoteIds.some((n) => topics[j].appearsInNoteIds.includes(n));
        if (shared) out.push({ a: topics[i].id, b: topics[j].id });
      }
    }
    return out;
  }, [topics]);

  // 컨테이너 크기 추적
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      dimsRef.current = { w: Math.max(360, cr.width), h: Math.max(360, cr.height) };
      retarget();
      rerender();
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 시뮬레이션 (topics 변경 시 재구성)
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
        x: old?.x ?? tx + (Math.cos(t.id.length * 1.7) * 8),
        y: old?.y ?? ty + (Math.sin(t.id.length * 1.7) * 8),
      };
    });
    nodesRef.current = nodes;

    const sim = forceSimulation<SimNode>(nodes)
      .force("x", forceX<SimNode>((d) => d.tx).strength(0.16))
      .force("y", forceY<SimNode>((d) => d.ty).strength(0.16))
      .force("collide", forceCollide<SimNode>((d) => d.r + 9))
      .stop();
    // 동기로 정착 — 로드 시 애니메이션 없이 즉시 배치(드래그 때만 애니메이션)
    for (let i = 0; i < 320; i++) sim.tick();
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
      for (let i = 0; i < 240; i++) sim.tick();
      sim.stop();
      rerender();
    }
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault();
    dragId.current = id;
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) {
      n.fx = n.x;
      n.fy = n.y;
    }
    const sim = simRef.current;
    if (sim) {
      sim.on("tick", rerender); // 드래그 동안만 라이브 애니메이션
      sim.alphaTarget(0.3).restart();
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e: PointerEvent) {
    const id = dragId.current;
    const svg = svgRef.current;
    if (!id || !svg) return;
    const rect = svg.getBoundingClientRect();
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) {
      n.fx = e.clientX - rect.left;
      n.fy = e.clientY - rect.top;
    }
  }

  function onPointerUp() {
    const id = dragId.current;
    dragId.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    const sim = simRef.current;
    if (sim) {
      sim.on("tick", null); // 드래그 끝 → 애니메이션 정지(이후 재배치는 동기)
      sim.alphaTarget(0);
      sim.stop();
    }
    const n = nodesRef.current.find((x) => x.id === id);
    if (n && id) {
      const { w, h } = dimsRef.current;
      const next = invert(n.fx ?? n.x, n.fy ?? n.y, w, h);
      n.fx = null;
      n.fy = null;
      onChange?.(id, next); // topics 갱신 → 효과가 동기 재정착
    }
  }

  const { w, h } = dimsRef.current;
  const nodes = nodesRef.current;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ratedBottom = h - BAND_H - PAD_BOTTOM;
  const cx = PAD_X + 0.5 * (w - 2 * PAD_X);
  const cy = PAD_TOP + 0.5 * (ratedBottom - PAD_TOP);

  return (
    <div ref={wrapRef} className="h-full w-full">
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="touch-none select-none"
        role="img"
        aria-label="2D 결정 맵"
      >
        {/* 사분면 가이드 */}
        <line x1={cx} y1={PAD_TOP - 12} x2={cx} y2={ratedBottom + 8} stroke="var(--line-strong)" strokeWidth={1} />
        <line x1={PAD_X - 12} y1={cy} x2={w - PAD_X + 12} y2={cy} stroke="var(--line-strong)" strokeWidth={1} />
        {/* 미평가 띠 */}
        <line
          x1={PAD_X - 12}
          y1={ratedBottom + 8}
          x2={w - PAD_X + 12}
          y2={ratedBottom + 8}
          stroke="var(--line)"
          strokeDasharray="4 4"
          strokeWidth={1}
        />

        {/* 축·사분면 라벨 */}
        <text x={w - PAD_X + 6} y={cy - 6} textAnchor="end" fontSize={13} fill="var(--fg-700)">
          시험확률 →
        </text>
        <text x={cx + 8} y={PAD_TOP - 2} fontSize={13} fill="var(--fg-700)">
          자신감 ↑
        </text>
        <text x={w - PAD_X} y={ratedBottom - 10} textAnchor="end" fontSize={13} fill="var(--accent-1)">
          🔥 지금 (골드존)
        </text>
        <text x={PAD_X} y={ratedBottom - 10} fontSize={13} fill="var(--fg-700)">
          버려도 안전
        </text>
        <text x={w - PAD_X} y={PAD_TOP + 14} textAnchor="end" fontSize={13} fill="var(--fg-700)">
          유지만
        </text>
        <text x={PAD_X} y={PAD_TOP + 14} fontSize={13} fill="var(--fg-700)">
          이미 안전
        </text>
        <text x={PAD_X} y={h - 14} fontSize={12} fill="var(--fg-700)">
          미평가 — 오늘의 컷에서 분류
        </text>

        {/* Lombardi 아크 */}
        <g fill="none" stroke="var(--fg-700)" strokeWidth={1}>
          {edges.map((e, i) => {
            const a = byId.get(e.a);
            const b = byId.get(e.b);
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const norm = Math.hypot(dx, dy) || 1;
            const curve = Math.min(60, norm * 0.18);
            const qx = mx - (dy / norm) * curve;
            const qy = my + (dx / norm) * curve;
            return (
              <path
                key={i}
                d={`M${a.x},${a.y} Q${qx},${qy} ${b.x},${b.y}`}
                opacity={0.35}
              />
            );
          })}
        </g>

        {/* 노드 */}
        {nodes.map((n) => (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            onPointerDown={(e) => onPointerDown(e, n.id)}
            className="cursor-grab active:cursor-grabbing"
          >
            {n.hot ? <circle r={n.r + 7} fill="var(--accent-soft)" /> : null}
            <circle
              r={n.r}
              fill={n.confidence === null ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)"}
              stroke={n.hot ? "var(--accent-1)" : "var(--line-strong)"}
              strokeWidth={n.hot ? 2 : 1.25}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.max(11, Math.min(15, n.r * 0.5))}
              fill={n.hot ? "var(--accent-1)" : "var(--fg-300)"}
              style={{ pointerEvents: "none" }}
            >
              {n.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
