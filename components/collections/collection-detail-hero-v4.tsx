import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionAreaLabel,
  getCollectionAudienceDescription,
  getCollectionCoreSlots,
  getCollectionCostLabel,
  getCollectionDifficultyShort,
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
 *   3. DECISION    — cost · setup · difficulty · verified,
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
  const difficulty = getCollectionDifficultyShort(collection);
  const verified = collection.stack_meta?.last_verified;
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
            <Link href="/collections" className="cx-detail-hero-v4__breadcrumb">
              ← Tutte le raccolte
            </Link>
            <span className="cx-detail-hero-v4__group">
              {groupLabel?.toUpperCase()}
            </span>
            {areaLabel && (
              <>
                <span className="cx-detail-hero-v4__dot" aria-hidden="true">
                  ·
                </span>
                <span className="cx-detail-hero-v4__area">{areaLabel}</span>
              </>
            )}
          </div>

          <h1 className="cx-detail-hero-v4__title">{collection.title}</h1>

          {collection.stack_meta?.concise_promise && (
            <p className="cx-detail-hero-v4__promise">
              {collection.stack_meta.concise_promise}
            </p>
          )}

          {job && (
            <p className="cx-detail-hero-v4__job">{job}</p>
          )}

          {(audience || stage) && (
            <div className="cx-detail-hero-v4__audience">
              {audience && (
                <span className="cx-detail-hero-v4__audience-tag">
                  {audience}
                </span>
              )}
              {stage && (
                <span className="cx-detail-hero-v4__stage-tag">{stage}</span>
              )}
            </div>
          )}
        </div>

        {/* ZONE 2 — STACK GLANCE (hidden on small screens via CSS) */}
        {previewCores.length > 0 && (
          <div className="cx-detail-hero-v4__stack" aria-label="Il flusso, in ordine">
            <div className="cx-detail-hero-v4__stack-head">
              <span className="cx-detail-hero-v4__stack-label">
                Il flusso, in ordine
              </span>
              <span className="cx-detail-hero-v4__stack-count">
                {coreCount} {coreCount === 1 ? "strumento" : "strumenti"}
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
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="cx-detail-hero-v4__strip-name">
                        {slot.tool.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ZONE 3 — DECISION STRIP */}
        <div className="cx-detail-hero-v4__decision">
          {cost && (
            <div className="cx-detail-hero-v4__decision-item">
              <span className="cx-detail-hero-v4__decision-label">Costo</span>
              <span className="cx-detail-hero-v4__decision-value">{cost}</span>
            </div>
          )}
          {setup && (
            <div className="cx-detail-hero-v4__decision-item">
              <span className="cx-detail-hero-v4__decision-label">Setup</span>
              <span className="cx-detail-hero-v4__decision-value">{setup}</span>
            </div>
          )}
          {difficulty && (
            <div className="cx-detail-hero-v4__decision-item">
              <span className="cx-detail-hero-v4__decision-label">
                Difficoltà
              </span>
              <span className="cx-detail-hero-v4__decision-value">
                {difficulty}
              </span>
            </div>
          )}
          {verified && (
            <div className="cx-detail-hero-v4__decision-item">
              <span className="cx-detail-hero-v4__decision-label">
                Verificato
              </span>
              <span className="cx-detail-hero-v4__decision-value">{verified}</span>
            </div>
          )}
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
            <span>Avvia questa raccolta</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/archivio" className="cx-detail-hero-v4__catalog">
            Catalogo
          </Link>
        </div>
      </div>
    </header>
  );
}
