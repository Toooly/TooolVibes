import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionAreaLabel,
  getCollectionAudienceShort,
  getCollectionCostLabel,
  getCollectionDifficultyShort,
  getCollectionSetupLabel,
  getCollectionCoreToolSlugs,
} from "@/lib/collections/helpers";

type CollectionDetailHeroProps = {
  collection: CuratedCollection;
};

export function CollectionDetailHero({ collection }: CollectionDetailHeroProps) {
  const area = getCollectionAreaLabel(collection);
  const audience = getCollectionAudienceShort(collection);
  const cost = getCollectionCostLabel(collection);
  const setup = getCollectionSetupLabel(collection);
  const difficulty = getCollectionDifficultyShort(collection);
  const coreCount = getCollectionCoreToolSlugs(collection).length;
  const verified = collection.stack_meta?.last_verified;
  const job = collection.stack_meta?.job_to_be_done;
  const promise = collection.stack_meta?.concise_promise ?? collection.description;
  const userStage = collection.stack_meta?.user_stage;

  return (
    <section className="cx-hero" aria-label="Presentazione della raccolta">
      <nav className="cx-hero__crumbs" aria-label="Breadcrumb">
        <Link href="/collections">Raccolte</Link>
        <span className="cx-hero__crumbs-sep" aria-hidden="true" />
        <span>{area}</span>
        <span className="cx-hero__crumbs-sep" aria-hidden="true" />
        <span>{collection.title}</span>
      </nav>

      <div className="cx-hero__main">
        <div className="cx-hero__left">
          <span className="cx-hero__area">{area}</span>
          <h1 className="cx-hero__title">{collection.title}</h1>
          <p className="cx-hero__promise">{promise}</p>
          {job && (
            <div className="cx-hero__job">
              <span className="cx-hero__job-eyebrow">Cosa stai costruendo</span>
              <p className="cx-hero__job-body">{job}</p>
            </div>
          )}
        </div>
        <div className="cx-hero__right">
          <dl className="cx-hero__metric-grid" aria-label="Metriche della raccolta">
            <div className="cx-hero__metric">
              <dt>Tool CORE</dt>
              <dd>{coreCount}</dd>
            </div>
            <div className="cx-hero__metric">
              <dt>Costo</dt>
              <dd>{cost ?? "Su preventivo"}</dd>
            </div>
            <div className="cx-hero__metric">
              <dt>Setup</dt>
              <dd>{setup ?? "Variabile"}</dd>
            </div>
            <div className="cx-hero__metric">
              <dt>Difficoltà</dt>
              <dd>{difficulty}</dd>
            </div>
          </dl>
          {userStage && (
            <p className="cx-hero__verified" aria-label="Per chi">
              <span className="cx-hero__verified-dot" aria-hidden="true" />
              {userStage}
            </p>
          )}
          {verified && (
            <p className="cx-hero__verified" aria-label="Verificato">
              <span className="cx-hero__verified-dot" aria-hidden="true" />
              Verificato {new Date(verified).toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </p>
          )}
          <p className="cx-hero__verified" aria-label="Audience">
            <span className="cx-hero__verified-dot" aria-hidden="true" />
            {audience}
          </p>
        </div>
      </div>

      <div className="cx-hero__ctas">
        <a href="#cx-stack-overview" className="cx-hero__cta">
          Apri lo stack
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
        <Link href="/toools" className="cx-hero__cta cx-hero__cta--ghost">
          Vai al Catalogo
        </Link>
      </div>
    </section>
  );
}
