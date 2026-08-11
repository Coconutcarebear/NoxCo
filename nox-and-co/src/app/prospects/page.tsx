"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { useStore } from "@/lib/store";
import { PLATFORMS, EMPTY } from "@/lib/constants";
import { money, num } from "@/lib/format";
import { Card, Button, Badge, Pill, Input, Select, Field, Modal, EmptyState } from "@/components/ui";
import { PageHeader } from "@/components/widgets";

export default function SeedScoutPage() {
  const prospects = useStore((s) => s.scopedProspects);
  const addProspect = useStore((s) => s.addProspect);
  const deleteProspect = useStore((s) => s.deleteProspect);
  const convertProspect = useStore((s) => s.convertProspect);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<any>({ handle: "", platform: "Instagram", followers: "", category: "", email: "", estimated_rate: "", notes: "" });

  const submit = async () => {
    await addProspect({
      handle: form.handle || "@newstar",
      platform: form.platform,
      followers: form.followers ? Number(form.followers) : null,
      category: form.category || null,
      email: form.email || null,
      estimated_rate: form.estimated_rate ? Number(form.estimated_rate) : null,
      notes: form.notes || null,
    });
    setForm({ handle: "", platform: "Instagram", followers: "", category: "", email: "", estimated_rate: "", notes: "" });
    setAdding(false);
  };

  return (
    <div>
      <PageHeader
        title="Stargazing"
        sub="Discovery"
        icon="Search"
        action={<Button variant="primary" onClick={() => setAdding(true)}><Icons.Plus size={15} /> Spot a star</Button>}
      />

      {prospects.length === 0 ? (
        <EmptyState title={EMPTY.discover} hint="Add creators you're scouting. Bring them into an eclipse when you're ready." action={<Button variant="primary" onClick={() => setAdding(true)}><Icons.Plus size={15} /> Spot a star</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {prospects.map((p) => (
            <Card key={p.id} className="constellation p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base text-ink">{p.handle}</div>
                  <Pill className="mt-1">{p.platform}</Pill>
                </div>
                <Badge hue="#FDE68A">{p.estimated_rate ? money(p.estimated_rate) : "rate TBD"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                {p.followers != null && <span><b className="text-ink">{num(p.followers)}</b> followers</span>}
                {p.category && <span>{p.category}</span>}
              </div>
              {p.notes && <p className="mt-2 text-sm text-ink-soft">{p.notes}</p>}
              <div className="mt-4 flex gap-2">
                <Button variant="primary" onClick={() => convertProspect(p.id)} className="flex-1"><Icons.Sprout size={15} /> Bring it in</Button>
                <Button variant="ghost" onClick={() => deleteProspect(p.id)} title="Remove"><Icons.Trash2 size={15} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Spot a new star">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Handle"><Input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="@username" /></Field></div>
          <Field label="Platform"><Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
          <Field label="Followers"><Input value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} /></Field>
          <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Est. rate"><Input value={form.estimated_rate} onChange={(e) => setForm({ ...form, estimated_rate: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field></div>
          <div className="col-span-2"><Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit}><Icons.Plus size={15} /> Add to Stargazing</Button>
        </div>
      </Modal>
    </div>
  );
}
