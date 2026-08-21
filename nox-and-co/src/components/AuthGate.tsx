"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { TwinkleCluster } from "@/components/marketing/TwinkleCluster";
import { ClientPortal } from "@/components/ClientPortal";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const PUBLIC_ROUTES = ["/", "/about", "/services", "/contact"];
  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.includes(pathname ?? "") ||
    (pathname?.startsWith("/share") ?? false);
  const authReady = useStore((s) => s.authReady);
  const session = useStore((s) => s.session);
  const currentUser = useStore((s) => s.currentUser);
  const unauthorized = useStore((s) => s.unauthorized);
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
  if (unauthorized) return <NoAccessScreen />;
  if (!session) return <LoginScreen />;
  // Client-role accounts always see the portal, never the internal CRM,
  // no matter which internal URL they land on.
  if (currentUser?.role === "Client") return <ClientPortal />;
  return <>{children}</>;
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center" style={{ background: "radial-gradient(900px 600px at 50% 20%, rgba(90,110,160,0.10), transparent 60%), linear-gradient(180deg,#03040a 0%,#0a0e1a 55%,#03040a 100%)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-28 w-28">
          <TwinkleCluster count={20} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Nox & Co" className="relative h-full w-full rounded-2xl object-cover shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]" />
        </div>
        <span className="text-sm text-ink-soft">Entering orbit…</span>
      </div>
    </div>
  );
}

function NoAccessScreen() {
  const signOut = useStore((s) => s.signOut);
  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "radial-gradient(900px 600px at 50% 10%, rgba(90,110,160,0.10), transparent 60%), linear-gradient(180deg,#03040a 0%,#0a0e1a 55%,#03040a 100%)" }}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-7 text-center shadow-float backdrop-blur-md">
        <h1 className="font-display text-xl text-dusty">No portal set up yet</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          This email doesn&apos;t have access to a Nox &amp; Co account or client portal. Ask your Nox &amp; Co contact to set one up for you, then try signing in again.
        </p>
        <button
          onClick={signOut}
          className="mt-5 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-white/5 hover:text-white"
        >
          Try a different account
        </button>
      </div>
    </div>
  );
}

function LoginScreen() {
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !email.trim() || !pw) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    if (mode === "up") {
      const e = await signUp(email, pw);
      setBusy(false);
      if (e) { setErr(e); return; }
      setNotice("Check your email to confirm your account, then sign in below.");
      setMode("in");
      return;
    }
    const e = await signIn(email, pw);
    if (e) {
      setErr(e);
      setBusy(false);
    }
    // on success the auth listener swaps this screen for the app / portal
  }

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "radial-gradient(900px 600px at 50% 10%, rgba(90,110,160,0.10), transparent 60%), linear-gradient(180deg,#03040a 0%,#0a0e1a 55%,#03040a 100%)" }}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-7 shadow-float backdrop-blur-md">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="relative h-24 w-24">
            <TwinkleCluster count={16} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Nox & Co" className="relative h-full w-full rounded-2xl object-cover shadow-[0_16px_50px_-18px_rgba(0,0,0,0.8)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-dusty">Nox & Co</h1>
            <p className="text-xs text-ink-faint">{mode === "up" ? "Set up your portal password" : "Sign in to your creator universe"}</p>
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
          {notice && <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-ink-soft">{notice}</p>}

          <button
            onClick={submit}
            disabled={busy || !email.trim() || !pw}
            className="w-full rounded-xl bg-dusty-deep py-2.5 text-sm font-semibold text-navy-deep transition hover:brightness-105 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "up" ? "Create password" : "Sign in"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-ink-faint">
          {mode === "up" ? (
            <>Already set up? <button onClick={() => { setMode("in"); setErr(null); setNotice(null); }} className="font-semibold text-dusty hover:text-white">Sign in instead</button></>
          ) : (
            <>First time here? Your account needs to already be invited by Nox &amp; Co.{" "}
              <button onClick={() => { setMode("up"); setErr(null); setNotice(null); }} className="font-semibold text-dusty hover:text-white">Set your password</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
