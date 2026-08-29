import type { SaveReason, ShortlistStage } from "@/lib/types/tool";
import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import {
  compareObjectiveValues,
  workspaceDecisionOutcomeValues,
  workspaceUsageValues,
  relationshipEventTypeValues,
  type CompareObjective,
  type PersonalStack,
  type RelationshipEventType,
  type WorkspaceAction,
  type WorkspaceDecision,
  type WorkspaceDecisionOutcome,
  type WorkspaceOrderedList,
  type WorkspaceRelationshipEvent,
  type WorkspaceStateV1,
  type WorkspaceToolState,
  type WorkspaceUsage,
} from "@/lib/discovery/types";
import {
  MAX_COMPARE_TOOLS,
  MAX_PERSONAL_STACKS,
  MAX_RELATIONSHIP_EVENT_ID_LENGTH,
  MAX_RELATIONSHIP_EVENTS,
  MAX_STACK_DESCRIPTION_LENGTH,
  MAX_STACK_NAME_LENGTH,
  MAX_USE_CASE_LENGTH,
  MAX_NOTE_LENGTH,
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

const usageValues = new Set<WorkspaceUsage>(workspaceUsageValues);

const compareObjectiveValueSet = new Set<CompareObjective>(
  compareObjectiveValues,
);

const relationshipEventTypeSet = new Set<RelationshipEventType>(
  relationshipEventTypeValues,
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
  return note && note.length <= MAX_NOTE_LENGTH ? note : null;
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

function normalizeUsage(value: unknown): WorkspaceUsage | null {
  return usageValues.has(value as WorkspaceUsage)
    ? (value as WorkspaceUsage)
    : null;
}

function normalizeCompareObjective(value: unknown): CompareObjective | null {
  return compareObjectiveValueSet.has(value as CompareObjective)
    ? (value as CompareObjective)
    : null;
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
    usage: normalizeUsage(value.usage),
    replacedBy: normalizeSlug(value.replacedBy),
    compareObjective: normalizeCompareObjective(value.compareObjective),
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

function normalizeEventId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const id = value.trim();
  if (!id || id.length > MAX_RELATIONSHIP_EVENT_ID_LENGTH) {
    return null;
  }

  return id;
}

function normalizeRelationshipEvent(
  value: unknown,
): WorkspaceRelationshipEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeEventId(value.id);
  const type =
    typeof value.type === "string" && relationshipEventTypeSet.has(value.type as RelationshipEventType)
      ? (value.type as RelationshipEventType)
      : null;
  const slug = normalizeSlug(value.slug);
  const at = normalizeTimestamp(value.at);

  if (!id || !type || !slug || !at) {
    return null;
  }

  const event: WorkspaceRelationshipEvent = { id, type, slug, at };

  if ("outcome" in value) {
    if (value.outcome === null) {
      event.outcome = null;
    } else if (
      typeof value.outcome === "string" &&
      decisionOutcomeValues.has(value.outcome as WorkspaceDecisionOutcome)
    ) {
      event.outcome = value.outcome as WorkspaceDecisionOutcome;
    } else {
      return null;
    }
  }

  if ("reason" in value) {
    event.reason = value.reason === null ? null : normalizeNote(value.reason);
    if (value.reason && !event.reason) {
      return null;
    }
  }

  if ("useCase" in value) {
    event.useCase =
      value.useCase === null
        ? null
        : normalizeBoundedText(value.useCase, MAX_USE_CASE_LENGTH);
    if (value.useCase && !event.useCase) {
      return null;
    }
  }

  if ("alternatives" in value) {
    event.alternatives = normalizeSlugList(value.alternatives, {
      maxLength: MAX_COMPARE_TOOLS,
    });
  }

  if ("replacementSlug" in value) {
    if (value.replacementSlug === null) {
      event.replacementSlug = null;
    } else {
      const replacementSlug = normalizeSlug(value.replacementSlug);
      if (!replacementSlug) {
        return null;
      }
      event.replacementSlug = replacementSlug;
    }
  }

  if ("revisitAt" in value) {
    if (value.revisitAt === null) {
      event.revisitAt = null;
    } else {
      const revisitAt = normalizeTimestamp(value.revisitAt);
      if (!revisitAt) {
        return null;
      }
      event.revisitAt = revisitAt;
    }
  }

  return event;
}

function sortRelationshipEvents(events: WorkspaceRelationshipEvent[]) {
  return [...events].sort((left, right) => {
    if (left.at !== right.at) {
      return left.at < right.at ? -1 : 1;
    }
    return left.id.localeCompare(right.id);
  });
}

function evictRelationshipEvents(events: WorkspaceRelationshipEvent[]) {
  if (events.length <= MAX_RELATIONSHIP_EVENTS) {
    return events;
  }

  const latestDecidedId = new Map<string, string>();
  for (const event of events) {
    if (event.type === "decided") {
      latestDecidedId.set(event.slug, event.id);
    }
  }

  const next = [...events];
  while (next.length > MAX_RELATIONSHIP_EVENTS) {
    const dropIndex = next.findIndex((event) => {
      if (event.type !== "decided" && event.type !== "replaced") {
        return true;
      }
      if (event.type === "decided" && latestDecidedId.get(event.slug) === event.id) {
        return false;
      }
      return event.type !== "decided";
    });
    next.splice(dropIndex === -1 ? 0 : dropIndex, 1);
  }

  return next;
}

function normalizeRelationshipEvents(value: unknown): WorkspaceRelationshipEvent[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const events: WorkspaceRelationshipEvent[] = [];
  for (const item of value) {
    const event = normalizeRelationshipEvent(item);
    if (!event || seen.has(event.id)) {
      continue;
    }
    seen.add(event.id);
    events.push(event);
  }

  return evictRelationshipEvents(sortRelationshipEvents(events));
}

function mergeRelationshipEvents(
  left: WorkspaceRelationshipEvent[],
  right: WorkspaceRelationshipEvent[],
) {
  const byId = new Map<string, WorkspaceRelationshipEvent>();
  for (const event of left) {
    byId.set(event.id, event);
  }
  for (const event of right) {
    if (!byId.has(event.id)) {
      byId.set(event.id, event);
    }
  }
  return evictRelationshipEvents(sortRelationshipEvents([...byId.values()]));
}

function derivedEventId(type: RelationshipEventType, slug: string, at: string) {
  const id = `${type}:${slug}:${at}`;
  return id.length > MAX_RELATIONSHIP_EVENT_ID_LENGTH
    ? id.slice(0, MAX_RELATIONSHIP_EVENT_ID_LENGTH)
    : id;
}

function appendRelationshipEvent(
  events: WorkspaceRelationshipEvent[],
  event: WorkspaceRelationshipEvent,
) {
  if (events.some((item) => item.id === event.id)) {
    return events;
  }
  return evictRelationshipEvents(sortRelationshipEvents([...events, event]));
}

function withAppendedEvent(
  state: WorkspaceStateV1,
  event: WorkspaceRelationshipEvent,
): WorkspaceStateV1 {
  return normalizeWorkspaceState({
    ...state,
    events: appendRelationshipEvent(state.events, event),
  });
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
    events: [],
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
    events: normalizeRelationshipEvents(input.events),
  });
}

export function stripUnsetSoftwareMemory(state: WorkspaceStateV1): WorkspaceStateV1 {
  return {
    ...state,
    toolStates: Object.fromEntries(
      Object.entries(state.toolStates).map(([slug, tool]) => {
        const next: Record<string, unknown> = { ...tool };
        if (next.usage == null) delete next.usage;
        if (next.replacedBy == null) delete next.replacedBy;
        if (next.compareObjective == null) delete next.compareObjective;
        return [slug, next];
      }),
    ) as WorkspaceStateV1["toolStates"],
  };
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
    usage: chooseConcurrentText(left.usage, right.usage),
    replacedBy: chooseConcurrentText(left.replacedBy, right.replacedBy),
    compareObjective: chooseConcurrentText(
      left.compareObjective,
      right.compareObjective,
    ),
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
    events: state.events.filter((event) => {
      const eventTime = timestampValue(event.at);
      return eventTime !== null && eventTime > boundaryTime;
    }),
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
    events: mergeRelationshipEvents(left.events, right.events),
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
    usage: null,
    replacedBy: null,
    compareObjective: null,
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
      events: [],
    });
  }

  if (action.type === "workspace/decide") {
    if (!decisionOutcomeValues.has(action.outcome)) {
      return state;
    }

    const slug = normalizeSlug(action.slug);
    if (!slug) {
      return state;
    }

    const eventId = normalizeEventId(action.eventId) ?? derivedEventId("decided", slug, at);
    const reason =
      action.reason === undefined
        ? undefined
        : action.reason === null
          ? null
          : normalizeNote(action.reason);
    if (action.reason && reason === null) {
      return state;
    }
    const useCase =
      action.useCase === undefined
        ? undefined
        : action.useCase === null
          ? null
          : normalizeBoundedText(action.useCase, MAX_USE_CASE_LENGTH);
    if (action.useCase && useCase === null) {
      return state;
    }
    const revisitAt =
      action.revisitAt === undefined
        ? undefined
        : action.revisitAt === null
          ? null
          : normalizeTimestamp(action.revisitAt);
    if (action.revisitAt && revisitAt === null) {
      return state;
    }

    const alternatives =
      action.alternatives !== undefined
        ? normalizeSlugList(action.alternatives, { maxLength: MAX_COMPARE_TOOLS })
        : state.compare.slugs.length > 0
          ? [...state.compare.slugs]
          : (state.toolStates[slug]?.alternatives ?? []);

    const decided = updateToolState(state, slug, at, (current) => ({
      ...current,
      decision: {
        outcome: action.outcome,
        updatedAt: at,
      },
      alternatives,
      ...(action.useCase !== undefined ? { useCase: useCase ?? null } : {}),
      ...(action.revisitAt !== undefined ? { revisitAt: revisitAt ?? null } : {}),
      ...("compareObjective" in action
        ? {
            compareObjective: normalizeCompareObjective(action.compareObjective),
          }
        : {}),
      ...(action.outcome === "rejected" ? { usage: null, replacedBy: null } : {}),
    }));

    const event: WorkspaceRelationshipEvent = {
      id: eventId,
      type: "decided",
      slug,
      at,
      outcome: action.outcome,
      alternatives,
    };
    if (reason !== undefined) event.reason = reason;
    if (useCase !== undefined) event.useCase = useCase;
    if (revisitAt !== undefined) event.revisitAt = revisitAt;

    return normalizeWorkspaceState({
      ...decided,
      compare: { slugs: [], updatedAt: at },
      events: appendRelationshipEvent(decided.events, event),
    });
  }

  if (action.type === "workspace/revisited") {
    const slug = normalizeSlug(action.slug);
    if (!slug) {
      return state;
    }

    const revisitAt =
      action.revisitAt === undefined
        ? undefined
        : action.revisitAt === null
          ? null
          : normalizeTimestamp(action.revisitAt);
    if (action.revisitAt && revisitAt === null) {
      return state;
    }

    const next =
      action.revisitAt === undefined
        ? state
        : updateToolState(state, slug, at, (current) => ({
            ...current,
            revisitAt: revisitAt ?? null,
          }));

    return withAppendedEvent(next, {
      id: normalizeEventId(action.eventId) ?? derivedEventId("revisited", slug, at),
      type: "revisited",
      slug,
      at,
      ...(action.revisitAt !== undefined ? { revisitAt: revisitAt ?? null } : {}),
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

      if (trimmedNote && trimmedNote.length > MAX_NOTE_LENGTH) {
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

      {
        const next = updateToolState(state, slug, at, (current) => ({
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
          ...("compareObjective" in action
            ? {
                compareObjective: normalizeCompareObjective(
                  action.compareObjective,
                ),
              }
            : {}),
          ...(action.outcome === "rejected"
            ? { usage: null, replacedBy: null }
            : {}),
        }));

        if (action.outcome !== null) {
          return next;
        }

        return withAppendedEvent(next, {
          id: derivedEventId("reopened", slug, at),
          type: "reopened",
          slug,
          at,
          outcome: null,
        });
      }

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

      const next = updateToolState(state, slug, at, (current) => ({
        ...current,
        revisitAt,
      }));
      return withAppendedEvent(next, {
        id: derivedEventId("revisit_set", slug, at),
        type: "revisit_set",
        slug,
        at,
        revisitAt,
      });
    }

    case "tool/usage": {
      if (action.usage !== null && !usageValues.has(action.usage)) {
        return state;
      }

      if (action.usage === "replaced") {
        const replacedBy = normalizeSlug(action.replacedBy);

        if (!replacedBy || replacedBy === slug) {
          return state;
        }

        const next = updateToolState(state, slug, at, (current) => ({
          ...current,
          usage: "replaced",
          replacedBy,
          decision:
            current.decision?.outcome === "selected"
              ? current.decision
              : { outcome: "selected", updatedAt: at },
        }));
        return withAppendedEvent(next, {
          id: derivedEventId("replaced", slug, at),
          type: "replaced",
          slug,
          at,
          replacementSlug: replacedBy,
        });
      }

      if (action.usage === "using") {
        const next = updateToolState(state, slug, at, (current) => ({
          ...current,
          usage: "using",
          replacedBy: null,
          decision:
            current.decision?.outcome === "selected"
              ? current.decision
              : { outcome: "selected", updatedAt: at },
        }));
        return withAppendedEvent(next, {
          id: derivedEventId("started_using", slug, at),
          type: "started_using",
          slug,
          at,
        });
      }

      if (action.usage === "stopped") {
        const next = updateToolState(state, slug, at, (current) => ({
          ...current,
          usage: "stopped",
          replacedBy: null,
        }));
        return withAppendedEvent(next, {
          id: derivedEventId("stopped_using", slug, at),
          type: "stopped_using",
          slug,
          at,
        });
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        usage: null,
        replacedBy: null,
      }));
    }

    case "tool/compare-objective": {
      if (
        action.compareObjective !== null &&
        !compareObjectiveValueSet.has(action.compareObjective)
      ) {
        return state;
      }

      return updateToolState(state, slug, at, (current) => ({
        ...current,
        compareObjective: action.compareObjective,
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
    Object.keys(state.toolStates).length > 0 ||
    state.events.length > 0
  );
}
