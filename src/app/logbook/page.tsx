"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { PLATFORMS, EMV_PLATFORMS, STORY_REACH_DEFAULT } from "@/lib/constants";
import { money, num } from "@/lib/format";
import { type Post, type RoiSettings } from "@/lib/types";
import { emvOfPost, ratesFor } from "@/lib/budget";
import { Card, Button, Field, Input, Modal, Pill, EmptyState } from "@/components/ui";
import { PageHeader, KpiCard } from "@/components/widgets";
import { ImageUpload } from "@/components/ImageUpload";
import { parseVideo } from "@/lib/video";
import { usePerms } from "@/lib/perms";

// ---- EMV / ROI helpers -------------------------------------------------
const engOf = (p: Post) => Number(p.likes || 0) + Number(p.comments || 0) + Number(p.shares || 0) + Number(p.saves || 0);
const costOf = (p: Post) => Number(p.fee || 0) + Number(p.boost_spend || 0);
const emvOf = (p: Post, r: RoiSettings) => emvOfPost(p, r); // platform-aware (per-platform rates)
function initPlat(r: RoiSettings): Record<string, { k: string; e: string }> {
  const out: Record<string, { k: string; e: string }> = {};
  const pr = r.platform_rates || {};
  Object.keys(pr).forEach((key) => {
    out[key] = {
      k: pr[key]?.per_k_views != null ? String(pr[key].per_k_views) : "",
      e: pr[key]?.per_engagement != null ? String(pr[key].per_engagement) : "",
    };
  });
  return out;
}

// ---- Sentiment ---------------------------------------------------------
function tierMult(followers: number | null) {
  const f = Number(followers || 0);
  if (f >= 250000) return 2.5; // Macro
  if (f >= 50000) return 2;    // Mid
  if (f >= 10000) return 1.5;  // Micro
  return 1;                    // Nano
}
function tierLabel(followers: number | null) {
  const f = Number(followers || 0);
  if (f >= 250000) return "Macro ×2.5";
  if (f >= 50000) return "Mid ×2";
  if (f >= 10000) return "Micro ×1.5";
  return "Nano ×1";
}
const baseOf = (p: { comments?: number }) => (Number(p.comments || 0) > 0 ? 1 : 0);
const sentRaw = (p: { comments?: number; sent_positive?: number; sent_negative?: number }) =>
  baseOf(p) + Number(p.sent_positive || 0) + Number(p.sent_negative || 0);
const sentScore = (p: Post, followers: number | null) => sentRaw(p) * tierMult(followers);
const fmtSent = (v: number) => { const r = Math.round(v * 10) / 10; return r > 0 ? "+" + r : "" + r; };

const qEmvOf = (p: Post, r: RoiSettings) => emvOf(p, r) * (1 + sentRaw(p) * (r.sentiment_weight ?? 0));
const qRoiOf = (p: Post, r: RoiSettings) => { const c = costOf(p); return c > 0 ? (qEmvOf(p, r) - c) / c : null; };

function Roi({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-faint">—</span>;
  const pos = value >= 0;
  return <span className={pos ? "font-semibold text-seafoam-deep" : "font-semibold text-bubblegum"}>{(pos ? "+" : "") + (value * 100).toFixed(0)}%</span>;
}
function Sent({ value }: { value: number }) {
  const r = Math.round(value * 10) / 10;
  const cls = r > 0 ? "text-seafoam-deep" : r < 0 ? "text-bubblegum" : "text-ink-soft";
  return <span className={"font-semibold " + cls}>{fmtSent(value)}</span>;
}

type PlatRow = { platform: string; url: string; views: string; likes: string; comments: string; shares: string; saves: string };
const emptyRow = (platform = "Instagram"): PlatRow => ({ platform, url: "", views: "", likes: "", comments: "", shares: "", saves: "" });
const sN = (n: number | null | undefined) => (n ? String(n) : "");
const numRow = (r: PlatRow) => ({ platform: r.platform, url: r.url.trim(), views: Number(r.views) || 0, likes: Number(r.likes) || 0, comments: Number(r.comments) || 0, shares: Number(r.shares) || 0, saves: Number(r.saves) || 0 });
function sumEntries(es: { views: number; likes: number; comments: number; shares: number; saves: number }[]) {
  return es.reduce((a, r) => ({ views: a.views + r.views, likes: a.likes + r.likes, comments: a.comments + r.comments, shares: a.shares + r.shares, saves: a.saves + r.saves }), { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 });
}
function toRows(p: Post): PlatRow[] {
  if (p.platforms && p.platforms.length) return p.platforms.map((e) => ({ platform: e.platform, url: e.url ?? "", views: sN(e.views), likes: sN(e.likes), comments: sN(e.comments), shares: sN(e.shares), saves: sN(e.saves) }));
  return [{ platform: p.platform, url: p.url ?? "", views: sN(p.views), likes: sN(p.likes), comments: sN(p.comments), shares: sN(p.shares), saves: sN(p.saves) }];
}

type PostForm = {
  id?: string;
  engagement_id: string; kind: string; story_count: string; est_per_story: string;
  thumbnail: string; platforms: PlatRow[];
  post_date: string; boost_start: string; boost_end: string;
  fee: string; boost_spend: string;
  sent_positive: string; sent_negative: string;
  notes: string;
};
const BLANK: PostForm = {
  engagement_id: "", kind: "post", story_count: "3", est_per_story: "",
  thumbnail: "", platforms: [emptyRow()],
  post_date: "", boost_start: "", boost_end: "",
  fee: "", boost_spend: "",
  sent_positive: "0", sent_negative: "0",
  notes: "",
};
const toForm = (p: Post): PostForm => ({
  id: p.id,
  engagement_id: p.engagement_id ?? "",
  kind: p.kind ?? "post",
  story_count: p.story_count != null ? String(p.story_count) : "3",
  est_per_story: p.kind === "story" && p.story_count ? String(Math.round(Number(p.views || 0) / p.story_count)) : "",
  thumbnail: p.thumbnail ?? "", platforms: toRows(p),
  post_date: p.post_date ?? "", boost_start: p.boost_start ?? "", boost_end: p.boost_end ?? "",
  fee: String(p.fee ?? ""), boost_spend: String(p.boost_spend ?? ""),
  sent_positive: String(p.sent_positive ?? 0), sent_negative: String(p.sent_negative ?? 0),
  notes: p.notes ?? "",
});

export default function LogbookPage() {
  const views = useStore((s) => s.scopedViews);
  const posts = useStore((s) => s.scopedPosts);
  const rates = useStore((s) => s.roiSettings);
  const addPost = useStore((s) => s.addPost);
  const updatePost = useStore((s) => s.updatePost);
  const deletePost = useStore((s) => s.deletePost);
  const updateRoiSettings = useStore((s) => s.updateRoiSettings);
  const { canEdit, canManageSettings } = usePerms();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PostForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<Post | null>(null);

  const [genK, setGenK] = useState(String(rates.per_k_views));
  const [genE, setGenE] = useState(String(rates.per_engagement));
  const [rw, setRw] = useState(String(rates.sentiment_weight));
  const [platRates, setPlatRates] = useState<Record<string, { k: string; e: string }>>(() => initPlat(rates));
  useEffect(() => {
    setGenK(String(rates.per_k_views));
    setGenE(String(rates.per_engagement));
    setRw(String(rates.sentiment_weight));
    setPlatRates(initPlat(rates));
  }, [rates.per_k_views, rates.per_engagement, rates.sentiment_weight, rates.platform_rates]);
  const setPlat = (plat: string, patch: { k?: string; e?: string }) =>
    setPlatRates((cur) => ({ ...cur, [plat]: { k: cur[plat]?.k ?? "", e: cur[plat]?.e ?? "", ...patch } }));

  const viewById = useMemo(() => new Map(views.map((v) => [v.id, v])), [views]);
  const creatorNameOf = (id: string | null) => viewById.get(id ?? "")?.name ?? "—";
  const followersOf = (id: string | null) => viewById.get(id ?? "")?.followers ?? null;
  const campaignOf = (id: string | null) => viewById.get(id ?? "")?.campaign ?? "Unassigned";
  const sortedViews = useMemo(
    () => [...views].sort((a, b) => a.name.localeCompare(b.name) || (a.campaign ?? "").localeCompare(b.campaign ?? "")),
    [views]
  );

  const totals = useMemo(() => {
    const cost = posts.reduce((s, p) => s + costOf(p), 0);
    const emv = posts.reduce((s, p) => s + qEmvOf(p, rates), 0);
    const sentiment = posts.reduce((s, p) => s + sentScore(p, followersOf(p.engagement_id)), 0);
    return { cost, emv, sentiment, roi: cost > 0 ? (emv - cost) / cost : null };
  }, [posts, rates, views]); // eslint-disable-line react-hooks/exhaustive-deps

  const byCampaign = useMemo(() => {
    const m = new Map<string, { campaign: string; posts: number; cost: number; emv: number; views: number; eng: number; sent: number }>();
    posts.forEach((p) => {
      const key = campaignOf(p.engagement_id);
      const o = m.get(key) || { campaign: key, posts: 0, cost: 0, emv: 0, views: 0, eng: 0, sent: 0 };
      o.posts++; o.cost += costOf(p); o.emv += qEmvOf(p, rates); o.views += Number(p.views || 0); o.eng += engOf(p);
      o.sent += sentScore(p, followersOf(p.engagement_id));
      m.set(key, o);
    });
    return [...m.values()].sort((a, b) => b.emv - a.emv);
  }, [posts, rates, views]); // eslint-disable-line react-hooks/exhaustive-deps

  const byCreator = useMemo(() => {
    const m = new Map<string, { campaign: string; creator: string; posts: number; cost: number; emv: number; sent: number }>();
    posts.forEach((p) => {
      const key = campaignOf(p.engagement_id) + "|||" + (p.engagement_id || "—");
      const o = m.get(key) || { campaign: campaignOf(p.engagement_id), creator: creatorNameOf(p.engagement_id), posts: 0, cost: 0, emv: 0, sent: 0 };
      o.posts++; o.cost += costOf(p); o.emv += qEmvOf(p, rates); o.sent += sentScore(p, followersOf(p.engagement_id));
      m.set(key, o);
    });
    return [...m.values()].sort((a, b) => a.campaign.localeCompare(b.campaign) || b.emv - a.emv);
  }, [posts, rates, views]); // eslint-disable-line react-hooks/exhaustive-deps

  function openNew() { setForm(BLANK); setOpen(true); }
  function openEdit(p: Post) { setForm(toForm(p)); setOpen(true); }

  // Selecting a creator/eclipse fills the post's dates from that engagement's
  // schedule — but only into fields that are still empty, so edits aren't clobbered.
  function pickEngagement(id: string) {
    const v = viewById.get(id);
    setForm((f) => ({
      ...f,
      engagement_id: id,
      post_date: f.post_date || v?.post_date || "",
      boost_start: f.boost_start || v?.boost_start || "",
      boost_end: f.boost_end || v?.boost_end || "",
    }));
  }

  // Explicitly pull the creator's schedule dates (overwrites only where the
  // schedule actually has a date set).
  function pullScheduleDates() {
    const v = viewById.get(form.engagement_id);
    if (!v) return;
    setForm((f) => ({
      ...f,
      post_date: v.post_date ?? f.post_date,
      boost_start: v.boost_start ?? f.boost_start,
      boost_end: v.boost_end ?? f.boost_end,
    }));
  }

  async function save() {
    if (saving || !form.engagement_id) return;
    setSaving(true);
    const isStory = form.kind === "story";
    const storyCount = Number(form.story_count) || 0;
    const perStory = Number(form.est_per_story) || 0;
    let entries;
    if (isStory) {
      const r0 = form.platforms[0] ?? emptyRow();
      entries = [{ platform: r0.platform, url: r0.url.trim(), views: storyCount * perStory, likes: Number(r0.likes) || 0, comments: Number(r0.comments) || 0, shares: Number(r0.shares) || 0, saves: Number(r0.saves) || 0 }];
    } else {
      entries = form.platforms.filter((r) => r.url.trim() || r.views || r.likes || r.comments || r.shares || r.saves).map(numRow);
      if (entries.length === 0) entries = [numRow(form.platforms[0] ?? emptyRow())];
    }
    const t = sumEntries(entries);
    const platformLabel = entries.length > 1 ? "Multi-platform" : (entries[0]?.platform ?? "Instagram");
    const primaryUrl = entries.find((e) => e.url)?.url || null;

    const payload = isStory
      ? {
          engagement_id: form.engagement_id || null,
          kind: "story",
          story_count: storyCount,
          thumbnail: form.thumbnail || null,
          platform: platformLabel, url: primaryUrl, platforms: entries,
          post_date: form.post_date || null,
          boost_start: null, boost_end: null,
          fee: 0, boost_spend: 0,
          views: t.views, likes: t.likes, comments: t.comments, shares: t.shares, saves: t.saves,
          sent_positive: 0, sent_negative: 0,
          notes: form.notes || null,
        }
      : {
          engagement_id: form.engagement_id || null,
          kind: "post",
          story_count: null,
          thumbnail: form.thumbnail || null,
          platform: platformLabel, url: primaryUrl, platforms: entries,
          post_date: form.post_date || null,
          boost_start: form.boost_start || null,
          boost_end: form.boost_end || null,
          fee: Number(form.fee) || 0,
          boost_spend: Number(form.boost_spend) || 0,
          views: t.views, likes: t.likes, comments: t.comments, shares: t.shares, saves: t.saves,
          sent_positive: Number(form.sent_positive) || 0,
          sent_negative: Number(form.sent_negative) || 0,
          notes: form.notes || null,
        };
    if (form.id) await updatePost(form.id, payload);
    else await addPost(payload);
    setSaving(false);
    setOpen(false);
    setForm(BLANK);
  }

  async function saveRates() {
    const platform_rates: Record<string, { per_k_views: number; per_engagement: number }> = {};
    EMV_PLATFORMS.forEach((plat) => {
      const r = platRates[plat];
      const kk = (r?.k ?? "").trim(); const ee = (r?.e ?? "").trim();
      if (kk !== "" || ee !== "") {
        platform_rates[plat] = {
          per_k_views: kk !== "" ? Number(kk) || 0 : Number(genK) || 0,
          per_engagement: ee !== "" ? Number(ee) || 0 : Number(genE) || 0,
        };
      }
    });
    await updateRoiSettings({ per_k_views: Number(genK) || 0, per_engagement: Number(genE) || 0, sentiment_weight: Number(rw) || 0, platform_rates });
  }

  // live preview for the modal
  const formFollowers = followersOf(form.engagement_id);
  const formSchedView = viewById.get(form.engagement_id);
  const formHasSched = !!(formSchedView && (formSchedView.post_date || formSchedView.boost_start || formSchedView.boost_end));
  const formCommentTotal = form.kind === "story" ? 0 : form.platforms.reduce((s, r) => s + (Number(r.comments) || 0), 0);
  const formBase = formCommentTotal > 0 ? 1 : 0;
  const formSentRaw = formBase + (Number(form.sent_positive) || 0) + (Number(form.sent_negative) || 0);
  const formSent = formSentRaw * tierMult(formFollowers);
  const formAdjPct = formSentRaw * (rates.sentiment_weight ?? 0);

  function setRow(i: number, patch: Partial<PlatRow>) { setForm((f) => ({ ...f, platforms: f.platforms.map((r, j) => (j === i ? { ...r, ...patch } : r)) })); }
  function addRow() { setForm((f) => ({ ...f, platforms: [...f.platforms, emptyRow()] })); }
  function removeRow(i: number) { setForm((f) => ({ ...f, platforms: f.platforms.length > 1 ? f.platforms.filter((_, j) => j !== i) : f.platforms })); }
  const formTotals = form.kind === "story" ? { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 } : sumEntries(form.platforms.map(numRow));

  // story-set preview
  const isStory = form.kind === "story";
  const storyCount = Number(form.story_count) || 0;
  const perStory = Number(form.est_per_story) || 0;
  const storyViews = storyCount * perStory;
  const storyEmv = (storyViews / 1000) * ratesFor(rates, form.platforms[0]?.platform).per_k_views;
  function estimateFromFollowers() {
    const f = Number(formFollowers || 0);
    if (!f) return;
    setForm((cur) => ({ ...cur, est_per_story: String(Math.round(f * STORY_REACH_DEFAULT)) }));
  }

  return (
    <div>
      <PageHeader
        title="Logbook"
        sub="Performance & ROI"
        icon="LineChart"
        action={canEdit ? <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> Log a post</Button> : undefined}
      />

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Posts logged" value={String(posts.length)} icon="FileText" hue="#DCE6FB" />
        <KpiCard label="Spend" value={money(totals.cost)} hint="fees + boosting" icon="Coins" hue="#FEF3C7" />
        <KpiCard label="Adjusted EMV" value={money(totals.emv)} hint="sentiment-blended" icon="Sparkles" hue="#E4D6F7" />
        <KpiCard label="Blended ROI" value={totals.roi === null ? "—" : ((totals.roi >= 0 ? "+" : "") + (totals.roi * 100).toFixed(0) + "%")} hint="adj. EMV vs spend" icon="TrendingUp" hue="#C9F0E6" />
        <KpiCard label="Net sentiment" value={fmtSent(totals.sentiment)} hint="weighted by tier" icon="Smile" hue="#F6DCEB" />
      </div>

      {/* Editable rates (Owner only) */}
      {canManageSettings && (
      <Card className="mb-2 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <div className="text-xs uppercase tracking-wide text-ink-faint">Value &amp; ROI rates</div>
            <div className="text-sm text-ink-soft">Tune to your valuation.</div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="General $ / 1,000 views">
              <Input type="number" min={0} step={1} inputMode="decimal" value={genK} onChange={(e) => setGenK(e.target.value)} />
            </Field>
            <Field label="General $ / engagement">
              <Input type="number" min={0} step={0.01} inputMode="decimal" value={genE} onChange={(e) => setGenE(e.target.value)} />
            </Field>
            <Field label="Sentiment weight / point" hint="0.1 = ±10% EMV per point">
              <Input type="number" min={0} step={0.05} inputMode="decimal" value={rw} onChange={(e) => setRw(e.target.value)} />
            </Field>
            <Button variant="primary" onClick={saveRates}>Save rates</Button>
          </div>
        </div>
        <div className="mt-3 border-t border-sky/60 pt-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-ink-faint">Per-platform overrides <span className="text-ink-faint">(blank = use General)</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-1 pr-3 font-semibold">Platform</th>
                <th className="py-1 pr-3 font-semibold">$ / 1,000 views</th>
                <th className="py-1 font-semibold">$ / engagement</th>
              </tr></thead>
              <tbody>
                {EMV_PLATFORMS.map((plat) => (
                  <tr key={plat} className="border-t border-sky/50">
                    <td className="py-1.5 pr-3 font-semibold text-ink">{plat}</td>
                    <td className="py-1.5 pr-3"><Input type="number" min={0} step={1} inputMode="decimal" placeholder={genK} value={platRates[plat]?.k ?? ""} onChange={(e) => setPlat(plat, { k: e.target.value })} /></td>
                    <td className="py-1.5"><Input type="number" min={0} step={0.01} inputMode="decimal" placeholder={genE} value={platRates[plat]?.e ?? ""} onChange={(e) => setPlat(plat, { e: e.target.value })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      )}
      <p className="mb-5 text-xs text-ink-faint">EMV is sentiment-adjusted: <span className="text-ink-soft">EMV × (1 + sentiment × weight)</span>. ROI = (adjusted EMV − spend) ÷ spend.</p>

      {/* All posts */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Posts</h2>
        <Pill>{posts.length} logged</Pill>
      </div>
      {posts.length === 0 ? (
        <EmptyState title="No posts logged yet." hint="Use “Log a post” to record a video, its spend, its numbers, and a sentiment read." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Creator</th>
                  <th className="px-3 py-3 font-semibold">Eclipse</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 text-right font-semibold">Views</th>
                  <th className="px-3 py-3 text-right font-semibold">Engagement</th>
                  <th className="px-3 py-3 text-right font-semibold">Spend</th>
                  <th className="px-3 py-3 text-right font-semibold">EMV</th>
                  <th className="px-3 py-3 text-right font-semibold">ROI</th>
                  <th className="px-3 py-3 text-right font-semibold">Sentiment</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-sky/80 hover:bg-sky/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-start gap-2.5">
                        {(() => {
                          const vid = parseVideo(p.url);
                          const thumb = p.thumbnail || vid?.thumb || null;
                          if (!p.thumbnail && !vid && !p.url) return null;
                          return (
                            <button
                              onClick={() => setPlaying(p)}
                              aria-label="Play video"
                              className="group relative grid h-14 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-navy/10 ring-1 ring-sky/70"
                            >
                              {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Icons.Video size={16} className="text-ink-soft" />}
                              <span className="absolute inset-0 grid place-items-center bg-navy/10 opacity-0 transition group-hover:opacity-100">
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90"><Icons.Play size={13} className="ml-0.5 text-navy-deep" /></span>
                              </span>
                              <span className="absolute bottom-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-white/85"><Icons.Play size={9} className="ml-px text-navy-deep" /></span>
                            </button>
                          );
                        })()}
                        <div className="min-w-0">
                          <div className="font-semibold text-ink">{creatorNameOf(p.engagement_id)}</div>
                          <div className="flex flex-wrap items-center gap-1 text-xs text-ink-faint">
                            {p.platforms && p.platforms.length > 0 ? (
                              p.platforms.map((e, i) => (
                                e.url ? (
                                  <a key={i} href={e.url} target="_blank" rel="noreferrer" className="rounded-full bg-sky/50 px-2 py-0.5 font-semibold text-dusty-deep hover:bg-sky">{e.platform} · {num(Number(e.views || 0))}</a>
                                ) : (
                                  <span key={i} className="rounded-full bg-sky/40 px-2 py-0.5">{e.platform} · {num(Number(e.views || 0))}</span>
                                )
                              ))
                            ) : p.platform}
                            {p.kind === "story" && (
                              <span className="rounded-full bg-seafoam-soft px-2 py-0.5 font-semibold text-seafoam-deep">
                                {p.story_count ?? 0} {p.story_count === 1 ? "story" : "stories"} · est.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{campaignOf(p.engagement_id)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{p.post_date ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right text-ink">{num(Number(p.views || 0))}</td>
                    <td className="px-3 py-2.5 text-right text-ink">{num(engOf(p))}</td>
                    <td className="px-3 py-2.5 text-right text-ink">{money(costOf(p))}</td>
                    <td className="px-3 py-2.5 text-right text-ink">{money(qEmvOf(p, rates))}</td>
                    <td className="px-3 py-2.5 text-right"><Roi value={qRoiOf(p, rates)} /></td>
                    <td className="px-3 py-2.5 text-right"><Sent value={sentScore(p, followersOf(p.engagement_id))} /></td>
                    <td className="px-2 py-2.5 text-right">
                      {canEdit && <><button onClick={() => openEdit(p)} className="mr-1 text-ink-faint hover:text-dusty-deep" aria-label="Edit"><Icons.Pencil size={15} /></button>
                      <button onClick={() => deletePost(p.id)} className="text-ink-faint hover:text-bubblegum" aria-label="Delete"><Icons.Trash2 size={15} /></button></>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ROI by eclipse */}
      {byCampaign.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-lg text-ink">ROI &amp; sentiment by eclipse</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-sm">
                <thead>
                  <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Eclipse</th>
                    <th className="px-3 py-3 text-right font-semibold">Posts</th>
                    <th className="px-3 py-3 text-right font-semibold">Views</th>
                    <th className="px-3 py-3 text-right font-semibold">Engagement</th>
                    <th className="px-3 py-3 text-right font-semibold">Spend</th>
                    <th className="px-3 py-3 text-right font-semibold">EMV</th>
                    <th className="px-3 py-3 text-right font-semibold">ROI</th>
                    <th className="px-3 py-3 text-right font-semibold">Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {byCampaign.map((r) => (
                    <tr key={r.campaign} className="border-t border-sky/80">
                      <td className="px-4 py-2.5 font-semibold text-ink">{r.campaign}</td>
                      <td className="px-3 py-2.5 text-right text-ink-soft">{r.posts}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{num(r.views)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{num(r.eng)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{money(r.cost)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{money(r.emv)}</td>
                      <td className="px-3 py-2.5 text-right"><Roi value={r.cost > 0 ? (r.emv - r.cost) / r.cost : null} /></td>
                      <td className="px-3 py-2.5 text-right"><Sent value={r.sent} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ROI by creator within eclipse */}
      {byCreator.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-display text-lg text-ink">ROI &amp; sentiment by creator (within eclipse)</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                    <th className="px-4 py-3 font-semibold">Eclipse</th>
                    <th className="px-3 py-3 font-semibold">Creator</th>
                    <th className="px-3 py-3 text-right font-semibold">Posts</th>
                    <th className="px-3 py-3 text-right font-semibold">Spend</th>
                    <th className="px-3 py-3 text-right font-semibold">EMV</th>
                    <th className="px-3 py-3 text-right font-semibold">ROI</th>
                    <th className="px-3 py-3 text-right font-semibold">Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {byCreator.map((r, i) => (
                    <tr key={i} className="border-t border-sky/80">
                      <td className="px-4 py-2.5 text-ink-soft">{r.campaign}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{r.creator}</td>
                      <td className="px-3 py-2.5 text-right text-ink-soft">{r.posts}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{money(r.cost)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{money(r.emv)}</td>
                      <td className="px-3 py-2.5 text-right"><Roi value={r.cost > 0 ? (r.emv - r.cost) / r.cost : null} /></td>
                      <td className="px-3 py-2.5 text-right"><Sent value={r.sent} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Add / edit post */}
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit post" : "Log a post"}>
        <div className="max-h-[64vh] space-y-4 overflow-auto pr-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Creator on eclipse">
                <Sel value={form.engagement_id} onChange={(e) => pickEngagement(e.target.value)}>
                  <option value="">— Choose —</option>
                  {sortedViews.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.campaign ?? "no eclipse"}</option>)}
                </Sel>
              </Field>
            </div>
            {form.kind === "story" && (<>
            <Field label="Platform">
              <Sel value={form.platforms[0]?.platform ?? "Instagram"} onChange={(e) => setRow(0, { platform: e.target.value })}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Sel>
            </Field>
            <Field label="Post link">
              <Input placeholder="https://…" value={form.platforms[0]?.url ?? ""} onChange={(e) => setRow(0, { url: e.target.value })} />
            </Field>
            </>)}
          </div>

          <Field label="Video thumbnail" hint="Screenshot of the video — shows as a clickable preview in the table.">
            <ImageUpload
              value={form.thumbnail || null}
              onChange={(url) => setForm({ ...form, thumbnail: url ?? "" })}
              folder="thumbnails"
              shape="rect"
              label="screenshot"
            />
          </Field>

          {/* Entry type */}
          <div className="flex gap-2">
            {([["post", "Feed post"], ["story", "Story set"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm({ ...form, kind: k })}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${form.kind === k ? "bg-dusty-deep text-white" : "bg-white/70 text-ink-soft hover:text-dusty-deep"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Post date"><Input type="date" value={form.post_date} onChange={(e) => setForm({ ...form, post_date: e.target.value })} /></Field>
            {!isStory && <Field label="Boost start"><Input type="date" value={form.boost_start} onChange={(e) => setForm({ ...form, boost_start: e.target.value })} /></Field>}
            {!isStory && <Field label="Boost end"><Input type="date" value={form.boost_end} onChange={(e) => setForm({ ...form, boost_end: e.target.value })} /></Field>}
          </div>
          {!isStory && form.engagement_id && (
            formHasSched ? (
              <p className="-mt-2 text-xs text-ink-faint">
                Filled from this creator&apos;s Journey schedule.{" "}
                <button type="button" onClick={pullScheduleDates} className="font-semibold text-dusty-deep hover:underline">Use schedule dates</button>
              </p>
            ) : (
              <p className="-mt-2 text-xs text-ink-faint">No schedule dates set on this creator yet — add them on the creator&apos;s Journey tab to reuse them here.</p>
            )
          )}

          {isStory && (
            <div className="rounded-xl bg-seafoam-soft/40 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Organic story set</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="# of stories"><Input type="number" min={1} value={form.story_count} onChange={(e) => setForm({ ...form, story_count: e.target.value })} /></Field>
                <Field label="Est. views / story" hint={formFollowers ? `${num(formFollowers)} followers` : "set followers on the creator"}>
                  <Input type="number" min={0} value={form.est_per_story} onChange={(e) => setForm({ ...form, est_per_story: e.target.value })} />
                </Field>
              </div>
              <button
                type="button"
                onClick={estimateFromFollowers}
                disabled={!formFollowers}
                className="mt-2 text-xs font-semibold text-dusty-deep hover:underline disabled:text-ink-faint disabled:no-underline"
              >
                ≈ Estimate from followers ({Math.round(STORY_REACH_DEFAULT * 100)}% reach)
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/60 pt-2 text-sm">
                <span className="text-ink-soft">{storyCount} {storyCount === 1 ? "story" : "stories"} × {num(perStory)} = <b className="text-ink">{num(storyViews)}</b> est. views</span>
                <span className="text-ink-soft">Est. value (EMV): <b className="text-seafoam-deep">{money(storyEmv)}</b></span>
                <span className="text-xs text-ink-faint">organic · no cost</span>
              </div>
            </div>
          )}

          {!isStory && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Creator fee ($)"><Input type="number" min={0} step={10} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></Field>
            <Field label="Boost spend ($)"><Input type="number" min={0} step={10} value={form.boost_spend} onChange={(e) => setForm({ ...form, boost_spend: e.target.value })} /></Field>
          </div>
          )}

          {!isStory && (
          <div className="rounded-xl bg-sky/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Platforms &amp; performance</div>
              <span className="text-xs text-ink-faint">{num(formTotals.views)} views · {num(formTotals.likes + formTotals.comments + formTotals.shares + formTotals.saves)} eng total</span>
            </div>
            <div className="space-y-3">
              {form.platforms.map((row, i) => (
                <div key={i} className="rounded-xl bg-white/70 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="w-32 shrink-0">
                      <Sel value={row.platform} onChange={(e) => setRow(i, { platform: e.target.value })}>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </Sel>
                    </div>
                    <Input placeholder="https://…" value={row.url} onChange={(e) => setRow(i, { url: e.target.value })} />
                    {form.platforms.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} aria-label="Remove platform" className="shrink-0 text-ink-faint hover:text-bubblegum"><Icons.X size={16} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Field label="Views"><Input type="number" min={0} value={row.views} onChange={(e) => setRow(i, { views: e.target.value })} /></Field>
                    <Field label="Likes"><Input type="number" min={0} value={row.likes} onChange={(e) => setRow(i, { likes: e.target.value })} /></Field>
                    <Field label="Comments"><Input type="number" min={0} value={row.comments} onChange={(e) => setRow(i, { comments: e.target.value })} /></Field>
                    <Field label="Shares"><Input type="number" min={0} value={row.shares} onChange={(e) => setRow(i, { shares: e.target.value })} /></Field>
                    <Field label="Saves"><Input type="number" min={0} value={row.saves} onChange={(e) => setRow(i, { saves: e.target.value })} /></Field>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="mt-2 flex items-center gap-1 text-xs font-semibold text-dusty-deep hover:underline"><Icons.Plus size={14} /> Add another platform</button>
          </div>
          )}

          {!isStory && (
          <div className="rounded-xl bg-lavender/25 p-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Comment sentiment</div>
              <div className="text-xs text-ink-soft">Weighted: {tierLabel(formFollowers)}</div>
            </div>
            <p className="mb-2 text-xs text-ink-soft">One read per post — pick the highest positive and the strongest negative present. Base +{formBase} comes from whether it got comments.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Positive read">
                <Sel value={form.sent_positive} onChange={(e) => setForm({ ...form, sent_positive: e.target.value })}>
                  <option value="0">None</option>
                  <option value="2">Clear interest (+2)</option>
                  <option value="3">Strong intent (+3)</option>
                </Sel>
              </Field>
              <Field label="Negative read">
                <Sel value={form.sent_negative} onChange={(e) => setForm({ ...form, sent_negative: e.target.value })}>
                  <option value="0">None</option>
                  <option value="-1">Mild (−1)</option>
                  <option value="-2">Strong (−2)</option>
                </Sel>
              </Field>
            </div>
            <div className="mt-2 text-sm text-ink">
              Sentiment score: <Sent value={formSent} />
              <span className="ml-2 text-xs text-ink-soft">· adjusts EMV {formAdjPct >= 0 ? "+" : ""}{(formAdjPct * 100).toFixed(0)}%</span>
            </div>
          </div>
          )}

          <Field label="Notes">
            <Input placeholder="Anything worth remembering about this post" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>

        <div className="flex items-center justify-between pt-3">
          {form.id ? (
            <Button variant="ghost" onClick={() => { deletePost(form.id!); setOpen(false); }}>Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.engagement_id || saving}>
              {saving ? "Saving…" : form.id ? "Save changes" : "Log post"}
            </Button>
          </div>
        </div>
      </Modal>

      {playing && (() => {
        const vid = parseVideo(playing.url);
        return (
          <Modal open onClose={() => setPlaying(null)} title={creatorNameOf(playing.engagement_id) ?? "Video"}>
            {vid ? (
              <div className={vid.aspect === "vertical" ? "mx-auto max-w-[330px]" : "w-full"}>
                <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: vid.aspect === "vertical" ? "9 / 16" : "16 / 9" }}>
                  <iframe
                    src={vid.embedUrl}
                    title="Video"
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : playing.thumbnail ? (
              <img src={playing.thumbnail} alt="" className="mx-auto max-h-[60vh] rounded-xl" />
            ) : (
              <p className="py-6 text-center text-sm text-ink-soft">No preview available for this link.</p>
            )}
            {playing.url && (
              <div className="mt-3 text-center">
                <a href={playing.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-dusty-deep hover:underline">
                  <Icons.ExternalLink size={14} /> Open {vid?.platform ?? "original"}
                </a>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}

function Sel({ value, onChange, children }: {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-sky/70 bg-white/80 px-3 py-2 text-sm text-ink outline-none focus:border-dusty-deep"
    >
      {children}
    </select>
  );
}
