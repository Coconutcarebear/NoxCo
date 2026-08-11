"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { type EngagementView } from "@/lib/types";
import { STAGES, STAGE_HUE, PLATFORMS, EMPTY, parseTags, tagPool } from "@/lib/constants";
import { tierFor, TIER_HUE, totalSpendOf, qEmvOfPost, postCostOf } from "@/lib/budget";
import { money, num, pct, initials } from "@/lib/format";
import { Card, Button, Badge, Input, Select, EmptyState, Pill } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";
import { usePerms } from "@/lib/perms";

export default function StarAtlasPage() {
  return (
    <Suspense fallback={null}>
      <AtlasInner />
    </Suspense>
  );
}

function AtlasInner() {
  const params = useSearchParams();
  const views = useStore((s) => s.scopedViews);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const addCreatorWithEngagement = useStore((s) => s.addCreatorWithEngagement);
  const posts = useStore((s) => s.scopedPosts);
  const roiSettings = useStore((s) => s.roiSettings);
  const { canEdit } = usePerms();

  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [campaign, setCampaign] = useState("");
  const [stage, setStage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const pool = useMemo(() => tagPool(views.map((v) => v.categories)), [views]);

  useEffect(() => {
    const id = params.get("open");
    if (id) setOpenId(id);
  }, [params]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return views
      .filter((c) => (showArchived ? c.archived || c.creator.archived : !c.archived && !c.creator.archived))
      .filter((c) => (platform ? c.platform === platform : true))
      .filter((c) => (campaign ? c.campaign === campaign : true))
      .filter((c) => (stage ? c.stage === stage : true))
      .filter((c) => (tags.length ? (() => { const ct = parseTags(c.categories).map((t) => t.toLowerCase()); return tags.some((t) => ct.includes(t.toLowerCase())); })() : true))
      .filter((c) =>
        term ? `${c.name} ${c.handle} ${c.campaign ?? ""} ${c.categories ?? ""}`.toLowerCase().includes(term) : true
      );
  }, [views, q, platform, campaign, stage, tags, showArchived]);

  const roiByEng = useMemo(() => {
    const m = new Map<string, { emv: number; cost: number }>();
    posts.forEach((p) => {
      if (!p.engagement_id) return;
      const o = m.get(p.engagement_id) || { emv: 0, cost: 0 };
      o.emv += qEmvOfPost(p, roiSettings);
      o.cost += postCostOf(p);
      m.set(p.engagement_id, o);
    });
    return m;
  }, [posts, roiSettings]);

  const addNew = async () => {
    const r = await addCreatorWithEngagement({}, null);
    if (r) setOpenId(r.engagement.id);
  };

  return (
    <div>
      <PageHeader
        title="Star Atlas"
        sub="Creators"
        icon="Star"
        action={
          <div className="flex gap-2">
            <Button variant="soft" onClick={() => exportCsv(filtered)}><Icons.Download size={15} /> Export CSV</Button>
            {canEdit && <Button variant="primary" onClick={addNew}><Icons.Plus size={15} /> New creator</Button>}
          </div>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Icons.Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, handle, eclipse…" className="pl-9" />
          </div>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-auto"><option value="">All platforms</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select>
          <Select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-auto"><option value="">All eclipses</option>{campaigns.map((c) => <option key={c.id}>{c.name}</option>)}</Select>
          <Select value={stage} onChange={(e) => setStage(e.target.value)} className="w-auto"><option value="">All stages</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</Select>
          <Button variant={showArchived ? "primary" : "ghost"} onClick={() => setShowArchived((v) => !v)}>
            <Icons.Archive size={15} /> {showArchived ? "Archived" : "Active"}
          </Button>
        </div>
        {pool.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-sky/60 pt-2.5">
            <Icons.Tag size={14} className="mr-0.5 text-ink-faint" />
            {pool.map((t) => {
              const on = tags.some((x) => x.toLowerCase() === t.toLowerCase());
              return (
                <button
                  key={t}
                  onClick={() => setTags((cur) => (on ? cur.filter((x) => x.toLowerCase() !== t.toLowerCase()) : [...cur, t]))}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${on ? "bg-dusty-deep text-white" : "bg-white/5 text-ink-soft hover:text-dusty-deep"}`}
                >
                  {t}
                </button>
              );
            })}
            {tags.length > 0 && (
              <button onClick={() => setTags([])} className="ml-1 text-xs font-semibold text-ink-faint hover:text-bubblegum">clear</button>
            )}
          </div>
        )}
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={showArchived ? "No archived stars." : EMPTY.creators}
          hint="Add a creator or adjust your filters to see the night sky."
          action={canEdit ? <Button variant="primary" onClick={addNew}><Icons.Plus size={15} /> New creator</Button> : undefined}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Creator</th>
                  <th className="px-3 py-3 font-semibold">Platform</th>
                  <th className="px-3 py-3 font-semibold">Eclipse</th>
                  <th className="px-3 py-3 font-semibold">Stage</th>
                  <th className="px-3 py-3 text-right font-semibold">Followers</th>
                  <th className="px-3 py-3 text-right font-semibold">Fee</th>
                  <th className="px-3 py-3 text-right font-semibold">Boost</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-right font-semibold">ROI</th>
                  <th className="px-4 py-3 font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const tier = tierFor(totalSpendOf(c));
                  return (
                    <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer border-t border-sky/80 transition hover:bg-sky/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lavender text-xs font-bold text-navy-deep">{initials(c.name)}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{c.name}</span>
                            <span className="block truncate text-xs text-ink-faint">{c.handle}</span>
                            {parseTags(c.categories).length > 0 && (
                              <span className="mt-0.5 flex flex-wrap gap-1">
                                {parseTags(c.categories).slice(0, 3).map((t) => (
                                  <span key={t} className="rounded-full bg-lavender/40 px-1.5 py-0.5 text-[10px] font-medium text-navy-deep">{t}</span>
                                ))}
                                {parseTags(c.categories).length > 3 && <span className="text-[10px] text-ink-faint">+{parseTags(c.categories).length - 3}</span>}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-ink-soft">{c.platform}</td>
                      <td className="px-3 py-2.5 text-ink-soft">{c.campaign ?? "-"}</td>
                      <td className="px-3 py-2.5"><Badge hue={STAGE_HUE[c.stage]}>{c.stage}</Badge></td>
                      <td className="px-3 py-2.5 text-right text-ink-soft">{num(c.followers)}</td>
                      <td className="px-3 py-2.5 text-right text-ink">{money(c.creator_fee)}</td>
                      <td className="px-3 py-2.5 text-right text-seafoam-deep">{money(c.boost_spend)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink">{money(totalSpendOf(c))}</td>
                      <td className="px-3 py-2.5 text-right">{(() => {
                        const r = roiByEng.get(c.id);
                        if (!r || r.cost <= 0) return <span className="text-ink-faint">-</span>;
                        const roi = (r.emv - r.cost) / r.cost;
                        return <span className={"font-semibold " + (roi >= 0 ? "text-seafoam-deep" : "text-bubblegum")}>{(roi >= 0 ? "+" : "") + (roi * 100).toFixed(0)}%</span>;
                      })()}</td>
                      <td className="px-4 py-2.5"><Badge hue={TIER_HUE[tier]}>{tier}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-xs text-ink-faint">
            <span>{filtered.length} {filtered.length === 1 ? "star" : "stars"}</span>
            <span>Tap a row to chart its course</span>
          </div>
        </Card>
      )}

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}

function exportCsv(rows: EngagementView[]) {
  const cols: (keyof EngagementView)[] = ["name", "handle", "platform", "campaign", "stage", "followers", "engagement_rate", "creator_fee", "boost_spend", "total_spend", "contract_status", "invoice_status"];
  const head = cols.join(",");
  const body = rows
    .map((r) => cols.map((k) => {
      const v = (r as any)[k];
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\n");
  const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nox-creators-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
