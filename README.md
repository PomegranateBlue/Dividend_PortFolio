# 배당 ETF 적립식 투자 계산기

미국 배당 ETF(SCHD, JEPQ, JEPI, DGRO, VYM)에 매월 적립식 투자 시 자산 성장과 배당 수익을 시뮬레이션하는 웹 계산기입니다.

## 주요 기능

- **ETF별 월 매수 수량 설정** — +/- 버튼 또는 직접 입력
- **투자 기간 슬라이더** — 6개월 ~ 30년 범위 조절
- **배당 재투자(DRIP)** — ON/OFF 토글로 배당금 자동 재투자 시뮬레이션
- **시각화 차트 3종**
  - 자산 성장 추이 (총 자산 vs 투자 원금 vs 누적 배당)
  - 월 배당금 추이
  - ETF별 보유 주식 수 추이
- **USD/KRW 환산** — 모든 금액을 달러와 원화로 동시 표시
- **설정 페이지** — ETF 주가, 연간 배당금, 주가 성장률, 환율 수동 조정

## 시뮬레이션 로직

- 주가는 연간 성장률을 월 복리로 적용
- 배당금은 주가에 비례하여 함께 성장
- DRIP 활성화 시 배당금을 해당 ETF에 자동 재투자 (소수점 주식 허용)
- 기본 데이터는 2026년 3월 기준 실제 주가/배당 반영

## 기술 스택

- **Next.js 16** (App Router, Turbopack)
- **React 19** (useDeferredValue, memo 기반 렌더링 최적화)
- **TypeScript**
- **Tailwind CSS v4** (@theme 기반 커스텀 토큰)
- **Recharts** (차트 시각화)

## 프로젝트 구조

```text
app/
├── page.tsx                    # 메인 페이지 (상태 관리, 레이아웃)
├── globals.css                 # Tailwind 설정 및 커스텀 테마
├── layout.tsx                  # 루트 레이아웃
├── types.ts                    # ETF 타입 정의
├── constants/
│   └── etfs.ts                 # ETF 기본 데이터 (가격, 배당, 성장률)
├── hooks/
│   └── useSimulation.ts        # 시뮬레이션 계산 로직 (useMemo)
├── utils/
│   └── format.ts               # 숫자 포맷팅 (USD, KRW)
└── components/
    ├── Charts.tsx              # 차트 3종 (memo 적용)
    ├── SharedInputGrid.tsx     # ETF별 매수 수량 입력 (memo 적용)
    ├── SummaryCards.tsx         # 요약 카드 (총자산, 배당 등)
    ├── SettingPage.tsx         # 설정 페이지
    ├── CustomTooltip.tsx       # 차트 툴팁
    └── Dual.tsx                # USD/KRW 이중 표시 컴포넌트
```

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 참고사항

- 실제 수익은 시장 변동, 환율 변동, 세금 등에 따라 달라질 수 있습니다
- 본 계산기는 참고용이며 투자 조언이 아닙니다
