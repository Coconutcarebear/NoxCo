import type { Stage } from "./types";
// Default fallback budget used when a campaign has no budget set. Adjust to your own plan.
export const FY26_BUDGET = 50000;
// No more star-crossed campaigns, pipeline stages as a creator's night-sky journey.
export const STAGES: Stage[] = [
  "Sighted",
  "Signal Sent",
  "In Orbit",
  "Aligning",
  "Committed",
  "Locked In",
  "In Motion",
  "Transmitted",
  "Cleared for Launch",
  "Shining",
  "Complete",
  "Star-Crossed",
];
// What each stage means, in plain terms (shown as helper text).
export const STAGE_MEANING: Record<Stage, string> = {
  "Sighted": "Researching this star",
  "Signal Sent": "Outreach sent",
  "In Orbit": "They wrote back",
  "Aligning": "Negotiating terms",
  "Committed": "Contract sent",
  "Locked In": "Signed & confirmed",
  "In Motion": "Attending / filming",
  "Transmitted": "Content submitted",
  "Cleared for Launch": "Content approved",
  "Shining": "Posted & live",
  "Complete": "Paid in full",
  "Star-Crossed": "Contract fell through",
};
// A brand hue per stage for cards & badges.
export const STAGE_HUE: Record<Stage, string> = {
  "Sighted": "#9A9CA6",
  "Signal Sent": "#A6A8B2",
  "In Orbit": "#B3B5BE",
  "Aligning": "#C0C2CA",
  "Committed": "#CCCED5",
  "Locked In": "#D9DADF",
  "In Motion": "#C7C9D1",
  "Transmitted": "#B9BBC4",
  "Cleared for Launch": "#ACAEB8",
  "Shining": "#E5E6EA",
  "Complete": "#F2F2F4",
  "Star-Crossed": "#6C6D76",
};
// Stages that count as "posted / live".
export const PUBLISHED_STAGES: Stage[] = ["Shining", "Complete"];
// Sidebar sections (Nox & Co night-sky navigation).
export interface NavItem {
  href: string;
  label: string;
  sub: string;
  icon: string; // lucide icon name
  ownerOnly?: boolean;
}
export const NAV: NavItem[] = [
  { href: "/app", label: "Nightfall", sub: "Dashboard", icon: "Moon" },
  { href: "/todos", label: "Night Watch", sub: "To-dos", icon: "ListChecks" },
  { href: "/pipeline", label: "Star Chart", sub: "Pipeline", icon: "Compass" },
  { href: "/creators", label: "Constellation", sub: "Creators", icon: "Star" },
  { href: "/campaigns", label: "Eclipses", sub: "Campaigns", icon: "Disc" },
  { href: "/projects", label: "Constellations", sub: "Marketing & creative", icon: "Sparkles" },
  { href: "/almanac", label: "Almanac", sub: "Calendar", icon: "CalendarDays" },
  { href: "/dockyard", label: "The Vault", sub: "Contracts", icon: "Lock" },
  { href: "/treasury", label: "Stardust", sub: "Invoices", icon: "Sparkles" },
  { href: "/gallery", label: "Star Gallery", sub: "Content", icon: "Images" },
  { href: "/logbook", label: "Night Log", sub: "Performance & ROI", icon: "BookHeart" },
  { href: "/prospects", label: "Stargazing", sub: "Discovery", icon: "Search" },
  { href: "/observatory", label: "Observatory", sub: "Analytics", icon: "Telescope" },
  { href: "/forecast", label: "Star Forecast", sub: "Forecasting", icon: "CloudMoon" },
  { href: "/clients", label: "Clients", sub: "Companies", icon: "Building2" },
  { href: "/crew", label: "Night Owls", sub: "Users & roles", icon: "Users", ownerOnly: true },
];

export interface NavGroup {
  label: string;
  icon: string; // lucide icon for the group header
  items: NavItem[];
}

// Grouped, collapsible nav, no more star-crossed campaigns, night-sky sections.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home", icon: "Sparkles",
    items: [
      { href: "/app", label: "Nightfall", sub: "Dashboard", icon: "Moon" },
      { href: "/todos", label: "Night Watch", sub: "To-dos", icon: "ListChecks" },
    ],
  },
  {
    label: "Creators", icon: "Star",
    items: [
      { href: "/creators", label: "Constellation", sub: "Creators", icon: "Star" },
      { href: "/prospects", label: "Stargazing", sub: "Discovery", icon: "Search" },
      { href: "/gallery", label: "Star Gallery", sub: "Content", icon: "Images" },
    ],
  },
  {
    label: "Campaigns", icon: "Disc",
    items: [
      { href: "/pipeline", label: "Star Chart", sub: "Pipeline", icon: "Compass" },
      { href: "/campaigns", label: "Eclipses", sub: "Campaigns", icon: "Disc" },
      { href: "/projects", label: "Constellations", sub: "Marketing & creative", icon: "Sparkles" },
      { href: "/almanac", label: "Almanac", sub: "Calendar", icon: "CalendarDays" },
      { href: "/brief", label: "Star Briefs", sub: "Creator briefs", icon: "FileText" },
    ],
  },
  {
    label: "The Vault", icon: "Lock",
    items: [
      { href: "/dockyard", label: "The Vault", sub: "Contracts", icon: "Lock" },
      { href: "/treasury", label: "Stardust", sub: "Invoices", icon: "Sparkles" },
    ],
  },
  {
    label: "Campaign Reporting", icon: "LineChart",
    items: [
      { href: "/reporting", label: "Star Report", sub: "Executive summary", icon: "ClipboardList" },
      { href: "/logbook", label: "Night Log", sub: "Performance & ROI", icon: "BookHeart" },
      { href: "/observatory", label: "Observatory", sub: "Analytics", icon: "Telescope" },
      { href: "/forecast", label: "Star Forecast", sub: "Forecasting", icon: "CloudMoon" },
    ],
  },
  {
    label: "Settings", icon: "Settings",
    items: [
      { href: "/clients", label: "Clients", sub: "Companies", icon: "Building2" },
      { href: "/crew", label: "Night Owls", sub: "Users & roles", icon: "Users", ownerOnly: true },
    ],
  },
];
export const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "Threads", "General"] as const;
// Platforms that can carry their own EMV rate override ("General" uses the top-level default).
export const EMV_PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "Threads"] as const;

export type TodoCategory = {
  key: string;
  label: string;
  hue: string;
  icon: string; // lucide icon name
  hint: string;
};

// Workflow stages for the Orders (to-do) board. Edit / reorder freely, // the page renders one section per entry, in this order.
export const TODO_CATEGORIES: TodoCategory[] = [
  { key: "Outreach",   label: "Outreach",   hue: "#C7C9D1", icon: "Send",          hint: "First contact & follow-ups" },
  { key: "Briefing",   label: "Briefing",   hue: "#B9BBC4", icon: "FileText",      hint: "Briefs sent & concepts approved" },
  { key: "Contracts",  label: "Contracts",  hue: "#AEB0B9", icon: "ScrollText",    hint: "Agreements out & signed" },
  { key: "Filming",    label: "Filming",    hue: "#A2A4AE", icon: "Clapperboard",  hint: "Shoots scheduled & shot" },
  { key: "Edits",      label: "Edits",      hue: "#9698A2", icon: "Scissors",      hint: "Drafts reviewed & approved" },
  { key: "Posting",    label: "Posting",    hue: "#E5E6EA", icon: "Rocket",        hint: "Content scheduled & live" },
  { key: "Boosting",   label: "Boosting",   hue: "#5a6a8f", icon: "Megaphone",     hint: "Paid amplification set up" },
  { key: "Billing",    label: "Billing",    hue: "#8A8C96", icon: "Coins",         hint: "Invoices in & paid" },
  { key: "Reporting",  label: "Reporting",  hue: "#C7C9D1", icon: "LineChart",     hint: "Recaps & performance wrap-ups" },
  { key: "General",    label: "General",    hue: "#6C6D76", icon: "ListChecks",    hint: "Anything else" },
];

export const TODO_CATEGORY_KEYS = TODO_CATEGORIES.map((c) => c.key);
export const TODO_PRIORITIES = ["Low", "Normal", "High"] as const;

// Projects — general marketing / creative work beyond creator engagements.
export const PROJECT_TYPES = [
  "SEO", "Paid Social", "Social Management", "Creative & Design",
  "Content", "Web", "Email", "PR", "Other",
] as const;
export const PROJECT_STATUSES = ["Planning", "In Progress", "Review", "Delivered", "On Hold"] as const;
export const PROJECT_STATUS_HUE: Record<string, string> = {
  "Planning": "#8A8C96",
  "In Progress": "#5a6a8f",
  "Review": "#C7C9D1",
  "Delivered": "#F2F2F4",
  "On Hold": "#6C6D76",
};
export const PROJECT_TYPE_ICON: Record<string, string> = {
  "SEO": "TrendingUp",
  "Paid Social": "Megaphone",
  "Social Management": "Share2",
  "Creative & Design": "Wand2",
  "Content": "FileText",
  "Web": "Globe",
  "Email": "Mail",
  "PR": "Newspaper",
  "Other": "Sparkles",
};

// Account roles (Phase 2 enforces these in the UI; Phase 3 in the database).
export const USER_ROLES = ["Owner", "Editor", "Viewer"] as const;

// Cute avatar gradients people can pick (10 options; default is not purple).
export const GRADIENTS: { key: string; label: string; css: string }[] = [
  { key: "meadow",    label: "Nebula",    css: "linear-gradient(135deg,#3765D8,#A99CE7)" },
  { key: "seafoam",   label: "Midnight",  css: "linear-gradient(135deg,#023459,#425180)" },
  { key: "sky",       label: "Skylight",  css: "linear-gradient(135deg,#A9D2F4,#CDE4F7)" },
  { key: "sunrise",   label: "Dawn",      css: "linear-gradient(135deg,#A99CE7,#DCD6F5)" },
  { key: "peach",     label: "Comet",     css: "linear-gradient(135deg,#8C1F66,#D9A8C4)" },
  { key: "sunset",    label: "Dusk",      css: "linear-gradient(135deg,#5C003F,#8C1F66)" },
  { key: "bubblegum", label: "Wine",      css: "linear-gradient(135deg,#5C003F,#A35C86)" },
  { key: "lavender",  label: "Lavender",  css: "linear-gradient(135deg,#A99CE7,#425180)" },
  { key: "berry",     label: "Berry",     css: "linear-gradient(135deg,#8C1F66,#3765D8)" },
  { key: "mint",      label: "Starlight", css: "linear-gradient(135deg,#262268,#A99CE7)" },
];
export const DEFAULT_GRADIENT = "meadow";
export function gradientCss(key: string | null | undefined): string {
  return (GRADIENTS.find((g) => g.key === key) ?? GRADIENTS.find((g) => g.key === DEFAULT_GRADIENT)!).css;
}

// Silver icon avatars people can pick for their account, black background,
// silver symbol, no color, no emoji. Stored in the same `emoji` column as
// a lucide icon name.
export const AVATAR_ICONS = [
  "Star", "Sparkles", "Sparkle", "Moon", "MoonStar", "Sun", "Sunrise", "Sunset",
  "CloudMoon", "Telescope", "Compass", "Rocket", "Orbit", "Satellite", "Globe",
  "Wand2", "Zap", "Gem", "Snowflake", "Flame", "Feather", "Wind", "Anchor", "Cloud",
];
// Backwards-compatible alias.
export const EMOJI_AVATARS = AVATAR_ICONS;

// Rough share of a creator's followers who view a given story, used to
// pre-estimate organic story views from follower count. Override per entry.
export const STORY_REACH_DEFAULT = 0.1;

// Creator tags (stored comma-separated in the creator's `categories` field).
// This is the starting palette, new tags added in the app join the pool
// automatically once they're assigned to a creator.
export const DEFAULT_TAGS = [
  "Foodie", "Fashion", "Day in My Life", "Vlog", "Informational", "Museums",
  "Family", "Kids", "NYC", "Culture", "Art", "Lifestyle", "Travel",
  "Comedy", "Beauty", "Wellness", "Events", "History", "Education", "Nightlife",
];

export function parseTags(s: string | null | undefined): string[] {
  if (!s) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of s.split(",")) {
    const t = raw.trim();
    if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push(t); }
  }
  return out;
}

export function formatTags(tags: string[]): string {
  return parseTags(tags.join(",")).join(", ");
}

// Union of the default palette and every tag currently in use, sorted.
export function tagPool(existing: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  const canon = new Map<string, string>(); // lowercase -> display
  const add = (t: string) => { const k = t.toLowerCase(); if (!canon.has(k)) { canon.set(k, t); set.add(t); } };
  DEFAULT_TAGS.forEach(add);
  for (const v of existing) parseTags(v).forEach(add);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
export const CONTRACT_STATUSES = ["Not Sent", "Sent", "Signed"] as const;
export const INVOICE_STATUSES = [
  "Not Received", "Received", "Submitted To Billing", "Processing", "Paid",
] as const;
export const STATUS_TAGS = [
  "Interested", "Awaiting Response", "Declined", "Ghosted", "Signed",
] as const;
// H2 forecast (creators booked + planned spend), sample defaults, edit to your own plan.
export const H2_FORECAST = [
  { month: "July", creators: 0, spend: 0 },
  { month: "August", creators: 0, spend: 0 },
  { month: "September", creators: 0, spend: 0 },
  { month: "October", creators: 0, spend: 0 },
  { month: "November", creators: 0, spend: 0 },
  { month: "December", creators: 0, spend: 0 },
];
// Cozy empty-state copy.
export const EMPTY = {
  creators: "No stars charted yet.",
  harbor: "The sky is quiet tonight.",
  discover: "Ready to chart new stars?",
  voyagesDone: "Everything's shining bright!",
};

// ---- Documents & Finance ----
export const COMPLIANCE_ITEMS: { key: string; label: string; secureUpload?: boolean }[] = [
  { key: "contract_signed", label: "Contract Signed" },
  { key: "w9", label: "W-9 Received" },
  { key: "ach", label: "ACH Received", secureUpload: true },
  { key: "invoice", label: "Invoice Received" },
  { key: "payment_sent", label: "Payment Sent" },
  { key: "payment_confirmed", label: "Payment Confirmed" },
];
export const READY_TO_PAY_KEYS = ["contract_signed", "w9", "ach", "invoice"];
export const EXPENSE_CATEGORIES = ["Uber", "Subway", "Parking", "Hotel", "Flight", "Meals", "Props", "Equipment", "Misc"] as const;
export const EXPENSE_STATUSES = ["Pending", "Approved", "Paid"] as const;
export const PAYMENT_METHODS = ["ACH", "Check", "Wire", "Zelle", "PayPal", "Venmo", "Other"] as const;
export const PAYMENT_STATUSES = ["Outstanding", "Paid"] as const;

export const DOCUMENT_CATEGORIES = ["Contract", "Invoice", "Expense Receipt", "Brief", "Deliverables", "Other"] as const;
export function categorizeFile(name: string): string {
  const n = name.toLowerCase();
  if (/(contract|agreement|\bsow\b|executed)/.test(n)) return "Contract";
  if (/(invoice|\binv[-_ ]?\d)/.test(n)) return "Invoice";
  if (/(receipt|expense|uber|lyft|hotel|flight|parking)/.test(n)) return "Expense Receipt";
  if (/(brief|creative|concept)/.test(n)) return "Brief";
  if (/(final|deliverable|\bcut\b|export|render|reel|draft)/.test(n)) return "Deliverables";
  return "Other";
}
// Strips extension and trailing version markers so "Contract v1" / "Contract v2" group together.
export function groupKeyFor(name: string): string {
  return name.toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[\s_-]*v?\d+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
