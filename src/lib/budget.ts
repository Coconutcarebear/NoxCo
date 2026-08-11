import type { Engagement, Tier, InternalBoost, Company, Post, RoiSettings } from "./types";
import { FY26_BUDGET, PUBLISHED_STAGES } from "./constants";

// A spend-bearing thing: an engagement or an engagement view.
type SpendLike = Pick<Engagement, "creator_fee" | "boost_spend">;
type CostLike = Pick<
  Engagement,
  "negotiated_rate" | "usage_rights_fee" | "whitelisting_fee" | "travel_cost"
>;

export function tierFor(totalSpend: number | null | undefined): Tier {
  const v = Number(totalSpend ?? 0);
  if (v >= 3000) return "Premium";
  if (v >= 1000) return "Mid";
  return "Support";
}

export const TIER_HUE: Record<Tier, string> = {
  Support: "#B7C8EA",
  Mid: "#CDB4F0",
  Premium: "#FDE68A",
};

// Spend on this journey = creator fee + boost spend.
export function totalSpendOf(e: SpendLike): number {
  return Number(e.creator_fee ?? 0) + Number(e.boost_spend ?? 0);
}

// What the creator costs for this engagement. Falls back to the profile's
// standard rate when no negotiated rate is set. (Was a generated DB column in v1;
// computed here now that standard_rate lives on the profile.)
export function totalCreatorCostOf(e: CostLike, standardRate: number | null | undefined = 0): number {
  const base = Number(e.negotiated_rate ?? standardRate ?? 0);
  return (
    base +
    Number(e.usage_rights_fee ?? 0) +
    Number(e.whitelisting_fee ?? 0) +
    Number(e.travel_cost ?? 0)
  );
}

export interface Kpis {
  budget: number;
  creatorSpend: number;
  boostSpend: number;
  internalSpend: number;
  committed: number;
  remaining: number;
  utilization: number; // 0..1+
  creatorPct: number;
  boostPct: number;
  internalPct: number;
  activeNegotiations: number;
  contractsOutstanding: number;
  pendingInvoices: number;
  contentAwaitingApproval: number;
  totalEngagements: number;
  distinctCreators: number;
  postsPublished: number;
}

// Compute budget KPIs from engagements (+ optional internal boosts).
export function computeKpis(engagements: Engagement[], internalBoosts: InternalBoost[] = [], budget: number = FY26_BUDGET): Kpis {
  const active = engagements.filter((e) => !e.archived);
  const creatorSpend = active.reduce((s, e) => s + Number(e.creator_fee ?? 0), 0);
  const boostSpend = active.reduce((s, e) => s + Number(e.boost_spend ?? 0), 0);
  const internalSpend = internalBoosts.reduce((s, b) => s + Number(b.amount ?? 0), 0);
  const committed = creatorSpend + boostSpend + internalSpend;
  const remaining = budget - committed;
  const distinct = new Set(active.map((e) => e.creator_id)).size;
  return {
    budget,
    creatorSpend,
    boostSpend,
    internalSpend,
    committed,
    remaining,
    utilization: budget > 0 ? committed / budget : 0,
    creatorPct: committed > 0 ? creatorSpend / committed : 0,
    boostPct: committed > 0 ? boostSpend / committed : 0,
    internalPct: committed > 0 ? internalSpend / committed : 0,
    activeNegotiations: active.filter((e) => e.stage === "Aligning").length,
    contractsOutstanding: active.filter((e) => e.contract_status === "Sent").length,
    pendingInvoices: active.filter(
      (e) =>
        e.invoice_status === "Received" ||
        e.invoice_status === "Submitted To Billing" ||
        e.invoice_status === "Processing"
    ).length,
    contentAwaitingApproval: active.filter((e) => e.stage === "Transmitted").length,
    totalEngagements: active.length,
    distinctCreators: distinct,
    postsPublished: active.filter((e) => PUBLISHED_STAGES.includes(e.stage)).length,
  };
}

export type AlertLevel = "under" | "approaching" | "over";
export function alertLevel(utilization: number): AlertLevel {
  if (utilization > 1) return "over";
  if (utilization >= 0.85) return "approaching";
  return "under";
}

export const ALERT_COPY: Record<AlertLevel, { title: string; line: string; hue: string }> = {
  under: {
    title: "Shining bright, under budget",
    line: "Plenty of open sky ahead. You're well within budget.",
    hue: "#9FE0CE",
  },
  approaching: {
    title: "Approaching the budget line",
    line: "The sky's filling up fast. Keep an eye on new bookings before committing more spend.",
    hue: "#FDE68A",
  },
  over: {
    title: "Projected over budget",
    line: "Overcast, committed spend has crossed the budget. Trim or reallocate.",
    hue: "#FFC9DE",
  },
};

// Budget for the current client scope: the active client's budget if set,
// otherwise the sum of all client budgets, falling back to the global default.
export function scopeBudget(companies: Company[], activeCompanyId: string | null): number {
  if (activeCompanyId) {
    const c = companies.find((x) => x.id === activeCompanyId);
    return c && Number(c.budget) > 0 ? Number(c.budget) : FY26_BUDGET;
  }
  const sum = companies.reduce((s, c) => s + Number(c.budget ?? 0), 0);
  return sum > 0 ? sum : FY26_BUDGET;
}


// ---- post-level EMV / ROI / sentiment (shared by the Logbook + creator analytics) ----
export const postEngagementOf = (p: Post) =>
  Number(p.likes || 0) + Number(p.comments || 0) + Number(p.shares || 0) + Number(p.saves || 0);
export const postCostOf = (p: Post) => Number(p.fee || 0) + Number(p.boost_spend || 0);
export function ratesFor(r: RoiSettings, platform: string | null | undefined): { per_k_views: number; per_engagement: number } {
  const pr = r.platform_rates?.[String(platform ?? "")];
  return {
    per_k_views: typeof pr?.per_k_views === "number" ? pr!.per_k_views : r.per_k_views,
    per_engagement: typeof pr?.per_engagement === "number" ? pr!.per_engagement : r.per_engagement,
  };
}
// EMV per platform row (so a post spanning IG + TikTok values each at its own rate), summed.
export const emvOfPost = (p: Post, r: RoiSettings) => {
  const rows = Array.isArray(p.platforms) ? p.platforms : [];
  const rowViews = rows.reduce((s, row) => s + Number(row.views || 0), 0);
  if (rows.length && rowViews > 0) {
    return rows.reduce((sum, row) => {
      const rate = ratesFor(r, row.platform || p.platform);
      const eng = Number(row.likes || 0) + Number(row.comments || 0) + Number(row.shares || 0) + Number(row.saves || 0);
      return sum + (Number(row.views || 0) / 1000) * rate.per_k_views + eng * rate.per_engagement;
    }, 0);
  }
  // stories / aggregate-only posts: value the top-level totals at the post's platform rate
  const rate = ratesFor(r, p.platform || rows[0]?.platform);
  return (Number(p.views || 0) / 1000) * rate.per_k_views + postEngagementOf(p) * rate.per_engagement;
};
export function followerTierMult(followers: number | null | undefined) {
  const f = Number(followers || 0);
  if (f >= 250000) return 2.5;
  if (f >= 50000) return 2;
  if (f >= 10000) return 1.5;
  return 1;
}
export const sentRawOf = (p: Post) =>
  (Number(p.comments || 0) > 0 ? 1 : 0) + Number(p.sent_positive || 0) + Number(p.sent_negative || 0);
export const sentScoreOf = (p: Post, followers: number | null | undefined) =>
  sentRawOf(p) * followerTierMult(followers);
export const qEmvOfPost = (p: Post, r: RoiSettings) =>
  emvOfPost(p, r) * (1 + sentRawOf(p) * (r.sentiment_weight ?? 0));
