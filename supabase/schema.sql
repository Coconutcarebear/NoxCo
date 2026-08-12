-- ============================================================================
-- Nox & Co — database schema (v2, normalized)
-- Run this FIRST in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Then run seed.sql to load the Nox & Co company, your user, and ROI defaults.
--
-- WHAT CHANGED FROM v1
--   * A creator is now a PROFILE that exists once. Their work on a specific
--     campaign lives in a separate `engagements` row. The same creator can have
--     many engagements across many campaigns/companies — no more duplicate rows.
--   * `campaigns` now belong to a company and carry start_date / end_date.
--   * New tables: companies, users, todos (plus internal_boosts, roi_settings,
--     and a corrected posts table that were previously only created ad-hoc).
-- ============================================================================

-- Fresh start: drop everything from any earlier version, in FK-safe order.
drop table if exists public.activity_log    cascade;
drop table if exists public.todos           cascade;
drop table if exists public.documents       cascade;
drop table if exists public.payments        cascade;
drop table if exists public.expenses        cascade;
drop table if exists public.compliance_items cascade;
drop table if exists public.posts           cascade;
drop table if exists public.internal_boosts cascade;
drop table if exists public.contracts       cascade;
drop table if exists public.report_shares   cascade;
drop table if exists public.projects        cascade;
drop table if exists public.engagements     cascade;
drop table if exists public.prospects       cascade;
drop table if exists public.campaigns       cascade;
drop table if exists public.creators        cascade;
drop table if exists public.roi_settings    cascade;
drop table if exists public.users           cascade;
drop table if exists public.companies       cascade;

-- ----------------------------------------------------------------------------
-- companies — Nox & Co plus any other org you run campaigns for.
-- ----------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  kind text not null default 'Client',      -- 'In-house' or 'Client'
  color text not null default '#8FA8D8',
  budget numeric not null default 0,        -- this client's budget (drives its dashboard)
  priority text not null default 'Normal',  -- High / Normal / Low
  notes text
);

-- ----------------------------------------------------------------------------
-- users — team roster for attribution + todo assignment.
-- NOTE: this is a roster, not authentication. You're still on the anon key.
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  auth_id uuid,                              -- links to a Supabase Auth user (set on first login)
  company_id uuid references public.companies(id) on delete set null,  -- set only for role = 'Client'
  name text not null,
  email text,
  role text not null default 'Member',       -- Owner / Editor / Viewer / Client
  color text not null default '#CDB4F0',
  emoji text,                                -- cute avatar the user picks
  gradient text,                             -- avatar gradient preset key
  active boolean not null default true
);

create index users_company_idx on public.users (company_id);

-- ----------------------------------------------------------------------------
-- creators — the PROFILE only (durable, person-level facts).
-- Per-campaign details (stage, fees, dates, contract, invoice) live in
-- `engagements`, never here.
-- ----------------------------------------------------------------------------
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  name text not null default 'New star',
  handle text not null default '@newstar',
  email text,
  phone text,
  city text,
  state text,
  platform text not null default 'Instagram',
  categories text,
  bio text,
  profile_image text,
  notes text,

  followers integer,
  engagement_rate numeric,
  audience_demographics text,
  audience_location text,

  standard_rate numeric default 0,          -- their rack rate; negotiated rate is per-engagement
  w9_on_file boolean not null default false,
  ach_on_file boolean not null default false,

  archived boolean not null default false
);

create index creators_handle_idx   on public.creators (handle);
create index creators_archived_idx on public.creators (archived);

-- ----------------------------------------------------------------------------
-- campaigns (Expeditions) — now scoped to a company and dated.
-- ----------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  fy_budget_allocation numeric not null default 0,
  color text not null default '#8FA8D8',
  sort_order integer not null default 0,
  start_date date,
  end_date date,
  notes text
);

create index campaigns_company_idx on public.campaigns (company_id);

-- ----------------------------------------------------------------------------
-- engagements — one creator's work on one campaign. The heart of the model.
-- ----------------------------------------------------------------------------
create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  creator_id  uuid not null references public.creators(id)  on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  company_id  uuid references public.companies(id) on delete set null,  -- set when not tied to a campaign

  event text,
  deliverables text,

  -- business (per campaign)
  negotiated_rate numeric default 0,
  usage_rights_fee numeric default 0,
  whitelisting_fee numeric default 0,
  travel_cost numeric default 0,
  creator_fee numeric default 0,
  boost_spend numeric default 0,
  total_spend numeric generated always as (
    coalesce(creator_fee, 0) + coalesce(boost_spend, 0)
  ) stored,

  -- contract
  contract_status text not null default 'Not Sent',
  contract_sent_date date,
  contract_signed_date date,

  -- payment
  invoice_status text not null default 'Not Received',
  invoice_received_date date,
  submitted_to_billing_date date,
  payment_date date,

  -- scheduling (drives the Almanac)
  is_organic boolean not null default false,   -- unpaid event: no contract / invoice / W-9
  shoot_date date,
  post_date date,
  boost_start date,
  boost_end date,

  -- voyage + outreach
  stage text not null default 'Horizon',
  status_tag text,
  first_contact_date date,
  last_follow_up date,
  num_follow_ups integer default 0,
  last_response text,
  negotiation_notes text,

  -- annual planning
  is_annual boolean not null default false,
  planned_boost numeric default 0,

  assignee_id uuid references public.users(id) on delete set null,
  archived boolean not null default false
);

create index engagements_creator_idx  on public.engagements (creator_id);
create index engagements_campaign_idx on public.engagements (campaign_id);
create index engagements_stage_idx    on public.engagements (stage);
create index engagements_archived_idx on public.engagements (archived);

-- ----------------------------------------------------------------------------
-- posts (Logbook) — performance rows, linked to an engagement.
-- Columns now match what the app actually reads/writes.
-- ----------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  engagement_id uuid references public.engagements(id) on delete cascade,
  kind text not null default 'post',          -- 'post' (feed) or 'story' (organic story set)
  story_count integer,                          -- number of stories when kind = 'story'
  thumbnail text,                               -- uploaded screenshot URL used as the clickable preview
  platform text,
  url text,
  post_date date,
  boost_start date,
  boost_end date,
  fee numeric default 0,
  boost_spend numeric default 0,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  platforms jsonb not null default '[]'::jsonb,   -- per-platform urls + stats
  sent_positive integer default 0,
  sent_negative integer default 0,
  notes text
);

create index posts_engagement_idx on public.posts (engagement_id);

-- ----------------------------------------------------------------------------
-- internal_boosts — Nox & Co boosting its OWN socials, separate from creator spend.
-- ----------------------------------------------------------------------------
create table public.internal_boosts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  label text not null default 'Internal boost',
  platform text not null default 'Instagram',
  amount numeric not null default 0,
  boost_start date,
  boost_end date,
  notes text
);

-- ----------------------------------------------------------------------------
-- todos — optionally tied to a campaign, a creator, and/or an assignee.
-- ----------------------------------------------------------------------------
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  done boolean not null default false,
  due_date date,
  priority text not null default 'Normal',   -- Low / Normal / High
  category text not null default 'General',   -- Outreach / Briefing / Contracts / Filming / Edits / Posting / Boosting / Billing / Reporting / General
  assignee_id uuid references public.users(id)      on delete set null,
  campaign_id uuid references public.campaigns(id)  on delete set null,
  creator_id  uuid references public.creators(id)   on delete set null,
  notes text
);

create index todos_done_idx     on public.todos (done);
create index todos_assignee_idx on public.todos (assignee_id);

-- ----------------------------------------------------------------------------
-- projects — general marketing / creative work, not tied to a creator
-- engagement (SEO, paid social, web, design, content, etc).
-- ----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  name text not null default 'New project',
  type text not null default 'General',        -- SEO / Paid Social / Social Management / Creative & Design / Content / Web / Email / PR / Other
  status text not null default 'Planning',      -- Planning / In Progress / Review / Delivered / On Hold
  owner_id uuid references public.users(id) on delete set null,
  start_date date,
  due_date date,
  budget numeric default 0,
  spent numeric default 0,
  description text,
  notes text,
  archived boolean not null default false
);

create index projects_company_idx  on public.projects (company_id);
create index projects_status_idx   on public.projects (status);
create index projects_archived_idx on public.projects (archived);

-- ----------------------------------------------------------------------------
-- report_shares — token-based public "share link" reports (see get_share_bundle).
-- ----------------------------------------------------------------------------
create table public.report_shares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  token text not null unique,
  company_id uuid references public.companies(id) on delete cascade,
  days integer not null default 31,
  revoked boolean not null default false
);

-- ----------------------------------------------------------------------------
-- compliance_items / expenses / payments / documents — Vault + Finance detail.
-- ----------------------------------------------------------------------------
create table public.compliance_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  creator_id uuid not null references public.creators(id) on delete cascade,
  key text not null,
  done boolean not null default false,
  completed_at timestamptz,
  completed_by text,
  notes text,
  doc_path text
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  spent_on date,
  category text not null default 'General',
  description text,
  amount numeric not null default 0,
  reimbursable boolean not null default false,
  receipt_attached boolean not null default false,
  status text not null default 'Pending'
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  invoice_number text,
  amount numeric not null default 0,
  paid_date date,
  method text,
  status text not null default 'Pending'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  creator_id uuid not null references public.creators(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  category text not null default 'General',
  file_name text not null,
  path text not null,
  size_bytes bigint,
  mime text,
  version integer not null default 1,
  group_key text,
  uploaded_by text
);

-- ----------------------------------------------------------------------------
-- prospects (Horizon discovery) — convert into a creator (+ engagement).
-- ----------------------------------------------------------------------------
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null,
  handle text not null,
  platform text not null default 'Instagram',
  followers integer,
  category text,
  email text,
  estimated_rate numeric,
  notes text
);

-- ----------------------------------------------------------------------------
-- roi_settings — single editable row (id = 1) driving EMV / ROI.
-- ----------------------------------------------------------------------------
create table public.roi_settings (
  id integer primary key default 1,
  per_k_views numeric not null default 12,
  per_engagement numeric not null default 0.18,
  sentiment_weight numeric not null default 0.1,
  updated_at timestamptz not null default now(),
  constraint roi_settings_singleton check (id = 1)
);

-- ----------------------------------------------------------------------------
-- activity_log (ship's log) — who did what.
-- ----------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.users(id) on delete set null,
  actor text not null default 'Kade',        -- denormalized display name (survives user deletion)
  creator_id uuid references public.creators(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  engagement_id uuid references public.engagements(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  text text not null,
  kind text not null default 'note'
);

create index activity_created_idx on public.activity_log (created_at desc);

-- ============================================================================
-- Row Level Security
-- Staff (Owner/Editor/Viewer/etc) get full access to everything. A user with
-- role = 'Client' only ever sees the one company they're linked to. Nothing
-- is open to `anon` (unauthenticated) except the token-scoped share-link RPC
-- at the bottom of this file.
-- ============================================================================
-- ----------------------------------------------------------------------------
-- 4. Helper functions used by policies below.
--    security definer so they can read `users` regardless of the caller's
--    own row-level access, they only ever look up the CALLER's own row.
-- ----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role is distinct from 'Client' from public.users where auth_id = auth.uid() limit 1),
    false
  );
$$;

create or replace function public.my_company_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.users where auth_id = auth.uid() limit 1;
$$;

create or replace function public.is_bootstrap()
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.users where auth_id is not null);
$$;

grant execute on function public.is_staff()      to authenticated;
grant execute on function public.my_company_id() to authenticated;
grant execute on function public.is_bootstrap()  to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Drop every old wide-open policy. From this point on, `anon` has NO
--    direct table access at all (the old policies were the only thing
--    granting it access; once dropped, RLS defaults to deny).
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'companies','users','creators','campaigns','engagements','posts',
    'internal_boosts','todos','prospects','roi_settings','activity_log',
    'projects','report_shares','compliance_items','expenses','payments','documents'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists "nox_all" on public.%I;', t);
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 6. Staff-only tables — internal ops a client never needs to see.
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'internal_boosts','todos','prospects','activity_log',
    'report_shares','compliance_items','expenses','payments','documents'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "%1$s_staff_all" on public.%1$I;', t);
      execute format(
        'create policy "%1$s_staff_all" on public.%1$I for all to authenticated using (public.is_staff()) with check (public.is_staff());',
        t
      );
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 7. Client-readable, staff-full tables.
-- ----------------------------------------------------------------------------
-- companies
drop policy if exists "companies_staff_all"    on public.companies;
drop policy if exists "companies_client_select" on public.companies;
create policy "companies_staff_all" on public.companies
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "companies_client_select" on public.companies
  for select to authenticated using (id = public.my_company_id());

-- campaigns
drop policy if exists "campaigns_staff_all"     on public.campaigns;
drop policy if exists "campaigns_client_select" on public.campaigns;
create policy "campaigns_staff_all" on public.campaigns
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "campaigns_client_select" on public.campaigns
  for select to authenticated using (company_id = public.my_company_id());

-- projects
drop policy if exists "projects_staff_all"     on public.projects;
drop policy if exists "projects_client_select" on public.projects;
create policy "projects_staff_all" on public.projects
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "projects_client_select" on public.projects
  for select to authenticated using (company_id = public.my_company_id());

-- engagements (client sees rows tied to their company, directly or via campaign)
drop policy if exists "engagements_staff_all"     on public.engagements;
drop policy if exists "engagements_client_select" on public.engagements;
create policy "engagements_staff_all" on public.engagements
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "engagements_client_select" on public.engagements
  for select to authenticated using (
    company_id = public.my_company_id()
    or campaign_id in (select id from public.campaigns where company_id = public.my_company_id())
  );

-- creators (client sees only creators engaged on their own campaigns)
drop policy if exists "creators_staff_all"     on public.creators;
drop policy if exists "creators_client_select" on public.creators;
create policy "creators_staff_all" on public.creators
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "creators_client_select" on public.creators
  for select to authenticated using (
    id in (
      select e.creator_id from public.engagements e
      left join public.campaigns c on c.id = e.campaign_id
      where e.company_id = public.my_company_id() or c.company_id = public.my_company_id()
    )
  );

-- posts (client sees only posts on their own engagements)
drop policy if exists "posts_staff_all"     on public.posts;
drop policy if exists "posts_client_select" on public.posts;
create policy "posts_staff_all" on public.posts
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "posts_client_select" on public.posts
  for select to authenticated using (
    engagement_id in (
      select e.id from public.engagements e
      left join public.campaigns c on c.id = e.campaign_id
      where e.company_id = public.my_company_id() or c.company_id = public.my_company_id()
    )
  );

-- roi_settings (global constants, low sensitivity, any signed-in user can read)
drop policy if exists "roi_staff_write"   on public.roi_settings;
drop policy if exists "roi_client_select" on public.roi_settings;
create policy "roi_staff_write" on public.roi_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "roi_client_select" on public.roi_settings
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 8. users — special-cased so a brand-new sign-in can find + claim its own
--    pre-created invite row (matched by email, before auth_id is linked),
--    but nobody can read the rest of the team roster except staff.
-- ----------------------------------------------------------------------------
drop policy if exists "users_staff_all"     on public.users;
drop policy if exists "users_self_select"   on public.users;
drop policy if exists "users_claim_select"  on public.users;
drop policy if exists "users_self_update"   on public.users;
drop policy if exists "users_claim_update"  on public.users;
drop policy if exists "users_bootstrap_insert" on public.users;

create policy "users_staff_all" on public.users
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "users_self_select" on public.users
  for select to authenticated using (auth_id = auth.uid());

create policy "users_claim_select" on public.users
  for select to authenticated using (auth_id is null and email = (auth.jwt() ->> 'email'));

create policy "users_self_update" on public.users
  for update to authenticated using (auth_id = auth.uid()) with check (auth_id = auth.uid());

create policy "users_claim_update" on public.users
  for update to authenticated
  using (auth_id is null and email = (auth.jwt() ->> 'email'))
  with check (auth_id = auth.uid());

-- Only staff can add new roster/client rows, EXCEPT the very first person to
-- ever sign in (bootstraps you as Owner). After that, every new account
-- (including new clients) must be created by a staff member first.
create policy "users_bootstrap_insert" on public.users
  for insert to authenticated with check (public.is_bootstrap() and auth_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 9. Secure, token-scoped RPC for the public "share link" report feature.
--    Replaces the old approach of leaving every table open to `anon`.
--    SECURITY DEFINER: runs with elevated rights internally, but only ever
--    returns rows for the ONE company tied to a valid, non-revoked token.
-- ----------------------------------------------------------------------------
create or replace function public.get_share_bundle(p_token text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_share record;
  v_result jsonb;
begin
  select * into v_share from public.report_shares where token = p_token and not revoked;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  select jsonb_build_object(
    'company_id', v_share.company_id,
    'days', v_share.days,
    'company', (select jsonb_build_object('id', id, 'name', name) from public.companies where id = v_share.company_id),
    'campaigns', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'company_id', company_id)), '[]'::jsonb)
      from public.campaigns where company_id = v_share.company_id
    ),
    'engagements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'creator_id', e.creator_id, 'campaign_id', e.campaign_id,
        'company_id', e.company_id, 'stage', e.stage
      )), '[]'::jsonb)
      from public.engagements e
      left join public.campaigns c on c.id = e.campaign_id
      where e.company_id = v_share.company_id or c.company_id = v_share.company_id
    ),
    'creators', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'handle', handle, 'platform', platform
      )), '[]'::jsonb)
      from public.creators where id in (
        select e.creator_id from public.engagements e
        left join public.campaigns c on c.id = e.campaign_id
        where e.company_id = v_share.company_id or c.company_id = v_share.company_id
      )
    ),
    'posts', (
      select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from public.posts p
      where p.engagement_id in (
        select e.id from public.engagements e
        left join public.campaigns c on c.id = e.campaign_id
        where e.company_id = v_share.company_id or c.company_id = v_share.company_id
      )
    ),
    'roi', (select to_jsonb(r) from public.roi_settings r where id = 1)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_share_bundle(text) to anon, authenticated;

-- ============================================================================
-- Done. What changed:
--  * anon (unauthenticated) access is fully revoked on every table, the old
--    `/share` public report links now go through get_share_bundle() only.
--  * Any signed-in user whose `users.role` is 'Client' can only read the one
--    company they're linked to (companies/campaigns/projects/engagements/
--    creators/posts, all scoped). They get zero access to todos, internal
--    boosts, prospects, activity log, compliance items, expenses, payments,
--    documents, or the team roster.
--  * Everyone else (Owner/Editor/Viewer/etc, i.e. staff) keeps full access,
--    unchanged from before.
--  * A brand-new sign-in with no matching invite row gets NO account at all,
--    except the very first person ever to sign in (bootstraps as Owner).
-- ============================================================================
