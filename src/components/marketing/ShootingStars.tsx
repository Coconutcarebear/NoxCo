"use client";

import { useMemo } from "react";

// A handful of shooting stars that streak across the sky on staggered,
// slow loops. Deterministic positions so server/client output match.
export function ShootingStars({ count = 6, className = "" }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    const r = (i: number, n: number) => { const v = Math.sin((i + 1) * n) * 10000; return v - Math.floor(v); };
    return Array.from({ length: count }, (_, i) => ({
      top: 4 + r(i, 12.9) * 55,
      left: r(i, 4.7) * 70,
      len: 90 + r(i, 91.3) * 90,
      delay: r(i, 33.1) * 14,
      dur: 2.8 + r(i, 21.1) * 2.2,
      hue: r(i, 15.3) > 0.75 ? "#e8d9b8" : "#e5e6ea",
    }));
  }, [count]);

  return (
    <div className={"pointer-events-none absolute inset-0 overflow-hidden " + className} aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-shoot"
          style={{
            top: s.top + "%",
            left: s.left + "%",
            width: s.len,
            height: 2,
            animationDelay: s.delay + "s",
            animationDuration: s.dur + "s",
            background: `linear-gradient(90deg, transparent, ${s.hue}cc, #ffffff)`,
            borderRadius: 999,
            transform: "rotate(-32deg)",
            boxShadow: `0 0 6px ${s.hue}`,
          }}
        />
      ))}
    </div>
  );
}
