import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Zap, Users } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

const VALUES = [
  { icon: Heart, title: "Right fit over reach", copy: "A smaller creator with the right audience beats a big number that doesn't convert. We match on fit first." },
  { icon: ShieldCheck, title: "No dropped threads", copy: "Contracts, deliverables, and payments are tracked in one place, nothing falls through the cracks." },
  { icon: Zap, title: "Fast, not frantic", copy: "Clear timelines and real-time status mean campaigns move quickly without the last-minute scramble." },
  { icon: Users, title: "Creators are partners", copy: "We treat the creators we work with like collaborators, not line items. Good relationships make better content." },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <Reveal className="mx-auto max-w-2xl px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-36">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/40">About Nox &amp; Co</p>
        <h1 className="mt-7 font-display text-4xl font-medium leading-[1.15] text-white sm:text-5xl">
          Campaigns shouldn&apos;t depend on luck.
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
          Nox &amp; Co started with a simple frustration: too many brand
          campaigns fall apart in the gaps, a contract that never gets
          signed, a creator who goes quiet, a report that never arrives. We
          built a way to run campaigns where nothing gets lost in the dark.
        </p>
      </Reveal>

      {/* Story / approach, asymmetric two-up */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-5">
          <Reveal className="sm:col-span-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/40">Our story</p>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              We spent years running brand campaigns on spreadsheets,
              inboxes, and good intentions, watching brands lose track of
              creators mid-negotiation and miss content windows they&apos;d
              paid for. Nox &amp; Co is the agency we wished existed: one team,
              one system, full visibility from first outreach to final report.
            </p>
          </Reveal>
          <Reveal delay={120} className="border-t border-white/10 pt-6 sm:col-span-2 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/40">Our approach</p>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Every creator relationship, contract, and deliverable lives in
              one shared view, for us and for you. That means faster
              approvals, clearer timelines, and a client portal where you can
              always see exactly where a campaign stands.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values, quiet list, no cards */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/40">What we believe</p>
            <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-4xl">The values behind every campaign.</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-white/70">
                  <v.icon size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/50">{v.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal>
        <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">Want to work with us?</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">
            We&apos;d love to hear about your brand and what you&apos;re planning next.
          </p>
          <div className="mt-9">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-1.5 border-b border-white/70 pb-1 text-sm font-medium text-white transition hover:border-white hover:text-lavender"
            >
              Get in touch <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </Reveal>
    </MarketingShell>
  );
}
