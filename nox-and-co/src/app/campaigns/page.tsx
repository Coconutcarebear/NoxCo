"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { usePerms } from "@/lib/perms";
import { totalSpendOf } from "@/lib/budget";
import { money, compactMoney, fmtDate } from "@/lib/format";
import { Card, Badge, Pill, BloomBar, EmptyState, Modal, Field, Input, Select, Button } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { STAGE_HUE } from "@/lib/constants";
import { CreatorSlideOver } from "@/components/CreatorSlideOver";

const HUES = ["#B7C8EA", "#CDB4F0", "#9FE0CE", "#FDE68A", "#FFC9DE", "#FFD0A0", "#A9D2F4", "#F0A9C4"];

export default function BouquetsPage() {
  const active = useStore((s) => s.scopedActiveViews);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const companies = useStore((s) => s.companies);
  const addCampaign = useStore((s) => s.addCampaign);
  const updateCampaign = useStore((s) => s.updateCampaign);
  const deleteCampaign = useStore((s) => s.deleteCampaign);
  const { canEdit } = usePerms();
  const activeCompanyId = useStore((s) => s.activeCompanyId);

  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const userSettings = useStore((s) => s.userSettings);
  const saveUserSettings = useStore((s) => s.saveUserSettings);
  const minimized = Array.isArray(userSettings.bouquetsMinimized) ? (userSettings.bouquetsMinimized as string[]) : [];
  const minimize = (id: string) => saveUserSettings({ bouquetsMinimized: minimized.includes(id) ? minimized : [...minimized, id] });
  const restore = (id: string) => saveUserSettings({ bouquetsMinimized: minimized.filter((x) => x !== id) });

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const EMPTY_FORM = { name: "", budget: "", color: HUES[0], company_id: "", start_date: "", end_date: "" };
  const [form, setForm] = useState(EMPTY_FORM);

  const modalOpen = showNew || editId !== null;

  function openNew() {
    setForm({ ...EMPTY_FORM, company_id: activeCompanyId ?? "" });
    setEditId(null);
    setConfirmDelete(false);
    setShowNew(true);
  }

  function openEdit(cam: (typeof campaigns)[number]) {
    setForm({
      name: cam.name ?? "",
      budget: cam.fy_budget_allocation != null ? String(cam.fy_budget_allocation) : "",
      color: cam.color || HUES[0],
      company_id: cam.company_id ?? "",
      start_date: cam.start_date ?? "",
      end_date: cam.end_date ?? "",
    });
    setShowNew(false);
    setConfirmDelete(false);
    setEditId(cam.id);
  }

  function closeModal() {
    setShowNew(false);
    setEditId(null);
    setConfirmDelete(false);
  }

  const rows = useMemo(() => {
    return campaigns.map((cam) => {
      const crew = active.filter((c) => c.campaign_id === cam.id);
      const creatorSpend = crew.reduce((s, c) => s + Number(c.creator_fee ?? 0), 0);
      const boostSpend = crew.reduce((s, c) => s + Number(c.boost_spend ?? 0), 0);
      const spent = creatorSpend + boostSpend;
      const company = companies.find((co) => co.id === cam.company_id) ?? null;
      return { cam, crew, creatorSpend, boostSpend, spent, avg: crew.length ? spent / crew.length : 0, company };
    });
  }, [campaigns, active, companies]);

  async function saveBouquet() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const patch = {
      name: form.name.trim(),
      fy_budget_allocation: Number(form.budget) || 0,
      color: form.color,
      company_id: form.company_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };
    if (editId) await updateCampaign(editId, patch);
    else await addCampaign(patch);
    setSaving(false);
    setForm(EMPTY_FORM);
    closeModal();
  }

  async function removeBouquet() {
    if (!editId || saving) return;
    setSaving(true);
    await deleteCampaign(editId);
    setSaving(false);
    setForm(EMPTY_FORM);
    closeModal();
  }

  return (
    <div>
      <PageHeader
        title="Eclipses"
        sub="Campaigns"
        icon="Flower"
        action={
          <div className="flex items-center gap-2">
            <Pill>{campaigns.length} eclipses</Pill>
            {canEdit && <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> New eclipse</Button>}
          </div>
        }
      />

      {minimized.length > 0 && (
        <div className="mb-5 flex flex-wrap items-end gap-x-7 gap-y-4 rounded-3xl border border-sky/50 bg-white/5 px-5 py-5">
          <span className="w-full text-xs uppercase tracking-wide text-ink-faint">Minimized — tap a star to bring it back</span>
          {campaigns.filter((c) => minimized.includes(c.id)).map((cam, i) => (
            <button key={cam.id} type="button" onClick={() => restore(cam.id)} title={`Restore ${cam.name}`} className="group flex w-16 flex-col items-center gap-1">
              <span className="animate-bob" style={{ animationDelay: `${(i % 6) * 0.35}s`, color: cam.color }}>
                <Icons.Star size={34} fill="currentColor" strokeWidth={1} className="drop-shadow transition group-hover:scale-110" />
              </span>
              <span className="max-w-full truncate text-center text-[11px] font-semibold text-ink">{cam.name}</span>
            </button>
          ))}
        </div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          title="No eclipses charted yet."
          hint="Chart your first eclipse to start grouping creators."
          action={canEdit ? <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> New eclipse</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.filter(({ cam }) => !minimized.includes(cam.id)).map(({ cam, crew, creatorSpend, boostSpend, spent, avg, company }) => {
            const util = cam.fy_budget_allocation ? spent / cam.fy_budget_allocation : 0;
            const over = spent > cam.fy_budget_allocation;
            const isOpen = expanded === cam.id;
            return (
              <Card key={cam.id} className="overflow-hidden p-0">
                <div className="p-5" style={{ background: `linear-gradient(120deg, ${cam.color}33, #111114)` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: cam.color }} />
                      <h2 className="font-display text-lg text-ink">{cam.name}</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Pill>{crew.length} {crew.length === 1 ? "star" : "stars"}</Pill>
                      <button onClick={() => minimize(cam.id)} aria-label="Minimize to a star" title="Minimize to a star" className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-white/5 hover:text-dusty-deep">
                        <Icons.Star size={14} />
                      </button>
                      {canEdit && <button onClick={() => openEdit(cam)} aria-label="Edit eclipse" title="Edit eclipse" className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition hover:bg-white/5 hover:text-dusty-deep">
                        <Icons.Pencil size={14} />
                      </button>}
                    </div>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-faint">
                    {company && <span>{company.name}</span>}
                    {(cam.start_date || cam.end_date) && (
                      <span>{fmtDate(cam.start_date)}{cam.end_date ? ` → ${fmtDate(cam.end_date)}` : ""}</span>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
                      <span>{money(spent)} of {money(cam.fy_budget_allocation)}</span>
                      <span className={over ? "font-semibold text-bubblegum" : "text-seafoam-deep"}>{(util * 100).toFixed(0)}%</span>
                    </div>
                    <BloomBar value={util} hue={over ? "#FFC9DE" : cam.color} height={12} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Creator" value={compactMoney(creatorSpend)} />
                    <Stat label="Boost" value={compactMoney(boostSpend)} />
                    <Stat label="Avg / star" value={compactMoney(avg)} />
                  </div>
                </div>

                <button onClick={() => setExpanded(isOpen ? null : cam.id)} className="flex w-full items-center justify-center gap-1 border-t border-sky/70 py-2.5 text-sm font-semibold text-dusty-deep hover:bg-sky/40">
                  {isOpen ? "Hide creators" : "View creators"} <Icons.ChevronDown size={15} className={isOpen ? "rotate-180 transition" : "transition"} />
                </button>

                {isOpen && (
                  <ul className="divide-y divide-sky/70">
                    {crew.length === 0 ? (
                      <li className="px-5 py-4 text-center text-sm text-ink-soft">No stars in this eclipse yet.</li>
                    ) : (
                      crew.map((c) => (
                        <li key={c.id}>
                          <button onClick={() => setOpenId(c.id)} className="flex w-full items-center justify-between px-5 py-2.5 text-left text-sm hover:bg-sky/40">
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-ink">{c.name}</span>
                              <span className="block truncate text-xs text-ink-faint">{c.handle}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Badge hue={STAGE_HUE[c.stage]}>{c.stage}</Badge>
                              <span className="font-semibold text-ink">{money(totalSpendOf(c))}</span>
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editId ? "Edit eclipse" : "Chart a new eclipse"}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Walking Tours" /></Field></div>
          <Field label="Company">
            <Select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
              <option value="">— None —</option>
              {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
            </Select>
          </Field>
          <Field label="Budget ($)"><Input type="number" min={0} step={100} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></Field>
          <Field label="Start date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="End date"><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field>
          <div className="col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Color</span>
            <div className="flex flex-wrap gap-2">
              {HUES.map((h) => (
                <button key={h} onClick={() => setForm({ ...form, color: h })} aria-label={`Color ${h}`} className={`h-7 w-7 rounded-full transition ${form.color === h ? "ring-2 ring-navy/40 ring-offset-2" : ""}`} style={{ backgroundColor: h }} />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {editId && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-soft">Remove this eclipse?</span>
                  <Button variant="danger" onClick={removeBouquet} disabled={saving}>Yes, remove</Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep</Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-bubblegum">
                  <Icons.Trash2 size={15} /> Delete
                </Button>
              )
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={saveBouquet} disabled={!form.name.trim() || saving}>
              {saving ? "Saving…" : editId ? <><Icons.Check size={15} /> Save changes</> : <><Icons.Plus size={15} /> Chart eclipse</>}
            </Button>
          </div>
        </div>
      </Modal>

      <CreatorSlideOver engagementId={openId} onClose={() => setOpenId(null)} onSwitch={setOpenId} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 py-2">
      <div className="font-display text-base text-ink">{value}</div>
      <div className="text-[11px] text-ink-soft">{label}</div>
    </div>
  );
}
