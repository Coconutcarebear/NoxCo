"use client";

import { ReactNode, useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

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

  // grouped nav, owner-only items filtered out
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.ownerOnly || isOwner) }))
    .filter((g) => g.items.length > 0);

  // collapsed groups (persisted); the group containing the active route stays open
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("sb_nav_collapsed") || "{}"); } catch { return {}; }
  });
  const toggleGroup = (label: string) =>
    setCollapsed((c) => {
      const next = { ...c, [label]: !c[label] };
      try { localStorage.setItem("sb_nav_collapsed", JSON.stringify(next)); } catch {}
      return next;
    });

  const MARKETING_ROUTES = ["/", "/about", "/services", "/contact"];
  if (pathname?.startsWith("/share") || MARKETING_ROUTES.includes(pathname ?? "")) return <>{children}</>;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background: per-page scene */}
      <RouteScene />

      {/* App UI */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-white/5 backdrop-blur-md transition-transform lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <Link
              href="/app"
              className="flex items-center gap-2.5 px-5 py-5"
              onClick={() => setOpen(false)}
            >
              <span className="flex h-10 w-10 items-center justify-center animate-bob">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Nox & Co" className="h-10 w-10 rounded-md" />
              </span>

              <span>
                <span className="block font-display text-xl leading-none text-dusty">
                  Nox & Co
                </span>
                <span className="block text-[11px] font-medium text-ink-faint">
                  Creator operations, charmed
                </span>
              </span>
            </Link>

            <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {groups.map((group) => {
                const hasActive = group.items.some((i) => i.href === pathname);
                const isCollapsed = collapsed[group.label] && !hasActive;
                return (
                  <div key={group.label}>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="group flex w-full items-center gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint transition hover:text-dusty-deep"
                    >
                      <Icons.Sparkle size={11} className="text-dusty-soft" />
                      <span className="flex-1 text-left">{group.label}</span>
                      <Icons.ChevronDown size={13} className={clsx("transition-transform", isCollapsed && "-rotate-90")} />
                    </button>

                    {!isCollapsed && (
                      <div className="mt-1 space-y-0.5 border-l border-sky/70 pl-2">
                        {group.items.map((item) => {
                          const active = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={clsx(
                                "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-all",
                                active ? "bg-dusty-deep text-white shadow-cozy" : "text-ink-soft hover:bg-sky hover:text-ink"
                              )}
                            >
                              <span className={clsx(active ? "text-white" : "text-dusty-deep")}>
                                <NavIcon name={item.icon} size={17} />
                              </span>
                              <span className="flex-1">
                                <span className="block font-semibold leading-tight">{item.label}</span>
                                <span className={clsx("block text-[11px]", active ? "text-white/75" : "text-ink-faint")}>{item.sub}</span>
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

            <div className="shrink-0 px-5 py-4 text-[11px] text-ink-faint">
              Under the stars · Creator ops
            </div>
          </div>
        </aside>

        {/* mobile overlay */}
        {open && (
          <div
            className="fixed inset-0 z-30 bg-navy-deep/20 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-cloud/80 px-4 py-3 backdrop-blur-md lg:px-8">
            <button
              className="rounded-full p-2 text-ink-soft hover:bg-cream lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Icons.Menu size={20} />
            </button>

            <GlobalSearch />

            <div className="ml-auto flex items-center gap-2">
              <ClientSwitcher />

              {undoStack.length > 0 && (
                <button
                  onClick={() => undo()}
                  title={`Undo: ${undoStack[undoStack.length - 1].label}`}
                  className="hidden items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-dusty-deep shadow-pill transition hover:brightness-105 sm:inline-flex"
                >
                  <Icons.Undo2 size={14} /> Undo
                </button>
              )}

              <button
                onClick={() => fetchAll()}
                disabled={loading}
                title="Refresh data"
                aria-label="Refresh data"
                className="grid h-9 w-9 place-items-center rounded-full bg-cream text-dusty-deep shadow-pill transition hover:brightness-105 disabled:opacity-60"
              >
                <Icons.RefreshCw size={16} className={clsx(loading && "animate-spin")} />
              </button>

              <span className="hidden items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-pill sm:inline-flex">
                <Icons.Sun size={14} className="text-butter" />
                Clear skies
              </span>

              <AccountMenu />
            </div>
          </header>

          {error && (
            <div className="mx-4 mt-4 rounded-2xl border border-peach bg-peach-soft px-4 py-3 text-sm text-navy-deep lg:mx-8">
              <strong className="font-display">
                Couldn&apos;t reach the night sky.
              </strong>{" "}
              {error}
            </div>
          )}

          <main className="relative z-10 flex-1 px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
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
    <div className="relative w-full max-w-md">
      <Icons.Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the night sky…"
        className="w-full rounded-full border border-white bg-white/5 py-2 pl-9 pr-3 text-sm text-ink shadow-pill outline-none placeholder:text-ink-faint focus:border-dusty-soft"
      />

      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white bg-cream shadow-float">
          {results.map((c) => (
            <Link
              key={c.id}
              href={`/creators?open=${c.id}`}
              onClick={() => setQ("")}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-sky"
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
