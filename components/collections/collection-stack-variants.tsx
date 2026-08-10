"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, Split } from "lucide-react";

import type { CollectionStackVariant, CuratedCollection } from "@/lib/types/collection";
import { getCollectionVariant, hasStackVariants } from "@/lib/collections/helpers";

type CollectionStackVariantsProps = {
  collection: CuratedCollection;
};

function VariantPanel({ variant }: { variant: CollectionStackVariant }) {
  return (
    <div className="cx-variants__panel" role="tabpanel">
      <header className="cx-variants__panel-head">
        <span className="cx-variants__panel-eyebrow">
          {variant.label === "lean"
            ? "Variante essenziale"
            : variant.label === "balanced"
              ? "Variante bilanciata"
              : "Variante avanzata"}
        </span>
        <h3 className="cx-variants__panel-title">{variant.description}</h3>
      </header>

      <div className="cx-variants__tools" aria-label="Tool della variante">
        {variant.core_tool_slugs.map((slug, index) => (
          <Link key={slug} href={`/toools/${slug}`} className="cx-variants__tool">
            <span className="cx-variants__tool-no" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            {slug}
          </Link>
        ))}
      </div>

      {((variant.gains && variant.gains.length > 0) ||
        (variant.trade_offs && variant.trade_offs.length > 0)) && (
        <div className="cx-variants__tradeoffs">
          {variant.gains && variant.gains.length > 0 && (
            <div>
              <h4>Cosa guadagni</h4>
              <ul>
                {variant.gains.map((gain) => (
                  <li key={gain}>{gain}</li>
                ))}
              </ul>
            </div>
          )}
          {variant.trade_offs && variant.trade_offs.length > 0 && (
            <div>
              <h4>Cosa rinunci</h4>
              <ul>
                {variant.trade_offs.map((trade) => (
                  <li key={trade}>{trade}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PathBasedPanel({ collection }: { collection: CuratedCollection }) {
  const lean = getCollectionVariant(collection, "lean");
  const balanced = getCollectionVariant(collection, "balanced");

  if (!lean || !balanced) return null;

  return (
    <div className="cx-variants__paths" aria-label="Percorsi alternativi">
      <div className="cx-variants__path">
        <span className="cx-variants__path-eyebrow">Percorso veloce</span>
        <h3 className="cx-variants__path-title">{lean.description}</h3>
        <div className="cx-variants__path-tools">
          {lean.core_tool_slugs.map((slug, index) => (
            <Link key={slug} href={`/toools/${slug}`} className="cx-variants__tool">
              <span className="cx-variants__tool-no" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {slug}
            </Link>
          ))}
        </div>
      </div>
      <div className="cx-variants__path">
        <span className="cx-variants__path-eyebrow">Percorso tecnico</span>
        <h3 className="cx-variants__path-title">{balanced.description}</h3>
        <div className="cx-variants__path-tools">
          {balanced.core_tool_slugs.map((slug, index) => (
            <Link key={slug} href={`/toools/${slug}`} className="cx-variants__tool">
              <span className="cx-variants__tool-no" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {slug}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CollectionStackVariantsImpl({ collection }: { collection: CuratedCollection }) {
  const lean = getCollectionVariant(collection, "lean");
  const balanced = getCollectionVariant(collection, "balanced");
  const advanced = getCollectionVariant(collection, "advanced");

  const isPathBased =
    !!lean &&
    !!balanced &&
    (lean.core_tool_slugs.every((s) => !balanced.core_tool_slugs.includes(s)) ||
      balanced.core_tool_slugs.every((s) => !lean.core_tool_slugs.includes(s)));

  const variants: CollectionStackVariant[] = [];
  if (lean) variants.push(lean);
  if (balanced) variants.push(balanced);
  if (advanced) variants.push(advanced);

  const initial = lean ? "lean" : balanced ? "balanced" : "advanced";
  const [active, setActive] = useState<string>(initial);

  const current = variants.find((v) => v.label === active) ?? variants[0];

  return (
    <section className="cx-variants" aria-labelledby="cx-variants-title">
      <header className="cx-variants__head">
        <span className="cx-variants__eyebrow">
          {isPathBased ? (
            <Split className="size-3.5" aria-hidden="true" />
          ) : (
            <Layers className="size-3.5" aria-hidden="true" />
          )}
          {isPathBased ? "Percorsi" : "Varianti dello stack"}
        </span>
        <h2 id="cx-variants-title" className="cx-variants__title">
          {isPathBased
            ? "Scegli un'architettura, non un singolo tool"
            : "Quanta potenza ti serve davvero?"}
        </h2>
        <p className="cx-variants__lede">
          {isPathBased
            ? "Questi due percorsi non si sommano: scegline uno in base al tuo profilo e al tuo controllo desiderato."
            : "La variante LEAN è il minimo funzionante. Quelle successive aggiungono strumenti, complessità e costo."}
        </p>
      </header>

      {isPathBased ? (
        <PathBasedPanel collection={collection} />
      ) : (
        <>
          <div className="cx-variants__tabs" role="tablist" aria-label="Varianti">
            {variants.map((variant) => (
              <button
                key={variant.label}
                type="button"
                role="tab"
                aria-selected={active === variant.label}
                data-pressed={active === variant.label}
                onClick={() => setActive(variant.label)}
                className="cx-variants__tab"
              >
                {variant.label === "lean" && "Lean"}
                {variant.label === "balanced" && "Balanced"}
                {variant.label === "advanced" && "Advanced"}
                <span style={{ opacity: 0.7 }}>
                  {variant.core_tool_slugs.length}
                </span>
              </button>
            ))}
          </div>
          {current && <VariantPanel variant={current} />}
        </>
      )}
    </section>
  );
}

export function CollectionStackVariants({ collection }: CollectionStackVariantsProps) {
  if (!hasStackVariants(collection)) {
    return null;
  }
  return <CollectionStackVariantsImpl collection={collection} />;
}

