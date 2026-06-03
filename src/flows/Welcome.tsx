// 1회성 환영 온보딩 (plan.md §3.5① 첫인상) — 무엇을 하는 도구인지 3줄로.
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/optimeta-logo.png";

export function Welcome({ onNewCourse, onClose }: { onNewCourse: () => void; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" />
      <div className="frost anim-panel relative max-h-[92%] w-[min(94%,460px)] overflow-auto rounded-2xl border p-7 text-center">
        <img src={logoUrl} alt="OPTIMETA" className="mx-auto mb-4 size-12 rounded-xl" />
        <p className="text-xl">Exam Radar</p>
        <p className="mt-1 text-sm text-muted-foreground">공부는 적게, 점수는 높게</p>

        <div className="mt-5 space-y-2 text-left text-sm text-muted-foreground">
          <p>① 강의 녹음을 연결하면, 교수가 강조한 부분에서 <b className="text-foreground">시험에 나올 토픽</b>을 뽑아냅니다.</p>
          <p>② <b className="text-foreground">훑어 정하기</b>로 아는 것과 모르는 것을 빠르게 가르면,</p>
          <p>③ <b className="text-foreground">지금 무엇을 공부하고 무엇을 버릴지</b>를 지도로 보여 줍니다.</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            예시 둘러보기
          </Button>
          <Button size="sm" onClick={onNewCourse}>
            새 코스 만들기
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          “선형대수”는 둘러보기용 예시입니다.
        </p>
      </div>
    </div>
  );
}
