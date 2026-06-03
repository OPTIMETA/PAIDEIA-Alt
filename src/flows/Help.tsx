// 사용법 도움말 (plan.md §3.5 첫인상) — 헤더 토글로 언제든 여는 풀 사용 가이드 팝업.
// Welcome(1회성 3줄 온보딩)과 달리, 맵 읽는 법·인터랙션까지 담는 레퍼런스.
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS: { n: string; t: string; d: string }[] = [
  {
    n: "①",
    t: "강의 연결",
    d: "강의 녹음을 코스에 연결하면, 교수가 강조하고 반복한 부분에서 시험에 나올 토픽을 뽑아냅니다.",
  },
  {
    n: "②",
    t: "훑어 정하기",
    d: "시험 확률이 높은 순서로 토픽을 하나씩 보여 줍니다. 한 번 고르면 자신감과 남길지 버릴지가 함께 정해집니다.",
  },
  {
    n: "③",
    t: "학습 로드맵",
    d: "지금 할 것과 버린 것, 아낀 시간을 한 페이지로 정리해 줍니다. 복사해서 공유할 수 있습니다.",
  },
];

const ZONES: { k: string; d: string; hot?: boolean }[] = [
  { k: "🔥 지금 (골드존)", d: "잘 나오는데 아직 약한 곳, 지금 할 곳", hot: true },
  { k: "이미 안전", d: "잘 아는데 시험엔 덜 나오는 곳, 신경 안 써도 됨" },
  { k: "버려도 안전", d: "잘 안 나오고 아직 약한 곳, 버려도 됨" },
  { k: "미평가", d: "아직 정하지 않은 토픽, 오른쪽 목록에 모입니다" },
];

const TIPS: [string, string][] = [
  ["노드 끌기", "위치를 옮겨 자신감과 남길지 버릴지를 고칩니다"],
  ["노드 누르기", "교수의 발언 원문과 그 시점을 봅니다"],
  ["올려놓기", "연결된 토픽을 강조합니다"],
  ["🎙 표시", "교수가 강조한 대목이 있다는 뜻"],
  ["시간 예산", "공부할 시간을 정하면 그 안에 맞게 추려 줍니다"],
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
          <b className="text-foreground">지금 무엇을 공부하고 무엇을 버릴지</b>를 시험일까지 정해 줍니다. 퀴즈가 아니라 결정입니다.
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

        {/* 지도 읽는 법 */}
        <p className="text-sm">지도 읽는 법</p>
        <p className="mb-2 text-xs text-muted-foreground">가로는 시험 확률(교수가 강조하고 반복한 정도), 세로는 자신감입니다</p>
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
        <p className="mb-2 text-sm">지도에서 할 수 있는 일</p>
        <div className="mb-6 space-y-1.5">
          {TIPS.map(([k, v]) => (
            <div key={k} className="flex gap-3 text-xs">
              <span className="w-24 shrink-0 text-foreground">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">공부는 적게, 점수는 높게.</p>
          <Button size="sm" onClick={onClose}>
            이해했어요
          </Button>
        </div>
      </div>
    </div>
  );
}
