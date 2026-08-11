"use client";

import { useRef, useState } from "react";
import * as Icons from "lucide-react";
import { uploadImage } from "@/lib/upload";

export function ImageUpload({
  value,
  onChange,
  folder,
  shape = "rect",
  label = "image",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  shape?: "circle" | "rect";
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setErr("Image must be under 8 MB."); return; }
    setErr(null);
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  const round = shape === "circle" ? "rounded-full" : "rounded-xl";
  return (
    <div className="flex items-center gap-3">
      <div className={`relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden ${round} bg-sky/40 text-ink-soft`}>
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Icons.Image size={20} />}
        {busy && <div className="absolute inset-0 grid place-items-center bg-white/70 text-[11px] font-semibold text-ink-soft">Uploading…</div>}
      </div>
      <div className="space-y-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-dusty-deep transition hover:bg-white disabled:opacity-50"
          >
            {busy ? "Uploading…" : value ? `Replace ${label}` : `Upload ${label}`}
          </button>
          {value && !busy && (
            <button type="button" onClick={() => onChange(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-bubblegum">
              Remove
            </button>
          )}
        </div>
        {err ? <p className="text-[11px] text-bubblegum">{err}</p> : <p className="text-[11px] text-ink-faint">PNG or JPG, up to 8 MB.</p>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
