"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { PUBLISHED_STAGES, STAGE_HUE } from "@/lib/constants";
import { pct, num, money, initials } from "@/lib/format";
import { Card, Badge, Pill, Button, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

const PLATFORM_ICON: Record<string, string> = { TikTok: "Music2", Instagram: "Instagram", YouTube: "Youtube", "Multi-platform": "Globe" };

export default function StarGalleryPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const [openId, setOpenId] = useState<string | null>(null);
  const [platform, setPlatform] = useState("");

  const published = useMemo(
    () => views.filter((c) => PUBLISHED_STAGES.includes(c.stage) && (platform ? c.platform === platform : true)),
    [views, platform]
  );

  const platforms = useMemo(() => Array.from(new Set(views.map((c) => c.platform))), [views]);

  return (
    <div>
      <PageHeader title="Star Gallery" sub="Content" icon="Images" action={<Pill>{published.length} live</Pill>} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={platform === "" ? "primary" : "soft"} onClick={() => setPlatform("")}>All platforms</Button>
        {platforms.map((p) => (
          <Button key={p} variant={platform === p ? "primary" : "soft"} onClick={() => setPlatform(p)}>{p}</Button>
        ))}
      </div>

      {published.length === 0 ? (
        <EmptyState title="No stars launched yet." hint="Content shows up here once a creator reaches Star Launched." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((c) => {
            const PIcon = (Icons as Record<string, any>)[PLATFORM_ICON[c.platform]] ?? Icons.Globe;
            return (
              <button key={c.id} onClick={() => setOpenId(c.id)} className="constellation overflow-hidden rounded-4xl border border-white bg-white text-left shadow-cozy transition hover:shadow-float">
                <div className="relative flex h-32 items-center justify-center" style={{ background: `linear-gradient(135deg, ${STAGE_HUE[c.stage]}, #ffffff)` }}>
                  {c.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.profile_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-lg font-bold text-navy-deep">{initials(c.name)}</span>
                  )}
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-navy-deep"><PIcon size={15} /></span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-display text-base text-ink">{c.name}</span>
                    <Badge hue={STAGE_HUE[c.stage]}>{c.stage}</Badge>
                  </div>
                  <div className="text-xs text-ink-faint">{c.handle}</div>
                  <div className="mt-2 text-sm text-ink-soft">{c.deliverables ?? "—"}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-sky/70 pt-2 text-xs text-ink-soft">
                    <span><b className="text-ink">{num(c.followers)}</b> followers</span>
                    <span><b className="text-ink">{pct(c.engagement_rate, 1)}</b> eng.</span>
                    <span className="text-seafoam-deep font-semibold">{money(c.boost_spend)} boost</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}
