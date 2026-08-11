import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — black & silver, moody and mysterious
        navy: { DEFAULT: "#0D0D10", deep: "#000000", soft: "#3A3B42" },
        dusty: { DEFAULT: "#C7C9D1", deep: "#9A9CA6", soft: "#E8E9EE" },
        seafoam: { DEFAULT: "#4B4D57", deep: "#2A2B31", soft: "#8A8C96" },
        // Accents — cool silver + a warm brass/gold flicker (marble veining)
        lavender: { DEFAULT: "#E5E6EA", soft: "#F5F5F7" },
        peach: { DEFAULT: "#C9A15A", soft: "#E8D9B8" },
        butter: { DEFAULT: "#D8CBA0", soft: "#F0E8D2" },
        bubblegum: { DEFAULT: "#8A6A3A", soft: "#C9A15A" },
        // Backgrounds — near-black surfaces (cards are dark frosted glass)
        cloud: "#0A0A0C",
        cream: "#111114",
        sky: "#1C1C21",
        // Ink — light text on dark
        ink: { DEFAULT: "#F2F2F4", soft: "#A8A9B3", faint: "#6C6D76" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        cozy: "0 8px 30px -12px rgba(0, 0, 0, 0.6)",
        float: "0 12px 40px -16px rgba(0, 0, 0, 0.7)",
        pill: "0 2px 0 0 rgba(0,0,0,0.25)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-4px) rotate(2deg)" },
        },
        drift: {
          "0%": { transform: "translateX(-10px)" },
          "100%": { transform: "translateX(10px)" },
        },
        wave: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        twinkle: "twinkle 3.5s ease-in-out infinite",
        bob: "bob 4s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite alternate",
        wave: "wave 18s linear infinite",
        rise: "rise 0.4s ease-out both",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
