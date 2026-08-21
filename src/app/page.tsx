"use client";

import Link from "next/link";
import { ArrowRight, Target, Wand2, Megaphone, Star, Flame } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

const PILLARS = [
  { icon: Target, title: "Strategy", copy: "Sharp positioning and a plan built around what actually moves your audience, not a template." },
  { icon: Wand2, title: "Creative", copy: "Concepts and content direction with a point of view, built to stop the scroll and hold attention." },
  { icon: Megaphone, title: "PR & Influencer", copy: "Press outreach and media relationships, paired with the creator voices who carry your story into the feed." },
  { icon: Star, title: "Creators", copy: "Voices vetted against your brand, not just their follower count. Fit first, reach second." },
  { icon: Flame, title: "Culture", copy: "We understand the communities that move first, the passionate, tightly-knit audiences whose word decides what breaks out next, and we speak to them like insiders, not tourists." },
];

const STEPS = [
  { n: "01", title: "Sighted", copy: "We sit down with your founder or team to learn who you really are: your story, your voice, what you actually stand for." },
  { n: "02", title: "Aligned", copy: "We build the plan: your PR and influencer angle, plus a marketing strategy mapped to one timeline." },
  { n: "03", title: "In Motion", copy: "Press, content, and creator campaigns run at once, nothing waits on a stalled email thread." },
  { n: "04", title: "Shining", copy: "Results land in one place: reach, coverage, and what to do next." },
];

const STATS = [
  { value: "180+", label: "Campaigns launched" },
  { value: "3.4x", label: "Average EMV return" },
  { value: "97%", label: "Contracts on time" },
];

const ORBIT_WORDS = ["Strategy", "Creative", "PR & Influencer", "Creators", "Culture"];

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero — quiet, spacious, typography-led */}
      <section className="relative mx-auto max-w-3xl px-5 pb-20 pt-28 text-center sm:px-8 sm:pb-28 sm:pt-36">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/40">
          Brand marketing
        </p>
        <h1 className="mt-7 font-display text-4xl font-medium leading-[1.15] text-white sm:text-6xl">
          Nox &amp; Co gives brands gravity.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
          We bring strategy, creative, PR &amp; influencer, creators, and
          culture into one orbit, creating momentum that commands attention
          and leaves a lasting mark.
        </p>
        <p className="mx-auto mt-5 max-w-xl font-display text-base italic text-white/35">
          No more star-crossed campaigns.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="group flex items-center gap-1.5 border-b border-white/70 pb-1 text-sm font-medium text-white transition hover:border-white hover:text-lavender"
          >
            Start a Project
            <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
          </Link>
          <span className="hidden text-white/20 sm:inline">·</span>
          <Link
            href="/services"
            className="border-b border-transparent pb-1 text-sm font-medium text-white/55 transition hover:border-white/40 hover:text-white"
          >
            See what we do
          </Link>
        </div>

        {/* quiet stat line, no card */}
        <Reveal className="mx-auto mt-20 flex max-w-md items-center justify-center gap-6 text-center sm:gap-10">
          {STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6 sm:gap-10">
              {i > 0 && <span className="h-8 w-px bg-white/10" />}
              <div>
                <div className="font-display text-xl text-white/80 sm:text-2xl">{s.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-white/35 sm:text-[11px]">{s.label}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Signature strip — quiet, static, editorial */}
      <Reveal>
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-y border-white/10 py-6">
            {ORBIT_WORDS.map((w, i) => (
              <span key={w} className="flex items-center gap-5">
                {i > 0 && <span className="text-white/20">✦</span>}
                <span className="font-display text-sm uppercase tracking-[0.22em] text-white/45">{w}</span>
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/40">What we do</p>
          <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-4xl">
            Five forces, one orbit.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70">
                <s.icon size={16} strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-display text-lg text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{s.copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/40">How it works</p>
            <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-4xl">Four stages, one story.</h2>
          </Reveal>
          <div className="mt-16 grid gap-10 sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="font-display text-sm text-white/25">{s.n}</div>
                <h3 className="mt-2 font-display text-lg text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{s.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <Reveal>
        <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">Ready to give your brand gravity?</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">
            Tell us about your brand and we&apos;ll chart a plan. No lengthy
            onboarding, no wasted spend.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="border-b border-white/70 pb-1 text-sm font-medium text-white transition hover:border-white hover:text-lavender"
            >
              Get in touch
            </Link>
            <span className="hidden text-white/20 sm:inline">·</span>
            <Link href="/app" className="text-sm font-medium text-white/50 hover:text-white">
              Already a client? Sign in
            </Link>
          </div>
        </section>
      </Reveal>
    </MarketingShell>
  );
}
