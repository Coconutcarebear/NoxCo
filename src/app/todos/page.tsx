"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import { Card, Button, Badge, Pill, Field, Input, Textarea, Select, BloomBar, Modal } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { usePerms } from "@/lib/perms";
import { TODO_CATEGORIES, TODO_CATEGORY_KEYS, TODO_PRIORITIES } from "@/lib/constants";
import type { Todo } from "@/lib/types";

const Ic = (name: string) => (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name] ?? Icons.ListChecks;
const today = () => new Date().toISOString().slice(0, 10);

type Form = {
  id: string | null;
  title: string;
  category: string;
  due_date: string;
  priority: string;
  campaign_id: string;
  creator_id: string;
  assignee_id: string;
  notes: string;
};

const BLANK: Form = {
  id: null, title: "", category: TODO_CATEGORIES[0].key, due_date: "",
  priority: "Normal", campaign_id: "", creator_id: "", assignee_id: "", notes: "",
};

export default function OrdersPage() {
  const todos = useStore((s) => s.scopedTodos);
  const campaigns = useStore((s) => s.scopedCampaigns);
  const creators = useStore((s) => s.creators);
  const users = useStore((s) => s.users);
  const addTodo = useStore((s) => s.addTodo);
  const updateTodo = useStore((s) => s.updateTodo);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const deleteTodo = useStore((s) => s.deleteTodo);
  const { canEdit } = usePerms();

  const [showDone, setShowDone] = useState(false);
  const [campFilter, setCampFilter] = useState("all");
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(BLANK);

  const campName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? null;
  const campColor = (id: string | null) => campaigns.find((c) => c.id === id)?.color ?? "#C7D0E0";
  const creatorName = (id: string | null) => creators.find((c) => c.id === id)?.name ?? null;
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? null;
  const userColor = (id: string | null) => users.find((u) => u.id === id)?.color ?? "#CDB4F0";

  // filter by campaign, then bucket by category (unknown categories fall into General)
  const buckets = useMemo(() => {
    const filtered = todos.filter((t) => {
      if (campFilter === "all") return true;
      if (campFilter === "none") return !t.campaign_id;
      return t.campaign_id === campFilter;
    });
    const map: Record<string, Todo[]> = {};
    for (const key of TODO_CATEGORY_KEYS) map[key] = [];
    for (const t of filtered) {
      const key = TODO_CATEGORY_KEYS.includes(t.category) ? t.category : "General";
      map[key].push(t);
    }
    const rank: Record<string, number> = { High: 0, Normal: 1, Low: 2 };
    for (const key of TODO_CATEGORY_KEYS) {
      map[key].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const pr = (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1);
        if (pr !== 0) return pr;
        return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
      });
    }
    return map;
  }, [todos, campFilter]);

  const totals = useMemo(() => {
    const all = Object.values(buckets).flat();
    return { done: all.filter((t) => t.done).length, total: all.length };
  }, [buckets]);

  function quickAdd(category: string) {
    const title = (quick[category] ?? "").trim();
    if (!title) return;
    addTodo({ title, category, campaign_id: campFilter !== "all" && campFilter !== "none" ? campFilter : null });
    setQuick((q) => ({ ...q, [category]: "" }));
  }

  function openNew(category?: string) {
    setForm({ ...BLANK, category: category ?? TODO_CATEGORIES[0].key, campaign_id: campFilter !== "all" && campFilter !== "none" ? campFilter : "" });
    setConfirmDelete(false);
    setOpen(true);
  }

  function openEdit(t: Todo) {
    setForm({
      id: t.id, title: t.title, category: TODO_CATEGORY_KEYS.includes(t.category) ? t.category : "General",
      due_date: t.due_date ?? "", priority: t.priority ?? "Normal",
      campaign_id: t.campaign_id ?? "", creator_id: t.creator_id ?? "", assignee_id: t.assignee_id ?? "",
      notes: t.notes ?? "",
    });
    setConfirmDelete(false);
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    const patch = {
      title: form.title.trim(),
      category: form.category,
      due_date: form.due_date || null,
      priority: form.priority,
      campaign_id: form.campaign_id || null,
      creator_id: form.creator_id || null,
      assignee_id: form.assignee_id || null,
      notes: form.notes || null,
    };
    if (form.id) await updateTodo(form.id, patch);
    else await addTodo(patch);
    setSaving(false);
    setOpen(false);
    setForm(BLANK);
  }

  async function remove() {
    if (!form.id || saving) return;
    setSaving(true);
    await deleteTodo(form.id);
    setSaving(false);
    setOpen(false);
    setForm(BLANK);
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        sub="To-dos"
        icon="ListChecks"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Pill>{totals.total - totals.done} open</Pill>
            <button
              onClick={() => setShowDone((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${showDone ? "bg-seafoam-soft text-seafoam-deep" : "bg-white/70 text-ink-soft hover:text-dusty-deep"}`}
            >
              {showDone ? "Hide done" : "Show done"}
            </button>
            {canEdit && <Button variant="primary" onClick={() => openNew()}><Icons.Plus size={15} /> Add task</Button>}
          </div>
        }
      />

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 flex items-center justify-between text-sm text-ink-soft">
              <span>Overall progress</span>
              <span className="font-semibold text-seafoam-deep">{totals.done}/{totals.total} done</span>
            </div>
            <BloomBar value={totals.total ? totals.done / totals.total : 0} hue="#9FE0CE" height={12} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Eclipse</span>
            <div className="w-52">
              <Select value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
                <option value="all">All eclipses</option>
                <option value="none">No eclipse</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {TODO_CATEGORIES.map((cat) => {
          const items = buckets[cat.key] ?? [];
          const doneCount = items.filter((t) => t.done).length;
          const visible = showDone ? items : items.filter((t) => !t.done);
          const CatIcon = Ic(cat.icon);
          return (
            <Card key={cat.key} className="p-0">
              <div className="border-b border-sky/60 p-4" style={{ background: `linear-gradient(120deg, ${cat.hue}33, transparent)` }}>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${cat.hue}66` }}><CatIcon size={17} /></span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg leading-tight text-ink">{cat.label}</h2>
                    <p className="text-[11px] text-ink-faint">{cat.hint}</p>
                  </div>
                  <span className="ml-auto text-xs text-ink-soft">{doneCount}/{items.length}</span>
                </div>
                {items.length > 0 && <div className="mt-3"><BloomBar value={doneCount / items.length} hue={cat.hue} height={6} /></div>}
              </div>

              <ul className="divide-y divide-sky/50 px-2">
                {visible.length === 0 ? (
                  <li className="px-2 py-3 text-center text-xs text-ink-faint">{items.length === 0 ? "Nothing here yet." : "All done — nice."}</li>
                ) : (
                  visible.map((t) => {
                    const overdue = !t.done && !!t.due_date && t.due_date < today();
                    return (
                      <li key={t.id} className="group flex items-start gap-3 px-2 py-2.5">
                        <button
                          onClick={() => canEdit && toggleTodo(t.id)}
                          aria-label={t.done ? "Mark not done" : "Mark done"}
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${t.done ? "border-seafoam-deep bg-seafoam-deep text-white" : "border-ink-faint/50 hover:border-dusty-deep"}`}
                        >
                          {t.done && <Icons.Check size={13} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button onClick={() => canEdit && openEdit(t)} className="block text-left">
                            <span className={`text-sm ${t.done ? "text-ink-faint line-through" : "text-ink"}`}>{t.title}</span>
                          </button>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            {t.due_date && (
                              <span className={`rounded-full px-2 py-0.5 ${overdue ? "bg-bubblegum/20 text-bubblegum" : "bg-sky/50 text-dusty-deep"}`}>
                                {overdue ? "Due " : ""}{fmtDate(t.due_date)}
                              </span>
                            )}
                            {t.priority === "High" && <span className="rounded-full bg-bubblegum/20 px-2 py-0.5 font-semibold text-bubblegum">High</span>}
                            {t.priority === "Low" && <span className="rounded-full bg-ink-faint/15 px-2 py-0.5 text-ink-soft">Low</span>}
                            {t.campaign_id && <Badge hue={campColor(t.campaign_id)}>{campName(t.campaign_id)}</Badge>}
                            {t.creator_id && <span className="text-ink-faint">★ {creatorName(t.creator_id)}</span>}
                            {t.assignee_id && (
                              <span className="inline-flex items-center gap-1 text-ink-faint">
                                <span className="h-2 w-2 rounded-full" style={{ background: userColor(t.assignee_id) }} />
                                {userName(t.assignee_id)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => canEdit && deleteTodo(t.id)}
                          aria-label="Delete task"
                          className="mt-0.5 shrink-0 text-ink-faint opacity-0 transition hover:text-bubblegum group-hover:opacity-100"
                        >
                          <Icons.X size={15} />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              {canEdit && (
              <div className="flex items-center gap-2 border-t border-sky/60 px-4 py-2.5">
                <Icons.Plus size={15} className="shrink-0 text-ink-faint" />
                <input
                  value={quick[cat.key] ?? ""}
                  onChange={(e) => setQuick((q) => ({ ...q, [cat.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") quickAdd(cat.key); }}
                  placeholder="Add a task…"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
                />
                {(quick[cat.key] ?? "").trim() && (
                  <button onClick={() => quickAdd(cat.key)} className="shrink-0 text-xs font-semibold text-dusty-deep hover:underline">Add</button>
                )}
              </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit task" : "Add task"}>
        <div className="space-y-3">
          <Field label="Task"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Send follow-up to @katielleia" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {TODO_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {TODO_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Due date"><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
            <Field label="Assignee">
              <Select value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
                <option value="">— Anyone —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="Eclipse">
              <Select value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}>
                <option value="">— None —</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Creator">
              <Select value={form.creator_id} onChange={(e) => setForm({ ...form, creator_id: e.target.value })}>
                <option value="">— None —</option>
                {creators.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional details" /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {form.id && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-soft">Delete?</span>
                  <Button variant="danger" onClick={remove} disabled={saving}>Yes</Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep</Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-bubblegum"><Icons.Trash2 size={15} /> Delete</Button>
              )
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.title.trim() || saving}>
              {saving ? "Saving…" : form.id ? <><Icons.Check size={15} /> Save</> : <><Icons.Plus size={15} /> Add task</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
