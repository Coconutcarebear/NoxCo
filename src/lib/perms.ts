"use client";

import { useStore } from "./store";

// UI-level permissions (Phase 2). Phase 3 enforces these in the database too.
//  Owner, everything, incl. managing users and settings
//  Editor, create/edit/delete content (creators, campaigns, posts, todos…)
//  Viewer, read-only
export function usePerms() {
  const role = useStore((s) => s.currentUser?.role ?? "Viewer");
  const isOwner = role === "Owner";
  const canEdit = role === "Owner" || role === "Editor";
  return { role, isOwner, canEdit, canManageUsers: isOwner, canManageSettings: isOwner };
}
