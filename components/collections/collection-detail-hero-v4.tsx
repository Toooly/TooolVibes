import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionAreaLabel,
  getCollectionAudienceDescription,
  getCollectionCoreSlots,
  getCollectionCostLabel,
  getCollectionSetupLabel,
} from "@/lib/collections/helpers";
import {
  cxGroupLabel,
  getCollectionVisualIdentity,
} from "@/lib/collections/visual-identity";

import { CollectionToolGlyph } from "./collection-tool-glyph";

type CollectionDetailHeroV4Props = {
  collection: CuratedCollection;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Detail Hero V4 — composed hero that previews the CORE stack
 * visually before the user has to scroll.
 *
 * Mobile-first, three zones:
 *   1. IDENTITY    — eyebrow · area · title · promise · thesis
 *   2. STACK GLANCE — CORE tool glyphs as a horizontal strip with
 *                     stage labels (matches Card V4.1 stack preview
 *                     but more prominent). Hidden on small screens
 *                     where CollectionStackFlowV4 repeats the sequence.
 *   3. DECISION    — cost · setup · tool count,
 *                     compact 1-line strip
 *   4. ACTIONS     — primary stack CTA + demoted catalog link
 *
 * Inherits the V4.1 DNA: real tool glyphs (brand gradients + favicon
 * via CollectionToolGlyph), elevated surface, restrained accent use,
 * dark-elevated card surface.
 */
export function CollectionDetailHeroV4({
  collection,
}: CollectionDetailHeroV4Props) {
  const identity = getCollectionVisualIdentity(collection.slug);
  const accent = identity?.accent ?? "indigo";
  const group = identity?.group ?? null;
  const groupLabel = group ? cxGroupLabel[group] : null;
  const areaLabel = getCollectionAreaLabel(collection);
  const audience = getCollectionAudienceDescription(collection.audience);

  const coreSlots = getCollectionCoreSlots(collection);
  const coreCount = coreSlots.length;
  const previewCores = coreSlots.slice(0, 5);

  const cost = getCollectionCostLabel(collection);
  const setup = getCollectionSetupLabel(collection);
  const toolCount = collection.included_tools.length;
  const job = collection.stack_meta?.job_to_be_done;
  const stage = collection.stack_meta?.user_stage;

  return (
    <header
      data-cx-accent={accent}
      className="cx-detail-hero-v4 motion-reveal"
    >
      <div className="cx-detail-hero-v4__inner">
        {/* ZONE 1 — IDENTITY */}
        <div className="cx-detail-hero-v4__identity">
          <div className="cx-detail-hero-v4__eyebrow">
            <Link href="/collections" className="cx-detail-hero-v4__breadcrumb"><LocalizedText>{"← Tutte le raccolte "}</LocalizedText></Link>
            <span className="cx-detail-hero-v4__group">
              <LocalizedText>{groupLabel?.toUpperCase()}</LocalizedText>
            </span>
            {areaLabel && (
              <>
                <span className="cx-detail-hero-v4__dot" aria-hidden="true">
                  ·
                </span>
                <span className="cx-detail-hero-v4__area"><LocalizedText>{areaLabel}</LocalizedText></span>
              </>
            )}
          </div>

          <h1 className="cx-detail-hero-v4__title"><LocalizedText>{collection.title}</LocalizedText></h1>

          {collection.stack_meta?.concise_promise && (
            <p className="cx-detail-hero-v4__promise">
              <LocalizedText>{collection.stack_meta.concise_promise}</LocalizedText>
            </p>
          )}

          {job && (
            <p className="cx-detail-hero-v4__job"><LocalizedText>{job}</LocalizedText></p>
          )}

          {(audience || stage) && (
            <div className="cx-detail-hero-v4__audience">
              {audience && (
                <span className="cx-detail-hero-v4__audience-tag">
                  <LocalizedText>{audience}</LocalizedText>
                </span>
              )}
              {stage && (
                <span className="cx-detail-hero-v4__stage-tag"><LocalizedText>{stage}</LocalizedText></span>
              )}
            </div>
          )}
        </div>

        {/* ZONE 2 — STACK GLANCE (hidden on small screens via CSS) */}
        {previewCores.length > 0 && (
          <LocalizedAttributes><div className="cx-detail-hero-v4__stack" aria-label="Il flusso, in ordine">
            <div className="cx-detail-hero-v4__stack-head">
              <span className="cx-detail-hero-v4__stack-label"><LocalizedText>{"Il flusso, in ordine "}</LocalizedText></span>
              <span className="cx-detail-hero-v4__stack-count">
                {coreCount} <LocalizedText>{coreCount === 1 ? "strumento" : "strumenti"}</LocalizedText>
              </span>
            </div>
            <ol className="cx-detail-hero-v4__strip">
              {previewCores.map((slot, index) => (
                <li
                  key={slot.tool.slug}
                  className="cx-detail-hero-v4__strip-item"
                >
                  {index > 0 && (
                    <span
                      className="cx-detail-hero-v4__strip-connector"
                      aria-hidden="true"
                    />
                  )}
                  <Link
                    href={`/toools/${slot.tool.slug}`}
                    className="cx-detail-hero-v4__strip-link"
                  >
                    <CollectionToolGlyph
                      slug={slot.tool.slug}
                      name={slot.tool.name}
                      size="md"
                      accentFrom={slot.tool.accentFrom}
                      accentTo={slot.tool.accentTo}
                      domain={slot.tool.domain}
                      externalUrl={slot.tool.externalUrl}
                    />
                    <div className="cx-detail-hero-v4__strip-meta">
                      <span className="cx-detail-hero-v4__strip-num">
                        <LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText>
                      </span>
                      <span className="cx-detail-hero-v4__strip-name">
                        {slot.tool.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div></LocalizedAttributes>
        )}

        {/* ZONE 3 — DECISION STRIP */}
        <div className="cx-detail-hero-v4__decision">
          {cost && (
            <div className="cx-detail-hero-v4__decision-item">
              <span className="cx-detail-hero-v4__decision-label"><LocalizedText>{"Costo"}</LocalizedText></span>
              <span className="cx-detail-hero-v4__decision-value"><LocalizedText>{cost}</LocalizedText></span>
            </div>
          )}
          {setup && (
            <div className="cx-detail-hero-v4__decision-item">
              <span className="cx-detail-hero-v4__decision-label"><LocalizedText>{"Setup"}</LocalizedText></span>
              <span className="cx-detail-hero-v4__decision-value"><LocalizedText>{setup}</LocalizedText></span>
            </div>
          )}
          <div className="cx-detail-hero-v4__decision-item">
            <span className="cx-detail-hero-v4__decision-label"><LocalizedText>{"Tool"}</LocalizedText></span>
            <span className="cx-detail-hero-v4__decision-value">
              {toolCount}
            </span>
          </div>
        </div>

        {/* ZONE 4 — ACTIONS */}
        <div className="cx-detail-hero-v4__actions">
          <Link
            href="#cx-detail-stack"
            className={cx(
              "cx-detail-hero-v4__cta",
              "cx-detail-hero-v4__cta--primary",
            )}
          >
            <span><LocalizedText>{"Avvia questa raccolta"}</LocalizedText></span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/archivio" className="cx-detail-hero-v4__catalog"><LocalizedText>{"Catalogo "}</LocalizedText></Link>
        </div>
      </div>
    </header>
  );
}
