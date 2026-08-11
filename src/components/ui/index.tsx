"use client";

import { ReactNode, useEffect } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { StarFlower } from "@/components/decor";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-4xl border border-white/10 bg-white/5 shadow-cozy", className)}>
      {children}
    </div>
  );
}

type BtnVariant = "primary" | "soft" | "ghost" | "danger";
export function Button({
  children, onClick, variant = "soft", className, type = "button", disabled, title,
}: {
  children: ReactNode; onClick?: () => void; variant?: BtnVariant;
  className?: string; type?: "button" | "submit"; disabled?: boolean; title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";
  const styles: Record<BtnVariant, string> = {
    primary: "bg-dusty-deep text-white hover:bg-navy shadow-cozy",
    soft: "bg-cream text-ink border border-dusty-soft hover:border-dusty hover:bg-sky",
    ghost: "bg-transparent text-ink-soft hover:bg-white/5",
    danger: "bg-bubblegum text-navy-deep hover:bg-bubblegum-soft border border-bubblegum",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={clsx(base, styles[variant], className)}>
      {children}
    </button>
  );
}

export function Badge({ children, hue, className }: { children: ReactNode; hue?: string; className?: string }) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-navy-deep", className)}
      style={{ backgroundColor: hue ? `${hue}` : "#C7C9D1" }}
    >
      {children}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-ink-soft border border-white", className)}>
      {children}
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

const inputCx =
  "w-full rounded-2xl border border-dusty-soft bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-dusty focus:ring-2 focus:ring-dusty-soft/60 transition";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputCx, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(inputCx, "min-h-[80px] resize-y", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(inputCx, "appearance-none cursor-pointer", props.className)} />;
}

// A progress bar, value rising toward the budget line.
export function BloomBar({ value, hue = "#C7C9D1", height = 10 }: { value: number; hue?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="w-full overflow-hidden rounded-full bg-sky" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${hue}, ${hue}cc)` }}
      />
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-dashed border-dusty-soft bg-white/5 py-16 text-center">
      <div className="animate-bob">
        <StarFlower size={48} />
      </div>
      <p className="font-display text-lg text-ink">{title}</p>
      {hint && <p className="max-w-xs text-sm text-ink-soft">{hint}</p>}
      {action}
    </div>
  );
}

export function SlideOver({
  open, onClose, title, subtitle, children, footer,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: ReactNode;
  children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy-deep/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-cloud shadow-float animate-rise">
        <div className="flex items-start justify-between gap-3 border-b border-dusty-soft/60 bg-white/5 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl text-ink">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-ink-soft">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-ink-soft hover:bg-sky" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-dusty-soft/60 bg-white/5 px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-deep/20 backdrop-blur-[2px]" onClick={onClose} />
      <Card className="relative w-full max-w-lg animate-rise bg-cloud p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-ink-soft hover:bg-sky" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
