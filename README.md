<p align="center">
  <img src="./public/optimeta-logo.png" width="76" alt="OPTIMETA">
</p>

<h1 align="center">Exam Radar · 시험 레이더</h1>

<p align="center">
  <strong>공부 적게, 점수 더.</strong><br>
  <em>강의 녹음에서 “무엇을 공부하고 무엇을 버릴지”를 시험일까지 결정하는, 강의가 쌓일수록 자라나는 <strong>2D 결정 맵</strong>. 퀴즈가 아니라 결정.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Alt-Plugin-000000?style=flat-square&labelColor=000000&color=000000" alt="Alt Plugin">
  <img src="https://img.shields.io/badge/alt--plugin--sdk-0.2-000000?style=flat-square&labelColor=000000&color=333333" alt="alt-plugin-sdk">
  <img src="https://img.shields.io/badge/React-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-000000?style=flat-square&logo=typescript&logoColor=white&labelColor=000000" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-000000?style=flat-square&logo=vite&logoColor=white&labelColor=000000" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-000000?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=000000" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/D3-000000?style=flat-square&logo=d3dotjs&logoColor=white&labelColor=000000" alt="D3">
  <img src="https://img.shields.io/badge/Vercel%20AI%20SDK-000000?style=flat-square&logo=vercel&logoColor=white&labelColor=000000" alt="Vercel AI SDK">
  <img src="https://img.shields.io/badge/Zod-000000?style=flat-square&logo=zod&logoColor=white&labelColor=000000" alt="Zod">
  &nbsp;
  <img src="https://img.shields.io/badge/status-Phase%200%20·%20Wedge-333333?style=flat-square&labelColor=000000&color=333333" alt="Status">
</p>

<p align="center">
  <a href="https://github.com/TaewoooPark/PAIDEIA"><strong>PAIDEIA</strong> — 본제품 · Claude Code 플러그인</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/TaewoooPark/PAIDEIA-codex"><strong>PAIDEIA-codex</strong> — Codex CLI 에디션</a>
  &nbsp;·&nbsp;
  <a href="./docs/plan.md">기획서 (master plan)</a>
  &nbsp;·&nbsp;
  <a href="https://taewoopark.com">taewoopark.com</a>
</p>

> **이건 “제품”이 아니라 “쐐기”입니다.** Exam Radar는 Optimeta의 MVP인 **PAIDEIA Study OS**(v1 Claude Code 플러그인 / v3 데스크톱 앱)로 가는 깔때기 최상단의 **인지·전환 쐐기**입니다. 깊은 드릴·채점·반복 루프는 본제품에 있고, 이 플러그인은 그 영혼의 **한 입 — “결정”까지만** 보여줍니다.

> **결정 엔진이지, 퀴즈 생성기가 아닙니다.** Alt 기본 플러그인엔 이미 퀴즈 생성기가 있습니다. “또 다른 퀴즈”는 2등입니다. Exam Radar는 콘텐츠를 *만들지* 않고, 무엇이 중요한지를 *결정*합니다 — 그리고 무엇을 **버려도 되는지**까지 말해 줍니다.

<p align="center">
  <em>교수가 3시간을 떠들어도 시험 신호는 30분에 몰려 있습니다.<br>
  Exam Radar는 그 30분을 찾아 주고, 나머지 2시간 30분을 <strong>버려도 된다</strong>고 말해 줍니다.</em>
</p>

<p align="center">
  <img src="./docs/media/exam-radar.jpg" alt="Exam Radar — 2D 결정 맵" width="100%">
</p>

---

## “결정”이라는 이름에 대하여

레이더는 모든 것을 똑같이 그리지 않습니다. **신호와 잡음을 가르고**, 다가오는 것만 밝게 띄웁니다. Exam Radar가 시험 준비에 하는 일이 정확히 그것입니다.

대부분의 학습 도구는 *콘텐츠를 늘립니다* — 문제를 더 만들고, 요약을 더 뽑습니다. 그래서 공부할 표면이 더 넓어집니다. Exam Radar는 반대로 갑니다. **공부할 표면을 줄입니다.**

```
   강의 녹음 ──▶ 시험 신호 추출 ──▶ 2D 결정 맵 ──▶ 오늘의 컷 ──▶ 학습 로드맵
       ▲                                                              │
       └──────────────── 강의가 쌓일수록 맵이 자란다 ───────────────────┘
```

각 단계의 결과물은 “더 많은 공부거리”가 아니라 **하나의 결정**입니다: *지금 이걸 하고, 저건 버려라.*

---

## 퀴즈 생성기가 하지 못하는 것

퀴즈 생성기·일반 학습툴은 *당신의 시험*에 맞춰 **버릴 것을 골라 주지 못합니다** — 그들이 파는 상품이 “콘텐츠를 늘리는 일”이기 때문입니다. 공부를 줄이는 도구는 자기 사업을 부정해야 만들 수 있습니다.

| 축 | **Exam Radar** | 퀴즈 생성기 / 일반 학습툴 |
|----|----------------|----------------------------|
| 무엇이 중요한가 | 교수 발화·반복 빈도 = **시험확률**로 가중 | 모든 내용 균등 |
| 무엇을 **버릴까** | “이건 버려도 안전”을 **명시** (함정존) | 절대 못 함 — 일을 *늘리는* 게 본업 |
| 단위 | **코스 전체**를 한 시험까지 운영 (강의 누적) | 문서·세션 1개 단위 |
| 출력 | **결정**(작전): 지금 할 것 / 버릴 것 / 절약 시간 | 콘텐츠(문제 더미) |
| 시간 제약 | D-day·시간 예산으로 자동 추림 | 마감 개념 없음 |
| 신호의 출처 | 당신 *교수님*의 그 강의 녹음 | 범용 교과서 / 실러버스 |
| 방향 | 공부를 **줄임** (study-less) | 공부를 *늘림* |

어떤 퀴즈 생성기도 *“4.2절은 건너뛰어도 된다”*고 말하지 못합니다. Exam Radar의 첫 가치가 바로 그 한 문장입니다.

---

## 핵심 원리: 교수의 발화가 곧 출제 신호

대부분의 “똑똑하게 공부하는 법”은 사각지대부터 메우라고 합니다. 그러나 방향이 **반대**입니다. 교수님은 이미 **어디가 시험 포인트인지 말해 주셨습니다** — 강의에서 강조하고, 반복하고, “이건 중요하다”고 짚는 그 순간들로요.

Exam Radar는 강의 녹음 전사에서 그 **발화 신호**를 뽑아 두 축으로 격상합니다.

- **X축 = 시험확률** — 교수 발화·반복 빈도. 강의가 쌓일수록(누적) 같은 패턴이 3번째 반복되면 확률이 오릅니다.
- **Y축 = 자신감** — “오늘의 컷”에서 당신이 한 번의 선택으로 입력합니다.

이 두 축이 만나 **4분면 결정 매트릭스**가 됩니다.

---

## 2D 결정 맵 — 이 플러그인의 심장

```
                        ▲  자신감 높음
                        │
     ✅ 이미 안전         │        유지만
                        │
  시험확률 낮음  ◀────────┼────────▶  시험확률 높음
                        │
     ⚠️ 버려도 안전       │   🔥 지금 (골드존) ← 지금 할 단 하나
                        │
                        ▼  자신감 낮음
```

| 사분면 | 위치 (X · Y) | 뜻 | 행동 |
|--------|-------------|-----|------|
| 🔥 **지금 (골드존)** | 시험확률 높음 · 자신감 낮음 | 잘 나오는데 아직 약함 | **지금 할 단 하나** |
| 유지만 | 높음 · 높음 | 잘 나오고 이미 앎 | 가볍게 유지 |
| ✅ 이미 안전 | 낮음 · 높음 | 잘 안 나오는데 이미 앎 | 신경 끄기 |
| ⚠️ **버려도 안전** | 낮음 · 낮음 | 안 나오고 아직 약함 | **버려도 안전** ← 어떤 툴도 감히 못 하는 말 |

노드의 **크기 = 시험확률**, **위치 = 결정**, **연결선 = 같은 강의에서 함께 나온 토픽**. 🎙 마커는 교수가 그 토픽을 강조한 발화가 있다는 신호입니다.

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./docs/media/triage.jpg" alt="오늘의 컷 — triage 세션">
      <br><sub><b>오늘의 컷</b> — 시험확률 높은 순으로 한 장씩, 한 번의 선택이 자신감 + 킵/컷을 동시에 입력</sub>
    </td>
    <td align="center" width="50%">
      <img src="./docs/media/roadmap.jpg" alt="학습 로드맵 — 작전 출력">
      <br><sub><b>학습 로드맵</b> — 지금 할 것(골드존) · 버린 것 · 절약 시간을 1페이지로</sub>
    </td>
  </tr>
</table>

---

## 맵에 가하는 “동사”들

기능을 늘리는 대신, **하나의 객체(맵)에 가하는 동사**를 늘렸습니다. 각 동사는 PAIDEIA 세 기둥(**Signal**·**Decide**·**Constraint**)의 플레이어블 미니어처입니다.

| 동사 | UI | 하는 일 | 기둥 |
|------|----|---------|------|
| **연결 · 수집** | 새 코스 → 강의 노트 연결 → *수집* | 교수 발화에서 시험에 나올 토픽을 추출 | Signal |
| **오늘의 컷** | `오늘의 컷` | 시험확률 순 1장씩 — 한 번의 선택 = 자신감 + 킵/컷 | Decide |
| **학습 로드맵** | `학습 로드맵` | 지금 할 것 · 버린 것 · 절약 시간을 1페이지로(복사 가능) | Constraint |
| **증거** | 노드 클릭 | 교수 발화 인용 + 타임스탬프 드로어 (Alt에선 원천 노트로 점프) | Signal |
| **예산** | 헤더 슬라이더 | 공부 시간 한도(분) → 로드맵이 그 안에서 추림 | Constraint |
| **갭** | `갭` | “가르친 것 vs 시험낼 것” — 시험 신호 없는 토픽을 흐리게 | Signal |
| **드래그** | 노드 끌기 | 위치를 직접 옮겨 자신감·킵/컷을 손으로 수정 | Decide |

> **Loop(루프)는 일부러 보류했습니다.** “예측 vs 실제”로 *당신을 학습하는* 진짜 피드백 루프는 본제품 PAIDEIA Study OS에 있습니다. 쐐기는 Signal을 완전히, Constraint를 라이트로 보여주고 멈춥니다.

---

## A + C — 버리는 도구, 자라는 코스

- **A — 버리기 (study-less).** 교수가 3시간 떠들어도 시험 신호는 30분에 몰립니다 → “여기 집중 / **여기는 버려도 된다**”. *버리는 것 자체가 핵심 가치*입니다.
- **C — 코스가 자란다 (accrue).** 퀴즈 생성기는 문서 1개 단위입니다. Exam Radar는 *과목 전체를 한 시험까지 운영* → 녹음이 쌓일수록 “이 패턴 3번째 반복 = 시험확률 ↑” 같은 **코스 레벨 핫존**이 자랍니다.

이 둘의 융합이 “자라나는 2D 결정 맵”입니다. **공부 적게, 점수 더** — 카피하려면 자기 제품(콘텐츠 늘리기)을 부정해야 하므로 구조적 해자가 됩니다.

---

## 설치 & 개발

> Alt 플러그인은 **샌드박스 정적 웹 번들**입니다. 최종 산출물은 `dist/`이고, Alt가 `dist/manifest.json`을 읽어 `index.html`을 `alt-plugin://` 프로토콜로 띄웁니다.

```bash
pnpm install
pnpm dev        # 로컬 브라우저 프리뷰 (window.alt 없음 → 일부 호출은 프리뷰 목으로 대체)
pnpm build      # dist/ 생성 (유효한 dist/manifest.json 포함)
pnpm typecheck
pnpm check      # 포맷·린트
```

**Alt에 설치**: `Settings → Plugins → Create your own plugin → Install from local folder` → 빌드된 `dist/` 폴더 선택.

로컬 프리뷰는 UI·상호작용 확인용입니다. `alt.ai.*`, `alt.notes.*`, `alt.storage.*` 같은 호스트 호출은 Alt 런타임에서만 실제로 동작합니다.

---

## 스택 & 아키텍처

- **샌드박스**: 격리된 `WebContentsView`, 엄격한 CSP. `Node`/`fs`/임의 HTTP 없음. 호스트와의 유일한 통로는 `window.alt` 브릿지(타입 안전 프록시 = [`alt-plugin-sdk`](https://www.npmjs.com/package/alt-plugin-sdk)).
- **추출 파이프라인**: `alt.ai`(OpenAI 호환) + Vercel **AI SDK `generateObject`** 로 전사 → **Zod 스키마** 구조화 출력. 토픽·시험확률·교수 발화 인용을 한 번에 뽑습니다.
- **저장**: `alt.storage` 위 **append-only** `course:*` 레포(코스 누적 = moat의 라이트 시연). 키는 `^[a-zA-Z0-9._:-]+$`.
- **결정 맵**: `d3-force`(`forceX`/`forceY`로 데이터 좌표 앵커 + `forceCollide`) + React/SVG 하이브리드. 시뮬레이션은 라이브 애니메이션(크기·데이터 변경 시 부드럽게 글라이드).
- **권한 (최소 선언)**: `storage`, `notes:read`, `notes:select`, `ai:chat`, `events:subscribe`, `settings:read`.

```
src/
├── App.tsx              # 멀티코스 셸 · 헤더 · 2D 맵 호스팅
├── viz/DecisionMap.tsx  # d3-force 4분면 결정 맵 (드래그=결정, 호버=연결, 클릭=증거)
├── flows/               # 오늘의 컷(TriageSession) · 학습 로드맵(OpsMap) · 새 코스 · Welcome · Help
├── pipeline/            # 전사 → 토픽·시험점 수집(collect)
├── alt/                 # storage · courses · ai · client (SDK 경계)
└── lib/                 # schemas(zod) · i18n · demo
```

---

## 디자인

NODEPROMPT 라이트 에디토리얼 형식: 캔버스 `#f2f2f2` · 띄운 패널 근사-흰 `#fafafa` · 헤어라인 보더 · **DM Sans 300** · 단일 흑 accent(`#1a1a1a`) · 위험 `#c00`. **순수 흑/백(#000/#fff)은 쓰지 않습니다.**

- **타입 스케일**: 5단계(12 · 14 · 16 · 20 · 24)로 통일, **자간 −5%** 전역.
- **모션**: 호버 포커싱 · 노드 이동 · 모달 등장 모두 부드러운 ease-out(200–240ms), `prefers-reduced-motion` 대응.
- **밀도**: 데스크톱 앱 내부에 사는 UI. 마케팅 페이지가 아니라 *앱*처럼.

기본 Alt 창(레티나, CSS 폭 ≈ 1000px)에 맞춰 반응형 최적화돼 있습니다.

---

## 포지셔닝 — 쐐기, 제품이 아니다

```
   Alt 쐐기(Exam Radar)  ──▶  waitlist  ──▶  v1 (Claude Code 플러그인)  ──▶  v3 (데스크톱 앱)
   "결정"까지 무료              관심 등록        드릴·채점·PLOM·moat            full Study OS
```

깊이(드릴·채점·feedback 루프·12개 append-only 데이터 자산)는 **제품의 업셀**입니다. 이 플러그인은 Optimeta의 더 큰 thesis — *“노력을 마감까지 최적 배분한다”* — 를 시험이라는 가장 날카로운 사례로 심는 **첫 깃발**입니다.

> 자세한 전략·기능 매트릭스·로드맵은 [`docs/plan.md`](./docs/plan.md)(마스터 기획서)를 보세요.

---

## 상태 & 로드맵

**Phase 0 — 스캐폴드 + 코어 결정 맵.** 구현됨: 멀티코스, 2D 결정 맵(드래그·호버·증거), 오늘의 컷, 학습 로드맵, 예산, 갭 모드, 수집 파이프라인, 사용법 도움말, 디자인 시스템. 로드맵·런칭 타이밍은 기획서 §10·§13 참조. (전환 CTA/waitlist는 URL 확정 시 연결 — 현재 보류.)

---

## 연결

**OPTIMETA** — *Optimization × Meta* = 노력의 메타 최적화.
[본제품 PAIDEIA](https://github.com/TaewoooPark/PAIDEIA) · [PAIDEIA-codex](https://github.com/TaewoooPark/PAIDEIA-codex) · [taewoopark.com](https://taewoopark.com)

<p align="center"><sub><em>퀴즈를 더 만들지 마라. 무엇을 공부하고 무엇을 <strong>버릴지</strong>부터 정하라.</em></sub></p>
