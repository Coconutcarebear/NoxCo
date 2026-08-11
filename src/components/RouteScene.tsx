"use client";

import { usePathname } from "next/navigation";

type Orb = { kind: "sun" | "moon"; x: number; y: number; size: number; color: string; glow: string };
type Bloom = { x: number; y: number; size: number; color: string };
interface Mood {
  sky: string;
  orb: Orb;
  stars: number;        // 0..1 density
  bloom?: Bloom[];       // soft color blooms / nebula haze
  lift?: boolean;
  dark?: boolean;       // deeper pages: add a readable header band so titles don't vanish
}

// Every page lives under one night sky, tinted with the Nox & Co palette
// (wine, indigo, teal-navy, slate, blue, lavender). Each section gets its own
// color-forward moment — some dawn-pale, some deep and starlit.
const M: Record<string, Mood> = {
  // Nightfall — the dashboard, dusk settling into lavender
  "/app": {
    sky: "linear-gradient(180deg,#c7c2ec 0%,#dcd8f5 38%,#eeecfb 66%,#faf9ff 100%)",
    orb: { kind: "moon", x: 20, y: 26, size: 110, color: "#f5f3ff", glow: "#a99ce7" },
    stars: 0.35,
    bloom: [{ x: 76, y: 18, size: 340, color: "rgba(55,101,216,0.20)" }],
  },
  // Night Watch — pale, alert morning
  "/todos": {
    sky: "linear-gradient(180deg,#c9dcf2 0%,#dde9f8 40%,#eff4fb 72%,#fbfcff 100%)",
    orb: { kind: "sun", x: 30, y: 22, size: 112, color: "#eef2ff", glow: "#3765d8" },
    stars: 0.1,
  },
  // Star Chart — bright, plotting a course through the sky
  "/pipeline": {
    sky: "linear-gradient(180deg,#bcd0f2 0%,#d6e2f7 42%,#edf2fb 72%,#fbfcff 100%)",
    orb: { kind: "sun", x: 62, y: 18, size: 118, color: "#eef2ff", glow: "#3765d8" },
    stars: 0.15,
  },
  // Constellation — deep, star-dense
  "/creators": {
    sky: "linear-gradient(180deg,#1c1a4a 0%,#332f77 32%,#7a72c2 60%,#cdc8ee 84%,#f5f4fc 100%)",
    orb: { kind: "moon", x: 76, y: 20, size: 92, color: "#f7f3ff", glow: "#a99ce7" },
    stars: 1, dark: true,
    bloom: [
      { x: 68, y: 24, size: 460, color: "rgba(89,60,150,0.40)" },
      { x: 48, y: 14, size: 340, color: "rgba(55,101,216,0.28)" },
      { x: 86, y: 36, size: 320, color: "rgba(92,0,63,0.22)" },
    ],
  },
  // Eclipses — dusky wine-to-indigo, a campaign in full alignment
  "/campaigns": {
    sky: "linear-gradient(180deg,#3f2350 0%,#6d3868 30%,#9c5285 58%,#d3aecb 82%,#f8eef6 100%)",
    orb: { kind: "moon", x: 78, y: 40, size: 130, color: "#f3e6f0", glow: "#5c003f" },
    stars: 0.3, dark: true,
  },
  // Almanac — pale, orderly sky
  "/almanac": {
    sky: "linear-gradient(180deg,#c8d6f2 0%,#dde5f8 40%,#eff2fb 72%,#fcfdff 100%)",
    orb: { kind: "sun", x: 26, y: 22, size: 110, color: "#eef2ff", glow: "#425180" },
    stars: 0.08,
  },
  // The Vault — cool, guarded indigo
  "/dockyard": {
    sky: "linear-gradient(180deg,#c4c9ec 0%,#dad9f5 44%,#eeecfb 72%,#faf9ff 100%)",
    orb: { kind: "moon", x: 28, y: 22, size: 100, color: "#f4f2ff", glow: "#262268" },
    stars: 0.2,
  },
  // Stardust — luminous lavender shimmer
  "/treasury": {
    sky: "linear-gradient(180deg,#d3c9f0 0%,#e4dcf8 34%,#f2ecfb 64%,#fdfbff 100%)",
    orb: { kind: "sun", x: 74, y: 30, size: 140, color: "#faf7ff", glow: "#a99ce7" },
    stars: 0.15,
    bloom: [{ x: 30, y: 18, size: 360, color: "rgba(169,156,231,0.30)" }],
  },
  // Star Gallery — night wall of light
  "/gallery": {
    sky: "linear-gradient(180deg,#171438 0%,#312e68 36%,#7d76b8 64%,#cfccea 86%,#f6f5fb 100%)",
    orb: { kind: "moon", x: 70, y: 22, size: 96, color: "#f7f4ff", glow: "#3765d8" },
    stars: 0.9, dark: true,
  },
  // Night Log — soft wine-lavender dusk
  "/logbook": {
    sky: "linear-gradient(180deg,#e0c9de 0%,#ecdaea 40%,#f6ecf5 72%,#fdf9fd 100%)",
    orb: { kind: "sun", x: 50, y: 20, size: 116, color: "#faf5fa", glow: "#5c003f" },
    stars: 0.1,
  },
  // Stargazing — dawn, searching the sky
  "/prospects": {
    sky: "linear-gradient(180deg,#c2c8f0 0%,#d9d3f5 34%,#c9def0 64%,#f3f7fc 100%)",
    orb: { kind: "sun", x: 50, y: 22, size: 122, color: "#f5f6ff", glow: "#a99ce7" },
    stars: 0.25,
    bloom: [
      { x: 22, y: 16, size: 340, color: "rgba(169,156,231,0.32)" },
      { x: 74, y: 22, size: 340, color: "rgba(55,101,216,0.24)" },
    ],
  },
  // Observatory — deepest, densest sky
  "/observatory": {
    sky: "linear-gradient(180deg,#0e0c2e 0%,#221f58 32%,#5c56a0 60%,#b7b2dc 84%,#f3f2fa 100%)",
    orb: { kind: "moon", x: 28, y: 20, size: 84, color: "#f7f4ff", glow: "#3765d8" },
    stars: 1, dark: true,
    bloom: [
      { x: 66, y: 24, size: 420, color: "rgba(92,0,63,0.30)" },
      { x: 32, y: 16, size: 340, color: "rgba(2,52,89,0.34)" },
    ],
  },
  // Star Forecast — dusk ahead
  "/forecast": {
    sky: "linear-gradient(180deg,#221f52 0%,#443f80 40%,#8983bc 66%,#d6d2ec 88%,#f8f7fc 100%)",
    orb: { kind: "moon", x: 68, y: 20, size: 92, color: "#f7f4ff", glow: "#a99ce7" },
    stars: 0.6, dark: true,
  },
  // Star Briefs — pale periwinkle morning
  "/brief": {
    sky: "linear-gradient(180deg,#d0d6f4 0%,#e1def9 40%,#f1eefc 72%,#fcfbff 100%)",
    orb: { kind: "sun", x: 32, y: 22, size: 114, color: "#f5f4ff", glow: "#3765d8" },
    stars: 0.08,
  },
  // Star Report — bright, clear-sky summary
  "/reporting": {
    sky: "linear-gradient(180deg,#cdd0f0 0%,#e0dcf8 38%,#f0edfb 66%,#fbfaff 100%)",
    orb: { kind: "sun", x: 58, y: 20, size: 126, color: "#f6f5ff", glow: "#5c003f" },
    stars: 0.1,
  },
  // Clients — calm, neutral sky
  "/clients": {
    sky: "linear-gradient(180deg,#c8d2ef 0%,#dbe1f6 42%,#eef1fb 72%,#fbfdff 100%)",
    orb: { kind: "sun", x: 34, y: 24, size: 108, color: "#eef2ff", glow: "#425180" },
    stars: 0.08,
  },
  // Night Owls — fresh, watchful morning
  "/crew": {
    sky: "linear-gradient(180deg,#c9cdec 0%,#dcdcf6 40%,#eeecfb 72%,#faf9ff 100%)",
    orb: { kind: "sun", x: 30, y: 24, size: 112, color: "#f4f3ff", glow: "#262268" },
    stars: 0.1,
  },
};

const BASE_STARS = (() => {
  const s = (i: number, n: number) => { const v = Math.sin((i + 1) * n) * 10000; return v - Math.floor(v); };
  return Array.from({ length: 72 }, (_, i) => ({
    x: s(i, 12.9) * 100,
    y: s(i, 4.7) * 54,
    r: 0.7 + s(i, 91.3) * 1.7,
    o: 0.45 + s(i, 33.1) * 0.55,
    d: s(i, 5.3) * 4,
    spark: s(i, 7.7) > 0.88,
    hue: s(i, 15.3) > 0.7 ? "#a99ce7" : s(i, 21.1) > 0.6 ? "#3765d8" : "#ffffff",
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

      {/* keep the header area readable on deeper skies: light wash across the top strip */}
      {m.lift && (
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "30%",
            background:
              "linear-gradient(180deg, rgba(250,249,255,0.85) 0%, rgba(250,249,255,0.45) 12%, rgba(250,249,255,0.0) 100%)",
          }}
        />
      )}

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

      {/* sun / moon with soft glow */}
      <div className="absolute" style={{ left: m.orb.x + "%", top: m.orb.y + "%", transform: "translate(-50%,-50%)" }}>
        <div
          className="absolute rounded-full"
          style={{
            width: m.orb.size * 2.8, height: m.orb.size * 2.8, left: "50%", top: "50%",
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(circle, " + m.orb.glow + "99 0%, " + m.orb.glow + "30 38%, transparent 70%)",
          }}
        />
        <div
          className="rounded-full"
          style={{
            width: m.orb.size, height: m.orb.size,
            background: "radial-gradient(circle at 36% 32%, #ffffffdd, " + m.orb.color + ")",
            boxShadow: "0 0 " + m.orb.size / 2 + "px " + m.orb.glow + "aa",
          }}
        />
      </div>
    </div>
  );
}
