"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { usePerms } from "@/lib/perms";
import { Card, Button, Badge, Field, Input, Textarea, Select, Modal, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { money, fmtDate } from "@/lib/format";
import { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_STATUS_HUE, PROJECT_TYPE_ICON } from "@/lib/constants";

export default function ProjectsPage() {
  const { canEdit } = usePerms();
  const projects = useStore((s) => s.scopedProjects);
  const companies = useStore((s) => s.companies);
  const users = useStore((s) => s.users);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const EMPTY = {
    company_id: activeCompanyId ?? (companies[0]?.id ?? ""),
    name: "", type: PROJECT_TYPES[0] as string, status: "Planning",
    owner_id: "", start_date: "", due_date: "", budget: "", description: "", notes: "",
  };
  const [form, setForm] = useState(EMPTY);
  const modalOpen = open || editId !== null;

  const visible = useMemo(
    () => (filterStatus === "All" ? projects : projects.filter((p) => p.status === filterStatus)).filter((p) => !p.archived),
    [projects, filterStatus]
  );

  function openNew() { setForm({ ...EMPTY, company_id: activeCompanyId ?? (companies[0]?.id ?? "") }); setEditId(null); setConfirmId(null); setOpen(true); }
  function openEdit(p: (typeof projects)[number]) {
    setForm({
      company_id: p.company_id ?? "", name: p.name, type: p.type, status: p.status,
      owner_id: p.owner_id ?? "", start_date: p.start_date ?? "", due_date: p.due_date ?? "",
      budget: p.budget ? String(p.budget) : "", description: p.description ?? "", notes: p.notes ?? "",
    });
    setOpen(false); setConfirmId(null); setEditId(p.id);
  }
  function close() { setOpen(false); setEditId(null); setConfirmId(null); }

  async function save() {
    if (!form.name.trim() || !form.company_id || saving) return;
    setSaving(true);
    const patch = {
      company_id: form.company_id, name: form.name.trim(), type: form.type, status: form.status,
      owner_id: form.owner_id || null, start_date: form.start_date || null, due_date: form.due_date || null,
      budget: Number(form.budget) || 0, description: form.description || null, notes: form.notes || null,
    };
    if (editId) await updateProject(editId, patch);
    else await addProject(patch);
    setSaving(false);
    setForm(EMPTY);
    close();
  }

  const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name ?? "Unassigned";

  return (
    <div>
      <PageHeader
        title="Constellations"
        sub="Marketing & creative"
        icon="Sparkles"
        action={canEdit ? <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> Add project</Button> : undefined}
      />

      <Card className="mb-4 p-4 text-sm leading-relaxed text-ink-soft">
        <p className="mb-1 font-semibold text-ink">Beyond influencer campaigns</p>
        <p>Track SEO, paid social, social management, creative &amp; design, content, web, and any other marketing work here, separate from creator engagements in Eclipses.</p>
      </Card>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {["All", ...PROJECT_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterStatus === s ? "bg-dusty-deep text-navy-deep" : "border border-white/10 text-ink-soft hover:text-ink"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No projects yet." hint={canEdit ? "Add your first project to get started." : "Ask an editor to add a project."} action={canEdit ? <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> Add project</Button> : undefined} />
      ) : (
        <div className="space-y-10">
          {PROJECT_STATUSES.filter((st) => visible.some((p) => p.status === st)).map((status) => (
            <div key={status}>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
                {status} <span className="text-white/25">· {visible.filter((p) => p.status === status).length}</span>
              </p>
              <div className="divide-y divide-white/10 border-t border-white/10">
                {visible.filter((p) => p.status === status).map((p) => {
                  const Cmp = (Icons as Record<string, any>)[PROJECT_TYPE_ICON[p.type] ?? "Sparkles"] ?? Icons.Sparkles;
                  const owner = users.find((u) => u.id === p.owner_id);
                  return (
                    <div key={p.id} className="group flex flex-wrap items-start gap-4 py-4 sm:flex-nowrap sm:items-center">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-lavender">
                        <Cmp size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-base leading-tight text-ink">{p.name}</h2>
                          <span className="text-xs text-ink-faint">{p.type} · {companyName(p.company_id)}</span>
                        </div>
                        {p.description && <p className="mt-1 max-w-xl truncate text-xs text-ink-soft">{p.description}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-5 text-xs text-ink-soft">
                        {p.due_date && <span>Due <b className="text-ink">{fmtDate(p.due_date)}</b></span>}
                        {Number(p.budget) > 0 && <span><b className="text-ink">{money(Number(p.budget))}</b></span>}
                        {owner && <span className="hidden sm:inline">{owner.name}</span>}
                        {canEdit && (
                          <button onClick={() => openEdit(p)} aria-label="Edit project" className="text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-dusty-deep">
                            <Icons.Pencil size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={close} title={editId ? "Edit project" : "Add project"}>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus placeholder="e.g. Q3 SEO refresh" /></Field>
          <Field label="Client">
            <Select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
              <option value="" disabled>Select a client</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Due date"><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget ($)"><Input type="number" min={0} step={100} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></Field>
            <Field label="Owner">
              <Select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's this project about?" /></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional, internal only" /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {editId && (
              confirmId === editId ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs text-ink-soft">Remove project?</span>
                  <Button variant="danger" onClick={async () => { await deleteProject(editId); close(); }}>Remove</Button>
                  <Button variant="ghost" onClick={() => setConfirmId(null)}>Keep</Button>
                </span>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmId(editId)} className="text-bubblegum"><Icons.Trash2 size={15} /> Delete</Button>
              )
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim() || !form.company_id || saving}>
              {saving ? "Saving…" : editId ? <><Icons.Check size={15} /> Save</> : <><Icons.Plus size={15} /> Add project</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
