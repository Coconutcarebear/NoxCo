"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";

export function ClientSwitcher() {
  const companies = useStore((s) => s.companies);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const setActiveCompany = useStore((s) => s.setActiveCompany);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (companies.length === 0) return null;
  const active = companies.find((c) => c.id === activeCompanyId) ?? null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-sm font-semibold text-ink shadow-pill transition hover:brightness-105"
        title="Switch client"
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: active?.color || "#8FA8D8" }} />
        <span className="max-w-[140px] truncate">{active ? active.name : "All clients"}</span>
        <Icons.ChevronDown size={15} className="text-ink-faint" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-white bg-cream py-1 shadow-float">
          <button
            onClick={() => { setActiveCompany(null); setOpen(false); }}
            className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition hover:bg-sky/50 ${!activeCompanyId ? "font-semibold text-dusty-deep" : "text-ink"}`}
          >
            <Icons.LayoutGrid size={15} className="text-ink-faint" /> All clients
            {!activeCompanyId && <Icons.Check size={14} className="ml-auto text-dusty-deep" />}
          </button>
          <div className="my-1 border-t border-sky/60" />
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCompany(c.id); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition hover:bg-sky/50 ${activeCompanyId === c.id ? "font-semibold text-dusty-deep" : "text-ink"}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color || "#8FA8D8" }} />
              <span className="truncate">{c.name}</span>
              {activeCompanyId === c.id && <Icons.Check size={14} className="ml-auto shrink-0 text-dusty-deep" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
