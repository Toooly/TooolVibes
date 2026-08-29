import {
  addToolToPersonalStack,
  createPersonalStack,
  createPersonalStackId,
  toggleWorkspaceSaved,
} from "@/lib/account/workspace-actions";
import { MAX_PERSONAL_STACKS } from "@/lib/discovery/workspace-constants";
import { getActiveWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import { getCanonicalToolWorkspaceState } from "@/lib/stores/tool-workspace-store";
import type { PendingAuthIntent, PendingStackCreatePayload } from "@/lib/auth/pending-auth-intent";
import { openSaveOverflow } from "@/components/tools/save-overflow-state";

export type StackIntentReplayResult =
  | { status: "ok"; returnTo: string; openOverflow: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

function activeStacks() {
  return getCanonicalToolWorkspaceState().personalStacks.filter(
    (stack) => !stack.archivedAt,
  );
}

function ensureSaved(slug: string) {
  if (!getCanonicalToolWorkspaceState().saved.slugs.includes(slug)) {
    toggleWorkspaceSaved(slug);
  }
}

function resolveTargetStack(payload: PendingStackCreatePayload) {
  const stacks = getCanonicalToolWorkspaceState().personalStacks;
  if (payload.targetStackId) {
    const byId = stacks.find((stack) => stack.id === payload.targetStackId);
    if (byId) return byId;
  }
  const name = payload.targetStackName?.trim().toLowerCase();
  if (!name) return null;
  const matches = stacks.filter((stack) => stack.name.toLowerCase() === name);
  if (matches.length === 1) return matches[0];
  return null;
}

function addMembership(stackId: string, slug: string) {
  const stack = getCanonicalToolWorkspaceState().personalStacks.find(
    (item) => item.id === stackId,
  );
  if (stack?.slugs.includes(slug)) return;
  addToolToPersonalStack(stackId, slug);
}

export function replayStackCreateIntent(
  intent: PendingAuthIntent,
): StackIntentReplayResult {
  if (getActiveWorkspaceOwner().kind !== "account") {
    return { status: "skipped", reason: "not-authenticated" };
  }
  if (intent.capability !== "stack.create") {
    return { status: "skipped", reason: "unsupported-capability" };
  }

  const slug = intent.payload.toolSlug;
  const targetingExisting =
    Boolean(intent.payload.targetStackId) || Boolean(intent.payload.targetStackName);

  if (targetingExisting) {
    const target = resolveTargetStack(intent.payload);
    if (!target) {
      return { status: "failed", reason: "missing-target" };
    }
    ensureSaved(slug);
    addMembership(target.id, slug);
    return { status: "ok", returnTo: intent.returnTo, openOverflow: false };
  }

  const name = intent.payload.desiredStackName?.trim();
  if (!name) {
    ensureSaved(slug);
    return {
      status: "ok",
      returnTo: intent.returnTo,
      openOverflow: true,
    };
  }

  const stacks = activeStacks();
  const existing = stacks.find(
    (stack) => stack.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    ensureSaved(slug);
    addMembership(existing.id, slug);
    return { status: "ok", returnTo: intent.returnTo, openOverflow: false };
  }

  if (stacks.length >= MAX_PERSONAL_STACKS) {
    return { status: "failed", reason: "stack-cap" };
  }

  ensureSaved(slug);
  const ids = getCanonicalToolWorkspaceState().personalStacks.map((stack) => stack.id);
  const id = createPersonalStackId(name, ids);
  createPersonalStack(name);
  addMembership(id, slug);
  return { status: "ok", returnTo: intent.returnTo, openOverflow: false };
}

export function maybeOpenOverflowAfterReplay(openOverflow: boolean, slug: string) {
  if (!openOverflow) return;
  openSaveOverflow(slug);
}
