"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { CONTRACT_STATUSES } from "@/lib/constants";
import { money, fmtDate, initials } from "@/lib/format";
import { Card, Badge, Pill, Button, EmptyState } from "@/components/ui";
import { PageHeader, KpiCard } from "@/components/widgets";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

const HUE: Record<string, string> = { "Not Sent": "#B7C8EA", Sent: "#FDE68A", Signed: "#9FE0CE" };

export default function DockyardPage() {
  const views = useStore((s) => s.scopedActiveViews);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const active = views.filter((v) => !v.is_organic);
  const list = useMemo(() => (filter ? active.filter((c) => c.contract_status === filter) : active), [active, filter]);

  const sent = active.filter((c) => c.contract_status === "Sent").length;
  const signed = active.filter((c) => c.contract_status === "Signed").length;
  const notSent = active.filter((c) => c.contract_status === "Not Sent").length;
  const signedValue = active.filter((c) => c.contract_status === "Signed").reduce((s, c) => s + Number(c.total_creator_cost ?? 0), 0);

  return (
    <div>
      <PageHeader title="The Vault" sub="Contracts" icon="ScrollText" />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Awaiting signature" value={String(sent)} icon="PenLine" hue="#FEF3C7" />
        <KpiCard label="Signed & onboard" value={String(signed)} icon="CheckCheck" hue="#C9F0E6" />
        <KpiCard label="Not yet sent" value={String(notSent)} icon="FileClock" hue="#B7C8EA" />
        <KpiCard label="Signed value" value={money(signedValue)} icon="ShieldCheck" hue="#E4D6F7" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button variant={filter === "" ? "primary" : "soft"} onClick={() => setFilter("")}>All</Button>
        {CONTRACT_STATUSES.map((s) => (
          <Button key={s} variant={filter === s ? "primary" : "soft"} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="The vault is quiet." hint="No contracts match this filter." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Creator</th>
                  <th className="px-3 py-3 font-semibold">Eclipse</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Sent</th>
                  <th className="px-3 py-3 font-semibold">Signed</th>
                  <th className="px-3 py-3 text-right font-semibold">Contract value</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer border-t border-sky/80 hover:bg-sky/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-lavender text-xs font-bold text-navy-deep">{initials(c.name)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{c.name}</span>
                          <span className="block truncate text-xs text-ink-faint">{c.handle}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{c.campaign ?? "—"}</td>
                    <td className="px-3 py-2.5"><Badge hue={HUE[c.contract_status]}>{c.contract_status}</Badge></td>
                    <td className="px-3 py-2.5 text-ink-soft">{fmtDate(c.contract_sent_date)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{fmtDate(c.contract_signed_date)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-ink">{money(c.total_creator_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}
