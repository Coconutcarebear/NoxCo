"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";

// Wraps content that should briefly "glitch" the first time it scrolls into
// view, then lock into a perfectly clean, still state. Visual proof for the
// "no glitchy outcomes" line: things flicker, then resolve. Skips entirely
// under prefers-reduced-motion (content just appears normally).
export function GlitchReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setGlitching(true);
          io.disconnect();
          const t = setTimeout(() => setGlitching(false), 600);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={clsx("glitch-wrap", glitching && "glitching", className)}>
      <span className="glitch-noise" aria-hidden />
      <span className="glitch-bar b1" aria-hidden />
      <span className="glitch-bar b2" aria-hidden />
      <span className="glitch-bar b3" aria-hidden />
      {children}
    </div>
  );
}
