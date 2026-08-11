"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { STAGES, STAGE_HUE, STAGE_MEANING, PUBLISHED_STAGES } from "@/lib/constants";
import { scopeBudget } from "@/lib/budget";
import { money, compactMoney, num, pct, fmtDate } from "@/lib/format";
import type { EngagementView, Post, RoiSettings } from "@/lib/types";
import { Card, Pill, Badge, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";
import { ClientReport } from "@/components/ClientReport";

// ---- date helpers ------------------------------------------------------
const todayStr = new Date().toISOString().slice(0, 10);
const day0 = new Date(todayStr + "T00:00:00").getTime();
function daysUntil(d?: string | null): number | null {
  if (!d) return null;
  return Math.round((new Date(d + "T00:00:00").getTime() - day0) / 86400000);
}
const inNext = (d: string | null | undefined, n: number) => { const u = daysUntil(d); return u !== null && u >= 0 && u <= n; };
const isToday = (d: string | null | undefined) => daysUntil(d) === 0;
const isOverdue = (d: string | null | undefined) => { const u = daysUntil(d); return u !== null && u < 0; };

const sIdx = (s: string) => STAGES.indexOf(s as never);
const isPublished = (s: string) => (PUBLISHED_STAGES as string[]).includes(s);
const isSignedStage = (s: string) => sIdx(s) >= sIdx("Locked In") && s !== "Star-Crossed";

// ---- EMV (mirrors Logbook) ---------------------------------------------
const engOf = (p: Post) => Number(p.likes || 0) + Number(p.comments || 0) + Number(p.shares || 0) + Number(p.saves || 0);
const costOf = (p: Post) => Number(p.fee || 0) + Number(p.boost_spend || 0);
const sentRaw = (p: Post) => (Number(p.comments || 0) > 0 ? 1 : 0) + Number(p.sent_positive || 0) + Number(p.sent_negative || 0);
const emvOf = (p: Post, r: RoiSettings) => ((Number(p.views || 0) / 1000) * r.per_k_views + engOf(p) * r.per_engagement) * (1 + sentRaw(p) * (r.sentiment_weight ?? 0));

type Metrics = { views: number; eng: number; saves: number; shares: number; comments: number; emv: number; spend: number; posts: number };
const zero = (): Metrics => ({ views: 0, eng: 0, saves: 0, shares: 0, comments: 0, emv: 0, spend: 0, posts: 0 });
function addPost(m: Metrics, p: Post, r: RoiSettings) {
  m.views += Number(p.views || 0); m.eng += engOf(p); m.saves += Number(p.saves || 0);
  m.shares += Number(p.shares || 0); m.comments += Number(p.comments || 0);
  m.emv += emvOf(p, r); m.spend += costOf(p); m.posts += 1;
}
function addEntry(m: Metrics, e: any, p: Post, r: RoiSettings, withSpend: boolean) {
  const views = Number(e.views || 0);
  const eng = Number(e.likes || 0) + Number(e.comments || 0) + Number(e.shares || 0) + Number(e.saves || 0);
  m.views += views; m.eng += eng; m.saves += Number(e.saves || 0); m.shares += Number(e.shares || 0); m.comments += Number(e.comments || 0);
  m.emv += ((views / 1000) * r.per_k_views + eng * r.per_engagement) * (1 + sentRaw(p) * (r.sentiment_weight ?? 0));
  if (withSpend) m.spend += costOf(p);
  m.posts += 1;
}
const roiOf = (m: Metrics) => (m.spend > 0 ? (m.emv - m.spend) / m.spend : null);
const cpmOf = (m: Metrics) => (m.views > 0 ? (m.spend / m.views) * 1000 : null);
const erOf = (m: Metrics) => (m.views > 0 ? m.eng / m.views : 0);

const BREAKDOWNS = ["Campaign", "Creator", "Platform", "Client"] as const;

export default function ReportPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const posts = useStore((s) => s.scopedPosts);
  const companies = useStore((s) => s.companies);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const rates = useStore((s) => s.roiSettings);
  const [openId, setOpenId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<(typeof BREAKDOWNS)[number]>("Campaign");
  const [clientReport, setClientReport] = useState(false);

  const R = useMemo(() => buildReport(views, campaigns, posts, companies, activeCompanyId, rates), [views, campaigns, posts, companies, activeCompanyId, rates]);
  const rows = useMemo(() => breakdownRows(breakdown, views, posts, campaigns, companies, rates), [breakdown, views, posts, campaigns, companies, rates]);

  return (
    <div className="space-y-5">
      <PageHeader title="Command Report" sub="Executive summary" icon="ClipboardList" action={
        <div className="flex items-center gap-2">
          <button onClick={() => setClientReport(true)} className="inline-flex items-center gap-1.5 rounded-full bg-navy-deep px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy">
            <Icons.FileBarChart size={14} /> Client report
          </button>
          <Pill>{fmtDate(todayStr)}</Pill>
        </div>
      } />

      {clientReport && <ClientReport onClose={() => setClientReport(false)} />}

      {/* NEEDS ATTENTION */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Attn label="Overdue" value={R.risks.late.length} tone="bad" icon="AlarmClock" />
        <Attn label="Due in 48h" value={R.risks.due48.length} tone="warn" icon="Timer" />
        <Attn label="Missing contracts" value={R.risks.noContract.length} tone="warn" icon="ScrollText" />
        <Attn label="Awaiting approval" value={R.risks.awaitingApproval.length} tone="warn" icon="Eye" />
        <Attn label="At-risk campaigns" value={R.campaignsAtRisk} tone="bad" icon="TriangleAlert" />
      </div>

      {/* INSIGHTS */}
      {R.insights.length > 0 && (
        <div className="rounded-3xl p-5 shadow-cozy" style={{ background: "linear-gradient(120deg,#efe9ff,#e7f2ff)" }}>
          <div className="mb-2 flex items-center gap-2 text-dusty-deep"><Icons.Sparkles size={16} /><h2 className="font-display text-lg">Insights</h2></div>
          <ul className="space-y-1.5">
            {R.insights.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink"><Icons.Dot size={18} className="-ml-1 shrink-0 text-dusty-deep" /><span>{t}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* CAMPAIGN OVERVIEW */}
      <Section title="Campaign overview" icon="Rocket">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Active" value={R.co.active} />
          <Mini label="Launching this week" value={R.co.launching} />
          <Mini label="Ending this week" value={R.co.ending} />
          <Mini label="Completed" value={R.co.completed} />
          <Mini label="Awaiting deliverables" value={R.co.awaitingDeliverables} />
          <Mini label="Awaiting approval" value={R.co.awaitingApproval} />
          <Mini label="Awaiting payment" value={R.co.awaitingPayment} />
          <Mini label="At risk" value={R.co.atRisk} tone={R.co.atRisk > 0 ? "bad" : undefined} />
        </div>
        {R.pacing.length > 0 && (
          <div className="mt-4 space-y-2">
            {R.pacing.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{p.name}</span>
                <span className="text-xs text-ink-faint">{p.window}</span>
                <PaceBadge pace={p.pace} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* CREATOR ACTIVITY */}
      <Section title="Creator activity" icon="Users">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STAGE_HUE[s] }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{s}</span>
                <span className="block text-[11px] text-ink-faint">{STAGE_MEANING[s]}</span>
              </span>
              <span className="font-display text-lg text-ink">{R.stageCounts[s] ?? 0}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* CALENDAR */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Calendar — next 7 days" icon="CalendarDays">
          <CalLine label="Shoots today" items={R.cal.shootsToday.map((v) => v.name)} />
          <CalLine label="Upcoming shoots" items={R.cal.upcomingShoots.map((v) => `${v.name} · ${fmtDate(v.shoot_date!)}`)} />
          <CalLine label="Posting today" items={R.cal.today.map((v) => v.name)} />
          <CalLine label="Upcoming posts" items={R.cal.upcomingPosts.map((v) => `${v.name} · ${fmtDate(v.post_date!)}`)} />
          <CalLine label="Boosts starting" items={R.cal.boosts.map((v) => `${v.name} · ${fmtDate(v.boost_start!)}`)} />
          <CalLine label="Campaign deadlines (14d)" items={R.cal.deadlines.map((c) => `${c.name} · ${fmtDate(c.end_date!)}`)} />
          <CalLine label="Empty days (no content)" items={R.cal.emptyDays} muted />
        </Section>

        {/* RISKS */}
        <Section title="Risk detection" icon="ShieldAlert">
          <RiskLine label="Late creators" items={R.risks.late.map((v) => `${v.name}${v.post_date ? ` · was due ${fmtDate(v.post_date)}` : ""}`)} tone="bad" />
          <RiskLine label="Deliverables due in 48h" items={R.risks.due48.map((v) => `${v.name} · ${fmtDate(v.post_date!)}`)} tone="warn" />
          <RiskLine label="Missing / unsigned contracts" items={R.risks.noContract.map((v) => v.name)} tone="warn" />
          <RiskLine label="Awaiting approval" items={R.risks.awaitingApproval.map((v) => v.name)} tone="warn" />
          <RiskLine label="Published but unpaid" items={R.risks.unpaid.map((v) => v.name)} tone="warn" />
          <RiskLine label="Missing W-9" items={R.risks.noW9.map((v) => v.name)} tone="warn" />
          <RiskLine label="Missing ACH form" items={R.risks.noACH.map((v) => v.name)} tone="warn" />
          <RiskLine label="Campaigns likely to miss deadline" items={R.risks.missDeadline.map((c) => c.name)} tone="bad" />
        </Section>
      </div>

      {/* PERFORMANCE */}
      <Section title="Performance" icon="LineChart">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Perf label="Views" value={num(R.perf.views)} />
          <Perf label="Engagements" value={num(R.perf.eng)} />
          <Perf label="Eng. rate" value={pct(erOf(R.perf), 1)} />
          <Perf label="EMV" value={compactMoney(R.perf.emv)} />
          <Perf label="Spend" value={compactMoney(R.perf.spend)} />
          <Perf label="ROI" value={roiOf(R.perf) === null ? "—" : `${Math.round(roiOf(R.perf)! * 100)}%`} />
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Break down by</span>
          {BREAKDOWNS.map((b) => (
            <button key={b} onClick={() => setBreakdown(b)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${breakdown === b ? "bg-dusty-deep text-white" : "bg-white/70 text-ink-soft hover:text-dusty-deep"}`}>{b}</button>
          ))}
        </div>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-faint">No logged performance yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-sky/70 text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="py-2 pr-3 font-semibold">{breakdown}</th>
                  <th className="px-3 py-2 text-right font-semibold">Views</th>
                  <th className="px-3 py-2 text-right font-semibold">Eng.</th>
                  <th className="px-3 py-2 text-right font-semibold">ER</th>
                  <th className="px-3 py-2 text-right font-semibold">EMV</th>
                  <th className="px-3 py-2 text-right font-semibold">Spend</th>
                  <th className="px-3 py-2 text-right font-semibold">ROI</th>
                  <th className="px-3 py-2 text-right font-semibold">CPM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-sky/50">
                    <td className="py-2 pr-3 font-semibold text-ink">{r.key}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{num(r.m.views)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{num(r.m.eng)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{pct(erOf(r.m), 1)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{compactMoney(r.m.emv)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{compactMoney(r.m.spend)}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{roiOf(r.m) === null ? "—" : `${Math.round(roiOf(r.m)! * 100)}%`}</td>
                    <td className="px-3 py-2 text-right text-ink-soft">{cpmOf(r.m) === null ? "—" : money(cpmOf(r.m)!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* CLIENTS */}
      {R.clients.length > 0 && (
        <Section title="Client summary" icon="Building2">
          <div className="grid gap-3 md:grid-cols-2">
            {R.clients.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  <span className="font-display text-base text-ink">{c.name}</span>
                  {c.priority !== "Normal" && <Badge hue={c.priority === "High" ? "#FFC9DE" : "#C7D0E0"}>{c.priority}</Badge>}
                  {c.risks > 0 && <span className="ml-auto text-xs font-semibold text-bubblegum">{c.risks} risk{c.risks === 1 ? "" : "s"}</span>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                  <Kv k="Active campaigns" v={String(c.activeCampaigns)} />
                  <Kv k="Creators" v={String(c.creators)} />
                  <Kv k="Spent" v={money(c.spent)} />
                  <Kv k="Remaining" v={c.budget > 0 ? money(c.remaining) : "—"} />
                </div>
                {c.budget > 0 && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky/60">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.spent / c.budget) * 100)}%`, background: c.remaining < 0 ? "#FF9FB0" : "#8FA8D8" }} />
                  </div>
                )}
                <p className="mt-2 text-xs text-ink-faint">Next: {c.nextMilestone}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CREATORS NEEDING FOLLOW-UP */}
      <Section title="Creators needing follow-up" icon="UserCheck">
        {R.followUp.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-faint">Everyone's on track. 🎉</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {R.followUp.map((h) => (
              <button key={h.v.id} onClick={() => setOpenId(h.v.id)} className="rounded-2xl bg-white/70 p-3 text-left transition hover:bg-sky/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-ink">
                    {h.v.is_organic && <Icons.Leaf size={13} className="shrink-0 text-seafoam-deep" />}
                    <span className="truncate">{h.v.name}</span>
                  </span>
                  <HealthDot score={h.score} />
                </div>
                <div className="mt-0.5 text-xs text-ink-faint">{h.v.campaign ?? "no campaign"} · {h.v.stage}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {h.flags.map((f) => <span key={f} className="rounded-full bg-bubblegum/15 px-2 py-0.5 text-[10px] font-semibold text-bubblegum">{f}</span>)}
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}

// ===== report builder ===================================================
function buildReport(views: EngagementView[], campaigns: any[], posts: Post[], companies: any[], activeCompanyId: string | null, rates: RoiSettings) {
  const awaitingApproval = views.filter((v) => v.stage === "Transmitted");
  const late = views.filter((v) => isOverdue(v.post_date) && !isPublished(v.stage) && v.stage !== "Star-Crossed");
  const due48 = views.filter((v) => inNext(v.post_date, 2) && !isPublished(v.stage));
  const noContract = views.filter((v) => !v.is_organic && sIdx(v.stage) >= sIdx("Committed") && v.stage !== "Star-Crossed" && v.contract_status !== "Signed");
  const unpaid = views.filter((v) => !v.is_organic && isPublished(v.stage) && v.invoice_status !== "Paid");
  const noW9 = views.filter((v) => !v.is_organic && isSignedStage(v.stage) && !v.w9_on_file);
  const noACH = views.filter((v) => !v.is_organic && isSignedStage(v.stage) && !v.ach_on_file);

  // pacing per campaign
  const pacing = campaigns.map((c) => {
    const es = views.filter((v) => v.campaign_id === c.id && v.stage !== "Star-Crossed");
    const stageProg = es.length ? es.reduce((s, v) => s + sIdx(v.stage) / (STAGES.length - 2), 0) / es.length : 0;
    const start = daysUntil(c.start_date), end = daysUntil(c.end_date);
    let timeProg = 0;
    if (c.start_date && c.end_date && end !== null && start !== null && end !== start) timeProg = Math.min(1, Math.max(0, (0 - start) / (end - start)));
    let pace: "On track" | "Delayed" | "At risk" = "On track";
    const allDone = es.length > 0 && es.every((v) => v.stage === "Complete");
    if (!allDone) {
      if ((end !== null && end < 0) || timeProg - stageProg > 0.3) pace = "At risk";
      else if (timeProg - stageProg > 0.15) pace = "Delayed";
    }
    const window = c.start_date || c.end_date ? `${c.start_date ? fmtDate(c.start_date) : "?"} – ${c.end_date ? fmtDate(c.end_date) : "?"}` : "no dates";
    return { id: c.id, name: c.name, color: c.color, pace, window, allDone, end };
  });
  const campaignsAtRisk = pacing.filter((p) => p.pace === "At risk").length;
  const missDeadline = pacing.filter((p) => p.pace === "At risk" && p.end !== null && p.end >= 0).map((p) => ({ name: p.name }));

  // campaign overview
  const activeCampaigns = campaigns.filter((c) => !c.end_date || (daysUntil(c.end_date) ?? 0) >= 0);
  const co = {
    active: activeCampaigns.length,
    launching: campaigns.filter((c) => inNext(c.start_date, 7)).length,
    ending: campaigns.filter((c) => inNext(c.end_date, 7)).length,
    completed: pacing.filter((p) => p.allDone).length,
    awaitingDeliverables: campaigns.filter((c) => views.some((v) => v.campaign_id === c.id && (v.stage === "Locked In" || v.stage === "In Motion"))).length,
    awaitingApproval: campaigns.filter((c) => views.some((v) => v.campaign_id === c.id && v.stage === "Transmitted")).length,
    awaitingPayment: campaigns.filter((c) => views.some((v) => v.campaign_id === c.id && isPublished(v.stage) && v.invoice_status !== "Paid")).length,
    atRisk: campaignsAtRisk,
  };

  // stage counts
  const stageCounts: Record<string, number> = {};
  STAGES.forEach((s) => (stageCounts[s] = 0));
  views.forEach((v) => (stageCounts[v.stage] = (stageCounts[v.stage] ?? 0) + 1));

  // calendar
  const cal = {
    shootsToday: views.filter((v) => isToday(v.shoot_date)),
    upcomingShoots: views.filter((v) => inNext(v.shoot_date, 7) && !isToday(v.shoot_date)).sort((a, b) => (a.shoot_date! < b.shoot_date! ? -1 : 1)),
    today: views.filter((v) => isToday(v.post_date)),
    upcomingPosts: views.filter((v) => inNext(v.post_date, 7) && !isToday(v.post_date)).sort((a, b) => (a.post_date! < b.post_date! ? -1 : 1)),
    boosts: views.filter((v) => inNext(v.boost_start, 7)).sort((a, b) => (a.boost_start! < b.boost_start! ? -1 : 1)),
    deadlines: campaigns.filter((c) => inNext(c.end_date, 14)).sort((a, b) => (a.end_date! < b.end_date! ? -1 : 1)),
    emptyDays: emptyDays(views, campaigns),
  };

  // performance totals
  const perf = zero();
  const viewById = new Map(views.map((v) => [v.id, v]));
  posts.forEach((p) => { if (p.engagement_id && viewById.has(p.engagement_id)) addPost(perf, p, rates); });

  // clients
  const clientList = activeCompanyId ? companies.filter((c) => c.id === activeCompanyId) : companies;
  const clients = clientList.map((c) => {
    const cv = views.filter((v) => v.company_id === c.id);
    const spent = cv.reduce((s, v) => s + Number(v.creator_fee || 0) + Number(v.boost_spend || 0), 0);
    const budget = Number(c.budget || 0);
    const nextItems = cv.filter((v) => inNext(v.post_date, 90)).sort((a, b) => (a.post_date! < b.post_date! ? -1 : 1));
    const risks = cv.filter((v) => (isOverdue(v.post_date) && !isPublished(v.stage)) || (isPublished(v.stage) && v.invoice_status !== "Paid")).length;
    return {
      id: c.id, name: c.name, color: c.color, priority: c.priority || "Normal", budget,
      activeCampaigns: campaigns.filter((k) => k.company_id === c.id && (!k.end_date || (daysUntil(k.end_date) ?? 0) >= 0)).length,
      creators: new Set(cv.map((v) => v.creator_id)).size,
      spent, remaining: budget - spent,
      nextMilestone: nextItems[0] ? `${nextItems[0].name} posts ${fmtDate(nextItems[0].post_date!)}` : "nothing scheduled",
      risks,
    };
  });

  // creator health / follow-up
  const scored = views.map((v) => health(v));
  const followUp = scored.filter((h) => h.flags.length > 0).sort((a, b) => a.score - b.score).slice(0, 9);

  // insights
  const insights = buildInsights({ awaitingApproval, late, due48, noContract, unpaid, noW9, noACH, views, campaigns, clients, co });

  return { risks: { late, due48, noContract, awaitingApproval, unpaid, missDeadline, noW9, noACH }, campaignsAtRisk, co, pacing: pacing.slice(0, 8), stageCounts, cal, perf, clients, followUp, insights };
}

function health(v: EngagementView) {
  let score = 100; const flags: string[] = [];
  if (v.stage === "Star-Crossed") return { v, score: 0, flags: ["Fell through"] };
  if (isOverdue(v.post_date) && !isPublished(v.stage)) { score -= 35; flags.push("Overdue"); }
  else if (inNext(v.post_date, 2) && !isPublished(v.stage)) { score -= 10; flags.push("Due soon"); }
  if (!v.is_organic && sIdx(v.stage) >= sIdx("Committed") && v.contract_status !== "Signed") { score -= 20; flags.push("Contract unsigned"); }
  if (!v.is_organic && sIdx(v.stage) >= sIdx("Committed") && v.contract_status !== "Signed") { /* handled above */ }
  if (!v.is_organic && isPublished(v.stage) && v.invoice_status !== "Paid") { score -= 15; flags.push("Payment pending"); }
  if (!v.is_organic && isSignedStage(v.stage) && !v.w9_on_file) { score -= 8; flags.push("No W-9"); }
  if (!v.is_organic && isSignedStage(v.stage) && !v.ach_on_file) { score -= 8; flags.push("No ACH"); }
  if (v.status_tag === "Ghosted") { score -= 25; flags.push("Ghosted"); }
  if (v.stage === "Transmitted") { score -= 8; flags.push("Awaiting approval"); }
  return { v, score: Math.max(0, score), flags };
}

function emptyDays(views: EngagementView[], campaigns: any[]) {
  const busy = new Set<string>();
  views.forEach((v) => { if (v.post_date) busy.add(v.post_date); if (v.boost_start) busy.add(v.boost_start); if (v.shoot_date) busy.add(v.shoot_date); });
  campaigns.forEach((c) => { if (c.end_date) busy.add(c.end_date); });
  const out: string[] = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(day0 + i * 86400000).toISOString().slice(0, 10);
    if (!busy.has(d)) out.push(fmtDate(d));
  }
  return out;
}

function buildInsights(x: any): string[] {
  const out: string[] = [];
  if (x.late.length) out.push(`${x.late.length} creator${x.late.length === 1 ? " is" : "s are"} overdue on deliverables.`);
  if (x.awaitingApproval.length) out.push(`${x.awaitingApproval.length} post${x.awaitingApproval.length === 1 ? "" : "s"} awaiting your approval.`);
  if (x.noContract.length) out.push(`${x.noContract.length} creator${x.noContract.length === 1 ? " has" : "s have"} an unsigned contract past the contract stage.`);
  if (x.unpaid.length) out.push(`${x.unpaid.length} published creator${x.unpaid.length === 1 ? " is" : "s are"} still unpaid.`);
  const noPub = x.campaigns.filter((c: any) => !x.views.some((v: EngagementView) => v.campaign_id === c.id && v.post_date));
  if (noPub.length) out.push(`${noPub.length} campaign${noPub.length === 1 ? " has" : "s have"} no scheduled publish date.`);
  x.clients.forEach((c: any) => { if (c.budget > 0 && c.spent / c.budget >= 0.8) out.push(`${c.name} is at ${Math.round((c.spent / c.budget) * 100)}% of budget.`); });
  const forms = x.noW9?.length ?? 0; const ach = x.noACH?.length ?? 0;
  if (forms || ach) out.push(`${Math.max(forms, ach)} signed creator${Math.max(forms, ach) === 1 ? " is" : "s are"} missing payment paperwork (W-9/ACH).`);
  if (x.co.atRisk) out.push(`${x.co.atRisk} campaign${x.co.atRisk === 1 ? " is" : "s are"} at risk of missing its timeline.`);
  return out.slice(0, 6);
}

function breakdownRows(dim: string, views: EngagementView[], posts: Post[], campaigns: any[], companies: any[], rates: RoiSettings) {
  const viewById = new Map(views.map((v) => [v.id, v]));
  const groups = new Map<string, Metrics>();
  posts.forEach((p) => {
    if (!p.engagement_id) return;
    const v = viewById.get(p.engagement_id);
    if (!v) return;
    if (dim === "Platform") {
      const entries = (p.platforms && p.platforms.length) ? p.platforms : [{ platform: p.platform, url: p.url ?? "", views: p.views, likes: p.likes, comments: p.comments, shares: p.shares, saves: p.saves }];
      entries.forEach((e, i) => {
        const key = e.platform || "—";
        if (!groups.has(key)) groups.set(key, zero());
        addEntry(groups.get(key)!, e, p, rates, i === 0);
      });
      return;
    }
    let key = "—";
    if (dim === "Campaign") key = v.campaign ?? "Unassigned";
    else if (dim === "Creator") key = v.name;
    else if (dim === "Client") key = companies.find((c) => c.id === v.company_id)?.name ?? "Unassigned";
    if (!groups.has(key)) groups.set(key, zero());
    addPost(groups.get(key)!, p, rates);
  });
  return Array.from(groups.entries()).map(([key, m]) => ({ key, m })).sort((a, b) => b.m.emv - a.m.emv);
}

// ===== small UI ==========================================================
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const Ic = (Icons as any)[icon] ?? Icons.Circle;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-ink"><Ic size={17} className="text-dusty-deep" /><h2 className="font-display text-lg">{title}</h2></div>
      {children}
    </Card>
  );
}
function Attn({ label, value, tone, icon }: { label: string; value: number; tone: "bad" | "warn"; icon: string }) {
  const Ic = (Icons as any)[icon] ?? Icons.Circle;
  const hue = value === 0 ? "#9FE0CE" : tone === "bad" ? "#FFC9DE" : "#FDE68A";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: hue }}><Ic size={15} /></span></div>
      <div className="mt-2 font-display text-2xl text-ink">{value}</div>
      <div className="text-[11px] text-ink-faint">{label}</div>
    </Card>
  );
}
function Mini({ label, value, tone }: { label: string; value: number; tone?: "bad" }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2.5">
      <div className={`font-display text-xl ${tone === "bad" && value > 0 ? "text-bubblegum" : "text-ink"}`}>{value}</div>
      <div className="text-[11px] text-ink-faint">{label}</div>
    </div>
  );
}
function Perf({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2.5">
      <div className="font-display text-lg text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}
function Kv({ k, v }: { k: string; v: string }) {
  return <div><span className="text-ink-faint">{k}: </span><span className="font-semibold text-ink">{v}</span></div>;
}
function CalLine({ label, items, muted }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div className="border-t border-sky/50 py-2 first:border-t-0">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label} · {items.length}</div>
      {items.length === 0 ? <p className="text-xs text-ink-faint">—</p> : (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 8).map((t, i) => <span key={i} className={`rounded-full px-2 py-0.5 text-xs ${muted ? "bg-ink-faint/10 text-ink-soft" : "bg-sky/50 text-dusty-deep"}`}>{t}</span>)}
          {items.length > 8 && <span className="text-xs text-ink-faint">+{items.length - 8}</span>}
        </div>
      )}
    </div>
  );
}
function RiskLine({ label, items, tone }: { label: string; items: string[]; tone: "bad" | "warn" }) {
  return (
    <div className="border-t border-sky/50 py-2 first:border-t-0">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <span className={`h-2 w-2 rounded-full ${items.length === 0 ? "bg-seafoam-deep" : tone === "bad" ? "bg-bubblegum" : "bg-butter"}`} />
        {label} · {items.length}
      </div>
      {items.length === 0 ? <p className="text-xs text-ink-faint">all clear</p> : (
        <ul className="space-y-0.5">
          {items.slice(0, 6).map((t, i) => <li key={i} className="text-xs text-ink-soft">{t}</li>)}
          {items.length > 6 && <li className="text-xs text-ink-faint">+{items.length - 6} more</li>}
        </ul>
      )}
    </div>
  );
}
function PaceBadge({ pace }: { pace: string }) {
  const hue = pace === "On track" ? "#9FE0CE" : pace === "Delayed" ? "#FDE68A" : "#FFC9DE";
  return <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-navy-deep" style={{ background: hue }}>{pace}</span>;
}
function HealthDot({ score }: { score: number }) {
  const hue = score >= 70 ? "#6FCBB4" : score >= 40 ? "#FDE68A" : "#FF9FB0";
  return <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft"><span className="h-2.5 w-2.5 rounded-full" style={{ background: hue }} />{score}</span>;
}
