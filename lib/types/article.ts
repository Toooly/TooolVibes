export type EditorialPostKind = "tool-writeup" | "guide";

export type EditorialPostRecord = {
  slug: string;
  title: string;
  dek: string;
  summary: string;
  kind: EditorialPostKind;
  published_at: string;
  updated_at: string;
  source_label: string;
  source_url: string;
  tool_slug?: string;
  related_collection_slugs?: string[];
  featured?: boolean;
  highlights: string[];
  details: string[];
  cautions: string[];
};
