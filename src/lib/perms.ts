"use client";

import { useStore } from "./store";

// UI-level permissions (Phase 2). Phase 3 enforces these in the database too.
//  Owner, everything, incl. managing users and settings
//  Editor, create/edit/delete content (creators, campaigns, posts, todos…)
//  Viewer, read-only
//  Client, portal-only, scoped to their own company (enforced by RLS)
export function usePerms() {
  const role = useStore((s) => s.currentUser?.role ?? "Viewer");
  const companyId = useStore((s) => s.currentUser?.company_id ?? null);
  const isOwner = role === "Owner";
  const isClient = role === "Client";
  const canEdit = role === "Owner" || role === "Editor";
  return { role, isOwner, isClient, companyId, canEdit, canManageUsers: isOwner, canManageSettings: isOwner };
}
