"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Stars } from "@/components/decor";
import { ShootingStars } from "./ShootingStars";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

// Shared black-and-silver backdrop + chrome for every public marketing page.
// Includes a soft cursor-tracking glow so the sky feels alive as you move
// through it, subtle, moody, not gimmicky.
export function MarketingShell({ children }: { children: ReactNode }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let tx = 50, ty = 20, cx = 50, cy = 20;
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (glowRef.current) {
        glowRef.current.style.background =
          `radial-gradient(650px 500px at ${cx}% ${cy}%, rgba(199,201,209,0.10), transparent 60%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-deep font-body text-white">
      {/* deep black sky, brushed with faint silver + a trace of warm brass */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(900px 600px at 85% -4%, rgba(232,217,184,0.10), transparent 60%)," +
            "radial-gradient(1100px 700px at 10% 6%, rgba(199,201,209,0.09), transparent 58%)," +
            "radial-gradient(1000px 800px at 50% 120%, rgba(201,161,90,0.07), transparent 60%)," +
            "linear-gradient(180deg, #000000 0%, #0a0a0c 38%, #111114 68%, #000000 100%)",
        }}
      />
      {/* cursor-tracking ambient glow */}
      <div ref={glowRef} className="pointer-events-none fixed inset-0 -z-10 transition-opacity" />
      <Stars count={46} />
      <ShootingStars count={5} className="fixed" />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
