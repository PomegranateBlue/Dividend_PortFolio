import { useMemo } from "react";
import { Etf } from "../types";

export const useSimulation = (
  etfs: Etf[],
  months: number,
  shares: Record<string, number>,
  drip: boolean,
) => {
  return useMemo(() => {
    const data: Record<string, number | string>[] = [];
    const holdings: Record<string, number> = {};
    const currentPrices: Record<string, number> = {};

    // A. 성장률을 루프 밖에서 한 번만 계산
    const growthRates: Record<string, number> = {};
    etfs.forEach((e) => {
      holdings[e.ticker] = 0;
      currentPrices[e.ticker] = e.price;
      growthRates[e.ticker] = Math.pow(1 + e.annualGrowth / 100, 1 / 12) - 1;
    });

    let totalInvested = 0;
    let cumulativeDividend = 0;

    for (let m = 1; m <= months; m++) {
      // 가격 성장 적용
      if (m > 1) {
        etfs.forEach((etf) => {
          currentPrices[etf.ticker] *= 1 + growthRates[etf.ticker];
        });
      }

      let monthlyDividend = 0;

      // B, E. 매수 + 배당 + DRIP을 하나의 루프로 합침
      etfs.forEach((etf) => {
        const qty = shares[etf.ticker] || 0;
        holdings[etf.ticker] += qty;
        totalInvested += qty * currentPrices[etf.ticker];

        const priceRatio = currentPrices[etf.ticker] / etf.price;
        const monthlyDivPerShare = (etf.annualDiv * priceRatio) / 12;
        const div = holdings[etf.ticker] * monthlyDivPerShare;
        monthlyDividend += div;

        if (drip && currentPrices[etf.ticker] > 0) {
          holdings[etf.ticker] += div / currentPrices[etf.ticker];
        }
      });

      cumulativeDividend += monthlyDividend;

      // E. 자산 합산 + 스냅샷을 하나의 루프로 합침
      let totalAssetValue = 0;
      const holdingsSnapshot: Record<string, number> = {};
      const priceSnapshot: Record<string, number> = {};
      etfs.forEach((etf) => {
        totalAssetValue += holdings[etf.ticker] * currentPrices[etf.ticker];
        // C. parseFloat(toFixed()) → 숫자 연산
        holdingsSnapshot[etf.ticker] = Math.round(holdings[etf.ticker] * 10000) / 10000;
        priceSnapshot[etf.ticker + "_price"] = Math.round(currentPrices[etf.ticker] * 100) / 100;
      });

      // C, D. 숫자 연산 + unrealizedGain 제거
      data.push({
        month: m,
        label: `${m}개월`,
        totalAsset: Math.round(totalAssetValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        monthlyDividend: Math.round(monthlyDividend * 100) / 100,
        cumulativeDividend: Math.round(cumulativeDividend * 100) / 100,
        ...holdingsSnapshot,
        ...priceSnapshot,
      });
    }
    return data;
  }, [etfs, months, shares, drip]);
};
