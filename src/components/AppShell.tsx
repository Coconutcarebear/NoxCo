"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import * as Icons from "lucide-react";

import { NAV_GROUPS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { usePerms } from "@/lib/perms";

import { RouteScene } from "@/components/RouteScene";
import { AccountMenu } from "@/components/AccountMenu";
import { ClientSwitcher } from "@/components/ClientSwitcher";

function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Cmp = (Icons as Record<string, any>)[name] ?? Icons.Circle;
  return <Cmp size={size} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const error = useStore((s) => s.error);
  const fetchAll = useStore((s) => s.fetchAll);
  const session = useStore((s) => s.session);
  const loading = useStore((s) => s.loading);
  const undoStack = useStore((s) => s.undoStack);
  const undo = useStore((s) => s.undo);
  const { isOwner } = usePerms();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Auto-refresh: pull fresh data when returning to the tab (no full page reload,
  // so it never bounces you back to the login screen).
  useEffect(() => {
    if (!session) return;
    const refresh = () => { if (document.visibilityState === "visible") fetchAll(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [session, fetchAll]);

  useEffect(() => { setOpenGroup(null); setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) { setOpenGroup(null); setSearchOpen(false); }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // grouped nav, owner-only items filtered out
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.ownerOnly || isOwner) }))
    .filter((g) => g.items.length > 0);

  const MARKETING_ROUTES = ["/", "/about", "/services", "/contact"];
  if (pathname?.startsWith("/share") || MARKETING_ROUTES.includes(pathname ?? "")) return <>{children}</>;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background: per-page scene */}
      <RouteScene />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top command bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-cloud/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3.5 lg:px-8">
            <Link href="/app" className="flex shrink-0 items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Nox & Co" className="h-8 w-8 rounded-md" />
              <span className="hidden font-display text-lg leading-none text-dusty sm:block">Nox &amp; Co</span>
            </Link>

            <nav ref={barRef} className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
              {groups.map((group) => {
                const hasActive = group.items.some((i) => i.href === pathname);
                const isOpen = openGroup === group.label;
                return (
                  <div key={group.label} className="relative">
                    <button
                      onClick={() => setOpenGroup(isOpen ? null : group.label)}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition",
                        hasActive ? "text-white" : "text-ink-soft hover:text-white",
                        isOpen && "bg-white/5"
                      )}
                    >
                      {group.label}
                      <Icons.ChevronDown size={13} className={clsx("transition-transform text-ink-faint", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="absolute left-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-cream shadow-float">
                        {group.items.map((item) => {
                          const active = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={clsx(
                                "flex items-center gap-3 px-4 py-2.5 text-sm transition",
                                active ? "bg-white/5 text-white" : "text-ink-soft hover:bg-white/5 hover:text-ink"
                              )}
                            >
                              <span className="text-dusty-deep"><NavIcon name={item.icon} size={16} /></span>
                              <span className="flex-1 min-w-0">
                                <span className="block truncate font-semibold leading-tight">{item.label}</span>
                                <span className="block truncate text-[11px] text-ink-faint">{item.sub}</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search"
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/5 hover:text-white"
                >
                  <Icons.Search size={17} />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-80">
                    <GlobalSearch />
                  </div>
                )}
              </div>

              <div className="hidden sm:block"><ClientSwitcher /></div>

              {undoStack.length > 0 && (
                <button
                  onClick={() => undo()}
                  title={`Undo: ${undoStack[undoStack.length - 1].label}`}
                  className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-white sm:inline-flex"
                >
                  <Icons.Undo2 size={14} /> Undo
                </button>
              )}

              <button
                onClick={() => fetchAll()}
                disabled={loading}
                title="Refresh data"
                aria-label="Refresh data"
                className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <Icons.RefreshCw size={16} className={clsx(loading && "animate-spin")} />
              </button>

              <AccountMenu />

              <button
                className="rounded-full p-2 text-ink-soft hover:bg-white/5 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Icons.Menu size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* mobile nav overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-navy-deep/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="ml-auto flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-cloud px-4 py-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-lg text-dusty">Nox &amp; Co</span>
                <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 text-ink-soft hover:bg-white/5" aria-label="Close menu">
                  <Icons.X size={18} />
                </button>
              </div>
              <div className="mb-3 sm:hidden"><ClientSwitcher /></div>
              <nav className="space-y-4">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{group.label}</p>
                    <div className="mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={clsx(
                              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                              active ? "bg-dusty-deep text-navy-deep font-semibold" : "text-ink-soft hover:bg-white/5"
                            )}
                          >
                            <NavIcon name={item.icon} size={17} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-4 w-full max-w-7xl px-4 lg:px-8">
            <div className="rounded-2xl border border-peach bg-peach-soft px-4 py-3 text-sm text-navy-deep">
              <strong className="font-display">Couldn&apos;t reach the night sky.</strong> {error}
            </div>
          </div>
        )}

        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------------- SEARCH ---------------- */

function GlobalSearch() {
  const views = useStore((s) => s.activeViews);
  const [q, setQ] = useState("");

  const results = q.trim()
    ? views
        .filter((c) =>
          `${c.name} ${c.handle} ${c.campaign ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-cream shadow-float">
      <div className="relative">
        <Icons.Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Search the night sky…"
          className="w-full border-b border-white/10 bg-transparent py-3 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      {results.length > 0 && (
        <div className="max-h-72 overflow-y-auto">
          {results.map((c) => (
            <Link
              key={c.id}
              href={`/creators?open=${c.id}`}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-white/5"
            >
              <span className="font-semibold text-ink">{c.name}</span>
              <span className="text-xs text-ink-faint">{c.handle}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
