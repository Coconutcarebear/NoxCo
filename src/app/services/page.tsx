import Link from "next/link";
import {
  ArrowRight, Compass, Disc, Lock, Telescope,
  Target, Wand2, Megaphone, TrendingUp, Share2, Newspaper,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

const SERVICES = [
  {
    icon: Target,
    title: "Brand Strategy",
    copy: "Positioning, messaging, and a plan grounded in where your category is actually moving, not where it was last year.",
  },
  {
    icon: Newspaper,
    title: "Public Relations & Press",
    copy: "Media relationships and press outreach that put your brand in front of the outlets and communities that matter, not a wire blast into the void.",
  },
  {
    icon: Wand2,
    title: "Creative & Content",
    copy: "Concepts, shoots, and edits with a point of view, built to hold attention in a feed that doesn't wait for anyone.",
  },
  {
    icon: Compass,
    title: "Creator Partnerships",
    copy: "We scout and screen creators against your category, audience, and budget, so every name on the list is already a fit.",
  },
  {
    icon: Disc,
    title: "Campaign Management",
    copy: "One team runs outreach, negotiation, scheduling, and follow-up, so nothing sits waiting on an email.",
  },
  {
    icon: Megaphone,
    title: "Paid Social & In-Feed Ads",
    copy: "Media planning and buying across paid social and in-feed placements, built to amplify what's already working.",
  },
  {
    icon: TrendingUp,
    title: "SEO & Organic Growth",
    copy: "Technical fixes, content strategy, and link building aimed at compounding organic reach, not a one-month spike.",
  },
  {
    icon: Share2,
    title: "Social Media Management",
    copy: "Editorial calendars, community management, and day-to-day posting, handled so your channels never go quiet.",
  },
  {
    icon: Lock,
    title: "Contracts & Compliance",
    copy: "Agreements, W-9s, and usage rights are tracked start to finish, with clear status on what's signed and outstanding.",
  },
  {
    icon: Telescope,
    title: "Performance Reporting",
    copy: "Reach, engagement, and earned media value pulled into clear reports mapped back to spend, campaign by campaign.",
  },
];

const PROCESS = [
  { step: "Discovery", copy: "We meet your founder or team and learn your brand: story, audience, and goals." },
  { step: "Strategy", copy: "We build the plan: your PR and influencer angle, plus a shortlist of creators who fit." },
  { step: "Launch", copy: "Contracts, briefs, press, and content all move through one shared timeline." },
  { step: "Report", copy: "You get clean performance data, reach and coverage, not a pile of screenshots." },
];

export default function ServicesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-2xl px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-36">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/40">Services</p>
        <h1 className="mt-7 font-display text-4xl font-medium leading-[1.15] text-white sm:text-5xl">
          Full-service brand marketing.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
          From the first conversation with your founder to the final report,
          Nox &amp; Co runs the PR &amp; influencer, creative, and campaign side
          of your brand from one system.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="divide-y divide-white/10 border-t border-white/10">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <div className="flex flex-col gap-3 py-8 sm:flex-row sm:items-start sm:gap-8">
                <div className="flex shrink-0 items-center gap-3 sm:w-48">
                  <span className="font-display text-sm text-white/25">{String(i + 1).padStart(2, "0")}</span>
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70">
                    <s.icon size={15} strokeWidth={1.5} />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">{s.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/50">{s.copy}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

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
