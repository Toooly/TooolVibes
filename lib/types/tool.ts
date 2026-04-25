export type ToolCategory =
  | "Assistente AI"
  | "Design"
  | "Developer"
  | "Marketing"
  | "Produttivita"
  | "Video"
  | "Writing";

export type ToolEditorialState =
  | "In evidenza"
  | "Nuovo in archivio"
  | "Da tenere d'occhio"
  | "Selezione core";

export type ToolPricing = "Free" | "Freemium" | "Paid" | "Enterprise";
export type ShortlistStage = "saved" | "review" | "top";
export type EditorialScoreDimension =
  | "ease_of_use"
  | "versatility"
  | "polish"
  | "workflow_fit"
  | "experimentation_value"
  | "editorial_conviction";
export type EditorialScoreLevel = "measured" | "solid" | "strong";
export type ToolEditorialScorecard = Partial<Record<EditorialScoreDimension, EditorialScoreLevel>>;
export type SaveReason =
  | "test"
  | "compare"
  | "design-fit"
  | "marketing-fit"
  | "client-project"
  | "observe";

export type ToolDecisionMemory = {
  note?: string;
  save_reason?: SaveReason | null;
  is_pinned?: boolean;
  updated_at?: string | null;
};

export type ToolRecord = {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  tags: string[];
  short_description_it: string;
  description_it: string;
  website_url: string;
  tooolvibes_post_url: string;
  cover_image_url: string;
  source: string;
  date_discovered: string;
  is_featured: boolean;
  is_published: boolean;
  editorial_state?: ToolEditorialState;
  pricing?: ToolPricing;
  platforms?: string[];
  best_for?: string;
  editorial_note?: string;
  why_here?: string;
  use_cases?: string[];
  strengths?: string[];
  cautions?: string[];
  editorial_scorecard?: ToolEditorialScorecard;
  created_at: string;
  updated_at: string;
};

export type ToolPreview = Pick<
  ToolRecord,
  | "id"
  | "name"
  | "slug"
  | "category"
  | "tags"
  | "short_description_it"
  | "cover_image_url"
  | "website_url"
  | "tooolvibes_post_url"
  | "is_featured"
  | "date_discovered"
>;
