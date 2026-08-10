"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";

import type { CuratedCollection, CollectionStackVariant } from "@/lib/types/collection";

import { CollectionToolGlyph } from "./collection-tool-glyph";

type CollectionVariantPathsV4Props = {
  collection: CuratedCollection;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Variant Paths V4 — additive variants AND architectural paths.
 *
 * Additive variants (LEAN/BALANCED/ADVANCED) → tabs that show what
 *   changes (core count diff, tool list, complexity).
 *
 * Architectural paths (e.g. agents no-code vs self-hosted) → two
 *   clear paths side by side with the actual tool compositions.
 *
 * Detection: a Collection is path-based when `lean.core_tool_slugs`
 * is NOT a subset of `balanced.core_tool_slugs` — i.e. the tools
 * differ between variants. Otherwise it's additive.
 */
export function CollectionVariantPathsV4({
  collection,
}: CollectionVariantPathsV4Props) {
  const variants = collection.stack_variants;
  if (!variants || variants.length === 0) return null;

  // Detect additive vs path-based.
  //
  // Two signals trigger path-based rendering:
  //   (a) variants differ in their core tool set (lean is NOT a subset
  //       of balanced), OR
  //   (b) the Collection has an explicit `architectural: true` flag on
  //       any of its variants (used for collections like agents where
  //       the lean/balanced/advanced nesting is real but the CORE
  //       tools actually swap between no-code and self-hosted paths).
  const lean = variants.find((v) => v.label === "lean");
  const balanced = variants.find((v) => v.label === "balanced");
  const subsetDiffers = Boolean(
    lean &&
      balanced &&
      balanced.core_tool_slugs.length > 0 &&
      !lean.core_tool_slugs.every((slug) => balanced.core_tool_slugs.includes(slug)),
  );
  const hasArchitecturalFlag = variants.some((v) => v.architectural === true);
  const isPathBased = subsetDiffers || hasArchitecturalFlag;

  if (isPathBased) {
    return <PathBasedVariants collection={collection} />;
  }

  return <AdditiveVariants collection={collection} />;
}

function AdditiveVariants({ collection }: { collection: CuratedCollection }) {
  const variants = collection.stack_variants ?? [];
  const [activeLabel, setActiveLabel] = useState<string>(
    variants[0]?.label ?? "lean",
  );
  const active = variants.find((v) => v.label === activeLabel) ?? variants[0];
  if (!active) return null;

  const totalCount = collection.included_tools.filter((s) => s.is_core).length;

  return (
    <section
      data-cx-accent="indigo"
      className="cx-variant-paths-v4 cx-variant-paths-v4--additive"
      aria-labelledby="cx-variants-title"
    >
      <header className="cx-variant-paths-v4__head">
        <span className="cx-variant-paths-v4__eyebrow">
          <GitBranch className="size-3.5" aria-hidden="true" />
          Varianti
        </span>
        <h2 id="cx-variants-title" className="cx-variant-paths-v4__title">
          Quanta potenza ti serve davvero?
        </h2>
        <p className="cx-variant-paths-v4__lede">
          La variante minima funziona per partire. Quelle successive
          aggiungono strumenti, complessità e costo.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Varianti dello stack"
        className="cx-variant-paths-v4__tabs"
      >
        {variants.map((v) => (
          <button
            key={v.label}
            role="tab"
            type="button"
            aria-selected={activeLabel === v.label}
            onClick={() => setActiveLabel(v.label)}
            className={cx(
              "cx-variant-paths-v4__tab",
              activeLabel === v.label && "cx-variant-paths-v4__tab--active",
            )}
          >
            <span className="cx-variant-paths-v4__tab-label">
              {labelDisplay(v.label)}
            </span>
            <span className="cx-variant-paths-v4__tab-count">
              {v.core_tool_slugs.length}/{totalCount}
            </span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        className="cx-variant-paths-v4__panel"
        aria-label={`Variante ${labelDisplay(active.label)}`}
      >
        <VariantPanel
          variant={active}
          collection={collection}
        />
      </div>
    </section>
  );
}

function PathBasedVariants({ collection }: { collection: CuratedCollection }) {
  const variants = collection.stack_variants ?? [];
  const pathSplit = collection.stack_meta?.path_split;

  // Use explicit path_split when present (e.g. agents no-code vs
  // self-hosted). Fall back to iterating variants when not.
  const paths: Array<{
    key: string;
    label: string;
    tagline?: string;
    coreSlugs: string[];
    accent: "violet" | "amber";
  }> = pathSplit
    ? [
        {
          key: "a",
          label: pathSplit.a.label,
          tagline: pathSplit.a.tagline,
          coreSlugs: pathSplit.a.core_slugs,
          accent: "violet",
        },
        {
          key: "b",
          label: pathSplit.b.label,
          tagline: pathSplit.b.tagline,
          coreSlugs: pathSplit.b.core_slugs,
          accent: "amber",
        },
      ]
    : variants.map((v) => ({
        key: v.label,
        label: labelDisplay(v.label),
        tagline: v.description,
        coreSlugs: v.core_tool_slugs,
        accent: v.label === "lean" ? ("violet" as const) : ("amber" as const),
      }));

  if (paths.length === 0) return null;

  return (
    <section
      data-cx-accent="indigo"
      className="cx-variant-paths-v4 cx-variant-paths-v4--path"
      aria-labelledby="cx-variants-title"
    >
      <header className="cx-variant-paths-v4__head">
        <span className="cx-variant-paths-v4__eyebrow">
          <GitBranch className="size-3.5" aria-hidden="true" />
          Architettura
        </span>
        <h2 id="cx-variants-title" className="cx-variant-paths-v4__title">
          Due percorsi, una decisione
        </h2>
        <p className="cx-variant-paths-v4__lede">
          I CORE tools cambiano in base al percorso. Scegli quello
          adatto al tuo contesto.
        </p>
      </header>

      <div className="cx-variant-paths-v4__paths">
        {paths.map((path, idx) => {
          const isPrimary = idx === 0;
          return (
            <article
              key={path.key}
              data-cx-accent={path.accent}
              className={cx(
                "cx-variant-paths-v4__path",
                isPrimary && "cx-variant-paths-v4__path--primary",
              )}
            >
              <div className="cx-variant-paths-v4__path-head">
                <span className="cx-variant-paths-v4__path-label">
                  {path.label}
                </span>
                <span className="cx-variant-paths-v4__path-count">
                  {path.coreSlugs.length} CORE
                </span>
              </div>

              {path.tagline && (
                <p className="cx-variant-paths-v4__path-gains">{path.tagline}</p>
              )}

              {path.coreSlugs.length > 0 && (
                <ul className="cx-variant-paths-v4__path-tools">
                  {path.coreSlugs.map((slug) => {
                    const slot = collection.included_tools.find(
                      (s) => s.tool.slug === slug,
                    );
                    if (!slot) return null;
                    return (
                      <li
                        key={slug}
                        className="cx-variant-paths-v4__path-tool"
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
                        <Link
                          href={`/toools/${slot.tool.slug}`}
                          className="cx-variant-paths-v4__path-tool-name"
                        >
                          {slot.tool.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function VariantPanel({
  variant,
  collection,
}: {
  variant: CollectionStackVariant;
  collection: CuratedCollection;
}) {
  return (
    <div className="cx-variant-paths-v4__variant">
      {variant.gains && variant.gains.length > 0 && (
        <p className="cx-variant-paths-v4__variant-gains">
          {variant.gains.join(" · ")}
        </p>
      )}

      {variant.core_tool_slugs.length > 0 && (
        <ul className="cx-variant-paths-v4__variant-tools">
          {variant.core_tool_slugs.map((slug) => {
            const slot = collection.included_tools.find(
              (s) => s.tool.slug === slug,
            );
            if (!slot) return null;
            return (
              <li
                key={slug}
                className="cx-variant-paths-v4__variant-tool"
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
                <Link
                  href={`/toools/${slot.tool.slug}`}
                  className="cx-variant-paths-v4__variant-tool-name"
                >
                  {slot.tool.name}
                </Link>
                {slot.stage && (
                  <span className="cx-variant-paths-v4__variant-stage">
                    {slot.stage}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {variant.trade_offs && variant.trade_offs.length > 0 && (
        <p className="cx-variant-paths-v4__variant-tradeoffs">
          <strong>Cosa cambi.</strong> {variant.trade_offs.join(" ")}
        </p>
      )}
    </div>
  );
}

function labelDisplay(label: string): string {
  switch (label) {
    case "lean":
      return "Lean";
    case "balanced":
      return "Balanced";
    case "advanced":
      return "Advanced";
    default:
      return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
