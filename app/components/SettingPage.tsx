import { fmtKRW } from "../utils/format";
import { Etf } from "../types";
import { Dispatch, SetStateAction } from "react";

interface SettingsPageProps {
  etfs: Etf[];
  fx: number;
  setFx: Dispatch<SetStateAction<number>>;
  updateEtf: (idx: number, field: string, value: string) => void;
  resetEtfs: () => void;
  setPage: Dispatch<SetStateAction<string>>;
}

export function SettingsPage({
  etfs,
  fx,
  setFx,
  updateEtf,
  resetEtfs,
  setPage,
}: SettingsPageProps) {
  return (
    <div className="max-w-[860px] mx-auto px-4 py-6 font-pretendard text-slate-200 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage("main")}
            className="bg-transparent text-slate-400 border-none text-sm cursor-pointer p-0"
          >
            ← 돌아가기
          </button>
          <h1 className="text-[22px] font-extrabold text-slate-50 m-0 tracking-tight">
            ETF 주가 · 성장률 · 환율 설정
          </h1>
        </div>
        <button
          onClick={resetEtfs}
          className="bg-slate-800 text-red-400 border border-red-900 rounded-lg px-4 py-2 text-[13px] cursor-pointer"
        >
          기본값 복원
        </button>
      </div>
      <p className="text-[13px] text-slate-500 mt-1.5">
        2026년 3월 14일 기준 최신 주가 반영 · 성장률은 과거 평균 기반 기본값 ·
        아래에서 수동 조정 가능
      </p>

      {/* FX Rate Setting */}
      <div className="bg-slate-800 rounded-xl px-5 py-[18px] border border-slate-700 border-l-4 border-l-amber-400 mt-5 mb-2">
        <div className="flex items-center gap-2.5 mb-3.5">
          <span className="font-extrabold text-xs px-2.5 py-[3px] rounded-md bg-amber-400 text-slate-800">
            USD/KRW
          </span>
          <span className="text-[13px] text-slate-400">원화 환율 설정</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-[0_0_200px]">
            <label className="text-[11px] text-slate-500 font-semibold">
              환율 (1 USD = ? KRW)
            </label>
            <input
              type="number"
              step="1"
              value={fx}
              onChange={(e) => setFx(Math.max(1, Number(e.target.value) || 1))}
              className="bg-slate-900 border border-slate-600 rounded-lg text-slate-50 text-[15px] font-bold px-3 py-2 w-full"
            />
          </div>
          <div className="text-[13px] text-slate-400 pt-[18px]">
            예: $100 = {fmtKRW(100 * fx)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-3">
        {etfs.map((etf: Etf, idx: number) => (
          <div
            key={etf.ticker}
            className="bg-slate-800 rounded-xl px-5 py-[18px] border border-slate-700 border-l-4"
            style={{ borderLeftColor: etf.color }}
          >
            <div className="flex items-center gap-2.5 mb-3.5">
              <span
                className="text-white font-extrabold text-xs px-2.5 py-[3px] rounded-md"
                style={{ background: etf.color }}
              >
                {etf.ticker}
              </span>
              <span className="text-[13px] text-slate-400">{etf.name}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-semibold">주가 (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={etf.price}
                  onChange={(e) => updateEtf(idx, "price", e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded-lg text-slate-50 text-[15px] font-bold px-3 py-2 w-full"
                />
                <div className="text-[11px] text-muted mt-0.5">{fmtKRW(etf.price * fx)}</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-semibold">연간 배당금 (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={etf.annualDiv}
                  onChange={(e) => updateEtf(idx, "annualDiv", e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded-lg text-slate-50 text-[15px] font-bold px-3 py-2 w-full"
                />
                <div className="text-[11px] text-muted mt-0.5">
                  {fmtKRW(etf.annualDiv * fx)}/년
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-semibold">연간 주가 성장률 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={etf.annualGrowth}
                  onChange={(e) => updateEtf(idx, "annualGrowth", e.target.value)}
                  className={`bg-slate-900 border border-slate-600 rounded-lg text-[15px] font-bold px-3 py-2 w-full ${
                    etf.annualGrowth > 0
                      ? "text-emerald-400"
                      : etf.annualGrowth < 0
                        ? "text-red-400"
                        : "text-slate-50"
                  }`}
                />
                <div className="text-[11px] text-muted mt-0.5">
                  월{" "}
                  {(
                    (Math.pow(1 + etf.annualGrowth / 100, 1 / 12) - 1) *
                    100
                  ).toFixed(3)}
                  % 복리
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-semibold">배당 수익률</label>
                <div className="text-[15px] font-bold text-emerald-500 py-2">{etf.yield}%</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500 font-semibold">배당 주기</label>
                <div className="text-[15px] font-bold text-emerald-500 py-2">
                  {etf.freq === "monthly" ? "월배당" : "분기배당"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 px-[18px] py-3.5 bg-slate-900 rounded-[10px] border border-slate-700 text-xs text-slate-500 leading-[1.7]">
        💡 주가 성장률 설명: 매월 복리로 주가가 상승한다고 가정합니다.
        배당금도 주가 비례로 함께 성장합니다. 커버드콜 ETF(JEPQ, JEPI)는 옵션
        전략 특성상 주가 상승이 제한되어 낮은 성장률을, 배당성장 ETF(SCHD,
        DGRO)는 과거 평균 기반으로 높은 성장률을 기본 설정했습니다. 실제
        주가는 시장 상황에 따라 크게 달라질 수 있으므로 보수적으로 조정하시길
        권장합니다.
      </div>
    </div>
  );
}
