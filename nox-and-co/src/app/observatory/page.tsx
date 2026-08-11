"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { tierFor, TIER_HUE, totalSpendOf } from "@/lib/budget";
import { money, compactMoney, num, pct, initials } from "@/lib/format";
import { Card, Pill, EmptyState } from "@/components/ui";
import { PageHeader, SpendBars } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

const PLATFORM_HUE: Record<string, string> = { TikTok: "#FF9FC4", Instagram: "#C9A9F5", YouTube: "#FFB48A", "Multi-platform": "#8FE0C6" };

export default function ObservatoryPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const [openId, setOpenId] = useState<string | null>(null);
  const active = views;

  const stats = useMemo(() => {
    const spend = active.reduce((s, c) => s + totalSpendOf(c), 0);
    const reach = active.reduce((s, c) => s + Number(c.followers ?? 0), 0);
    const engVals = active.map((c) => Number(c.engagement_rate ?? 0)).filter((v) => v > 0);
    const avgEng = engVals.length ? engVals.reduce((a, b) => a + b, 0) / engVals.length : 0;
    return { spend, reach, avgEng, count: active.length };
  }, [active]);

  const tierRows = useMemo(() => {
    const t: Record<string, number> = { Support: 0, Mid: 0, Premium: 0 };
    active.forEach((c) => { t[tierFor(totalSpendOf(c))] += totalSpendOf(c); });
    return Object.entries(t).map(([label, value]) => ({ label, value, color: TIER_HUE[label as keyof typeof TIER_HUE] }));
  }, [active]);

  const platformRows = useMemo(() => {
    const m = new Map<string, number>();
    active.forEach((c) => m.set(c.platform, (m.get(c.platform) ?? 0) + totalSpendOf(c)));
    return Array.from(m.entries()).map(([label, value]) => ({ label, value, color: PLATFORM_HUE[label] })).sort((a, b) => b.value - a.value);
  }, [active]);

  const topStars = useMemo(() => [...active].sort((a, b) => totalSpendOf(b) - totalSpendOf(a)).slice(0, 6), [active]);

  if (active.length === 0) {
    return (
      <div>
        <PageHeader title="Observatory" sub="Analytics" icon="Telescope" />
        <EmptyState title="Nothing to observe yet." hint="Add creators and the constellations will appear." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Observatory" sub="Analytics" icon="Telescope" action={<Pill>{active.length} stars charted</Pill>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Stars charted" value={num(stats.count)} hue="#CDB4F0" />
        <Stat label="Total spend" value={compactMoney(stats.spend)} hue="#9FE0CE" />
        <Stat label="Avg engagement" value={pct(stats.avgEng, 1)} hue="#FDE68A" />
        <Stat label="Combined reach" value={num(stats.reach)} hue="#A9D2F4" />
      </div>

      <div
        className="overflow-hidden rounded-3xl border border-white/10 p-5 text-white shadow-float"
        style={{ background: "radial-gradient(120% 140% at 20% 0%, #2a2f5e 0%, #1c2145 45%, #131635 100%)" }}
      >
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg">Paid-media constellation</h2>
          <span className="text-xs text-white/55">creator fee &rarr; boost spend &middot; bubble = followers</span>
        </div>
        <Scatter creators={active} onPick={setOpenId} />
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/70">
          {Object.entries(PLATFORM_HUE).map(([p, h]) => (
            <span key={p} className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full" style={{ background: h }} /> {p}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Spend by tier</h2>
          <SpendBars rows={tierRows} />
          <p className="mt-3 text-xs text-ink-faint">Support &lt; $1k &middot; Mid $1k&ndash;3k &middot; Premium $3k+</p>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Spend by platform</h2>
          <SpendBars rows={platformRows} />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg text-ink">Brightest stars</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {topStars.map((c) => (
            <button key={c.id} onClick={() => setOpenId(c.id)} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-left transition hover:bg-sky/50">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-lavender text-xs font-bold text-navy-deep">
                {c.profile_image ? <img src={c.profile_image} alt="" className="h-full w-full object-cover" /> : initials(c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{c.name}</span>
                <span className="block text-xs text-ink-faint">{pct(c.engagement_rate, 1)} eng &middot; {num(c.followers)}</span>
              </span>
              <span className="font-display text-sm text-ink">{compactMoney(totalSpendOf(c))}</span>
            </button>
          ))}
        </div>
      </Card>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}

function Stat({ label, value, hue }: { label: string; value: string; hue: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />
        <span className="text-xs uppercase tracking-wide text-ink-faint">{label}</span>
      </div>
      <div className="mt-1 font-display text-2xl text-ink">{value}</div>
    </Card>
  );
}

function Scatter({ creators, onPick }: { creators: any[]; onPick: (id: string) => void }) {
  const W = 760, H = 340, ML = 62, MR = 22, MT = 20, MB = 48;
  const maxFee = Math.max(1, ...creators.map((c) => Number(c.creator_fee ?? 0)));
  const maxBoost = Math.max(1, ...creators.map((c) => Number(c.boost_spend ?? 0)));
  const maxFol = Math.max(1, ...creators.map((c) => Number(c.followers ?? 0)));
  const x = (v: number) => ML + (v / maxFee) * (W - ML - MR);
  const y = (v: number) => H - MB - (v / maxBoost) * (H - MT - MB);
  const r = (v: number) => 5 + (Number(v ?? 0) / maxFol) * 15;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const decoStars = [[120, 60], [300, 40], [520, 90], [660, 50], [200, 120], [600, 150], [420, 70]];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Scatter plot of creator fee versus boost spend, bubble size by followers">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {decoStars.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 2 ? 1.1 : 1.7} fill="#ffffff" opacity="0.5" />
        ))}

        {ticks.map((t) => (
          <g key={"h" + t}>
            <line x1={ML} y1={y(maxBoost * t)} x2={W - MR} y2={y(maxBoost * t)} stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
            <text x={ML - 10} y={y(maxBoost * t) + 4} textAnchor="end" fontSize="10" fill="#c7cdf0">{compactMoney(maxBoost * t)}</text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={"v" + t} x={x(maxFee * t)} y={H - MB + 18} textAnchor="middle" fontSize="10" fill="#c7cdf0">{compactMoney(maxFee * t)}</text>
        ))}

        <text x={ML + (W - ML - MR) / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="#aab2e0">creator fee &rarr;</text>
        <text x={18} y={MT + (H - MT - MB) / 2} textAnchor="middle" fontSize="11" fill="#aab2e0" transform={"rotate(-90 18 " + (MT + (H - MT - MB) / 2) + ")"}>boost spend &rarr;</text>

        {creators.map((c) => (
          <circle
            key={c.id}
            cx={x(Number(c.creator_fee ?? 0))}
            cy={y(Number(c.boost_spend ?? 0))}
            r={r(c.followers)}
            fill={PLATFORM_HUE[c.platform] ?? "#8FA8D8"}
            filter="url(#glow)"
            className="cursor-pointer transition-opacity hover:opacity-100"
            opacity="0.85"
            onClick={() => onPick(c.id)}
          >
            <title>{c.name} &middot; fee {money(c.creator_fee)} &middot; boost {money(c.boost_spend)}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
