"use client";

import { useEffect, useRef } from "react";

// Slow-turning orbit rings behind the hero, one node per pillar word
// (Strategy, Creative, PR & Influencer, Creators, Culture). Rotation is
// pure CSS (motion-safe:animate-*), so it's cheap and respects
// prefers-reduced-motion automatically. Only the scroll-linked drift is
// driven from JS, and it transforms this element directly rather than an
// ancestor, so it can't hijack anything else's containing block.
const NODES = [
  { angle: -90, r: 210 },
  { angle: -18, r: 210 },
  { angle: 54, r: 210 },
  { angle: 126, r: 210 },
  { angle: 198, r: 210 },
];

function pt(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: 240 + Math.cos(rad) * r, y: 240 + Math.sin(rad) * r };
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
      el.style.opacity = String(Math.max(1 - y / 700, 0.15) * 0.55);
    };
    const onScroll = () => { raf = requestAnimationFrame(apply); };
    apply();
    if (!reduced) window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute left-1/2 top-1/2 -z-[1]"
      style={{ transform: "translate(-50%, -50%)", opacity: 0.55 }}
      aria-hidden
    >
      <svg width="480" height="480" viewBox="0 0 480 480" style={{ mixBlendMode: "screen" }}>
        <circle cx="240" cy="240" r="210" fill="none" stroke="#5a6a8f" strokeOpacity="0.22" strokeWidth="1" />
        <circle cx="240" cy="240" r="150" fill="none" stroke="#c7c9d1" strokeOpacity="0.14" strokeWidth="1" />
        <g className="origin-center motion-safe:animate-spin-slow">
          {NODES.map((n, i) => {
            const p = pt(n.angle, n.r);
            return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#e5e6ea" opacity="0.75" />;
          })}
        </g>
        <g className="origin-center motion-safe:animate-spin-slower">
          <circle cx="240" cy="30" r="2" fill="#7d97c9" opacity="0.6" />
          <circle cx="450" cy="240" r="1.6" fill="#c7c9d1" opacity="0.5" />
          <circle cx="240" cy="450" r="2" fill="#7d97c9" opacity="0.55" />
          <circle cx="30" cy="240" r="1.6" fill="#c7c9d1" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
