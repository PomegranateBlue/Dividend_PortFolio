export const fmt = (n: number) =>
  n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });

export const fmtUSD = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtKRW = (n: number) =>
  "₩" + Math.round(n).toLocaleString("ko-KR");
