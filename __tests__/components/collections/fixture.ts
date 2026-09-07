import type { CuratedCollection, ResolvedCollectionToolSlot } from "@/lib/types/collection";

function toolSlot(
  slug: string,
  name: string,
  order: number,
  extra: Partial<ResolvedCollectionToolSlot> = {},
): ResolvedCollectionToolSlot {
  return {
    tool_slug: slug,
    role: "Ruolo",
    order,
    is_core: true,
    is_alternative: false,
    is_optional: false,
    status: "core",
    tool: {
      id: slug,
      name,
      slug,
      category: "research",
      short_description_it: "Descrizione",
      website_url: "https://example.com",
      affiliate_url: null,
    },
    ...extra,
  };
}

export function makeCollection(
  overrides: Partial<CuratedCollection> = {},
): CuratedCollection {
  const included_tools = overrides.included_tools ?? [
    toolSlot("jenni-ai", "Jenni", 1),
    toolSlot("v0", "v0", 2),
  ];

  return {
    id: "collection-01",
    title: "Kit AI per founder solo",
    slug: "ai-stack-solo-founders",
    description: "Stack per chiudere il primo prodotto.",
    cover_image_url: "https://example.com/cover.jpg",
    cover_kicker: "Kit essenziale",
    rationale: "Sequenza corta per partire.",
    highlights: ["Partenza rapida"],
    theme: "founder-stack",
    audience: "Solo founders",
    difficulty: "starter",
    tone: "starter-stack",
    access: "open",
    editorial_state: "featured",
    surface: "collection",
    editorial_order: 10,
    included_tools,
    created_at: "2026-03-14T09:00:00.000Z",
    updated_at: "2026-03-16T09:00:00.000Z",
    published_at: "2026-03-16T09:00:00.000Z",
    tool_count: included_tools.length,
    remaining_slots: [],
    is_featured: true,
    is_public: true,
    source_kind: "content",
    stack_meta: {
      concise_promise: "Dall'idea al primo prodotto vendibile",
      job_to_be_done: "Chiudere un MVP senza disperdere gli strumenti",
      user_stage: "Pre-seed",
      monthly_cost_band: "€0-30",
      setup_time: "< 1 ora",
      last_verified: "2026-08-12",
    },
    ...overrides,
  };
}

export function makeSecondaryCollection(): CuratedCollection {
  return makeCollection({
    id: "collection-02",
    title: "Essenziali per design sprint",
    slug: "design-sprint-essentials",
    description: "Sprint corto.",
    theme: "design-sprint",
    audience: "Designer-builders",
    editorial_state: "published",
    is_featured: false,
    editorial_order: 20,
  });
}
