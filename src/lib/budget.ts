// 시간 예산 → 컷라인 (plan.md §3.4 예산 슬라이더, CP-SAT 라이트).
// 가치/우선순위 그리디로 예산에 맞는 토픽만 남기고 나머지를 컷.
import type { Topic } from "@/lib/schemas";

/** 토픽 1개 학습 추정 시간(분) — 시험확률이 높을수록 무겁게. */
export function topicCostMin(t: Topic): number {
  return 25 + Math.round(t.examProb * 50); // 25~75분
}

function priority(t: Topic): number {
  const base =
    t.triage === "gold"
      ? 5
      : t.triage === "keep"
        ? 4
        : t.triage === "unrated"
          ? 3
          : t.triage === "safe"
            ? 2
            : 1;
  return base + t.examProb;
}

/** drop 제외 토픽들의 총 추정 시간(분). */
export function totalCostMin(topics: Topic[]): number {
  return topics.filter((t) => t.triage !== "drop").reduce((s, t) => s + topicCostMin(t), 0);
}

/** 예산(분) → 컷 집합 + 절약 비율(%). budgetMin=null이면 drop만 컷. */
export function budgetCut(
  topics: Topic[],
  budgetMin: number | null,
): { cut: Set<string>; savedPct: number } {
  const cut = new Set<string>();
  let saved = 0;
  for (const t of topics) {
    if (t.triage === "drop") {
      cut.add(t.id);
      saved += topicCostMin(t);
    }
  }
  if (budgetMin != null) {
    const queue = topics
      .filter((t) => t.triage !== "drop")
      .sort((a, b) => priority(b) - priority(a));
    let spent = 0;
    for (const t of queue) {
      const c = topicCostMin(t);
      if (spent + c <= budgetMin) spent += c;
      else {
        cut.add(t.id);
        saved += c;
      }
    }
  }
  // 분 단위는 추정치라 노출하지 않고, 전체 대비 절약 비율(%)만 반환.
  const total = topics.reduce((s, t) => s + topicCostMin(t), 0);
  const savedPct = total > 0 ? Math.round((saved / total) * 100) : 0;
  return { cut, savedPct };
}
