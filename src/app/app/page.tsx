"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { computeKpis, alertLevel, ALERT_COPY, totalSpendOf, scopeBudget } from "@/lib/budget";
import { money, compactMoney, fmtDateTime } from "@/lib/format";
import { STAGE_HUE } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { PageHeader, KpiCard, SpendBars } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

export default function HarborPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const engagements = useStore((s) => s.scopedEngagements);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const companies = useStore((s) => s.companies);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const activity = useStore((s) => s.activity);
  const ready = useStore((s) => s.ready);
  const [openId, setOpenId] = useState<string | null>(null);

  const active = views;
  const budget = scopeBudget(companies, activeCompanyId);
  const kpis = useMemo(() => computeKpis(engagements, [], budget), [engagements, budget]);
  const level = alertLevel(kpis.utilization);
  const copy = ALERT_COPY[level];

  const byCampaign = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach((c) => map.set(c.campaign ?? "Unassigned", (map.get(c.campaign ?? "Unassigned") ?? 0) + totalSpendOf(c)));
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, color: campaigns.find((x) => x.name === label)?.color }))
      .sort((a, b) => b.value - a.value);
  }, [active, campaigns]);

  const byPlatform = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach((c) => map.set(c.platform, (map.get(c.platform) ?? 0) + totalSpendOf(c)));
    const hues: Record<string, string> = { TikTok: "#FFC9DE", Instagram: "#CDB4F0", YouTube: "#FFD3BA", "Multi-platform": "#9FE0CE" };
    return Array.from(map.entries()).map(([label, value]) => ({ label, value, color: hues[label] })).sort((a, b) => b.value - a.value);
  }, [active]);

  const awaitingApproval = active.filter((c) => c.stage === "Transmitted");
  const contractsOut = active.filter((c) => c.contract_status === "Sent");
  const pendingInvoices = active.filter((c) => ["Received", "Submitted To Billing", "Processing"].includes(c.invoice_status));
  const attention = [
    { label: "Awaiting approval", items: awaitingApproval },
    { label: "Contracts out", items: contractsOut },
    { label: "Invoices pending", items: pendingInvoices },
  ];

  return (
    <div>
      <PageHeader title="Nightfall" sub="Dashboard" icon="Moon" />

      {/* Hero: one big number, quiet secondary stats beside it */}
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{copy.title}</p>
          <p className="mt-3 font-display text-6xl font-medium leading-none text-white">{compactMoney(kpis.committed)}</p>
          <p className="mt-2 text-sm text-white/50">committed of {money(kpis.budget)} budget</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="flex h-full">
              <div className="h-full" style={{ width: `${kpis.creatorPct * kpis.utilization * 100}%`, background: "#8FA8D8" }} />
              <div className="h-full" style={{ width: `${kpis.boostPct * kpis.utilization * 100}%`, background: "#9FE0CE" }} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-dusty" /> Creator {money(kpis.creatorSpend)}</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-seafoam" /> Boost {money(kpis.boostSpend)}</span>
            <span>Remaining <b className="text-seafoam-deep">{money(kpis.remaining)}</b></span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 border-t border-white/10 pt-5 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <KpiCard label="In talks" value={String(kpis.activeNegotiations)} hint="active negotiations" icon="MessageCircle" hue="#B7C8EA" />
          <KpiCard label="Total creators" value={String(kpis.distinctCreators)} hint="under the stars" icon="Users" hue="#CDB4F0" />
          <KpiCard label="Stars aligned" value={String(kpis.postsPublished)} hint="posts live" icon="Sparkles" hue="#9FE0CE" />
        </div>
      </div>

      {/* Secondary stat rail */}
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Contracts out" value={String(kpis.contractsOutstanding)} hint="awaiting signature" icon="ScrollText" hue="#FFD0A0" />
        <KpiCard label="Pending invoices" value={String(kpis.pendingInvoices)} icon="Receipt" hue="#FFC9DE" />
        <KpiCard label="Awaiting approval" value={String(kpis.contentAwaitingApproval)} hint="queued" icon="Inbox" hue="#FFC9DE" />
        <KpiCard label="Boost spend" value={compactMoney(kpis.boostSpend)} icon="Rocket" hue="#9FE0CE" />
        <KpiCard label="Creator spend" value={compactMoney(kpis.creatorSpend)} icon="Star" hue="#8FA8D8" />
        <KpiCard label="Remaining" value={compactMoney(kpis.remaining)} hint={kpis.remaining < 0 ? "over budget" : "room to grow"} icon="TrendingUp" hue="#9FE0CE" />
      </div>

      {/* Spend charts (wide) + attention rail (narrow) */}
      <div className="mt-14 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div>
            <h2 className="mb-4 font-display text-lg text-white">Spend by eclipse</h2>
            <SpendBars rows={byCampaign} />
          </div>
          <div>
            <h2 className="mb-4 font-display text-lg text-white">Spend by platform</h2>
            <SpendBars rows={byPlatform} />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="mb-4 font-display text-lg text-white">Needs a night owl</h2>
          <div className="space-y-6">
            {attention.map((group) => (
              <div key={group.label}>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/40">
                  {group.label} <span className="text-white/25">· {group.items.length}</span>
                </p>
                {group.items.length === 0 ? (
                  <p className="text-xs text-white/30">All clear.</p>
                ) : (
                  <ul className="space-y-1">
                    {group.items.slice(0, 4).map((c) => (
                      <li key={c.id}>
                        <button onClick={() => setOpenId(c.id)} className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-white/5">
                          <span className="min-w-0 truncate text-ink">{c.name}</span>
                          <Badge hue={STAGE_HUE[c.stage]}>{c.stage}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity, quiet timeline */}
      <div className="mt-14 border-t border-white/10 pt-6">
        <h2 className="mb-4 font-display text-lg text-white">Night log</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-white/40">{ready ? "Quiet skies, no activity yet." : "Loading the journal…"}</p>
        ) : (
          <ol className="space-y-3">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-start gap-3 border-l-2 border-white/10 pl-4 text-sm">
                <Icons.Sparkle size={13} className="mt-1 shrink-0 text-white/30" />
                <span className="flex-1 text-white/70">{a.text}</span>
                <span className="shrink-0 text-xs text-white/30">{fmtDateTime(a.created_at)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}
