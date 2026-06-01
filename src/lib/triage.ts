// 결정 분류 + D-day (plan.md §3.1).
import type { TriageState } from "@/lib/schemas";

/** (시험확률, 자신감) → 4분면 triage 상태. */
export function triageFor(examProb: number, confidence: number | null): TriageState {
  if (confidence === null) return "unrated";
  const highProb = examProb >= 0.5;
  const highConf = confidence >= 2;
  if (highProb && !highConf) return "gold"; // 지금 당장
  if (highProb && highConf) return "keep"; // 유지만
  if (!highProb && highConf) return "safe"; // 이미 안전
  return "trap"; // 버려도 안전
}

/** 시험일까지 D-N 문자열. */
export function dDay(examDate: string | null): string {
  if (!examDate) return "—";
  const ms = new Date(`${examDate}T00:00:00`).getTime() - Date.now();
  const d = Math.ceil(ms / 86_400_000);
  return d >= 0 ? `D-${d}` : `D+${-d}`;
}
