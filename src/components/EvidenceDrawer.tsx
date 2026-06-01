// 증거 드로어 (plan.md §3.4) — 토픽 클릭 시 교수 발화 인용 + 타임스탬프.
// Alt에선 인용 클릭 → 원천 노트로 점프(notes:select).
import { Play, X } from "lucide-react";
import { alt, hasAltRuntime } from "@/alt/client";
import type { ExamPoint, Topic } from "@/lib/schemas";

function fmtTs(ms: number | null): string {
  if (ms == null) return "—";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function EvidenceDrawer({
  topic,
  points,
  onClose,
}: {
  topic: Topic;
  points: ExamPoint[];
  onClose: () => void;
}) {
  const jump = async (noteId: number) => {
    if (!hasAltRuntime()) return;
    try {
      await alt.notes.select({ noteId });
    } catch {
      /* noop */
    }
  };

  return (
    <div className="frost anim-drawer absolute right-0 top-0 z-20 flex h-full w-80 flex-col border-l">
      <div className="flex items-start justify-between border-b px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">증거 · 교수 발화</p>
          <p className="text-base font-normal">{topic.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 border-b px-4 py-2 text-xs text-muted-foreground">
        <span>
          시험확률 <span className="font-normal text-foreground">{Math.round(topic.examProb * 100)}%</span>
        </span>
        <span>신호 {points.length}건</span>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">이 토픽에 대한 발화 신호가 없습니다.</p>
        ) : (
          points.map((p, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="text-sm leading-relaxed">“{p.quote}”</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="mono">
                  {fmtTs(p.timestampMs)} · 노트#{p.noteId}
                </span>
                {hasAltRuntime() ? (
                  <button
                    type="button"
                    onClick={() => jump(p.noteId)}
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    <Play className="size-3" /> 노트로
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
