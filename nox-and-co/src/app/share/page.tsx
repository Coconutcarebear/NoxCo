"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClientReportView, computeClientReport, inClientRange, type ViewLike, type Row } from "@/components/ClientReport";
import type { Post, RoiSettings } from "@/lib/types";

const FALLBACK_ROI = { id: 1, per_k_views: 12, per_engagement: 0.18, sentiment_weight: 0.1 } as unknown as RoiSettings;

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; clientName: string; rangeLabel: string; rows: Row[]; tot: { views: number; eng: number; emv: number; posts: number } };

export default function SharePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) { setState({ status: "error", message: "This link is missing its token." }); return; }

        const { data: share } = await supabase.from("report_shares").select("*").eq("token", token).maybeSingle();
        if (!share || share.revoked) { setState({ status: "error", message: "This report link is no longer available." }); return; }

        const companyId = share.company_id as string;
        const days = Number(share.days || 30);

        const [companiesR, campaignsR, engagementsR, creatorsR, postsR, roiR] = await Promise.all([
          supabase.from("companies").select("id,name"),
          supabase.from("campaigns").select("id,name,company_id"),
          supabase.from("engagements").select("id,creator_id,campaign_id,company_id,stage"),
          supabase.from("creators").select("id,name,handle,platform"),
          supabase.from("posts").select("*"),
          supabase.from("roi_settings").select("*").eq("id", 1).maybeSingle(),
        ]);

        const companies = (companiesR.data ?? []) as { id: string; name: string }[];
        const campaigns = (campaignsR.data ?? []) as { id: string; name: string; company_id: string | null }[];
        const engagements = (engagementsR.data ?? []) as { id: string; creator_id: string; campaign_id: string | null; company_id: string | null; stage: string }[];
        const creators = (creatorsR.data ?? []) as { id: string; name: string; handle: string; platform: string }[];
        const posts = (postsR.data ?? []) as Post[];
        const roi = (roiR.data as RoiSettings) ?? FALLBACK_ROI;

        const clientName = companies.find((c) => c.id === companyId)?.name ?? "Client";
        const companyCampaignIds = new Set(campaigns.filter((c) => c.company_id === companyId).map((c) => c.id));

        const viewLikes: ViewLike[] = engagements
          .filter((e) => (e.company_id === companyId || (e.campaign_id != null && companyCampaignIds.has(e.campaign_id))) && inClientRange(e.stage))
          .map((e) => {
            const cr = creators.find((x) => x.id === e.creator_id);
            const cam = campaigns.find((c) => c.id === e.campaign_id);
            return { id: e.id, creator_id: e.creator_id, stage: e.stage, name: cr?.name ?? "Creator", handle: cr?.handle ?? "", platform: cr?.platform ?? "", campaign: cam?.name ?? null };
          });

        const { rows, tot, rangeLabel } = computeClientReport(viewLikes, posts, roi, days);
        setState({ status: "ok", clientName, rangeLabel, rows, tot });
      } catch (e) {
        setState({ status: "error", message: "Something went wrong loading this report." });
      }
    })();
  }, []);

  if (state.status === "loading") {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#e9edf7", color: "#54608c", fontFamily: "system-ui, sans-serif" }}>Loading report…</div>;
  }
  if (state.status === "error") {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#e9edf7", color: "#54608c", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "0 20px" }}>{state.message}</div>;
  }

  return (
    <div className="cr-share-root">
      <div style={{ maxWidth: 840, margin: "0 auto 14px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => window.print()} className="cr-btn cr-btn-primary" style={{ cursor: "pointer" }}>Print / Save PDF</button>
      </div>
      <ClientReportView clientName={state.clientName} rangeLabel={state.rangeLabel} rows={state.rows} tot={state.tot} />
    </div>
  );
}
