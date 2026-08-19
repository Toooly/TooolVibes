import type { PersonalStack, WorkspaceStateV1 } from "@/lib/discovery/types";
import { reduceWorkspaceState } from "@/lib/discovery/workspace-contract";

import { activePersonalStacks } from "./workspace-pipeline";

export const LISTA_STACK_ID = "lista";
export const LISTA_STACK_NAME = "Lista";

export function pickWorkingPersonalStack(
  state: WorkspaceStateV1,
): PersonalStack | null {
  const active = activePersonalStacks(state);
  if (active.length === 0) return null;
  const lista = active.find((stack) => stack.id === LISTA_STACK_ID);
  if (lista) return lista;
  return [...active].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )[0] ?? null;
}

export function leftoverLegacyStackSlugs(state: WorkspaceStateV1): string[] {
  const claimed = new Set(
    state.personalStacks.flatMap((stack) => stack.slugs),
  );
  return state.stack.slugs.filter((slug) => !claimed.has(slug));
}

export function workingPersonalStackSlugs(state: WorkspaceStateV1): string[] {
  return pickWorkingPersonalStack(state)?.slugs ?? [];
}

export function reduceAdoptLegacyListaStack(
  state: WorkspaceStateV1,
  at: string,
): WorkspaceStateV1 {
  const leftover = leftoverLegacyStackSlugs(state);
  if (leftover.length === 0) return state;

  let next = state;
  const existing = next.personalStacks.find((stack) => stack.id === LISTA_STACK_ID);

  if (existing?.archivedAt) {
    next = reduceWorkspaceState(next, {
      type: "stacks/unarchive",
      id: LISTA_STACK_ID,
      at,
    });
  } else if (!existing) {
    next = reduceWorkspaceState(next, {
      type: "stacks/create",
      id: LISTA_STACK_ID,
      name: LISTA_STACK_NAME,
      at,
    });
  }

  for (const slug of leftoverLegacyStackSlugs(next)) {
    next = reduceWorkspaceState(next, {
      type: "stacks/add",
      id: LISTA_STACK_ID,
      slug,
      at,
    });
    next = reduceWorkspaceState(next, {
      type: "stack/remove",
      slug,
      at,
    });
  }

  return next;
}

export function reduceAddToWorkingPersonalStack(
  state: WorkspaceStateV1,
  slug: string,
  at: string,
): WorkspaceStateV1 {
  let next = state;
  let target = pickWorkingPersonalStack(next);

  if (!target) {
    const archivedLista = next.personalStacks.find(
      (stack) => stack.id === LISTA_STACK_ID && Boolean(stack.archivedAt),
    );
    if (archivedLista) {
      next = reduceWorkspaceState(next, {
        type: "stacks/unarchive",
        id: LISTA_STACK_ID,
        at,
      });
      target = pickWorkingPersonalStack(next);
    }
  }

  if (!target) {
    next = reduceAdoptLegacyListaStack(next, at);
    target = pickWorkingPersonalStack(next);
  }

  if (!target) {
    next = reduceWorkspaceState(next, {
      type: "stacks/create",
      id: LISTA_STACK_ID,
      name: LISTA_STACK_NAME,
      at,
    });
    target = pickWorkingPersonalStack(next);
  }

  if (!target || target.slugs.includes(slug)) {
    return next;
  }

  return reduceWorkspaceState(next, {
    type: "stacks/add",
    id: target.id,
    slug,
    at,
  });
}

export function reduceRemoveFromWorkingPersonalStack(
  state: WorkspaceStateV1,
  slug: string,
  at: string,
): WorkspaceStateV1 {
  const target = pickWorkingPersonalStack(state);
  if (!target || !target.slugs.includes(slug)) {
    return state;
  }
  return reduceWorkspaceState(state, {
    type: "stacks/remove",
    id: target.id,
    slug,
    at,
  });
}

export function reduceReorderWorkingPersonalStack(
  state: WorkspaceStateV1,
  slugs: string[],
  at: string,
): WorkspaceStateV1 {
  const target = pickWorkingPersonalStack(state);
  if (!target) return state;
  return reduceWorkspaceState(state, {
    type: "stacks/reorder",
    id: target.id,
    slugs,
    at,
  });
}
