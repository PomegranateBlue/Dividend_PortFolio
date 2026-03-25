import { fmtUSD, fmtKRW } from "../utils/format";

interface DualProps {
  usd: number;
  fx: number;
  size?: string;
  color?: string;
}

export function Dual({ usd, fx, size = "normal", color }: DualProps) {
  const isLarge = size === "large";
  return (
    <div>
      <div
        className={isLarge
          ? "text-xl font-extrabold tracking-tight"
          : "text-sm font-bold"
        }
        style={{ color: color || "#F8FAFC" }}
      >
        {fmtUSD(usd)}
      </div>
      <div className={isLarge ? "text-xs text-slate-500 mt-0.5" : "text-[11px] text-slate-500"}>
        {fmtKRW(usd * fx)}
      </div>
    </div>
  );
}
