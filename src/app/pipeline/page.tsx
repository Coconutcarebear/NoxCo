"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { type EngagementView, type Stage } from "@/lib/types";
import { STAGES, STAGE_HUE, STAGE_MEANING } from "@/lib/constants";
import { money, relativeDay, initials } from "@/lib/format";
import { Badge, Pill } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

export default function BloomBoardPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const moveStage = useStore((s) => s.moveStage);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  const active = views;
  const grouped = useMemo(() => {
    const g: Record<string, EngagementView[]> = {};
    STAGES.forEach((s) => (g[s] = []));
    active.forEach((c) => { (g[c.stage] ??= []).push(c); });
    return g;
  }, [active]);

  const onDrop = (stage: Stage) => {
    if (dragId) moveStage(dragId, stage);
    setDragId(null);
    setOverStage(null);
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <PageHeader title="Star Chart" sub="Pipeline" icon="Sprout" action={<Pill>Drag a star to grow its journey</Pill>} />

      <div className="flex flex-1 gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = grouped[stage] ?? [];
          const isOver = overStage === stage;
          const isWreck = stage === "Star-Crossed";
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => onDrop(stage)}
              className={`flex w-72 shrink-0 flex-col rounded-3xl border transition ${isWreck ? "border-dashed border-slate-300 bg-slate-500/[0.06]" : "border-white/10 bg-white/5"} ${isOver ? "border-dusty ring-2 ring-dusty-soft" : ""}`}
            >
              <div className="flex items-center gap-2 px-3 py-3">
                {isWreck ? <Icons.CloudRain size={14} className="text-slate-400" /> : <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STAGE_HUE[stage] }} />}
                <span className="font-display text-sm text-ink">{stage}</span>
                <Pill className="ml-auto">{items.length}</Pill>
              </div>
              <div className="px-3 pb-1 text-[11px] text-ink-faint">{STAGE_MEANING[stage]}</div>

              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-dusty-soft/70 py-8 text-center text-xs text-ink-faint">
                    {isWreck ? "nothing star-crossed" : "nothing here yet"}
                  </div>
                ) : (
                  items.map((c) => (
                    <article
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      onClick={() => setOpenId(c.id)}
                      className={`constellation cursor-pointer rounded-2xl border border-white bg-cream p-3 shadow-pill transition hover:shadow-cozy ${dragId === c.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lavender text-xs font-bold text-navy-deep">{initials(c.name)}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                          <div className="truncate text-xs text-ink-faint">{c.handle}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {c.campaign && <Badge hue={STAGE_HUE[stage]}>{c.campaign}</Badge>}
                        <Pill>{money(c.creator_fee)}</Pill>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-faint">
                        <span className="flex items-center gap-1"><Icons.Clock size={11} /> {c.last_follow_up ? relativeDay(c.last_follow_up) : "no contact"}</span>
                        {c.status_tag && <span>{c.status_tag}</span>}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}
