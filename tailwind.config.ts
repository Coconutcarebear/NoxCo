import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — dark blue & silver, moody and minimal
        navy: { DEFAULT: "#0B0F1C", deep: "#03040A", soft: "#232C42" },
        dusty: { DEFAULT: "#C7C9D1", deep: "#9A9CA6", soft: "#E8E9EE" },
        seafoam: { DEFAULT: "#4B4D57", deep: "#2A2B31", soft: "#8A8C96" },
        // Accents — cool silver
        lavender: { DEFAULT: "#E5E6EA", soft: "#F5F5F7" },
        peach: { DEFAULT: "#C9A15A", soft: "#E8D9B8" },
        butter: { DEFAULT: "#D8CBA0", soft: "#F0E8D2" },
        bubblegum: { DEFAULT: "#8A6A3A", soft: "#C9A15A" },
        // Backgrounds — dark blue-black surfaces
        cloud: "#05070E",
        cream: "#0A0E1A",
        sky: "#141B2E",
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
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
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
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        twinkle: "twinkle 3.5s ease-in-out infinite",
        bob: "bob 2.6s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite alternate",
        wave: "wave 18s linear infinite",
        rise: "rise 0.4s ease-out both",
        shimmer: "shimmer 3s linear infinite",
        "spin-slow": "spin-slow 90s linear infinite",
        "spin-slower": "spin-reverse 130s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
