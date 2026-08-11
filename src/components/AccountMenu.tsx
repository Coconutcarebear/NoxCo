"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { EMOJI_AVATARS, GRADIENTS, gradientCss } from "@/lib/constants";

export function AccountMenu() {
  const me = useStore((s) => s.currentUser);
  const updateCurrentUser = useStore((s) => s.updateCurrentUser);
  const signOut = useStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(me?.name ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setName(me?.name ?? ""); }, [me?.name]);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!me) return null;
  const avatar = me.emoji || "🙂";

  function saveName() {
    const v = name.trim();
    if (v && v !== me!.name) updateCurrentUser({ name: v });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full text-lg shadow-pill transition hover:brightness-105"
        style={{ background: gradientCss(me.gradient) }}
        aria-label="Your account"
        title={me.name}
      >
        <span aria-hidden>{avatar}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-white bg-white shadow-float">
          <div className="flex items-center gap-3 border-b border-sky/60 px-4 py-3">
            <span className="grid h-11 w-11 place-items-center rounded-full text-2xl" style={{ background: gradientCss(me.gradient) }} aria-hidden>{avatar}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{me.name}</p>
              <p className="text-[11px] text-ink-faint">{me.role}{me.email ? ` · ${me.email}` : ""}</p>
            </div>
          </div>

          <div className="space-y-3 px-4 py-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Username</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border border-sky/70 bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-dusty-soft"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Avatar</span>
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_AVATARS.map((e) => (
                  <button
                    key={e}
                    onClick={() => updateCurrentUser({ emoji: e })}
                    className={`grid h-7 w-7 place-items-center rounded-lg text-lg transition hover:bg-sky ${me.emoji === e ? "bg-sky ring-2 ring-dusty-deep" : ""}`}
                    aria-label={`Use ${e}`}
                  >
                    <span aria-hidden>{e}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Color</span>
              <div className="grid grid-cols-10 gap-1">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => updateCurrentUser({ gradient: g.key })}
                    title={g.label}
                    aria-label={g.label}
                    className={`h-6 w-6 rounded-full transition hover:scale-110 ${me.gradient === g.key ? "ring-2 ring-dusty-deep ring-offset-1" : ""}`}
                    style={{ background: g.css }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 border-t border-sky/60 px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-sky/40 hover:text-bubblegum"
          >
            <Icons.LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
