"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { computeKpis, alertLevel, totalSpendOf, scopeBudget } from "@/lib/budget";
import { money, compactMoney, fmtDateTime, num } from "@/lib/format";
import { STAGE_HUE } from "@/lib/constants";
import { Card, Badge, Pill } from "@/components/ui";
import { PageHeader, KpiCard, AlertBanner, SpendBars } from "@/components/widgets";
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

  return (
    <div className="space-y-6">
      <PageHeader title="Nightfall" sub="Dashboard" icon="Flower2" />

      <AlertBanner level={level} committed={kpis.committed} budget={kpis.budget} remaining={kpis.remaining} />

      {/* Budget under the stars rail */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Budget under the stars</h2>
          <Pill>{(kpis.utilization * 100).toFixed(1)}% committed</Pill>
        </div>
        <div className="h-5 w-full overflow-hidden rounded-full bg-sky">
          <div className="flex h-full">
            <div className="h-full" style={{ width: `${kpis.creatorPct * kpis.utilization * 100}%`, background: "#8FA8D8" }} title="Creator spend" />
            <div className="h-full" style={{ width: `${kpis.boostPct * kpis.utilization * 100}%`, background: "#9FE0CE" }} title="Boost spend" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-dusty" /> Creator <b className="text-ink">{money(kpis.creatorSpend)}</b></span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-seafoam" /> Boost <b className="text-ink">{money(kpis.boostSpend)}</b></span>
          <span className="ml-auto text-ink-soft">Committed <b className="text-ink">{money(kpis.committed)}</b> · Remaining <b className="text-seafoam-deep">{money(kpis.remaining)}</b></span>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <KpiCard label="Budget" value={compactMoney(kpis.budget)} icon="Wallet" hue="#EAF4FF" />
        <KpiCard label="Creator spend" value={compactMoney(kpis.creatorSpend)} icon="Star" hue="#B7C8EA" />
        <KpiCard label="Boost spend" value={compactMoney(kpis.boostSpend)} icon="Rocket" hue="#C9F0E6" />
        <KpiCard label="Total committed" value={compactMoney(kpis.committed)} icon="Coins" hue="#FEF3C7" />
        <KpiCard label="Remaining" value={compactMoney(kpis.remaining)} hint={kpis.remaining < 0 ? "over budget" : "room to grow"} icon="Sprout" hue="#C9F0E6" />
        <KpiCard label="In talks" value={String(kpis.activeNegotiations)} hint="active negotiations" icon="MessageCircle" hue="#FEF3C7" />
        <KpiCard label="Contracts out" value={String(kpis.contractsOutstanding)} hint="awaiting signature" icon="ScrollText" hue="#FFE7D8" />
        <KpiCard label="Pending invoices" value={String(kpis.pendingInvoices)} icon="Receipt" hue="#FFE0EC" />
        <KpiCard label="Awaiting approval" value={String(kpis.contentAwaitingApproval)} hint="stars queued" icon="Inbox" hue="#FFE0EC" />
        <KpiCard label="Total creators" value={String(kpis.distinctCreators)} hint="under the stars" icon="Users" hue="#E4D6F7" />
        <KpiCard label="Stars aligned" value={String(kpis.postsPublished)} hint="posts live" icon="Sparkles" hue="#FEF3C7" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Spend by eclipse</h2>
          <SpendBars rows={byCampaign} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Spend by platform</h2>
          <SpendBars rows={byPlatform} />
        </Card>
      </div>

      {/* Needs a night owl */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionList title="Awaiting approval" hint="Transmitted" items={awaitingApproval} onOpen={setOpenId} icon="Inbox" />
        <AttentionList title="Contracts in the vault" hint="sent, not signed" items={contractsOut} onOpen={setOpenId} icon="ScrollText" />
        <AttentionList title="Stardust pending" hint="invoices to clear" items={pendingInvoices} onOpen={setOpenId} icon="Coins" />
      </div>

      {/* Recent activity */}
      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg text-ink">Night log</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-ink-soft">{ready ? "Quiet skies — no activity yet." : "Loading the journal…"}</p>
        ) : (
          <ol className="space-y-2">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-seafoam-soft text-navy-deep">
                  <Icons.Sparkle size={14} />
                </span>
                <span className="flex-1 text-ink">{a.text}</span>
                <span className="text-xs text-ink-faint">{fmtDateTime(a.created_at)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}

function AttentionList({ title, hint, items, onOpen, icon }: { title: string; hint: string; items: any[]; onOpen: (id: string) => void; icon: string }) {
  const Cmp = (Icons as Record<string, any>)[icon] ?? Icons.Star;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Cmp size={16} className="text-dusty-deep" />
        <h3 className="font-display text-base text-ink">{title}</h3>
        <Pill className="ml-auto">{items.length}</Pill>
      </div>
      <div className="mb-2 text-xs text-ink-faint">{hint}</div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white/60 py-6 text-center text-sm text-ink-soft">All clear here ✨</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 6).map((c) => (
            <li key={c.id}>
              <button onClick={() => onOpen(c.id)} className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm hover:bg-sky">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{c.name}</span>
                  <span className="block truncate text-xs text-ink-faint">{c.campaign ?? "—"}</span>
                </span>
                <Badge hue={STAGE_HUE[c.stage]}>{c.stage}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
