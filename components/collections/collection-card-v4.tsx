import Link from "@/components/ui/app-link";
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

import { CollectionToolGlyph } from "./collection-tool-glyph";

type CollectionCardV4Props = {
  collection: CuratedCollection;
  /** Featured / lead variant — structurally richer. */
  featured?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Composite decision signal: "X core · COSTO · SETUP".
 * One line. No chip cloud. Featured version gets the count as a
 * dedicated pill instead (separate visual element).
 */
function buildCompositeSignal(
  collection: CuratedCollection,
  coreCount: number,
  featured: boolean,
): string | null {
  const cost = getCollectionCostLabel(collection);
  const setup = getCollectionSetupLabel(collection);
  const parts: string[] = [];

  if (featured) {
    // Featured shows cost + setup only; the count is in the dedicated pill.
    if (cost) parts.push(cost);
    if (setup) parts.push(setup);
  } else {
    // Standard merges count + cost + setup into a single line.
    parts.push(coreCount === 1 ? "1 tool" : `${coreCount} tool`);
    if (cost) parts.push(cost);
    if (setup) parts.push(setup);
  }

  if (parts.length === 0) return null;
  return parts.join(" · ");
}

/**
 * Collection Card V4.1 — Phase 4 visual system, realigned with the
 * TooolVibes product grammar, surgically compacted for mobile.
 *
 * Three layers, mobile-first, two densities:
 *   1. IDENTITY   — eyebrow (group + area), title, promise (line-clamped)
 *   2. STACK      — tool glyph strip with REAL brand gradients
 *   3. DECISION   — composite signal + pill CTA
 *
 * Standard density:  sm glyphs, no count pill, no stage labels, compact
 *                    spacing, outlined pill CTA, ~3-row mobile height.
 * Featured density:  lg glyphs, count pill (solid), stage labels, larger
 *                    title, solid pill CTA.
 */
export function CollectionCardV4({
  collection,
  featured = false,
}: CollectionCardV4Props) {
  const identity = getCollectionVisualIdentity(collection.slug);
  const accent = identity?.accent ?? "indigo";
  const group = identity?.group ?? null;
  const groupLabel = group ? cxGroupLabel[group] : null;
  const areaLabel = getCollectionAreaLabel(collection);

  const coreSlots = getCollectionCoreSlots(collection);
  const coreCount = coreSlots.length;
  // Standard cards show up to 3 CORE compactly; featured up to 5 with stages.
  const previewLimit = featured ? 5 : 3;
  const visibleCores = coreSlots.slice(0, previewLimit);
  const hiddenCoresCount = Math.max(0, coreSlots.length - visibleCores.length);

  const signal = buildCompositeSignal(collection, coreCount, featured);

  const glyphSize: "sm" | "lg" = featured ? "lg" : "sm";

  return (
    <article
      data-cx-accent={accent}
      className={cx(
        "cx-card-v4",
        featured && "cx-card-v4--featured",
      )}
      data-featured={featured ? "true" : undefined}
    >
      {/* LAYER 1 — IDENTITY */}
      <header className="cx-card-v4__head">
        <div className="cx-card-v4__eyebrow">
          {groupLabel && (
            <span className="cx-card-v4__group">{groupLabel.toUpperCase()}</span>
          )}
          {areaLabel && (
            <span className="cx-card-v4__area">{areaLabel}</span>
          )}
        </div>
        {featured && (
          <div className="cx-card-v4__count">
            <span className="cx-card-v4__count-num">{coreCount}</span>
            <span className="cx-card-v4__count-label">
              {coreCount === 1 ? "strumento" : "strumenti"}
            </span>
          </div>
        )}
      </header>

      <h3 className="cx-card-v4__title">
        <Link
          href={`/collections/${collection.slug}`}
          className="cx-card-v4__title-link"
        >
          {collection.title}
        </Link>
      </h3>

      <p className="cx-card-v4__promise">
        {collection.stack_meta?.concise_promise ?? collection.description}
      </p>

      {/* LAYER 2 — STACK (real brand gradient glyph strip) */}
      {visibleCores.length > 0 && (
        <div className="cx-card-v4__stack" aria-label="Tool nello stack">
          <ol className="cx-card-v4__stack-list">
            {visibleCores.map((slot, index) => (
              <li
                key={slot.tool.slug}
                className="cx-card-v4__stack-item"
              >
                <span className="cx-card-v4__stack-no" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <CollectionToolGlyph
                  slug={slot.tool.slug}
                  name={slot.tool.name}
                  size={glyphSize}
                  accentFrom={slot.tool.accentFrom}
                  accentTo={slot.tool.accentTo}
                  domain={slot.tool.domain}
                  externalUrl={slot.tool.externalUrl}
                />
                <div className="cx-card-v4__stack-meta">
                  <span className="cx-card-v4__stack-name">
                    {slot.tool.name}
                  </span>
                  {featured && slot.stage && (
                    <span className="cx-card-v4__stack-stage">
                      {slot.stage}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {featured && hiddenCoresCount > 0 && (
            <p className="cx-card-v4__stack-more">
              +{hiddenCoresCount} {hiddenCoresCount === 1 ? "altro strumento" : "altri strumenti"}
            </p>
          )}
        </div>
      )}

      {/* LAYER 3 — DECISION (signal + CTA) */}
      <div className="cx-card-v4__foot">
        {signal && <p className="cx-card-v4__signal">{signal}</p>}

        <Link
          href={`/collections/${collection.slug}`}
          className="cx-card-v4__cta"
          aria-label={`Usa questa raccolta ${collection.title}`}
        >
          <span>Usa questa raccolta</span>
          <ArrowRight
            className="cx-card-v4__cta-arrow size-3.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}
