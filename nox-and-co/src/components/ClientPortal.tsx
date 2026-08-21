"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { computeKpis, alertLevel, ALERT_COPY, scopeBudget } from "@/lib/budget";
import { money, fmtDate } from "@/lib/format";
import { PROJECT_STATUS_HUE, PROJECT_TYPE_ICON, STAGE_MEANING } from "@/lib/constants";
import { computeClientReport, ClientReportView, type ViewLike } from "@/components/ClientReport";
import { Card, Badge, EmptyState } from "@/components/ui";

const RANGES = [7, 31, 90] as const;

function StatusBadge({ status }: { status: string }) {
  return <Badge hue={PROJECT_STATUS_HUE[status] ?? "#8FA8D8"}>{status}</Badge>;
}

export function ClientPortal() {
  const currentUser = useStore((s) => s.currentUser);
  const signOut = useStore((s) => s.signOut);
  const loading = useStore((s) => s.loading);
  const companies = useStore((s) => s.companies);
  const scopedCampaigns = useStore((s) => s.scopedCampaigns);
  const scopedProjects = useStore((s) => s.scopedProjects);
  const scopedEngagements = useStore((s) => s.scopedEngagements);
  const scopedActiveViews = useStore((s) => s.scopedActiveViews);
  const scopedPosts = useStore((s) => s.scopedPosts);
  const roiSettings = useStore((s) => s.roiSettings);

  const [days, setDays] = useState<number>(31);
  const company = companies.find((c) => c.id === currentUser?.company_id) ?? companies[0] ?? null;

  const budget = useMemo(() => scopeBudget(companies, currentUser?.company_id ?? null), [companies, currentUser]);
  const kpis = useMemo(
    () => computeKpis(scopedEngagements, [], budget),
    [scopedEngagements, budget]
  );
  const level = alertLevel(kpis.utilization);
  const copy = ALERT_COPY[level];

  const viewLikes: ViewLike[] = useMemo(
    () => scopedActiveViews.map((v) => ({ id: v.id, creator_id: v.creator_id, stage: v.stage, name: v.name, handle: v.handle, platform: v.platform, campaign: v.campaign })),
    [scopedActiveViews]
  );
  const { rows, tot, rangeLabel } = useMemo(
    () => computeClientReport(viewLikes, scopedPosts, roiSettings, days),
    [viewLikes, scopedPosts, roiSettings, days]
  );

  return (
    <div className="min-h-screen bg-navy-deep text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px 650px at 85% -4%, rgba(90,110,160,0.10), transparent 60%)," +
            "linear-gradient(180deg, #03040a 0%, #070a14 40%, #0a0e1a 72%, #03040a 100%)",
        }}
      />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Nox & Co" className="h-9 w-9 rounded-md" />
          <div>
            <p className="font-display text-lg leading-tight text-white">{company?.name ?? "Your portal"}</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-white/50 sm:inline">{currentUser?.name}</span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <Icons.LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        {loading && !company ? (
          <p className="text-sm text-white/50">Loading your dashboard…</p>
        ) : !company ? (
          <EmptyState title="No company linked yet" hint="Ask your Nox & Co contact to finish setting up your portal." />
        ) : (
          <div className="space-y-8">
            {/* Budget */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Budget</h2>
              <Card className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl text-white">{money(kpis.committed)} <span className="text-base text-white/40">of {money(kpis.budget)}</span></p>
                    <p className="mt-1 text-xs text-white/50">{copy.title}</p>
                  </div>
                  <Badge hue={copy.hue}>{money(Math.max(kpis.remaining, 0))} remaining</Badge>
                </div>
              </Card>
            </section>

            {/* Campaigns */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Campaigns</h2>
              {scopedCampaigns.length === 0 ? (
                <EmptyState title="No campaigns yet" hint="Your first campaign will show up here once it's set up." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {scopedCampaigns.map((c) => {
                    const count = scopedEngagements.filter((e) => e.campaign_id === c.id && !e.archived).length;
                    return (
                      <Card key={c.id} className="p-4">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color || "#8FA8D8" }} />
                          <p className="truncate font-display text-base text-white">{c.name}</p>
                        </div>
                        <p className="mt-1.5 text-xs text-white/50">{count} creator{count === 1 ? "" : "s"} engaged</p>
                        {(c.start_date || c.end_date) && (
                          <p className="mt-1 text-[11px] text-white/35">{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Projects */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Marketing & creative</h2>
              {scopedProjects.length === 0 ? (
                <EmptyState title="No projects yet" hint="Non-influencer work (SEO, paid social, creative, and more) will show up here." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {scopedProjects.filter((p) => !p.archived).map((p) => {
                    const Cmp = (Icons as Record<string, any>)[PROJECT_TYPE_ICON[p.type] ?? "Sparkles"] ?? Icons.Sparkles;
                    return (
                      <Card key={p.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-navy-deep text-lavender">
                              <Cmp size={15} />
                            </span>
                            <div>
                              <p className="font-display text-base text-white">{p.name}</p>
                              <p className="text-[11px] text-white/40">{p.type}</p>
                            </div>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                        {p.due_date && <p className="mt-2 text-[11px] text-white/35">Due {fmtDate(p.due_date)}</p>}
                        {p.description && <p className="mt-2 text-xs leading-relaxed text-white/50">{p.description}</p>}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Performance */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Performance</h2>
                <div className="flex gap-1">
                  {RANGES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${days === d ? "bg-dusty-deep text-navy-deep" : "border border-white/15 text-white/50 hover:text-white"}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              {rows.length === 0 ? (
                <EmptyState title="No published content yet" hint="Live posts and their performance will show up here." />
              ) : (
                <Card className="overflow-hidden p-0">
                  <div className="text-navy-deep">
                    <ClientReportView clientName={company.name} rangeLabel={rangeLabel} rows={rows} tot={tot} />
                  </div>
                </Card>
              )}
            </section>

            <p className="pb-6 text-center text-[11px] text-white/25">
              Stages shown reflect where things stand in our process — {Object.entries(STAGE_MEANING).slice(0, 3).map(([k]) => k).join(", ")}, and beyond.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
