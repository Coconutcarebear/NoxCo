-- ============================================================================
-- Nox & Co — Client Portal + Projects migration
--
-- SAFE TO RUN ON YOUR EXISTING DATABASE. This does NOT drop or clear any
-- table — it only adds new columns/tables and replaces the wide-open RLS
-- policies with ones scoped to staff vs. a client's own company.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query, AFTER your
-- existing schema is already in place. Safe to re-run if something fails
-- partway through (every statement is idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. New columns
-- ----------------------------------------------------------------------------
alter table public.users       add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.engagements add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists users_company_idx on public.users (company_id);

-- ----------------------------------------------------------------------------
-- 2. Projects — general marketing / creative work that isn't a creator
--    engagement (SEO, paid social, web, design, content, etc).
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
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

create index if not exists projects_company_idx  on public.projects (company_id);
create index if not exists projects_status_idx   on public.projects (status);
create index if not exists projects_archived_idx on public.projects (archived);

alter table public.todos        add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.activity_log add column if not exists project_id uuid references public.projects(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 3. report_shares — created ad hoc earlier for the "share link" feature.
--    Declared here so the migration is self-contained on a fresh database too.
-- ----------------------------------------------------------------------------
create table if not exists public.report_shares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  token text not null unique,
  company_id uuid references public.companies(id) on delete cascade,
  days integer not null default 31,
  revoked boolean not null default false
);

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
