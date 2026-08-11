"use client";

import { useMemo } from "react";

// A dense little scatter of twinkling sparkles, meant to ring a hero logo
// or headline. Deterministic (no client/server mismatch) and cheap.
export function TwinkleCluster({ count = 26, className = "" }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    const r = (i: number, n: number) => { const v = Math.sin((i + 1) * n) * 10000; return v - Math.floor(v); };
    return Array.from({ length: count }, (_, i) => ({
      x: r(i, 12.9) * 100,
      y: r(i, 4.7) * 100,
      s: 2 + r(i, 91.3) * 4,
      d: r(i, 5.3) * 3.5,
      hue: r(i, 15.3) > 0.85 ? "#c9a15a" : r(i, 21.1) > 0.55 ? "#c7c9d1" : "#ffffff",
      o: 0.4 + r(i, 33.1) * 0.6,
    }));
  }, [count]);

  return (
    <div className={"pointer-events-none absolute inset-0 " + className} aria-hidden>
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: st.x + "%", top: st.y + "%",
            width: st.s, height: st.s,
            background: st.hue,
            opacity: st.o,
            boxShadow: `0 0 ${st.s * 1.6}px ${st.hue}`,
            animationDelay: st.d + "s",
          }}
        />
      ))}
    </div>
  );
}
