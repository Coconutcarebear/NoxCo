"use client";

import { ReactNode } from "react";
import * as Icons from "lucide-react";
import { Card, BloomBar } from "@/components/ui";
import { type AlertLevel, ALERT_COPY } from "@/lib/budget";
import { compactMoney } from "@/lib/format";

export function PageHeader({ title, sub, icon, action }: { title: string; sub: string; icon?: string; action?: ReactNode }) {
  const Cmp = icon ? (Icons as Record<string, any>)[icon] ?? Icons.Star : null;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-dusty-deep">
          {Cmp && <Cmp size={20} />}
          <span className="text-sm font-semibold uppercase tracking-wide">{sub}</span>
        </div>
        <h1 className="font-display text-3xl text-ink">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function KpiCard({ label, value, hint, hue = "#C7C9D1", icon }: { label: string; value: string; hint?: string; hue?: string; icon?: string }) {
  const Cmp = icon ? (Icons as Record<string, any>)[icon] ?? Icons.Star : null;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        {Cmp && (
          <span className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: hue }}>
            <Cmp size={15} className="text-navy-deep" />
          </span>
        )}
      </div>
      <div className="mt-1 font-display text-2xl text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}
    </Card>
  );
}

export function AlertBanner({ level, committed, budget, remaining }: { level: AlertLevel; committed: number; budget: number; remaining: number }) {
  const c = ALERT_COPY[level];
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ background: `linear-gradient(100deg, ${c.hue}2a, #111114)` }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream shadow-cozy">
            <Icons.Sparkles size={22} className="text-dusty" />
          </span>
          <div>
            <div className="font-display text-lg text-ink">{c.title}</div>
            <div className="max-w-md text-sm text-ink-soft">{c.line}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-ink">{compactMoney(remaining)}</div>
          <div className="text-xs text-ink-soft">remaining of {compactMoney(budget)}</div>
        </div>
      </div>
    </Card>
  );
}

export function SpendBars({ rows }: { rows: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-36 shrink-0 truncate text-sm text-ink-soft">{r.label}</div>
          <div className="flex-1">
            <BloomBar value={r.value / max} hue={r.color ?? "#C7C9D1"} height={14} />
          </div>
          <div className="w-16 shrink-0 text-right text-sm font-semibold text-ink">{compactMoney(r.value)}</div>
        </div>
      ))}
    </div>
  );
}
