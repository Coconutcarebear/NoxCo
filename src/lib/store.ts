"use client";

import { create } from "zustand";
import type { Session, User as AuthUser } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { totalCreatorCostOf } from "./budget";
import { EMOJI_AVATARS, DEFAULT_GRADIENT } from "./constants";
import {
  type Creator,
  type Campaign,
  type Company,
  type User,
  type Prospect,
  type Activity,
  type InternalBoost,
  type Post,
  type Todo,
  type ComplianceItem,
  type Expense,
  type Payment,
  type Document,
  type RoiSettings,
  type Engagement,
  type EngagementView,
  type Stage,
  WRITABLE_CREATOR_KEYS,
  WRITABLE_ENGAGEMENT_KEYS,
} from "./types";

// Find (or create) the roster row for a signed-in auth user.
async function ensureProfile(authUser: AuthUser): Promise<User | null> {
  // already linked?
  const linked = await supabase.from("users").select("*").eq("auth_id", authUser.id).maybeSingle();
  if (linked.data) return linked.data as User;

  // claim an existing unlinked roster row with the same email
  if (authUser.email) {
    const byEmail = await supabase.from("users").select("*").eq("email", authUser.email).is("auth_id", null).maybeSingle();
    if (byEmail.data) {
      const claimed = await supabase.from("users").update({ auth_id: authUser.id }).eq("id", (byEmail.data as User).id).select().single();
      return (claimed.data as User) ?? (byEmail.data as User);
    }
  }

  // first real login becomes Owner; everyone else Viewer
  const existing = await supabase.from("users").select("id", { count: "exact", head: true }).not("auth_id", "is", null);
  const isFirst = (existing.count ?? 0) === 0;
  const emoji = EMOJI_AVATARS[Math.floor(Math.random() * EMOJI_AVATARS.length)];
  const name = authUser.email ? authUser.email.split("@")[0] : "New member";
  const created = await supabase.from("users").insert({
    auth_id: authUser.id,
    email: authUser.email ?? null,
    name,
    role: isFirst ? "Owner" : "Viewer",
    emoji,
    color: "#CDB4F0",
    gradient: DEFAULT_GRADIENT,
    active: true,
  }).select().single();
  return (created.data as User) ?? null;
}

type Refs = { creator_id?: string | null; campaign_id?: string | null; engagement_id?: string | null };

function pick<T>(keys: (keyof T)[], patch: Partial<T>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in patch) out[key as string] = (patch as Record<string, unknown>)[key as string];
  }
  return out;
}

function pickCreator(patch: Partial<Creator>): Record<string, unknown> {
  const out = pick(WRITABLE_CREATOR_KEYS, patch);
  out.updated_at = new Date().toISOString();
  return out;
}

function pickEngagement(patch: Partial<Engagement>): Record<string, unknown> {
  const out = pick(WRITABLE_ENGAGEMENT_KEYS, patch);
  out.updated_at = new Date().toISOString();
  return out;
}

// Join engagements to their creator + campaign, with flat profile aliases.
function buildViews(
  creators: Creator[],
  campaigns: Campaign[],
  engagements: Engagement[]
): EngagementView[] {
  const cById = new Map(creators.map((c) => [c.id, c]));
  const camById = new Map(campaigns.map((c) => [c.id, c]));
  const out: EngagementView[] = [];
  for (const e of engagements) {
    const creator = cById.get(e.creator_id);
    if (!creator) continue; // orphaned engagement (creator deleted) — skip
    const cam = e.campaign_id ? camById.get(e.campaign_id) ?? null : null;
    out.push({
      ...e,
      creator,
      campaign: cam?.name ?? null,
      campaignName: cam?.name ?? null,
      campaignColor: cam?.color ?? null,
      company_id: cam?.company_id ?? e.company_id ?? null,
      total_creator_cost: totalCreatorCostOf(e, creator.standard_rate ?? 0),
      name: creator.name,
      handle: creator.handle,
      platform: creator.platform,
      email: creator.email,
      phone: creator.phone,
      city: creator.city,
      state: creator.state,
      categories: creator.categories,
      bio: creator.bio,
      profile_image: creator.profile_image,
      notes: creator.notes,
      followers: creator.followers,
      engagement_rate: creator.engagement_rate,
      audience_demographics: creator.audience_demographics,
      audience_location: creator.audience_location,
      standard_rate: creator.standard_rate,
      w9_on_file: creator.w9_on_file ?? false,
      ach_on_file: creator.ach_on_file ?? false,
    });
  }
  return out;
}

interface ScopeInput {
  campaigns: Campaign[];
  views: EngagementView[];
  engagements: Engagement[];
  posts: Post[];
  internalBoosts: InternalBoost[];
  todos: Todo[];
  prospects: Prospect[];
}

// Narrow every collection to one client (via campaign.company_id). null = all clients.
function computeScoped(activeCompanyId: string | null, d: ScopeInput) {
  const activeOf = (vs: EngagementView[]) => vs.filter((v) => !v.archived && !v.creator.archived);
  if (!activeCompanyId) {
    return {
      scopedCampaigns: d.campaigns,
      scopedViews: d.views,
      scopedActiveViews: activeOf(d.views),
      scopedEngagements: d.engagements,
      scopedPosts: d.posts,
      scopedInternalBoosts: d.internalBoosts,
      scopedTodos: d.todos,
      scopedProspects: d.prospects,
    };
  }
  const campIds = new Set(d.campaigns.filter((c) => c.company_id === activeCompanyId).map((c) => c.id));
  const scopedEngagements = d.engagements.filter(
    (e) => (e.campaign_id && campIds.has(e.campaign_id)) || e.company_id === activeCompanyId
  );
  const engIds = new Set(scopedEngagements.map((e) => e.id));
  const scopedViews = d.views.filter((v) => v.company_id === activeCompanyId);
  return {
    scopedCampaigns: d.campaigns.filter((c) => c.company_id === activeCompanyId),
    scopedViews,
    scopedActiveViews: activeOf(scopedViews),
    scopedEngagements,
    scopedPosts: d.posts.filter((p) => p.engagement_id && engIds.has(p.engagement_id)),
    scopedInternalBoosts: d.internalBoosts.filter((b) => b.company_id === activeCompanyId),
    scopedTodos: d.todos.filter((t) => !t.campaign_id || campIds.has(t.campaign_id)),
    scopedProspects: d.prospects.filter((p) => !p.company_id || p.company_id === activeCompanyId),
  };
}

interface StoreState {
  loading: boolean;
  ready: boolean;
  error: string | null;

  // auth
  session: Session | null;
  currentUser: User | null;
  authReady: boolean;
  userSettings: Record<string, unknown>;

  companies: Company[];
  users: User[];
  creators: Creator[];
  campaigns: Campaign[];
  engagements: Engagement[];
  posts: Post[];
  internalBoosts: InternalBoost[];
  todos: Todo[];
  prospects: Prospect[];
  activity: Activity[];
  roiSettings: RoiSettings;
  complianceItems: ComplianceItem[];
  expenses: Expense[];
  payments: Payment[];
  documents: Document[];

  // derived joins (recomputed after any creators/campaigns/engagements change)
  views: EngagementView[];
  activeViews: EngagementView[];

  // client scope (null = all clients)
  activeCompanyId: string | null;
  scopedCampaigns: Campaign[];
  scopedViews: EngagementView[];
  scopedActiveViews: EngagementView[];
  scopedEngagements: Engagement[];
  scopedPosts: Post[];
  scopedInternalBoosts: InternalBoost[];
  scopedTodos: Todo[];
  scopedProspects: Prospect[];
  setActiveCompany: (id: string | null) => void;

  recompute: () => void;
  undoStack: { label: string; run: () => Promise<void> }[];
  undo: () => Promise<void>;
  pushUndo: (label: string, run: () => Promise<void>) => void;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateCurrentUser: (patch: Partial<User>) => Promise<void>;
  loadUserSettings: () => Promise<void>;
  saveUserSettings: (patch: Record<string, unknown>) => Promise<void>;
  fetchAll: () => Promise<void>;
  log: (text: string, refs?: Refs, kind?: string) => Promise<void>;

  // creators (profiles)
  addCreator: (partial: Partial<Creator>) => Promise<Creator | null>;
  updateCreator: (id: string, patch: Partial<Creator>, activityText?: string) => Promise<void>;
  deleteCreator: (id: string) => Promise<void>;
  archiveCreator: (id: string, archived: boolean) => Promise<void>;
  addCreatorWithEngagement: (
    profile: Partial<Creator>,
    campaignId?: string | null,
    engagement?: Partial<Engagement>
  ) => Promise<{ creator: Creator; engagement: Engagement } | null>;

  // engagements (creator on a campaign)
  addEngagement: (partial: Partial<Engagement>) => Promise<Engagement | null>;
  updateEngagement: (id: string, patch: Partial<Engagement>, activityText?: string) => Promise<void>;
  deleteEngagement: (id: string) => Promise<void>;
  archiveEngagement: (id: string, archived: boolean) => Promise<void>;
  moveStage: (id: string, stage: Stage) => Promise<void>;
  duplicateEngagement: (id: string, campaignId?: string | null) => Promise<Engagement | null>;
  attachCreatorToCampaign: (creatorId: string, campaignId: string | null) => Promise<Engagement | null>;

  // campaigns
  addCampaign: (partial: Partial<Campaign>) => Promise<Campaign | null>;
  updateCampaign: (id: string, patch: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // companies
  addCompany: (partial: Partial<Company>) => Promise<Company | null>;
  updateCompany: (id: string, patch: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // users
  addUser: (partial: Partial<User>) => Promise<User | null>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // todos
  addTodo: (partial: Partial<Todo>) => Promise<Todo | null>;
  updateTodo: (id: string, patch: Partial<Todo>) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  // documents & finance
  upsertCompliance: (creatorId: string, key: string, patch: Partial<ComplianceItem>) => Promise<void>;
  addExpense: (partial: Partial<Expense>) => Promise<Expense | null>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  requestReceipt: (expenseId: string) => Promise<void>;
  addPayment: (partial: Partial<Payment>) => Promise<Payment | null>;
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addDocument: (partial: Partial<Document>) => Promise<Document | null>;
  updateDocument: (id: string, patch: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  // posts (logbook)
  addPost: (partial: Partial<Post>) => Promise<Post | null>;
  syncEngagementSpend: (engagementId: string | null) => Promise<void>;
  reconcileSpend: () => Promise<void>;
  updatePost: (id: string, patch: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;

  // internal boosts
  addInternalBoost: (partial: Partial<InternalBoost>) => Promise<InternalBoost | null>;
  updateInternalBoost: (id: string, patch: Partial<InternalBoost>) => Promise<void>;
  deleteInternalBoost: (id: string) => Promise<void>;

  // prospects
  addProspect: (partial: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  convertProspect: (id: string, campaignId?: string | null) => Promise<void>;

  updateRoiSettings: (patch: Partial<RoiSettings>) => Promise<void>;
}

const DEFAULT_ROI: RoiSettings = { per_k_views: 12, per_engagement: 0.18, sentiment_weight: 0.1, platform_rates: {} };

export const useStore = create<StoreState>((set, get) => ({
  loading: false,
  ready: false,
  error: null,

  session: null,
  currentUser: null,
  authReady: false,
  userSettings: {},

  companies: [],
  users: [],
  creators: [],
  campaigns: [],
  engagements: [],
  posts: [],
  internalBoosts: [],
  todos: [],
  prospects: [],
  activity: [],
  roiSettings: DEFAULT_ROI,
  complianceItems: [],
  expenses: [],
  payments: [],
  documents: [],

  views: [],
  activeViews: [],

  activeCompanyId: null,
  scopedCampaigns: [],
  scopedViews: [],
  scopedActiveViews: [],
  scopedEngagements: [],
  scopedPosts: [],
  scopedInternalBoosts: [],
  scopedTodos: [],
  scopedProspects: [],
  undoStack: [],

  setActiveCompany: (id) => {
    if (typeof window !== "undefined") {
      try { id ? localStorage.setItem("sb_active_company", id) : localStorage.removeItem("sb_active_company"); } catch {}
    }
    set({ activeCompanyId: id });
    get().recompute();
  },
  recompute: () => {
    const { creators, campaigns, engagements, posts, internalBoosts, todos, prospects, activeCompanyId } = get();
    const views = buildViews(creators, campaigns, engagements);
    const scoped = computeScoped(activeCompanyId, { campaigns, views, engagements, posts, internalBoosts, todos, prospects });
    set({
      views,
      activeViews: views.filter((v) => !v.archived && !v.creator.archived),
      ...scoped,
    });
  },

  pushUndo: (label, run) => set({ undoStack: [...get().undoStack, { label, run }].slice(-20) }),

  undo: async () => {
    const stack = get().undoStack;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    set({ undoStack: stack.slice(0, -1) });
    try { await entry.run(); } catch (e) { set({ error: e instanceof Error ? e.message : "Could not undo." }); }
  },

  initAuth: async () => {
    if (!supabaseConfigured) {
      set({ authReady: true, error: "Supabase isn't connected yet. Add your env vars and reload." });
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const cu = await ensureProfile(data.session.user);
      set({ session: data.session, currentUser: cu });
      await get().fetchAll();
      await get().loadUserSettings();
      // restore last-selected client
      try {
        const saved = typeof window !== "undefined" ? localStorage.getItem("sb_active_company") : null;
        if (saved && get().companies.some((c) => c.id === saved)) get().setActiveCompany(saved);
      } catch {}
      get().reconcileSpend();
    }
    set({ authReady: true });

    supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === "SIGNED_IN" && sess) {
        if (get().session?.user.id === sess.user.id) return; // already handled
        const cu = await ensureProfile(sess.user);
        set({ session: sess, currentUser: cu });
        await get().fetchAll();
        await get().loadUserSettings();
      } else if (event === "SIGNED_OUT") {
        set({ session: null, currentUser: null, userSettings: {} });
      }
    });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? error.message : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, currentUser: null, userSettings: {} });
  },

  updateCurrentUser: async (patch) => {
    const me = get().currentUser;
    if (!me) return;
    set({ currentUser: { ...me, ...patch } });
    await get().updateUser(me.id, patch);
  },

  loadUserSettings: async () => {
    const uid = get().currentUser?.id;
    if (!uid) return;
    const { data } = await supabase.from("user_settings").select("data").eq("user_id", uid).maybeSingle();
    set({ userSettings: (data?.data as Record<string, unknown>) ?? {} });
  },

  saveUserSettings: async (patch) => {
    const next = { ...get().userSettings, ...patch };
    set({ userSettings: next });
    const uid = get().currentUser?.id;
    if (!uid) return;
    await supabase.from("user_settings").upsert({ user_id: uid, data: next, updated_at: new Date().toISOString() });
  },

  fetchAll: async () => {
    if (!supabaseConfigured) {
      set({ ready: true, error: "Supabase isn't connected yet. Add your env vars and reload." });
      return;
    }
    set({ loading: true, error: null });
    try {
      const [co, us, c, cam, en, po, ib, td, pr, ac, rs, ci, ex, pm, dc] = await Promise.all([
        supabase.from("companies").select("*").order("name", { ascending: true }),
        supabase.from("users").select("*").order("created_at", { ascending: true }),
        supabase.from("creators").select("*").order("created_at", { ascending: true }),
        supabase.from("campaigns").select("*").order("sort_order", { ascending: true }),
        supabase.from("engagements").select("*").order("created_at", { ascending: true }),
        supabase.from("posts").select("*").order("post_date", { ascending: false }),
        supabase.from("internal_boosts").select("*").order("created_at", { ascending: false }),
        supabase.from("todos").select("*").order("created_at", { ascending: false }),
        supabase.from("prospects").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("roi_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("compliance_items").select("*"),
        supabase.from("expenses").select("*").order("spent_on", { ascending: false }),
        supabase.from("payments").select("*").order("paid_date", { ascending: false }),
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
      ]);
      if (c.error) throw c.error;
      const creators = (c.data as Creator[]) ?? [];
      const campaigns = (cam.data as Campaign[]) ?? [];
      const engagements = (en.data as Engagement[]) ?? [];
      const views = buildViews(creators, campaigns, engagements);
      set({
        companies: (co.data as Company[]) ?? [],
        users: (us.data as User[]) ?? [],
        creators,
        campaigns,
        engagements,
        posts: (po.data as Post[]) ?? [],
        internalBoosts: (ib.data as InternalBoost[]) ?? [],
        todos: (td.data as Todo[]) ?? [],
        prospects: (pr.data as Prospect[]) ?? [],
        activity: (ac.data as Activity[]) ?? [],
        roiSettings: rs.data
          ? {
              per_k_views: Number((rs.data as { per_k_views: number }).per_k_views),
              per_engagement: Number((rs.data as { per_engagement: number }).per_engagement),
              sentiment_weight:
                (rs.data as { sentiment_weight?: number }).sentiment_weight != null
                  ? Number((rs.data as { sentiment_weight: number }).sentiment_weight)
                  : DEFAULT_ROI.sentiment_weight,
              platform_rates:
                (rs.data as { platform_rates?: Record<string, { per_k_views: number; per_engagement: number }> | null }).platform_rates ?? {},
            }
          : DEFAULT_ROI,
        complianceItems: (ci.data as ComplianceItem[]) ?? [],
        expenses: (ex.data as Expense[]) ?? [],
        payments: (pm.data as Payment[]) ?? [],
        documents: (dc.data as Document[]) ?? [],
        views,
        activeViews: views.filter((v) => !v.archived && !v.creator.archived),
        loading: false,
        ready: true,
      });
      get().recompute(); // build client-scoped collections
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not reach Supabase.";
      set({ loading: false, ready: true, error: message });
    }
  },

  log: async (text, refs = {}, kind = "note") => {
    const me = get().currentUser;
    const actor = me?.name ?? "Someone";
    const uid = me?.id ?? null;
    const optimistic: Activity = {
      id: `tmp-${Date.now()}`,
      created_at: new Date().toISOString(),
      user_id: uid,
      actor,
      creator_id: refs.creator_id ?? null,
      campaign_id: refs.campaign_id ?? null,
      engagement_id: refs.engagement_id ?? null,
      text,
      kind,
    };
    set({ activity: [optimistic, ...get().activity] });
    try {
      const { data } = await supabase
        .from("activity_log")
        .insert({
          user_id: uid,
          actor,
          creator_id: refs.creator_id ?? null,
          campaign_id: refs.campaign_id ?? null,
          engagement_id: refs.engagement_id ?? null,
          text,
          kind,
        })
        .select()
        .single();
      if (data) {
        set({ activity: [data as Activity, ...get().activity.filter((x) => x.id !== optimistic.id)] });
      }
    } catch {
      /* keep optimistic entry */
    }
  },

  // ---- creators -----------------------------------------------------------
  addCreator: async (partial) => {
    const base: Partial<Creator> = {
      name: "New star",
      handle: "@newstar",
      platform: "Instagram",
      archived: false,
      ...partial,
    };
    const { data, error } = await supabase.from("creators").insert(pickCreator(base)).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not add creator." });
      return null;
    }
    set({ creators: [...get().creators, data as Creator] });
    get().recompute();
    await get().log(`Added ${(data as Creator).name} to the Star Atlas`, { creator_id: (data as Creator).id }, "create");
    return data as Creator;
  },

  updateCreator: async (id, patch, activityText) => {
    const prev = get().creators.find((c) => c.id === id);
    set({ creators: get().creators.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    get().recompute();
    const { data, error } = await supabase.from("creators").update(pickCreator(patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) {
        set({ creators: get().creators.map((c) => (c.id === id ? prev : c)) });
        get().recompute();
      }
      return;
    }
    if (data) {
      set({ creators: get().creators.map((c) => (c.id === id ? (data as Creator) : c)) });
      get().recompute();
    }
    if (activityText) await get().log(activityText, { creator_id: id }, "update");
  },

  deleteCreator: async (id) => {
    const c = get().creators.find((x) => x.id === id);
    set({
      creators: get().creators.filter((x) => x.id !== id),
      engagements: get().engagements.filter((e) => e.creator_id !== id), // FK cascades in DB
    });
    get().recompute();
    const { error } = await supabase.from("creators").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      get().fetchAll();
      return;
    }
    if (c) await get().log(`Removed ${c.name} from the Star Atlas`, {}, "delete");
    if (c) get().pushUndo("Delete creator", async () => { await supabase.from("creators").insert(c); await get().fetchAll(); });
  },

  archiveCreator: async (id, archived) => {
    const c = get().creators.find((x) => x.id === id);
    await get().updateCreator(id, { archived }, c ? `${archived ? "Archived" : "Restored"} ${c.name}` : undefined);
    get().pushUndo(archived ? "Archive creator" : "Restore creator", async () => { await get().updateCreator(id, { archived: !archived }); });
  },

  addCreatorWithEngagement: async (profile, campaignId = null, engagement = {}) => {
    const creator = await get().addCreator(profile);
    if (!creator) return null;
    const eng = await get().addEngagement({ creator_id: creator.id, campaign_id: campaignId, ...engagement });
    if (!eng) return null;
    return { creator, engagement: eng };
  },

  // ---- engagements --------------------------------------------------------
  addEngagement: async (partial) => {
    if (!partial.creator_id) {
      set({ error: "An engagement needs a creator." });
      return null;
    }
    const base: Partial<Engagement> = {
      campaign_id: null,
      stage: "Sighted",
      status_tag: null,
      contract_status: "Not Sent",
      invoice_status: "Not Received",
      creator_fee: 0,
      boost_spend: 0,
      is_annual: false,
      archived: false,
      ...partial,
    };
    // A campaign-less engagement has no company via a campaign, so stamp the active
    // client directly — otherwise client-scoping would hide it (e.g. adding from Stargazing).
    if (!base.campaign_id && !base.company_id) base.company_id = get().activeCompanyId ?? null;
    const payload = { creator_id: partial.creator_id, ...pickEngagement(base) };
    const { data, error } = await supabase.from("engagements").insert(payload).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not add engagement." });
      return null;
    }
    set({ engagements: [...get().engagements, data as Engagement] });
    get().recompute();
    const e = data as Engagement;
    const who = get().creators.find((c) => c.id === e.creator_id)?.name ?? "a creator";
    await get().log(`Started a journey for ${who}`, { creator_id: e.creator_id, campaign_id: e.campaign_id, engagement_id: e.id }, "create");
    return e;
  },

  updateEngagement: async (id, patch, activityText) => {
    const prev = get().engagements.find((e) => e.id === id);
    set({ engagements: get().engagements.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    get().recompute();
    const { data, error } = await supabase.from("engagements").update(pickEngagement(patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) {
        set({ engagements: get().engagements.map((e) => (e.id === id ? prev : e)) });
        get().recompute();
      }
      return;
    }
    if (data) {
      set({ engagements: get().engagements.map((e) => (e.id === id ? (data as Engagement) : e)) });
      get().recompute();
    }
    if (activityText) {
      const e = (data as Engagement) ?? prev;
      await get().log(activityText, { creator_id: e?.creator_id ?? null, campaign_id: e?.campaign_id ?? null, engagement_id: id }, "update");
    }
  },

  deleteEngagement: async (id) => {
    const e = get().engagements.find((x) => x.id === id);
    set({ engagements: get().engagements.filter((x) => x.id !== id) });
    get().recompute();
    const { error } = await supabase.from("engagements").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      get().fetchAll();
      return;
    }
    const who = e ? get().creators.find((c) => c.id === e.creator_id)?.name ?? "a creator" : "a creator";
    await get().log(`Ended a journey for ${who}`, {}, "delete");
    if (e) get().pushUndo("Delete journey", async () => { const clean = { ...e } as Record<string, unknown>; delete clean.total_spend; await supabase.from("engagements").insert(clean); await get().fetchAll(); });
  },

  archiveEngagement: async (id, archived) => {
    await get().updateEngagement(id, { archived }, archived ? "Archived a journey" : "Restored a journey");
    get().pushUndo(archived ? "Archive journey" : "Restore journey", async () => { await get().updateEngagement(id, { archived: !archived }); });
  },

  moveStage: async (id, stage) => {
    const e = get().engagements.find((x) => x.id === id);
    if (!e || e.stage === stage) return;
    const who = get().creators.find((c) => c.id === e.creator_id)?.name ?? "a creator";
    await get().updateEngagement(id, { stage }, `Moved ${who}: ${e.stage} → ${stage}`);
    get().pushUndo("Move stage", async () => { await get().updateEngagement(id, { stage: e.stage }); });
  },

  duplicateEngagement: async (id, campaignId) => {
    const e = get().engagements.find((x) => x.id === id);
    if (!e) return null;
    const clone: Partial<Engagement> = {
      ...e,
      campaign_id: campaignId !== undefined ? campaignId : e.campaign_id,
      stage: "Sighted",
      status_tag: null,
      contract_status: "Not Sent",
      invoice_status: "Not Received",
    };
    return get().addEngagement(clone);
  },

  attachCreatorToCampaign: async (creatorId, campaignId) => {
    return get().addEngagement({ creator_id: creatorId, campaign_id: campaignId, stage: "Sighted" });
  },

  // ---- campaigns ----------------------------------------------------------
  addCampaign: async (partial) => {
    const maxSort = get().campaigns.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);
    const base = {
      company_id: partial.company_id ?? null,
      name: (partial.name ?? "").trim() || "New Eclipse",
      fy_budget_allocation: Number(partial.fy_budget_allocation ?? 0),
      color: partial.color || "#B7C8EA",
      sort_order: partial.sort_order ?? maxSort + 1,
      start_date: partial.start_date ?? null,
      end_date: partial.end_date ?? null,
      notes: partial.notes ?? null,
    };
    const { data, error } = await supabase.from("campaigns").insert(base).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not chart the eclipse." });
      return null;
    }
    set({ campaigns: [...get().campaigns, data as Campaign] });
    get().recompute();
    await get().log(`Charted a new eclipse: ${(data as Campaign).name}`, { campaign_id: (data as Campaign).id }, "create");
    return data as Campaign;
  },

  updateCampaign: async (id, patch) => {
    const KEYS: (keyof Campaign)[] = ["company_id", "name", "fy_budget_allocation", "color", "sort_order", "start_date", "end_date", "notes"];
    const prev = get().campaigns.find((c) => c.id === id);
    set({ campaigns: get().campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    get().recompute();
    const { data, error } = await supabase.from("campaigns").update(pick(KEYS, patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) {
        set({ campaigns: get().campaigns.map((c) => (c.id === id ? prev : c)) });
        get().recompute();
      }
      return;
    }
    if (data) {
      set({ campaigns: get().campaigns.map((c) => (c.id === id ? (data as Campaign) : c)) });
      get().recompute();
    }
  },

  deleteCampaign: async (id) => {
    const prev = get().campaigns.find((c) => c.id === id);
    set({ campaigns: get().campaigns.filter((c) => c.id !== id) });
    get().recompute();
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      get().fetchAll();
      return;
    }
    if (prev) await get().log(`Removed eclipse: ${prev.name}`, {}, "delete");
  },

  // ---- companies ----------------------------------------------------------
  addCompany: async (partial) => {
    const base = {
      name: (partial.name ?? "").trim() || "New Company",
      kind: partial.kind ?? "Client",
      color: partial.color || "#8FA8D8",
      budget: Number(partial.budget ?? 0),
      priority: partial.priority ?? "Normal",
      notes: partial.notes ?? null,
    };
    const { data, error } = await supabase.from("companies").insert(base).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not add company." });
      return null;
    }
    set({ companies: [...get().companies, data as Company] });
    return data as Company;
  },

  updateCompany: async (id, patch) => {
    const KEYS: (keyof Company)[] = ["name", "kind", "color", "budget", "priority", "notes"];
    const prev = get().companies.find((c) => c.id === id);
    set({ companies: get().companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    const { data, error } = await supabase.from("companies").update(pick(KEYS, patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) set({ companies: get().companies.map((c) => (c.id === id ? prev : c)) });
      return;
    }
    if (data) set({ companies: get().companies.map((c) => (c.id === id ? (data as Company) : c)) });
  },

  deleteCompany: async (id) => {
    const prev = get().companies.find((c) => c.id === id);
    set({ companies: get().companies.filter((c) => c.id !== id) });
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      if (prev) set({ companies: [...get().companies, prev] });
      return;
    }
    if (prev) get().pushUndo("Delete client", async () => { await supabase.from("companies").insert(prev); await get().fetchAll(); });
  },

  // ---- users --------------------------------------------------------------
  addUser: async (partial) => {
    const base = {
      name: (partial.name ?? "").trim() || "New member",
      email: partial.email ?? null,
      role: partial.role ?? "Member",
      color: partial.color || "#CDB4F0",
      emoji: partial.emoji ?? null,
      gradient: partial.gradient ?? null,
      active: partial.active ?? true,
    };
    const { data, error } = await supabase.from("users").insert(base).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not add user." });
      return null;
    }
    set({ users: [...get().users, data as User] });
    return data as User;
  },

  updateUser: async (id, patch) => {
    const KEYS: (keyof User)[] = ["name", "email", "role", "color", "emoji", "gradient", "active"];
    const prev = get().users.find((u) => u.id === id);
    set({ users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
    const { data, error } = await supabase.from("users").update(pick(KEYS, patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) set({ users: get().users.map((u) => (u.id === id ? prev : u)) });
      return;
    }
    if (data) set({ users: get().users.map((u) => (u.id === id ? (data as User) : u)) });
  },

  deleteUser: async (id) => {
    const prev = get().users.find((u) => u.id === id);
    set({ users: get().users.filter((u) => u.id !== id) });
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      if (prev) set({ users: [...get().users, prev] });
    }
  },

  // ---- todos --------------------------------------------------------------
  addTodo: async (partial) => {
    const base = {
      title: (partial.title ?? "").trim() || "New task",
      done: partial.done ?? false,
      due_date: partial.due_date ?? null,
      priority: partial.priority ?? "Normal",
      category: partial.category ?? "General",
      assignee_id: partial.assignee_id ?? null,
      campaign_id: partial.campaign_id ?? null,
      creator_id: partial.creator_id ?? null,
      notes: partial.notes ?? null,
    };
    const { data, error } = await supabase.from("todos").insert(base).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not add task." });
      return null;
    }
    set({ todos: [data as Todo, ...get().todos] });
    return data as Todo;
  },

  upsertCompliance: async (creatorId, key, patch) => {
    const company_id = get().activeCompanyId ?? null;
    const existing = get().complianceItems.find(
      (x) => x.creator_id === creatorId && x.key === key && (x.company_id ?? null) === company_id
    );
    if (existing) {
      set({ complianceItems: get().complianceItems.map((x) => (x.id === existing.id ? { ...x, ...patch } : x)) });
      const { error } = await supabase.from("compliance_items").update(patch).eq("id", existing.id);
      if (error) set({ error: error.message });
    } else {
      const base = { company_id, creator_id: creatorId, key, done: false, completed_at: null, completed_by: null, notes: null, doc_path: null, ...patch };
      const { data, error } = await supabase.from("compliance_items").insert(base).select().single();
      if (error || !data) { set({ error: error?.message ?? "Could not update compliance." }); return; }
      set({ complianceItems: [...get().complianceItems, data as ComplianceItem] });
    }
  },

  addExpense: async (partial) => {
    const base = {
      company_id: partial.company_id ?? get().activeCompanyId ?? null,
      creator_id: partial.creator_id ?? null,
      campaign_id: partial.campaign_id ?? null,
      spent_on: partial.spent_on ?? null,
      category: partial.category ?? "Misc",
      description: partial.description ?? null,
      amount: Number(partial.amount ?? 0),
      reimbursable: partial.reimbursable ?? true,
      receipt_attached: partial.receipt_attached ?? false,
      status: partial.status ?? "Pending",
    };
    const { data, error } = await supabase.from("expenses").insert(base).select().single();
    if (error || !data) { set({ error: error?.message ?? "Could not add expense." }); return null; }
    set({ expenses: [data as Expense, ...get().expenses] });
    return data as Expense;
  },
  updateExpense: async (id, patch) => {
    set({ expenses: get().expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    const { error } = await supabase.from("expenses").update(patch).eq("id", id);
    if (error) { set({ error: error.message }); get().fetchAll(); }
  },
  deleteExpense: async (id) => {
    set({ expenses: get().expenses.filter((e) => e.id !== id) });
    await supabase.from("expenses").delete().eq("id", id);
  },
  requestReceipt: async (expenseId) => {
    const e = get().expenses.find((x) => x.id === expenseId);
    if (!e) return;
    const creator = get().creators.find((c) => c.id === e.creator_id);
    const due = new Date(); due.setDate(due.getDate() + 3);
    await get().addTodo({
      title: `Request ${e.category} receipt from ${creator?.name ?? "creator"}`,
      due_date: due.toISOString().slice(0, 10),
      category: "Finance",
      creator_id: e.creator_id,
      campaign_id: e.campaign_id,
    });
  },

  addPayment: async (partial) => {
    const base = {
      company_id: partial.company_id ?? get().activeCompanyId ?? null,
      creator_id: partial.creator_id ?? null,
      campaign_id: partial.campaign_id ?? null,
      invoice_number: partial.invoice_number ?? null,
      amount: Number(partial.amount ?? 0),
      paid_date: partial.paid_date ?? null,
      method: partial.method ?? null,
      status: partial.status ?? "Outstanding",
    };
    const { data, error } = await supabase.from("payments").insert(base).select().single();
    if (error || !data) { set({ error: error?.message ?? "Could not add payment." }); return null; }
    set({ payments: [data as Payment, ...get().payments] });
    return data as Payment;
  },
  updatePayment: async (id, patch) => {
    set({ payments: get().payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    const { error } = await supabase.from("payments").update(patch).eq("id", id);
    if (error) { set({ error: error.message }); get().fetchAll(); }
  },
  deletePayment: async (id) => {
    set({ payments: get().payments.filter((p) => p.id !== id) });
    await supabase.from("payments").delete().eq("id", id);
  },

  addDocument: async (partial) => {
    const company_id = partial.company_id ?? get().activeCompanyId ?? null;
    const group_key = partial.group_key ?? "";
    const existing = get().documents.filter((d) => d.creator_id === partial.creator_id && (d.group_key ?? "") === group_key);
    const version = existing.length ? Math.max(...existing.map((d) => d.version || 1)) + 1 : 1;
    const base = {
      company_id, creator_id: partial.creator_id ?? null, campaign_id: partial.campaign_id ?? null,
      category: partial.category ?? "Other", file_name: partial.file_name ?? "file", path: partial.path ?? "",
      size_bytes: partial.size_bytes ?? null, mime: partial.mime ?? null, version, group_key,
      uploaded_by: partial.uploaded_by ?? null,
    };
    const { data, error } = await supabase.from("documents").insert(base).select().single();
    if (error || !data) { set({ error: error?.message ?? "Could not save the document." }); return null; }
    set({ documents: [data as Document, ...get().documents] });
    return data as Document;
  },
  updateDocument: async (id, patch) => {
    set({ documents: get().documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
    const { error } = await supabase.from("documents").update(patch).eq("id", id);
    if (error) { set({ error: error.message }); get().fetchAll(); }
  },
  deleteDocument: async (id) => {
    const d = get().documents.find((x) => x.id === id);
    set({ documents: get().documents.filter((x) => x.id !== id) });
    await supabase.from("documents").delete().eq("id", id);
    if (d?.path) { try { await supabase.storage.from("creator-docs").remove([d.path]); } catch { /* ignore */ } }
  },

  updateTodo: async (id, patch) => {
    const KEYS: (keyof Todo)[] = ["title", "done", "due_date", "priority", "category", "assignee_id", "campaign_id", "creator_id", "notes"];
    const prev = get().todos.find((t) => t.id === id);
    set({ todos: get().todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
    const { data, error } = await supabase.from("todos").update(pick(KEYS, patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) set({ todos: get().todos.map((t) => (t.id === id ? prev : t)) });
      return;
    }
    if (data) set({ todos: get().todos.map((t) => (t.id === id ? (data as Todo) : t)) });
  },

  toggleTodo: async (id) => {
    const t = get().todos.find((x) => x.id === id);
    if (!t) return;
    await get().updateTodo(id, { done: !t.done });
  },

  deleteTodo: async (id) => {
    const prev = get().todos.find((t) => t.id === id);
    set({ todos: get().todos.filter((t) => t.id !== id) });
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      if (prev) set({ todos: [prev, ...get().todos] });
      return;
    }
    if (prev) get().pushUndo("Delete task", async () => { await supabase.from("todos").insert(prev); await get().fetchAll(); });
  },

  // ---- posts (logbook) ----------------------------------------------------
  // Roll a creator's logged post spend up into their engagement, so the Logbook
  // drives Nightfall / Constellation / Stardust. Engagements with no posts keep their
  // manually-entered (planned) values.
  syncEngagementSpend: async (engagementId) => {
    if (!engagementId) return;
    const posts = get().posts.filter((p) => p.engagement_id === engagementId);
    if (posts.length === 0) return;
    const fee = posts.reduce((sum, p) => sum + Number(p.fee || 0), 0);
    const boost = posts.reduce((sum, p) => sum + Number(p.boost_spend || 0), 0);
    const e = get().engagements.find((x) => x.id === engagementId);
    if (!e) return;
    if (Number(e.creator_fee || 0) === fee && Number(e.boost_spend || 0) === boost) return;
    await get().updateEngagement(engagementId, { creator_fee: fee, boost_spend: boost });
  },

  // One-time reconcile: sync every engagement that has posts to its post totals.
  reconcileSpend: async () => {
    const { engagements, posts } = get();
    const byEng = new Map<string, { fee: number; boost: number }>();
    for (const p of posts) {
      if (!p.engagement_id) continue;
      const cur = byEng.get(p.engagement_id) ?? { fee: 0, boost: 0 };
      cur.fee += Number(p.fee || 0);
      cur.boost += Number(p.boost_spend || 0);
      byEng.set(p.engagement_id, cur);
    }
    const jobs: Promise<void>[] = [];
    for (const [engId, sums] of byEng) {
      const e = engagements.find((x) => x.id === engId);
      if (!e) continue;
      if (Number(e.creator_fee || 0) !== sums.fee || Number(e.boost_spend || 0) !== sums.boost) {
        jobs.push(get().updateEngagement(engId, { creator_fee: sums.fee, boost_spend: sums.boost }));
      }
    }
    await Promise.all(jobs);
  },

  addPost: async (partial) => {
    const base = {
      engagement_id: partial.engagement_id ?? null,
      kind: partial.kind ?? "post",
      story_count: partial.story_count ?? null,
      thumbnail: partial.thumbnail ?? null,
      platform: partial.platform ?? "Instagram",
      url: partial.url ?? null,
      post_date: partial.post_date ?? null,
      boost_start: partial.boost_start ?? null,
      boost_end: partial.boost_end ?? null,
      fee: Number(partial.fee ?? 0),
      boost_spend: Number(partial.boost_spend ?? 0),
      views: Number(partial.views ?? 0),
      likes: Number(partial.likes ?? 0),
      comments: Number(partial.comments ?? 0),
      shares: Number(partial.shares ?? 0),
      saves: Number(partial.saves ?? 0),
      platforms: partial.platforms ?? [],
      sent_positive: Number(partial.sent_positive ?? 0),
      sent_negative: Number(partial.sent_negative ?? 0),
      notes: partial.notes ?? null,
    };
    const { data, error } = await supabase.from("posts").insert(base).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not log the post." });
      return null;
    }
    set({ posts: [data as Post, ...get().posts] });
    await get().log("Logged a post in the Logbook", { engagement_id: base.engagement_id }, "create");
    await get().syncEngagementSpend(base.engagement_id);
    return data as Post;
  },

  updatePost: async (id, patch) => {
    const KEYS: (keyof Post)[] = ["engagement_id", "kind", "story_count", "thumbnail", "platform", "url", "post_date", "boost_start", "boost_end", "fee", "boost_spend", "views", "likes", "comments", "shares", "saves", "platforms", "sent_positive", "sent_negative", "notes"];
    const prev = get().posts.find((p) => p.id === id);
    set({ posts: get().posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
    const { data, error } = await supabase.from("posts").update(pick(KEYS, patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) set({ posts: get().posts.map((p) => (p.id === id ? prev : p)) });
      return;
    }
    if (data) set({ posts: get().posts.map((p) => (p.id === id ? (data as Post) : p)) });
    const newEng = (data as Post | undefined)?.engagement_id ?? prev?.engagement_id ?? null;
    await get().syncEngagementSpend(newEng);
    if (prev && prev.engagement_id && prev.engagement_id !== newEng) await get().syncEngagementSpend(prev.engagement_id);
  },

  deletePost: async (id) => {
    const prev = get().posts.find((p) => p.id === id);
    set({ posts: get().posts.filter((p) => p.id !== id) });
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      if (prev) set({ posts: [prev, ...get().posts] });
      return;
    }
    await get().log("Removed a post from the Logbook", { engagement_id: prev?.engagement_id ?? null }, "delete");
    if (prev) get().pushUndo("Delete post", async () => { await supabase.from("posts").insert(prev); await get().fetchAll(); });
    if (prev?.engagement_id) await get().syncEngagementSpend(prev.engagement_id);
  },

  // ---- internal boosts ----------------------------------------------------
  addInternalBoost: async (partial) => {
    const base = {
      company_id: partial.company_id ?? null,
      campaign_id: partial.campaign_id ?? null,
      label: (partial.label ?? "").trim() || "Internal boost",
      platform: partial.platform ?? "Instagram",
      amount: Number(partial.amount ?? 0),
      boost_start: partial.boost_start ?? null,
      boost_end: partial.boost_end ?? null,
      notes: partial.notes ?? null,
    };
    const { data, error } = await supabase.from("internal_boosts").insert(base).select().single();
    if (error || !data) {
      set({ error: error?.message ?? "Could not log the internal boost." });
      return null;
    }
    set({ internalBoosts: [data as InternalBoost, ...get().internalBoosts] });
    await get().log(`Logged an internal boost: ${(data as InternalBoost).label}`, { campaign_id: base.campaign_id }, "create");
    return data as InternalBoost;
  },

  updateInternalBoost: async (id, patch) => {
    const KEYS: (keyof InternalBoost)[] = ["company_id", "campaign_id", "label", "platform", "amount", "boost_start", "boost_end", "notes"];
    const prev = get().internalBoosts.find((b) => b.id === id);
    set({ internalBoosts: get().internalBoosts.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
    const { data, error } = await supabase.from("internal_boosts").update(pick(KEYS, patch)).eq("id", id).select().single();
    if (error) {
      set({ error: error.message });
      if (prev) set({ internalBoosts: get().internalBoosts.map((b) => (b.id === id ? prev : b)) });
      return;
    }
    if (data) set({ internalBoosts: get().internalBoosts.map((b) => (b.id === id ? (data as InternalBoost) : b)) });
  },

  deleteInternalBoost: async (id) => {
    const b = get().internalBoosts.find((x) => x.id === id);
    set({ internalBoosts: get().internalBoosts.filter((x) => x.id !== id) });
    const { error } = await supabase.from("internal_boosts").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      get().fetchAll();
      return;
    }
    if (b) await get().log(`Removed an internal boost: ${b.label}`, {}, "delete");
    if (b) get().pushUndo("Delete internal boost", async () => { await supabase.from("internal_boosts").insert(b); await get().fetchAll(); });
  },

  // ---- prospects ----------------------------------------------------------
  addProspect: async (partial) => {
    const base = {
      company_id: partial.company_id ?? null,
      handle: partial.handle ?? "@newstar",
      platform: partial.platform ?? "Instagram",
      followers: partial.followers ?? null,
      category: partial.category ?? null,
      email: partial.email ?? null,
      estimated_rate: partial.estimated_rate ?? null,
      notes: partial.notes ?? null,
    };
    const { data, error } = await supabase.from("prospects").insert(base).select().single();
    if (error) {
      set({ error: error.message });
      return;
    }
    if (data) set({ prospects: [data as Prospect, ...get().prospects] });
  },

  deleteProspect: async (id) => {
    const prev = get().prospects.find((p) => p.id === id);
    set({ prospects: get().prospects.filter((p) => p.id !== id) });
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) { set({ error: error.message }); get().fetchAll(); return; }
    if (prev) get().pushUndo("Delete prospect", async () => { await supabase.from("prospects").insert(prev); await get().fetchAll(); });
  },

  convertProspect: async (id, campaignId = null) => {
    const p = get().prospects.find((x) => x.id === id);
    if (!p) return;
    const created = await get().addCreatorWithEngagement(
      {
        name: p.handle.replace(/^@/, ""),
        handle: p.handle,
        platform: p.platform,
        email: p.email,
        followers: p.followers,
        categories: p.category,
        notes: p.notes,
      },
      campaignId,
      {
        company_id: p.company_id ?? get().activeCompanyId ?? null,
        negotiated_rate: p.estimated_rate,
        creator_fee: p.estimated_rate ?? 0,
        stage: "In Orbit",
        status_tag: "Interested",
      }
    );
    if (created) {
      await get().deleteProspect(id);
      await get().log(`Scouted ${p.handle} into a journey`, { creator_id: created.creator.id, engagement_id: created.engagement.id }, "convert");
    }
  },

  updateRoiSettings: async (patch) => {
    const next = { ...get().roiSettings, ...patch };
    set({ roiSettings: next });
    const { error } = await supabase
      .from("roi_settings")
      .upsert({ id: 1, per_k_views: next.per_k_views, per_engagement: next.per_engagement, sentiment_weight: next.sentiment_weight, platform_rates: next.platform_rates ?? {}, updated_at: new Date().toISOString() });
    if (error) set({ error: error.message });
  },
}));
