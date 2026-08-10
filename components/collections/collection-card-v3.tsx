import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionAreaLabel,
  getCollectionCoreSlots,
  getCollectionCostLabel,
  getCollectionSetupLabel,
} from "@/lib/collections/helpers";
import {
  cxGroupLabel,
  getCollectionVisualIdentity,
} from "@/lib/collections/visual-identity";

type CollectionCardV3Props = {
  collection: CuratedCollection;
  /** Featured / lead variant. Larger, more breathing room, accent hairline. */
  featured?: boolean;
  /** Maximum number of CORE tools shown in the micro-stack preview. */
  maxStackPreview?: number;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Build the single composite signal line.
 * Format: "X core · COSTO · SETUP"
 * Returns null when nothing meaningful is available.
 */
function buildCompositeSignal(
  collection: CuratedCollection,
  coreCount: number,
): string | null {
  const cost = getCollectionCostLabel(collection);
  const setup = getCollectionSetupLabel(collection);
  const coreLabel = coreCount === 1 ? "1 core" : `${coreCount} core`;

  const parts: string[] = [coreLabel];
  if (cost) parts.push(cost);
  if (setup) parts.push(setup);

  if (parts.length === 1) return null;
  return parts.join(" · ");
}

/**
 * Collection Card V3 — Phase 4 visual system.
 *
 * Pure typography + spacing. No illustrations, no chip clouds, no
 * dashboard-style metadata grid. The four editorial accents
 * (indigo/violet/teal/amber) appear only as: kicker color, hairline,
 * CORE step number, focus/hover state. Never as card background.
 *
 * Hierarchy (top to bottom):
 *   1. micro-kicker (group · area)         — accent, small, uppercase
 *   2. title                                — display font, large
 *   3. concise promise                      — secondary ink
 *   4. micro stack preview (CORE, vertical) — small numbered list
 *   5. ONE composite signal line            — "3 core · €0–30/mese · 1-2 sett."
 *   6. CTA "Apri la raccolta →"             — primary ink, accent on hover
 *
 * Mobile-first. The featured variant is structurally richer, not just
 * a scaled-up standard.
 */
export function CollectionCardV3({
  collection,
  featured = false,
  maxStackPreview,
}: CollectionCardV3Props) {
  const identity = getCollectionVisualIdentity(collection.slug);
  const accent = identity?.accent ?? "indigo";
  const group = identity?.group ?? null;
  const groupLabel = group ? cxGroupLabel[group] : null;
  const areaLabel = getCollectionAreaLabel(collection);

  const coreSlots = getCollectionCoreSlots(collection);
  const coreCount = coreSlots.length;
  const previewLimit = maxStackPreview ?? (featured ? 5 : 3);
  const visibleCores = coreSlots.slice(0, previewLimit);
  const hiddenCoresCount = Math.max(0, coreSlots.length - visibleCores.length);

  const signal = buildCompositeSignal(collection, coreCount);

  return (
    <article
      data-cx-accent={accent}
      className={cx("cx-card-v3", featured && "cx-card-v3--featured")}
      data-featured={featured ? "true" : undefined}
    >
      <div className="cx-card-v3__head">
        {groupLabel && (
          <span className="cx-card-v3__group">{groupLabel.toUpperCase()}</span>
        )}
        {featured && areaLabel && (
          <>
            <span className="cx-card-v3__head-sep" aria-hidden="true">
              ·
            </span>
            <span className="cx-card-v3__area">{areaLabel}</span>
          </>
        )}
      </div>

      <h3 className="cx-card-v3__title">
        <Link
          href={`/collections/${collection.slug}`}
          className="cx-card-v3__title-link"
        >
          {collection.title}
        </Link>
      </h3>

      <p className="cx-card-v3__promise">
        {collection.stack_meta?.concise_promise ?? collection.description}
      </p>

      {visibleCores.length > 0 && (
        <ol className="cx-card-v3__stack" aria-label="Stack CORE in ordine">
          {visibleCores.map((slot, index) => (
            <li
              key={slot.tool.slug}
              className="cx-card-v3__stack-item"
            >
              <span
                className="cx-card-v3__stack-num"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="cx-card-v3__stack-name">{slot.tool.name}</span>
              {featured && slot.stage && (
                <span className="cx-card-v3__stack-stage">{slot.stage}</span>
              )}
            </li>
          ))}
          {hiddenCoresCount > 0 && (
            <li className="cx-card-v3__stack-more">
              +{hiddenCoresCount} {hiddenCoresCount === 1 ? "altro" : "altri"}
            </li>
          )}
        </ol>
      )}

      {signal && <p className="cx-card-v3__signal">{signal}</p>}

      <Link
        href={`/collections/${collection.slug}`}
        className="cx-card-v3__cta"
        aria-label={`Apri la raccolta ${collection.title}`}
      >
        <span>Apri la raccolta</span>
        <ArrowRight
          className="cx-card-v3__cta-arrow size-3.5"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

/**
 * Deterministically pick the lead (featured) Collection.
 *
 * Priority:
 *   1. First Collection whose visual identity has `featured: true`
 *   2. Fallback: first by editorial_order, then by updated_at
 *
 * Never depends on `collections[0]` being the lead — explicit by
 * `featured` flag from visual-identity.ts.
 */
export function pickFeaturedCollection(
  collections: CuratedCollection[],
): CuratedCollection | null {
  if (collections.length === 0) return null;

  const lead = collections.find(
    (collection) => getCollectionVisualIdentity(collection.slug)?.featured === true,
  );
  if (lead) return lead;

  return [...collections].sort((left, right) => {
    const l = left.editorial_order ?? 999;
    const r = right.editorial_order ?? 999;
    if (l !== r) return l - r;
    return right.updated_at.localeCompare(left.updated_at);
  })[0];
}
