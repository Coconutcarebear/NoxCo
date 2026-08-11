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
drop table if exists public.activity_log   cascade;
drop table if exists public.todos          cascade;
drop table if exists public.posts          cascade;
drop table if exists public.internal_boosts cascade;
drop table if exists public.payments       cascade;
drop table if exists public.contracts      cascade;
drop table if exists public.engagements    cascade;
drop table if exists public.prospects      cascade;
drop table if exists public.campaigns      cascade;
drop table if exists public.creators       cascade;
drop table if exists public.roi_settings   cascade;
drop table if exists public.users          cascade;
drop table if exists public.companies      cascade;

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
  name text not null,
  email text,
  role text not null default 'Member',
  color text not null default '#CDB4F0',
  emoji text,                                -- cute avatar the user picks
  gradient text,                             -- avatar gradient preset key
  active boolean not null default true
);

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
  text text not null,
  kind text not null default 'note'
);

create index activity_created_idx on public.activity_log (created_at desc);

-- ============================================================================
-- Row Level Security
-- This is an INTERNAL tool, so we allow the anon key full access to keep setup
-- simple. WARNING: before exposing the URL publicly, add Supabase Auth and
-- replace these policies with auth.uid()-scoped rules.
-- ============================================================================
alter table public.companies       enable row level security;
alter table public.users           enable row level security;
alter table public.creators        enable row level security;
alter table public.campaigns       enable row level security;
alter table public.engagements     enable row level security;
alter table public.posts           enable row level security;
alter table public.internal_boosts enable row level security;
alter table public.todos           enable row level security;
alter table public.prospects       enable row level security;
alter table public.roi_settings    enable row level security;
alter table public.activity_log    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'companies','users','creators','campaigns','engagements','posts',
    'internal_boosts','todos','prospects','roi_settings','activity_log'
  ]
  loop
    execute format('drop policy if exists "nox_all" on public.%I;', t);
    execute format(
      'create policy "nox_all" on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
