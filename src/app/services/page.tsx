import Link from "next/link";
import {
  ArrowRight, Newspaper, Compass, Share2, Megaphone,
  TrendingUp, Wand2, Users, Radar, LayoutTemplate,
  ChartNoAxesCombined, Zap,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

const FOUNDATION = ["Brand story", "Messaging", "Positioning", "Strategy"];

const CHANNELS = [
  {
    icon: Newspaper,
    title: "PR + Media Outreach",
    copy: "Press outreach and media relationships that put your brand in front of the outlets and communities that matter, not a wire blast into the void.",
  },
  {
    icon: Compass,
    title: "Influencer + Creator Partnerships",
    copy: "We scout and screen creators against your category, audience, and budget, so every name on the list is already a fit.",
  },
  {
    icon: Share2,
    title: "Social Media",
    copy: "Editorial calendars, community management, and day-to-day posting, handled so your channels never go quiet.",
  },
  {
    icon: Megaphone,
    title: "Paid & Digital Advertising",
    copy: "Media planning and buying across paid social, in-feed, and digital placements, built to amplify what's already working.",
  },
  {
    icon: TrendingUp,
    title: "SEO",
    copy: "Technical fixes, content strategy, and link building aimed at compounding organic reach, not a one-month spike.",
  },
  {
    icon: Wand2,
    title: "Creative + Digital Assets",
    copy: "Concepts, shoots, and edits with a point of view, built to hold attention in a feed that doesn't wait for anyone.",
  },
];

const PROCESS = [
  { step: "Discovery", copy: "We meet your founder or team and learn your brand: story, audience, and goals." },
  { step: "Strategy", copy: "We build the plan: your PR and influencer angle, plus a shortlist of creators who fit." },
  { step: "Launch", copy: "Contracts, briefs, press, and content all move through one shared timeline." },
  { step: "Report", copy: "You get clean performance data, reach and coverage, not a pile of screenshots." },
];

const PLATFORM_FEATURES = [
  { icon: Users, copy: "Manage creator relationships" },
  { icon: Radar, copy: "Run social campaigns" },
  { icon: LayoutTemplate, copy: "Connect creator content to your in-feed" },
  { icon: Zap, copy: "Amplify content through Spark Ads" },
  { icon: ChartNoAxesCombined, copy: "Track campaign performance" },
];

export default function ServicesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-2xl px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-36">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/40">Services</p>
        <h1 className="mt-7 font-display text-4xl font-medium leading-[1.15] text-white sm:text-5xl">
          Foundation first. Channels second.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
          We&apos;re a boutique PR and influencer agency built to make modern
          marketing make sense. We start with the foundation, then connect
          it to the channels that actually move your brand.
        </p>
      </section>

      {/* Foundation — quiet word row */}
      <Reveal>
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-y border-white/10 py-6">
            {FOUNDATION.map((w, i) => (
              <span key={w} className="flex items-center gap-5">
                {i > 0 && <span className="text-white/20">✦</span>}
                <span className="font-display text-sm uppercase tracking-[0.22em] text-white/45">{w}</span>
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Channels */}
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/40">The channels</p>
          <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-4xl">
            One strategy. Multiple channels.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">
            No disconnected campaigns, every channel below ties back to the same foundation.
          </p>
        </Reveal>
        <div className="mt-14 divide-y divide-white/10 border-t border-white/10">
          {CHANNELS.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <div className="flex flex-col gap-3 py-8 sm:flex-row sm:items-start sm:gap-8">
                <div className="flex shrink-0 items-center gap-3 sm:w-56">
                  <span className="font-display text-sm text-white/25">{String(i + 1).padStart(2, "0")}</span>
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70">
                    <s.icon size={15} strokeWidth={1.5} />
                  </div>
                  <span className="font-display text-lg text-white">{s.title}</span>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-white/50 sm:pt-0.5">{s.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={CHANNELS.length * 60}>
          <p className="mt-8 text-center text-sm leading-relaxed text-white/40">
            Campaign management, contracts, and reporting run underneath all of it, so nothing falls through the cracks.
          </p>
        </Reveal>
      </section>

      {/* Process */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/40">Process</p>
            <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-4xl">How a campaign moves.</h2>
          </Reveal>
          <div className="mt-14 grid gap-10 sm:grid-cols-4">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 90}>
                <div className="font-display text-sm text-white/25">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-2 font-display text-lg text-white">{p.step}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{p.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Your brand. Your creators. Your platform. */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 sm:grid-cols-5">
            <Reveal className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/40">The platform</p>
              <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-4xl">
                Your brand. Your creators. Your platform.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/55">
                Want to run it yourself? We can give you access to the same
                creator platform we run campaigns on.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/40">
                Need us to run it? We can. Want to run it yourself? We can give you the tools.
              </p>
            </Reveal>
            <Reveal delay={120} className="border-t border-white/10 pt-6 sm:col-span-3 sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0">
              <ul className="space-y-4">
                {PLATFORM_FEATURES.map((f) => (
                  <li key={f.copy} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-white/70">
                      <f.icon size={14} strokeWidth={1.5} />
                    </span>
                    <span className="text-sm text-white/70">{f.copy}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">Not sure where to start?</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">
            Tell us what you&apos;re working on and we&apos;ll recommend a plan that fits your budget and timeline.
          </p>
          <div className="mt-9">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-1.5 border-b border-white/70 pb-1 text-sm font-medium text-white transition hover:border-white hover:text-lavender"
            >
              Talk to us <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </Reveal>
    </MarketingShell>
  );
}
