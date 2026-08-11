"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";

// Fades + rises an element into place the first time it scrolls into view.
// Pass `delay` (ms) to stagger a row of siblings.
export function Reveal({
  children, delay = 0, className,
}: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx("transition-all duration-[900ms] ease-out", shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4", className)}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
