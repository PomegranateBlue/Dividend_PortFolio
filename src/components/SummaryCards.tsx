import { Dual } from "./Dual";

interface SummaryCardsProps {
  lastRow: Record<string, number>;
  fx: number;
}

export function SummaryCards({ lastRow, fx }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-4">
      <div className="bg-slate-800 rounded-xl px-[18px] py-4 border border-slate-700">
        <div className="text-xs text-slate-500 mb-1.5 font-medium">총 투자 원금</div>
        <Dual usd={lastRow.totalInvested || 0} fx={fx} size="large" />
      </div>
      <div className="bg-slate-800 rounded-xl px-[18px] py-4 border border-slate-700">
        <div className="text-xs text-slate-500 mb-1.5 font-medium">총 자산 가치</div>
        <Dual usd={lastRow.totalAsset || 0} fx={fx} size="large" color="#3B82F6" />
      </div>
      <div className="bg-slate-800 rounded-xl px-[18px] py-4 border border-slate-700">
        <div className="text-xs text-slate-500 mb-1.5 font-medium">마지막 월 배당</div>
        <Dual usd={lastRow.monthlyDividend || 0} fx={fx} size="large" color="#10B981" />
      </div>
      <div className="bg-slate-800 rounded-xl px-[18px] py-4 border border-slate-700">
        <div className="text-xs text-slate-500 mb-1.5 font-medium">누적 배당 합계</div>
        <Dual usd={lastRow.cumulativeDividend || 0} fx={fx} size="large" color="#F59E0B" />
      </div>
    </div>
  );
}
