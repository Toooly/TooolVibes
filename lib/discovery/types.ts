import type { SaveReason, ShortlistStage } from "@/lib/types/tool";

export type ViewerKind = "guest" | "account";

export const workspaceDecisionOutcomeValues = [
  "selected",
  "rejected",
  "deferred",
] as const;

export type WorkspaceDecisionOutcome =
  (typeof workspaceDecisionOutcomeValues)[number];

export type WorkspaceDecision = {
  outcome: WorkspaceDecisionOutcome | null;
  updatedAt: string;
};

export const workspaceUsageValues = [
  "using",
  "stopped",
  "replaced",
] as const;

export type WorkspaceUsage = (typeof workspaceUsageValues)[number];

export const compareObjectiveValues = [
  "save-time",
  "quality",
  "save-money",
  "learn-fast",
  "collaborate",
  "scale",
  "experiment",
] as const;

export type CompareObjective = (typeof compareObjectiveValues)[number];

export type WorkspaceToolState = {
  stage: ShortlistStage;
  note: string | null;
  saveReason: SaveReason | null;
  pinned: boolean;
  decision: WorkspaceDecision | null;
  useCase: string | null;
  alternatives: string[];
  revisitAt: string | null;
  usage: WorkspaceUsage | null;
  replacedBy: string | null;
  compareObjective: CompareObjective | null;
  updatedAt: string | null;
};

export type WorkspaceOrderedList = {
  slugs: string[];
  updatedAt: string | null;
};

export type PersonalStack = {
  id: string;
  name: string;
  description: string | null;
  slugs: string[];
  archivedAt: string | null;
  updatedAt: string;
};

export const relationshipEventTypeValues = [
  "decided",
  "reopened",
  "started_using",
  "stopped_using",
  "replaced",
  "revisit_set",
  "revisited",
] as const;

export type RelationshipEventType = (typeof relationshipEventTypeValues)[number];

export type WorkspaceRelationshipEvent = {
  id: string;
  type: RelationshipEventType;
  slug: string;
  at: string;
  outcome?: WorkspaceDecisionOutcome | null;
  reason?: string | null;
  useCase?: string | null;
  alternatives?: string[];
  replacementSlug?: string | null;
  revisitAt?: string | null;
};

export type WorkspaceStateV1 = {
  schemaVersion: 1;
  clearedAt: string | null;
  saved: WorkspaceOrderedList;
  compare: WorkspaceOrderedList;
  stack: WorkspaceOrderedList;
  personalStacks: PersonalStack[];
  toolStates: Record<string, WorkspaceToolState>;
  events: WorkspaceRelationshipEvent[];
};

export type WorkspaceState = WorkspaceStateV1;

export type WorkspaceAction =
  | { type: "saved/set"; slug: string; saved: boolean; at: string }
  | { type: "saved/toggle"; slug: string; at: string }
  | { type: "compare/toggle"; slug: string; at: string }
  | { type: "compare/clear"; at: string }
  | { type: "stack/add"; slug: string; at: string }
  | { type: "stack/remove"; slug: string; at: string }
  | { type: "stack/reorder"; slugs: string[]; at: string }
  | { type: "tool/stage"; slug: string; stage: ShortlistStage; at: string }
  | { type: "tool/note"; slug: string; note: string | null; at: string }
  | { type: "tool/save-reason"; slug: string; saveReason: SaveReason | null; at: string }
  | { type: "tool/pin"; slug: string; pinned: boolean; at: string }
  | {
      type: "tool/decision";
      slug: string;
      outcome: WorkspaceDecisionOutcome | null;
      at: string;
      alternatives?: string[];
      compareObjective?: CompareObjective | null;
    }
  | { type: "tool/use-case"; slug: string; useCase: string | null; at: string }
  | { type: "tool/revisit"; slug: string; revisitAt: string | null; at: string }
  | {
      type: "tool/usage";
      slug: string;
      usage: WorkspaceUsage | null;
      at: string;
      replacedBy?: string | null;
    }
  | {
      type: "tool/compare-objective";
      slug: string;
      compareObjective: CompareObjective | null;
      at: string;
    }
  | {
      type: "stacks/create";
      id: string;
      name: string;
      description?: string | null;
      at: string;
    }
  | {
      type: "stacks/rename";
      id: string;
      name: string;
      description?: string | null;
      at: string;
    }
  | { type: "stacks/archive"; id: string; at: string }
  | { type: "stacks/unarchive"; id: string; at: string }
  | { type: "stacks/add"; id: string; slug: string; at: string }
  | { type: "stacks/remove"; id: string; slug: string; at: string }
  | { type: "stacks/reorder"; id: string; slugs: string[]; at: string }
  | { type: "workspace/clear"; at: string }
  | {
      type: "workspace/decide";
      slug: string;
      outcome: WorkspaceDecisionOutcome;
      at: string;
      eventId?: string;
      alternatives?: string[];
      compareObjective?: CompareObjective | null;
      useCase?: string | null;
      reason?: string | null;
      revisitAt?: string | null;
    }
  | {
      type: "workspace/revisited";
      slug: string;
      at: string;
      eventId?: string;
      revisitAt?: string | null;
    };

export type LegacyToolWorkspacePersistedState = {
  savedSlugs?: string[];
  compareSlugs?: string[];
  stackSlugs?: string[];
};
export type ToolUserState = {
  is_saved: boolean;
  shortlist_stage: ShortlistStage;
  note?: string;
  save_reason?: SaveReason | null;
  is_pinned?: boolean;
  updated_at?: string | null;
};

export type DiscoveryCompareState = {
  slugs: string[];
  updated_at?: string | null;
};

export type DiscoveryWorkspaceState = {
  tool_states: Record<string, ToolUserState>;
  compare: DiscoveryCompareState;
};
export type LegacyDiscoveryWorkspaceState = DiscoveryWorkspaceState;


export type DiscoveryPersistenceMode = "local" | "remote";
export type DiscoveryPersistencePhase =
  | "idle"
  | "loading"
  | "saving"
  | "synced"
  | "local-only"
  | "error";

export type DiscoveryPersistenceMeta = {
  mode: DiscoveryPersistenceMode;
  remote_available: boolean;
  viewer_kind?: ViewerKind;
  synced_at?: string | null;
  error?: string | null;
  revision?: string | null;
  conflict_retries?: number;
  recovery_required?: boolean;
};

export type DiscoveryPersistencePayload = {
  data: DiscoveryWorkspaceState;
  meta: DiscoveryPersistenceMeta;
};

export type WorkspacePersistencePayload = {
  data: WorkspaceStateV1;
  meta: DiscoveryPersistenceMeta;
};

export type WorkspaceSyncMutation = {
  state: WorkspaceStateV1;
  base_revision: string | null;
  operation_id: string;
};
