import Link from "next/link";
import { BookOpenText, GitBranch, ShieldAlert } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { getCollectionCoreToolSlugs } from "@/lib/collections/helpers";

import {
  CollectionCardV3,
  pickFeaturedCollection,
} from "./collection-card-v3";

type CollectionsIndexProps = {
  collections: CuratedCollection[];
};

export function CollectionsIndex({ collections }: CollectionsIndexProps) {
  if (collections.length === 0) {
    return null;
  }

  // Lead selection is deterministic and explicit (visual-identity.featured).
  // Does NOT depend on collections[0].
  const lead = pickFeaturedCollection(collections);
  const rest = lead
    ? collections.filter((c) => c.slug !== lead.slug)
    : collections;

  const totalCore = collections.reduce(
    (acc, c) => acc + getCollectionCoreToolSlugs(c).length,
    0,
  );

  return (
    <div className="cx-index">
      <div className="cx-index__inner">
        <header className="cx-index__masthead">
          <div>
            <span className="cx-index__eyebrow">
              <span className="cx-index__eyebrow-dot" aria-hidden="true" />
              Percorsi
            </span>
            <h1 className="cx-index__title">
              Scegli il <em>workflow</em> che ti serve, non un altro tool.
            </h1>
          </div>
          <div>
            <p className="cx-index__lede">
              Le <strong>raccolte TooolVibes</strong> sono stack operativi: tool,
              ruoli e ordine di lavoro già decisi per un risultato preciso.
              Non un elenco di preferiti. Non una lista della spesa.
              <br />
              Se cerchi un singolo tool, vai su <Link href="/toools">Catalogo</Link>.
              Se vuoi studiarne uno in profondità, le <Link href="/posts">Guide</Link>.
            </p>
            <div className="cx-index__meta" aria-label="A colpo d'occhio">
              <span>
                <span className="cx-index__meta-divider" aria-hidden="true" />
                {collections.length} raccolte
              </span>
              <span>
                <span className="cx-index__meta-divider" aria-hidden="true" />
                {totalCore} tool CORE
              </span>
              <span>
                <span className="cx-index__meta-divider" aria-hidden="true" />
                Verificato agosto 2026
              </span>
            </div>
          </div>
        </header>

        <section className="cx-index__discover">
          <div className="cx-index__lede-block">
            <h2>Le raccolte non sono guide né confronti.</h2>
            <p>
              Ogni raccolta ti dice quale software combinare, in che ordine, per
              quale risultato. Include varianti LEAN quando esistono, alternative
              oneste invece di duplicati, e una sezione esplicita su quando
              <em> non </em> è la raccolta giusta per te.
            </p>
            <dl className="cx-index__compare-strip" aria-label="Differenza tra superfici">
              <div>
                <dt>Catalogo</dt>
                <dd>Scopri tool singoli</dd>
              </div>
              <div>
                <dt>Guide</dt>
                <dd>Approfondisci un tool</dd>
              </div>
              <div>
                <dt>Raccolte</dt>
                <dd>Assembla uno stack</dd>
              </div>
              <div>
                <dt>Confronto</dt>
                <dd>Scegli tra 2 o 3 candidati</dd>
              </div>
            </dl>
          </div>
        </section>

        <section aria-labelledby="cx-raccolte-heading">
          <div className="cx-index__section-title">
            <h2 id="cx-raccolte-heading">Le 8 raccolte</h2>
            <p>Costruisci prima il workflow, poi il tool</p>
          </div>
          <div className="cx-index__grid" style={{ marginTop: "1.2rem" }}>
            {lead && <CollectionCardV3 collection={lead} featured />}
            {rest.map((collection) => (
              <CollectionCardV3
                key={collection.slug}
                collection={collection}
              />
            ))}
          </div>
        </section>

        <section
          aria-labelledby="cx-principles-heading"
          style={{ marginTop: "1.4rem" }}
        >
          <div className="cx-index__section-title">
            <h2 id="cx-principles-heading">Come leggere una raccolta</h2>
            <p>Tre cose da cercare sempre</p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
              gap: "0.7rem",
              marginTop: "1.1rem",
            }}
          >
            <PrincipleCard
              icon={<GitBranch className="size-4" aria-hidden="true" />}
              eyebrow="Il flusso"
              body="Ogni CORE è uno stadio del flusso, in ordine. Non sono sei card isolate: si parlano."
            />
            <PrincipleCard
              icon={<BookOpenText className="size-4" aria-hidden="true" />}
              eyebrow="CORE / OPT / ALT"
              body="CORE è lo stack. OPT aggiungi solo se serve. ALT è quando sostituisci, non quando aggiungi."
            />
            <PrincipleCard
              icon={<ShieldAlert className="size-4" aria-hidden="true" />}
              eyebrow="Quando non è per te"
              body="Ogni raccolta dichiara apertamente quando è la risposta sbagliata. Vale la pena leggerlo."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PrincipleCard({
  icon,
  eyebrow,
  body,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  body: string;
}) {
  return (
    <div className="cx-related-card">
      <span
        className="cx-related-card-eyebrow"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        {icon}
        {eyebrow}
      </span>
      <p className="cx-related-card-promise" style={{ maxWidth: "none" }}>
        {body}
      </p>
    </div>
  );
}
