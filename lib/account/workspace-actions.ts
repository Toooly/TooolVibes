import type { WorkspaceAction, WorkspaceDecisionOutcome } from "@/lib/discovery/types";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  commitCanonicalToolWorkspaceState,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";
import type { SaveReason, ShortlistStage } from "@/lib/types/tool";

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

export function addToolToPersonalStack(id: string, slug: string) {
  return applyWorkspaceAction({ type: "stacks/add", id, slug, at: nowIso() });
}

export function removeToolFromPersonalStack(id: string, slug: string) {
  return applyWorkspaceAction({ type: "stacks/remove", id, slug, at: nowIso() });
}

export function setWorkspaceStage(slug: string, stage: ShortlistStage) {
  return applyWorkspaceAction({ type: "tool/stage", slug, stage, at: nowIso() });
}

export function setWorkspaceDecision(
  slug: string,
  outcome: WorkspaceDecisionOutcome | null,
) {
  return applyWorkspaceAction({ type: "tool/decision", slug, outcome, at: nowIso() });
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
