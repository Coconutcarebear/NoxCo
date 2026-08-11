"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { PLATFORMS } from "@/lib/constants";
import { money } from "@/lib/format";
import { Card, Pill, Button, Field, Input, Modal } from "@/components/ui";
import { qEmvOfPost, postCostOf } from "@/lib/budget";
import { PageHeader } from "@/components/widgets";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const INTERNAL_HUE = "#CDB4F0";
const pad = (n: number) => (n < 10 ? "0" + n : "" + n);

type IBForm = {
  label: string; platform: string; amount: string;
  campaign_id: string; boost_start: string; boost_end: string;
};
const EMPTY_IB: IBForm = { label: "", platform: "Instagram", amount: "", campaign_id: "", boost_start: "", boost_end: "" };

export default function AlmanacPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const internalBoosts = useStore((s) => s.scopedInternalBoosts);
  const updateEngagement = useStore((s) => s.updateEngagement);
  const addInternalBoost = useStore((s) => s.addInternalBoost);
  const deleteInternalBoost = useStore((s) => s.deleteInternalBoost);
  const scopedPosts = useStore((s) => s.scopedPosts);
  const roiSettings = useStore((s) => s.roiSettings);

  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [showSchedule, setShowSchedule] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [ib, setIb] = useState<IBForm>(EMPTY_IB);
  const [saving, setSaving] = useState(false);
  const [dayKey, setDayKey] = useState<string | null>(null);

  const active = views;
  const campColor = (name: string | null) =>
    campaigns.find((c) => c.name === name)?.color ?? "#B7C8EA";
  const campNameById = (id: string | null) =>
    id ? campaigns.find((c) => c.id === id)?.name ?? null : null;

  // Build the month grid (leading blanks + days + trailing blanks).
  const startWeekday = new Date(cur.y, cur.m, 1).getDay();
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: ({ d: number; key: string } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, key: `${cur.y}-${pad(cur.m + 1)}-${pad(d)}` });
  while (cells.length % 7 !== 0) cells.push(null);

  function itemsOn(key: string) {
    const items: { kind: string; label: string; color: string }[] = [];
    active
      .filter((c) => c.shoot_date === key)
      .forEach((c) => items.push({ kind: "shoot", label: "🎬 " + c.name, color: campColor(c.campaign) }));
    // posts & boosts come from the Logbook (single source of truth), matched to their engagement
    scopedPosts
      .filter((p) => p.post_date === key)
      .forEach((p) => {
        const v = active.find((a) => a.id === p.engagement_id);
        items.push({ kind: "post", label: "★ " + (v?.name ?? "Post"), color: campColor(v?.campaign ?? null) });
      });
    scopedPosts
      .filter((p) => p.boost_start && p.boost_end && p.boost_start <= key && key <= p.boost_end)
      .forEach((p) => {
        const v = active.find((a) => a.id === p.engagement_id);
        items.push({ kind: "cb", label: "⚡ " + (v?.name ?? "Boost"), color: campColor(v?.campaign ?? null) });
      });
    internalBoosts
      .filter((b) => b.boost_start && b.boost_end && b.boost_start <= key && key <= b.boost_end)
      .forEach((b) => items.push({ kind: "ib", label: "📣 " + b.platform + " " + money(Number(b.amount || 0)), color: INTERNAL_HUE }));
    return items;
  }

  const internalTotal = internalBoosts.reduce((s, b) => s + Number(b.amount || 0), 0);
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // "This month at a glance", recomputed for whatever month is in view.
  const monthPrefix = `${cur.y}-${pad(cur.m + 1)}`;
  const inMonth = (d?: string | null) => !!d && d.startsWith(monthPrefix);
  const overlapMonth = (s?: string | null, e?: string | null) => !!s && !!e && s <= `${monthPrefix}-31` && e >= `${monthPrefix}-01`;
  const summary = useMemo(() => {
    const shoots = active.filter((c) => inMonth(c.shoot_date)).length;
    const posts = scopedPosts.filter((p) => inMonth(p.post_date)).length;
    const cboosts = scopedPosts.filter((p) => overlapMonth(p.boost_start, p.boost_end)).length;
    const ibSpend = internalBoosts.filter((b) => overlapMonth(b.boost_start, b.boost_end)).reduce((s, b) => s + Number(b.amount || 0), 0);
    const launching = campaigns.filter((c) => inMonth(c.start_date)).length;
    const ending = campaigns.filter((c) => inMonth(c.end_date)).length;
    const spend = scopedPosts.filter((p) => inMonth(p.post_date)).reduce((s, p) => s + Number(p.fee || 0) + Number(p.boost_spend || 0), 0);
    const monthPosts = scopedPosts.filter((p) => inMonth(p.post_date));
    const emv = monthPosts.reduce((s, p) => s + qEmvOfPost(p, roiSettings), 0);
    const postCost = monthPosts.reduce((s, p) => s + postCostOf(p), 0);
    const roi = postCost > 0 ? (emv - postCost) / postCost : null;
    const postCreatorIds = scopedPosts
      .filter((p) => inMonth(p.post_date) || overlapMonth(p.boost_start, p.boost_end))
      .map((p) => active.find((a) => a.id === p.engagement_id)?.creator_id)
      .filter((x): x is string => !!x);
    const creators = new Set([...active.filter((c) => inMonth(c.shoot_date)).map((c) => c.creator_id), ...postCreatorIds]).size;
    return { shoots, posts, cboosts, ibSpend, launching, ending, spend, emv, roi, creators };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, internalBoosts, campaigns, scopedPosts, roiSettings, monthPrefix]);

  function shift(delta: number) {
    setCur((p) => {
      let m = p.m + delta, y = p.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  }

  async function saveInternal() {
    if (saving) return;
    setSaving(true);
    await addInternalBoost({
      label: ib.label,
      platform: ib.platform as (typeof PLATFORMS)[number],
      amount: Number(ib.amount) || 0,
      campaign_id: ib.campaign_id || null,
      boost_start: ib.boost_start || null,
      boost_end: ib.boost_end || null,
    });
    setSaving(false);
    setIb(EMPTY_IB);
  }

  return (
    <div>
      <PageHeader
        title="Almanac"
        sub="Calendar"
        icon="CalendarDays"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => shift(-1)} aria-label="Previous month"><Icons.ChevronLeft size={16} /></Button>
            <span className="min-w-[150px] text-center font-display text-ink">{MONTHS[cur.m]} {cur.y}</span>
            <Button variant="ghost" onClick={() => shift(1)} aria-label="Next month"><Icons.ChevronRight size={16} /></Button>
            <Button variant="primary" onClick={() => setShowSchedule(true)}><Icons.CalendarClock size={15} /> Shoot dates</Button>
            <Button variant="primary" onClick={() => setShowInternal(true)}><Icons.Megaphone size={15} /> Internal boosts</Button>
          </div>
        }
      />

      {/* legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span>🎬</span> Shoots</span>
        <span className="flex items-center gap-1.5"><span>★</span> Video posts</span>
        <span className="flex items-center gap-1.5"><span>⚡</span> Creator boosting</span>
        <span className="flex items-center gap-1.5"><span>📣</span> Internal boosting (your socials)</span>
        <span className="ml-auto rounded-full bg-sky/40 px-3 py-1 font-semibold text-ink">
          Internal spend: {money(internalTotal)}
        </span>
      </div>

      <Card className="mb-3 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg text-ink">{MONTHS[cur.m]} {cur.y} at a glance</h2>
          <span className="rounded-full bg-sky/40 px-2.5 py-0.5 text-xs font-semibold text-dusty-deep">{summary.creators} creator{summary.creators === 1 ? "" : "s"} active</span>
          {summary.shoots + summary.posts + summary.cboosts + summary.launching + summary.ending === 0 && (
            <span className="text-xs text-ink-faint">Nothing scheduled this month.</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          <MonthStat emoji="🎬" label="Shoots" value={String(summary.shoots)} />
          <MonthStat emoji="★" label="Posts" value={String(summary.posts)} />
          <MonthStat emoji="✨" label="EMV" value={money(summary.emv)} />
          <MonthStat emoji="📈" label="ROI" value={summary.roi == null ? "-" : (summary.roi >= 0 ? "+" : "") + (summary.roi * 100).toFixed(0) + "%"} />
          <MonthStat emoji="⚡" label="Creator boosts" value={String(summary.cboosts)} />
          <MonthStat emoji="📣" label="Internal spend" value={money(summary.ibSpend)} />
          <MonthStat emoji="🚀" label="Launching" value={String(summary.launching)} />
          <MonthStat emoji="🏁" label="Ending" value={String(summary.ending)} />
        </div>
        {summary.spend > 0 && <p className="mt-2 text-xs text-ink-faint">Creator spend on posts this month: <b className="text-ink">{money(summary.spend)}</b></p>}
      </Card>

      <Card className="p-3">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="min-h-[104px] rounded-xl bg-sky/10" />;
            const items = itemsOn(cell.key);
            const isToday = cell.key === todayKey;
            return (
              <button
                type="button"
                key={i}
                onClick={() => setDayKey(cell.key)}
                className={"min-h-[104px] rounded-xl border bg-white/5 p-1.5 text-left transition hover:bg-cream hover:border-dusty-deep/60 " + (isToday ? "border-dusty-deep ring-1 ring-dusty-deep/40" : "border-sky/60")}
              >
                <div className={"mb-1 text-[11px] font-semibold " + (isToday ? "text-dusty-deep" : "text-ink-soft")}>{cell.d}</div>
                <div className="space-y-1">
                  {items.slice(0, 4).map((it, k) => (
                    <div
                      key={k}
                      className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-ink"
                      style={{ background: it.color + "33", borderLeft: `3px solid ${it.color}` }}
                      title={it.label}
                    >
                      {it.label}
                    </div>
                  ))}
                  {items.length > 4 && (
                    <div className="px-1.5 text-[10px] text-ink-faint">+{items.length - 4} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ---- Schedule editor ---- */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Set shoot dates">
        <p className="mb-3 text-xs text-ink-soft">Post &amp; boost dates now live in the Logbook, set them when you log a post.</p>
        <p className="mb-3 text-sm text-ink-soft">Set when each creator&apos;s video goes up and their boosting window. Changes save automatically.</p>
        <div className="max-h-[58vh] space-y-3 overflow-auto pr-1">
          {active.length === 0 ? (
            <div className="rounded-xl bg-sky/20 p-4 text-center text-sm text-ink-soft">No creators yet.</div>
          ) : (
            active.map((c) => (
              <div key={c.id} className="rounded-xl border border-sky/60 bg-white/5 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: campColor(c.campaign) }} />
                  <span className="text-sm font-semibold text-ink">{c.name}</span>
                  <span className="text-xs text-ink-faint">{c.handle}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Field label="Shoot date">
                    <Input type="date" value={c.shoot_date ?? ""} onChange={(e) => updateEngagement(c.id, { shoot_date: e.target.value || null })} />
                  </Field>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end pt-3">
          <Button variant="primary" onClick={() => setShowSchedule(false)}>Done</Button>
        </div>
      </Modal>

      {/* ---- Internal boosts ---- */}
      <Modal open={showInternal} onClose={() => setShowInternal(false)} title="Internal boosts, your own socials">
        <div className="space-y-4">
          <div className="rounded-xl bg-sky/30 p-3 text-sm text-ink-soft">
            Boosting your own Instagram/TikTok posts. Total so far: <b className="text-ink">{money(internalTotal)}</b>
          </div>

          <div className="rounded-xl border border-sky/60 bg-white/5 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Label">
                <Input placeholder="e.g. Lunar New Year reel" value={ib.label} onChange={(e) => setIb({ ...ib, label: e.target.value })} />
              </Field>
              <Field label="Platform">
                <Sel value={ib.platform} onChange={(e) => setIb({ ...ib, platform: e.target.value })}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Sel>
              </Field>
              <Field label="Amount ($)">
                <Input type="number" min={0} step={10} inputMode="decimal" placeholder="0" value={ib.amount} onChange={(e) => setIb({ ...ib, amount: e.target.value })} />
              </Field>
              <Field label="Eclipse (optional)">
                <Sel value={ib.campaign_id} onChange={(e) => setIb({ ...ib, campaign_id: e.target.value })}>
                  <option value="">None</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Sel>
              </Field>
              <Field label="Boost start">
                <Input type="date" value={ib.boost_start} onChange={(e) => setIb({ ...ib, boost_start: e.target.value })} />
              </Field>
              <Field label="Boost end">
                <Input type="date" value={ib.boost_end} onChange={(e) => setIb({ ...ib, boost_end: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end pt-3">
              <Button variant="primary" onClick={saveInternal} disabled={saving}>
                {saving ? "Adding…" : <><Icons.Plus size={15} /> Add internal boost</>}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {internalBoosts.length === 0 ? (
              <div className="rounded-xl bg-sky/20 p-4 text-center text-sm text-ink-soft">No internal boosts logged yet.</div>
            ) : (
              internalBoosts.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-sky/60 bg-white/5 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">
                      {b.label} <span className="text-xs font-normal text-ink-faint">· {b.platform}</span>
                    </div>
                    <div className="truncate text-xs text-ink-soft">
                      {money(Number(b.amount || 0))}
                      {b.campaign_id ? ` · ${campNameById(b.campaign_id) ?? "-"}` : ""}
                      {b.boost_start ? ` · ${b.boost_start}${b.boost_end ? " → " + b.boost_end : ""}` : ""}
                    </div>
                  </div>
                  <button onClick={() => deleteInternalBoost(b.id)} className="ml-2 shrink-0 text-ink-faint hover:text-bubblegum" aria-label="Delete">
                    <Icons.Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ---- Day detail ---- */}
      <Modal open={!!dayKey} onClose={() => setDayKey(null)} title={dayKey ? prettyDate(dayKey) : ""}>
        {dayKey && (() => {
          const items = itemsOn(dayKey);
          if (items.length === 0)
            return <p className="rounded-xl bg-sky/20 p-4 text-center text-sm text-ink-soft">Nothing scheduled this day.</p>;
          return (
            <ul className="space-y-2">
              {items.map((it, k) => (
                <li key={k} className="rounded-xl border border-sky/60 bg-white/5 px-3 py-2 text-sm text-ink" style={{ borderLeft: `4px solid ${it.color}` }}>
                  {it.label}
                </li>
              ))}
            </ul>
          );
        })()}
      </Modal>
    </div>
  );
}

function prettyDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function Sel({ value, onChange, children }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-sky/70 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-dusty-deep"
    >
      {children}
    </select>
  );
}

function MonthStat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-2.5 text-center">
      <div className="text-lg leading-none">{emoji}</div>
      <div className="mt-1 font-display text-lg text-ink">{value}</div>
      <div className="text-[11px] text-ink-faint">{label}</div>
    </div>
  );
}
