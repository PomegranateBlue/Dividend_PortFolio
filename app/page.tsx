"use client";

import { useState, useCallback, useMemo, useDeferredValue } from "react";
import { DEFAULT_ETFS, DEFAULT_FX } from "./constants/etfs";
import { fmtUSD, fmtKRW } from "./utils/format";
import { useSimulation } from "./hooks/useSimulation";
import { SettingsPage } from "./components/SettingPage";
import { ShareInputGrid } from "./components/SharedInputGrid";
import { SummaryCards } from "./components/SummaryCards";
import { Charts } from "./components/Charts";

export default function DividendCalculator() {
  const [page, setPage] = useState("main");
  const [etfs, setEtfs] = useState(DEFAULT_ETFS.map((e) => ({ ...e })));
  const [months, setMonths] = useState(60);
  const [shares, setShares] = useState<Record<string, number>>(
    DEFAULT_ETFS.reduce((acc, e) => ({ ...acc, [e.ticker]: 1 }), {}),
  );
  const [drip, setDrip] = useState(false);
  const [fx, setFx] = useState(DEFAULT_FX);

  const updateEtf = useCallback((idx: number, field: string, value: string) => {
    setEtfs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: Number(value) || 0 };
      if (field === "price" || field === "annualDiv") {
        const p = field === "price" ? Number(value) : next[idx].price;
        const d = field === "annualDiv" ? Number(value) : next[idx].annualDiv;
        if (p > 0) next[idx].yield = parseFloat(((d / p) * 100).toFixed(2));
      }
      return next;
    });
  }, []);

  const resetEtfs = useCallback(() => {
    setEtfs(DEFAULT_ETFS.map((e) => ({ ...e })));
    setFx(DEFAULT_FX);
  }, []);

  const deferredMonths = useDeferredValue(months);
  const chartEtfs = useMemo(() => etfs.map(({ ticker, color }) => ({ ticker, color })), [etfs]);
  const simulation = useSimulation(etfs, deferredMonths, shares, drip);
  const deferredSimulation = useDeferredValue(simulation);
  const lastRow: Record<string, number> = (simulation[simulation.length - 1] || {}) as Record<string, number>;
  const monthlyInvestment = etfs.reduce(
    (sum, e) => sum + (shares[e.ticker] || 0) * e.price,
    0,
  );

  if (page === "settings") {
    return (
      <SettingsPage
        etfs={etfs}
        fx={fx}
        setFx={setFx}
        updateEtf={updateEtf}
        resetEtfs={resetEtfs}
        setPage={setPage}
      />
    );
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 py-6 font-pretendard text-slate-200 bg-slate-900 min-h-screen">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-50 m-0 tracking-tight">
            배당 ETF 적립식 투자 계산기
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5">
            SCHD · JEPQ · JEPI · DGRO · VYM — 2026.03 기준 · 환율 {fmtKRW(fx)}
            /USD
          </p>
        </div>
        <button
          onClick={() => setPage("settings")}
          className="bg-slate-800 text-slate-400 border border-slate-700 rounded-lg px-4 py-2 text-[13px] cursor-pointer transition-all duration-150"
        >
          ⚙️ 주가/환율 설정
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-60 bg-slate-800 rounded-xl px-5 py-4 border border-slate-700">
          <label className="text-[13px] font-semibold text-slate-400 mb-2 block">
            투자 기간
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={6}
              max={360}
              step={6}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm font-bold text-slate-50 whitespace-nowrap">
              {months}개월 ({(months / 12).toFixed(1)}년)
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-60 bg-slate-800 rounded-xl px-5 py-4 border border-slate-700">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[13px] font-semibold text-slate-400 mb-2 block">
              배당 재투자 (DRIP)
            </label>
            <button
              onClick={() => setDrip(!drip)}
              className={`w-11 h-6 rounded-xl border-none cursor-pointer relative transition-colors duration-200 ${drip ? "bg-emerald-500" : "bg-gray-600"}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform duration-200 shadow ${drip ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          <span
            className={`text-xs font-medium ${drip ? "text-emerald-500" : "text-gray-400"}`}
          >
            {drip
              ? "ON — 배당금을 해당 ETF에 자동 재투자"
              : "OFF — 배당금 현금 수령"}
          </span>
        </div>
      </div>

      <ShareInputGrid etfs={etfs} shares={shares} setShares={setShares} fx={fx} />

      <div className="text-center text-sm text-slate-400 bg-slate-800 rounded-lg px-3 py-2.5 mb-5 border border-slate-700">
        초기 월 투자액: <strong>{fmtUSD(monthlyInvestment)}</strong>
        <span className="text-slate-500 ml-2 text-[13px]">
          ({fmtKRW(monthlyInvestment * fx)})
        </span>
        <span className="text-muted text-[11px] ml-1.5">
          · 주가 성장 반영 시 점진적 증가
        </span>
      </div>

      <SummaryCards lastRow={lastRow} fx={fx} />

      {/* End-of-period prices */}
      <div className="bg-slate-800 rounded-[10px] px-4 py-3 mb-5 border border-slate-700">
        <span className="text-xs text-slate-500 font-semibold mb-2 block">
          {months}개월 후 예상 주가
        </span>
        <div className="flex gap-2.5 flex-wrap">
          {etfs.map((etf) => {
            const endPrice = (lastRow[etf.ticker + "_price"] as number) || etf.price;
            const pctChange = ((endPrice - etf.price) / etf.price) * 100;
            return (
              <div
                key={etf.ticker}
                className="flex items-center gap-1.5 bg-slate-900 rounded-md px-2.5 py-1.5 border border-slate-700"
              >
                <span className="font-bold text-xs" style={{ color: etf.color }}>
                  {etf.ticker}
                </span>
                <span className="text-slate-50 text-xs font-semibold">
                  {fmtUSD(endPrice as number)}
                </span>
                <span
                  className={`text-[10px] ${pctChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {pctChange >= 0 ? "+" : ""}
                  {pctChange.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Charts simulation={deferredSimulation} etfs={chartEtfs} months={months} fx={fx} />

      <div className="text-center text-[11px] text-slate-600 pt-4 pb-2 leading-[1.8]">
        ※ 주가는 연간 성장률을 월 복리로 적용하며, 배당금도 주가에 비례하여
        성장합니다.
        <br />※ 원화 환산은 고정 환율 {fmtKRW(fx)}/USD 기준이며, 설정에서 변경
        가능합니다.
        <br />※ 실제 수익은 시장 변동, 환율 변동, 세금 등에 따라 달라질 수
        있습니다.
      </div>
    </div>
  );
}
