// Core data shapes for Nox & Co (v2, normalized).
//
// The big idea: a `Creator` is a PROFILE that exists exactly once. Their work on
// a specific campaign lives in a separate `Engagement` row. So one creator can
// appear across many campaigns (eclipses) without duplicating their profile.
//
// `EngagementView` is a convenience join (engagement + its creator + its
// campaign) with flat aliases, so UI code reads `view.name`, `view.stage`,
// `view.creator_fee` much like it read a flat creator before.

export type Stage =
  | "Sighted"
  | "Signal Sent"
  | "In Orbit"
  | "Aligning"
  | "Committed"
  | "Locked In"
  | "In Motion"
  | "Transmitted"
  | "Cleared for Launch"
  | "Shining"
  | "Complete"
  | "Star-Crossed";
export type ContractStatus = "Not Sent" | "Sent" | "Signed";
export type InvoiceStatus =
  | "Not Received"
  | "Received"
  | "Submitted To Billing"
  | "Processing"
  | "Paid";
export type StatusTag =
  | "Interested"
  | "Awaiting Response"
  | "Declined"
  | "Ghosted"
  | "Signed";
export type Platform = "Instagram" | "TikTok" | "Facebook" | "YouTube" | "Threads" | "General" | "Multi-platform";
export type Tier = "Support" | "Mid" | "Premium";
export type Priority = "Low" | "Normal" | "High";
export type CompanyKind = "Internal" | "Client";

export interface Company {
  id: string;
  created_at: string;
  name: string;
  kind: CompanyKind | string;
  color: string;
  budget: number;
  priority: string;
  notes: string | null;
}

export interface User {
  id: string;
  created_at: string;
  auth_id: string | null;
  name: string;
  email: string | null;
  role: string;
  color: string;
  emoji: string | null;
  gradient: string | null;
  active: boolean;
}

// A creator PROFILE — durable, person-level facts only.
export interface Creator {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  handle: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  platform: Platform;
  categories: string | null;
  bio: string | null;
  profile_image: string | null;
  notes: string | null;
  followers: number | null;
  engagement_rate: number | null;
  audience_demographics: string | null;
  audience_location: string | null;
  standard_rate: number | null; // rack rate; negotiated rate is per-engagement
  w9_on_file: boolean;
  ach_on_file: boolean;
  archived: boolean;
}

export interface Campaign {
  id: string;
  created_at: string;
  company_id: string | null;
  name: string;
  fy_budget_allocation: number;
  color: string;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

// One creator's engagement on one campaign — the per-journey record.
export interface Engagement {
  id: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  campaign_id: string | null;
  company_id: string | null;
  event: string | null;
  deliverables: string | null;
  // business (per campaign)
  negotiated_rate: number | null;
  usage_rights_fee: number | null;
  whitelisting_fee: number | null;
  travel_cost: number | null;
  creator_fee: number | null;
  boost_spend: number | null;
  total_spend: number | null; // generated in DB (creator_fee + boost_spend)
  // contract
  contract_status: ContractStatus;
  contract_sent_date: string | null;
  contract_signed_date: string | null;
  // payment
  invoice_status: InvoiceStatus;
  invoice_received_date: string | null;
  submitted_to_billing_date: string | null;
  payment_date: string | null;
  is_organic: boolean; // this event is unpaid — no contract / invoice / W-9 needed
  // scheduling (Almanac)
  shoot_date: string | null;
  post_date: string | null;
  boost_start: string | null;
  boost_end: string | null;
  // journey + outreach
  stage: Stage;
  status_tag: StatusTag | null;
  first_contact_date: string | null;
  last_follow_up: string | null;
  num_follow_ups: number | null;
  last_response: string | null;
  negotiation_notes: string | null;
  // annual planning
  is_annual: boolean;
  planned_boost: number | null;
  assignee_id: string | null;
  archived: boolean;
}

// Engagement joined to its creator profile + campaign, with flat aliases.
// `archived` here is the ENGAGEMENT's archived flag; the profile's is creator.archived.
export interface EngagementView extends Engagement {
  creator: Creator;
  campaign: string | null; // campaign name alias (read-only convenience)
  campaignName: string | null;
  campaignColor: string | null;
  company_id: string | null;
  total_creator_cost: number; // computed (was a generated column in v1)
  // flat profile aliases (read-only convenience)
  name: string;
  handle: string;
  platform: Platform;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  categories: string | null;
  bio: string | null;
  profile_image: string | null;
  notes: string | null;
  followers: number | null;
  engagement_rate: number | null;
  audience_demographics: string | null;
  audience_location: string | null;
  standard_rate: number | null;
  w9_on_file: boolean;
  ach_on_file: boolean;
}

export interface Prospect {
  id: string;
  created_at: string;
  company_id: string | null;
  handle: string;
  platform: Platform;
  followers: number | null;
  category: string | null;
  email: string | null;
  estimated_rate: number | null;
  notes: string | null;
}

export interface Todo {
  id: string;
  created_at: string;
  title: string;
  done: boolean;
  due_date: string | null;
  priority: Priority | string;
  category: string;
  assignee_id: string | null;
  campaign_id: string | null;
  creator_id: string | null;
  notes: string | null;
}

export interface Activity {
  id: string;
  created_at: string;
  user_id: string | null;
  actor: string;
  creator_id: string | null;
  campaign_id: string | null;
  engagement_id: string | null;
  text: string;
  kind: string;
}

// Internal boosts — the agency boosting its OWN socials, separate from creator spend.
export interface InternalBoost {
  id: string;
  created_at: string;
  company_id: string | null;
  campaign_id: string | null;
  label: string;
  platform: Platform;
  amount: number;
  boost_start: string | null;
  boost_end: string | null;
  notes: string | null;
}

export interface PostPlatform {
  platform: string;
  url: string;
  views: number; likes: number; comments: number; shares: number; saves: number;
}
export interface Post {
  id: string;
  created_at: string;
  engagement_id: string | null;
  kind: string; // 'post' (feed) or 'story' (organic story set)
  story_count: number | null; // number of stories when kind = 'story'
  thumbnail: string | null; // uploaded screenshot used as the clickable preview
  platform: Platform | string;
  url: string | null;
  post_date: string | null;
  boost_start: string | null;
  boost_end: string | null;
  fee: number;
  boost_spend: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  platforms: PostPlatform[]; // per-platform urls + stats; top-level stats are the sum
  sent_positive: number;
  sent_negative: number;
  notes: string | null;
}

// Earned-media-value rates that drive ROI (one editable row).
export interface PlatformRate { per_k_views: number; per_engagement: number }
export interface RoiSettings {
  per_k_views: number;
  per_engagement: number;
  sentiment_weight: number;
  platform_rates?: Record<string, PlatformRate> | null;
}

// Writable columns (exclude id / timestamps / generated columns).
export const WRITABLE_CREATOR_KEYS: (keyof Creator)[] = [
  "name", "handle", "email", "phone", "city", "state", "platform",
  "categories", "bio", "profile_image", "notes",
  "followers", "engagement_rate", "audience_demographics", "audience_location",
  "standard_rate", "w9_on_file", "ach_on_file", "archived",
];

export const WRITABLE_ENGAGEMENT_KEYS: (keyof Engagement)[] = [
  "campaign_id", "company_id", "event", "deliverables",
  "negotiated_rate", "usage_rights_fee", "whitelisting_fee", "travel_cost",
  "creator_fee", "boost_spend",
  "contract_status", "contract_sent_date", "contract_signed_date",
  "invoice_status", "invoice_received_date", "submitted_to_billing_date", "payment_date",
  "is_organic", "shoot_date", "post_date", "boost_start", "boost_end",
  "stage", "status_tag", "first_contact_date", "last_follow_up", "num_follow_ups",
  "last_response", "negotiation_notes", "is_annual", "planned_boost",
  "assignee_id", "archived",
];

// ---- Documents & Finance (per company) ----
export interface ComplianceItem {
  id: string;
  created_at: string;
  company_id: string | null;
  creator_id: string;
  key: string;
  done: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  doc_path: string | null;
}
export interface Expense {
  id: string;
  created_at: string;
  company_id: string | null;
  creator_id: string;
  campaign_id: string | null;
  spent_on: string | null;
  category: string;
  description: string | null;
  amount: number;
  reimbursable: boolean;
  receipt_attached: boolean;
  status: string;
}
export interface Payment {
  id: string;
  created_at: string;
  company_id: string | null;
  creator_id: string;
  campaign_id: string | null;
  invoice_number: string | null;
  amount: number;
  paid_date: string | null;
  method: string | null;
  status: string;
}

// ---- Documents (private "creator-docs" bucket) ----
export interface Document {
  id: string;
  created_at: string;
  company_id: string | null;
  creator_id: string;
  campaign_id: string | null;
  category: string;
  file_name: string;
  path: string;
  size_bytes: number | null;
  mime: string | null;
  version: number;
  group_key: string | null;
  uploaded_by: string | null;
}
