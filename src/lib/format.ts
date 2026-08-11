export function money(n: number | null | undefined, opts?: { cents?: boolean }): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.cents ? 2 : v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function compactMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1000) return "$" + (v / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return money(v);
}

export function num(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString("en-US");
}

export function compactNum(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(v);
}

export function pct(n: number | null | undefined, digits = 0): string {
  return `${(Number(n ?? 0) * 100).toFixed(digits)}%`;
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function relativeDay(d: string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return fmtDate(d);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
