"use client";

import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { AVATAR_ICONS } from "@/lib/constants";

function AvatarIcon({ name, size = 16 }: { name?: string | null; size?: number }) {
  const Cmp = (Icons as Record<string, any>)[name || "Star"] ?? Icons.Star;
  return <Cmp size={size} />;
}

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

  function saveName() {
    const v = name.trim();
    if (v && v !== me!.name) updateCurrentUser({ name: v });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-navy-deep text-lavender transition hover:border-white/30"
        aria-label="Your account"
        title={me.name}
      >
        <AvatarIcon name={me.emoji} size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 border border-white/10 bg-cream shadow-float">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-navy-deep text-lavender" aria-hidden>
              <AvatarIcon name={me.emoji} size={20} />
            </span>
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
                className="w-full rounded-lg border border-white/15 bg-navy-deep px-2.5 py-1.5 text-sm text-ink outline-none focus:border-dusty-soft"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Avatar</span>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => updateCurrentUser({ emoji: icon })}
                    className={`grid h-8 w-8 place-items-center rounded-lg border transition ${me.emoji === icon ? "border-dusty-deep bg-white/10 text-white" : "border-white/10 bg-navy-deep text-lavender hover:border-white/25"}`}
                    aria-label={`Use ${icon}`}
                    title={icon}
                  >
                    <AvatarIcon name={icon} size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-white/5 hover:text-bubblegum"
          >
            <Icons.LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
