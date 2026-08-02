import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import type { ToolPublic } from "@/lib/types/tool-public";

export const completeToolPublicFixture = {
  schemaVersion: 1,
  slug: "atlas-ai",
  name: "Atlas AI",
  publication: {
    status: "published",
    publishedAt: "2026-07-10T09:30:00.000Z",
  },
  urls: {
    website: "https://atlas.example.com",
    affiliate: "https://atlas.example.com/?ref=tooolvibes",
    editorial: "https://tooolvibes.eu/toools/atlas-ai",
  },
  taxonomy: {
    canonicalCategory: "Assistente AI",
    sourceCategory: "Assistente AI",
    sourceCategoryLabel: "Assistente AI",
    tags: ["research", "assistant"],
  },
  content: {
    summary: "Assistente verificabile per ricerca e sintesi.",
    description: "Atlas raccoglie fonti e mantiene visibili i passaggi usati per la sintesi.",
    bestFor: "Ricerche brevi con fonti controllabili",
    useCases: ["Ricerca iniziale", "Sintesi con fonti"],
  },
  editorial: {
    evidence: [
      {
        kind: "review",
        text: "Le fonti restano leggibili durante la sintesi.",
        sourceField: "editorial_note",
      },
      {
        kind: "strength",
        text: "Buona tracciabilita delle fonti",
        sourceField: "strengths",
      },
    ],
  },
  score: {
    inputs: [
      { dimension: "ease_of_use", level: "solid" },
      { dimension: "editorial_conviction", level: "strong" },
    ],
    provenance: {
      kind: "editorial-assessment",
      sourceField: "editorial_scorecard",
      methodologyVersion: "legacy-editorial-scorecard-v1",
      assessedAt: "2026-07-11T10:00:00.000Z",
    },
  },
  attributes: {
    pricing: "Freemium",
    platforms: ["Web"],
    level: null,
    segments: ["research"],
  },
  media: {
    coverImageUrl: "https://images.example.com/atlas.webp",
  },
  flags: {
    featured: true,
  },
  lifecycle: {
    discoveredAt: "2026-07-01",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
  },
  provenance: {
    sourceKind: "tool-record",
    sourceId: "tool-atlas",
    sourceLabel: "Editorial CMS",
    adapterVersion: "tool-public-v1",
    missingFields: [],
  },
} satisfies ToolPublic;

export const partialToolPublicFixture = {
  schemaVersion: 1,
  slug: "partial-tool",
  name: "Partial Tool",
  publication: {
    status: "draft",
    publishedAt: null,
  },
  urls: {
    website: "https://partial.example.com",
    affiliate: null,
    editorial: null,
  },
  taxonomy: {
    canonicalCategory: null,
    sourceCategory: "Legacy category",
    sourceCategoryLabel: "Legacy category",
    tags: [],
  },
  content: {
    summary: "Record minimo ma esplicito.",
    description: "I campi non disponibili restano null o liste vuote e sono tracciati.",
    bestFor: null,
    useCases: [],
  },
  editorial: {
    evidence: [],
  },
  score: null,
  attributes: {
    pricing: null,
    platforms: [],
    level: null,
    segments: [],
  },
  media: {
    coverImageUrl: null,
  },
  flags: {
    featured: false,
  },
  lifecycle: {
    discoveredAt: null,
    createdAt: null,
    updatedAt: null,
  },
  provenance: {
    sourceKind: "directory-tool",
    sourceId: "partial-source-id",
    sourceLabel: null,
    adapterVersion: "tool-public-v1",
    missingFields: ["score", "taxonomy.canonicalCategory"],
  },
} satisfies ToolPublic;

export const invalidToolPublicFixture: unknown = {
  ...completeToolPublicFixture,
  slug: "Invalid Slug",
  urls: {
    ...completeToolPublicFixture.urls,
    website: "javascript:alert(1)",
  },
};

export const publishedToolRecordFixture: ToolRecord = {
  id: "record-atlas",
  name: "Atlas AI",
  slug: "atlas-ai",
  category: "Assistente AI",
  tags: ["research", "assistant"],
  short_description_it: "Assistente verificabile per ricerca e sintesi.",
  description_it: "Atlas raccoglie fonti e mantiene visibili i passaggi usati per la sintesi.",
  website_url: "https://atlas.example.com",
  tooolvibes_post_url: "https://tooolvibes.eu/toools/atlas-ai",
  affiliate_url: "https://atlas.example.com/?ref=tooolvibes",
  cover_image_url: "https://images.example.com/atlas.webp",
  source: "Editorial CMS",
  date_discovered: "2026-07-01",
  is_featured: true,
  is_published: true,
  editorial_state: "In evidenza",
  pricing: "Freemium",
  platforms: ["Web"],
  best_for: "Ricerche brevi con fonti controllabili",
  editorial_note: "Le fonti restano leggibili durante la sintesi.",
  why_here: "Riduce la distanza tra risposta e verifica.",
  use_cases: ["Ricerca iniziale", "Sintesi con fonti"],
  strengths: ["Buona tracciabilita delle fonti"],
  cautions: ["Verificare sempre la fonte primaria"],
  editorial_scorecard: {
    ease_of_use: "solid",
    editorial_conviction: "strong",
  },
  created_at: "2026-07-01T08:00:00.000Z",
  updated_at: "2026-07-11T10:00:00.000Z",
};

export const draftToolRecordFixture: ToolRecord = {
  ...publishedToolRecordFixture,
  id: "record-draft",
  slug: "draft-tool",
  name: "Draft Tool",
  is_featured: false,
  is_published: false,
  affiliate_url: null,
  tooolvibes_post_url: "",
  cover_image_url: "",
  source: "",
  pricing: undefined,
  platforms: undefined,
  best_for: undefined,
  editorial_note: undefined,
  why_here: undefined,
  use_cases: undefined,
  strengths: undefined,
  cautions: undefined,
  editorial_scorecard: undefined,
};

export const directoryToolFixture: DirectoryTool = {
  id: "directory-blink",
  name: "Blink",
  slug: "blink",
  category: "Vibe Coding",
  categoryLabel: "Vibe coding / builder app AI",
  level: "featured",
  levelLabel: "Segnalato",
  segments: ["vibe-coding", "ai-app-builder"],
  shortDescription: "Builder AI per trasformare un prompt in un prototipo navigabile.",
  description: "Alias legacy che l'adapter non deve usare.",
  longDescription: "Blink costruisce interfaccia e logica iniziale per validare un prodotto.",
  whyItMatters: "Riduce il tempo tra idea e primo test reale.",
  tldr: "Alias legacy che l'adapter non deve usare.",
  whatItDoes: "Alias legacy che l'adapter non deve usare.",
  idealUseCase: "Validare un MVP in poche ore",
  editorialReview: "Utile quando conta arrivare rapidamente a un test credibile.",
  externalUrl: "https://blink.example.com",
  affiliateUrl: "https://blink.example.com/?ref=tooolvibes",
  url: "https://legacy-derived.example.com",
  originalSourceUrl: "https://tooolvibes.eu/toools/blink",
  originalArticleUrl: "https://legacy-article-alias.example.com",
  fallbackUrl: "https://legacy-fallback.example.com",
  featured: true,
  toolOfWeek: true,
  tags: ["vibe coding", "prototype"],
  ctaLabel: "Prova Blink",
  publishedAt: "2026-02-05",
  readingTime: "2 min",
  domain: "blink.example.com",
  sourceSite: "tooolvibes.com",
  useCases: ["Validare un MVP", "Mostrare un concept navigabile"],
  highlights: ["Prompt to app", "MVP rapido"],
  accentFrom: "#6d3bff",
  accentTo: "#43c6ff",
};
