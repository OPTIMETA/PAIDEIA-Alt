# Paideia for Alt — **Exam Radar** 기획서 (Plan)

> **상태**: 계획 수립 (Planning) · 작성일 2026-06-01 · 개정 2026-06-02 · 작성 Claude + @TaewoooPark
> **목표 한 줄**: Optimeta의 MVP인 **PAIDEIA Study OS**의 영혼(=*콘텐츠가 아니라 결정* 엔진)을, Alt의 신규 플러그인 생태계 위에 **인지·전환 쐐기**로 심는다. 산출물은 퀴즈가 아니라 **"무엇을 공부하고 무엇을 버릴지"를 시험일까지 운영하는, 강의가 쌓일수록 자라나는 2D 결정 맵.**

> 이 문서는 **Alt 플러그인 한 개**의 기획서다. 회사(Optimeta)·제품(PAIDEIA v1/v3)의 single source of truth는 `Optimeta/PAIDEIA-Architecture-v3.md`이며, 본 쐐기는 그 깔때기 최상단이다 — 제품을 대체하지 않는다.

---

## 0. 결정 사항 (확정)

| 항목 | 결정 | 함의 |
|---|---|---|
| **이 플러그인의 정체** | **Optimeta 인지·전환 쐐기** (제품 아님) | moat(12 데이터 자산)는 Alt 샌드박스에서 원천적으로 못 쌓인다(§1.3). 그러니 *도달·전환*에 최적화한다. parity는 추구하지 않는다. |
| **제품 본질** | **결정(triage) 엔진** | Alt 기본 플러그인에 이미 퀴즈 생성기가 있다. "또 다른 퀴즈"는 2등 = 인지 실패. 우리는 콘텐츠를 *만들지* 않고 무엇이 중요한지 *결정*한다. |
| **형태** | **자라나는 2D 결정 맵** (A+C 융합) | A=버리기(study-less), C=강의 누적. X축 시험확률, Y축 자신감. 4분면 결정 매트릭스(§3.1). |
| **상호작용** | **React, 다양한 동사 — 단 하나의 객체에** | 기능을 늘리지 않고 *맵에 가하는 동사*를 늘린다. 각 동사 = PLOM 한 기둥의 플레이어블 미니어처(§3.4). |
| **스코프** | **2~4일 라이트** (10일 풀포팅 폐기) | moat 안 쌓이는 곳에 노력 안 쓴다. 신생 플랫폼 **런칭 타이밍** 사수가 더 중요. |
| **전환 사다리** | Alt 쐐기 → waitlist → **v1(Claude Code)** → **v3(데스크톱)** | 깊이(드릴·채점·PLOM·moat)는 제품의 업셀. 쐐기는 "결정"까지만. |
| **Repo** | 별도 신규 레포 `paideia-alt` (template fork) | Alt는 React/Vite/pnpm. 독립 배포·마켓플레이스. |

> **한 줄 철학**: *"퀴즈를 더 만들지 마라. 무엇을 공부하고 무엇을 **버릴지**부터 정하라."* — 공부를 *늘리는* 도구(퀴즈)가 아니라 *줄이는* 도구. 이것이 Optimeta(Optimization+Meta = 노력의 메타 최적화)의 깃발이다.

---

## 1. 배경: 왜 "쐐기"이고, 왜 "결정"인가

### 1.1 Optimeta / PAIDEIA의 환원 불가능한 본질
- **PAIDEIA = local-first, eval-driven, agentic Study OS** — 한 학습자가 한 과목을 *시험일까지 운영*. v1=Claude Code 플러그인, v3=React+FastAPI+Tauri 데스크톱.
- **moat는 LLM이 아니라 데이터다**: feedback_pairs, plom_decisions, FSRS 파라미터 등 **12개 append-only 자산**이 사용 시간에 비례해 누적된다. *"Agent는 runtime, LLM은 component."*
- **운영 vs 소비**: NotebookLM/ChatGPT는 *소비*(Q&A). PAIDEIA는 *운영*(run_id·PLOM·시험역산). 이 경계가 정체성.

### 1.2 PAIDEIA의 영혼을 세 기둥으로 (퀴즈 생성기가 못 가진 것)
| 기둥 | PAIDEIA | 퀴즈 생성기 |
|---|---|---|
| **Signal** — 무엇이 중요한가 | exam-probability (교수 발화 + HW 밀도 + 반복) | ❌ 모든 내용 균등 |
| **Constraint** — 무엇이 가능/안전한가 | D-day, 용량, MPC shield(막판 새 주제 금지) | ❌ 마감 개념 없음 |
| **Loop** — 결과로 더 똑똑해지는가 | feedback_pairs(예측 vs 실제), decision ledger | ❌ fire-and-forget |

> 쐐기는 **Signal을 완전히, Constraint를 라이트로** 시연하고 **Loop는 일부러 보류**한다 → "너를 학습하는 진짜 루프는 PAIDEIA에서" = 전환 후크.

### 1.3 왜 Alt 안에 제품 전체를 못 짓나 (= 왜 쐐기여야 하나)
- Alt 플러그인 = **샌드박스 정적 웹 번들. `Node`/`fs`/임의 HTTP 불가.** `window.alt` 브릿지로만 통신.
- ⇒ moat 데이터(harness·PLOM·feedback_pairs)는 fs·백엔드가 필요해 **샌드박스에서 못 쌓인다.**
- ⇒ Claude Code로 데이터를 빼내는 다리도 막힌다(전사는 Alt 노트 안에만 존재, 외부 파일 없음). 살아남는 건 "수동 복붙/이메일 opt-in"뿐.
- **결론**: 두뇌(moat)는 제품에 두고, Alt 플러그인은 **결정의 한 입을 보여주는 무료 미끼**가 된다. 이게 약점이 아니라 *역할 분리*다.

### 1.4 제약이 곧 기회
- Paideia 원본은 수식·손글씨 PDF·비전 OCR 때문에 **STEM에 갇혀** 있었다.
- Alt는 음성전사 네이티브 → **비-STEM 강의(법·의·경제·역사)는 OCR 문제가 아예 없다.** Paideia가 못 건드리던 시장이 Alt에선 가장 쉽다.

---

## 2. 핵심 차별점 — 콘텐츠가 아니라 결정

### 2.1 A(버리기) + C(코스가 자란다)
- **A — 버리기 (study-less)**: 교수가 3시간 떠들어도 시험 신호는 30분에 몰린다 → "여기 집중 / **여기는 버려도 된다**". *버리는 게 핵심 가치.* 퀴즈 생성기는 절대 "4.2절 건너뛰어"라고 못 한다.
- **C — 코스가 자란다**: 퀴즈 생성기는 문서 1개 단위. 우리는 *과목 전체를 한 시험까지 운영* → 녹음이 쌓일수록 "이 패턴 3번째 반복 = 시험확률 ↑" 같은 **코스 레벨 핫존**이 자란다.

### 2.2 "공부 적게, 점수 더" 포지셔닝
- 퀴즈 메이커는 *일을 늘린다*(문제 추가). Optimeta는 *일을 줄인다*(공부 표면 축소). **카피하려면 자기 제품을 부정해야 함** = 구조적 해자.
- 인지 관점: *"퀴즈 만들기"보다 "공부 적게 하는 법"이 압도적으로 바이럴*하다. Show HN / Reddit / 에타 헤드라인이 곧 콘텐츠.

### 2.3 회사 깃발이 앱보다 크다
- "노력을 마감까지 최적 배분"은 시험을 넘어 일반화된다(자격증·면접·발표). 쐐기가 Optimeta의 더 큰 thesis를 심고, PAIDEIA는 그 첫 사례.

---

## 3. 제품: 자라나는 2D 결정 맵 ★ (이 문서의 심장)

### 3.1 중심 객체 — 2D 결정 맵 (4분면)

핫존을 1축(시험확률)에서 **2축**으로 격상한다.
- **X축 = 시험 확률** — 교수 발화 + 반복, 강의 누적(C).
- **Y축 = 내 자신감** — triage 세션에서 스와이프로 입력(§3.4).

```
                  시험확률 높음
                       │
        유지만   ◀─────┼─────▶   🔥 지금 당장 (골드존)
   (높은확률·high)      │        (높은확률·low자신감)
   ────────────────────┼────────────────────  자신감
   ✅ 이미 안전  ◀──────┼─────▶   ⚠️ 버려라 (함정존)
   (낮은확률·high)      │        (낮은확률·low자신감)
                       │
                  시험확률 낮음
```

- **🔥 골드존** (시험확률 높음 × 자신감 낮음): *지금 할 단 하나.* 모든 결정의 목적지.
- **⚠️ 함정존** (시험확률 낮음 × 자신감 낮음): **"못해서 불안하지만 시험엔 안 나온다 → 버려도 안전."** 어떤 툴도 감히 못 하는 말 = A의 정점, 가장 바이럴한 인사이트.

> 이건 *시험판 아이젠하워 매트릭스*다. Y축(자신감)은 PLOM **state estimation(지식 상태)** 기둥의 라이트 시연 — 백엔드 없이 *개인화된* 결정을 보여준다.

### 3.2 척추 — 두 템포 (Accrue / Decide)

플러그인은 두 개의 다른 리듬으로 산다. 이걸 섞으면 파편화된다.

```
ACCRUE (학기 내내 · 수동 · 배경)          DECIDE (시험 직전 · 능동 · 반복)
 강의 녹음(Alt 본연 기능)                 열기 → "D-7 · 지난 후 +5 토픽"
    ↓ transcriptUpdated 구독                  ↓
 플러그인 자동 수집·분석                   오늘의 컷: 스와이프 1회 = 자신감+킵/컷 동시
    ↓                                         ↓
 맵 성장 · 넛지 "🔥 +3 핫존"               예산 슬라이더: 시간만큼 컷라인
    ↓                                         ↓
 열면 '성장 diff' 애니메이션               작전지도 출력 → 공유 / "PAIDEIA로 드릴"
        ╲________________ 끝나면 항상 '맵'으로 복귀 ________________╱
```

- **Accrue = C**: 유저는 *플러그인을 쓰지 않는다.* Alt에서 평소대로 녹음만 하면 플러그인이 `transcriptUpdated`로 조용히 수집해 점점 똑똑해진다. **재진입 후크 = 열면 맵이 자라있는 걸 *본다*(성장 diff).**
- **Decide = A**: 시험이 다가오면 열어서 **한 번의 triage 세션**으로 결정. D-14 → D-7 → D-3 반복하며 더 타이트해진다.

### 3.3 정보구조 — 탭이 아니라 **홈 + 렌즈 + 세션 + 출력**

모든 것이 **맵(홈)으로 돌아온다.** 5개 동등 탭(파편화) 금지.

| 정체 | 무엇 | 위치 |
|---|---|---|
| **홈** | 살아있는 2D 결정 맵 | 항상 중심 |
| **렌즈** (맵 위 토글) | Taught·Tested 오버레이 · 타임라인 스크럽 · 증거 드로어 | 같은 맵을 다르게 봄 |
| **세션** (맵을 잠시 덮음, glass dim) | 오늘의 컷 · 예산 | 끝나면 *바뀐 맵*으로 복귀 |
| **출력** | 작전지도 + 공유 이미지 + 전환 CTA | Decide의 끝 |

### 3.4 인터랙션 = PLOM 기둥의 플레이어블 미니어처 ★

각 동사는 단순 UI가 아니라 **moat 엔진(PLOM)의 한 조각을 손으로 만지는 데모**다. 그래서 "다양한 인터랙션"이 곧 "Optimeta만의 것"이 된다.

| 인터랙션 (동사) | 무엇을 하나 | 몰래 시연하는 PLOM 기둥 | React 메커닉 | 위치 |
|---|---|---|---|---|
| **스와이프로 버리기** | 토픽을 "버림"통으로 → 회색화, "절약된 시간" 카운터 ↑ | 학습 표면 축소 (A의 본질) | 제스처 + 스프링, optimistic UI | 세션 |
| **드래그로 재조정** | AI 확률에 동의 안 하면 노드를 끌어 올림/내림 | **preference override** (accepted_override 신호) | pointer drag, 위치 영속 | 홈 |
| **시간 예산 슬라이더** | "시험까지 10h" → 안 맞는 토픽 자동 회색화, 핵심만 | **CP-SAT feasibility** (제약 최적화) | 슬라이더 → 실시간 re-layout | 세션 |
| **자신감 스와이프** | 토픽당 안다/모른다 → 노드가 분면 이동 | **state estimation** | 카드 스와이프 → 분면 트랜지션 | 세션 |
| **강의 추가 → 맵 성장** | 새 녹음이 그래프로 날아들고 반복 패턴에 아크, 확률 상향 플래시 | 누적 운영 OS (C의 본질) | 공유요소 전환, force-sim 재배치 | 배경 |
| **타임라인 스크럽** | 학기를 가로질러 맵 진화 재생 | 시간축 운영 | scrubber → 상태 보간 | 렌즈 |
| **증거 드로어** | 핫존 클릭 → 교수 인용 + 타임스탬프 (▶ 오디오 점프) | 투명성/신뢰 | 드로어 + `notes:select` 앵커 | 렌즈 |
| **Taught vs Tested 토글** | 가르친 것 vs 시험낼 것 갭 점등, 내 메모 오버레이 | **Diagnose** (갭 진단) | 렌즈 토글, `alt.notes` 메모 오버레이 | 렌즈 |

> **메시지**: 슬라이더를 당기면 CP-SAT을, 노드를 끌면 preference를, 스와이프하면 state estimation을 *놀이로* 경험한다 → 이건 퀴즈 앱이 아니라 **Optimeta 의사결정 엔진의 플레이어블 데모.** 가장 정직하고 가장 잘 전환되는 애피타이저.

### 3.5 유저 플로우 (end-to-end)

**① 첫 30초 — 데모 먼저, 약속 나중 (인지 쐐기라 필수)**
콜드스타트가 느리니(강의 누적 필요) 즉시 보상 경로를 둔다.
1. 설치 직후 → "지금 강의 녹음 **하나만** 골라봐" → 기존 Alt 녹음 1개 분석.
2. **20초 만에 미니 핫존 + '버려도 되는 것'** 표시 = aha.
3. *그 다음에야* "시험일 정하고 나머지 강의 연결 → 전체 맵이 자랍니다" (commit).
4. 시험일 입력 + 코스↔노트 연결 = `course:<id>` 바인딩 동시 해결(§6.1).

**② 학기 (Accrue · 수동)**
강의 녹음 → `transcriptUpdated` → 자동 수집·분석 → 맵 성장 → 넛지 "🔥 +3 핫존" → 열면 성장-diff 애니메이션. *유저는 거의 아무것도 안 한다.*

**③ 시험주 (Decide · 능동 · 반복)**
열기 → "D-7 · 지난 후 +5 토픽" → **오늘의 컷**(토픽을 시험확률 높은 순으로 하나씩, 스와이프 1회가 자신감+킵/컷 동시 입력) → **예산**(슬라이더로 컷라인) → **작전지도**(골드존 N개 + 버린 것 + 절약 시간) → "이거 PAIDEIA로 드릴" CTA + 공유 이미지.

> **콜드스타트·자신감 마찰 해소**: 자신감을 미리 40개 탭하지 않는다. 새 토픽은 맵 하단 **"미평가" 띠**에서 태어나고, triage하면 위로 올라가 2D를 채운다 → *맵의 2D-ness 자체가 진행률 표시*("12/18 분류됨"). 빈 화면이 할 일을 스스로 설명한다.
> **재triage 빠르게**: 지난 자신감 pre-fill → D-3에 다시 열면 *바뀐 것만* 재확인.

### 3.6 화면 레이아웃

**홈 (맵)**
```
┌──────────────────────────────────────────────────────┐
│ 선형대수 · D-7 · ⬆맵이 자랐어요 +3          [작전지도]│ ← glass 상단바
├──┬───────────────────────────────────────────────────┤
│렌│        ◯고유값       🔥대각화                       │
│즈│            ╲        ╱                              │
│  │   ◯내적 ───╳─── ⚠그람슈미트                         │ ← 2D 결정맵 (hero · Lombardi)
│R │                                                    │
│TT│       ◯행렬식              ✅일차독립                │
│타│  ┄┄┄┄ 미평가 토픽 (아직 Y없음) ┄┄┄┄                │ ← 콜드스타트: '미평가' 띠
│임│   ◯위상   ◯특이값분해                               │
├──┴───────────────────────────────────────────────────┤
│              [ 오늘의 컷 시작 ▶ ]                       │ ← 하단 액션 (템포 인식)
└──────────────────────────────────────────────────────┘
```

**오늘의 컷 (세션 · 맵을 glass로 덮음)**
```
┌──────────────────────────────────────────────────────┐
│ 오늘의 컷 · 3/18                            [나가기]  │
│   ┌────────────────────────────┐                     │
│   │  그람슈미트 직교화            │                     │
│   │  🔥 시험확률 높음             │                     │
│   │  "이거 매 시험 나옵니다"       │                     │
│   │  — 교수, 4강 47:01 ▶         │ ← 클릭 시 오디오 점프 │
│   └────────────────────────────┘                     │
│   ◀버려   ↓나중   ▶안다(집중)   ▲모른다(집중)          │
│   각 스와이프 = 자신감 + 킵/컷 동시 입력                │
└──────────────────────────────────────────────────────┘
```

### 3.7 상태 모델 (파편 방지의 마지막 못)
- **영속(`alt.storage`)**: 시험일, courseId↔noteId, 강의별 examPoints, 토픽 노드, **유저 자신감/킵·컷**, 드래그 override, 세션 결과.
- **휘발**: 현재 세션 진행, 레이아웃, 줌/팬.
- **불씨 보존**: override·자신감은 전환 시 PAIDEIA를 seed하는 신호지만 **Alt 안에 로컬 보존**(local-first 유지, 외부 전송 없음).

---

## 4. 개념 매핑 (PAIDEIA → Alt 쐐기)

| PAIDEIA (제품) | Alt 쐐기 대응 | 비고 |
|---|---|---|
| Course 폴더 | **storage `course:<id>`가 마스터**, Alt 폴더는 선택적 뷰 | courseId 기반 → 노트가 흩어져도 매핑 |
| `materials/lectures/*.pdf` | **노트 transcript**(녹음) `notes.getContent().transcript` | ← 1차 재료 (음성) |
| `course-index/coverage.md` (핫존, exam tier) | **2D 결정 맵 X축** (`course:<id>:topics`) | 쐐기의 심장 |
| `/hwmap` (HW 밀도 = 시험 확률) | examPoints(발화) 기반 시험확률 | HW축은 비전 없어 약화(§8), 발화축이 메인 |
| `/weakmap` (약점) | **2D 결정 맵 Y축** (자신감, 유저 입력) | state estimation 라이트 |
| `/cheatsheet` | **작전지도** (triage 출력 1페이지) | 콘텐츠가 아니라 결정 요약 |
| `/quiz /twin /blind /chain /mock` | ❌ **쐐기에 없음** | 드릴=제품의 업셀. 쐐기는 "결정"까지만 |
| `/grade` 채점 | ❌ **쐐기에 없음** | 채점·feedback_pairs=moat, 제품에만 |
| statusline (D-N) | 상단바 D-N 카운트다운 | 시험역산이 조직 원리 |

> **원칙**: 쐐기는 **Signal·Constraint(라이트)·Diagnose(라이트)** 까지. **Practice·Grade·Loop·moat**는 절대 Alt에 두지 않는다 — 그게 제품의 존재 이유이자 업셀.

---

## 5. Alt SDK API — 사용 면면 (✅ SDK 소스 직접 확인, 2026-06-01)

> 출처: `altalt-org/alt-plugin-sdk@main` — `llms.txt` + `src/contracts.ts`(Zod) + `src/ai.ts` 직접 검증. id 식별자는 **number**(noteId/folderId/fileId/componentId).

### 읽기
- `alt.notes.list({ limit?, folderId?, query? })` → `PluginNoteSummary[]`, `listFolders()`
- `alt.notes.getContent(noteId)` → `{ id, title, transcript, memo, summary }` (plaintext/markdown)
- `alt.notes.listComponents({noteId})` / `getComponent({componentId})` → `.contentText`. **구조화 트랜스크립트**(화자·ms)는 transcript 컴포넌트 `JSON.parse(contentText)` → `RawTranscriptEntry[]`(`start`/`end` ms). (`getContent().transcript`는 평문 `[m:ss | Speaker] text`)
- `alt.files.list({noteId})` → `PluginAttachedFile[]` / `read({fileId})` → `{fileName, mimeType, sizeBytes, data: ArrayBuffer}`
- `alt.state.getActiveNoteSummary()`, `alt.settings.get/list`, `alt.locale.get`

### 쓰기 (쐐기는 최소만)
- `alt.notes.setMemo({noteId, markdown})` → 작전지도 미러링(선택)
- `alt.notes.upsertComponent({noteId, componentType, title?, contentText, displayOrder?})` → 싱글톤

### Storage (✅ `get/set/list/delete`)
- `alt.storage.set(key, value)` / `get(key)` → `value|undefined` / `delete(key)` / **`list()` → `Record<key,value>` (전체 반환, 서버측 prefix 쿼리 없음)**
- `PluginStorageValue` = `string|number|boolean|null|[]|{}` → **중첩 OK**, **바이너리 불가.** 키 `^[a-zA-Z0-9._:-]+$` ≤160자. memo/summary/AI content는 각 **500,000자 캡**.

### AI
- `alt.ai.models.list()` → `{ id, name, provider, supportsTools, availability }[]` ← **`supportsTools`가 generateObject 게이트**
- `alt.ai.complete({requestId, model, messages:[{role,content:string}], temperature, maxTokens})` → `{text, finishReason, toolCalls?}`
- `alt.ai.chat.stream({requestId, endpoint:'chat.completions', model, method, headers, body}, {onStart, onChunk:(Uint8Array)=>void, onEnd, onError})` → `.cancel()`
- 모델 예: `'gpt-5.4'` | `'auto'` | `'local'`. 실목록은 런타임 `models.list()`.
- **구조화 출력**: `createAltProvider()` → `createOpenAICompatible({baseURL, fetch: createAltFetch})` 래핑 ✅. `import { generateObject } from 'ai'` + `provider.languageModel(id)` + `schema`. **단 fetch shim은 투명 프록시 → structured output은 상류 모델 `supportsTools`에 종속(§8).**
- ⚠️ **메시지 `content`는 string-only(500k자). 이미지/비전 없음** — 쐐기는 어차피 트랜스크립트 기반이라 영향 작음.

### 이벤트 / 녹음 / 전사
- `alt.events.subscribe(event, cb)` → `Promise<() => Promise<void>>` (async unsubscribe, 반드시 정리). 12종 중 쐐기는 **`transcriptUpdated`(Accrue 핵심) + `componentUpdated` + `noteUpdated`**.
- `alt.recording.start({noteId, lectureLanguage, targetTranslationLanguage, includeSystemAudio, selectedDeviceId?})` → `{ok, sessionId}` / `stop()` / `getStatus()` (선택)
- `alt.transcription.transcribeNote({requestId, noteId, diarization}, {...})` → 미전사 녹음 온디맨드 전사 (선택)

---

## 6. 아키텍처 (쐐기 슬림 버전)

### 6.1 데이터 모델 (`alt.storage`)
파일시스템 없음 → KV 평탄화. 키 `^[a-zA-Z0-9._:-]+$` ≤160자. **모든 구조화 값에 `schemaVersion`.**

```
course:index                  → { schemaVersion, ids:string[] }
course:<id>:meta              → { schemaVersion, name, examDate, lang }
course:<id>:lectures          → [{ noteId, title, status:'ingested|pending', ingestedAt }]
course:<id>:examPoints        → ExamPoint[]  ({ source:'transcript', quote, noteId, timestampMs, topicId, weight })
course:<id>:topics            → Topic[]      ({ id, name, examProb(0-1), confidence:0-3|null, triage:'gold|keep|safe|trap|later|drop|unrated', posOverride?, appearsInNoteIds[] })
course:<id>:session:<ts>      → { budgetMin, goldTopicIds[], droppedTopicIds[], savedMin, planMd }
```

> `storage.list()`는 전체 반환 → 코스 열거는 `course:index` 유지. 대용량 트랜스크립트는 노트에 두고 KV엔 noteId 참조만(바이너리·500k 캡 대응).

### 6.2 AI 파이프라인 (드릴·채점 없음 — 결정만)
1. **수집(Accrue)**: 강의 transcript → `generateObject`로 `topics` + `examPoints`(map). 90분 트랜스크립트는 청킹(세그먼트 윈도우 map → courseId reduce).
2. **누적 재랭킹(reduce)**: 강의 가로질러 **반복 토픽의 examProb 상향**(Lombardi 아크가 몰리는 노드 = 핫존).
3. **결정(client-side)**: triage 스와이프·예산 컷라인은 **AI 없이** 클라이언트 계산. "오늘의 단일 추천" rationale 한 줄만 선택적 AI.
4. **모델 분기**: 수집(품질) → `supportsTools` cloud 모델, rationale(저지연) → 가벼운 모델, `supportsTools:false`(local) → 평문+Zod 파싱 fallback(§8).

---

## 7. manifest.json 권한 (쐐기 최소 선언)

| Permission | 용도 | 필수? |
|---|---|---|
| `storage` | 맵·토픽·결정 영속 | ✅ |
| `notes:read` | 강의 트랜스크립트·memo 읽기 (1차 재료) | ✅ |
| `ai:chat` | 토픽/examPoint 추출 | ✅ |
| `events:subscribe` | `transcriptUpdated` (Accrue 자동 성장) | ✅ |
| `notes:select` | 증거 드로어 → 원천 노트/오디오 점프 | ✅ |
| `settings:read` | `alt.locale` → INTERFACE_LANG 자동 | ✅ |
| `notes:write` | 작전지도를 노트 memo로 미러링 | 선택 |
| `transcription:run` | 미전사 녹음 온디맨드 전사 | 선택 |
| `files:read` | 슬라이드 PDF 텍스트(pdf.js) — 보조 신호 | 선택 |

> 미선언 권한 호출 시 호스트가 `Plugin permission required: ...` throw. **콜사이트와 정확히 일치.** 쐐기는 권한을 *적게* 선언해 신뢰·심사통과·"당신 강의는 당신 기기에" 프라이버시 메시지를 강화한다.

---

## 8. 리스크 & 대응

| # | 리스크 | 대응 |
|---|---|---|
| 1 | **비전 없음 (확정 NO)** — 스캔/수식 PDF 못 읽음 | 쐐기는 트랜스크립트 기반이라 영향 작음. 슬라이드는 텍스트 레이어 있을 때만 보조. |
| 2 | **`generateObject` 상류 모델 종속** | `models.list().supportsTools` 게이팅. `local`(대개 false)이면 평문 프롬프트→`zod.safeParse`→스키마 위반분만 1~2회 재출력 fallback. |
| 3 | **HW 밀도 축 약화** | 비전 없어 HW PDF 못 읽음 → **발화·반복 2축을 메인**, HW는 텍스트화 성공분만 가중. |
| 4 | **콜드스타트(강의 0개)** | 첫 30초 데모 경로(§3.5①) + "미평가" 띠로 빈 상태를 할 일로 전환. |
| 5 | **퀴즈 생성기로 오인 / 카테고리 혼동** | UI·카피 전부 "결정/버리기"로. 절대 문제를 *생성*하지 않는다. |
| 6 | **제품 잠식** | Loop·드릴·채점은 쐐기에서 보류 → 명확히 "애피타이저". |
| 7 | **이벤트 unsubscribe 누수** | 창 생명주기 동안 누적 주의, 반드시 정리. |
| 8 | **대용량 트랜스크립트 컨텍스트 초과** | §6.2 청킹(map-reduce). |
| 9 | **AI 호출 비용/지연 (Accrue 자동)** | 강의 1회당 1배치(전체 transcript)로 제한, 디바운스. Live 실시간 추출은 쐐기 범위 밖. |

---

## 9. 기능 매트릭스 — "동사" 단위 (커맨드 아님)

| 동사 / 화면 | 설명 | 난이도 | Phase |
|---|---|---|---|
| 첫 30초 데모 | 녹음 1개 → 미니 핫존 | 중 | P1 |
| New Course | 시험일 + 노트 연결 → `course:<id>` | 하 | P1 |
| 수집(Accrue) | `transcriptUpdated` 구독 → topics/examPoints 생성 | 상 | P1 |
| 2D 결정 맵 (홈) | Lombardi 4분면, 드래그-재조정 | 상 | P2 |
| 성장 diff | 새 강의 → 맵 애니메이션 + 넛지 | 중 | P2 |
| 오늘의 컷 (세션) | 스와이프=자신감+킵/컷 | 중 | P2 |
| 예산 슬라이더 | 시간 컷라인 (CP-SAT 라이트) | 중 | P3 |
| 증거 드로어 | 인용+타임스탬프 ▶오디오 | 하 | P3 |
| Taught vs Tested | 갭 + 메모 오버레이 | 중 | P3 |
| 작전지도 + 공유 | 1페이지 + 브랜드 이미지 + CTA | 중 | P3 |
| 타임라인 스크럽 | 맵 진화 재생 | 중 | P4(선택) |

---

## 10. 로드맵 (2~4일 쐐기 · 런칭 타이밍 사수)

- **Phase 0 — 스캐폴드 (0.5d)**: 템플릿 clone, `llms.txt` 정독, manifest 권한 초안, storage zod 스키마(+`schemaVersion`), `window.alt` 가드 + 로컬 프리뷰 목, **디자인 토큰(§14) 셋업**(Pretendard, 팔레트, 자간 -5%), i18n 스캐폴드. **런타임 스파이크**: `models.list().supportsTools` 분기 + `generateObject` 실호출 1건 + transcript `JSON.parse` 라운드트립.
- **Phase 1 — 수집 + 첫 인상 (1d)**: New Course(시험일+노트 연결), `transcriptUpdated` 수집, topics/examPoints 생성, **첫 30초 데모 경로**. → *데모: 녹음 하나에서 핫존과 '버려도 될 것'이 나온다.*
- **Phase 2 — 결정 맵 + 오늘의 컷 (1~1.5d)**: 2D Lombardi 맵, 드래그-재조정, 성장 diff, 오늘의 컷 세션(스와이프=자신감+킵/컷). → *데모: 강의가 쌓일수록 맵이 자라고, 한 번의 컷으로 골드존이 나온다.*
- **Phase 3 — 제약 + 출력 + 전환 (1d)**: 예산 슬라이더, 증거 드로어(오디오 점프), Taught vs Tested, 작전지도 + 공유 이미지 + waitlist/CTA. → *데모: 시간만큼 컷, 작전지도 공유, "PAIDEIA로 드릴".*
- **Phase 4 — 마감 + 런칭 (0.5d)**: i18n 번역, 에러/빈/권한 상태, `pnpm build`, 로컬 설치 검증, **마켓플레이스 메타 + 런치 자료**(§11).

> 추정 총 **~3.5~4일**. 신생 플랫폼 featuring 윈도우를 잡는 게 parity보다 가치 크다.

---

## 11. GTM — 인지 & 전환 (이 플러그인의 목적)

### 11.1 인지 레버
| 레버 | 작동 | Optimeta BP 연결 |
|---|---|---|
| **마켓플레이스 = 공짜 빌보드** | 목록에 "PAIDEIA/Optimeta" 노출 | GTM에 신규 organic 채널 추가 |
| **신생 플랫폼 선점 PR ⭐** | 쓸만한 플러그인 적음 → featuring·런치파트너 확률 최고. "Alt 첫 *결정 지원* 학습 플러그인" | 카테고리 단독 선점 (Granola式) |
| **공유 아티팩트 = 바이럴** | 작전지도/핫존 맵을 동기들이 공유·import (한 명만 녹음하면 반 전체) | viral 가정 구동 |
| **"공부 적게" 헤드라인** | "교수가 3시간 가르쳤지만 시험은 30분" | 퀴즈 툴이 못 쓰는 메시지 |
| **공동 마케팅** | Alt가 쇼케이스로 자기 유저베이스에 홍보 | CAC ≈ 0 |

### 11.2 전환 사다리
```
Alt 쐐기(무료·결정만)
   → 작전지도 CTA "전체 시험대비 OS 먼저 써보기" → 이메일 waitlist (pre-seed 트리거 'waitlist 500')
      → Claude Code v1 (지금 쓸 수 있는 파워유저용)
         → v3 데스크톱 베타 (드릴·채점·PLOM·moat = 진짜 OS)
```

### 11.3 측정
- **North Star(쐐기)**: install → waitlist 전환율. (제품의 Weekly Pro-Pair Density와 별개 — 쐐기엔 moat 지표 없음.)
- 보조: 강의 연결 수, 오늘의 컷 완료율, 작전지도 공유 수.

### 11.4 가드레일
- **브랜드 명료성**: "애피타이저지 메인이 아니다"를 UI에 명시.
- **프라이버시**: 녹음 내용은 Alt 안에서만, 밖으론 **이메일 opt-in만**. 이게 곧 마케팅 메시지("당신 강의는 당신 기기에") = local-first 정체성과 정합.
- **moat 비유출**: 자신감·override는 로컬 보존, 전환 시에만 유저가 명시적으로 가져간다.

---

## 12. 신규 레포 구조 (`paideia-alt`)

```
paideia-alt/                      ← alt-react-plugin-template fork
├── manifest.json                 ← id(com.taewoopark.paideia-alt), permissions(§7), sdkVersion, locales(ko/en), marketplace
├── package.json                  ← pnpm; deps: alt-plugin-sdk, ai, react, react-dom, d3(Lombardi), framer-motion(제스처/전이), zod, katex
├── vite.config.ts · index.html
├── src/
│   ├── alt/                       ← SDK 래퍼: client guard, storage repo(course:*), ai provider(supportsTools 게이트)
│   │   ├── storage.ts · ai.ts · schemas.ts (zod: Topic, ExamPoint, Session)
│   ├── design/                    ← §14 토큰: tokens.css(Cod Gray 팔레트/자간), Pretendard self-host, glass/frost 프리미티브
│   ├── viz/                       ← Lombardi 2D 결정 맵 (d3 force + arc edges + 4분면)
│   ├── pipeline/                  ← 수집(ingest)·누적 재랭킹·작전지도 생성
│   ├── flows/                     ← Accrue / Decide 템포, 오늘의 컷 세션, 예산
│   ├── components/                ← Home(Map), Session, Evidence, Ops(작전지도), Onboarding
│   └── app.tsx
├── docs/PAIDEIA_PORT.md           ← 본 기획서 미러
└── dist/                          ← pnpm build 산출물
```

> 본 레포의 `docs/plan.md`(본 문서)가 마스터. 신규 레포 생성 시 `docs/PAIDEIA_PORT.md`로 미러링, 변경은 마스터 우선.

---

## 13. 빌드 & 설치 (Alt 공식 절차)

1. `git clone https://github.com/altalt-org/alt-react-plugin-template.git paideia-alt && cd paideia-alt && pnpm install`
2. SDK 가이드 정독: `https://raw.githubusercontent.com/altalt-org/alt-plugin-sdk/refs/heads/main/llms.txt`
3. shape 검증 소스: `alt-plugin-sdk/src`의 `contracts.ts`/`client.ts`/`ai.ts`. 실전 예제: `altalt-org/alt-quiz-plugin`(persist/streaming 패턴 차용, 단 *우리는 퀴즈가 아니다*).
4. 규칙: 정적 번들(Node/fs/임의 HTTP 금지, AI는 `alt.ai.*`만). manifest엔 실제 쓰는 권한만. UI 문자열은 직접 i18n.
5. 배포: `pnpm build` → `dist/` → Alt **Settings → Plugins → Install from local folder**. 마켓플레이스 메타 + 런치 자료(§11) 준비.

---

## 14. 디자인 시스템 (UI 스펙)

> **컨셉 한 줄**: **OpenAI Codex macOS 앱 디자인** — Cod Gray(따뜻한 near-black) + off-white 미니멀, **반투명 글래스모피즘** 머티리얼, 소프트 라운드. 데이터는 *Mark Lombardi식 곡선 아크 네트워크*. (브루탈리즘 폐기 · 2026-06-02 사용자 결정)

### 14.1 레이어 (글래스모피즘 + Codex 소프트 + Viz)
| 레이어 | 스타일 | 적용 |
|---|---|---|
| **Surface (글래스모피즘)** | 반투명 + `backdrop-filter: blur(22–24px) saturate(170%)` + 상단 inset 하이라이트 + hairline 보더 + 소프트 디퓨즈 섀도. **뒤의 은은한 앰비언트 그라데이션이 굴절**(없으면 블러 무의미). | 사이드바·탑바(`.glass`), 카드·패널(`.frost`), 세션 오버레이 |
| **Control (Codex 소프트)** | radius 10px, 저채도 표면, 정제된 라벨. **하드 오프셋·radius 0·모노캡스 전부 금지.** | 버튼·슬라이더·칩·배지·nav |
| **Viz (Lombardi)** | 곡선 아크 엣지·노드, 단색 선(실선=직접/점선=간접) | 2D 결정 맵, 성장 diff, 타임라인 |

### 14.2 타이포그래피
- **서체 Pretendard** (Variable, self-host — 외부 CDN 금지/샌드박스).
- **웨이트**: 본문 `Regular(400)`, 라벨·제목 `SemiBold(600)`·`ExtraBold(800)`. **`Thin(100)`은 쓰지 않는다**(가늘어 약해 보임 — 큰 숫자 D-N도 SemiBold `tabular-nums`).
- **자간**: 전역 `letter-spacing: -0.02em`(Codex 톤의 정제된 트래킹 — 기존 -5%는 과해서 완화). 모노스페이스·코드는 `0` 복원.
- 수식: KaTeX 렌더(증거 드로어의 인용 등), 본문 자간에서 제외.

### 14.3 컬러 (Cod Gray 모노톤 + 절제된 단일 accent)
```css
/* Cod Gray — 따뜻한 near-black 다크 (OpenAI 미니멀) */
--cod-1000:#0A0A0B; --cod-900:#101012; --cod-800:#161618; --cod-700:#1D1D20; --cod-600:#27272B;
/* off-white 텍스트 */
--fg-100:#F4F4F3; --fg-300:#CACAC6; --fg-500:#9A9A95; --fg-700:#6C6C67;
/* hairline 보더 (저알파 흰색 — Codex 머티리얼) */
--line:rgba(255,255,255,0.08); --line-strong:rgba(255,255,255,0.14);
/* 글래스 (반투명) */
--glass-bg:rgba(20,20,22,0.68); --card:rgba(23,23,26,0.55); --glass-blur:24px;
/* 단일 accent — focus·active·골드존에만 (한 줄로 교체 가능) */
--accent-1:#10A37F; --accent-soft:rgba(16,163,127,0.16);
/* 소프트 디퓨즈 섀도 */
--shadow-card:0 1px 2px rgba(0,0,0,.45), 0 10px 30px rgba(0,0,0,.3);
```
- **원칙**: 거의 무채(Cod Gray + off-white) + accent 1개를 focus/active/골드존에만. 시험확률·자신감·직접/간접은 **분면 위치·노드 크기·선 굵기·점선**으로 구분.
- **글래스가 보이려면** body에 은은한 앰비언트 radial-gradient 필수(블러가 굴절할 대상). 라이트 모드는 Cod↔fg 반전.

### 14.4 컴포넌트 규칙 (Codex 소프트)
- radius 10px(`--radius`), 소프트 디퓨즈 섀도, hairline 보더. **하드 오프셋·radius 0·모노캡스 전부 금지.**
- 카드/패널 = `.frost`(반투명 `--card` + blur + 상단 sheen). 사이드바/탑바 = `.glass`(자체 반투명 bg + blur).
- 버튼 = shadcn 소프트(라운드, secondary=저채도 표면). 호버=미세 표면 상승.
- 배지/칩 = 둥근 저채도. tier 강조는 accent ring·노드 크기(색칠 아님).

### 14.5 Mark Lombardi 결정 맵 (핵심 차별 UI)
- 엔진: **D3 force + 곡선 아크 엣지**(quadratic Bézier) on SVG. 노드=토픽, 엣지=관계(같은 강의 출현·반복).
- **4분면 배치**: X=examProb, Y=confidence. 노드 크기 = examPoint weight 합. 미평가는 하단 "미평가" 띠.
- 라인 규약(Lombardi): **실선=직접/확정, 점선=간접/추정**, 화살표=반복 선후. 단색(off-white/Cod Gray), 강조만 `--accent-1`.
- **성장 diff**: 새 강의 노드가 force-sim으로 합류, 반복 토픽은 확률 상향 플래시. framer-motion 공유요소 전환.
- 라벨은 Pretendard SemiBold 소형, 노드 근접. 손그림 톤은 약한 아크 곡률 + hairline으로(과한 텍스처 금지 → 글래스 머티리얼과 톤 유지).

### 14.6 레이아웃 (Codex 사이드바/디테일)
- **좌측 `.glass` 사이드바**(앱명·nav) + **우측 `.glass` 탑바**(코스·D-N) + **본문**(frosted 카드 + hero 결정맵). NavigationSplitView 감각.
- **2D 결정 맵 / 성장 diff / 타임라인** = Lombardi Viz 레이어.
- **오늘의 컷** = `.glass` 오버레이로 맵을 덮고 카드 스와이프. 끝나면 바뀐 맵으로 복귀.

---

## 15. 오픈 퀘스천 & 다음 액션

### 15.1 오픈 퀘스천
1. 플러그인 ID 확정: `com.taewoopark.paideia-alt` (역도메인 권장).
2. 작전지도를 Alt 노트로 미러링할지(`notes:write`) vs 플러그인 내에서만 보여줄지.
3. 마켓플레이스 등재명: "PAIDEIA Exam Radar" vs "Exam Radar by Optimeta" — 회사 인지 vs 제품 인지 균형.
4. waitlist 수집 폼: 외부 폼 링크(샌드박스 HTTP 불가) vs 클립보드/딥링크 — 어느 경로로 이메일을 안전히 받을지.

### 15.2 다음 액션
- [ ] (사용자) §15.1-1 ID 확정, §15.1-3 등재명 결정.
- [x] (Claude) ✅ SDK 정적 검증 — 비전=NO, generateObject=OpenAI-compatible(supportsTools 게이팅), storage 중첩 OK, `transcriptUpdated`로 Accrue 가능. (§5/§6 반영)
- [ ] (Claude) `paideia-alt` 스캐폴드 — 템플릿 clone, storage zod 스키마, 디자인 토큰, i18n. (Phase 0)
- [ ] (Claude) 런타임 스파이크: `supportsTools` 분기 + `generateObject` 실호출. (Phase 0)
- [ ] (Claude) `alt-quiz-plugin` 정독 후 persist/streaming 패턴만 차용(퀴즈 로직 아님).
- [ ] 이후 Phase 1(수집+첫 인상)부터 순차 구현.
