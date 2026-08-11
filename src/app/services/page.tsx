import Link from "next/link";
import {
  ArrowRight, Compass, Disc, Lock, Sparkles, Images, Telescope, CloudMoon,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";

const SERVICES = [
  {
    icon: Compass,
    title: "Creator Sourcing & Vetting",
    copy: "We scout and screen creators against your category, audience, and budget — so every name on the list is already a fit, not a gamble.",
  },
  {
    icon: Disc,
    title: "Campaign Management",
    copy: "One team runs outreach, negotiation, scheduling, and follow-up for every creator on a campaign, so nothing sits waiting on an email.",
  },
  {
    icon: Lock,
    title: "Contracts & Compliance",
    copy: "Agreements, W-9s, and usage rights are tracked start to finish, with clear status on what's signed and what's still outstanding.",
  },
  {
    icon: Sparkles,
    title: "Invoicing & Payments",
    copy: "Creator fees and boost spend are logged against budget in real time, so you always know what's committed and what's left.",
  },
  {
    icon: Images,
    title: "Content Review & Approval",
    copy: "Drafts route through one shared queue for approval before anything goes live — no more chasing screenshots over email.",
  },
  {
    icon: Telescope,
    title: "Performance Reporting",
    copy: "Reach, engagement, and earned media value are pulled into clear reports mapped back to spend, campaign by campaign.",
  },
];

const PROCESS = [
  { step: "Discovery", copy: "We learn your brand, audience, and goals for the campaign." },
  { step: "Sourcing", copy: "We build a shortlist of creators who genuinely fit." },
  { step: "Launch", copy: "Contracts, briefs, and content move through one shared timeline." },
  { step: "Report", copy: "You get clean performance data, not a pile of screenshots." },
];

export default function ServicesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-5 pb-14 pt-16 text-center sm:px-8 sm:pb-16 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">Services</p>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] text-white sm:text-5xl">
          Full-service brand marketing.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          From the first creator search to the final report, Nox &amp; Co
          handles the parts of a campaign that usually fall through the
          cracks.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:bg-white/[0.08]">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-dusty to-lavender text-navy-deep">
                <s.icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">Process</p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">How a campaign moves.</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-4">
            {PROCESS.map((p, i) => (
              <div key={p.step} className="relative">
                <div className="font-display text-3xl text-white/25">0{i + 1}</div>
                <h3 className="mt-2 font-display text-lg text-white">{p.step}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{p.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#141416] to-[#000000] px-6 py-12 text-center sm:px-16 sm:py-16">
          <CloudMoon size={28} className="text-lavender" />
          <h2 className="font-display text-3xl text-white sm:text-4xl">Not sure where to start?</h2>
          <p className="mx-auto max-w-md text-sm text-white/60 sm:text-base">
            Tell us what you&apos;re working on and we&apos;ll recommend a plan
            that fits your budget and timeline.
          </p>
          <Link
            href="/contact"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender px-6 py-3 text-sm font-semibold text-navy-deep transition hover:brightness-105"
          >
            Talk to us <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
