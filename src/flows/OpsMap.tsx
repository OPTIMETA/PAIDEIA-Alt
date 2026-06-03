// 학습 로드맵 (plan.md §3.5 출력) — triage 결과 1페이지: 지금 할 것(골드존) · 버려도 안전 · 전체 대비 절약 비율.
// 복사 폼은 PAIDEIA(Claude Code/Codex) 분석·임포트용으로 형식을 고정한다(exam-radar:v1 마커).
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dDay } from "@/lib/triage";
import type { Topic } from "@/lib/schemas";

const pct = (t: Topic) => Math.round(t.examProb * 100);
const byProb = (a: Topic, b: Topic) => b.examProb - a.examProb;

export function OpsMap({
  topics,
  examDate,
  courseName,
  signalCounts,
  onClose,
}: {
  topics: Topic[];
  examDate: string | null;
  courseName: string;
  signalCounts?: ReadonlyMap<string, number>;
  onClose: () => void;
}) {
  const now = topics.filter((t) => t.triage === "gold").sort(byProb);
  const strong = topics.filter((t) => t.triage === "keep" || t.triage === "safe").sort(byProb);
  const dropped = topics.filter((t) => t.triage === "trap" || t.triage === "drop").sort(byProb);
  // 분 단위 시간 추정은 가짜라 쓰지 않고, 전체 토픽 중 버려도 되는 비율(%)만.
  const savedPct = topics.length > 0 ? Math.round((dropped.length / topics.length) * 100) : 0;

  // PAIDEIA 분석/임포트용 고정 폼 (markdown + exam-radar:v1 마커, "이름 · 시험확률 N%" 필드).
  const sig = (t: Topic) => ((signalCounts?.get(t.id) ?? 0) > 0 ? " · 🎙" : "");
  const lines = (arr: Topic[], ranked: boolean, withSig = false) =>
    arr.length > 0
      ? arr.map((t, i) => `${ranked ? `${i + 1}.` : "-"} ${t.name} · 시험확률 ${pct(t)}%${withSig ? sig(t) : ""}`)
      : ["(없음)"];
  const summary = [
    `# Exam Radar 작전 — ${courseName}`,
    `<!-- exam-radar:v1 source=alt -->`,
    ``,
    `- 코스: ${courseName}`,
    `- 시험까지: ${dDay(examDate)}`,
    `- 토픽: 총 ${topics.length}개 (골드존 ${now.length} · 버려도 안전 ${dropped.length})`,
    `- 버려도 안전 비중: 전체의 ${savedPct}%`,
    ``,
    `## 지금 할 것 — 골드존 (시험확률 높음 · 아직 약함)`,
    ...(now.length > 0 ? lines(now, true, true) : ["(아직 없음 — ‘훑어 정하기’로 분류하세요)"]),
    ``,
    `## 이미 다진 것 (잘 알거나 시험에 덜 나옴)`,
    ...lines(strong, false),
    ``,
    `## 버려도 안전 (안 해도 되는 것)`,
    ...lines(dropped, false),
    ``,
    `---`,
    `출처: OPTIMETA · Exam Radar(Alt). 더 깊은 반복 학습·채점은 PAIDEIA / PAIDEIA-codex에서.`,
  ].join("\n");

  const copy = () => {
    void navigator.clipboard?.writeText(summary);
  };

  return (
    <div className="absolute inset-0 z-30 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" />
      <div className="frost anim-panel relative max-h-[88%] w-[min(94%,560px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              학습 로드맵 · {courseName} · {dDay(examDate)}
            </p>
            <p className="text-xl font-normal">지금 할 것</p>
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

        <div className="mb-5 space-y-2">
          {now.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              골드존이 아직 비어 있어요. 훑어 정하기로 분류해 보세요.
            </p>
          ) : (
            now.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="mono text-sm font-normal" style={{ color: "var(--accent-1)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-normal">{t.name}</span>
                {(signalCounts?.get(t.id) ?? 0) > 0 ? (
                  <span className="text-xs" title="교수 강조">
                    🎙
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">{Math.round(t.examProb * 100)}%</span>
              </div>
            ))
          )}
        </div>

        <div className="mb-5 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <span className="font-normal text-foreground">버려도 안전</span> · {dropped.length}개 · 전체의{" "}
          {savedPct}%
          <p className="mt-1 line-clamp-2">{dropped.map((t) => t.name).join(", ") || "없음"}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" onClick={copy}>
            <Copy className="size-4" /> 복사
          </Button>
          <Button size="sm" onClick={onClose}>
            지도 보기
          </Button>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          복사한 내용을 <b className="text-foreground">PAIDEIA</b>에 붙여넣으면 더 깊은 학습으로
          이어집니다 — Claude Code <span className="mono text-foreground">/paideia:alt</span>, Codex{" "}
          <span className="mono text-foreground">$paideia-alt</span> 바로 뒤에.
        </p>
      </div>
    </div>
  );
}
