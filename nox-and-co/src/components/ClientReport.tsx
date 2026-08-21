"use client";

import { useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { STAGES } from "@/lib/constants";
import { qEmvOfPost } from "@/lib/budget";
import { money, compactMoney, pct, fmtDate } from "@/lib/format";
import type { Post, RoiSettings } from "@/lib/types";

const AVATAR_TINTS = [
  { bg: "#E5E6EA", fg: "#2a3158" }, { bg: "#DCDDE2", fg: "#3A3D46" },
  { bg: "#D5D6DB", fg: "#12151F" }, { bg: "#C7C9D1", fg: "#2a3158" },
  { bg: "#EDEDF0", fg: "#4B4D57" },
];
const BAR_COLORS = ["#5a6a8f", "#8A8C96", "#A6A8B2", "#B3B5BE", "#C7C9D1", "#4B4D57"];
const iOnboard = STAGES.indexOf("Locked In" as never);
const iLaunched = STAGES.indexOf("Shining" as never);
export const inClientRange = (stage: string) => {
  const i = STAGES.indexOf(stage as never);
  return i >= iOnboard && i <= iLaunched;
};
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "★";
const fmtK = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "K" : String(Math.round(n));

export type ViewLike = { id: string; creator_id: string; stage: string; name: string; handle: string; platform: string; campaign: string | null };
type PostLine = { date: string | null; platform: string; campaign: string | null; views: number; likes: number; comments: number };
export type Row = { name: string; handle: string; platform: string; views: number; likes: number; comments: number; shares: number; saves: number; eng: number; emv: number; posts: PostLine[] };

export function computeClientReport(views: ViewLike[], posts: Post[], roi: RoiSettings, days: number) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const map = new Map<string, Row>();
  views.filter((v) => inClientRange(v.stage)).forEach((v) => {
    const vposts = posts.filter((p) => p.engagement_id === v.id && p.post_date && p.post_date >= cutoff && p.post_date <= todayStr);
    if (!vposts.length) return;
    let r = map.get(v.creator_id);
    if (!r) { r = { name: v.name, handle: v.handle, platform: v.platform || "Multi-platform", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, eng: 0, emv: 0, posts: [] }; map.set(v.creator_id, r); }
    vposts.forEach((p) => {
      const li = Number(p.likes || 0), co = Number(p.comments || 0), sh = Number(p.shares || 0), sv = Number(p.saves || 0);
      r!.views += Number(p.views || 0); r!.likes += li; r!.comments += co; r!.shares += sh; r!.saves += sv;
      r!.eng += li + co + sh + sv; r!.emv += qEmvOfPost(p, roi);
      r!.posts.push({ date: p.post_date, platform: String(p.platform || v.platform || ""), campaign: v.campaign, views: Number(p.views || 0), likes: li, comments: co });
    });
  });
  const rows = [...map.values()].sort((a, b) => b.views - a.views);
  rows.forEach((r) => r.posts.sort((a, b) => (a.date && b.date ? (a.date < b.date ? 1 : -1) : 0)));
  const tot = rows.reduce((t, r) => ({ views: t.views + r.views, eng: t.eng + r.eng, emv: t.emv + r.emv, posts: t.posts + r.posts.length }), { views: 0, eng: 0, emv: 0, posts: 0 });
  const rangeLabel = `${fmtDate(cutoff)} – ${fmtDate(todayStr)} · last ${days} days`;
  return { rows, tot, rangeLabel, todayStr };
}

export function ClientReportView({ clientName, rangeLabel, rows, tot }: { clientName: string; rangeLabel: string; rows: Row[]; tot: { views: number; eng: number; emv: number; posts: number } }) {
  const maxViews = Math.max(1, ...rows.map((r) => r.views));
  const engRate = tot.views > 0 ? pct(tot.eng / tot.views) : "0%";
  return (
    <div id="client-report-print" className="cr-scroll">
      <style>{CR_CSS}</style>
      <div className="cr-page">
        <div className="cr-hero">
          <div className="cr-moon" />
          <div className="cr-brandrow"><div className="cr-logo">✦</div><b>Nox & Co</b></div>
          <h1>Creator Highlights</h1>
          <div className="cr-cover">Prepared for {clientName}</div>
          <div className="cr-sub">Active creators, Locked In → Shining · reach &amp; engagement</div>
          <div className="cr-range">{rangeLabel}</div>
          <svg className="cr-wave" viewBox="0 0 840 34" preserveAspectRatio="none"><path d="M0,20 C140,4 260,32 420,20 C580,8 700,32 840,18 L840,34 L0,34 Z" fill="#ffffff" /></svg>
        </div>
        <div className="cr-body">
          {rows.length === 0 ? (
            <div className="cr-empty">No creators in Locked In → Shining have logged a post in this window yet.</div>
          ) : (
            <>
              <div className="cr-tiles">
                <div className="cr-tile t-sky"><div className="n">{rows.length}</div><div className="l">Creators</div></div>
                <div className="cr-tile t-lav"><div className="n">{tot.posts}</div><div className="l">Posts</div></div>
                <div className="cr-tile t-teal"><div className="n">{fmtK(tot.views)}</div><div className="l">Views</div></div>
                <div className="cr-tile t-pea"><div className="n">{fmtK(tot.eng)}</div><div className="l">Engagements</div></div>
                <div className="cr-tile t-pink"><div className="n">{engRate}</div><div className="l">Eng. rate</div></div>
                <div className="cr-tile t-but"><div className="n">{compactMoney(tot.emv)}</div><div className="l">Total EMV</div></div>
              </div>
              <div className="cr-section">Reach by creator</div>
              <div className="cr-bars">
                {rows.map((r, i) => (
                  <div className="cr-bar" key={r.handle + i}>
                    <div className="who">{r.name}</div>
                    <div className="track"><div className="fill" style={{ width: `${Math.max(4, (r.views / maxViews) * 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} /></div>
                    <div className="v">{fmtK(r.views)}</div>
                  </div>
                ))}
              </div>
              <div className="cr-section">By creator</div>
              {rows.map((r, i) => {
                const tint = AVATAR_TINTS[i % AVATAR_TINTS.length];
                const er = r.views > 0 ? pct(r.eng / r.views) : "0%";
                return (
                  <div className="cr-creator" key={r.handle + "c" + i}>
                    <div className="cr-chead">
                      <div className="cr-avatar" style={{ background: tint.bg, color: tint.fg }}>{initials(r.name)}</div>
                      <div><div className="cr-name">{r.name}</div><div className="cr-handle">{r.handle}</div></div>
                      <div className="cr-spacer" />
                      <span className="cr-pill">{r.platform}</span>
                      <span className="cr-pill count">{r.posts.length} {r.posts.length === 1 ? "post" : "posts"}</span>
                    </div>
                    <div className="cr-metrics">
                      <div className="m"><div className="mn">{fmtK(r.views)}</div><div className="ml">Views</div></div>
                      <div className="m"><div className="mn">{fmtK(r.likes)}</div><div className="ml">Likes</div></div>
                      <div className="m"><div className="mn">{fmtK(r.comments)}</div><div className="ml">Comments</div></div>
                      <div className="m"><div className="mn">{fmtK(r.shares)}</div><div className="ml">Shares</div></div>
                      <div className="m"><div className="mn">{fmtK(r.saves)}</div><div className="ml">Saves</div></div>
                      <div className="m"><div className="mn">{er}</div><div className="ml">Eng. rate</div></div>
                    </div>
                    <div className="cr-emv"><span>Earned media value</span><b>{money(r.emv)}</b></div>
                    <div className="cr-posts">
                      {r.posts.map((p, k) => (
                        <div className="cr-post" key={k}>
                          <div className="date">{p.date ? fmtDate(p.date) : ""}</div>
                          <div className="title"><span className="star">★</span> {p.campaign || (p.platform ? p.platform + " post" : "Post")}</div>
                          <div className="pm"><b>{fmtK(p.views)}</b> views · {fmtK(p.likes)} likes · {fmtK(p.comments)} comments</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="cr-foot">Generated by Nox & Co · {clientName}</div>
      </div>
    </div>
  );
}

const RANGES = [7, 31, 90];

export function ClientReport({ onClose }: { onClose: () => void }) {
  const views = useStore((s) => s.scopedActiveViews);
  const posts = useStore((s) => s.scopedPosts);
  const roiSettings = useStore((s) => s.roiSettings);
  const companies = useStore((s) => s.companies);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const [days, setDays] = useState(31);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const shareCompanyId = activeCompanyId ?? (companies.length === 1 ? companies[0].id : null);
  const clientName = companies.find((c) => c.id === (activeCompanyId ?? shareCompanyId))?.name ?? "All clients";
  const viewLikes: ViewLike[] = useMemo(
    () => views.map((v) => ({ id: v.id, creator_id: v.creator_id, stage: v.stage, name: v.name, handle: v.handle, platform: v.platform, campaign: v.campaign })),
    [views]
  );
  const { rows, tot, rangeLabel } = useMemo(() => computeClientReport(viewLikes, posts, roiSettings, days), [viewLikes, posts, roiSettings, days]);

  async function createShareLink() {
    if (!shareCompanyId) { setShareUrl("Pick a client in the top bar first, share links are per client."); return; }
    setSharing(true); setShareUrl(null);
    // Reuse an existing active link for this client + range so the URL stays stable ("locked").
    const { data: existing } = await supabase
      .from("report_shares").select("token")
      .eq("company_id", shareCompanyId).eq("days", days).eq("revoked", false)
      .limit(1).maybeSingle();
    let token = (existing?.token as string | undefined);
    if (!token) {
      token = (crypto.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 18);
      const { error } = await supabase.from("report_shares").insert({ token, company_id: shareCompanyId, days });
      if (error) { setSharing(false); setShareUrl("Couldn't create link: " + error.message); return; }
    }
    setSharing(false);
    const url = `${window.location.origin}/share?token=${token}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setShareUrl(url);
  }

  const overlay = (
    <div className="cr-overlay">
      <div className="cr-toolbar">
        <span className="cr-tb-title">Client report · {clientName}</span>
        <div className="cr-tb-actions">
          <div className="cr-seg">
            {RANGES.map((d) => (
              <button key={d} onClick={() => { setDays(d); setShareUrl(null); }} className={"cr-seg-btn" + (days === d ? " on" : "")}>{d}d</button>
            ))}
          </div>
          <button onClick={createShareLink} className="cr-btn"><Icons.Link size={15} /> {sharing ? "Creating…" : "Share link"}</button>
          <button onClick={() => window.print()} className="cr-btn cr-btn-primary"><Icons.Printer size={15} /> Print / Save PDF</button>
          <button onClick={onClose} className="cr-btn"><Icons.X size={15} /> Close</button>
        </div>
      </div>
      {shareUrl && (
        <div className="cr-sharebar">
          {shareUrl.startsWith("http") ? (
            <><Icons.Check size={14} /> <span>Link copied, anyone with it can view this report (no login):</span> <a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a></>
          ) : (<span>{shareUrl}</span>)}
        </div>
      )}
      <ClientReportView clientName={clientName} rangeLabel={rangeLabel} rows={rows} tot={tot} />
    </div>
  );
  return typeof document !== "undefined" ? createPortal(overlay, document.body) : overlay;
}

const CR_CSS = `
.cr-overlay{position:fixed;inset:0;z-index:9999;background:rgba(20,26,52,.55);display:flex;flex-direction:column;overflow:hidden}
.cr-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;background:#fff;border-bottom:1px solid #e7ecf7;flex-wrap:wrap}
.cr-tb-title{font-weight:700;color:#2a3158;font-size:14px}
.cr-tb-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cr-seg{display:inline-flex;background:#eef2fb;border-radius:999px;padding:2px}
.cr-seg-btn{border:0;background:transparent;color:#54608c;font-size:12px;font-weight:700;padding:5px 11px;border-radius:999px;cursor:pointer}
.cr-seg-btn.on{background:#fff;color:#2a3158;box-shadow:0 1px 3px rgba(42,49,88,.15)}
.cr-btn{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;padding:7px 13px;border-radius:999px;border:1px solid #d7deef;background:#fff;color:#54608c;cursor:pointer}
.cr-btn:hover{background:#f3f6fc}
.cr-btn-primary{background:#2E3A5E;border-color:#2E3A5E;color:#fff}
.cr-btn-primary:hover{background:#3C4A78}
.cr-sharebar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 18px;background:#EAEBEF;border-bottom:1px solid #D5D6DB;color:#3A3D46;font-size:12.5px}
.cr-sharebar a{color:#12151F;font-weight:700;text-decoration:underline;word-break:break-all}
.cr-scroll{flex:1;overflow:auto;padding:22px 14px 40px}
.cr-share-root{min-height:100vh;background:#e9edf7;padding:22px 14px 50px}
.cr-page{max-width:840px;margin:0 auto;background:#fff;border-radius:26px;overflow:hidden;box-shadow:0 18px 50px rgba(42,49,88,.22);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cr-hero{position:relative;padding:34px 40px 58px;background:linear-gradient(135deg,#dfe1e6 0%,#c7c9d1 46%,#eef0f3 100%);overflow:hidden}
.cr-moon{position:absolute;top:26px;right:44px;width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 36% 32%,#ffffff,#c7c9d1);box-shadow:0 0 38px rgba(90,106,143,.35)}
.cr-brandrow{display:flex;align-items:center;gap:10px;position:relative;z-index:2}
.cr-logo{width:30px;height:30px;border-radius:9px;background:#2a3158;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px}
.cr-brandrow b{font-size:15px;color:#2a3158}
.cr-hero h1{position:relative;z-index:2;margin:18px 0 0;font-size:30px;font-weight:800;color:#2a3158;letter-spacing:-.01em}
.cr-cover{position:relative;z-index:2;margin-top:4px;font-size:15px;font-weight:700;color:#4f68b0}
.cr-sub{position:relative;z-index:2;margin-top:6px;color:#54608c;font-size:14px}
.cr-range{position:relative;z-index:2;display:inline-block;margin-top:14px;background:rgba(255,255,255,.7);border:1px solid rgba(42,49,88,.1);color:#2a3158;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:999px}
.cr-wave{position:absolute;left:0;right:0;bottom:-1px;width:100%;height:34px;display:block}
.cr-body{padding:26px 40px 30px}
.cr-empty{padding:40px;text-align:center;color:#8a93b8;font-size:14px}
.cr-tiles{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
.cr-tile{border-radius:16px;padding:16px 12px;text-align:center}
.cr-tile .n{font-size:23px;font-weight:800;letter-spacing:-.02em}
.cr-tile .l{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;color:#54608c}
.cr-tile.t-sky{background:#F2F2F4} .cr-tile.t-sky .n{color:#2a3158}
.cr-tile.t-teal{background:#EAEBEF} .cr-tile.t-teal .n{color:#3A3D46}
.cr-tile.t-lav{background:#E5E6EA} .cr-tile.t-lav .n{color:#4B4D57}
.cr-tile.t-pea{background:#DCDDE2} .cr-tile.t-pea .n{color:#2a3158}
.cr-tile.t-pink{background:#D5D6DB} .cr-tile.t-pink .n{color:#3A3D46}
.cr-tile.t-but{background:#EDEDF0} .cr-tile.t-but .n{color:#5a6a8f}
.cr-section{margin:26px 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#8a93b8}
.cr-bars{display:flex;flex-direction:column;gap:10px;background:#F2F2F4;border-radius:16px;padding:16px 18px}
.cr-bar{display:flex;align-items:center;gap:12px}
.cr-bar .who{width:120px;font-size:13px;font-weight:600;color:#2a3158;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-bar .track{flex:1;height:14px;background:#e2e8f5;border-radius:999px;overflow:hidden}
.cr-bar .fill{height:100%;border-radius:999px}
.cr-bar .v{width:60px;text-align:right;font-size:12.5px;font-weight:700;color:#54608c}
.cr-creator{border:1px solid #e7ecf7;border-radius:18px;padding:18px 20px;margin-bottom:14px}
.cr-chead{display:flex;align-items:center;gap:12px}
.cr-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0}
.cr-name{font-size:16px;font-weight:800;color:#2a3158}
.cr-handle{font-size:12.5px;color:#8a93b8}
.cr-pill{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:#F2F2F4;color:#3A3D46}
.cr-pill.count{background:#EAEBEF;color:#4B4D57}
.cr-spacer{flex:1}
.cr-metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:15px 0 0}
.cr-metrics .m{background:#f7f9fd;border-radius:12px;padding:9px 4px;text-align:center}
.cr-metrics .mn{font-size:15px;font-weight:800;color:#2a3158}
.cr-metrics .ml{font-size:10px;color:#8a93b8;font-weight:600;margin-top:2px}
.cr-emv{display:flex;align-items:center;justify-content:space-between;margin-top:12px;background:#EEF0F3;border:1px solid #D5D6DB;border-radius:12px;padding:9px 14px}
.cr-emv span{font-size:11.5px;font-weight:700;color:#6C7A99;text-transform:uppercase;letter-spacing:.05em}
.cr-emv b{font-size:17px;font-weight:800;color:#2a3158}
.cr-posts{margin-top:12px;border-top:1px dashed #e7ecf7;padding-top:8px}
.cr-post{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:12.5px}
.cr-post .date{width:64px;color:#8a93b8;font-weight:600;flex-shrink:0}
.cr-post .title{flex:1;font-weight:600;color:#2a3158;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr-post .pm{color:#54608c;font-variant-numeric:tabular-nums;font-size:12px;flex-shrink:0}
.cr-post .pm b{color:#2a3158;font-weight:700}
.cr-post .star{color:#8A8C96}
.cr-foot{padding:16px 40px 30px;text-align:center;color:#8a93b8;font-size:12px}
@media (max-width:720px){.cr-tiles{grid-template-columns:repeat(2,1fr)}.cr-metrics{grid-template-columns:repeat(3,1fr)}.cr-bar .who{width:90px}}
@media print{
  @page{margin:12mm}
  html,body{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  body *{visibility:hidden !important}
  #client-report-print,#client-report-print *{visibility:visible !important;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  #client-report-print{position:absolute !important;left:0;top:0;width:100%;overflow:visible !important;padding:0 !important}
  .cr-overlay,.cr-share-root{position:static !important;background:#fff !important;padding:0 !important}
  .cr-toolbar,.cr-sharebar{display:none !important}
  .cr-page{box-shadow:none !important;border-radius:0 !important;max-width:100% !important}
  .cr-creator{break-inside:avoid}
}
`;
