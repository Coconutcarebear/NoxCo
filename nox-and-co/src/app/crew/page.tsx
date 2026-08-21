"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { usePerms } from "@/lib/perms";
import { USER_ROLES } from "@/lib/constants";
import { Card, Button, Badge, Field, Input, Select, Modal, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/widgets";

export default function CrewPage() {
  const { isOwner } = usePerms();
  const users = useStore((s) => s.users);
  const me = useStore((s) => s.currentUser);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const deleteUser = useStore((s) => s.deleteUser);

  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Viewer" });

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Night Owls" sub="Users & roles" icon="Users" />
        <EmptyState title="Owner access only" hint="Ask an Owner if you need to manage the team." />
      </div>
    );
  }

  async function add() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    await addUser({ name: form.name.trim(), email: form.email.trim() || null, role: form.role });
    setSaving(false);
    setForm({ name: "", email: "", role: "Viewer" });
    setOpen(false);
  }

  const roleHue: Record<string, string> = { Owner: "#E5E6EA", Editor: "#B3B5BE", Viewer: "#8A8C96" };

  return (
    <div>
      <PageHeader
        title="Night Owls"
        sub="Users & roles"
        icon="Users"
        action={<Button variant="primary" onClick={() => setOpen(true)}><Icons.UserPlus size={15} /> Add member</Button>}
      />

      <Card className="mb-4 p-4 text-sm leading-relaxed text-ink-soft">
        <p className="mb-2 font-semibold text-ink">How roles work</p>
        <ul className="space-y-1">
          <li><strong className="text-ink">Owner</strong>, manages everyone &amp; settings</li>
          <li><strong className="text-ink">Editor</strong>, creates &amp; edits content</li>
          <li><strong className="text-ink">Viewer</strong>, read-only</li>
        </ul>
        <p className="mt-3 text-ink-faint">
          New logins are created in Supabase (Authentication → Users). Set someone&apos;s email here to the same address and their account links automatically on first sign-in.
        </p>
      </Card>

      {users.length === 0 ? (
        <EmptyState title="No team members yet." hint="Add a member to assign a role." />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-sky/70 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-3 py-3 font-semibold">Login</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <tr key={u.id} className="border-t border-sky/80">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-navy-deep text-lavender" aria-hidden>
                            {(() => { const Cmp = (Icons as Record<string, any>)[u.emoji || "Star"] ?? Icons.Star; return <Cmp size={16} />; })()}
                          </span>
                          <div className="min-w-0">
                            <input
                              defaultValue={u.name}
                              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== u.name) updateUser(u.id, { name: v }); }}
                              className="w-full max-w-[180px] rounded-md border border-transparent bg-transparent px-1 py-0.5 font-semibold text-ink outline-none hover:border-sky/70 focus:border-dusty-soft focus:bg-cream"
                            />
                            <div className="truncate px-1 text-xs text-ink-faint">{u.email || "no email"} {isSelf && "· you"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {u.auth_id ? <Badge hue="#C7C9D1">Linked</Badge> : <span className="text-xs text-ink-faint">Not linked</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <Select
                          value={USER_ROLES.includes(u.role as (typeof USER_ROLES)[number]) ? u.role : "Viewer"}
                          onChange={(e) => updateUser(u.id, { role: e.target.value })}
                          disabled={isSelf}
                          className="w-auto"
                        >
                          {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </Select>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => updateUser(u.id, { active: !u.active })}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.active ? "bg-seafoam-soft text-seafoam-deep" : "bg-ink-faint/15 text-ink-soft"}`}
                        >
                          {u.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isSelf ? (
                          <span className="text-xs text-ink-faint">-</span>
                        ) : confirmId === u.id ? (
                          <span className="inline-flex items-center gap-2">
                            <Button variant="danger" onClick={() => { deleteUser(u.id); setConfirmId(null); }}>Remove</Button>
                            <Button variant="ghost" onClick={() => setConfirmId(null)}>Keep</Button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmId(u.id)} aria-label="Remove member" className="text-ink-faint transition hover:text-bubblegum">
                            <Icons.Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add crew member">
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus placeholder="Their name" /></Field>
          <Field label="Email" hint="Match the email they'll log in with, so their account links automatically.">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@noxandco.com" />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <p className="rounded-xl bg-sky/40 px-3 py-2 text-xs text-ink-soft">
            This adds them to the roster with a role. Create their actual login in Supabase → Authentication → Users.
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={add} disabled={!form.name.trim() || saving}>
            {saving ? "Adding…" : <><Icons.UserPlus size={15} /> Add member</>}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
