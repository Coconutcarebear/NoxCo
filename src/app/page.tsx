"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Target, Wand2, Rocket, Star, Flame } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const PILLARS = [
  { icon: Target, title: "Strategy", copy: "Sharp positioning and a plan built around what actually moves your audience — not a template." },
  { icon: Wand2, title: "Creative", copy: "Concepts and content direction with a point of view, built to stop the scroll and hold attention." },
  { icon: Rocket, title: "Campaigns", copy: "Every moving part — outreach, contracts, timelines, budget — run from one system, end to end." },
  { icon: Star, title: "Creators", copy: "Voices vetted against your brand, not just their follower count. Fit first, reach second." },
  { icon: Flame, title: "Culture", copy: "Work that reads the room — tied to what's actually happening, not six months behind it." },
];

const STEPS = [
  { n: "01", title: "Sighted", copy: "We find where your brand fits in the culture — and who can carry it." },
  { n: "02", title: "Aligned", copy: "Strategy, creative, and creators, locked to one plan and one timeline." },
  { n: "03", title: "In Motion", copy: "Campaigns run, content ships, nothing waits on a stalled email thread." },
  { n: "04", title: "Shining", copy: "Results land in one place — reach, ROI, and what to do next." },
];

const STATS = [
  { value: "180+", label: "Campaigns launched" },
  { value: "3.4x", label: "Average EMV return" },
  { value: "97%", label: "Contracts on time" },
];

const ORBIT_WORDS = ["Strategy", "Creative", "Campaigns", "Creators", "Culture"];

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-lavender">
            <Sparkles size={13} /> Brand marketing, in full orbit
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.1] text-white sm:text-6xl">
            Nox &amp; Co gives brands gravity.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/65 sm:text-lg">
            We bring strategy, creative, campaigns, creators, and culture
            into one orbit — creating momentum that commands attention and
            leaves a lasting mark.
          </p>
          <p className="mx-auto mt-4 max-w-xl font-display text-base italic text-white/40 sm:text-lg">
            No more star-crossed campaigns.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender px-6 py-3 text-sm font-semibold text-navy-deep shadow-[0_12px_40px_-14px_rgba(199,201,209,0.5)] transition hover:brightness-105"
            >
              Start a Project
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/5"
            >
              See what we do
            </Link>
          </div>
        </div>

        {/* stats strip */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-6 backdrop-blur-sm sm:mt-20 sm:px-8 sm:py-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl text-white sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-[11px] text-white/50 sm:text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive orbit reveal — move your cursor across it */}
      <OrbitReveal />

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">What we do</p>
          <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
            Five forces, one orbit.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((s) => (
            <div key={s.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:bg-white/[0.08]">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-dusty to-lavender text-navy-deep">
                <s.icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-xl text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-lavender hover:text-white">
            See the full picture <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">How it works</p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">Four stages, no surprises.</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="font-display text-3xl text-white/25">{s.n}</div>
                <h3 className="mt-2 font-display text-lg text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141416] to-[#000000] px-6 py-12 text-center sm:px-16 sm:py-16">
          <h2 className="font-display text-3xl text-white sm:text-4xl">Ready to give your brand gravity?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/60 sm:text-base">
            Tell us about your brand and we&apos;ll chart a plan — no lengthy
            onboarding, no wasted spend.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-full bg-gradient-to-r from-dusty to-lavender px-6 py-3 text-sm font-semibold text-navy-deep transition hover:brightness-105"
            >
              Get in touch
            </Link>
            <Link href="/app" className="text-sm font-semibold text-white/70 hover:text-white">
              Already a client? Sign in →
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

// A dark brushed-metal strip — the five words sit dim until your cursor
// passes over them, like a flashlight crossing engraved silver.
function OrbitReveal() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);

  return (
    <section
      className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 sm:mx-8 lg:mx-auto"
      style={{ background: "linear-gradient(150deg,#0a0a0c,#000000)" }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        setActive(true);
      }}
      onMouseLeave={() => setActive(false)}
    >
      {/* base dim layer */}
      <div className="relative flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-8 py-16 sm:py-20">
        {ORBIT_WORDS.map((w) => (
          <span key={w} className="font-display text-2xl text-white/15 sm:text-4xl">
            {w}
          </span>
        ))}
      </div>
      {/* bright layer, revealed only under the cursor via a moving mask */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-8 py-16 transition-opacity duration-300 sm:py-20"
        style={{
          opacity: active ? 1 : 0,
          WebkitMaskImage: `radial-gradient(220px 220px at ${pos.x}% ${pos.y}%, black 0%, transparent 70%)`,
          maskImage: `radial-gradient(220px 220px at ${pos.x}% ${pos.y}%, black 0%, transparent 70%)`,
        }}
      >
        {ORBIT_WORDS.map((w) => (
          <span
            key={w}
            className="font-display text-2xl sm:text-4xl"
            style={{
              backgroundImage: "linear-gradient(100deg,#9a9ca6,#ffffff,#c9a15a,#ffffff,#9a9ca6)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </section>
  );
}
