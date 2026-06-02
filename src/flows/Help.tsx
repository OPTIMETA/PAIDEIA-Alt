// 사용법 도움말 (plan.md §3.5 첫인상) — 헤더 토글로 언제든 여는 풀 사용 가이드 팝업.
// Welcome(1회성 3줄 온보딩)과 달리, 맵 읽는 법·인터랙션까지 담는 레퍼런스.
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS: { n: string; t: string; d: string }[] = [
  {
    n: "①",
    t: "연결 · 수집",
    d: "강의 녹음(노트)을 코스에 연결하고 ‘수집’. 교수가 강조·반복한 부분에서 시험에 나올 토픽을 뽑습니다.",
  },
  {
    n: "②",
    t: "오늘의 컷",
    d: "시험확률 높은 순으로 토픽을 하나씩. 한 번의 선택이 자신감(앎/모름)과 킵·컷을 동시에 입력합니다.",
  },
  {
    n: "③",
    t: "학습 로드맵",
    d: "지금 할 것(골드존)·버린 것·절약 시간을 1페이지로. 복사해서 공유할 수 있습니다.",
  },
];

const ZONES: { k: string; d: string; hot?: boolean }[] = [
  { k: "🔥 지금 (골드존)", d: "시험 잘 나오는데 아직 약함 → 지금 할 것", hot: true },
  { k: "이미 안전", d: "잘 아는데 시험엔 덜 나옴 → 유지만" },
  { k: "버려도 안전", d: "시험도 약하고 잘 안 나옴 → 버려도 됨" },
  { k: "미평가", d: "아직 분류 안 한 토픽 (맨 아래 띠)" },
];

const TIPS: [string, string][] = [
  ["노드 드래그", "위치 재조정 — 자신감·킵/컷 직접 수정"],
  ["노드 클릭", "증거 드로어 — 교수 발화 인용·타임스탬프"],
  ["호버", "연결된 토픽 강조"],
  ["🎙 표시", "교수가 강조한 시험 신호 있음"],
  ["예산 슬라이더", "공부 시간 한도(분) — 로드맵이 그 안에서 추립니다"],
];

export function Help({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" onClick={onClose} />
      <div className="frost anim-panel relative max-h-[92%] w-[min(94%,560px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">사용법</p>
            <p className="text-xl font-normal">Exam Radar 쓰는 법</p>
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

        <p className="mb-5 text-sm text-muted-foreground">
          강의 녹음에서 <b className="text-foreground">시험에 나올 토픽</b>을 뽑고,{" "}
          <b className="text-foreground">지금 뭘 공부하고 뭘 버릴지</b>를 시험일까지 결정합니다. 퀴즈가 아니라 결정.
        </p>

        {/* 3단계 흐름 */}
        <div className="mb-6 space-y-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-3 rounded-lg border p-3">
              <span className="text-base text-muted-foreground">{s.n}</span>
              <div className="min-w-0">
                <p className="text-sm">{s.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 맵 읽는 법 */}
        <p className="text-sm">맵 읽는 법</p>
        <p className="mb-2 text-xs text-muted-foreground">X → 시험확률(교수 발화·반복) · Y ↑ 자신감</p>
        <div className="mb-6 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ZONES.map((z) => (
            <div key={z.k} className="rounded-lg border p-2.5">
              <p className="text-xs" style={z.hot ? { color: "var(--accent-1)" } : undefined}>
                {z.k}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{z.d}</p>
            </div>
          ))}
        </div>

        {/* 인터랙션 */}
        <p className="mb-2 text-sm">맵에서 할 수 있는 것</p>
        <div className="mb-6 space-y-1.5">
          {TIPS.map(([k, v]) => (
            <div key={k} className="flex gap-3 text-xs">
              <span className="w-24 shrink-0 text-foreground">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">공부 적게, 점수 더.</p>
          <Button size="sm" onClick={onClose}>
            이해했어요
          </Button>
        </div>
      </div>
    </div>
  );
}
