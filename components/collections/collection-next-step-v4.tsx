import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionCoreSlots,
  getCollectionCostLabel,
  getCollectionSetupLabel,
} from "@/lib/collections/helpers";
import {
  cxGroupLabel,
  getCollectionVisualIdentity,
} from "@/lib/collections/visual-identity";

import { CollectionToolGlyph } from "./collection-tool-glyph";


type CollectionNextStepV4Props = {
  relatedCollections: CuratedCollection[];
};

/**
 * Next Step V4 — related Collections as progression, not generic
 * related content. Each card uses the V4.1 visual DNA (real tool
 * glyphs, elevated surface, compact eyebrow + signal).
 */
export function CollectionNextStepV4({
  relatedCollections,
}: CollectionNextStepV4Props) {
  if (relatedCollections.length === 0) return null;

  return (
    <section
      className="cx-next-step-v4 motion-reveal"
      aria-labelledby="cx-next-step-title"
    >
      <header className="cx-next-step-v4__head">
        <span className="cx-next-step-v4__eyebrow">
          Prossimo passo
        </span>
        <h2 id="cx-next-step-title" className="cx-next-step-v4__title">
          Dove andare dopo
        </h2>
        <p className="cx-next-step-v4__lede">
          Le raccolte che vengono dopo, in ordine di progressione.
        </p>
      </header>

      <div className="cx-next-step-v4__grid motion-stagger">
        {relatedCollections.map((next) => {
          const identity = getCollectionVisualIdentity(next.slug);
          const accent = identity?.accent ?? "indigo";
          const group = identity?.group ?? null;
          const groupLabel = group ? cxGroupLabel[group] : null;
          const coreCores = getCollectionCoreSlots(next);
          const previewCores = coreCores.slice(0, 3);
          const cost = getCollectionCostLabel(next);
          const setup = getCollectionSetupLabel(next);

          return (
            <Link
              key={next.slug}
              href={`/collections/${next.slug}`}
              data-cx-accent={accent}
              className="cx-next-step-v4__card"
            >
              <div className="cx-next-step-v4__card-eyebrow">
                {groupLabel?.toUpperCase()}
              </div>
              <h3 className="cx-next-step-v4__card-title">{next.title}</h3>
              {next.stack_meta?.concise_promise && (
                <p className="cx-next-step-v4__card-promise">
                  {next.stack_meta.concise_promise}
                </p>
              )}

              {previewCores.length > 0 && (
                <div
                  className="cx-next-step-v4__card-stack"
                  aria-label="CORE preview"
                >
                  {previewCores.map((slot, i) => (
                    <span
                      key={slot.tool.slug}
                      className="cx-next-step-v4__card-stack-glyph"
                      style={{ zIndex: 3 - i }}
                    >
                      <CollectionToolGlyph
                        slug={slot.tool.slug}
                        name={slot.tool.name}
                        size="sm"
                        accentFrom={slot.tool.accentFrom}
                        accentTo={slot.tool.accentTo}
                        domain={slot.tool.domain}
                        externalUrl={slot.tool.externalUrl}
                      />
                    </span>
                  ))}
                </div>
              )}

              {(cost || setup) && (
                <p className="cx-next-step-v4__card-signal">
                  {[cost, setup].filter(Boolean).join(" · ")}
                </p>
              )}

              <span className="cx-next-step-v4__card-cta">
                <span>Usa questa raccolta</span>
                <ArrowRight
                  className="size-3.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
