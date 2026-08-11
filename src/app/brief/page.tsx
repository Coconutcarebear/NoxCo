"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import * as Icons from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { TagPicker } from "@/components/TagPicker";

/* ---------------- palette (premium botanical, print-safe) ---------------- */
const P = {
  ink: "#2B3149", body: "#4E4B5E", brass: "#B98F42", bloom: "#5E9C90",
  blush: "#D89D8E", paper: "#FBFAF4", rule: "#E7E0D0", faint: "#9A93A3",
};
const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";

/* ---------------- reusable content ---------------- */
const TAG_SUGGESTIONS = ["Product", "Food", "Family", "Walking Tour", "Seasonal", "Lifestyle", "Culture", "Budget", "Local", "Foodie", "Hidden Gems", "Nightlife", "Art", "Launch"];

const AVOID_DEFAULT = "Overly promotional or scripted delivery\nMentioning other competitors\nMisrepresenting event programming or lineup\nStaging interactions that didn't naturally occur\nPolitical messaging or sensitive commentary";
const REPORTING_DEFAULT = "Please share story insights within 48 hours of posting. Additional post-performance metrics (reach, impressions, engagement, saves, shares, etc.) within 7–30 days are always appreciated.";
const REVISIONS_DEFAULT = "We include up to 2 rounds of feedback. Our notes stay focused on caption edits, CTA clarity, and brand/cultural accuracy — we're not here to change your creative direction. Full reshoots aren't expected unless content significantly misses the brief.";
const NOTE_TEXT = "This brief is intended to guide creative direction and content execution. Final deliverables, payment terms, and creator obligations will be outlined and confirmed in a separate creator agreement.";
const USAGE_DEFAULT = "Brand may use content for:\n• Organic social\n• Paid social advertising (within 30 days from posting)\n• Website, email, and digital placements (within 30 days from posting)\n\nWhitelisting / Paid Amplification: Yes (within 30 days from posting) — Instagram, TikTok, YouTube.\nBrand will not alter creator voice or likeness.\n\nContent will not be used for TV, OOH, or print (unless agreed in writing), or resale / third-party licensing.";

const DELIVERABLE_TEMPLATES: { name: string; main: string; story: string }[] = [
  { name: "Day in the Life",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nTake us through a day with the brand woven in naturally — your routine, your favorite parts, and how the product/service fits in.\n\nYou might capture:\n• Everyday moments the brand shows up in\n• Hidden gems you always recommend\n• A natural, unscripted mention of the brand\n• The feeling of an authentic day\n\nWe're not looking for polish — we're looking for what your day genuinely feels like.",
    story: "One frame within 24 hours of your main post.\n\nSuggested overlays:\n• A day with [brand] ☀️\n• Come spend the day with me\n\nCTA: Learn more — link in bio" },
  { name: "Product/Food Crawl",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nTake us on a crawl through your favorites — the picks you always come back to, and a natural stop with the brand along the way.\n\nYou might capture:\n• Signature picks and where to get them\n• Your honest first reactions\n• A stop with the brand to round out the day",
    story: "One frame within 24 hours.\n\nSuggested overlays:\n• Trying my way through [brand] 🍜\n\nCTA: Learn more — link in bio" },
  { name: "Walking Tour",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nWalk us through the neighborhood or space the way you'd show a friend — the stops worth knowing, with the brand folded in as a natural part of the route.",
    story: "One frame within 24 hours.\n\nSuggested overlay:\n• A little walk through [location] 🚶\n\nCTA: Learn more — link in bio" },
  { name: "Event Coverage",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nCapture the feeling of the event — the arrival, the energy, the highlights, and a genuine sense of what it was like to be there.",
    story: "2–3 frames during the event + 1 recap frame within 24 hours.\n\nSuggested overlays:\n• Tonight at [brand] ✨\n\nCTA: More events — link in bio" },
  { name: "Launch / Reveal",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nTake us through the launch in your own voice — what stopped you, what surprised you, and why it's worth checking out. Personal and curious, not a scripted ad.",
    story: "One frame within 24 hours.\n\nSuggested overlay:\n• Check this out 🎉\n\nCTA: Learn more — link in bio" },
  { name: "Family Day",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nShow a family-friendly day — easy stops, things to do with kids, and the brand fitting naturally into the afternoon.",
    story: "One frame within 24 hours.\n\nSuggested overlay:\n• A family day with [brand] 👨‍👩‍👧\n\nCTA: Learn more — link in bio" },
  { name: "After Dark",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nCapture the evening energy — the lights, the mood — with the brand and the day's story woven in.",
    story: "One frame within 24 hours.\n\nSuggested overlay:\n• [Brand] after dark 🌙\n\nCTA: Learn more — link in bio" },
  { name: "Creator Choice",
    main: "One vlog-style video. Vertical, mobile-first. Minimum 45 seconds.\n\nThis one's yours — tell the story you think fits the brand best, in your own format and voice, with the brand woven in naturally.",
    story: "One frame within 24 hours.\n\nSuggested overlay:\n• My kind of day\n\nCTA: Learn more — link in bio" },
];

/* ---------------- types ---------------- */
type Brief = {
  mode: "concept" | "event";
  title: string; dateline: string; link: string;
  why: string;
  concept: string; filming: string; location: string; format: string;
  eventTitle: string; eventDateTime: string; eventLocation: string; eventDesc: string;
  mainDeliverable: string; storyDeliverable: string;
  igHandle: string; ttHandle: string; ytHandle: string; requiredHashtag: string;
  tags: string[];
  drafts: number; revisions: number; filmingDate: string;
  daysToFirstDraft: number; daysBetween: number;
  tone: string;
  avoid: string; usage: string; reporting: string; revisionsText: string;
  moodboard: string[];
};

const EMPTY: Brief = {
  mode: "event",
  title: "", dateline: "", link: "https://www.noxandco.com/",
  why: "",
  concept: "", filming: "", location: "", format: "vlog-style, day-in-the-life",
  eventTitle: "", eventDateTime: "", eventLocation: "", eventDesc: "",
  mainDeliverable: "", storyDeliverable: "",
  igHandle: "@yourbrand", ttHandle: "@yourbrand", ytHandle: "@yourbrand", requiredHashtag: "#YourBrand",
  tags: [],
  drafts: 1, revisions: 2, filmingDate: "",
  daysToFirstDraft: 4, daysBetween: 3,
  tone: "",
  avoid: AVOID_DEFAULT, usage: USAGE_DEFAULT, reporting: REPORTING_DEFAULT, revisionsText: REVISIONS_DEFAULT,
  moodboard: [],
};

type Saved = { id: string; savedAt: number; brief: Brief };

const DRAFT_KEY = "sb_brief_draft";
const LIB_KEY = "sb_brief_library";
const TAGS_KEY = "sb_brief_tags";

/* ---------------- date + timeline ---------------- */
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function niceDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
type Step = { label: string; offset: number; date: string | null; icon: "seed" | "star" | "trail" | "flag" };
function buildTimeline(b: Brief): Step[] {
  const steps: { label: string; offset: number; icon: Step["icon"] }[] = [];
  let off = 0;
  const push = (label: string, add: number, icon: Step["icon"]) => { off += add; steps.push({ label, offset: off, icon }); };
  const first = b.daysToFirstDraft ?? 4;
  const gap = b.daysBetween ?? 3;
  steps.push({ label: "Film your day", offset: 0, icon: "seed" });
  push("First draft", first, "star");
  for (let d = 2; d <= b.drafts; d++) push(`Draft ${d}`, gap, "star");
  for (let r = 1; r <= b.revisions; r++) {
    push(`Round ${r} feedback`, gap, "trail");
    push(`Revision ${r}`, gap, "star");
  }
  push("Final cut", gap, "flag");
  return steps.map((s) => ({ ...s, date: b.filmingDate ? addDays(b.filmingDate, s.offset) : null }));
}

/* ==================================================================== */
export default function BriefPage() {
  const [b, setB] = useState<Brief>(EMPTY);
  const userSettings = useStore((s) => s.userSettings);
  const saveUserSettings = useStore((s) => s.saveUserSettings);
  const currentUser = useStore((s) => s.currentUser);
  const [legacyLib] = useState<Saved[]>(() => {
    try { const l = typeof window !== "undefined" ? localStorage.getItem(LIB_KEY) : null; return l ? (JSON.parse(l) as Saved[]) : []; } catch { return []; }
  });
  const lib = Array.isArray(userSettings.briefLibrary) ? (userSettings.briefLibrary as Saved[]) : legacyLib;
  const [pool, setPool] = useState<string[]>(TAG_SUGGESTIONS);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const d = localStorage.getItem(DRAFT_KEY); if (d) setB({ ...EMPTY, ...JSON.parse(d) }); } catch {}
    try { const t = localStorage.getItem(TAGS_KEY); if (t) setPool(Array.from(new Set([...TAG_SUGGESTIONS, ...JSON.parse(t)]))); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(b)); } catch {} }, [b]);
  // one-time: lift any briefs saved in this browser up into the account
  useEffect(() => {
    if (currentUser && userSettings.briefLibrary === undefined && legacyLib.length > 0) saveUserSettings({ briefLibrary: legacyLib });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userSettings.briefLibrary]);

  const set = (patch: Partial<Brief>) => setB((prev) => ({ ...prev, ...patch }));
  const timeline = useMemo(() => buildTimeline(b), [b.filmingDate, b.drafts, b.revisions, b.daysToFirstDraft, b.daysBetween]);

  function saveLib(next: Saved[]) { saveUserSettings({ briefLibrary: next.slice(0, 40) }); }
  function rememberTags(tags: string[]) {
    const merged = Array.from(new Set([...pool, ...tags]));
    setPool(merged);
    try { localStorage.setItem(TAGS_KEY, JSON.stringify(merged)); } catch {}
  }

  function applyTemplate(name: string) {
    const t = DELIVERABLE_TEMPLATES.find((x) => x.name === name);
    if (t) set({ mainDeliverable: t.main, storyDeliverable: t.story });
  }
  function addImages(files: FileList | null) {
    if (!files) return;
    Array.from(files).slice(0, 6).forEach((f) => {
      const r = new FileReader();
      r.onload = () => setB((prev) => ({ ...prev, moodboard: [...prev.moodboard, r.result as string].slice(0, 6) }));
      r.readAsDataURL(f);
    });
  }
  function saveToLibrary() {
    const id = "brief_" + Date.now();
    const entry: Saved = { id, savedAt: Date.now(), brief: { ...b } };
    saveLib([entry, ...lib].slice(0, 40));
  }
  function openSaved(s: Saved) { setB({ ...EMPTY, ...s.brief }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function duplicateSaved(s: Saved) {
    const copy: Saved = { id: "brief_" + Date.now(), savedAt: Date.now(), brief: { ...s.brief, title: s.brief.title + " (copy)" } };
    saveLib([copy, ...lib].slice(0, 40));
    setB({ ...EMPTY, ...copy.brief });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function deleteSaved(id: string) { saveLib(lib.filter((x) => x.id !== id)); }
  function reset() { if (confirm("Clear this brief and start fresh?")) setB(EMPTY); }
  function print() { rememberTags(b.tags); saveToLibrary(); setTimeout(() => window.print(), 60); }
  function copyText() { navigator.clipboard?.writeText(plainText(b, timeline)).then(() => alert("Brief copied as text.")); }

  return (
    <div>
      <style>{`
        #brief-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          #brief-sheet { box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; margin: 0 !important; }
          .print-footer { display: block !important; }
          @page { margin: 14mm 0; }
        }
      `}</style>

      <div className="print:hidden">
        <PageHeader title="Brief Builder" sub="Creator briefs" icon="FileText"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={reset}><Icons.RotateCcw size={15} /> Reset</Button>
              <Button variant="soft" onClick={copyText}><Icons.Copy size={15} /> Copy text</Button>
              <Button variant="soft" onClick={saveToLibrary}><Icons.BookmarkPlus size={15} /> Save</Button>
              <Button variant="primary" onClick={print}><Icons.Printer size={15} /> Print / Save PDF</Button>
            </div>
          }
        />
      </div>

      {/* PREVIOUS BRIEFS */}
      {lib.length > 0 && (
        <div className="mb-4 rounded-3xl bg-white/70 p-4 print:hidden">
          <div className="mb-2 flex items-center gap-2 text-ink"><Icons.Library size={16} className="text-dusty-deep" /><h3 className="font-display text-base">Previous briefs</h3><span className="text-xs text-ink-faint">{lib.length}</span></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lib.map((s) => (
              <div key={s.id} className="w-52 shrink-0 rounded-2xl border border-sky/70 bg-white p-3">
                <div className="truncate text-sm font-semibold text-ink">{s.brief.title || "Untitled brief"}</div>
                <div className="mt-0.5 text-[11px] text-ink-faint">{s.brief.mode === "event" ? "Event" : "Concept"} · {new Date(s.savedAt).toLocaleDateString()}</div>
                <div className="mt-2 flex gap-1">
                  <button onClick={() => openSaved(s)} className="rounded-lg bg-sky/60 px-2 py-1 text-[11px] font-semibold text-dusty-deep hover:bg-sky">Open</button>
                  <button onClick={() => duplicateSaved(s)} className="rounded-lg bg-sky/40 px-2 py-1 text-[11px] font-semibold text-ink-soft hover:bg-sky">Duplicate</button>
                  <button onClick={() => deleteSaved(s.id)} aria-label="Delete" className="ml-auto rounded-lg px-1.5 py-1 text-ink-faint hover:text-bubblegum"><Icons.Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2 print:block">
        {/* ================= FORM ================= */}
        <div className="space-y-4 print:hidden">
          <FC>
            <div className="mb-3 inline-flex rounded-full bg-sky/40 p-1 text-sm font-semibold">
              {(["concept", "event"] as const).map((m) => (
                <button key={m} onClick={() => set({ mode: m })} className={`rounded-full px-4 py-1.5 capitalize transition ${b.mode === m ? "bg-white text-dusty-deep shadow-pill" : "text-ink-soft"}`}>{m}</button>
              ))}
            </div>
            <div className="grid gap-3">
              <Field label="Brief title"><Input value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="A Summer Day in Chinatown" /></Field>
              <Field label="Dateline / subtitle"><Input value={b.dateline} onChange={(e) => set({ dateline: e.target.value })} placeholder="July 2026 · Downtown, NYC" /></Field>
              <Field label="Link"><Input value={b.link} onChange={(e) => set({ link: e.target.value })} /></Field>
            </div>
          </FC>

          <FC title="Why We're Reaching Out"><Textarea rows={4} value={b.why} onChange={(e) => set({ why: e.target.value })} placeholder="Why you picked them and what you're collaborating on…" /></FC>

          {b.mode === "concept" ? (
            <FC title="The Concept">
              <Textarea rows={4} value={b.concept} onChange={(e) => set({ concept: e.target.value })} placeholder="The story you want them to tell." />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="🗓 Filming"><Input value={b.filming} onChange={(e) => set({ filming: e.target.value })} placeholder="Mid-June – early July" /></Field>
                <Field label="📍 Location"><Input value={b.location} onChange={(e) => set({ location: e.target.value })} placeholder="Chinatown, Manhattan" /></Field>
                <Field label="🎥 Format"><Input value={b.format} onChange={(e) => set({ format: e.target.value })} /></Field>
              </div>
            </FC>
          ) : (
            <FC title="The Event">
              <div className="grid gap-3">
                <Field label="📅 Date & time"><Input value={b.eventDateTime} onChange={(e) => set({ eventDateTime: e.target.value })} placeholder="June 18, 2026, 7:00 pm – 10:00 pm" /></Field>
                <Field label="📍 Location"><Input value={b.eventLocation} onChange={(e) => set({ eventLocation: e.target.value })} placeholder="123 Main St, Manhattan" /></Field>
                <Field label="🎤 Event title"><Input value={b.eventTitle} onChange={(e) => set({ eventTitle: e.target.value })} placeholder="BRAND LAUNCH MIXER" /></Field>
                <Field label="About the event"><Textarea rows={3} value={b.eventDesc} onChange={(e) => set({ eventDesc: e.target.value })} /></Field>
              </div>
            </FC>
          )}

          <FC title="What We're Asking For" hint="Pick a template to autofill">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {DELIVERABLE_TEMPLATES.map((t) => (
                <button key={t.name} onClick={() => applyTemplate(t.name)} className="rounded-full bg-sky/50 px-3 py-1 text-xs font-semibold text-dusty-deep transition hover:bg-sky">{t.name}</button>
              ))}
            </div>
            <Field label="Main deliverable"><Textarea rows={6} value={b.mainDeliverable} onChange={(e) => set({ mainDeliverable: e.target.value })} placeholder="Pick a template above, or write your own…" /></Field>
            <div className="mt-3"><Field label="Story deliverable"><Textarea rows={4} value={b.storyDeliverable} onChange={(e) => set({ storyDeliverable: e.target.value })} /></Field></div>
          </FC>

          <FC title="Tags & Hashtags">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Instagram"><Input value={b.igHandle} onChange={(e) => set({ igHandle: e.target.value })} /></Field>
              <Field label="TikTok"><Input value={b.ttHandle} onChange={(e) => set({ ttHandle: e.target.value })} /></Field>
              <Field label="YouTube"><Input value={b.ytHandle} onChange={(e) => set({ ytHandle: e.target.value })} /></Field>
              <Field label="Required hashtag"><Input value={b.requiredHashtag} onChange={(e) => set({ requiredHashtag: e.target.value })} /></Field>
            </div>
            <div className="mt-3"><Field label="Theme tags" hint="Click to add · type to create">
              <TagPicker value={b.tags} onChange={(next) => { set({ tags: next }); rememberTags(next); }} suggestions={pool} />
            </Field></div>
          </FC>

          <FC title="Timeline" hint="Auto-generates the timeline">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Filming date"><Input type="date" value={b.filmingDate} onChange={(e) => set({ filmingDate: e.target.value })} /></Field>
              <Chooser label="Drafts" value={b.drafts} onChange={(n) => set({ drafts: n })} />
              <Chooser label="Revision rounds" value={b.revisions} onChange={(n) => set({ revisions: n })} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Days: filming → first draft"><Input type="number" min={0} value={String(b.daysToFirstDraft ?? 4)} onChange={(e) => set({ daysToFirstDraft: Math.max(0, parseInt(e.target.value || "0", 10)) })} /></Field>
              <Field label="Days between each step after"><Input type="number" min={0} value={String(b.daysBetween ?? 3)} onChange={(e) => set({ daysBetween: Math.max(0, parseInt(e.target.value || "0", 10)) })} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">The visual timeline on the brief updates automatically.</p>
          </FC>

          <FC title="Tone & Look">
            <Textarea rows={4} value={b.tone} onChange={(e) => set({ tone: e.target.value })} placeholder="Vertical, natural light, immersive sound, 'come with me' energy…" />
            <div className="mt-3">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addImages(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dusty-soft/70 py-4 text-sm font-semibold text-dusty-deep transition hover:bg-sky/30"><Icons.ImagePlus size={16} /> Add moodboard images</button>
              {b.moodboard.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {b.moodboard.map((src, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => set({ moodboard: b.moodboard.filter((_, j) => j !== i) })} className="absolute right-1 top-1 hidden rounded-full bg-white/90 p-0.5 text-bubblegum group-hover:block"><Icons.X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FC>

          <FC title="A Few Things to Avoid" hint="Pre-filled"><Textarea rows={5} value={b.avoid} onChange={(e) => set({ avoid: e.target.value })} /></FC>
          <FC title="Usage Rights"><Textarea rows={6} value={b.usage} onChange={(e) => set({ usage: e.target.value })} /></FC>
          <FC title="Reporting"><Textarea rows={3} value={b.reporting} onChange={(e) => set({ reporting: e.target.value })} /></FC>
          <FC title="Revisions"><Textarea rows={4} value={b.revisionsText} onChange={(e) => set({ revisionsText: e.target.value })} /></FC>
        </div>

        {/* ================= SHEET ================= */}
        <div className="lg:sticky lg:top-4 lg:self-start print:static">
          <BriefSheet b={b} timeline={timeline} />
        </div>
      </div>

      {/* per-page print footer (fixed repeats on each printed page) */}
      <div className="print-footer pointer-events-none fixed inset-x-0 bottom-0 hidden" style={{ display: "none" }}>
        <div style={{ textAlign: "center", fontSize: 9, letterSpacing: "0.14em", color: P.faint, fontFamily: SERIF, padding: "8px 0" }}>
          <span style={{ color: P.brass }}>✦</span>&nbsp; CREATOR BRIEF · {(b.title || "NOX & CO").toUpperCase()} &nbsp;<span style={{ color: P.brass }}>✦</span>
          {b.link ? <span style={{ marginLeft: 10, fontSize: 8, letterSpacing: "0.06em" }}>{b.link.replace(/^https?:\/\//, "")}</span> : null}
        </div>
      </div>
    </div>
  );
}

/* ================= the printable sheet ================= */
function BriefSheet({ b, timeline }: { b: Brief; timeline: Step[] }) {
  const hasAsk = b.mainDeliverable.trim() || b.storyDeliverable.trim();
  return (
    <div id="brief-sheet" className="overflow-hidden rounded-[28px] shadow-float" style={{ background: P.paper, color: P.body, fontFamily: SERIF }}>
      {/* cover */}
      <div className="relative px-10 pt-11 pb-9" style={{ background: "linear-gradient(160deg,#F3EEE2 0%,#EFE9F3 55%,#E7EEF3 100%)" }}>
        <Compass />
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase" style={{ letterSpacing: "0.34em", color: P.brass, fontFamily: SERIF }}>
          <span>✦</span> Creator Brief
        </div>
        <h1 className="mt-3 max-w-[85%] leading-[1.04]" style={{ fontFamily: "var(--font-display)", fontSize: 40, color: P.ink }}>{b.title || "Your Brief Title"}</h1>
        {b.dateline && <p className="mt-2 text-sm" style={{ color: "#6E6780", fontStyle: "italic" }}>{b.dateline}</p>}
        <Rule />
      </div>

      <div className="px-10 py-9">
        <Sec n="I" title="Why We're Reaching Out"><Prose t={b.why} /></Sec>

        {b.mode === "event" ? (
          <Sec n="II" title="The Event">
            <div className="rounded-2xl px-5 py-4" style={{ background: "#F4EFE1", border: `1px solid ${P.rule}` }}>
              {b.eventDateTime && <p className="text-sm" style={{ color: P.ink }}>📅 &nbsp;{b.eventDateTime}</p>}
              {b.eventLocation && <p className="mt-1.5 text-sm" style={{ color: P.ink }}>📍 &nbsp;{b.eventLocation}</p>}
              {b.eventTitle && <p className="mt-3 tracking-wide" style={{ fontFamily: "var(--font-display)", fontSize: 22, color: P.ink }}>🎤 &nbsp;{b.eventTitle}</p>}
            </div>
            {b.eventDesc && <div className="mt-3"><Prose t={b.eventDesc} /></div>}
          </Sec>
        ) : (
          <Sec n="II" title="The Concept">
            <Prose t={b.concept} />
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {b.filming && <Chip>🗓 {b.filming}</Chip>}
              {b.location && <Chip>📍 {b.location}</Chip>}
              {b.format && <Chip>🎥 {b.format}</Chip>}
            </div>
          </Sec>
        )}

        {hasAsk && (
          <Sec n="III" title="What We're Asking For">
            {b.mainDeliverable.trim() && (
              <div className="mb-4 rounded-2xl px-5 py-4" style={{ background: "#fff", border: `1px solid ${P.rule}` }}>
                <div className="mb-1.5 text-[11px] font-bold uppercase" style={{ letterSpacing: "0.16em", color: P.bloom }}>Main deliverable</div>
                <Prose t={b.mainDeliverable} />
              </div>
            )}
            {b.storyDeliverable.trim() && (
              <div className="rounded-2xl px-5 py-4" style={{ background: "#fff", border: `1px solid ${P.rule}` }}>
                <div className="mb-1.5 text-[11px] font-bold uppercase" style={{ letterSpacing: "0.16em", color: P.blush }}>Story deliverable</div>
                <Prose t={b.storyDeliverable} />
              </div>
            )}
          </Sec>
        )}

        <Sec n="IV" title="Tags & Hashtags">
          <div className="grid gap-1.5 text-sm">
            {b.igHandle && <p><b style={{ color: P.ink }}>Instagram</b> &nbsp;{b.igHandle}</p>}
            {b.ttHandle && <p><b style={{ color: P.ink }}>TikTok</b> &nbsp;{b.ttHandle}</p>}
            {b.ytHandle && <p><b style={{ color: P.ink }}>YouTube</b> &nbsp;{b.ytHandle}</p>}
            {b.requiredHashtag && <p><b style={{ color: P.ink }}>Required</b> &nbsp;{b.requiredHashtag}</p>}
          </div>
          {b.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {b.tags.map((t) => <span key={t} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "#EEE7F3", color: "#6A5E7C" }}>#{t.replace(/\s+/g, "")}</span>)}
            </div>
          )}
          <p className="mt-3 text-xs" style={{ color: P.faint }}>Required disclosure: #ad or #sponsored (FTC requirement — non-negotiable).</p>
        </Sec>

        <Sec n="V" title="Timeline">
          <Timeline steps={timeline} />
        </Sec>

        <Sec n="VI" title="Tone & Look">
          <Prose t={b.tone} />
          {b.moodboard.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {b.moodboard.map((src, i) => <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" style={{ border: `1px solid ${P.rule}` }} />)}
            </div>
          )}
        </Sec>

        <Sec n="VII" title="A Few Things to Avoid"><Prose t={b.avoid} list /></Sec>
        <Sec n="VIII" title="Usage Rights"><Prose t={b.usage} /></Sec>
        <Sec n="IX" title="Reporting"><Prose t={b.reporting} /></Sec>
        <Sec n="X" title="Revisions"><Prose t={b.revisionsText} /></Sec>

        <div className="mt-7 rounded-2xl px-5 py-4 text-xs" style={{ background: "#F1ECF3", color: "#6B6079", fontStyle: "italic" }}>
          <span style={{ color: P.brass, fontStyle: "normal", fontWeight: 700 }}>✦ A Note on This Brief — </span>{NOTE_TEXT}
        </div>
        <div className="mt-6 text-center text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: P.faint }}>
          {b.link ? b.link.replace(/^https?:\/\//, "") : "noxandco.com"}
        </div>
      </div>
    </div>
  );
}

/* ================= visual timeline ================= */
function Timeline({ steps }: { steps: Step[] }) {
  const icon = (k: Step["icon"]) => k === "seed" ? <Icons.Sprout size={13} /> : k === "trail" ? <Icons.Route size={13} /> : k === "flag" ? <Icons.Flag size={13} /> : <Icons.Star size={13} />;
  return (
    <div className="relative pl-1">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
            {!last && <span className="absolute left-[15px] top-7 bottom-0 border-l-2 border-dashed" style={{ borderColor: "#D9CFBB" }} />}
            <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ background: last ? P.brass : i === 0 ? P.bloom : P.ink }}>{icon(s.icon)}</span>
            <div className="flex-1 rounded-2xl px-4 py-2.5" style={{ background: "#fff", border: `1px solid ${P.rule}` }}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold" style={{ color: P.ink }}>{s.label}</span>
                <span className="text-xs font-semibold" style={{ color: P.brass }}>{s.date ? niceDate(s.date) : s.offset === 0 ? "day of" : `+${s.offset} days`}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================= small pieces ================= */
function FC({ title, hint, children }: { title?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/70 p-4">
      {title && <div className="mb-2 flex items-baseline justify-between"><h3 className="font-display text-base text-ink">{title}</h3>{hint && <span className="text-[11px] text-ink-faint">{hint}</span>}</div>}
      {children}
    </div>
  );
}
function Chooser({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-ink-soft">{label}</span>
      <div className="inline-flex rounded-full bg-sky/40 p-1">
        {[1, 2, 3].map((n) => (
          <button key={n} onClick={() => onChange(n)} className={`h-8 w-8 rounded-full text-sm font-bold transition ${value === n ? "bg-white text-dusty-deep shadow-pill" : "text-ink-soft"}`}>{n}</button>
        ))}
      </div>
    </div>
  );
}
function Sec({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 last:mb-0">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: P.ink, fontFamily: "var(--font-display)" }}>{n}</span>
        <h2 className="text-[13px] font-bold uppercase" style={{ letterSpacing: "0.22em", color: P.ink, fontFamily: SERIF }}>{title}</h2>
        <span className="h-px flex-1" style={{ background: P.rule }} />
      </div>
      <div className="pl-10 text-[13.5px] leading-relaxed" style={{ color: P.body }}>{children}</div>
    </section>
  );
}
function Rule() {
  return <div className="mt-5 flex items-center gap-3" style={{ color: P.brass }}><span className="h-px flex-1" style={{ background: "#D9CFBB" }} /><span className="text-xs">✦ · ✦</span><span className="h-px flex-1" style={{ background: "#D9CFBB" }} /></div>;
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full px-3 py-1" style={{ background: "#EFE9DA", color: "#6E6455" }}>{children}</span>;
}
function Prose({ t, list }: { t: string; list?: boolean }) {
  if (!t?.trim()) return <span style={{ color: "#BDB6C6" }}>—</span>;
  const lines = t.split("\n").filter((l) => l.trim() !== "");
  if (list) return <ul className="space-y-1.5">{lines.map((l, i) => <li key={i} className="flex gap-2"><span style={{ color: P.brass }}>✦</span><span>{l.replace(/^[•\-\s]+/, "")}</span></li>)}</ul>;
  return <>{lines.map((l, i) => {
    if (l.trim().startsWith("•")) return <p key={i} className="mb-1 flex gap-2 pl-1"><span style={{ color: P.bloom }}>◆</span><span>{l.replace(/^[•\s]+/, "")}</span></p>;
    return <p key={i} className="mb-2 last:mb-0">{l}</p>;
  })}</>;
}
function Compass() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="absolute right-8 top-8 opacity-70" aria-hidden>
      <circle cx="36" cy="36" r="30" fill="none" stroke="#C9B78C" strokeWidth="1.4" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="36" cy="20" rx="6.5" ry="10" fill="#B98F42" opacity="0.55" transform={`rotate(${deg} 36 36)`} />
      ))}
      <circle cx="36" cy="36" r="6" fill="#5E9C90" opacity="0.85" />
      <circle cx="36" cy="36" r="2.2" fill="#2B3149" />
    </svg>
  );
}

function plainText(b: Brief, steps: Step[]): string {
  const L: string[] = ["CREATOR BRIEF", b.title, b.dateline, b.link, ""];
  L.push("WHY WE'RE REACHING OUT", b.why, "");
  if (b.mode === "event") L.push("THE EVENT", b.eventDateTime, b.eventLocation, b.eventTitle, b.eventDesc, "");
  else L.push("THE CONCEPT", b.concept, `Filming: ${b.filming}`, `Location: ${b.location}`, `Format: ${b.format}`, "");
  L.push("WHAT WE'RE ASKING FOR", "Main deliverable:", b.mainDeliverable, "", "Story deliverable:", b.storyDeliverable, "");
  L.push("TAGS & HASHTAGS", `Instagram ${b.igHandle}`, `TikTok ${b.ttHandle}`, `YouTube ${b.ytHandle}`, `Required ${b.requiredHashtag}`, b.tags.map((t) => "#" + t.replace(/\s+/g, "")).join(" "), "");
  L.push("TIMELINE", ...steps.map((s) => `${s.label} — ${s.date ? niceDate(s.date) : s.offset === 0 ? "day of" : "+" + s.offset + " days"}`), "");
  L.push("TONE & LOOK", b.tone, "");
  L.push("A FEW THINGS TO AVOID", b.avoid, "");
  L.push("USAGE RIGHTS", b.usage, "");
  L.push("REPORTING", b.reporting, "");
  L.push("REVISIONS", b.revisionsText, "");
  L.push("A NOTE ON THIS BRIEF", NOTE_TEXT);
  return L.filter((x) => x !== undefined).join("\n");
}
