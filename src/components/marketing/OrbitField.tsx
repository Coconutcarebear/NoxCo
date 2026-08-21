"use client";

import { useEffect, useRef } from "react";

// Slow-turning orbit rings behind the hero, one node per pillar word
// (Strategy, Creative, PR & Influencer, Creators, Culture), plus a bright
// comet that sweeps the outer ring so the motion reads clearly even at a
// glance. Rotation is pure CSS (motion-safe:animate-*); only the
// scroll-linked drift is driven from JS, and it transforms this element
// directly rather than an ancestor, so it can't hijack anything else's
// containing block.
const NODES = [
  { angle: -90, r: 220 },
  { angle: -18, r: 220 },
  { angle: 54, r: 220 },
  { angle: 126, r: 220 },
  { angle: 198, r: 220 },
];

function pt(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: 260 + Math.cos(rad) * r, y: 260 + Math.sin(rad) * r };
}

export function OrbitField() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const apply = () => {
      const el = wrapRef.current;
      if (!el) return;
      const y = Math.min(window.scrollY, 900);
      const dy = reduced ? 0 : y * 0.12;
      const scale = reduced ? 1 : 1 + y * 0.00012;
      el.style.transform = `translate(-50%, calc(-50% + ${dy}px)) scale(${scale})`;
      el.style.opacity = String(Math.max(0.35 - y / 2400, 0.1));
    };
    const onScroll = () => { raf = requestAnimationFrame(apply); };
    apply();
    if (!reduced) window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ transform: "translate(-50%, -50%)", opacity: 0.35, zIndex: -1 }}
      aria-hidden
    >
      <svg width="560" height="560" viewBox="0 0 520 520">
        <defs>
          <radialGradient id="cometGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="260" cy="260" r="220" fill="none" stroke="#7d97c9" strokeOpacity="0.28" strokeWidth="1" />
        <circle cx="260" cy="260" r="155" fill="none" stroke="#c7c9d1" strokeOpacity="0.2" strokeWidth="1" />
        <g className="origin-center motion-safe:animate-spin-slow">
          {NODES.map((n, i) => {
            const p = pt(n.angle, n.r);
            return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f2f2f4" opacity="0.6" />;
          })}
          {/* faint comet sweeping the outer ring */}
          <circle cx="260" cy="40" r="10" fill="url(#cometGlow)" opacity="0.6" />
          <circle cx="260" cy="40" r="2.5" fill="#ffffff" opacity="0.8" />
        </g>
        <g className="origin-center motion-safe:animate-spin-slower">
          <circle cx="260" cy="30" r="2" fill="#7d97c9" opacity="0.5" />
          <circle cx="490" cy="260" r="1.6" fill="#c7c9d1" opacity="0.45" />
          <circle cx="260" cy="490" r="2" fill="#7d97c9" opacity="0.5" />
          <circle cx="30" cy="260" r="1.6" fill="#c7c9d1" opacity="0.45" />
        </g>
      </svg>
    </div>
  );
}
