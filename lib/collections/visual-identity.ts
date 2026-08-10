/**
 * PHASE 4 — Visual identity map.
 *
 * Every Collection is assigned:
 *   1. an editorial accent (one of 4) used as a subtle typographic signal
 *   2. a shape hint that controls how its stack diagram is composed
 *
 * The accent is shared across the 12 Collections (4 accents, 12 slugs),
 * so the system stays coherent. The shape is per-Collection and only
 * describes how to render the stack — there are no per-Collection
 * illustrations or layouts beyond the shape.
 *
 * Mobile-first: every visual treatment here is intended to look correct
 * at 360/390/430 first, then adapt upward to 768/820/1280/1440/1536.
 *
 * No component in Phase 4 references this file yet. It is the
 * canonical identity source for Steps 2, 3 and 6.
 */

export type CxAccent = "indigo" | "violet" | "teal" | "amber";

/**
 * Shape of the stack diagram.
 *
 *   linear    — N sequential stages, vertical line of dots
 *   branching — CORE spine + ALTERNATIVE branches off the side
 *   hub       — 1 central tool with spokes (e.g. agency ops)
 *   single    — 1 CORE tool, no real workflow
 *   course    — linear with a "lesson" cadence, distinct stage labels
 *   funnel    — N stages that converge to a single deliverable
 *   spoke     — 1 central identity tool with many satellite tools
 */
export type CxShape =
  | "linear"
  | "branching"
  | "hub"
  | "single"
  | "course"
  | "funnel"
  | "spoke";

export type CxVisualIdentity = {
  /** Editorial accent, 1 of 4. */
  accent: CxAccent;
  /** Stack diagram shape, controls composition not illustration. */
  shape: CxShape;
  /** Group label used by the index composition (Step 6). */
  group: "build" | "create" | "operate" | "grow";
  /** Whether this Collection should be featured in the index. */
  featured: boolean;
};

/**
 * Canonical identity for every Collection in the system.
 *
 * Includes the 4 new Collections that will be added in Step 5,
 * so the map is the single source of truth for the visual system.
 */
export const collectionVisualIdentity: Record<string, CxVisualIdentity> = {
  // ----- BUILD (indigo) -----
  "ai-stack-solo-founders": { accent: "indigo", shape: "linear", group: "build", featured: true },
  "design-sprint-essentials": { accent: "indigo", shape: "hub", group: "build", featured: false },
  "from-mvp-to-sellable-saas": { accent: "indigo", shape: "linear", group: "build", featured: true },

  // ----- CREATE (violet) -----
  "creator-video-stack": { accent: "violet", shape: "linear", group: "create", featured: true },
  "ai-content-marketing-stack": { accent: "violet", shape: "linear", group: "create", featured: false },
  "personal-brand-linkedin-stack": { accent: "violet", shape: "spoke", group: "create", featured: false },
  "ai-video-training-stack": { accent: "violet", shape: "course", group: "create", featured: false },

  // ----- OPERATE (teal) -----
  "ai-customer-support-stack": { accent: "teal", shape: "branching", group: "operate", featured: false },
  "ai-agents-automation-stack": { accent: "teal", shape: "branching", group: "operate", featured: true },
  "agency-operating-stack": { accent: "teal", shape: "hub", group: "operate", featured: false },

  // ----- GROW (amber) -----
  "free-budget-ai-stack": { accent: "amber", shape: "linear", group: "grow", featured: false },
  "lead-generation-stack": { accent: "amber", shape: "funnel", group: "grow", featured: false },
};

/**
 * Editorial group order used by the index composition (Step 6).
 * Keeps taxonomy simple: Build → Create → Operate → Grow.
 */
export const cxGroupOrder: ReadonlyArray<CxVisualIdentity["group"]> = [
  "build",
  "create",
  "operate",
  "grow",
] as const;

export const cxGroupLabel: Record<CxVisualIdentity["group"], string> = {
  build: "Costruisci",
  create: "Crea",
  operate: "Gestisci",
  grow: "Cresci",
};

/** Get the visual identity for a Collection, with a safe fallback. */
export function getCollectionVisualIdentity(
  slug: string,
): CxVisualIdentity | null {
  return collectionVisualIdentity[slug] ?? null;
}

/**
 * Deterministically pick the lead (featured) Collection.
 *
 * Priority:
 *   1. First Collection whose visual identity has `featured: true`
 *   2. Fallback: first by editorial_order, then by updated_at (desc)
 *
 * Never depends on `collections[0]` being the lead — explicit by
 * `featured` flag from this same module.
 */
export function pickFeaturedCollection<
  T extends { slug: string; editorial_order?: number | null; updated_at: string },
>(collections: T[]): T | null {
  if (collections.length === 0) return null;

  const lead = collections.find(
    (c) => collectionVisualIdentity[c.slug]?.featured === true,
  );
  if (lead) return lead;

  return [...collections].sort((left, right) => {
    const l = left.editorial_order ?? 999;
    const r = right.editorial_order ?? 999;
    if (l !== r) return l - r;
    return right.updated_at.localeCompare(left.updated_at);
  })[0];
}

/** Hard guarantee: a Collection slug always resolves to an identity
 *  (the system never renders a Collections page without one). */
export function requireCollectionVisualIdentity(slug: string): CxVisualIdentity {
  const identity = collectionVisualIdentity[slug];
  if (!identity) {
    throw new Error(
      `[visual-identity] Missing visual identity for Collection slug "${slug}". ` +
        `Add an entry to collectionVisualIdentity in lib/collections/visual-identity.ts.`,
    );
  }
  return identity;
}
