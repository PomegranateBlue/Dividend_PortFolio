import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";

interface ChartEtf {
  ticker: string;
  color: string;
}

interface ChartsProps {
  simulation: Record<string, number | string>[];
  etfs: ChartEtf[];
  months: number;
  fx: number;
}

export const Charts = memo(function Charts({ simulation, etfs, months, fx }: ChartsProps) {
  const annualDividends = useMemo(() => {
    const result: { year: number; label: string; annualDividend: number }[] = [];
    const totalYears = Math.ceil(simulation.length / 12);
    for (let y = 0; y < totalYears; y++) {
      const start = y * 12;
      const end = Math.min(start + 12, simulation.length);
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += (simulation[i].monthlyDividend as number) || 0;
      }
      result.push({
        year: y + 1,
        label: `${y + 1}년차`,
        annualDividend: Math.round(sum * 100) / 100,
      });
    }
    return result;
  }, [simulation]);

  return (
    <>
      {/* Chart: Asset Growth */}
      <div className="bg-slate-800 rounded-[14px] px-4 pt-5 pb-3 mb-5 border border-slate-700">
        <h2 className="text-[15px] font-bold text-slate-300 mb-3 ml-1">자산 성장 추이</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={simulation}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              interval={Math.max(1, Math.floor(months / 10) - 1)}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip fx={fx} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="totalAsset"
              name="총 자산"
              stroke="#3B82F6"
              fill="url(#assetGrad)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="totalInvested"
              name="투자 원금"
              stroke="#6B7280"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cumulativeDividend"
              name="누적 배당"
              stroke="#F59E0B"
              strokeWidth={1.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart: Annual Dividend */}
      <div className="bg-slate-800 rounded-[14px] px-4 pt-5 pb-3 mb-5 border border-slate-700">
        <h2 className="text-[15px] font-bold text-slate-300 mb-3 ml-1">연 배당금 추이</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={annualDividends}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip fx={fx} />} />
            <Bar
              dataKey="annualDividend"
              name="연 배당금"
              fill="#10B981"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Holdings breakdown */}
      <div className="bg-slate-800 rounded-[14px] px-4 pt-5 pb-3 mb-5 border border-slate-700">
        <h2 className="text-[15px] font-bold text-slate-300 mb-3 ml-1">ETF별 보유 주식 수 추이</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={simulation}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              interval={Math.max(1, Math.floor(months / 10) - 1)}
            />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip showKRW={false} fx={fx} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {etfs.map((etf) => (
              <Area
                key={etf.ticker}
                type="monotone"
                dataKey={etf.ticker}
                name={etf.ticker}
                stackId="1"
                stroke={etf.color}
                fill={etf.color}
                fillOpacity={0.6}
                unit="shares"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
});
