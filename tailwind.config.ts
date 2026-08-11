import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — Nox & Co night sky
        navy: { DEFAULT: "#262268", deep: "#141243", soft: "#425180" },
        dusty: { DEFAULT: "#3765D8", deep: "#28459E", soft: "#A99CE7" },
        seafoam: { DEFAULT: "#023459", deep: "#012840", soft: "#5A90AD" },
        // Accents — style-guide palette
        lavender: { DEFAULT: "#A99CE7", soft: "#DCD6F5" },
        peach: { DEFAULT: "#8C1F66", soft: "#D9A8C4" },
        butter: { DEFAULT: "#C9C2F0", soft: "#EAE6FA" },
        bubblegum: { DEFAULT: "#5C003F", soft: "#A35C86" },
        // Backgrounds — pale night-tinted whites (cards stay light for contrast)
        cloud: "#FAFAFF",
        cream: "#F5F3FC",
        sky: "#EEF0FA",
        // Ink
        ink: { DEFAULT: "#141243", soft: "#4A4A72", faint: "#8A8AAB" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        cozy: "0 8px 30px -12px rgba(60, 74, 120, 0.25)",
        float: "0 12px 40px -16px rgba(60, 74, 120, 0.35)",
        pill: "0 2px 0 0 rgba(60,74,120,0.10)",
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
      },
      animation: {
        twinkle: "twinkle 3.5s ease-in-out infinite",
        bob: "bob 4s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite alternate",
        wave: "wave 18s linear infinite",
        rise: "rise 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
