"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { INVOICE_STATUSES } from "@/lib/constants";
import { totalSpendOf, computeKpis, scopeBudget } from "@/lib/budget";
import { money, fmtDate, initials } from "@/lib/format";
import { Card, Badge, Button, EmptyState, BloomBar, Pill } from "@/components/ui";
import { PageHeader, KpiCard } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

const HUE: Record<string, string> = {
  "Not Received": "#B7C8EA", Received: "#FDE68A", "Submitted To Billing": "#FFD3BA",
  Processing: "#E4D6F7", Paid: "#9FE0CE",
};

export default function TreasuryPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const engagements = useStore((s) => s.scopedEngagements);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const internalBoosts = useStore((s) => s.scopedInternalBoosts);
  const companies = useStore((s) => s.companies);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const active = views.filter((v) => !v.is_organic);
  const list = useMemo(() => (filter ? active.filter((c) => c.invoice_status === filter) : active), [active, filter]);
  const campName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? "—";

  const paid = active.filter((c) => c.invoice_status === "Paid");
  const outstanding = active.filter((c) => ["Received", "Submitted To Billing", "Processing"].includes(c.invoice_status));
  const paidAmt = paid.reduce((s, c) => s + totalSpendOf(c), 0);
  const outAmt = outstanding.reduce((s, c) => s + totalSpendOf(c), 0);

  const budget = scopeBudget(companies, activeCompanyId);
  const kpis = useMemo(() => computeKpis(engagements, internalBoosts, budget), [engagements, internalBoosts, budget]);

  return (
    <div>
      <PageHeader title="Treasury" sub="Invoices" icon="Coins" />

      {/* Budget committed (now including internal boosting) */}
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-faint">Committed of budget</div>
            <div className="font-display text-2xl text-ink">
              {money(kpis.committed)} <span className="text-base text-ink-soft">of {money(kpis.budget)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-ink-faint">Remaining</div>
            <div className={"font-display text-xl " + (kpis.remaining < 0 ? "text-bubblegum" : "text-seafoam-deep")}>
              {money(kpis.remaining)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <BloomBar value={kpis.utilization} hue={kpis.remaining < 0 ? "#FFC9DE" : "#8FA8D8"} height={12} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
          <span>Creator fees: <b className="text-ink">{money(kpis.creatorSpend)}</b></span>
          <span>Creator boosting: <b className="text-ink">{money(kpis.boostSpend)}</b></span>
          <span>Internal boosting: <b className="text-ink">{money(kpis.internalSpend)}</b></span>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Outstanding" value={String(outstanding.length)} hint="invoices to clear" icon="Hourglass" hue="#FFE7D8" />
        <KpiCard label="Amount outstanding" value={money(outAmt)} icon="Receipt" hue="#FEF3C7" />
        <KpiCard label="Paid in full" value={String(paid.length)} hint="journeys complete" icon="BadgeCheck" hue="#C9F0E6" />
        <KpiCard label="Amount paid" value={money(paidAmt)} icon="PiggyBank" hue="#E4D6F7" />
        <KpiCard label="Internal boosting" value={money(kpis.internalSpend)} hint="your own socials" icon="Megaphone" hue="#E4D6F7" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button variant={filter === "" ? "primary" : "soft"} onClick={() => setFilter("")}>All</Button>
        {INVOICE_STATUSES.map((s) => (
          <Button key={s} variant={filter === s ? "primary" : "soft"} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="The treasury is settled." hint="No invoices match this filter." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Creator</th>
                  <th className="px-3 py-3 font-semibold">Eclipse</th>
                  <th className="px-3 py-3 font-semibold">Invoice status</th>
                  <th className="px-3 py-3 font-semibold">Received</th>
                  <th className="px-3 py-3 font-semibold">Paid</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer border-t border-sky/80 hover:bg-sky/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-lavender text-xs font-bold text-navy-deep">{initials(c.name)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{c.name}</span>
                          <span className="block truncate text-xs text-ink-faint">{c.handle}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{c.campaign ?? "—"}</td>
                    <td className="px-3 py-2.5"><Badge hue={HUE[c.invoice_status]}>{c.invoice_status}</Badge></td>
                    <td className="px-3 py-2.5 text-ink-soft">{fmtDate(c.invoice_received_date)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{fmtDate(c.payment_date)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-ink">{money(totalSpendOf(c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Internal boosts — your own socials (managed in the Almanac) */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Internal boosts</h2>
          <Pill>{money(kpis.internalSpend)} total</Pill>
        </div>
        {internalBoosts.length === 0 ? (
          <EmptyState title="No internal boosts yet." hint="Add them in the Almanac, under Internal boosts." />
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Boost</th>
                    <th className="px-3 py-3 font-semibold">Platform</th>
                    <th className="px-3 py-3 font-semibold">Eclipse</th>
                    <th className="px-3 py-3 font-semibold">Dates</th>
                    <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {internalBoosts.map((b) => (
                    <tr key={b.id} className="border-t border-sky/80">
                      <td className="px-4 py-2.5 font-semibold text-ink">{b.label}</td>
                      <td className="px-3 py-2.5 text-ink-soft">{b.platform}</td>
                      <td className="px-3 py-2.5 text-ink-soft">{campName(b.campaign_id)}</td>
                      <td className="px-3 py-2.5 text-ink-soft">
                        {b.boost_start ? `${fmtDate(b.boost_start)}${b.boost_end ? " → " + fmtDate(b.boost_end) : ""}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink">{money(Number(b.amount || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}
