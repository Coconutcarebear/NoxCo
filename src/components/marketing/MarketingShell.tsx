"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Stars } from "@/components/decor";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

// Shared backdrop + chrome for every public marketing page. Dark blue and
// silver, quiet, no streaking graphics, just a faint cursor-tracking glow
// so the sky feels alive as you move through it.
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
          `radial-gradient(650px 500px at ${cx}% ${cy}%, rgba(150,170,210,0.08), transparent 60%)`;
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
      {/* deep blue-black sky, brushed with faint silver */}
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(1000px 650px at 85% -4%, rgba(90,110,160,0.10), transparent 60%)," +
            "radial-gradient(1100px 700px at 10% 6%, rgba(199,201,209,0.07), transparent 58%)," +
            "linear-gradient(180deg, #03040a 0%, #070a14 40%, #0a0e1a 72%, #03040a 100%)",
        }}
      />
      {/* cursor-tracking ambient glow */}
      <div ref={glowRef} className="pointer-events-none fixed inset-0 -z-10 transition-opacity" />
      <Stars count={20} />
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
