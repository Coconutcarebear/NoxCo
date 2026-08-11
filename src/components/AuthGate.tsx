"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const PUBLIC_ROUTES = ["/", "/about", "/services", "/contact"];
  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.includes(pathname ?? "") ||
    (pathname?.startsWith("/share") ?? false);
  const authReady = useStore((s) => s.authReady);
  const session = useStore((s) => s.session);
  const initAuth = useStore((s) => s.initAuth);
  const started = useRef(false);

  useEffect(() => {
    if (isPublic) return;
    if (!started.current) {
      started.current = true;
      initAuth();
    }
  }, [initAuth, isPublic]);

  if (isPublic) return <>{children}</>;
  if (!authReady) return <Splash />;
  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center" style={{ background: "radial-gradient(900px 600px at 50% 20%, rgba(199,201,209,0.10), transparent 60%), linear-gradient(180deg,#000000 0%,#0a0a0c 55%,#000000 100%)" }}>
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="Nox & Co" className="h-14 w-14 animate-bob rounded-xl" />
        <span className="text-sm text-ink-soft">Entering orbit…</span>
      </div>
    </div>
  );
}

function LoginScreen() {
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !email.trim() || !pw) return;
    setBusy(true);
    setErr(null);
    const e = await signIn(email, pw);
    if (e) {
      setErr(e);
      setBusy(false);
    }
    // on success the auth listener swaps this screen for the app
  }

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "radial-gradient(900px 600px at 50% 10%, rgba(199,201,209,0.10), transparent 60%), linear-gradient(180deg,#000000 0%,#0a0a0c 55%,#000000 100%)" }}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-7 shadow-float backdrop-blur-md">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Nox & Co" className="h-14 w-14 rounded-xl" />
          <div>
            <h1 className="font-display text-2xl text-dusty">Nox & Co</h1>
            <p className="text-xs text-ink-faint">Sign in to your creator universe</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
              className="w-full rounded-xl border border-sky/70 bg-cream px-3 py-2.5 text-sm text-ink outline-none focus:border-dusty-soft"
              placeholder="you@noxandco.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">Password</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-xl border border-sky/70 bg-cream px-3 py-2.5 text-sm text-ink outline-none focus:border-dusty-soft"
              placeholder="••••••••"
            />
          </label>

          {err && <p className="rounded-xl bg-peach-soft px-3 py-2 text-xs text-navy-deep">{err}</p>}

          <button
            onClick={submit}
            disabled={busy || !email.trim() || !pw}
            className="w-full rounded-xl bg-dusty-deep py-2.5 text-sm font-semibold text-navy-deep transition hover:brightness-105 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-ink-faint">
          Accounts are created by your admin in Supabase. Trouble signing in? Ask an Owner to add you.
        </p>
      </div>
    </div>
  );
}
