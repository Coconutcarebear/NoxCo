"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import {
  COMPLIANCE_ITEMS, READY_TO_PAY_KEYS,
  EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES,
  DOCUMENT_CATEGORIES, categorizeFile, groupKeyFor,
} from "@/lib/constants";
import { money } from "@/lib/format";
import { uploadSecureDoc, signedDocUrl, deleteSecureDoc, uploadCreatorDoc, signedCreatorDocUrl } from "@/lib/upload";
import { Button, Field, Input, Badge, Pill, Modal } from "@/components/ui";
import { type ComplianceItem, type Campaign } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const labelOf = (k: string) => COMPLIANCE_ITEMS.find((i) => i.key === k)?.label ?? k;

export function CreatorFinance({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const currentUser = useStore((s) => s.currentUser);
  const campaigns = useStore((s) => s.campaigns);
  const complianceAll = useStore((s) => s.complianceItems);
  const expensesAll = useStore((s) => s.expenses);
  const paymentsAll = useStore((s) => s.payments);
  const upsertCompliance = useStore((s) => s.upsertCompliance);
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const requestReceipt = useStore((s) => s.requestReceipt);
  const addPayment = useStore((s) => s.addPayment);
  const deletePayment = useStore((s) => s.deletePayment);
  const documentsAll = useStore((s) => s.documents);
  const addDocument = useStore((s) => s.addDocument);
  const updateDocument = useStore((s) => s.updateDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);

  const scope = <T extends { creator_id: string; company_id: string | null }>(x: T) =>
    x.creator_id === creatorId && (activeCompanyId == null || x.company_id === activeCompanyId);

  const compliance = useMemo(() => complianceAll.filter(scope), [complianceAll, creatorId, activeCompanyId]);
  const expenses = useMemo(() => expensesAll.filter(scope), [expensesAll, creatorId, activeCompanyId]);
  const payments = useMemo(() => paymentsAll.filter(scope), [paymentsAll, creatorId, activeCompanyId]);
  const documents = useMemo(() => documentsAll.filter(scope), [documentsAll, creatorId, activeCompanyId]);

  const rowFor = (k: string) => compliance.find((c) => c.key === k);
  const doneOf = (k: string) => !!rowFor(k)?.done;
  const readyToPay = READY_TO_PAY_KEYS.every((k) => doneOf(k));
  const campName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? "—";

  const expTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const reimbTotal = expenses.filter((e) => e.reimbursable).reduce((s, e) => s + Number(e.amount || 0), 0);
  const missingReceipts = expenses.filter((e) => !e.receipt_attached).length;
  const paidTotal = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const outstandingTotal = payments.filter((p) => p.status !== "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);

  const [expOpen, setExpOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const me = currentUser?.name ?? "You";

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading((n) => n + arr.length);
    for (const file of arr) {
      try {
        const up = await uploadCreatorDoc(file, creatorId);
        await addDocument({
          creator_id: creatorId, category: categorizeFile(file.name), file_name: file.name,
          path: up.path, size_bytes: up.size, mime: up.mime, group_key: groupKeyFor(file.name), uploaded_by: me,
        });
      } catch { /* ignore */ }
      setUploading((n) => Math.max(0, n - 1));
    }
  }
  async function openDoc(path: string) { const url = await signedCreatorDocUrl(path); if (url) window.open(url, "_blank"); }

  return (
    <div className="space-y-5">
      {/* Progress widget */}
      <div className={"rounded-2xl border p-4 " + (readyToPay ? "border-seafoam-deep/50 bg-seafoam/20" : "border-sky/60 bg-white/60")}>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-base text-ink">{readyToPay ? "Ready to pay" : "Getting set up"}</div>
          <Badge hue={readyToPay ? "#9FE0CE" : "#FDE68A"}>{readyToPay ? "All clear" : "In progress"}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["contract_signed", "invoice", "w9", "ach"].map((k) => (
            <span key={k} className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 " + (doneOf(k) ? "bg-seafoam/40 text-ink" : "bg-sky/40 text-ink-soft")}>
              {doneOf(k) ? <Icons.Check size={13} /> : <Icons.Circle size={13} />} {labelOf(k)}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full bg-sky/40 px-2.5 py-1 text-ink-soft">Expenses {expenses.length}</span>
          <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 " + (missingReceipts ? "bg-amber-100 text-amber-700" : "bg-sky/40 text-ink-soft")}>Missing receipts {missingReceipts}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky/40 px-2.5 py-1 text-ink-soft">Payments {payments.length}</span>
        </div>
      </div>

      {/* Compliance */}
      <section>
        <h3 className="mb-2 font-display text-sm uppercase tracking-wide text-ink-faint">Compliance</h3>
        <div className="space-y-2">
          {COMPLIANCE_ITEMS.map((item) => (
            <ComplianceRow key={item.key} item={item} row={rowFor(item.key)} creatorId={creatorId} me={currentUser?.name ?? "You"} onSave={upsertCompliance} />
          ))}
        </div>
      </section>

      {/* Documents */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm uppercase tracking-wide text-ink-faint">Documents</h3>
          <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-dusty-deep hover:underline">
            <Icons.Upload size={14} /> Upload
            <input type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.currentTarget.value = ""; }} />
          </label>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={"mb-2 rounded-2xl border-2 border-dashed p-4 text-center text-xs transition " + (dragOver ? "border-dusty-deep bg-sky/30 text-ink" : "border-sky/70 text-ink-soft")}
        >
          {uploading > 0 ? `Uploading ${uploading}…` : "Drag & drop files here · PDF, DOCX, ZIP, PNG, JPG"}
        </div>
        {documents.length === 0 ? (
          <p className="rounded-xl bg-white/60 p-3 text-center text-xs text-ink-soft">No documents yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {documents.map((d) => (
              <li key={d.id} className="rounded-xl border border-sky/60 bg-white/70 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icons.FileText size={14} className="shrink-0 text-dusty-deep" />
                      <span className="truncate font-semibold text-ink">{d.file_name}</span>
                      {d.version > 1 && <span className="shrink-0 rounded-full bg-lavender/40 px-1.5 text-[10px] font-semibold text-ink">v{d.version}</span>}
                    </div>
                    <div className="truncate text-[11px] text-ink-faint">{new Date(d.created_at).toLocaleDateString()}{d.uploaded_by ? ` · ${d.uploaded_by}` : ""}{d.campaign_id ? ` · ${campName(d.campaign_id)}` : ""}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => openDoc(d.path)} className="text-xs text-dusty-deep hover:underline">Open</button>
                    <button onClick={() => deleteDocument(d.id)} className="text-ink-faint hover:text-bubblegum" aria-label="Delete"><Icons.Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <select value={d.category} onChange={(e) => updateDocument(d.id, { category: e.target.value })} className="rounded-lg border border-sky/70 bg-white/80 px-2 py-1 text-xs text-ink outline-none focus:border-dusty-deep">
                    {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={d.campaign_id ?? ""} onChange={(e) => updateDocument(d.id, { campaign_id: e.target.value || null })} className="rounded-lg border border-sky/70 bg-white/80 px-2 py-1 text-xs text-ink outline-none focus:border-dusty-deep">
                    <option value="">— No eclipse —</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Expenses */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm uppercase tracking-wide text-ink-faint">Expenses</h3>
          <Button variant="ghost" onClick={() => setExpOpen(true)}><Icons.Plus size={14} /> Add</Button>
        </div>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          <Pill>Total {money(expTotal)}</Pill>
          <Pill>Reimbursable {money(reimbTotal)}</Pill>
        </div>
        {expenses.length === 0 ? (
          <p className="rounded-xl bg-white/60 p-3 text-center text-xs text-ink-soft">No expenses yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {expenses.map((e) => (
              <li key={e.id} className="rounded-xl border border-sky/60 bg-white/70 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{e.category} · {money(Number(e.amount || 0))}</div>
                    <div className="truncate text-xs text-ink-faint">{campName(e.campaign_id)}{e.spent_on ? ` · ${e.spent_on}` : ""}{e.description ? ` · ${e.description}` : ""}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge hue={e.status === "Paid" ? "#9FE0CE" : e.status === "Approved" ? "#B7C8EA" : "#FDE68A"}>{e.status}</Badge>
                    <button onClick={() => deleteExpense(e.id)} className="text-ink-faint hover:text-bubblegum" aria-label="Delete"><Icons.Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  {e.receipt_attached ? (
                    <span className="inline-flex items-center gap-1 text-seafoam-deep"><Icons.Check size={12} /> Receipt attached</span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-amber-600"><Icons.AlertTriangle size={12} /> Missing receipt</span>
                      <button onClick={() => updateExpense(e.id, { receipt_attached: true })} className="text-dusty-deep hover:underline">Mark received</button>
                      <button onClick={() => requestReceipt(e.id)} className="text-dusty-deep hover:underline">Request receipt</button>
                    </>
                  )}
                  {e.reimbursable && <span className="text-ink-faint">· reimbursable</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payment history */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm uppercase tracking-wide text-ink-faint">Payment history</h3>
          <Button variant="ghost" onClick={() => setPayOpen(true)}><Icons.Plus size={14} /> Add</Button>
        </div>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          <Pill>Paid {money(paidTotal)}</Pill>
          <Pill>Outstanding {money(outstandingTotal)}</Pill>
        </div>
        {payments.length === 0 ? (
          <p className="rounded-xl bg-white/60 p-3 text-center text-xs text-ink-soft">No payments yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-sky/60 bg-white/70 p-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{p.invoice_number ? `#${p.invoice_number} · ` : ""}{money(Number(p.amount || 0))}</div>
                  <div className="truncate text-xs text-ink-faint">{campName(p.campaign_id)}{p.method ? ` · ${p.method}` : ""}{p.paid_date ? ` · ${p.paid_date}` : ""}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge hue={p.status === "Paid" ? "#9FE0CE" : "#FDE68A"}>{p.status}</Badge>
                  <button onClick={() => deletePayment(p.id)} className="text-ink-faint hover:text-bubblegum" aria-label="Delete"><Icons.Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ExpenseModal open={expOpen} onClose={() => setExpOpen(false)} campaigns={campaigns} onSave={async (f) => { await addExpense({ ...f, creator_id: creatorId }); setExpOpen(false); }} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} campaigns={campaigns} onSave={async (f) => { await addPayment({ ...f, creator_id: creatorId }); setPayOpen(false); }} />
    </div>
  );
}

function Sel({ value, onChange, children }: { value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; children: ReactNode }) {
  return (
    <select value={value} onChange={onChange} className="w-full rounded-xl border border-sky/70 bg-white/80 px-3 py-2 text-sm text-ink outline-none focus:border-dusty-deep">
      {children}
    </select>
  );
}

function ComplianceRow({
  item, row, creatorId, me, onSave,
}: {
  item: { key: string; label: string; secureUpload?: boolean };
  row: ComplianceItem | undefined;
  creatorId: string;
  me: string;
  onSave: (creatorId: string, key: string, patch: Partial<ComplianceItem>) => Promise<void>;
}) {
  const done = !!row?.done;
  const [notes, setNotes] = useState(row?.notes ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNotes(row?.notes ?? ""); }, [row?.notes]);

  const toggle = () =>
    onSave(creatorId, item.key, done ? { done: false, completed_at: null, completed_by: null } : { done: true, completed_at: today(), completed_by: me });

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { const path = await uploadSecureDoc(file, `ach/${creatorId}`); await onSave(creatorId, item.key, { doc_path: path }); }
    catch { /* ignore */ }
    setBusy(false);
  };
  const viewDoc = async () => { if (row?.doc_path) { const url = await signedDocUrl(row.doc_path); if (url) window.open(url, "_blank"); } };
  const removeDoc = async () => { if (row?.doc_path) { await deleteSecureDoc(row.doc_path); await onSave(creatorId, item.key, { doc_path: null }); } };

  return (
    <div className="rounded-xl border border-sky/60 bg-white/70 p-2.5">
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={toggle} aria-label={item.label}
          className={"grid h-6 w-6 shrink-0 place-items-center rounded-full transition " + (done ? "bg-seafoam-deep text-white" : "border border-sky text-transparent hover:border-dusty-deep")}>
          <Icons.Check size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">{item.label}</div>
          {done && <div className="text-[11px] text-ink-faint">Completed {row?.completed_at ?? today()}{row?.completed_by ? ` · ${row.completed_by}` : ""}</div>}
        </div>
      </div>

      {item.secureUpload && (
        <div className="mt-2 flex flex-wrap items-center gap-3 pl-8 text-xs">
          {row?.doc_path ? (
            <>
              <button type="button" onClick={viewDoc} className="inline-flex items-center gap-1 text-dusty-deep hover:underline"><Icons.FileLock2 size={12} /> View ACH doc</button>
              <button type="button" onClick={removeDoc} className="text-ink-faint hover:text-bubblegum">Remove</button>
            </>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-1 text-dusty-deep hover:underline">
              <Icons.Upload size={12} /> {busy ? "Uploading…" : "Attach ACH doc (optional, private)"}
              <input type="file" className="hidden" onChange={onFile} />
            </label>
          )}
        </div>
      )}

      <div className="mt-2 pl-8">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { if ((row?.notes ?? "") !== notes) onSave(creatorId, item.key, { notes: notes || null }); }}
          placeholder="Notes"
          className="w-full rounded-lg border border-sky/70 bg-white/80 px-2.5 py-1.5 text-xs text-ink outline-none focus:border-dusty-deep"
        />
      </div>
    </div>
  );
}

type ExpForm = { campaign_id: string | null; spent_on: string | null; category: string; description: string | null; amount: number; reimbursable: boolean; receipt_attached: boolean; status: string };
const EMPTY_EXP: ExpForm = { campaign_id: null, spent_on: today(), category: "Uber", description: null, amount: 0, reimbursable: true, receipt_attached: false, status: "Pending" };

function ExpenseModal({ open, onClose, campaigns, onSave }: { open: boolean; onClose: () => void; campaigns: Campaign[]; onSave: (f: ExpForm) => Promise<void> }) {
  const [f, setF] = useState<ExpForm>(EMPTY_EXP);
  const [amt, setAmt] = useState("");
  useEffect(() => { if (open) { setF(EMPTY_EXP); setAmt(""); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Add expense">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Sel value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Sel>
          </Field>
          <Field label="Amount ($)"><Input type="number" min={0} step={0.01} value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
          <Field label="Date"><Input type="date" value={f.spent_on ?? ""} onChange={(e) => setF({ ...f, spent_on: e.target.value || null })} /></Field>
          <Field label="Eclipse">
            <Sel value={f.campaign_id ?? ""} onChange={(e) => setF({ ...f, campaign_id: e.target.value || null })}>
              <option value="">— None —</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
          </Field>
          <Field label="Status">
            <Sel value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {EXPENSE_STATUSES.map((sx) => <option key={sx} value={sx}>{sx}</option>)}
            </Sel>
          </Field>
        </div>
        <Field label="Description"><Input value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value || null })} /></Field>
        <div className="flex flex-wrap gap-4 text-sm text-ink">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.reimbursable} onChange={(e) => setF({ ...f, reimbursable: e.target.checked })} /> Reimbursable</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={f.receipt_attached} onChange={(e) => setF({ ...f, receipt_attached: e.target.checked })} /> Receipt attached</label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...f, amount: Number(amt) || 0 })}>Add expense</Button>
        </div>
      </div>
    </Modal>
  );
}

type PayForm = { campaign_id: string | null; invoice_number: string | null; amount: number; paid_date: string | null; method: string | null; status: string };
const EMPTY_PAY: PayForm = { campaign_id: null, invoice_number: null, amount: 0, paid_date: today(), method: "ACH", status: "Paid" };

function PaymentModal({ open, onClose, campaigns, onSave }: { open: boolean; onClose: () => void; campaigns: Campaign[]; onSave: (f: PayForm) => Promise<void> }) {
  const [f, setF] = useState<PayForm>(EMPTY_PAY);
  const [amt, setAmt] = useState("");
  useEffect(() => { if (open) { setF(EMPTY_PAY); setAmt(""); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Add payment">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice #"><Input value={f.invoice_number ?? ""} onChange={(e) => setF({ ...f, invoice_number: e.target.value || null })} /></Field>
          <Field label="Amount ($)"><Input type="number" min={0} step={0.01} value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
          <Field label="Paid date"><Input type="date" value={f.paid_date ?? ""} onChange={(e) => setF({ ...f, paid_date: e.target.value || null })} /></Field>
          <Field label="Method">
            <Sel value={f.method ?? ""} onChange={(e) => setF({ ...f, method: e.target.value || null })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Sel>
          </Field>
          <Field label="Eclipse">
            <Sel value={f.campaign_id ?? ""} onChange={(e) => setF({ ...f, campaign_id: e.target.value || null })}>
              <option value="">— None —</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Sel>
          </Field>
          <Field label="Status">
            <Sel value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {PAYMENT_STATUSES.map((sx) => <option key={sx} value={sx}>{sx}</option>)}
            </Sel>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...f, amount: Number(amt) || 0 })}>Add payment</Button>
        </div>
      </div>
    </Modal>
  );
}
