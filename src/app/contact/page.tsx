"use client";

import { useState } from "react";
import { Mail, Instagram, Music2, Clock, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const subject = encodeURIComponent(`New inquiry from ${name}${company ? ` (${company})` : ""}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCompany: ${company || "-"}\n\n${message}`
    );
    window.location.href = `mailto:hello@noxandco.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <MarketingShell>
      <Reveal className="mx-auto max-w-4xl px-5 pb-10 pt-16 text-center sm:px-8 sm:pb-14 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lavender">Contact</p>
        <h1 className="mt-4 font-display text-4xl leading-[1.1] text-white sm:text-5xl">
          Let&apos;s chart your next campaign.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          Tell us a little about your brand and what you&apos;re planning, we typically reply within one business day.
        </p>
      </Reveal>

      <Reveal delay={120} className="mx-auto max-w-5xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* form */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-navy-deep text-lavender">
                  <Mail size={20} />
                </div>
                <p className="font-display text-xl text-white">Your email client should be open now.</p>
                <p className="max-w-xs text-sm text-white/60">
                  If it didn&apos;t open, reach us directly at{" "}
                  <a href="mailto:hello@noxandco.com" className="text-lavender underline">
                    hello@noxandco.com
                  </a>
                  .
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm font-semibold text-white/60 hover:text-white"
                >
                  ← Send another message
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-white/50">Name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jamie Rivera"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-lavender"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-white/50">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@brand.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-lavender"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/50">Company</span>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Brand or agency name"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-lavender"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/50">What are you working on?</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="A few sentences about your brand, timeline, and budget range."
                    className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-lavender"
                  />
                </label>
                <button
                  onClick={submit}
                  disabled={!name.trim() || !email.trim() || !message.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender py-3 text-sm font-semibold text-navy-deep transition hover:brightness-105 disabled:opacity-40"
                >
                  Send message <ArrowRight size={15} />
                </button>
                <p className="text-center text-[11px] text-white/35">
                  This opens your email client with the message pre-filled, we don&apos;t store anything you type here.
                </p>
              </div>
            )}
          </div>

          {/* side info */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2.5 text-white">
                <Mail size={16} className="text-lavender" />
                <span className="text-sm font-semibold">Email</span>
              </div>
              <a href="mailto:hello@noxandco.com" className="mt-1.5 block text-sm text-white/60 hover:text-white">
                hello@noxandco.com
              </a>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2.5 text-white">
                <Instagram size={16} className="text-lavender" />
                <span className="text-sm font-semibold">Instagram</span>
              </div>
              <a href="https://www.instagram.com/nox.co.agency" target="_blank" rel="noreferrer" className="mt-1.5 block text-sm text-white/60 hover:text-white">
                @nox.co.agency
              </a>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2.5 text-white">
                <Music2 size={16} className="text-lavender" />
                <span className="text-sm font-semibold">TikTok</span>
              </div>
              <a href="https://www.tiktok.com/@nox.co.agency" target="_blank" rel="noreferrer" className="mt-1.5 block text-sm text-white/60 hover:text-white">
                @nox.co.agency
              </a>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2.5 text-white">
                <Clock size={16} className="text-lavender" />
                <span className="text-sm font-semibold">Response time</span>
              </div>
              <p className="mt-1.5 text-sm text-white/60">Usually within one business day.</p>
            </div>
          </div>
        </div>
      </Reveal>
    </MarketingShell>
  );
}
