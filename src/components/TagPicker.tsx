"use client";

import { useState } from "react";
import * as Icons from "lucide-react";

export function TagPicker({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
}) {
  const [q, setQ] = useState("");
  const term = q.trim();
  const lower = term.toLowerCase();
  const has = (t: string) => value.some((x) => x.toLowerCase() === t.toLowerCase());
  const avail = suggestions.filter((t) => !has(t) && (lower ? t.toLowerCase().includes(lower) : true));
  const exactExists = suggestions.some((t) => t.toLowerCase() === lower) || has(term);

  const add = (t: string) => {
    const v = t.trim();
    if (!v || has(v)) { setQ(""); return; }
    onChange([...value, v]);
    setQ("");
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div className="rounded-xl border border-sky/70 bg-white/5 p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-lavender/50 px-2.5 py-1 text-xs font-semibold text-navy-deep">
            {t}
            <button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`} className="text-navy-deep/80 hover:text-bubblegum">
              <Icons.X size={12} />
            </button>
          </span>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(term); }
            if (e.key === "Backspace" && !q && value.length) remove(value[value.length - 1]);
          }}
          placeholder={value.length ? "Add tag…" : "Add tags…"}
          className="min-w-[90px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-ink-faint"
        />
      </div>
      {(term || avail.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-sky/60 pt-2">
          {term && !exactExists && (
            <button type="button" onClick={() => add(term)} className="inline-flex items-center gap-1 rounded-full bg-seafoam-soft px-2.5 py-1 text-xs font-semibold text-seafoam-deep hover:brightness-95">
              <Icons.Plus size={12} /> Create “{term}”
            </button>
          )}
          {avail.slice(0, 14).map((t) => (
            <button key={t} type="button" onClick={() => add(t)} className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-cream hover:text-dusty-deep">
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
