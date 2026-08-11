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
      <Reveal className="mx-auto max-w-4xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">About Nox &amp; Co</p>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] text-white sm:text-5xl">
          Campaigns shouldn&apos;t depend on luck.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          Nox &amp; Co started with a simple frustration: too many brand
          campaigns fall apart in the gaps, a contract that never gets
          signed, a creator who goes quiet, a report that never arrives. We
          built a way to run campaigns where nothing gets lost in the dark.
        </p>
      </Reveal>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          <Reveal className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
            <h2 className="font-display text-2xl text-white">Our story</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We spent years running brand campaigns on spreadsheets,
              inboxes, and good intentions, watching brands lose track of
              creators mid-negotiation and miss content windows they&apos;d
              paid for. Nox &amp; Co is the agency we wished existed: one team,
              one system, full visibility from first outreach to final report.
            </p>
          </Reveal>
          <Reveal delay={120} className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
            <h2 className="font-display text-2xl text-white">Our approach</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Every creator relationship, contract, and deliverable lives in
              one shared view, for us and for you. That means faster
              approvals, clearer timelines, and a client portal where you can
              always see exactly where a campaign stands.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">What we believe</p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">The values behind every campaign.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-navy-deep text-lavender">
                  <v.icon size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{v.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2 className="font-display text-3xl text-white sm:text-4xl">Want to work with us?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60 sm:text-base">
          We&apos;d love to hear about your brand and what you&apos;re
          planning next.
        </p>
        <div className="mt-7">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender px-6 py-3 text-sm font-semibold text-navy-deep transition hover:brightness-105"
          >
            Get in touch <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
