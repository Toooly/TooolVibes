import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionAreaLabel,
  getCollectionAudienceShort,
  getCollectionCostLabel,
  getCollectionCoreToolSlugs,
  getCollectionDifficultyShort,
  getCollectionSetupLabel,
} from "@/lib/collections/helpers";

type CollectionCardV2Props = {
  collection: CuratedCollection;
  lead?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CollectionCardV2({ collection, lead = false }: CollectionCardV2Props) {
  const coreTools = getCollectionCoreToolSlugs(collection);
  const area = getCollectionAreaLabel(collection);
  const audience = getCollectionAudienceShort(collection);
  const cost = getCollectionCostLabel(collection);
  const difficulty = getCollectionDifficultyShort(collection);
  const setup = getCollectionSetupLabel(collection);

  return (
    <article className={cx("cx-card", lead && "cx-card--lead")}>
      <header className="cx-card__header">
        <span className="cx-card__area">
          <span className="cx-card__area-dot" aria-hidden="true" />
          {area}
        </span>
        <h3 className="cx-card__title">{collection.title}</h3>
        {collection.stack_meta?.concise_promise ? (
          <p className="cx-card__promise">{collection.stack_meta.concise_promise}</p>
        ) : (
          <p className="cx-card__promise">{collection.description}</p>
        )}
      </header>

      {coreTools.length > 0 && (
        <div className="cx-card__flow" aria-label="Stack CORE in ordine">
          {coreTools.map((slug, index) => {
            const slot = collection.included_tools.find((s) => s.tool.slug === slug);
            if (!slot) return null;
            return (
              <span key={slug} className="cx-card__flow-step">
                <span className="cx-card__flow-step-no">{String(index + 1).padStart(2, "0")}</span>
                {slot.tool.name}
              </span>
            );
          })}
        </div>
      )}

      <dl className="cx-card__meta">
        <div>
          <dt>Costo</dt>
          <dd>{cost ?? "Su preventivo"}</dd>
        </div>
        <div>
          <dt>Setup</dt>
          <dd>{setup ?? "Variabile"}</dd>
        </div>
        <div>
          <dt>Difficoltà</dt>
          <dd>{difficulty}</dd>
        </div>
        {lead && (
          <div>
            <dt>Tool guida</dt>
            <dd>{collection.included_tools.find((s) => s.is_core)?.tool.name ?? "—"}</dd>
          </div>
        )}
      </dl>

      <footer className="cx-card__footer">
        <span className="cx-card__audience">
          <span className="cx-card__audience-dot" aria-hidden="true" />
          {audience}
        </span>
        <Link
          href={`/collections/${collection.slug}`}
          className="cx-card__cta"
          aria-label={`Apri la raccolta ${collection.title}`}
        >
          Apri la raccolta
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
