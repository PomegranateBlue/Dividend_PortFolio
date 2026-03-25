import { Dispatch, SetStateAction, memo, useState } from "react";
import { fmtUSD, fmtKRW } from "../utils/format";
import { Etf } from "../types";

interface ShareInputGridProps {
  etfs: Etf[];
  shares: Record<string, number>;
  setShares: Dispatch<SetStateAction<Record<string, number>>>;
  fx: number;
}

function ShareInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  const commit = () => {
    const num = Math.max(0, parseInt(draft, 10) || 0);
    onChange(num);
    setDraft(String(num));
    setEditing(false);
  };

  const displayed = editing ? draft : String(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayed}
      onFocus={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="w-[42px] text-center bg-slate-900 border border-slate-600 rounded-md text-slate-50 text-sm font-bold py-1 [appearance:textfield]"
    />
  );
}

export const ShareInputGrid = memo(({ etfs, shares, setShares, fx }: ShareInputGridProps) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5 mb-2.5">
      {etfs.map((etf) => (
        <div key={etf.ticker} className="bg-slate-800 rounded-[10px] px-3.5 py-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: etf.color }} />
            <span className="text-sm font-extrabold text-slate-50">{etf.ticker}</span>
            <span className="text-[11px] text-slate-500 ml-auto">{fmtUSD(etf.price)}</span>
          </div>
          <div className="text-[10px] text-muted mb-1.5 pl-4">
            {fmtKRW(etf.price * fx)}
            <span
              className={`ml-1.5 ${
                etf.annualGrowth > 0
                  ? "text-emerald-400"
                  : etf.annualGrowth < 0
                    ? "text-red-400"
                    : "text-slate-500"
              }`}
            >
              {etf.annualGrowth > 0 ? "▲" : etf.annualGrowth < 0 ? "▼" : "−"}
              {Math.abs(etf.annualGrowth)}%/yr
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">매월</label>
            <button
              className="w-7 h-7 rounded-md bg-slate-700 text-slate-200 border-none text-base cursor-pointer flex items-center justify-center font-bold"
              onClick={() =>
                setShares((p) => ({
                  ...p,
                  [etf.ticker]: Math.max(0, (p[etf.ticker] || 0) - 1),
                }))
              }
            >
              −
            </button>
            <ShareInput
              value={shares[etf.ticker] || 0}
              onChange={(v) =>
                setShares((p) => ({ ...p, [etf.ticker]: v }))
              }
            />
            <button
              className="w-7 h-7 rounded-md bg-slate-700 text-slate-200 border-none text-base cursor-pointer flex items-center justify-center font-bold"
              onClick={() =>
                setShares((p) => ({
                  ...p,
                  [etf.ticker]: (p[etf.ticker] || 0) + 1,
                }))
              }
            >
              +
            </button>
            <label className="text-xs text-slate-400">주</label>
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5 text-right">
            월 {fmtUSD((shares[etf.ticker] || 0) * etf.price)}
            <span className="text-muted ml-1 text-[10px]">
              ({fmtKRW((shares[etf.ticker] || 0) * etf.price * fx)})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

ShareInputGrid.displayName = "ShareInputGrid";
