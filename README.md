# 셰르피 (Sherpy)

> **강아지를 자유롭게**

반려견 산책 보조 자율주행 로봇 **셰르피**와 연동되는 모바일 산책지원 플랫폼.
전북대학교 캡스톤디자인 — 팀 **프리가이즈**

---

## 이게 뭔가

로봇 단독으로는 지금 어떤 상태인지 알 수 없습니다. 로봇에 화면을 달면 비용·전력·방수가
전부 문제가 되고, 보호자는 어차피 스마트폰을 들고 있습니다.

이 앱은 로봇의 센서 데이터(장력·줄 길이·속도·안전등급)를 실시간으로 보여주고,
어디로 걸을지 정하고, 다녀온 기록을 남기는 레이어입니다.

| 기능 | 상태 |
|---|---|
| 셰르피 실시간 대시보드 | P0 |
| 셰르피 원격 제어 (ESTOP·티칭·자동주행) | P0 |
| 실시간 카메라 (WebRTC) | P0 |
| 산책코스 추천·DIY + 지도 | P1 |
| 기상·환경 + 산책적합도 점수 | P1 |
| 산책 기록·리포트 | P1 |
| 커뮤니티 | P2 |
| 마켓 / 인구 밀집도 | **P3 — 명목상 (UI만)** |

---

## 빠른 시작

```bash
npm install
cp .env.example .env.local     # 값을 채우세요
npm run db:push                # Neon에 스키마 반영
npm run seed                   # 개발 계정 + 로봇 1대 + 더미 데이터
npm run dev
```

다른 터미널에서 **모의 로봇**을 띄우면 실제 로봇 없이 대시보드가 살아 움직입니다.

```bash
npm run mock:robot
```

→ http://localhost:3000/robot

로그인: `dev` / `dev1234`

> 자세한 설치는 [docs/SETUP.md](docs/SETUP.md) 참고. Windows 기준으로 적혀 있습니다.

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/PRD.md](docs/PRD.md) | **제품 요구사항 — 가장 먼저 읽을 것** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 로봇 ↔ 플랫폼 연동 구조 |
| [docs/API.md](docs/API.md) | API 라우트 명세 |
| [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md) | 데이터 모델 |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | 컬러 토큰 · 컴포넌트 규칙 |
| [docs/ROBOT_BRIDGE.md](docs/ROBOT_BRIDGE.md) | 라즈베리파이 측 설치·설정 |
| [AGENTS.md](AGENTS.md) | **AI 에이전트 작업 규칙** |

---

## 스택

먹메이트와 동일하게 갑니다. 팀이 이미 한 번 완주한 구성이라 학습비용이 0입니다.

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Neon** Postgres + **Drizzle ORM**
- **Vercel** 배포
- **Tailwind CSS v4**
- **카카오맵** JavaScript SDK
- 로봇: Raspberry Pi + Python + **PCA9685** + **MediaMTX**(WebRTC)

---

## ⚠️ 개발 전 반드시 확인

PRD §2-3에 정리된 **BOM 누락 부품**이 해결되어야 일부 기능이 성립합니다.

1. **라즈베리파이 카메라 모듈** — 없으면 영상 송출과 경로 기억 주행 둘 다 불가
2. **로봇 네트워크 수단** (핫스팟 또는 LTE 동글)
3. **라즈베리파이 본체** (BOM에 micro SD만 있음)
4. RELUNE 트윈 리드줄의 드럼 구조 — AS5600 자석 부착 방식이 여기서 결정됨

이 중 1·2번이 막혀도 **`npm run mock:robot`으로 앱 개발은 계속 진행할 수 있습니다.**
