"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useLocale } from "@/components/i18n/locale-provider";
import Link from "@/components/ui/app-link";
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
import { getCollectionPreviewCopy } from "./collection-preview-copy";


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
  const { locale } = useLocale();
  if (relatedCollections.length === 0) return null;

  return (
    <section
      className="cx-next-step-v4 motion-reveal"
      aria-labelledby="cx-next-step-title"
    >
      <header className="cx-next-step-v4__head">
        <h2 id="cx-next-step-title" className="cx-next-step-v4__title"><LocalizedText>{"Altri stack da esplorare"}</LocalizedText></h2>
        <p className="cx-next-step-v4__lede"><LocalizedText>{"Confronta approcci e strumenti per il tuo prossimo obiettivo."}</LocalizedText></p>
      </header>

      <div className="cx-next-step-v4__grid motion-stagger">
        {relatedCollections.map((next) => {
          const preview = getCollectionPreviewCopy(next);
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
                <LocalizedText>{groupLabel?.toUpperCase()}</LocalizedText>
              </div>
              <h3 className="cx-next-step-v4__card-title"><LocalizedText>{preview.title}</LocalizedText></h3>
              {next.stack_meta?.concise_promise && (
                <p className="cx-next-step-v4__card-promise">
                  <LocalizedText>{preview.description}</LocalizedText>
                </p>
              )}

              {previewCores.length > 0 && (
                <LocalizedAttributes><div
                  className="cx-next-step-v4__card-stack"
                  aria-label="Strumenti nello stack"
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
                </div></LocalizedAttributes>
              )}

              {(cost || setup) && (
                <p className="cx-next-step-v4__card-signal">
                  <LocalizedText>{[cost, setup].filter(Boolean).join(" · ")}</LocalizedText>
                </p>
              )}

              <span className="cx-next-step-v4__card-cta">
                <span>{locale === "en" ? "Explore this stack" : "Esplora lo stack"}</span>
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
