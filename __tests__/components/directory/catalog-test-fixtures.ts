import type { ToolPublicView } from "@/lib/data/tool-public-view";

/* Shared minimal ToolPublicView fixtures for B25 catalog decomposition tests. */

export function makeCatalogTool(
  overrides: Partial<ToolPublicView> & { slug: string },
): ToolPublicView {
  const { slug, ...rest } = overrides;
  return {
    publicTool: null,
    presentationKind: "directory",
    id: slug,
    slug,
    name: slug,
    category: "misc",
    categoryLabel: "Misc",
    level: null,
    levelLabel: null,
    segments: [],
    filterGroups: [],
    shortDescription: "",
    description: "",
    longDescription: "",
    whyItMatters: null,
    tldr: "",
    whatItDoes: "",
    idealUseCase: null,
    editorialReview: null,
    externalUrl: "https://example.com",
    affiliateUrl: null,
    url: "https://example.com",
    originalSourceUrl: null,
    originalArticleUrl: null,
    featured: false,
    toolOfWeek: false,
    tags: [],
    ctaLabel: null,
    publishedAt: null,
    readingTime: null,
    domain: "example.com",
    sourceSite: null,
    useCases: [],
    highlights: [],
    cautions: [],
    accentFrom: null,
    accentTo: null,
    ...rest,
  } as unknown as ToolPublicView;
}

export const CATALOG_FILTER_GROUPS = [
  { key: "all", label: "Tutti" },
  { key: "vibe-coding", label: "Vibe coding" },
  { key: "no-code", label: "No-code" },
  { key: "marketing", label: "Marketing" },
];

export function makeCatalogTools(): ToolPublicView[] {
  return [
    makeCatalogTool({
      slug: "alpha",
      name: "Alpha",
      categoryLabel: "Vibe coding",
      level: "beginner",
      levelLabel: "Base",
      segments: ["vibe-coding"],
      filterGroups: ["vibe-coding"],
      tags: ["react", "starter"],
      shortDescription: "Tool alpha per prototipi",
      longDescription: "Alpha aiuta a costruire prototipi rapidi",
      url: "https://alpha.example.com",
    }),
    makeCatalogTool({
      slug: "beta",
      name: "Beta",
      categoryLabel: "Vibe coding",
      level: "expert",
      levelLabel: "Avanzato",
      segments: ["vibe-coding"],
      filterGroups: ["vibe-coding"],
      tags: ["react"],
      shortDescription: "Tool beta avanzato",
      longDescription: "Beta per utenti esperti",
      url: "https://beta.example.com",
    }),
    makeCatalogTool({
      slug: "gamma",
      name: "Gamma",
      categoryLabel: "No-code",
      level: "beginner",
      levelLabel: "Base",
      segments: ["no-code"],
      filterGroups: ["no-code"],
      tags: ["automation"],
      shortDescription: "Tool gamma no-code",
      longDescription: "Gamma senza codice",
      url: "https://gamma.example.com",
    }),
    makeCatalogTool({
      slug: "delta",
      name: "Delta",
      categoryLabel: "Marketing",
      level: "featured",
      levelLabel: "In evidenza",
      segments: ["marketing"],
      filterGroups: ["marketing"],
      tags: ["seo"],
      shortDescription: "Tool delta marketing",
      longDescription: "Delta per campagne marketing",
      url: "https://delta.example.com",
    }),
  ];
}
