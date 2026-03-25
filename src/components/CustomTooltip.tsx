import { fmt, fmtUSD, fmtKRW } from "../utils/format";

interface TooltipPayloadEntry {
  color?: string;
  name?: string;
  value: number;
  unit?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  showKRW?: boolean;
  fx: number;
}

export function CustomTooltip({
  active,
  payload,
  label,
  showKRW = true,
  fx,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-[13px]">
      <div className="text-slate-400 mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 mb-[3px]">
          <span style={{ color: p.color || "#E2E8F0" }}>{p.name}</span>
          <span className="text-slate-50 font-semibold">
            {p.unit === "shares"
              ? `${fmt(p.value)}주`
              : `${fmtUSD(p.value)}${showKRW ? ` (${fmtKRW(p.value * fx)})` : ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}
