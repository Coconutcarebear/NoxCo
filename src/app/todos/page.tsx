"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import { Button, Badge, Field, Input, Textarea, Select, Modal } from "@/components/ui";
import { PageHeader } from "@/components/widgets";
import { usePerms } from "@/lib/perms";
import { TODO_CATEGORIES, TODO_CATEGORY_KEYS, TODO_PRIORITIES } from "@/lib/constants";
import type { Todo } from "@/lib/types";

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
  const [catFilter, setCatFilter] = useState("all");
  const [quick, setQuick] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(BLANK);

  const campName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? null;
  const campColor = (id: string | null) => campaigns.find((c) => c.id === id)?.color ?? "#8A8C96";
  const creatorName = (id: string | null) => creators.find((c) => c.id === id)?.name ?? null;
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? null;

  // filter by campaign, then bucket by category (unknown categories fall into General)
  const buckets = useMemo(() => {
    const filtered = todos.filter((t) => {
      if (campFilter !== "all") {
        if (campFilter === "none" ? !!t.campaign_id : t.campaign_id !== campFilter) return false;
      }
      return true;
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

  const visibleCategories = TODO_CATEGORIES.filter((cat) => catFilter === "all" || cat.key === catFilter);

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
        title="Night Watch"
        sub="To-dos"
        icon="ListChecks"
        action={canEdit ? <Button variant="primary" onClick={() => openNew()}><Icons.Plus size={15} /> Add task</Button> : undefined}
      />

      {/* Progress + filters, quiet row, no card box */}
      <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
            <span className="uppercase tracking-[0.14em]">Progress</span>
            <span className="text-white/60">{totals.done}/{totals.total} done</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-dusty" style={{ width: `${totals.total ? (totals.done / totals.total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.1em] text-white/40">Eclipse</span>
          <div className="w-44">
            <Select value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
              <option value="all">All eclipses</option>
              <option value="none">No eclipse</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        </div>

        <button
          onClick={() => setShowDone((v) => !v)}
          className={`text-xs font-medium transition ${showDone ? "text-white" : "text-white/40 hover:text-white"}`}
        >
          {showDone ? "Hide done" : "Show done"}
        </button>
      </div>

      {/* Category filter, flat text tabs, no rounding, no icons */}
      <div className="mb-8 flex flex-wrap gap-x-5 gap-y-2 border-b border-white/10 pb-4 text-sm">
        <button
          onClick={() => setCatFilter("all")}
          className={`border-b-2 pb-1 transition ${catFilter === "all" ? "border-dusty text-white" : "border-transparent text-white/40 hover:text-white"}`}
        >
          All
        </button>
        {TODO_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCatFilter(cat.key)}
            className={`border-b-2 pb-1 transition ${catFilter === cat.key ? "border-dusty text-white" : "border-transparent text-white/40 hover:text-white"}`}
          >
            {cat.label} <span className="text-white/25">{buckets[cat.key]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {visibleCategories.map((cat) => {
          const items = buckets[cat.key] ?? [];
          const doneCount = items.filter((t) => t.done).length;
          const visible = showDone ? items : items.filter((t) => !t.done);
          if (catFilter === "all" && items.length === 0) return null;
          return (
            <div key={cat.key}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-lg text-white">{cat.label}</h2>
                <span className="text-xs text-white/30">{cat.hint}</span>
                <span className="ml-auto text-xs text-white/30">{doneCount}/{items.length}</span>
              </div>

              {visible.length === 0 ? (
                <p className="border-t border-white/10 py-4 text-xs text-white/30">{items.length === 0 ? "Nothing here yet." : "All done."}</p>
              ) : (
                <ul className="divide-y divide-white/10 border-t border-white/10">
                  {visible.map((t) => {
                    const overdue = !t.done && !!t.due_date && t.due_date < today();
                    return (
                      <li key={t.id} className="group flex items-start gap-3 py-3">
                        <button
                          onClick={() => canEdit && toggleTodo(t.id)}
                          aria-label={t.done ? "Mark not done" : "Mark done"}
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${t.done ? "border-dusty bg-dusty text-navy-deep" : "border-white/25 hover:border-white/60"}`}
                        >
                          {t.done && <Icons.Check size={11} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button onClick={() => canEdit && openEdit(t)} className="block text-left">
                            <span className={`text-sm ${t.done ? "text-white/30 line-through" : "text-white/85"}`}>{t.title}</span>
                          </button>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
                            {t.due_date && <span className={overdue ? "font-semibold text-bubblegum" : ""}>{overdue ? "Due " : ""}{fmtDate(t.due_date)}</span>}
                            {t.priority === "High" && <span className="font-semibold text-bubblegum">High priority</span>}
                            {t.campaign_id && <Badge hue={campColor(t.campaign_id)}>{campName(t.campaign_id)}</Badge>}
                            {t.creator_id && <span>{creatorName(t.creator_id)}</span>}
                            {t.assignee_id && <span>{userName(t.assignee_id)}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => canEdit && deleteTodo(t.id)}
                          aria-label="Delete task"
                          className="mt-0.5 shrink-0 text-white/20 opacity-0 transition hover:text-bubblegum group-hover:opacity-100"
                        >
                          <Icons.X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {canEdit && (
                <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2.5">
                  <Icons.Plus size={13} className="shrink-0 text-white/25" />
                  <input
                    value={quick[cat.key] ?? ""}
                    onChange={(e) => setQuick((q) => ({ ...q, [cat.key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") quickAdd(cat.key); }}
                    placeholder="Add a task…"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                  {(quick[cat.key] ?? "").trim() && (
                    <button onClick={() => quickAdd(cat.key)} className="shrink-0 text-xs font-semibold text-dusty hover:text-white">Add</button>
                  )}
                </div>
              )}
            </div>
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
                <option value="">Anyone</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="Eclipse">
              <Select value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}>
                <option value="">None</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Creator">
              <Select value={form.creator_id} onChange={(e) => setForm({ ...form, creator_id: e.target.value })}>
                <option value="">None</option>
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
