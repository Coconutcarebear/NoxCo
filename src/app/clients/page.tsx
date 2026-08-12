"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { usePerms } from "@/lib/perms";
import { Card, Button, Badge, Field, Input, Textarea, Select, Modal, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { money } from "@/lib/format";

const PRIORITIES = ["High", "Normal", "Low"];
const PRIO_HUE: Record<string,string> = { High: "#FFC9DE", Normal: "#B7C8EA", Low: "#C7D0E0" };
const PRIO_RANK: Record<string,number> = { High: 0, Normal: 1, Low: 2 };

const CLIENT_HUES = ["#8FA8D8", "#9FE0CE", "#CDB4F0", "#FDE68A", "#FFC9DE", "#FFD0A0", "#A9D2F4", "#F0A9C4"];

export default function ClientsPage() {
  const { canEdit } = usePerms();
  const companies = useStore((s) => s.companies);
  const campaigns = useStore((s) => s.campaigns);
  const users = useStore((s) => s.users);
  const addCompany = useStore((s) => s.addCompany);
  const updateCompany = useStore((s) => s.updateCompany);
  const deleteCompany = useStore((s) => s.deleteCompany);
  const inviteClientUser = useStore((s) => s.inviteClientUser);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const EMPTY = { name: "", kind: "Client", color: CLIENT_HUES[0], budget: "", priority: "Normal", notes: "" };
  const [form, setForm] = useState(EMPTY);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const modalOpen = open || editId !== null;
  const countFor = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of campaigns) if (c.company_id) m.set(c.company_id, (m.get(c.company_id) ?? 0) + 1);
    return m;
  }, [campaigns]);

  function openNew() { setForm(EMPTY); setEditId(null); setConfirmId(null); setOpen(true); }
  function openEdit(co: (typeof companies)[number]) {
    setForm({ name: co.name, kind: co.kind || "Client", color: co.color || CLIENT_HUES[0], budget: co.budget ? String(co.budget) : "", priority: co.priority || "Normal", notes: co.notes ?? "" });
    setOpen(false); setConfirmId(null); setEditId(co.id);
    setInviteEmail(""); setInviteName(""); setInviteMsg(null);
  }
  function close() { setOpen(false); setEditId(null); setConfirmId(null); setInviteEmail(""); setInviteName(""); setInviteMsg(null); }

  async function save() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const patch = { name: form.name.trim(), kind: form.kind, color: form.color, budget: Number(form.budget) || 0, priority: form.priority, notes: form.notes || null };
    if (editId) {
      await updateCompany(editId, patch);
      setSaving(false);
      setForm(EMPTY);
      close();
    } else {
      const created = await addCompany(patch);
      setSaving(false);
      setForm(EMPTY);
      // stay open, scoped to the new company, so you can invite them to their portal next
      if (created) { setOpen(false); setEditId(created.id); } else close();
    }
  }

  async function sendInvite() {
    if (!editId || !inviteEmail.trim() || inviting) return;
    setInviting(true);
    setInviteMsg(null);
    const u = await inviteClientUser(editId, inviteEmail.trim(), inviteName.trim() || undefined);
    setInviting(false);
    if (u) {
      setInviteEmail(""); setInviteName("");
      setInviteMsg(`Portal access created for ${u.email}. Have them visit the login page and choose "Set your password" with this exact email.`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        sub="Companies"
        icon="Building2"
        action={canEdit ? <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> Add client</Button> : undefined}
      />

      <Card className="mb-4 p-4 text-sm leading-relaxed text-ink-soft">
        <p className="mb-1 font-semibold text-ink">Run creator ops for more than one client</p>
        <p>Add a client here, then assign eclipses to it in the Eclipses tab. <strong className="text-ink">In-house</strong> marks your own organization; <strong className="text-ink">Client</strong> is an outside partner you run campaigns for.</p>
      </Card>

      {companies.length === 0 ? (
        <EmptyState title="No clients yet." hint={canEdit ? "Add your first client to get started." : "Ask an editor to add a client."} action={canEdit ? <Button variant="primary" onClick={openNew}><Icons.Plus size={15} /> Add client</Button> : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...companies].sort((a,b)=>(PRIO_RANK[a.priority]??1)-(PRIO_RANK[b.priority]??1) || a.name.localeCompare(b.name)).map((co) => (
            <Card key={co.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: co.color || CLIENT_HUES[0] }}>
                  <Icons.Building2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-lg leading-tight text-ink">{co.name}</h2>
                    {canEdit && (
                      <button onClick={() => openEdit(co)} aria-label="Edit client" className="ml-auto text-ink-faint transition hover:text-dusty-deep">
                        <Icons.Pencil size={14} />
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge hue={co.kind === "In-house" ? "#9FE0CE" : "#B7C8EA"}>{co.kind || "Client"}</Badge>
                    <span className="text-xs text-ink-faint">{countFor.get(co.id) ?? 0} eclipse{(countFor.get(co.id) ?? 0) === 1 ? "" : "s"}</span>
                    {co.priority && co.priority !== "Normal" && <Badge hue={PRIO_HUE[co.priority] ?? "#B7C8EA"}>{co.priority}</Badge>}
                  </div>
                  {Number(co.budget) > 0 && <p className="mt-1.5 text-xs text-ink-soft">Budget: <b className="text-ink">{money(Number(co.budget))}</b></p>}
                  {co.notes && <p className="mt-2 text-xs text-ink-soft">{co.notes}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={close} title={editId ? "Edit client" : "Add client"}>
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus placeholder="e.g. Nightfall Hospitality Group" /></Field>
          <Field label="Type">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="In-house">In-house (your own org)</option>
              <option value="Client">Client (outside partner)</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget ($)" hint="Drives this client's dashboard.">
              <Input type="number" min={0} step={100} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Color">
            <div className="flex flex-wrap gap-2 pt-1">
              {CLIENT_HUES.map((h) => (
                <button key={h} onClick={() => setForm({ ...form, color: h })} aria-label={`Color ${h}`}
                  className={`h-7 w-7 rounded-full transition hover:scale-110 ${form.color === h ? "ring-2 ring-dusty-deep ring-offset-1" : ""}`} style={{ background: h }} />
              ))}
            </div>
          </Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></Field>
        </div>
        {editId && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Client portal access</p>
            <p className="mb-3 text-xs text-ink-soft">
              Give this client a login that only ever sees {form.name || "their"} campaigns, projects, and reports, nothing else in Nox &amp; Co.
            </p>
            {users.filter((u) => u.role === "Client" && u.company_id === editId).length > 0 && (
              <div className="mb-3 space-y-1.5">
                {users.filter((u) => u.role === "Client" && u.company_id === editId).map((u) => (
                  <div key={u.id} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs">
                    <Icons.UserCheck size={13} className="text-seafoam-deep" />
                    <span className="text-ink">{u.name}</span>
                    <span className="text-ink-faint">{u.email}</span>
                    <span className="ml-auto text-ink-faint">{u.auth_id ? "Active" : "Invited, awaiting sign-up"}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="client@theirbrand.com" type="email" />
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Contact name (optional)" />
            </div>
            <Button variant="soft" className="mt-2" onClick={sendInvite} disabled={!inviteEmail.trim() || inviting}>
              {inviting ? "Creating…" : <><Icons.Send size={14} /> Create portal login</>}
            </Button>
            {inviteMsg && <p className="mt-2 text-xs leading-relaxed text-seafoam-deep">{inviteMsg}</p>}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {editId && (
              confirmId === editId ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs text-ink-soft">Remove client?</span>
                  <Button variant="danger" onClick={async () => { await deleteCompany(editId); close(); }}>Remove</Button>
                  <Button variant="ghost" onClick={() => setConfirmId(null)}>Keep</Button>
                </span>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmId(editId)} className="text-bubblegum"><Icons.Trash2 size={15} /> Delete</Button>
              )
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.name.trim() || saving}>
              {saving ? "Saving…" : editId ? <><Icons.Check size={15} /> Save</> : <><Icons.Plus size={15} /> Add client</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
