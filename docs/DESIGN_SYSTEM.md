# 디자인 시스템

> **강아지를 자유롭게** — 푸른색 + 흰색

먹메이트(살구 오렌지·진갈색·크림)와 명확히 구분되는 톤입니다.

---

## 컬러 토큰

정의는 `src/app/globals.css` 의 `@theme` 블록.
**색상을 하드코딩하지 말고 토큰을 쓰세요.**

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-sherpy-600` | `#2563EB` | 메인. 버튼, 활성 탭, 포인트 |
| `--color-sherpy-700` | `#1D4ED8` | 눌린 상태 |
| `--color-sherpy-100` | `#DBEAFE` | 연한 배경, 보조 텍스트 (파란 배경 위) |
| `--color-sherpy-50` | `#EFF6FF` | 아주 연한 면 |
| `--color-accent` | `#06B6D4` | 주행 중 / 활성 표시 |
| `--color-surface` | `#FFFFFF` | 카드 |
| `--color-bg` | `#F8FAFC` | 페이지 배경 |
| `--color-line` | `#E2E8F0` | 테두리, 구분선 |
| `--color-ink` | `#0F172A` | 제목 |
| `--color-body` | `#334155` | 본문 |
| `--color-muted` | `#64748B` | 보조 |

### 안전등급 (로봇 대시보드 전용)

| 등급 | 토큰 | 값 | 의미 |
|---|---|---|---|
| L0 | `--color-level-0` | `#16A34A` | 정상 |
| L1 | `--color-level-1` | `#CA8A04` | 주의 |
| L2 | `--color-level-2` | `#EA580C` | 경고 |
| L3 | `--color-level-3` | `#DC2626` | 정지 |

> **접근성**: 안전등급을 색상만으로 구분하지 마세요.
> `SafetyBadge` 처럼 `L2 · 경고` 식으로 **텍스트를 함께** 씁니다.

---

## 타이포그래피

- 본문: **Pretendard** (한글 가독성)
- 실시간으로 갱신되는 숫자에는 **반드시** `className="tabular"` 를 붙입니다.

```tsx
<p className="tabular text-lg font-semibold">{tension.toFixed(1)} N</p>
```

고정폭 숫자를 쓰지 않으면 값이 바뀔 때마다 폭이 흔들려서 화면이 떨립니다.
장력 게이지처럼 1초에 한 번 갱신되는 곳에서는 특히 눈에 띕니다.

---

## 모바일 전용 규칙

| 규칙 | 구현 |
|---|---|
| 최소 터치 영역 44×44 | `className="touch"` |
| 좌우 여백 16px 고정 | `className="px-4"` |
| 가로 스크롤 금지 | `body { overflow-x: hidden }` (globals.css) |
| 하단 탭에 가리지 않게 | 본문에 `pb-20` |
| 세이프에어리어 | `className="pb-safe"` |
| 최대 폭 | `max-w-[480px]` — 데스크톱에서도 모바일 레이아웃 유지 |

다크모드는 v1 미지원입니다. 다만 색을 전부 토큰으로 정의해뒀으니
나중에 `@media (prefers-color-scheme: dark)` 블록만 추가하면 됩니다.

---

## 컴포넌트

| 컴포넌트 | 파일 | 설명 |
|---|---|---|
| `TensionGauge` | `components/robot/TensionGauge.tsx` | 반원 게이지. 임계선 3개(8/30/40N), 색이 안전등급을 따라감 |
| `LeashBar` | `components/robot/LeashBar.tsx` | 줄 길이 0~5m 바, 구간별 색상 |
| `SafetyBadge` | `components/robot/SafetyBadge.tsx` | L0~L3 배지 + 고장코드 설명 |
| `EstopButton` | `components/robot/EstopButton.tsx` | 플로팅 긴급정지. **1초 길게 누르기** |
| `BottomTabs` | `components/ui/BottomTabs.tsx` | 하단 탭 5개, 중앙(셰르피) 강조 |
| `RouteMap` | *(M4에서 작성)* | 카카오맵 래퍼 — 코스 그리기 / 궤적 표시 공용 |
| `WalkScoreCard` | *(M5에서 작성)* | 홈 상단 날씨·점수 카드 |

---

## 톤 & 문구

- 보호자에게 말하듯, 짧고 담백하게. 과한 감탄사·이모지 남발 금지
- 안전 관련 문구는 **애매하게 쓰지 않습니다**
  - ✅ "원격 정지는 보조 수단입니다. 긴급 상황에서는 로봇 본체의 물리 정지 버튼을 사용하세요."
  - ❌ "안전하게 원격으로 정지할 수 있어요!"
- 명목상 기능에는 `준비 중인 기능입니다` / `시연용 데이터` 를 명시합니다
