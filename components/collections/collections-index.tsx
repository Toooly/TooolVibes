import Link from "next/link";
import { BookOpenText, GitBranch, ShieldAlert, Wrench, Sparkles, Cog, TrendingUp } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { getCollectionCoreToolSlugs } from "@/lib/collections/helpers";
import { collectionVisualIdentity, type CxVisualIdentity, cxGroupOrder, pickFeaturedCollection } from "@/lib/collections/visual-identity";

import { MemberPreviewGate } from "@/components/account/member-preview-gate";
import { CollectionCardV4 } from "./collection-card-v4";

type CollectionsIndexProps = {
  collections: CuratedCollection[];
};

type GroupKey = CxVisualIdentity["group"];

const GROUP_LABELS: Record<GroupKey, { label: string; lede: string; icon: React.ReactNode }> = {
  build: {
    label: "Costruisci",
    lede: "Dall'idea al primo MVP, al prodotto vendibile.",
    icon: <Wrench className="size-3.5" aria-hidden="true" />,
  },
  create: {
    label: "Crea",
    lede: "Contenuti, formazione, brand. Output ripetibili, non one-off.",
    icon: <Sparkles className="size-3.5" aria-hidden="true" />,
  },
  operate: {
    label: "Gestisci",
    lede: "Operazioni, supporto, agenti, agenzie. Mossa che scala.",
    icon: <Cog className="size-3.5" aria-hidden="true" />,
  },
  grow: {
    label: "Cresci",
    lede: "Acquisizione, distribuzione, lead qualificati. Il motore.",
    icon: <TrendingUp className="size-3.5" aria-hidden="true" />,
  },
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

  // Group the remaining by visual-identity.group.
  const groups: Record<GroupKey, CuratedCollection[]> = {
    build: [],
    create: [],
    operate: [],
    grow: [],
  };
  for (const collection of rest) {
    const identity = collectionVisualIdentity[collection.slug];
    const group: GroupKey = identity?.group ?? "build";
    groups[group].push(collection);
  }

  return (
    <div className="cx-index">
      <div className="cx-index__inner">
        <header className="cx-index__masthead motion-reveal">
          <div>
            <span className="cx-index__eyebrow">
              <span className="cx-index__eyebrow-dot" aria-hidden="true" />
              Percorsi
            </span>
            <h1 className="cx-index__title">
              Scegli il <em>percorso</em>, non un altro elenco di tool.
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

        <section className="cx-index__discover motion-reveal">
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

        {lead && (
          <section
            aria-labelledby="cx-start-here-heading"
            className="cx-index__start motion-reveal"
          >
            <div className="cx-index__section-title">
              <h2 id="cx-start-here-heading">In evidenza</h2>
              <p>La raccolta da cui partire oggi</p>
            </div>
            <div className="cx-index__grid cx-index__grid--lead">
              <CollectionCardV4 collection={lead} featured />
            </div>
          </section>
        )}

        <MemberPreviewGate
          title="Continua nel tuo spazio"
          body="Le altre raccolte — stack completi, varianti e quando non usarle — restano nel tuo spazio."
        >
        {cxGroupOrder.map((groupKey) => {
          const items = groups[groupKey];
          if (items.length === 0) return null;
          const meta = GROUP_LABELS[groupKey];
          return (
            <section
              key={groupKey}
              aria-labelledby={`cx-group-${groupKey}-heading`}
              className="cx-index__group"
              data-cx-group={groupKey}
            >
              <div className="cx-index__group-header">
                <span className="cx-index__group-eyebrow">
                  {meta.icon}
                  {meta.label}
                </span>
                <h2
                  id={`cx-group-${groupKey}-heading`}
                  className="cx-index__group-title"
                >
                  {meta.label}
                </h2>
                <p className="cx-index__group-lede">{meta.lede}</p>
              </div>
              <div className="cx-index__grid cx-index__grid--group motion-stagger">
                {items.map((collection) => (
                  <CollectionCardV4
                    key={collection.slug}
                    collection={collection}
                  />
                ))}
              </div>
            </section>
          );
        })}
        </MemberPreviewGate>

        <section
          aria-labelledby="cx-principles-heading"
          className="cx-index__principles motion-reveal"
        >
          <div className="cx-index__section-title">
            <h2 id="cx-principles-heading">Come leggere una raccolta</h2>
            <p>Tre cose da cercare sempre</p>
          </div>
          <div className="cx-index__principles-grid motion-stagger">
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
