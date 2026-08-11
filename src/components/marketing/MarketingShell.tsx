"use client";

import { ReactNode } from "react";
import { Stars } from "@/components/decor";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

// Shared cosmic backdrop + chrome for every public marketing page.
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-deep font-body text-white">
      {/* deep night sky gradient */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(1100px 700px at 82% -6%, rgba(169,156,231,0.22), transparent 60%)," +
            "radial-gradient(900px 600px at 6% 8%, rgba(55,101,216,0.18), transparent 55%)," +
            "radial-gradient(1000px 800px at 50% 120%, rgba(92,0,63,0.28), transparent 60%)," +
            "linear-gradient(180deg, #0a0930 0%, #141243 38%, #181653 68%, #141243 100%)",
        }}
      />
      <Stars count={46} />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
