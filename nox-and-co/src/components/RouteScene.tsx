"use client";

import { usePathname } from "next/navigation";

type Orb = { kind: "sun" | "moon"; x: number; y: number; size: number; color: string; glow: string };
type Bloom = { x: number; y: number; size: number; color: string };
interface Mood {
  sky: string;
  orb: Orb;
  stars: number;        // 0..1 density
  bloom?: Bloom[];       // soft color blooms / nebula haze
}

// Every page lives under one black sky, moody and mysterious, near-black
// charcoal base, brushed-silver moon glow, and a signature bloom color per
// section (cool silver, steel blue, or a rare warm brass/gold flicker).
const M: Record<string, Mood> = {
  // Nightfall, the dashboard, calm and composed
  "/app": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0c 45%,#111114 75%,#0a0a0c 100%)",
    orb: { kind: "moon", x: 20, y: 24, size: 100, color: "#eceef2", glow: "#c7c9d1" },
    stars: 0.55,
    bloom: [{ x: 76, y: 16, size: 360, color: "rgba(199,201,209,0.10)" }],
  },
  // Night Watch, alert, sharp-edged
  "/todos": {
    sky: "linear-gradient(180deg,#000000 0%,#0b0b0d 50%,#131316 100%)",
    orb: { kind: "moon", x: 30, y: 20, size: 96, color: "#eceef2", glow: "#e8e9ee" },
    stars: 0.5,
  },
  // Star Chart, plotting a course, steel-blue signal
  "/pipeline": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a10 45%,#111420 100%)",
    orb: { kind: "moon", x: 62, y: 16, size: 100, color: "#e9edf4", glow: "#5a6a8f" },
    stars: 0.55,
    bloom: [{ x: 58, y: 22, size: 380, color: "rgba(90,106,143,0.14)" }],
  },
  // Constellation, deepest, most star-dense
  "/creators": {
    sky: "linear-gradient(180deg,#000000 0%,#08080a 40%,#131317 72%,#000000 100%)",
    orb: { kind: "moon", x: 76, y: 18, size: 88, color: "#eceef2", glow: "#c7c9d1" },
    stars: 1,
    bloom: [
      { x: 68, y: 24, size: 460, color: "rgba(199,201,209,0.10)" },
      { x: 48, y: 14, size: 340, color: "rgba(138,140,150,0.10)" },
      { x: 86, y: 36, size: 320, color: "rgba(90,106,143,0.10)" },
    ],
  },
  // Eclipses, a corona of warm brass light around a dark moon
  "/campaigns": {
    sky: "linear-gradient(180deg,#000000 0%,#0c0a08 40%,#161210 72%,#000000 100%)",
    orb: { kind: "moon", x: 78, y: 38, size: 118, color: "#0f1420", glow: "#5a6a8f" },
    stars: 0.5,
    bloom: [{ x: 78, y: 38, size: 420, color: "rgba(90,106,143,0.16)" }],
  },
  // Almanac, orderly, minimal
  "/almanac": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0c 48%,#101013 100%)",
    orb: { kind: "moon", x: 26, y: 20, size: 92, color: "#eceef2", glow: "#8a8c96" },
    stars: 0.4,
  },
  // The Vault, sealed, guarded, almost no light
  "/dockyard": {
    sky: "linear-gradient(180deg,#000000 0%,#08080a 50%,#0d0d0f 100%)",
    orb: { kind: "moon", x: 28, y: 22, size: 84, color: "#e2e4e9", glow: "#6c6d76" },
    stars: 0.3,
  },
  // Stardust, a shimmer of fine silver dust
  "/treasury": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0d 46%,#121215 100%)",
    orb: { kind: "moon", x: 74, y: 28, size: 108, color: "#f0f0f4", glow: "#e8e9ee" },
    stars: 0.7,
    bloom: [{ x: 30, y: 18, size: 380, color: "rgba(232,233,238,0.10)" }],
  },
  // Star Gallery, a wall lit bright with stars
  "/gallery": {
    sky: "linear-gradient(180deg,#000000 0%,#09090b 42%,#131316 74%,#000000 100%)",
    orb: { kind: "moon", x: 70, y: 20, size: 92, color: "#eceef2", glow: "#c7c9d1" },
    stars: 0.9,
  },
  // Night Log, warm brass-toned entries
  "/logbook": {
    sky: "linear-gradient(180deg,#000000 0%,#0b0a08 48%,#141210 100%)",
    orb: { kind: "moon", x: 50, y: 18, size: 100, color: "#e2e6ef", glow: "#5a6a8f" },
    stars: 0.45,
  },
  // Stargazing, scanning the dark for something worth chasing
  "/prospects": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0e 45%,#121218 100%)",
    orb: { kind: "moon", x: 50, y: 20, size: 104, color: "#eceef2", glow: "#c7c9d1" },
    stars: 0.6,
    bloom: [
      { x: 22, y: 16, size: 340, color: "rgba(199,201,209,0.10)" },
      { x: 74, y: 22, size: 340, color: "rgba(90,106,143,0.10)" },
    ],
  },
  // Observatory, deepest, densest, most dramatic sky
  "/observatory": {
    sky: "linear-gradient(180deg,#000000 0%,#07070a 38%,#101014 70%,#000000 100%)",
    orb: { kind: "moon", x: 28, y: 18, size: 80, color: "#eceef2", glow: "#c7c9d1" },
    stars: 1,
    bloom: [
      { x: 66, y: 24, size: 420, color: "rgba(90,106,143,0.10)" },
      { x: 32, y: 16, size: 340, color: "rgba(90,106,143,0.12)" },
    ],
  },
  // Star Forecast, hazy, uncertain, silver-blue clouded
  "/forecast": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0e 42%,#121218 76%,#000000 100%)",
    orb: { kind: "moon", x: 68, y: 18, size: 92, color: "#e2e6ef", glow: "#5a6a8f" },
    stars: 0.5,
  },
  // Star Briefs, clean, minimal
  "/brief": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0c 48%,#101013 100%)",
    orb: { kind: "moon", x: 32, y: 20, size: 96, color: "#eceef2", glow: "#8a8c96" },
    stars: 0.4,
  },
  // Star Report, clarity, bright silver summary
  "/reporting": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0c 45%,#111114 100%)",
    orb: { kind: "moon", x: 58, y: 16, size: 106, color: "#f0f0f4", glow: "#e8e9ee" },
    stars: 0.45,
  },
  // Clients, calm, neutral
  "/clients": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0c 48%,#101013 100%)",
    orb: { kind: "moon", x: 34, y: 22, size: 90, color: "#eceef2", glow: "#8a8c96" },
    stars: 0.35,
  },
  // Night Owls, fresh, watchful
  "/crew": {
    sky: "linear-gradient(180deg,#000000 0%,#0a0a0c 46%,#111114 100%)",
    orb: { kind: "moon", x: 30, y: 22, size: 92, color: "#eceef2", glow: "#c7c9d1" },
    stars: 0.4,
  },
};

const BASE_STARS = (() => {
  const s = (i: number, n: number) => { const v = Math.sin((i + 1) * n) * 10000; return v - Math.floor(v); };
  return Array.from({ length: 90 }, (_, i) => ({
    x: s(i, 12.9) * 100,
    y: s(i, 4.7) * 60,
    r: 0.7 + s(i, 91.3) * 1.7,
    o: 0.45 + s(i, 33.1) * 0.55,
    d: s(i, 5.3) * 4,
    spark: s(i, 7.7) > 0.88,
    hue: s(i, 15.3) > 0.82 ? "#7d97c9" : s(i, 21.1) > 0.6 ? "#c7c9d1" : "#ffffff",
  }));
})();

export function RouteScene() {
  const pathname = usePathname();
  const m = M[pathname] ?? M["/app"];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <style>{"@keyframes scnBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}"}</style>

      {/* sky */}
      <div className="absolute inset-0" style={{ background: m.sky }} />

      {/* soft color blooms / nebula haze */}
      {m.bloom?.map((n, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: n.x + "%", top: n.y + "%", width: n.size, height: n.size * 0.72,
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(circle, " + n.color + " 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      ))}

      {/* stars */}
      {m.stars > 0 && (
        <div className="absolute inset-0">
          {BASE_STARS.map((st, i) => {
            const op = st.o * m.stars;
            if (op < 0.04) return null;
            const big = st.spark && m.stars > 0.5;
            return (
              <span
                key={i}
                className="absolute rounded-full animate-twinkle"
                style={{
                  left: st.x + "%", top: st.y + "%",
                  width: big ? st.r * 1.7 : st.r, height: big ? st.r * 1.7 : st.r,
                  opacity: op,
                  background: st.hue,
                  boxShadow: big ? `0 0 9px ${st.hue}` : `0 0 4px ${st.hue}`,
                  animationDelay: st.d + "s",
                }}
              />
            );
          })}
        </div>
      )}

      {/* moon with soft metallic glow */}
      <div className="absolute" style={{ left: m.orb.x + "%", top: m.orb.y + "%", transform: "translate(-50%,-50%)" }}>
        <div
          className="absolute rounded-full"
          style={{
            width: m.orb.size * 2.8, height: m.orb.size * 2.8, left: "50%", top: "50%",
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(circle, " + m.orb.glow + "77 0%, " + m.orb.glow + "22 38%, transparent 70%)",
          }}
        />
        <div
          className="rounded-full"
          style={{
            width: m.orb.size, height: m.orb.size,
            background: "radial-gradient(circle at 36% 32%, #ffffffcc, " + m.orb.color + ")",
            boxShadow: "0 0 " + m.orb.size / 2 + "px " + m.orb.glow + "88",
          }}
        />
      </div>
    </div>
  );
}
