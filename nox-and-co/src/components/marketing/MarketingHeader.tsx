"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X, ArrowRight } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-deep/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Nox & Co" className="h-9 w-9 rounded-md" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.jpg" alt="Nox & Co" className="h-5 sm:h-6" />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 sm:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "text-sm font-medium tracking-wide transition",
                  active ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/app"
            className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender px-4 py-2 text-sm font-semibold text-navy-deep shadow-[0_8px_30px_-12px_rgba(199,201,209,0.5)] transition hover:brightness-105"
          >
            Client Portal
            <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
          </Link>
        </nav>

        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-full text-white/80 sm:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy-deep px-5 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "rounded-xl px-3 py-2.5 text-sm font-medium",
                  pathname === l.href ? "bg-white/10 text-white" : "text-white/70"
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-dusty to-lavender px-4 py-2.5 text-sm font-semibold text-navy-deep"
            >
              Client Portal <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
