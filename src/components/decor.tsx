"use client";

import { useMemo } from "react";

const INK = "#F2F2F4";

// ── The Nox & Co starburst mascot (matches the logo mark) ──────────────────
export function StarFlower({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" className={className} aria-hidden>
      <defs>
        <radialGradient id="noxMascotBg" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="#1c1c21" />
          <stop offset="55%" stopColor="#0d0d10" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <linearGradient id="noxMascotStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e5e6ea" />
          <stop offset="100%" stopColor="#9a9ca6" />
        </linearGradient>
        <radialGradient id="noxMascotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c7c9d1" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c7c9d1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="182" fill="url(#noxMascotBg)" stroke="#9a9ca6" strokeWidth="6" />
      {/* scattered tiny stars */}
      <circle cx="120" cy="120" r="3" fill="#ffffff" opacity="0.8" />
      <circle cx="300" cy="150" r="2.4" fill="#ffffff" opacity="0.7" />
      <circle cx="270" cy="290" r="2.8" fill="#ffffff" opacity="0.75" />
      <circle cx="130" cy="280" r="2.2" fill="#ffffff" opacity="0.65" />
      <circle cx="95" cy="205" r="2" fill="#ffffff" opacity="0.6" />
      {/* glow behind the big sparkle */}
      <circle cx="200" cy="200" r="130" fill="url(#noxMascotGlow)" />
      {/* small companion sparkles */}
      <path d="M285 130 L292 148 L310 155 L292 162 L285 180 L278 162 L260 155 L278 148 Z" fill="url(#noxMascotStar)" opacity="0.85" />
      <path d="M118 250 L123 262 L135 267 L123 272 L118 284 L113 272 L101 267 L113 262 Z" fill="url(#noxMascotStar)" opacity="0.8" />
      {/* the big four-pointed sparkle */}
      <path
        d="M200 96 C204 158 210 190 200 200 C190 190 196 158 200 96 Z
           M200 304 C196 242 190 210 200 200 C210 210 204 242 200 304 Z
           M96 200 C158 196 190 190 200 200 C190 210 158 204 96 200 Z
           M304 200 C242 204 210 210 200 200 C210 190 242 196 304 200 Z"
        fill="url(#noxMascotStar)"
      />
      <circle cx="200" cy="200" r="14" fill="#ffffff" />
    </svg>
  );
}

// ── Twinkling starfield ──────────────────────────────────────────────────
interface StarPt { x: number; y: number; s: number; d: number; }
export function Stars({ count = 22 }: { count?: number }) {
  const stars = useMemo<StarPt[]>(() => {
    const r = (i: number) => { const v = Math.sin(i * 999.13) * 10000; return v - Math.floor(v); };
    return Array.from({ length: count }, (_, i) => ({ x: r(i) * 100, y: r(i + 100) * 100, s: 4 + r(i + 200) * 8, d: r(i + 300) * 4 }));
  }, [count]);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {stars.map((st, i) => (
        <svg key={i} className="absolute animate-twinkle" style={{ left: st.x + "%", top: st.y + "%", animationDelay: st.d + "s" }} width={st.s} height={st.s} viewBox="0 0 24 24" fill="none">
          <path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z" fill={i % 3 === 0 ? "#7d97c9" : i % 3 === 1 ? "#c7c9d1" : "#ffffff"} opacity="0.85" />
        </svg>
      ))}
    </div>
  );
}

// ── Moon (crescent, used across night-sky pages) ────────────────────────
export function Moon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M40 8 A24 24 0 1 0 40 56 A18 18 0 1 1 40 8 Z" fill="#e5e6ea" />
      <circle cx="46" cy="14" r="2" fill="#e5e6ea" opacity="0.8" />
      <circle cx="52" cy="22" r="1.3" fill="#e5e6ea" opacity="0.7" />
    </svg>
  );
}

// ── Sparkle (used like confetti / drifting accent) ──────────────────────
export function Petal({ size = 16, className = "", color = "#c7c9d1" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z" fill={color} />
    </svg>
  );
}

export const DECOR_INK = INK;
