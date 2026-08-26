import type {
  CompareObjective,
  WorkspaceAction,
  WorkspaceDecisionOutcome,
  WorkspaceUsage,
} from "@/lib/discovery/types";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  commitCanonicalToolWorkspaceState,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";
import type { SaveReason, ShortlistStage } from "@/lib/types/tool";

import {
  emitDecisionRecorded,
  emitDecisionRevisited,
  emitDeferWithRevisit,
  emitToolReplaced,
  emitUsageConfirmed,
  emitUsefulStack,
} from "@/lib/signal-progression/client";

import { activePersonalStacks } from "./workspace-pipeline";
import {
  reduceAddToWorkingPersonalStack,
  reduceAdoptLegacyListaStack,
} from "./workspace-stack-target";

function nowIso() {
  return new Date().toISOString();
}

export function applyWorkspaceAction(action: WorkspaceAction) {
  const current = getCanonicalToolWorkspaceState();
  const next = reduceWorkspaceState(current, action);
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    commitCanonicalToolWorkspaceState(next);
    dispatchWorkspaceChange({ source: "local", scope: "workspace" });
  }
  return next;
}

export function createPersonalStackId(name: string, existingIds: string[]) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "stack";
  let id = base;
  let index = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

export function createPersonalStack(name: string, description?: string | null) {
  const current = getCanonicalToolWorkspaceState();
  return applyWorkspaceAction({
    type: "stacks/create",
    id: createPersonalStackId(name, current.personalStacks.map((stack) => stack.id)),
    name,
    description: description ?? null,
    at: nowIso(),
  });
}

export function renamePersonalStack(
  id: string,
  name: string,
  description?: string | null,
) {
  return applyWorkspaceAction({
    type: "stacks/rename",
    id,
    name,
    description,
    at: nowIso(),
  });
}

export function archivePersonalStack(id: string) {
  return applyWorkspaceAction({ type: "stacks/archive", id, at: nowIso() });
}

export function restorePersonalStack(id: string) {
  return applyWorkspaceAction({ type: "stacks/unarchive", id, at: nowIso() });
}

export function adoptLegacyListaStack() {
  const current = getCanonicalToolWorkspaceState();
  const next = reduceAdoptLegacyListaStack(current, nowIso());
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    commitCanonicalToolWorkspaceState(next);
    dispatchWorkspaceChange({ source: "local", scope: "workspace" });
  }
  return next;
}

function maybeEmitUsefulStack(state: ReturnType<typeof getCanonicalToolWorkspaceState>) {
  if (activePersonalStacks(state).some((stack) => stack.slugs.length >= 3)) {
    emitUsefulStack();
  }
}

export function addToolToWorkingPersonalStack(slug: string) {
  const current = getCanonicalToolWorkspaceState();
  const next = reduceAddToWorkingPersonalStack(current, slug, nowIso());
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    commitCanonicalToolWorkspaceState(next);
    dispatchWorkspaceChange({ source: "local", scope: "workspace" });
  }
  maybeEmitUsefulStack(next);
  return next;
}

export function addToolToPersonalStack(id: string, slug: string) {
  const next = applyWorkspaceAction({ type: "stacks/add", id, slug, at: nowIso() });
  maybeEmitUsefulStack(next);
  return next;
}

export function removeToolFromPersonalStack(id: string, slug: string) {
  return applyWorkspaceAction({ type: "stacks/remove", id, slug, at: nowIso() });
}

export function setWorkspaceStage(slug: string, stage: ShortlistStage) {
  return applyWorkspaceAction({ type: "tool/stage", slug, stage, at: nowIso() });
}

function newRelationshipEventId() {
  return crypto.randomUUID();
}

export function setWorkspaceDecision(
  slug: string,
  outcome: WorkspaceDecisionOutcome | null,
  alternatives?: string[],
  compareObjective?: CompareObjective | null,
) {
  const previous =
    getCanonicalToolWorkspaceState().toolStates[slug]?.decision?.outcome ?? null;
  const at = nowIso();

  if (outcome === null) {
    applyWorkspaceAction({
      type: "tool/decision",
      slug,
      outcome: null,
      at,
      ...(alternatives !== undefined ? { alternatives } : {}),
      ...(compareObjective !== undefined ? { compareObjective } : {}),
    });
    return applyWorkspaceAction({ type: "tool/revisit", slug, revisitAt: null, at });
  }

  const next = applyWorkspaceAction({
    type: "workspace/decide",
    slug,
    outcome,
    at,
    eventId: newRelationshipEventId(),
    ...(alternatives !== undefined ? { alternatives } : {}),
    ...(compareObjective !== undefined ? { compareObjective } : {}),
    ...(outcome !== "deferred" ? { revisitAt: null } : {}),
  });
  if (outcome === "selected" || outcome === "rejected") {
    emitDecisionRecorded(slug);
    if (previous === "deferred") {
      emitDecisionRevisited(slug);
    }
  }
  return next;
}

export function deferWorkspaceTool(
  slug: string,
  revisitAt: string,
  alternatives?: string[],
) {
  const next = applyWorkspaceAction({
    type: "workspace/decide",
    slug,
    outcome: "deferred",
    at: nowIso(),
    eventId: newRelationshipEventId(),
    revisitAt,
    ...(alternatives !== undefined ? { alternatives } : {}),
  });
  emitDeferWithRevisit(slug);
  return next;
}

export function reopenWorkspaceDecision(slug: string) {
  return setWorkspaceDecision(slug, null);
}

export function setWorkspaceUseCase(slug: string, useCase: string | null) {
  return applyWorkspaceAction({ type: "tool/use-case", slug, useCase, at: nowIso() });
}

export function setWorkspaceRevisit(slug: string, revisitAt: string | null) {
  return applyWorkspaceAction({ type: "tool/revisit", slug, revisitAt, at: nowIso() });
}

export function setWorkspaceNote(slug: string, note: string | null) {
  return applyWorkspaceAction({ type: "tool/note", slug, note, at: nowIso() });
}

export function setWorkspaceSaveReason(slug: string, saveReason: SaveReason | null) {
  return applyWorkspaceAction({
    type: "tool/save-reason",
    slug,
    saveReason,
    at: nowIso(),
  });
}

export function setWorkspacePinned(slug: string, pinned: boolean) {
  return applyWorkspaceAction({ type: "tool/pin", slug, pinned, at: nowIso() });
}

export function toggleWorkspaceSaved(slug: string) {
  return applyWorkspaceAction({ type: "saved/toggle", slug, at: nowIso() });
}

export function toggleWorkspaceCompare(slug: string) {
  return applyWorkspaceAction({ type: "compare/toggle", slug, at: nowIso() });
}

export function setWorkspaceUsage(
  slug: string,
  usage: WorkspaceUsage | null,
  replacedBy?: string | null,
) {
  return applyWorkspaceAction({
    type: "tool/usage",
    slug,
    usage,
    at: nowIso(),
    ...(replacedBy !== undefined ? { replacedBy } : {}),
  });
}

export function setWorkspaceCompareObjective(
  slug: string,
  objective: CompareObjective | null,
) {
  return applyWorkspaceAction({
    type: "tool/compare-objective",
    slug,
    compareObjective: objective,
    at: nowIso(),
  });
}

export function markWorkspaceToolUsing(slug: string) {
  const next = setWorkspaceUsage(slug, "using");
  if (next.toolStates[slug]?.usage === "using") {
    emitUsageConfirmed(slug);
  }
  return next;
}

export function markWorkspaceToolStopped(slug: string) {
  return setWorkspaceUsage(slug, "stopped");
}

export function markWorkspaceToolReplaced(slug: string, replacedBy: string) {
  const next = setWorkspaceUsage(slug, "replaced", replacedBy);
  if (next.toolStates[slug]?.usage === "replaced") {
    emitToolReplaced(slug);
  }
  return next;
}

