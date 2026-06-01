// 오늘의 컷 (plan.md §3.2 Decide · §3.4) — 토픽을 시험확률 높은 순으로 하나씩,
// 한 번의 선택이 자신감(Y축)과 킵/컷을 동시에 입력한다. 끝나면 맵이 갱신된다.
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Topic } from "@/lib/schemas";

type Props = {
  topics: Topic[];
  onRate: (id: string, confidence: number) => void;
  onDrop: (id: string) => void;
  onClose: () => void;
};

export function TriageSession({ topics, onRate, onDrop, onClose }: Props) {
  const queue = useMemo(() => [...topics].sort((a, b) => b.examProb - a.examProb), [topics]);
  const [i, setI] = useState(0);
  const cur = queue[i];
  const done = i >= queue.length;

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
      <div className="glass absolute inset-0" />
      <div className="frost relative w-[min(92%,520px)] rounded-2xl border p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            오늘의 컷 · {Math.min(i + 1, queue.length)}/{queue.length}
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
            <p className="mb-1 text-xl font-extrabold">분류 완료</p>
            <p className="mb-5 text-sm text-muted-foreground">
              맵이 갱신됐습니다. 골드존부터 시작하세요.
            </p>
            <Button onClick={onClose}>맵으로</Button>
          </div>
        ) : cur ? (
          <>
            <div className="mb-6 text-center">
              <p
                className="mb-2 text-xs font-semibold"
                style={{ color: cur.examProb >= 0.6 ? "var(--accent-1)" : "var(--fg-500)" }}
              >
                시험확률 {Math.round(cur.examProb * 100)}%
              </p>
              <p className="text-2xl font-extrabold">{cur.name}</p>
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
                버린다
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              한 번의 선택 = 자신감 + 킵/컷
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
