import type { SaveReason, ShortlistStage } from "@/lib/types/tool";
import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import {
  workspaceDecisionOutcomeValues,
  type PersonalStack,
  type WorkspaceAction,
  type WorkspaceDecision,
  type WorkspaceDecisionOutcome,
  type WorkspaceOrderedList,
  type WorkspaceStateV1,
  type WorkspaceToolState,
} from "@/lib/discovery/types";
import {
  MAX_COMPARE_TOOLS,
  MAX_PERSONAL_STACKS,
  MAX_STACK_DESCRIPTION_LENGTH,
  MAX_STACK_NAME_LENGTH,
  MAX_USE_CASE_LENGTH,
  MAX_WORKSPACE_COLLECTION_TOOLS,
  WORKSPACE_SCHEMA_VERSION,
} from "@/lib/discovery/workspace-constants";

const workspaceSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

const stageRank: Record<ShortlistStage, number> = {
  saved: 1,
  review: 2,
  top: 3,
};

const saveReasonValues = new Set<SaveReason>([
  "test",
  "compare",
  "design-fit",
  "marketing-fit",
  "client-project",
  "observe",
]);

const decisionOutcomeValues = new Set<WorkspaceDecisionOutcome>(
  workspaceDecisionOutcomeValues,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeSlug(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const slug = value.trim();
  return slug.length <= 120 && workspaceSlugPattern.test(slug) ? slug : null;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string" || !isoTimestampPattern.test(value)) {
    return null;
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

function timestampValue(value: string | null) {
  return value ? new Date(value).getTime() : null;
}

function maxTimestamp(left: string | null, right: string | null) {
  const leftValue = timestampValue(left);
  const rightValue = timestampValue(right);

  if (leftValue === null) {
    return right;
  }

  if (rightValue === null) {
    return left;
  }

  return leftValue >= rightValue ? left : right;
}

function normalizeNote(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const note = value.trim();
  return note && note.length <= 2000 ? note : null;
}

function normalizeBoundedText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function normalizeStage(value: unknown): ShortlistStage {
  return value === "review" || value === "top" ? value : "saved";
}

function normalizeSaveReason(value: unknown): SaveReason | null {
  return saveReasonValues.has(value as SaveReason) ? (value as SaveReason) : null;
}

function normalizeDecision(value: unknown): WorkspaceDecision | null {
  if (!isRecord(value)) {
    return null;
  }

  const updatedAt = normalizeTimestamp(value.updatedAt);

  if (!updatedAt) {
    return null;
  }

  if (
    value.outcome !== null &&
    !decisionOutcomeValues.has(value.outcome as WorkspaceDecisionOutcome)
  ) {
    return null;
  }

  return {
    outcome: value.outcome as WorkspaceDecisionOutcome | null,
    updatedAt,
  };
}

function normalizeToolState(value: unknown): WorkspaceToolState | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    stage: normalizeStage(value.stage),
    note: normalizeNote(value.note),
    saveReason: normalizeSaveReason(value.saveReason),
    pinned: value.pinned === true,
    decision: normalizeDecision(value.decision),
    useCase: normalizeBoundedText(value.useCase, MAX_USE_CASE_LENGTH),
    alternatives: normalizeSlugList(value.alternatives, {
      maxLength: MAX_COMPARE_TOOLS,
    }),
    revisitAt: normalizeTimestamp(value.revisitAt),
    updatedAt: normalizeTimestamp(value.updatedAt),
  };
}

function normalizePersonalStack(value: unknown): PersonalStack | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeSlug(value.id);
  const name = normalizeBoundedText(value.name, MAX_STACK_NAME_LENGTH);
  const updatedAt = normalizeTimestamp(value.updatedAt);

  if (!id || !name || !updatedAt) {
    return null;
  }

  return {
    id,
    name,
    description: normalizeBoundedText(
      value.description,
      MAX_STACK_DESCRIPTION_LENGTH,
    ),
    slugs: normalizeSlugList(value.slugs),
    archivedAt: normalizeTimestamp(value.archivedAt),
    updatedAt,
  };
}

function normalizePersonalStacks(value: unknown): PersonalStack[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const stacks: PersonalStack[] = [];

  for (const item of value) {
    const stack = normalizePersonalStack(item);

    if (!stack || seen.has(stack.id)) {
      continue;
    }

    seen.add(stack.id);
    stacks.push(stack);

    if (stacks.length >= MAX_PERSONAL_STACKS) {
      break;
    }
  }

  return stacks;
}

function clonePersonalStack(stack: PersonalStack): PersonalStack {
  return {
    ...stack,
    slugs: [...stack.slugs],
  };
}

function normalizeSlugList(
  value: unknown,
  options: {
    keepLastDuplicate?: boolean;
    maxLength?: number;
  } = {},
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const slugs = value
    .map(normalizeSlug)
    .filter((slug): slug is string => Boolean(slug));

  let unique: string[];

  if (options.keepLastDuplicate) {
    const seen = new Set<string>();
    unique = [];

    for (let index = slugs.length - 1; index >= 0; index -= 1) {
      const slug = slugs[index];

      if (!seen.has(slug)) {
        seen.add(slug);
        unique.unshift(slug);
      }
    }
  } else {
    unique = Array.from(new Set(slugs));
  }

  if (options.maxLength === undefined) {
    return unique;
  }

  return options.keepLastDuplicate
    ? unique.slice(-options.maxLength)
    : unique.slice(0, options.maxLength);
}

function normalizeOrderedList(
  value: unknown,
  options: {
    keepLastDuplicate?: boolean;
    maxLength?: number;
  } = {},
): WorkspaceOrderedList {
  const record = isRecord(value) ? value : {};

  return {
    slugs: normalizeSlugList(record.slugs, options),
    updatedAt: normalizeTimestamp(record.updatedAt),
  };
}

export function createEmptyWorkspaceState(): WorkspaceStateV1 {
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    clearedAt: null,
    saved: { slugs: [], updatedAt: null },
    compare: { slugs: [], updatedAt: null },
    stack: { slugs: [], updatedAt: null },
    personalStacks: [],
    toolStates: {},
  };
}

export function parseWorkspaceState(input: unknown): WorkspaceStateV1 {
  return workspaceStateV1Schema.parse(input);
}

/**
 * Tolerant canonical normalizer. Legacy payloads must pass through their
 * explicit read-only adapters instead of relying on structural guessing here.
 */
export function normalizeWorkspaceState(input: unknown): WorkspaceStateV1 {
  if (!isRecord(input) || input.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
    return createEmptyWorkspaceState();
  }

  const rawToolStates = isRecord(input.toolStates) ? input.toolStates : {};
  const toolStates = Object.fromEntries(
    Object.entries(rawToolStates)
      .map(([rawSlug, rawState]) => {
        const slug = normalizeSlug(rawSlug);
        const state = normalizeToolState(rawState);
        return slug && state ? ([slug, state] as const) : null;
      })
      .filter(
        (entry): entry is readonly [string, WorkspaceToolState] =>
          entry !== null,
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  return parseWorkspaceState({
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    clearedAt: normalizeTimestamp(input.clearedAt),
    saved: normalizeOrderedList(input.saved),
    compare: normalizeOrderedList(input.compare, {
      keepLastDuplicate: true,
      maxLength: MAX_COMPARE_TOOLS,
    }),
    stack: normalizeOrderedList(input.stack),
    personalStacks: normalizePersonalStacks(input.personalStacks),
    toolStates,
  });
}

function cloneOrderedList(list: WorkspaceOrderedList): WorkspaceOrderedList {
  return {
    slugs: [...list.slugs],
    updatedAt: list.updatedAt,
  };
}

function mergeOrderedLists(
  left: WorkspaceOrderedList,
  right: WorkspaceOrderedList,
  options: {
    compare?: boolean;
  } = {},
): WorkspaceOrderedList {
  const leftTime = timestampValue(left.updatedAt);
  const rightTime = timestampValue(right.updatedAt);

  if (leftTime !== null && (rightTime === null || leftTime > rightTime)) {
    return cloneOrderedList(left);
  }

  if (rightTime !== null && (leftTime === null || rightTime > leftTime)) {
    return cloneOrderedList(right);
  }

  if (leftTime !== null && rightTime !== null && leftTime === rightTime) {
    const winner =
      JSON.stringify(left.slugs).localeCompare(JSON.stringify(right.slugs)) <= 0
        ? left
        : right;
    return cloneOrderedList(winner);
  }

  return {
    slugs: normalizeSlugList([...left.slugs, ...right.slugs], {
      keepLastDuplicate: options.compare,
      maxLength: options.compare ? MAX_COMPARE_TOOLS : undefined,
    }),
    updatedAt: maxTimestamp(left.updatedAt, right.updatedAt),
  };
}

function mergeDecisions(
  left: WorkspaceDecision | null,
  right: WorkspaceDecision | null,
) {
  if (!left) {
    return right ? { ...right } : null;
  }

  if (!right) {
    return { ...left };
  }

  const leftTime = new Date(left.updatedAt).getTime();
  const rightTime = new Date(right.updatedAt).getTime();

  if (leftTime > rightTime) {
    return { ...left };
  }

  if (rightTime > leftTime) {
    return { ...right };
  }

  if (left.outcome === right.outcome) {
    return { ...left };
  }

  if (left.outcome === null) {
    return { ...left };
  }

  if (right.outcome === null) {
    return { ...right };
  }

  return left.outcome.localeCompare(right.outcome) <= 0
    ? { ...left }
    : { ...right };
}

function chooseConcurrentText<T extends string>(
  left: T | null,
  right: T | null,
) {
  if (left === null || right === null) {
    return left ?? right;
  }

  return left.localeCompare(right) <= 0 ? left : right;
}

function mergeToolStates(
  left: WorkspaceToolState | null,
  right: WorkspaceToolState | null,
): WorkspaceToolState | null {
  if (!left) {
    return right
      ? {
          ...right,
          decision: right.decision ? { ...right.decision } : null,
        }
      : null;
  }

  if (!right) {
    return {
      ...left,
      decision: left.decision ? { ...left.decision } : null,
    };
  }

  const leftTime = timestampValue(left.updatedAt);
  const rightTime = timestampValue(right.updatedAt);
  const decision = mergeDecisions(left.decision, right.decision);

  if (leftTime !== null && rightTime !== null && leftTime !== rightTime) {
    const latest = leftTime > rightTime ? left : right;

    return {
      ...latest,
      decision,
    };
  }

  if (leftTime !== null && rightTime === null) {
    return {
      ...left,
      decision,
    };
  }

  if (rightTime !== null && leftTime === null) {
    return {
      ...right,
      decision,
    };
  }

  return {
    stage:
      stageRank[left.stage] >= stageRank[right.stage]
        ? left.stage
        : right.stage,
    note: chooseConcurrentText(left.note, right.note),
    saveReason: chooseConcurrentText(left.saveReason, right.saveReason),
    pinned: left.pinned || right.pinned,
    decision,
    useCase: chooseConcurrentText(left.useCase, right.useCase),
    alternatives: chooseConcurrentAlternatives(left.alternatives, right.alternatives),
    revisitAt: chooseConcurrentText(left.revisitAt, right.revisitAt),
    updatedAt: maxTimestamp(left.updatedAt, right.updatedAt),
  };
}

function chooseConcurrentAlternatives(left: string[], right: string[]) {
  const leftKey = JSON.stringify(left);
  const rightKey = JSON.stringify(right);
  return leftKey.localeCompare(rightKey) <= 0 ? [...left] : [...right];
}

function mergePersonalStacks(
  left: PersonalStack[],
  right: PersonalStack[],
): PersonalStack[] {
  const ids = Array.from(
    new Set([...left.map((stack) => stack.id), ...right.map((stack) => stack.id)]),
  );
  const leftById = new Map(left.map((stack) => [stack.id, stack]));
  const rightById = new Map(right.map((stack) => [stack.id, stack]));
  const merged: PersonalStack[] = [];

  for (const id of ids) {
    const leftStack = leftById.get(id) ?? null;
    const rightStack = rightById.get(id) ?? null;

    if (!leftStack) {
      merged.push(clonePersonalStack(rightStack as PersonalStack));
      continue;
    }

    if (!rightStack) {
      merged.push(clonePersonalStack(leftStack));
      continue;
    }

    const leftTime = timestampValue(leftStack.updatedAt);
    const rightTime = timestampValue(rightStack.updatedAt);

    if (leftTime !== null && rightTime !== null && leftTime !== rightTime) {
      merged.push(
        clonePersonalStack(leftTime > rightTime ? leftStack : rightStack),
      );
      continue;
    }

    const winner =
      JSON.stringify(leftStack).localeCompare(JSON.stringify(rightStack)) <= 0
        ? leftStack
        : rightStack;
    merged.push(clonePersonalStack(winner));
  }

  return merged.slice(0, MAX_PERSONAL_STACKS);
}


function applyClearBoundary(
  state: WorkspaceStateV1,
  boundary: string | null,
): WorkspaceStateV1 {
  const boundaryTime = timestampValue(boundary);

  if (boundaryTime === null || !boundary) {
    return state;
  }

  const retainListAfterBoundary = (
    list: WorkspaceOrderedList,
  ): WorkspaceOrderedList => {
    const listTime = timestampValue(list.updatedAt);

    return listTime !== null && listTime > boundaryTime
      ? cloneOrderedList(list)
      : { slugs: [], updatedAt: boundary };
  };

  const toolStates = Object.fromEntries(
    Object.entries(state.toolStates).flatMap(([slug, toolState]) => {
      const metadataTime = timestampValue(toolState.updatedAt);
      const decision = toolState.decision;
      const decisionTime = timestampValue(decision?.updatedAt ?? null);
      const metadataIsNew = metadataTime !== null && metadataTime > boundaryTime;
      const decisionIsNew = decisionTime !== null && decisionTime > boundaryTime;

      if (!metadataIsNew && !decisionIsNew) {
        return [];
      }

      const metadata = metadataIsNew ? toolState : defaultToolState();

      return [
        [
          slug,
          {
            ...metadata,
            decision: decisionIsNew && decision ? { ...decision } : null,
            updatedAt: metadataIsNew ? toolState.updatedAt : null,
          },
        ] as const,
      ];
    }),
  );

  return normalizeWorkspaceState({
    ...state,
    saved: retainListAfterBoundary(state.saved),
    compare: retainListAfterBoundary(state.compare),
    stack: retainListAfterBoundary(state.stack),
    personalStacks: state.personalStacks.filter((stack) => {
      const stackTime = timestampValue(stack.updatedAt);
      return stackTime !== null && stackTime > boundaryTime;
    }),
    toolStates,
  });
}

export function mergeWorkspaceStates(
  leftInput: unknown,
  rightInput: unknown,
): WorkspaceStateV1 {
  const leftState = normalizeWorkspaceState(leftInput);
  const rightState = normalizeWorkspaceState(rightInput);
  const left = applyClearBoundary(leftState, rightState.clearedAt);
  const right = applyClearBoundary(rightState, leftState.clearedAt);
  const toolSlugs = Array.from(
    new Set([
      ...Object.keys(left.toolStates),
      ...Object.keys(right.toolStates),
    ]),
  ).sort();
  const toolStates = Object.fromEntries(
    toolSlugs.flatMap((slug) => {
      const state = mergeToolStates(
        left.toolStates[slug] ?? null,
        right.toolStates[slug] ?? null,
      );

      return state ? [[slug, state] as const] : [];
    }),
  );

  return normalizeWorkspaceState({
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    clearedAt: maxTimestamp(left.clearedAt, right.clearedAt),
    saved: mergeOrderedLists(left.saved, right.saved),
    compare: mergeOrderedLists(left.compare, right.compare, {
      compare: true,
    }),
    stack: mergeOrderedLists(left.stack, right.stack),
    personalStacks: mergePersonalStacks(left.personalStacks, right.personalStacks),
    toolStates,
  });
}

function sameMembers(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((slug) => right.includes(slug))
  );
}

function ensureSaved(
  state: WorkspaceStateV1,
  slug: string,
  at: string,
) {
  if (state.saved.slugs.includes(slug)) {
    return {
      slugs: [...state.saved.slugs],
      updatedAt: at,
    };
  }

  return {
    slugs: [...state.saved.slugs, slug],
    updatedAt: at,
  };
}

function defaultToolState(): WorkspaceToolState {
  return {
    stage: "saved",
    note: null,
    saveReason: null,
    pinned: false,
    decision: null,
    useCase: null,
    alternatives: [],
    revisitAt: null,
    updatedAt: null,
  };
}

function replacePersonalStack(
  state: WorkspaceStateV1,
  next: PersonalStack,
): WorkspaceStateV1 {
  const exists = state.personalStacks.some((stack) => stack.id === next.id);
  const personalStacks = exists
    ? state.personalStacks.map((stack) =>
        stack.id === next.id ? next : stack,
      )
    : [...state.personalStacks, next];

  return normalizeWorkspaceState({
    ...state,
    personalStacks,
  });
}

function updateToolState(
  state: WorkspaceStateV1,
  slug: string,
  at: string,
  update: (current: WorkspaceToolState) => WorkspaceToolState,
) {
  const current = state.toolStates[slug] ?? defaultToolState();

  return normalizeWorkspaceState({
    ...state,
    saved: ensureSaved(state, slug, at),
    toolStates: {
      ...state.toolStates,
      [slug]: {
        ...update(current),
        updatedAt: at,
      },
    },
  });
}

export function reduceWorkspaceState(
  input: unknown,
  action: WorkspaceAction,
): WorkspaceStateV1 {
  const state = normalizeWorkspaceState(input);
  const at = normalizeTimestamp(action.at);

  if (!at) {
    return state;
  }

  if (action.type === "workspace/clear") {
    return normalizeWorkspaceState({
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      clearedAt: at,
      saved: { slugs: [], updatedAt: at },
      compare: { slugs: [], updatedAt: at },
      stack: { slugs: [], updatedAt: at },
      personalStacks: [],
      toolStates: {},
    });
  }

  if (action.type === "compare/clear") {
    return normalizeWorkspaceState({
      ...state,
      compare: {
        slugs: [],
        updatedAt: at,
      },
    });
  }

  if (action.type === "stack/reorder") {
    const requestedSlugs = normalizeSlugList(action.slugs);

    if (
      requestedSlugs.length !== action.slugs.length ||
      !sameMembers(requestedSlugs, state.stack.slugs)
    ) {
      return state;
    }

    return normalizeWorkspaceState({
      ...state,
      stack: {
        slugs: requestedSlugs,
        updatedAt: at,
      },
    });
  }

  if (action.type === "stacks/create") {
    const id = normalizeSlug(action.id);
    const name = normalizeBoundedText(action.name, MAX_STACK_NAME_LENGTH);
    const description = normalizeBoundedText(
      action.description,
      MAX_STACK_DESCRIPTION_LENGTH,
    );

    if (
      !id ||
      !name ||
      state.personalStacks.some((stack) => stack.id === id) ||
      state.personalStacks.length >= MAX_PERSONAL_STACKS
    ) {
      return state;
    }

    return replacePersonalStack(state, {
      id,
      name,
      description,
      slugs: [],
      archivedAt: null,
      updatedAt: at,
    });
  }

  if (action.type === "stacks/rename") {
    const id = normalizeSlug(action.id);
    const current = id
      ? state.personalStacks.find((stack) => stack.id === id)
      : undefined;
    const name = normalizeBoundedText(action.name, MAX_STACK_NAME_LENGTH);
    const description =
      action.description === undefined
        ? current?.description ?? null
        : normalizeBoundedText(action.description, MAX_STACK_DESCRIPTION_LENGTH);

    if (!id || !current || !name) {
      return state;
    }

    return replacePersonalStack(state, {
      ...current,
      name,
      description,
      updatedAt: at,
    });
  }

  if (action.type === "stacks/archive") {
    const id = normalizeSlug(action.id);
    const current = id
      ? state.personalStacks.find((stack) => stack.id === id)
      : undefined;

    if (!id || !current || current.archivedAt) {
      return state;
    }

    return replacePersonalStack(state, {
      ...current,
      archivedAt: at,
      updatedAt: at,
    });
  }

  if (action.type === "stacks/unarchive") {
    const id = normalizeSlug(action.id);
    const current = id
      ? state.personalStacks.find((stack) => stack.id === id)
      : undefined;

    if (!id || !current || !current.archivedAt) {
      return state;
    }

    return replacePersonalStack(state, {
      ...current,
      archivedAt: null,
      updatedAt: at,
    });
  }

  if (action.type === "stacks/reorder") {
    const id = normalizeSlug(action.id);
    const current = id
      ? state.personalStacks.find((stack) => stack.id === id)
      : undefined;
    const requestedSlugs = normalizeSlugList(action.slugs);

    if (
      !id ||
      !current ||
      requestedSlugs.length !== action.slugs.length ||
      !sameMembers(requestedSlugs, current.slugs)
    ) {
      return state;
    }

    return replacePersonalStack(state, {
      ...current,
      slugs: requestedSlugs,
      updatedAt: at,
    });
  }

  const slug =
    "slug" in action ? normalizeSlug(action.slug) : null;

  if (!slug) {
    return state;
  }

  switch (action.type) {
    case "saved/set": {
      const currentlySaved = state.saved.slugs.includes(slug);

      if (currentlySaved === action.saved) {
        return state;
      }

      return normalizeWorkspaceState({
        ...state,
        saved: {
          slugs: action.saved
            ? [...state.saved.slugs, slug]
            : state.saved.slugs.filter((item) => item !== slug),
          updatedAt: at,
        },
      });
    }

    case "saved/toggle":
      return reduceWorkspaceState(state, {
        type: "saved/set",
        slug,
        saved: !state.saved.slugs.includes(slug),
        at,
      });

    case "compare/toggle": {
      const exists = state.compare.slugs.includes(slug);

      if (!exists && state.compare.slugs.length >= MAX_COMPARE_TOOLS) {
        return state;
      }

      return normalizeWorkspaceState({
        ...state,
        compare: {
          slugs: exists
            ? state.compare.slugs.filter((item) => item !== slug)
            : [...state.compare.slugs, slug],
          updatedAt: at,
        },
      });
    }

    case "stack/add":
      if (state.stack.slugs.includes(slug)) {
        return state;
      }

      return normalizeWorkspaceState({
        ...state,
        stack: {
          slugs: [...state.stack.slugs, slug],
          updatedAt: at,
        },
      });

    case "stack/remove":
      if (!state.stack.slugs.includes(slug)) {
        return state;
      }

      return normalizeWorkspaceState({
        ...state,
        stack: {
          slugs: state.stack.slugs.filter((item) => item !== slug),
          updatedAt: at,
        },
      });

    case "tool/stage":
      if (
        action.stage !== "saved" &&
        action.stage !== "review" &&
        action.stage !== "top"
      ) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        stage: action.stage,
      }));

    case "tool/note": {
      const trimmedNote =
        typeof action.note === "string" ? action.note.trim() : null;

      if (trimmedNote && trimmedNote.length > 2000) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        note: trimmedNote || null,
      }));
    }

    case "tool/save-reason":
      if (
        action.saveReason !== null &&
        !saveReasonValues.has(action.saveReason)
      ) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        saveReason: action.saveReason,
      }));

    case "tool/pin":
      return updateToolState(state, slug, at, (current) => ({
        ...current,
        pinned: action.pinned,
      }));

    case "tool/decision":
      if (
        action.outcome !== null &&
        !decisionOutcomeValues.has(action.outcome)
      ) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        decision: {
          outcome: action.outcome,
          updatedAt: at,
        },
        alternatives:
          action.alternatives !== undefined
            ? normalizeSlugList(action.alternatives, {
                maxLength: MAX_COMPARE_TOOLS,
              })
            : action.outcome === null
              ? current.alternatives
              : state.compare.slugs.length > 0
                ? [...state.compare.slugs]
                : current.alternatives,
      }));

    case "tool/use-case": {
      const useCase = normalizeBoundedText(action.useCase, MAX_USE_CASE_LENGTH);

      if (action.useCase && !useCase) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        useCase,
      }));
    }

    case "tool/revisit": {
      const revisitAt =
        action.revisitAt === null ? null : normalizeTimestamp(action.revisitAt);

      if (action.revisitAt !== null && !revisitAt) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        revisitAt,
      }));
    }

    case "stacks/add": {
      const id = normalizeSlug(action.id);
      const current = id
        ? state.personalStacks.find((stack) => stack.id === id)
        : undefined;

      if (
        !id ||
        !current ||
        current.slugs.includes(slug) ||
        current.slugs.length >= MAX_WORKSPACE_COLLECTION_TOOLS
      ) {
        return state;
      }

      return replacePersonalStack(state, {
        ...current,
        slugs: [...current.slugs, slug],
        updatedAt: at,
      });
    }

    case "stacks/remove": {
      const id = normalizeSlug(action.id);
      const current = id
        ? state.personalStacks.find((stack) => stack.id === id)
        : undefined;

      if (!id || !current || !current.slugs.includes(slug)) {
        return state;
      }

      return replacePersonalStack(state, {
        ...current,
        slugs: current.slugs.filter((item) => item !== slug),
        updatedAt: at,
      });
    }

    default:
      return state;
  }
}

export function hasWorkspaceData(input: unknown) {
  const state = normalizeWorkspaceState(input);

  return (
    state.saved.slugs.length > 0 ||
    state.clearedAt !== null ||
    state.compare.slugs.length > 0 ||
    state.stack.slugs.length > 0 ||
    state.personalStacks.length > 0 ||
    Object.keys(state.toolStates).length > 0
  );
}
