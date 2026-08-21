"use client";

import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { type EngagementView, WRITABLE_CREATOR_KEYS } from "@/lib/types";
import {
  STAGES, STAGE_MEANING, STAGE_HUE, PLATFORMS,
  CONTRACT_STATUSES, INVOICE_STATUSES, STATUS_TAGS,
  parseTags, formatTags, tagPool,
} from "@/lib/constants";
import { tierFor, TIER_HUE, totalSpendOf, postCostOf, qEmvOfPost, sentScoreOf } from "@/lib/budget";
import { money, fmtDateTime, initials, pct, num } from "@/lib/format";
import { SlideOver, Button, Field, Input, Textarea, Select, Badge, Pill } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { TagPicker } from "@/components/TagPicker";
import { CreatorFinance } from "@/components/CreatorFinance";
import { usePerms } from "@/lib/perms";

const TABS = ["Star", "Journey", "Ledger", "Analytics", "Finance", "Log"] as const;
type Tab = (typeof TABS)[number];
type AnalyticsRow = { id: string; campaign: string; color: string; stage: string; posts: number; spend: number; emv: number; views: number; sent: number; roi: number | null };

// Which keys belong to the creator profile (vs the engagement).
const CREATOR_KEYS = new Set<string>(WRITABLE_CREATOR_KEYS as string[]);

function n(v: string): number | null {
  if (v === "") return null;
  const f = parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return isNaN(f) ? null : f;
}

export function CreatorSlideOver({
  engagementId,
  onClose,
  onSwitch,
}: {
  engagementId: string | null;
  onClose: () => void;
  onSwitch?: (engagementId: string) => void;
}) {
  const view = useStore((s) => s.views.find((v) => v.id === engagementId) || null);
  const views = useStore((s) => s.views);
  const activity = useStore((s) => s.activity);
  const campaigns = useStore((s) => s.campaigns);
  const updateCreator = useStore((s) => s.updateCreator);
  const creators = useStore((s) => s.creators);
  const updateEngagement = useStore((s) => s.updateEngagement);
  const archiveEngagement = useStore((s) => s.archiveEngagement);
  const duplicateEngagement = useStore((s) => s.duplicateEngagement);
  const deleteEngagement = useStore((s) => s.deleteEngagement);
  const attachCreatorToCampaign = useStore((s) => s.attachCreatorToCampaign);
  const allPosts = useStore((s) => s.posts);
  const allEngagements = useStore((s) => s.engagements);
  const roiSettings = useStore((s) => s.roiSettings);
  const { canEdit } = usePerms();

  const [tab, setTab] = useState<Tab>("Star");
  const [draft, setDraft] = useState<EngagementView | null>(view);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attachTo, setAttachTo] = useState("");
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    setDraft(view);
    setTab("Star");
    setConfirmDelete(false);
    setAttachTo("");
  }, [engagementId]); // eslint-disable-line react-hooks/exhaustive-deps

  const creatorActivity = useMemo(
    () => activity.filter((a) => a.creator_id === view?.creator_id),
    [activity, view?.creator_id]
  );

  const siblings = useMemo(
    () => (view ? views.filter((v) => v.creator_id === view.creator_id && v.id !== view.id) : []),
    [views, view]
  );

  const analytics = useMemo(() => {
    if (!view) return { rows: [] as AnalyticsRow[], totalPosts: 0, totalCost: 0, totalEmv: 0, totalRoi: null as number | null };
    const cid = view.creator_id;
    const rows: AnalyticsRow[] = allEngagements
      .filter((e) => e.creator_id === cid)
      .map((e) => {
        const eposts = allPosts.filter((p) => p.engagement_id === e.id);
        const cam = campaigns.find((c) => c.id === e.campaign_id);
        const spend = eposts.reduce((s2, p) => s2 + postCostOf(p), 0);
        const emv = eposts.reduce((s2, p) => s2 + qEmvOfPost(p, roiSettings), 0);
        const views2 = eposts.reduce((s2, p) => s2 + Number(p.views || 0), 0);
        const sent = eposts.reduce((s2, p) => s2 + sentScoreOf(p, view.creator.followers), 0);
        return { id: e.id, campaign: cam?.name ?? "Unassigned", color: cam?.color ?? "#B7C8EA", stage: e.stage, posts: eposts.length, spend, emv, views: views2, sent, roi: spend > 0 ? (emv - spend) / spend : null };
      })
      .sort((a, b) => b.emv - a.emv);
    const totalPosts = rows.reduce((s2, r) => s2 + r.posts, 0);
    const totalCost = rows.reduce((s2, r) => s2 + r.spend, 0);
    const totalEmv = rows.reduce((s2, r) => s2 + r.emv, 0);
    return { rows, totalPosts, totalCost, totalEmv, totalRoi: totalCost > 0 ? (totalEmv - totalCost) / totalCost : null };
  }, [view, allEngagements, allPosts, campaigns, roiSettings]);

  if (!view || !draft) return null;
  const creator = view.creator;

  const set = (patch: Partial<EngagementView>) => setDraft({ ...draft, ...patch });

  // Commit a single changed field to whichever table owns it (auto-save on blur).
  const commitField = (key: keyof EngagementView, label?: string) => {
    if ((draft as unknown as Record<string, unknown>)[key as string] === (view as unknown as Record<string, unknown>)[key as string]) return;
    const value = (draft as unknown as Record<string, unknown>)[key as string];
    if (CREATOR_KEYS.has(key as string)) {
      updateCreator(creator.id, { [key]: value } as never, label);
    } else {
      updateEngagement(view.id, { [key]: value } as never, label);
    }
  };

  // Commit a patch immediately, splitting profile vs engagement fields.
  const commitImmediate = (patch: Partial<EngagementView>, label?: string) => {
    setDraft({ ...draft, ...patch });
    const creatorPatch: Record<string, unknown> = {};
    const engagementPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (CREATOR_KEYS.has(k)) creatorPatch[k] = v;
      else engagementPatch[k] = v;
    }
    if (Object.keys(creatorPatch).length) updateCreator(creator.id, creatorPatch as never, label);
    if (Object.keys(engagementPatch).length) updateEngagement(view.id, engagementPatch as never, label);
  };

  async function addJourney() {
    if (attaching) return;
    setAttaching(true);
    const eng = await attachCreatorToCampaign(creator.id, attachTo || null);
    setAttaching(false);
    setAttachTo("");
    if (eng && onSwitch) onSwitch(eng.id);
  }

  const tier = tierFor(totalSpendOf(view));

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-2">
        <Button variant="soft" onClick={() => duplicateEngagement(view.id)} title="Duplicate this journey">
          <Icons.Copy size={15} /> Duplicate
        </Button>
        <Button
          variant="soft"
          onClick={() => archiveEngagement(view.id, !view.archived)}
          title={view.archived ? "Restore" : "Archive"}
        >
          <Icons.Archive size={15} /> {view.archived ? "Restore" : "Archive"}
        </Button>
      </div>
      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-soft">Remove this journey?</span>
          <Button variant="danger" onClick={() => { deleteEngagement(view.id); onClose(); }}>Yes, remove</Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep</Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-bubblegum">
          <Icons.Trash2 size={15} /> Delete journey
        </Button>
      )}
    </div>
  );

  return (
    <SlideOver
      open={Boolean(engagementId)}
      onClose={onClose}
      title={creator.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <Pill>{creator.handle}</Pill>
          <Badge hue={STAGE_HUE[view.stage]}>{view.stage}</Badge>
          <Badge hue={TIER_HUE[tier]}>{tier}</Badge>
          {view.campaign && <Pill>{view.campaign}</Pill>}
          {(view.archived || creator.archived) && <Pill className="text-bubblegum">Archived</Pill>}
        </span>
      }
      footer={canEdit ? footer : undefined}
    >
      {/* header card */}
      <div className="mb-5 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-sky to-white p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-lavender text-xl font-bold text-navy-deep">
          {creator.profile_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.profile_image} alt="" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            initials(creator.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-ink-soft">Followers <b className="text-ink">{num(creator.followers)}</b></span>
            <span className="text-ink-soft">Engagement <b className="text-ink">{pct(creator.engagement_rate, 1)}</b></span>
            <span className="text-ink-soft">This journey <b className="text-ink">{money(totalSpendOf(view))}</b></span>
          </div>
          <div className="mt-1 text-xs text-ink-faint">on {view.campaign ?? "-"} · {creator.platform}</div>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-4 flex gap-1 rounded-full bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              tab === t ? "bg-dusty-deep text-white shadow-cozy" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!canEdit && (
        <div className="mb-3 rounded-2xl bg-sky/40 px-3 py-2 text-xs text-ink-soft">
          <Icons.Eye size={13} className="mr-1 inline" /> Read-only, you have Viewer access.
        </div>
      )}
      <fieldset disabled={!canEdit} className="min-w-0 border-0 p-0 disabled:opacity-100">

      {tab === "Star" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-2xl bg-seafoam-soft/60 px-3 py-2 text-xs text-ink-soft">
            This is the shared profile, edits here apply to {creator.name} on every journey.
          </div>
          <div className="col-span-2">
            <Field label="Profile picture">
              <ImageUpload
                value={draft.profile_image ?? null}
                onChange={(url) => commitImmediate({ profile_image: url }, url ? "Updated profile picture" : "Removed profile picture")}
                folder="avatars"
                shape="circle"
                label="photo"
              />
            </Field>
          </div>
          <div className="col-span-2"><Field label="Name"><Input value={draft.name ?? ""} onChange={(e) => set({ name: e.target.value })} onBlur={() => commitField("name", `Renamed to ${draft.name}`)} /></Field></div>
          <Field label="Handle"><Input value={draft.handle ?? ""} onChange={(e) => set({ handle: e.target.value })} onBlur={() => commitField("handle")} /></Field>
          <Field label="Platform">
            <Select value={draft.platform} onChange={(e) => commitImmediate({ platform: e.target.value as EngagementView["platform"] })}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Email"><Input value={draft.email ?? ""} onChange={(e) => set({ email: e.target.value })} onBlur={() => commitField("email")} /></Field>
          <Field label="Phone"><Input value={draft.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} onBlur={() => commitField("phone")} /></Field>
          <Field label="City"><Input value={draft.city ?? ""} onChange={(e) => set({ city: e.target.value })} onBlur={() => commitField("city")} /></Field>
          <Field label="State"><Input value={draft.state ?? ""} onChange={(e) => set({ state: e.target.value })} onBlur={() => commitField("state")} /></Field>
          <div className="col-span-2"><Field label="Tags">
            <TagPicker
              value={parseTags(draft.categories)}
              onChange={(next) => commitImmediate({ categories: formatTags(next) })}
              suggestions={tagPool(creators.map((c) => c.categories))}
            />
          </Field></div>
          <div className="col-span-2"><Field label="Bio"><Textarea value={draft.bio ?? ""} onChange={(e) => set({ bio: e.target.value })} onBlur={() => commitField("bio")} /></Field></div>

          <div className="col-span-2 flex flex-wrap items-center gap-2 rounded-3xl bg-white/5 p-3">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Payment forms</span>
            <button
              type="button"
              onClick={() => commitImmediate({ w9_on_file: !draft.w9_on_file }, `W-9 ${draft.w9_on_file ? "cleared" : "on file"} · ${creator.name}`)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${draft.w9_on_file ? "bg-seafoam-soft text-seafoam-deep" : "bg-cream text-ink-soft ring-1 ring-sky/70 hover:text-dusty-deep"}`}
            >
              {draft.w9_on_file ? <Icons.CheckCircle2 size={14} /> : <Icons.Circle size={14} />} W-9 on file
            </button>
            <button
              type="button"
              onClick={() => commitImmediate({ ach_on_file: !draft.ach_on_file }, `ACH ${draft.ach_on_file ? "cleared" : "on file"} · ${creator.name}`)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${draft.ach_on_file ? "bg-seafoam-soft text-seafoam-deep" : "bg-cream text-ink-soft ring-1 ring-sky/70 hover:text-dusty-deep"}`}
            >
              {draft.ach_on_file ? <Icons.CheckCircle2 size={14} /> : <Icons.Circle size={14} />} ACH on file
            </button>
          </div>

          <div className="col-span-2 mt-1 grid grid-cols-2 gap-3 rounded-3xl bg-white/5 p-3">
            <Field label="Followers"><Input value={draft.followers ?? ""} onChange={(e) => set({ followers: n(e.target.value) })} onBlur={() => commitField("followers")} /></Field>
            <Field label="Engagement %" hint="e.g. 5.4">
              <Input
                value={draft.engagement_rate != null ? +(draft.engagement_rate * 100).toFixed(2) : ""}
                onChange={(e) => set({ engagement_rate: e.target.value === "" ? null : (n(e.target.value) ?? 0) / 100 })}
                onBlur={() => commitField("engagement_rate")}
              />
            </Field>
            <Field label="Audience location"><Input value={draft.audience_location ?? ""} onChange={(e) => set({ audience_location: e.target.value })} onBlur={() => commitField("audience_location")} /></Field>
            <Field label="Demographics"><Input value={draft.audience_demographics ?? ""} onChange={(e) => set({ audience_demographics: e.target.value })} onBlur={() => commitField("audience_demographics")} /></Field>
          </div>

          <div className="col-span-2"><Field label="CRM notes"><Textarea value={draft.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} onBlur={() => commitField("notes")} /></Field></div>
        </div>
      )}

      {tab === "Journey" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white/5 p-3">
            <button
              type="button"
              onClick={() => commitImmediate({ is_organic: !draft.is_organic }, `This journey marked ${draft.is_organic ? "paid" : "organic"} · ${creator.name}`)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${draft.is_organic ? "bg-seafoam-soft text-seafoam-deep" : "bg-cream text-ink-soft ring-1 ring-sky/70 hover:text-dusty-deep"}`}
            >
              {draft.is_organic ? <Icons.Leaf size={14} /> : <Icons.Circle size={14} />} Organic (unpaid)
            </button>
            <span className="text-[11px] text-ink-faint">{draft.is_organic ? "No contract, invoice, or payment tracked for this journey." : "Paid, contract & payment tracked in The Vault / Stardust."}</span>
          </div>
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Growth stage</span>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((st) => (
                <button
                  key={st}
                  onClick={() => commitImmediate({ stage: st }, `Moved ${creator.name}: ${view.stage} → ${st}`)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    draft.stage === st ? "text-navy-deep ring-2 ring-navy/30" : "text-ink-soft hover:text-ink"
                  }`}
                  style={{ backgroundColor: draft.stage === st ? STAGE_HUE[st] : "#1c1c21" }}
                  title={STAGE_MEANING[st]}
                >
                  {st}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-faint">{STAGE_MEANING[draft.stage]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Eclipse">
              <Select value={draft.campaign_id ?? ""} onChange={(e) => commitImmediate({ campaign_id: e.target.value || null })}>
                <option value="">-</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Status tag">
              <Select value={draft.status_tag ?? ""} onChange={(e) => commitImmediate({ status_tag: (e.target.value || null) as EngagementView["status_tag"] })}>
                <option value="">-</option>
                {STATUS_TAGS.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Event"><Input value={draft.event ?? ""} onChange={(e) => set({ event: e.target.value })} onBlur={() => commitField("event")} /></Field>
            <Field label="Last response"><Input value={draft.last_response ?? ""} onChange={(e) => set({ last_response: e.target.value })} onBlur={() => commitField("last_response")} /></Field>
            <Field label="First contact"><Input type="date" value={draft.first_contact_date ?? ""} onChange={(e) => set({ first_contact_date: e.target.value || null })} onBlur={() => commitField("first_contact_date")} /></Field>
            <Field label="Last follow-up"><Input type="date" value={draft.last_follow_up ?? ""} onChange={(e) => set({ last_follow_up: e.target.value || null })} onBlur={() => commitField("last_follow_up")} /></Field>
            <Field label="# Follow-ups"><Input value={draft.num_follow_ups ?? ""} onChange={(e) => set({ num_follow_ups: n(e.target.value) })} onBlur={() => commitField("num_follow_ups")} /></Field>
          </div>

          <Field label="Deliverables"><Textarea value={draft.deliverables ?? ""} onChange={(e) => set({ deliverables: e.target.value })} onBlur={() => commitField("deliverables")} /></Field>
          <Field label="Negotiation notes"><Textarea value={draft.negotiation_notes ?? ""} onChange={(e) => set({ negotiation_notes: e.target.value })} onBlur={() => commitField("negotiation_notes")} /></Field>

          {/* Schedule, mirrors onto the Almanac (same engagement dates) */}
          <div className="rounded-3xl bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <Icons.CalendarClock size={14} /> Schedule
              <span className="ml-auto rounded-full bg-seafoam-soft px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-seafoam-deep">shows on Almanac</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Shoot / film date"><Input type="date" value={draft.shoot_date ?? ""} onChange={(e) => set({ shoot_date: e.target.value || null })} onBlur={() => commitField("shoot_date", `Set ${creator.name}'s shoot date`)} /></Field>
              <Field label="Post date"><Input type="date" value={draft.post_date ?? ""} onChange={(e) => set({ post_date: e.target.value || null })} onBlur={() => commitField("post_date", `Set ${creator.name}'s post date`)} /></Field>
              <Field label="Boost start"><Input type="date" value={draft.boost_start ?? ""} onChange={(e) => set({ boost_start: e.target.value || null })} onBlur={() => commitField("boost_start")} /></Field>
              <Field label="Boost end"><Input type="date" value={draft.boost_end ?? ""} onChange={(e) => set({ boost_end: e.target.value || null })} onBlur={() => commitField("boost_end")} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">Shoot &amp; post dates show on the Almanac; the boost window shades those days.</p>
          </div>

          {/* Other journeys + attach to another eclipse */}
          <div className="rounded-3xl bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <Icons.Sprout size={14} /> {creator.name.split(" ")[0]}&apos;s other journeys
            </div>
            {siblings.length === 0 ? (
              <p className="text-xs text-ink-faint">No other eclipses yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {siblings.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => onSwitch?.(s.id)}
                      disabled={!onSwitch}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm ${onSwitch ? "hover:bg-sky" : "cursor-default"}`}
                    >
                      <span className="truncate text-ink">{s.campaign ?? "Unassigned"}</span>
                      <Badge hue={STAGE_HUE[s.stage]}>{s.stage}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-end gap-2">
              <div className="flex-1">
                <Field label="Add to another eclipse">
                  <Select value={attachTo} onChange={(e) => setAttachTo(e.target.value)}>
                    <option value="">Choose eclipse</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
              </div>
              <Button variant="primary" onClick={addJourney} disabled={attaching}>
                {attaching ? "Adding…" : <><Icons.Plus size={15} /> Add</>}
              </Button>
            </div>
          </div>

          <DraftTools view={view} />
        </div>
      )}

      {tab === "Ledger" && (
        <div className="space-y-4">
          {draft.is_organic && (
            <div className="flex items-center gap-2 rounded-2xl bg-seafoam-soft/50 px-3 py-2 text-xs text-seafoam-deep">
              <Icons.Leaf size={13} /> This journey is organic, contract, invoice &amp; payment aren&apos;t tracked here.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/5 p-3">
            <Field label="Standard rate (profile)"><Input value={draft.standard_rate ?? ""} onChange={(e) => set({ standard_rate: n(e.target.value) })} onBlur={() => commitField("standard_rate")} /></Field>
            <Field label="Negotiated rate"><Input value={draft.negotiated_rate ?? ""} onChange={(e) => set({ negotiated_rate: n(e.target.value) })} onBlur={() => commitField("negotiated_rate")} /></Field>
            <Field label="Usage rights fee"><Input value={draft.usage_rights_fee ?? ""} onChange={(e) => set({ usage_rights_fee: n(e.target.value) })} onBlur={() => commitField("usage_rights_fee")} /></Field>
            <Field label="Whitelisting fee"><Input value={draft.whitelisting_fee ?? ""} onChange={(e) => set({ whitelisting_fee: n(e.target.value) })} onBlur={() => commitField("whitelisting_fee")} /></Field>
            <Field label="Travel cost"><Input value={draft.travel_cost ?? ""} onChange={(e) => set({ travel_cost: n(e.target.value) })} onBlur={() => commitField("travel_cost")} /></Field>
            <div className="self-end rounded-2xl bg-seafoam-soft px-3 py-2 text-sm">
              <div className="text-xs text-ink-soft">Total creator cost</div>
              <div className="font-display text-lg text-navy-deep">{money(view.total_creator_cost)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/5 p-3">
            <Field label="Creator fee (campaign)"><Input value={draft.creator_fee ?? ""} onChange={(e) => set({ creator_fee: n(e.target.value) })} onBlur={() => commitField("creator_fee", `Updated ${creator.name} fee`)} /></Field>
            <Field label="Boost spend"><Input value={draft.boost_spend ?? ""} onChange={(e) => set({ boost_spend: n(e.target.value) })} onBlur={() => commitField("boost_spend", `Updated ${creator.name} boost`)} /></Field>
            <div className="col-span-2 flex items-center justify-between rounded-2xl bg-dusty-soft/50 px-3 py-2">
              <span className="text-sm text-ink-soft">Total spend on this journey</span>
              <span className="font-display text-lg text-navy-deep">{money(totalSpendOf(view))}</span>
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={draft.is_annual} onChange={(e) => commitImmediate({ is_annual: e.target.checked })} className="h-4 w-4 accent-dusty-deep" />
              Annual contracted creator
            </label>
            {draft.is_annual && (
              <Field label="Planned boost (annual)"><Input value={draft.planned_boost ?? ""} onChange={(e) => set({ planned_boost: n(e.target.value) })} onBlur={() => commitField("planned_boost")} /></Field>
            )}
          </div>

          {/* The Vault */}
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/5 p-3">
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">The Vault · contract</div>
            <Field label="Contract status">
              <Select value={draft.contract_status} onChange={(e) => commitImmediate({ contract_status: e.target.value as EngagementView["contract_status"] }, `Contract ${e.target.value.toLowerCase()} · ${creator.name}`)}>
                {CONTRACT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <div />
            <Field label="Sent date"><Input type="date" value={draft.contract_sent_date ?? ""} onChange={(e) => set({ contract_sent_date: e.target.value || null })} onBlur={() => commitField("contract_sent_date")} /></Field>
            <Field label="Signed date"><Input type="date" value={draft.contract_signed_date ?? ""} onChange={(e) => set({ contract_signed_date: e.target.value || null })} onBlur={() => commitField("contract_signed_date")} /></Field>
          </div>

          {/* Treasury */}
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/5 p-3">
            <div className="col-span-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Treasury · invoice</div>
            <Field label="Invoice status">
              <Select value={draft.invoice_status} onChange={(e) => commitImmediate({ invoice_status: e.target.value as EngagementView["invoice_status"] }, `Invoice ${e.target.value.toLowerCase()} · ${creator.name}`)}>
                {INVOICE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <div />
            <Field label="Invoice received"><Input type="date" value={draft.invoice_received_date ?? ""} onChange={(e) => set({ invoice_received_date: e.target.value || null })} onBlur={() => commitField("invoice_received_date")} /></Field>
            <Field label="Submitted to billing"><Input type="date" value={draft.submitted_to_billing_date ?? ""} onChange={(e) => set({ submitted_to_billing_date: e.target.value || null })} onBlur={() => commitField("submitted_to_billing_date")} /></Field>
            <Field label="Payment date"><Input type="date" value={draft.payment_date ?? ""} onChange={(e) => set({ payment_date: e.target.value || null })} onBlur={() => commitField("payment_date")} /></Field>
          </div>
        </div>
      )}

      {tab === "Analytics" && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-lavender-soft/50 px-3 py-2 text-xs text-ink-soft">
            Every journey {creator.name} has grown through, side by side. EMV &amp; ROI are sentiment-adjusted from logged posts.
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <div className="font-display text-lg text-ink">{analytics.totalPosts}</div>
              <div className="text-[11px] text-ink-soft">Posts</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <div className="font-display text-lg text-ink">{money(analytics.totalEmv)}</div>
              <div className="text-[11px] text-ink-soft">Total EMV</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <div className={"font-display text-lg " + (analytics.totalRoi == null ? "text-ink-faint" : analytics.totalRoi >= 0 ? "text-seafoam-deep" : "text-bubblegum")}>
                {analytics.totalRoi == null ? "-" : (analytics.totalRoi >= 0 ? "+" : "") + (analytics.totalRoi * 100).toFixed(0) + "%"}
              </div>
              <div className="text-[11px] text-ink-soft">Blended ROI</div>
            </div>
          </div>

          {analytics.rows.length === 0 ? (
            <p className="rounded-3xl bg-white/5 p-6 text-center text-sm text-ink-soft">No journeys logged yet. Add posts in the Logbook to see {creator.name}’s performance here.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-sky/60">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="bg-sky/60 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                    <th className="px-3 py-2 font-semibold">Eclipse</th>
                    <th className="px-2 py-2 text-right font-semibold">Posts</th>
                    <th className="px-2 py-2 text-right font-semibold">Spend</th>
                    <th className="px-2 py-2 text-right font-semibold">EMV</th>
                    <th className="px-2 py-2 text-right font-semibold">ROI</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.rows.map((r) => (
                    <tr key={r.id} className="border-t border-sky/70">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{r.campaign}</span>
                            <span className="block text-[11px] text-ink-faint">{r.stage}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right text-ink-soft">{r.posts}</td>
                      <td className="px-2 py-2 text-right text-ink">{money(r.spend)}</td>
                      <td className="px-2 py-2 text-right text-ink">{money(r.emv)}</td>
                      <td className="px-2 py-2 text-right">
                        {r.roi == null ? <span className="text-ink-faint">-</span> : <span className={"font-semibold " + (r.roi >= 0 ? "text-seafoam-deep" : "text-bubblegum")}>{(r.roi >= 0 ? "+" : "") + (r.roi * 100).toFixed(0)}%</span>}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {r.id !== view.id && onSwitch ? (
                          <button type="button" onClick={() => onSwitch(r.id)} className="text-xs text-dusty-deep hover:underline">Open</button>
                        ) : <span className="text-[11px] text-ink-faint">current</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Finance" && <CreatorFinance creatorId={view.creator_id} creatorName={creator.name} />}

      {tab === "Log" && (
        <div className="space-y-3">
          {creatorActivity.length === 0 ? (
            <p className="rounded-3xl bg-white/5 p-6 text-center text-sm text-ink-soft">No log entries yet, changes you make will show up here.</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-dusty-soft pl-5">
              {creatorActivity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-seafoam ring-2 ring-white" />
                  <div className="text-sm text-ink">{a.text}</div>
                  <div className="text-xs text-ink-faint">{a.actor} · {fmtDateTime(a.created_at)}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      </fieldset>
    </SlideOver>
  );
}

// Lightweight draft generators (outreach / follow-up / notes summary).
function DraftTools({ view }: { view: EngagementView }) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const companies = useStore((s) => s.companies);
  const me = useStore((s) => s.currentUser);
  const org = companies.find((c) => c.id === view.company_id)?.name ?? "our team";
  const myName = me?.name ?? "the team";

  const outreach = () =>
    setText(
      `Hi ${view.name.split(" ")[0]},\n\nI'm ${myName} with ${org}. I love your ${view.categories ?? "content"} on ${view.platform}, your voice would be a beautiful fit for our ${view.campaign ?? "upcoming"} campaign.\n\nWe'd love to explore a paid partnership${view.deliverables ? ` (${view.deliverables})` : ""}. Would you be open to a quick chat about timing and rates?\n\nWarmly,\n${myName} · ${org}`
    );

  const followUp = () =>
    setText(
      `Hi ${view.name.split(" ")[0]},\n\nJust floating this back to the top of your inbox, still really hoping to bring you aboard for ${org}'s ${view.campaign ?? "next"} campaign. No rush at all; happy to work around your schedule.\n\nWould love to hear your thoughts whenever you have a moment!\n\nWarmly,\n${myName}`
    );

  const summarize = () => {
    const notes = [view.notes, view.negotiation_notes].filter(Boolean).join(" ");
    setText(
      notes
        ? `Summary for ${view.name}: ${notes.replace(/\s+/g, " ").slice(0, 280)}${notes.length > 280 ? "…" : ""}\n\nStage: ${view.stage} · Tier: ${tierFor(totalSpendOf(view))} · Fee: ${money(view.creator_fee)}`
        : `No notes yet for ${view.name}. Current stage: ${view.stage}.`
    );
  };

  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-lavender-soft to-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <Icons.Wand2 size={14} /> Bottled-message drafts
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="soft" onClick={outreach}><Icons.Send size={14} /> Outreach</Button>
        <Button variant="soft" onClick={followUp}><Icons.RefreshCw size={14} /> Follow-up</Button>
        <Button variant="soft" onClick={summarize}><Icons.FileText size={14} /> Summarize notes</Button>
      </div>
      {text && (
        <div className="mt-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[140px] bg-cream" />
          <div className="mt-2 flex justify-end">
            <Button variant="primary" onClick={copy}>
              <Icons.Clipboard size={14} /> {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
