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

/**
 * Editorial status of a tool inside a Collection.
 *
 * - core:        the actual stack. Required for the workflow to make sense.
 * - optional:    useful only under specific conditions. Add later.
 * - alternative: replaces a core tool rather than complementing it.
 *
 * Rules:
 *   1. Never present more than one core at the same stage.
 *   2. Alternatives must not stack on top of cores as paid subscriptions.
 *   3. Optional tools may appear without their cores being present.
 */
export type CollectionToolStatus = "core" | "optional" | "alternative";

export type CollectionToolLearningCurve = "low" | "medium" | "high";

export type CollectionToolPricingRelevance =
  | "free"
  | "freemium"
  | "paid"
  | "usage"
  | "quote";

export type CollectionToolSlot = {
  tool_slug: string;
  role: string;
  note?: string;
  featured?: boolean;
  order?: number;

  // ===== Editorial decision intelligence (V2) =====
  // All fields below are optional and forward-compatible.
  // Existing V1 records keep working without them.

  /** Optional stage label (e.g. "Ricerca", "Build", "Distribuzione"). */
  stage?: string;

  /** Stack role: core | optional | alternative. */
  status?: CollectionToolStatus;

  /** One-sentence deeper "why this tool, here" — beyond the role. */
  why_chosen?: string;

  /** What enters the tool. */
  input?: string;

  /** What leaves the tool. */
  output?: string;

  /** Where the output goes next (manual or direct). */
  next_handoff?: string;

  /** Approximate learning curve. */
  learning_curve?: CollectionToolLearningCurve;

  /** Pricing model relevance for this stack role. */
  pricing_relevance?: CollectionToolPricingRelevance;

  /** Honest limit of the tool in this role. */
  limitations?: string;

  /** When the user should skip this tool entirely. */
  when_to_skip?: string;

  /** Signals that the user should replace this tool. */
  replacement_trigger?: string;

  /** Tool slugs (catalog) that can replace this tool in the same role. */
  alternatives?: string[];

  /** Guide slug (not tool slug) that provides deeper education for this tool. */
  relevant_guide_slug?: string;

  /** Direct integration exists with another tool in the same collection. */
  direct_integration_with?: string[];

  /** Handoff to the next tool is manual (copy-paste / export). */
  manual_handoff?: boolean;
};

export type CollectionStackVariant = {
  /** Variant label: lean | balanced | advanced. */
  label: "lean" | "balanced" | "advanced";
  /** Short editorial description of the variant. */
  description: string;
  /** Tool slugs that compose this variant. */
  core_tool_slugs: string[];
  /** What the user gains by moving up to this variant. */
  gains?: string[];
  /** What the user gives up by moving down from the higher variant. */
  trade_offs?: string[];
};

export type CollectionStackMeta = {
  /** Short promise in one line (UI subtitle candidate). */
  concise_promise?: string;
  /** Job to be done by this collection. */
  job_to_be_done?: string;
  /** Stage of the user/company this collection targets. */
  user_stage?: string;
  /** Last verified against public sources (ISO date). */
  last_verified?: string;
  /** Related guide slugs (article storage slugs, NOT tool slugs). */
  related_guide_slugs?: string[];
  /** Explicit related Collection slugs (graph edges). */
  related_collection_slugs?: string[];
  /** Estimated setup time (free-form: "< 1 hour", "Half a day"). */
  setup_time?: string;
  /** Indicative recurring cost band: "€0", "€0-30", "€30-100", "€100-300", "€300+" */
  monthly_cost_band?: "€0" | "€0-30" | "€30-100" | "€100-300" | "€300+" | "pricing-requires-quote";
  /** Indicative difficulty — UI label candidates. */
  difficulty_label?: string;
};

export type CollectionDecisionIntelligence = {
  /** Strongest component of this stack (tool slug or stage name). */
  strongest?: string;
  /** Weakest component of this stack (tool slug or stage name). */
  weakest?: string;
  /** Where the stack becomes fragile. */
  fragility?: string;
  /** Vendor lock-in or open stack statement. */
  vendor_lock_in?: string;
  /** Notes on data/privacy implications. */
  data_privacy?: string;
  /** When this stack stops scaling. */
  scalability?: string;
};

export type CollectionScenario = {
  title: string;
  body: string;
};

export type CollectionAntiRecommendation = {
  /** When this Collection is NOT the right answer. */
  not_for: string;
  /** What to look at instead (other Collection slugs, or null). */
  look_instead_at?: string[];
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

  // ===== Editorial decision intelligence (V2) =====
  // All fields below are optional and forward-compatible.
  // V1 records without them still work.

  /** Editorial identity, job, audience stage, verification date. */
  stack_meta?: CollectionStackMeta;

  /** Stack variants — only when the editorial model genuinely supports them. */
  stack_variants?: CollectionStackVariant[];

  /** Decision intelligence block. */
  decision_intelligence?: CollectionDecisionIntelligence;

  /** Explicit anti-recommendation: when this Collection is the wrong answer. */
  anti_recommendation?: CollectionAntiRecommendation;

  /** At least one realistic (hypothetical but credible) workflow example. */
  scenario?: CollectionScenario;
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
  // ===== Phase 4 visual identity (additive, optional) =====
  // Populated by toCollectionTool from the canonical directory tool.
  // Used by CollectionCardV4 to render the tool glyph with the real
  // brand gradient and favicon source, matching the rest of TooolVibes.
  // Backward compatible: when source is not directory, these stay
  // undefined and the card falls back to a deterministic gradient.
  accentFrom?: string;
  accentTo?: string;
  domain?: string;
  externalUrl?: string;
};

export type ResolvedCollectionToolSlot = CollectionToolSlot & {
  order: number;
  tool: CollectionTool;
  // Normalized editorial flags (derived, not stored) — see lib/collections/editorial.ts.
  is_core: boolean;
  is_alternative: boolean;
  is_optional: boolean;
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
