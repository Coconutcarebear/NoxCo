-- ============================================================================
-- Nox & Co — seed (v2)
-- Run this AFTER schema.sql. Minimal on purpose: just the Nox & Co
-- company, your user, and the ROI defaults so the app renders. You'll add
-- creators, campaigns, and engagements through the UI.
-- ============================================================================

-- The ROI settings singleton (id must be 1).
insert into public.roi_settings (id, per_k_views, per_engagement, sentiment_weight)
values (1, 12, 0.18, 0.1)
on conflict (id) do nothing;

-- Your company. 'In-house' marks Nox & Co's own org (vs other companies you serve).
insert into public.companies (name, kind, color, notes)
values ('Nox & Co', 'In-house', '#3765D8', 'Nox & Co — primary org')
on conflict do nothing;

-- Your user (for attribution + todo assignment).
insert into public.users (name, email, role, color)
values ('Kade', null, 'Owner', '#F9A8D4')
on conflict do nothing;
