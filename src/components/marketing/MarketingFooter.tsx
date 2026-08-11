import Link from "next/link";
import { Instagram, Music2, Mail } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-deep">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Nox & Co" className="h-9 w-9 rounded-md" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/wordmark.jpg" alt="Nox & Co" className="h-5" />
            </Link>
            <p className="mt-3 max-w-xs font-display text-sm italic text-white/50">
              No more star-crossed campaigns.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Explore</p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/" className="text-sm text-white/70 hover:text-white">Home</Link>
              <Link href="/about" className="text-sm text-white/70 hover:text-white">About</Link>
              <Link href="/services" className="text-sm text-white/70 hover:text-white">Services</Link>
              <Link href="/contact" className="text-sm text-white/70 hover:text-white">Contact</Link>
              <Link href="/app" className="text-sm text-white/70 hover:text-white">Client Portal</Link>
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Say hello</p>
            <div className="mt-3 flex flex-col gap-2">
              <a href="mailto:hello@noxandco.com" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                <Mail size={14} /> hello@noxandco.com
              </a>
              <a href="https://www.instagram.com/nox.co.agency" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                <Instagram size={14} /> @nox.co.agency
              </a>
              <a href="https://www.tiktok.com/@nox.co.agency" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                <Music2 size={14} /> @nox.co.agency
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Nox &amp; Co. All rights reserved.</span>
          <span>Strategy, creative, and culture, one orbit.</span>
        </div>
      </div>
    </footer>
  );
}
