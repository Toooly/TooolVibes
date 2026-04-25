import type { SaveReason, ShortlistStage } from "@/lib/types/tool";

export type ViewerKind = "guest" | "account";

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
};

export type DiscoveryPersistencePayload = {
  data: DiscoveryWorkspaceState;
  meta: DiscoveryPersistenceMeta;
};
