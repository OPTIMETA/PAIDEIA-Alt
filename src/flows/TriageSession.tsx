// 오늘의 컷 (plan.md §3.2 Decide · §3.4) — 토픽을 시험확률 높은 순으로 하나씩,
// 한 번의 선택이 자신감(Y축)과 킵/컷을 동시에 입력한다. 끝나면 맵이 갱신된다.
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExamPoint, Topic } from "@/lib/schemas";

type Props = {
  topics: Topic[];
  pointsByTopic?: ReadonlyMap<string, ExamPoint[]>;
  onRate: (id: string, confidence: number) => void;
  onDrop: (id: string) => void;
  onClose: () => void;
};

export function TriageSession({ topics, pointsByTopic, onRate, onDrop, onClose }: Props) {
  const queue = useMemo(() => [...topics].sort((a, b) => b.examProb - a.examProb), [topics]);
  const [i, setI] = useState(0);
  const cur = queue[i];
  const done = i >= queue.length;
  const topPoint = cur ? pointsByTopic?.get(cur.id)?.[0] : undefined;

  const rate = (confidence: number) => {
    if (cur) onRate(cur.id, confidence);
    setI((x) => x + 1);
  };
  const drop = () => {
    if (cur) onDrop(cur.id);
    setI((x) => x + 1);
  };

  return (
    <div className="absolute inset-0 z-10 grid place-items-center">
      <div className="glass anim-overlay absolute inset-0" />
      <div className="frost anim-panel relative max-h-[92%] w-[min(92%,520px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            훑어 정하기 · {Math.min(i + 1, queue.length)}/{queue.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <p className="mb-1 text-xl font-normal">다 정했어요</p>
            <p className="mb-5 text-sm text-muted-foreground">
              지도가 새로 그려졌어요. 골드존부터 시작하세요.
            </p>
            <Button onClick={onClose}>지도 보기</Button>
          </div>
        ) : cur ? (
          <>
            <div className="mb-6 text-center">
              <p
                className="mb-2 text-xs font-normal"
                style={{ color: cur.examProb >= 0.6 ? "var(--accent-1)" : "var(--fg-500)" }}
              >
                시험 확률 {Math.round(cur.examProb * 100)}%
              </p>
              <p className="text-2xl font-normal">{cur.name}</p>
              {topPoint ? (
                <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  🎙 “{topPoint.quote}”
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => rate(3)}>
                확실히 안다
              </Button>
              <Button variant="secondary" onClick={() => rate(2)}>
                대충 안다
              </Button>
              <Button variant="secondary" onClick={() => rate(0)}>
                모른다
              </Button>
              <Button variant="ghost" onClick={drop}>
                버리기
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              한 번 고르면 자신감과 남길지 버릴지가 함께 정해집니다
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
