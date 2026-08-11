import Link from "next/link";
import { ArrowRight, Sparkles, Compass, Disc, Telescope } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const SERVICES = [
  { icon: Compass, title: "Creator Sourcing", copy: "We chart the sky for the right voices — vetted against your audience, category, and budget before a single message goes out." },
  { icon: Disc, title: "Campaign Management", copy: "From first outreach to final invoice, one team keeps every creator, contract, and deliverable moving in sync." },
  { icon: Telescope, title: "Reporting & ROI", copy: "Real performance data, not vibes. Reach, engagement, and earned media value, mapped back to spend." },
];

const STEPS = [
  { n: "01", title: "Sighted", copy: "We scout creators who actually fit your brand — not just whoever's trending." },
  { n: "02", title: "Aligned", copy: "Outreach, negotiation, and contracts, handled so nothing falls through." },
  { n: "03", title: "In Motion", copy: "Content gets briefed, shot, and approved on a timeline you can see." },
  { n: "04", title: "Shining", copy: "Live results and clean reporting land in your inbox, not lost in a spreadsheet." },
];

const STATS = [
  { value: "180+", label: "Campaigns launched" },
  { value: "3.4x", label: "Average EMV return" },
  { value: "97%", label: "Contracts on time" },
];

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-lavender">
            <Sparkles size={13} /> Influencer &amp; campaign management
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.1] text-white sm:text-6xl">
            No more star-crossed campaigns.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/65 sm:text-lg">
            Nox &amp; Co pairs your brand with the right creators and runs the
            whole campaign in between — sourcing, contracts, content, and
            reporting, all under one sky.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender px-6 py-3 text-sm font-semibold text-navy-deep shadow-[0_12px_40px_-14px_rgba(169,156,231,0.7)] transition hover:brightness-105"
            >
              Start a Campaign
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

      {/* Services teaser */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">What we do</p>
          <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
            Everything a campaign needs, in one orbit.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {SERVICES.map((s) => (
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
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#262268] to-[#1b1a4a] px-6 py-12 text-center sm:px-16 sm:py-16">
          <h2 className="font-display text-3xl text-white sm:text-4xl">Ready to align your next campaign?</h2>
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
