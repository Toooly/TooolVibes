import type { ToolPricing } from "@/lib/types/tool";

export type CollectionTheme =
  | "founder-stack"
  | "design-sprint"
  | "creator-video"
  | "research-synthesis"
  | "indie-launch";

export type CollectionAudience =
  | "Solo founders"
  | "Designer-builders"
  | "Creator teams"
  | "Research-led teams"
  | "Indie launchers";

export type CollectionDifficulty = "starter" | "growing" | "advanced";
export type CollectionTone =
  | "starter-stack"
  | "focused-bundle"
  | "editorial-picks"
  | "special-issue";
export type CollectionAccess = "open" | "premium-preview" | "premium";
export type PremiumEntitlementStatus = "guest" | "account" | "member";
export type PremiumEntitlementTier = "free" | "member";
export type PremiumSurfaceState = "open" | "preview" | "locked" | "unlocked";
export type CollectionEditorialState =
  | "draft"
  | "scheduled"
  | "published"
  | "featured"
  | "archived";
export type CollectionSurface = "collection" | "special-issue";
export type CollectionFeaturedSlot =
  | "home-hero"
  | "home-secondary"
  | "archive-strip"
  | "special-issue";
export type CollectionSourceKind = "mock" | "content" | "supabase";
export type CollectionSourceMode = "auto" | CollectionSourceKind;
export type CollectionRepositoryResolutionMode = "single-source" | "merged-precedence";
export type CollectionSourceTransitionStatus =
  | "pending-import"
  | "imported"
  | "conflict"
  | "remote-only"
  | "content-only";
export type CollectionConflictReviewState =
  | "unreviewed"
  | "reviewed"
  | "dismissed";
export type CollectionConflictSeverity =
  | "clean"
  | "pending"
  | "minor-drift"
  | "critical-conflict";
export type CollectionReadinessState = "ready" | "review" | "blocked";
export type CollectionSyncPreviewState =
  | "safe-align-ready"
  | "needs-editorial-decision";
export type CollectionSyncPreviewRisk = "low" | "medium" | "high";
export type CollectionSyncPreviewChangeKind = "safe" | "editorial";
export type CollectionSyncPreviewTarget = "supabase";
export type CollectionSafeAlignableField = "editorial_order" | "featured_slot";

export type CollectionToolSlot = {
  tool_slug: string;
  role: string;
  note?: string;
  featured?: boolean;
  order?: number;
};

export type AdvancedSpecialIssueToolMoment = {
  tool_slug: string;
  label: string;
  note: string;
  emphasis?: "anchor" | "support" | "watch";
};

export type AdvancedSpecialIssueWorkflowStep = {
  title: string;
  body: string;
  tool_slug?: string;
  outcome?: string;
};

export type AdvancedSpecialIssueCompareInsight = {
  compared_tool_slugs: string[];
  insight: string;
  differentiators: string[];
  recommendation: string;
};

export type AdvancedSpecialIssueBlock =
  | {
      id: string;
      type: "opening-note";
      eyebrow: string;
      title: string;
      body: string;
    }
  | {
      id: string;
      type: "thesis";
      eyebrow: string;
      title: string;
      statement: string;
      points: string[];
    }
  | {
      id: string;
      type: "curated-picks";
      eyebrow: string;
      title: string;
      body: string;
      tool_moments: AdvancedSpecialIssueToolMoment[];
    }
  | {
      id: string;
      type: "compare-insight";
      eyebrow: string;
      title: string;
      body: string;
      compare: AdvancedSpecialIssueCompareInsight;
    }
  | {
      id: string;
      type: "workflow";
      eyebrow: string;
      title: string;
      body: string;
      steps: AdvancedSpecialIssueWorkflowStep[];
    }
  | {
      id: string;
      type: "why-this-matters";
      eyebrow: string;
      title: string;
      body: string;
      points: string[];
    }
  | {
      id: string;
      type: "editorial-takeaway";
      eyebrow: string;
      title: string;
      body: string;
      takeaways: string[];
    }
  | {
      id: string;
      type: "premium-closing";
      eyebrow: string;
      title: string;
      body: string;
      member_note: string;
    };

export type AdvancedSpecialIssueFormat = {
  format: "advanced-special-issue";
  reading_flow: string;
  intro: string;
  thesis: string;
  takeaways: string[];
  blocks: AdvancedSpecialIssueBlock[];
};

export type CuratedCollectionRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string;
  cover_kicker: string;
  rationale: string;
  highlights: string[];
  premium_teaser?: string;
  theme: CollectionTheme;
  audience: CollectionAudience;
  difficulty: CollectionDifficulty;
  tone: CollectionTone;
  access: CollectionAccess;
  editorial_state: CollectionEditorialState;
  surface: CollectionSurface;
  featured_slot?: CollectionFeaturedSlot | null;
  editorial_order?: number | null;
  included_tools: CollectionToolSlot[];
  advanced_issue?: AdvancedSpecialIssueFormat;
  created_at: string;
  updated_at: string;
  scheduled_for?: string | null;
  first_published_at?: string | null;
  published_at?: string | null;
  archived_at?: string | null;
  source_kind?: CollectionSourceKind;
};

export type CollectionTool = {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description_it: string;
  website_url: string;
  affiliate_url: string | null;
  pricing?: ToolPricing;
  why_here?: string;
};

export type ResolvedCollectionToolSlot = CollectionToolSlot & {
  order: number;
  tool: CollectionTool;
};

export type CuratedCollection = Omit<CuratedCollectionRecord, "included_tools"> & {
  included_tools: ResolvedCollectionToolSlot[];
  tool_count: number;
  featured_tool_slot?: ResolvedCollectionToolSlot | null;
  remaining_slots: ResolvedCollectionToolSlot[];
  is_featured: boolean;
  is_public: boolean;
  source_kind: CollectionSourceKind;
};

export type CollectionValidationIssue = {
  level: "warning" | "error";
  message: string;
};

export type CollectionTransitionDiff = {
  editorial_state: boolean;
  editorial_order: boolean;
  featured_slot: boolean;
  surface: boolean;
  metadata: boolean;
  included_tools: boolean;
};

export type CollectionTransitionReviewRecord = {
  slug: string;
  review_state: CollectionConflictReviewState;
  note?: string | null;
  updated_at: string;
  reviewed_at?: string | null;
};

export type CollectionTransitionEntry = {
  slug: string;
  title: string;
  mock: CuratedCollectionRecord | null;
  content: CuratedCollectionRecord | null;
  supabase: CuratedCollectionRecord | null;
  public_source: CollectionSourceKind | null;
  import_status: CollectionSourceTransitionStatus;
  warnings: string[];
  diff: CollectionTransitionDiff;
  review?: CollectionTransitionReviewRecord | null;
};

export type CollectionTransitionDiffItem = {
  key:
    | "editorial_state"
    | "editorial_order"
    | "featured_slot"
    | "surface"
    | "metadata"
    | "included_tools";
  label: string;
  severity: "minor" | "critical";
  mock_value: string;
  supabase_value: string;
  winner_value: string;
};

export type CollectionSyncPreviewFieldChange = {
  key: CollectionTransitionDiffItem["key"];
  label: string;
  kind: CollectionSyncPreviewChangeKind;
  risk: CollectionSyncPreviewRisk;
  current_value: string;
  legacy_value: string;
  target_value: string;
  summary: string;
};

export type CollectionSyncPreviewSlotChange = {
  key:
    | "added"
    | "removed"
    | "reordered"
    | "role"
    | "note"
    | "anchor";
  label: string;
  tool_slug: string;
  risk: CollectionSyncPreviewRisk;
  current_value: string;
  legacy_value: string;
  summary: string;
};

export type CollectionSyncPreview = {
  slug: string;
  title: string;
  state: CollectionSyncPreviewState;
  risk: CollectionSyncPreviewRisk;
  public_winner: CollectionSourceKind | null;
  legacy_source: Extract<CollectionSourceKind, "mock">;
  target: CollectionSyncPreviewTarget;
  summary: string;
  notes: string[];
  field_changes: CollectionSyncPreviewFieldChange[];
  slot_changes: CollectionSyncPreviewSlotChange[];
  safe_change_count: number;
  editorial_change_count: number;
  can_safe_align_fields: boolean;
};

export type CollectionSafeAlignChange = {
  field: CollectionSafeAlignableField;
  current_value: string;
  next_value: string;
};

export type CollectionSafeAlignEventRecord = {
  slug: string;
  collection_id: string;
  source_from: Extract<CollectionSourceKind, "mock">;
  source_to: Extract<CollectionSourceKind, "supabase">;
  aligned_fields: CollectionSafeAlignableField[];
  applied_at: string;
};

export type CollectionReadinessCheck = {
  label: string;
  state: "pass" | "warning" | "error";
  detail: string;
};

export type CollectionReadinessSummary = {
  state: CollectionReadinessState;
  label: string;
  summary: string;
  checks: CollectionReadinessCheck[];
};

export type CollectionTransitionSummary = {
  mock_total: number;
  content_total: number;
  supabase_total: number;
  pending_import: number;
  imported: number;
  conflicts: number;
  remote_only: number;
  content_only: number;
  public_total: number;
};

export type CollectionTransitionReport = {
  entries: CollectionTransitionEntry[];
  summary: CollectionTransitionSummary;
  source_precedence: CollectionSourceKind[];
};

export type CollectionRepositoryMeta = {
  requested_source: CollectionSourceMode;
  active_source: CollectionSourceKind;
  fallback_source?: CollectionSourceKind | null;
  warnings: string[];
  loaded_at: string;
  resolution_mode?: CollectionRepositoryResolutionMode;
  composed_sources?: CollectionSourceKind[];
  source_precedence?: CollectionSourceKind[];
};

export type CollectionRepositorySnapshot = {
  collections: CuratedCollectionRecord[];
  meta: CollectionRepositoryMeta;
  validation: Record<string, CollectionValidationIssue[]>;
};
