# 2026-03-15 학습 노트: React 성능 최적화 & Tailwind CSS v4 전환

## 목차

1. [React.memo — 불필요한 리렌더 방지](#1-reactmemo--불필요한-리렌더-방지)
2. [useMemo — 시뮬레이션 계산 최적화](#2-usememo--시뮬레이션-계산-최적화)
3. [useDeferredValue — UI 응답성 개선](#3-usedeferredvalue--ui-응답성-개선)
4. [Charts props 축소 — memo 효과 극대화](#4-charts-props-축소--memo-효과-극대화)
5. [인라인 스타일 → Tailwind CSS v4 전환](#5-인라인-스타일--tailwind-css-v4-전환)
6. [input UX 개선 — 스피너 제거 & 지연 반영](#6-input-ux-개선--스피너-제거--지연-반영)
7. [성능 측정 방법 — Chrome DevTools Performance](#7-성능-측정-방법--chrome-devtools-performance)

---

## 1. React.memo — 불필요한 리렌더 방지

### 개념

`React.memo`는 컴포넌트를 감싸서, **props가 바뀌지 않으면 리렌더를 건너뛰게** 하는 고차 컴포넌트(HOC)다.
React는 부모가 리렌더되면 자식도 무조건 리렌더하는데, memo는 이걸 막아준다.

```tsx
// memo 없이: 부모가 리렌더 → 자식도 무조건 리렌더
function Child({ name }: { name: string }) {
  return <div>{name}</div>;
}

// memo 적용: name이 안 바뀌면 리렌더 스킵
const Child = memo(function Child({ name }: { name: string }) {
  return <div>{name}</div>;
});
```

### 언제 효과가 있는가?

memo는 **해당 컴포넌트의 props가 바뀌지 않는 상황이 자주 발생할 때** 효과적이다.
핵심은 "이 컴포넌트가 받는 props 중, 부모의 어떤 state 변화에 영향을 받는가?"를 분석하는 것.

### 실제 적용: ShareInputGrid

**분석 테이블:**

| 부모 state 변화 | ShareInputGrid props 변화 여부 | memo 효과 |
|----------------|-------------------------------|-----------|
| months 슬라이더 | etfs, shares, setShares, fx 모두 안 바뀜 | **스킵** |
| drip 토글 | 안 바뀜 | **스킵** |
| shares 변경 | shares 바뀜 | 리렌더 (정상) |
| fx 변경 | fx 바뀜 | 리렌더 (정상) |

**Before:**

```tsx
export function ShareInputGrid({ etfs, shares, setShares, fx }: Props) {
  return ( ... );
}
```

**After:**

```tsx
export const ShareInputGrid = memo(({ etfs, shares, setShares, fx }: Props) => {
  return ( ... );
});

ShareInputGrid.displayName = "ShareInputGrid";
```

### 주의할 점

- `memo`로 감싼 익명 화살표 함수는 React가 이름을 추론 못함 → `displayName` 설정 필요
- `useState`의 setter 함수(예: `setShares`)는 참조가 안정적이라 memo를 깨뜨리지 않음
- 인라인 객체/함수를 props로 넘기면 매번 새 참조 → memo 무효화. 단, 이 프로젝트에서는 해당 없었음

---

## 2. useMemo — 시뮬레이션 계산 최적화

### 개념

`useMemo`는 **계산 결과를 캐싱**해서, 의존성이 바뀌지 않으면 이전 결과를 재사용한다.

```tsx
const result = useMemo(() => {
  return heavyCalculation(a, b);
}, [a, b]); // a, b가 안 바뀌면 재계산 안 함
```

### 실제 적용: useSimulation

시뮬레이션은 최대 360개월 × 5개 ETF를 반복하며 계산한다. 매 렌더마다 재계산하면 낭비.

**최적화 포인트들:**

#### A. 성장률을 루프 밖에서 1회 계산

```tsx
// Before: 매 월마다 Math.pow 호출
for (let m = 1; m <= months; m++) {
  etfs.forEach((etf) => {
    const monthlyGrowth = Math.pow(1 + etf.annualGrowth / 100, 1 / 12) - 1;
    // ...
  });
}

// After: 루프 밖에서 한 번만
const growthRates: Record<string, number> = {};
etfs.forEach((e) => {
  growthRates[e.ticker] = Math.pow(1 + e.annualGrowth / 100, 1 / 12) - 1;
});
for (let m = 1; m <= months; m++) {
  // growthRates[etf.ticker] 재사용
}
```

#### B. 분리된 루프 합치기

```tsx
// Before: ETF마다 3번 순회 (매수, 배당, 자산합산)
etfs.forEach(etf => { /* 매수 */ });
etfs.forEach(etf => { /* 배당 */ });
etfs.forEach(etf => { /* 자산 합산 */ });

// After: 1번 순회로 통합
etfs.forEach((etf) => {
  // 매수
  holdings[etf.ticker] += qty;
  totalInvested += qty * currentPrices[etf.ticker];
  // 배당
  const div = holdings[etf.ticker] * monthlyDivPerShare;
  monthlyDividend += div;
  // DRIP
  if (drip) holdings[etf.ticker] += div / currentPrices[etf.ticker];
});
```

#### C. parseFloat(toFixed()) → Math.round()

```tsx
// Before: 문자열 변환 포함 — 느림
parseFloat(value.toFixed(2))

// After: 순수 숫자 연산 — 빠름
Math.round(value * 100) / 100
```

---

## 3. useDeferredValue — UI 응답성 개선

### 개념

`useDeferredValue`는 값의 업데이트를 **낮은 우선순위로 지연**시킨다.
긴급한 UI 업데이트(입력, 버튼)를 먼저 처리하고, 무거운 작업(차트 렌더링)은 나중에 처리.

```tsx
const [value, setValue] = useState(0);
const deferredValue = useDeferredValue(value);

// value → 즉시 업데이트 (슬라이더 위치, 숫자 표시)
// deferredValue → 나중에 업데이트 (차트 렌더링에 사용)
```

### 실제 적용 1: 슬라이더

**문제:** 슬라이더 드래그 시 매 틱마다 시뮬레이션 재계산 + 차트 리렌더 → 슬라이더가 끊김

```tsx
// Before: 슬라이더 값이 바로 시뮬레이션에 들어감
const simulation = useSimulation(etfs, months, shares, drip);

// After: 지연된 값 사용
const deferredMonths = useDeferredValue(months);
const simulation = useSimulation(etfs, deferredMonths, shares, drip);
```

- 슬라이더 UI와 "60개월 (5.0년)" 텍스트 → `months` 사용 (즉시 반응)
- 시뮬레이션 계산 → `deferredMonths` 사용 (뒤따라 반영)

### 실제 적용 2: 차트 데이터

**문제:** 주식 수 +/- 클릭 → 시뮬레이션 재계산 → recharts가 360개 데이터포인트 × 3개 차트를 동기 렌더 → INP 996ms

```tsx
// Before: 차트가 최신 데이터로 즉시 리렌더 (동기, 느림)
<Charts simulation={simulation} ... />

// After: 차트 데이터를 지연
const deferredSimulation = useDeferredValue(simulation);
<Charts simulation={deferredSimulation} ... />
```

- 숫자, 금액 표시, 요약 카드 → 즉시 반영
- 차트 3개 → 낮은 우선순위로 뒤따라 업데이트

### useDeferredValue vs debounce

| | useDeferredValue | debounce |
|---|---|---|
| 동작 | React 스케줄러가 우선순위 관리 | 일정 시간 대기 후 실행 |
| 장점 | 시스템 성능에 따라 자동 조절 | 구현이 단순 |
| 최종 렌더 | 항상 최신 값으로 렌더 보장 | 중간 값 손실 가능 |
| React 통합 | Concurrent Features와 자연스럽게 연동 | React와 무관한 타이머 |

---

## 4. Charts props 축소 — memo 효과 극대화

### 개념

`memo`는 **얕은 비교(shallow comparison)**로 props 변화를 감지한다.
props로 넘기는 객체가 크면, 실제로 사용하지 않는 필드가 바뀌어도 리렌더가 발생한다.

### 실제 적용

Charts 컴포넌트가 `etfs`에서 실제로 사용하는 필드:

```tsx
// 3번째 차트에서만 사용
etfs.map((etf) => (
  <Area dataKey={etf.ticker} stroke={etf.color} fill={etf.color} />
))
```

→ `ticker`와 `color`만 필요. `price`, `annualDiv`, `annualGrowth` 등은 불필요.

**Before:**

```tsx
// Etf 전체를 넘김 → 설정에서 가격 수정 시 Charts도 리렌더
<Charts simulation={simulation} etfs={etfs} months={months} fx={fx} />
```

**After:**

```tsx
// ticker, color만 추출 → useMemo로 참조 안정화
const chartEtfs = useMemo(
  () => etfs.map(({ ticker, color }) => ({ ticker, color })),
  [etfs]
);

<Charts simulation={deferredSimulation} etfs={chartEtfs} months={months} fx={fx} />
```

Charts의 인터페이스도 변경:

```tsx
// Before
interface ChartsProps {
  etfs: Etf[];  // price, annualDiv 등 포함
}

// After
interface ChartEtf {
  ticker: string;
  color: string;
}
interface ChartsProps {
  etfs: ChartEtf[];  // 필요한 것만
}
```

### 왜 useMemo가 필요한가?

`etfs.map(...)` 자체가 매 렌더마다 새 배열을 반환 → memo 무효화.
`useMemo`로 감싸면 `etfs`가 바뀌지 않는 한 같은 참조를 유지.

---

## 5. 인라인 스타일 → Tailwind CSS v4 전환

### 개념

인라인 스타일 객체 (`style={{ color: "#fff" }}`)는 매 렌더마다 새 객체를 생성한다.
Tailwind CSS는 className 문자열로 스타일을 적용하므로 이 문제가 없다.

### Tailwind v4의 커스텀 설정

v4에서는 `tailwind.config.js` 대신 **CSS 파일의 `@theme`**에서 설정한다.

```css
/* globals.css */
@import "tailwindcss";

@theme inline {
  --color-muted: #536878;        /* 표준 팔레트에 없는 커스텀 색상 */
  --font-pretendard: 'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif;
}
```

사용: `text-muted`, `font-pretendard`

### 전환 패턴

#### 정적 스타일 → className 직접 매핑

```tsx
// Before
<div style={{
  background: "#1E293B",
  borderRadius: 12,
  padding: "16px 20px",
  border: "1px solid #334155",
}}>

// After — #1E293B = slate-800, #334155 = slate-700
<div className="bg-slate-800 rounded-xl px-5 py-4 border border-slate-700">
```

#### 조건부 스타일 → 템플릿 리터럴

```tsx
// Before
<span style={{ color: drip ? "#10B981" : "#9CA3AF" }}>

// After
<span className={`text-xs ${drip ? "text-emerald-500" : "text-gray-400"}`}>
```

#### 동적 값 (런타임 데이터) → style 유지

```tsx
// etf.color는 런타임 값이라 Tailwind 클래스로 변환 불가
<span style={{ color: etf.color }}>{etf.ticker}</span>

// borderLeft 색상도 동적
<div
  className="bg-slate-800 rounded-xl border border-slate-700 border-l-4"
  style={{ borderLeftColor: etf.color }}
>
```

### 주요 색상 매핑 표

| 하드코딩 값 | Tailwind 클래스 |
|------------|----------------|
| `#0F172A` | `slate-900` |
| `#1E293B` | `slate-800` |
| `#334155` | `slate-700` |
| `#475569` | `slate-600` |
| `#536878` | `muted` (커스텀) |
| `#64748B` | `slate-500` |
| `#94A3B8` | `slate-400` |
| `#E2E8F0` | `slate-200` |
| `#F8FAFC` | `slate-50` |
| `#3B82F6` | `blue-500` |
| `#10B981` | `emerald-500` |
| `#34D399` | `emerald-400` |
| `#F59E0B` | `amber-500` |
| `#F87171` | `red-400` |

---

## 6. input UX 개선 — 스피너 제거 & 지연 반영

### 문제

1. `<input type="number">` → 브라우저가 자동으로 스피너(위/아래 화살표) 표시. 이미 +/- 버튼이 있어서 중복
2. `onChange`로 즉시 반영 → 타이핑 중에 매 글자마다 시뮬레이션 재계산

### 해결

```tsx
// Before
<input
  type="number"
  value={shares[etf.ticker]}
  onChange={(e) => setShares(...)}  // 매 글자마다 반영
/>

// After — 별도 컴포넌트로 분리
function ShareInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState(String(value));   // 로컬 임시 값
  const [editing, setEditing] = useState(false);        // 편집 중 여부

  const commit = () => {
    const num = Math.max(0, parseInt(draft, 10) || 0);
    onChange(num);           // 이 때만 부모에 반영
    setDraft(String(num));
    setEditing(false);
  };

  return (
    <input
      type="text"                                    // 스피너 없음
      inputMode="numeric"                            // 모바일 숫자 키보드
      value={editing ? draft : String(value)}        // 편집 중이면 draft, 아니면 실제값
      onFocus={() => { setDraft(String(value)); setEditing(true); }}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}  // 숫자만 허용
      onBlur={commit}                               // 포커스 해제 시 반영
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}  // Enter → blur → commit
    />
  );
}
```

### 핵심 패턴: 로컬 state로 입력 버퍼링

```
[사용자 타이핑] → draft(로컬) → [Enter/blur] → onChange(부모) → 시뮬레이션 재계산
```

이 패턴은 검색 입력, 설정값 입력 등 **비용이 큰 업데이트를 지연**시킬 때 범용적으로 사용 가능.

---

## 7. 성능 측정 방법 — Chrome DevTools Performance

### 사용법

1. F12 → **성능(Performance)** 탭
2. 녹화 버튼(⏺) 클릭
3. 느린 동작 수행 (예: +/- 버튼 클릭)
4. 녹화 중지

### 핵심 지표

| 지표 | 의미 | 목표 |
|------|------|------|
| **INP** (Interaction to Next Paint) | 인터랙션 → 화면 반영까지 시간 | 200ms 이하 |
| 스크립트 시간 | JS 실행 총 시간 | 가능한 낮게 |
| 렌더링/페인팅 | DOM → 화면 그리기 | 16ms 이내 (60fps) |

### 이 프로젝트의 측정 결과

- **최적화 전:** INP 996ms (버튼 1회 클릭에 ~1초)
- **병목 원인:** recharts SVG 렌더링 (360 데이터포인트 × 3차트 동기 처리)
- **대응:** `useDeferredValue(simulation)`으로 차트 업데이트를 지연 처리

### React DevTools Profiler (추가 도구)

Chrome 확장 프로그램 "React Developer Tools" 설치 후:

1. DevTools → **⚛️ Profiler** 탭
2. 녹화 → 동작 수행 → 중지
3. **Flamegraph:** 컴포넌트별 렌더 시간 시각화
4. **Ranked:** 렌더 시간 순 정렬 → 병목 컴포넌트 바로 확인

---

## 정리: 최적화 체크리스트

1. **React.memo** — props가 자주 안 바뀌는 자식 컴포넌트에 적용
2. **useMemo** — 비용 큰 계산 결과 캐싱, 루프 내 반복 계산 제거
3. **useDeferredValue** — 무거운 렌더링(차트 등)을 지연시켜 UI 응답성 확보
4. **props 최소화** — memo된 컴포넌트에 필요한 데이터만 전달
5. **입력 버퍼링** — 비용 큰 업데이트는 로컬 state로 버퍼링 후 commit
6. **측정 먼저** — 감으로 최적화하지 말고, DevTools로 병목을 먼저 확인
