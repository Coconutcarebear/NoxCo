"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { FY26_BUDGET, H2_FORECAST } from "@/lib/constants";
import { computeKpis, alertLevel, ALERT_COPY, totalSpendOf } from "@/lib/budget";
import { money, compactMoney } from "@/lib/format";
import { Card, Pill, BloomBar } from "@/components/ui";
import { PageHeader } from "@/components/widgets";

export default function BloomForecastPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const engagements = useStore((s) => s.scopedEngagements);
  const active = views;
  const kpis = useMemo(() => computeKpis(engagements), [engagements]);

  const avgCost = active.length ? active.reduce((s, c) => s + totalSpendOf(c), 0) / active.length : 1500;
  const plannedH2 = H2_FORECAST.reduce((s, m) => s + m.spend, 0);

  const [h2Mult, setH2Mult] = useState(100); // % of planned H2 spend
  const [extra, setExtra] = useState(0); // extra creators
  const [boostShift, setBoostShift] = useState(0); // +/- % on current boost

  const projected = useMemo(() => {
    const adjBoost = kpis.boostSpend * (boostShift / 100);
    const adjH2 = plannedH2 * (h2Mult / 100);
    const extraSpend = extra * avgCost;
    return kpis.committed + adjBoost + adjH2 + extraSpend;
  }, [kpis, boostShift, h2Mult, plannedH2, extra, avgCost]);

  const remaining = FY26_BUDGET - projected;
  const util = projected / FY26_BUDGET;
  const level = alertLevel(util);
  const copy = ALERT_COPY[level];

  const maxMonth = Math.max(...H2_FORECAST.map((m) => m.spend));

  return (
    <div className="space-y-4">
      <PageHeader title="Star Forecast" sub="Forecasting" icon="CloudSun" />

      {/* Simulator */}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="space-y-5 p-6">
            <h2 className="font-display text-lg text-ink">Forecast the season</h2>
            <Slider label="H2 spend plan" value={h2Mult} min={50} max={150} step={5} suffix="%" onChange={setH2Mult} hint={`${money(plannedH2 * (h2Mult / 100))} planned for Jul–Dec`} />
            <Slider label="Extra creators to add" value={extra} min={0} max={15} step={1} suffix="" onChange={setExtra} hint={`≈ ${money(extra * avgCost)} at avg ${compactMoney(avgCost)} / star`} />
            <Slider label="Boost adjustment" value={boostShift} min={-30} max={50} step={5} suffix="%" onChange={setBoostShift} hint={`${boostShift >= 0 ? "+" : ""}${money(kpis.boostSpend * (boostShift / 100))} vs current boost`} />
          </div>

          <div className="flex flex-col justify-center gap-4 p-6" style={{ background: `linear-gradient(140deg, ${copy.hue}33, #111114)` }}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Projected year-end</div>
              <div className="font-display text-4xl text-ink">{money(projected)}</div>
            </div>
            <BloomBar value={Math.min(util, 1.2)} hue={copy.hue} height={16} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">of {money(FY26_BUDGET)} budget</span>
              <span className={remaining < 0 ? "font-semibold text-bubblegum" : "font-semibold text-seafoam-deep"}>
                {remaining < 0 ? `${money(-remaining)} over` : `${money(remaining)} clear`}
              </span>
            </div>
            <div className="flex items-start gap-2 rounded-2xl bg-white/5 p-3 text-sm">
              <Icons.Sparkles size={18} className="mt-0.5 shrink-0 text-dusty" />
              <div>
                <div className="font-display text-ink">{copy.title}</div>
                <div className="text-ink-soft">{copy.line}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* H2 monthly plan */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">H2 growth plan (Jul–Dec)</h2>
          <Pill>{H2_FORECAST.reduce((s, m) => s + m.creators, 0)} creators · {money(plannedH2)}</Pill>
        </div>
        <div className="space-y-3">
          {H2_FORECAST.map((m) => (
            <div key={m.month} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-sm font-semibold text-ink">{m.month}</div>
              <div className="flex-1"><BloomBar value={m.spend / maxMonth} hue="#8A8C96" height={14} /></div>
              <div className="w-24 shrink-0 text-right text-sm text-ink-soft">{m.creators} stars</div>
              <div className="w-20 shrink-0 text-right text-sm font-semibold text-ink">{compactMoney(m.spend)}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Committed now" value={money(kpis.committed)} />
        <MiniStat label="Planned H2" value={money(plannedH2 * (h2Mult / 100))} />
        <MiniStat label="Projected" value={money(projected)} />
        <MiniStat label={remaining < 0 ? "Over budget" : "Room to grow"} value={money(Math.abs(remaining))} accent={remaining < 0 ? "#6C6D76" : "#E5E6EA"} />
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, suffix, onChange, hint }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="rounded-full bg-sky px-2.5 py-0.5 text-sm font-bold text-ink">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-dusty-deep" />
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value, accent = "#C7C9D1" }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-1 font-display text-xl text-ink">{value}</div>
      <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: accent }} />
    </Card>
  );
}
