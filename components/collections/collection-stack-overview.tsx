import Link from "next/link";
import { ArrowRight, GitBranch, GitMerge, CornerDownRight } from "lucide-react";

import type { CuratedCollection, ResolvedCollectionToolSlot } from "@/lib/types/collection";
import { getCollectionCoreSlots, getCollectionOptionalSlots, getCollectionAlternativeSlots } from "@/lib/collections/helpers";

type CollectionStackOverviewProps = {
  collection: CuratedCollection;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SlotNode({ slot, index }: { slot: ResolvedCollectionToolSlot; index: number }) {
  const toolHref = `/toools/${slot.tool.slug}`;
  const guideHref = slot.relevant_guide_slug ? `/posts/${slot.relevant_guide_slug}` : null;
  const isLast = false;
  const isManual = slot.manual_handoff === true;
  const hasHandoff = Boolean(slot.next_handoff);

  return (
    <div className="cx-stack__node">
      <div className="cx-stack__node-marker" aria-hidden="true">
        <span className="cx-stack__node-no">{String(index + 1).padStart(2, "0")}</span>
        <span className={cx("cx-stack__node-line", isLast && "cx-stack__node-line--end")} />
      </div>
      <div className="cx-stack__node-body">
        <article className="cx-stack__node-card">
          <div className="cx-stack__node-stage">
            {slot.stage ? (
              <>
                <span className="cx-stack__node-stage-no" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {slot.stage}
              </>
            ) : (
              <>
                <span className="cx-stack__node-stage-no" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                Passaggio {index + 1}
              </>
            )}
          </div>
          <div className="cx-stack__node-title">
            <h3 className="cx-stack__node-role">{slot.role}</h3>
            <Link href={toolHref} className="cx-stack__node-tool">
              {slot.tool.name}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <span className="cx-stack__node-tool-cat">{slot.tool.category}</span>
          </div>
          {slot.why_chosen && <p className="cx-stack__node-why">{slot.why_chosen}</p>}
          {(slot.input || slot.output) && (
            <dl className="cx-stack__node-flow" aria-label="Input e output">
              {slot.input && (
                <div>
                  <dt>↓ Entra</dt>
                  <dd>{slot.input}</dd>
                </div>
              )}
              <div className="cx-stack__node-flow-arrow" aria-hidden="true">
                <CornerDownRight className="size-3.5" />
              </div>
              {slot.output && (
                <div>
                  <dt>↑ Esce</dt>
                  <dd>{slot.output}</dd>
                </div>
              )}
            </dl>
          )}
          {hasHandoff && (
            <span
              className={cx(
                "cx-stack__node-handoff",
                isManual && "cx-stack__node-handoff--manual"
              )}
              title={
                isManual
                  ? "Passaggio manuale: copy-paste / export tra i due tool"
                  : "L'output passa al tool successivo"
              }
            >
              {isManual ? "Handoff manuale" : "Handoff"}
              {isManual ? (
                <GitMerge className="size-3" aria-hidden="true" />
              ) : (
                <ArrowRight className="size-3" aria-hidden="true" />
              )}
              {slot.next_handoff}
            </span>
          )}
          {guideHref && (
            <div className="cx-stack__node-actions">
              <Link href={guideHref}>
                Approfondisci {slot.tool.name}
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

export function CollectionStackOverview({ collection }: CollectionStackOverviewProps) {
  const cores = getCollectionCoreSlots(collection);
  const optionals = getCollectionOptionalSlots(collection);
  const alternatives = getCollectionAlternativeSlots(collection);

  return (
    <section
      id="cx-stack-overview"
      className="cx-stack"
      aria-labelledby="cx-stack-title"
    >
      <header className="cx-stack__head">
        <span className="cx-stack__eyebrow">
          <GitBranch className="size-3.5" aria-hidden="true" />
          Lo stack
        </span>
        <h2 id="cx-stack-title" className="cx-stack__title">
          Il flusso, in ordine
        </h2>
        <p className="cx-stack__lede">
          {collection.rationale}
        </p>
      </header>

      {cores.length > 0 && (
        <div className="cx-stack__rail" aria-label="Stack CORE">
          {cores.map((slot, index) => (
            <SlotNode
              key={`core-${slot.tool.slug}`}
              slot={slot}
              index={index}
            />
          ))}
        </div>
      )}

      {optionals.length > 0 && (
        <div className="cx-stack__optional">
          <span className="cx-stack__subgroup-eyebrow">
            <span className="cx-stack__subgroup-pill cx-stack__subgroup-pill--optional">
              OPZIONALE
            </span>
            Aggiungi solo se serve davvero
          </span>
          <div className="cx-stack__subgroup-grid">
            {optionals.map((slot) => (
              <article key={`opt-${slot.tool.slug}`} className="cx-stack__subgroup-card">
                <header className="cx-stack__subgroup-card-head">
                  <Link
                    href={`/toools/${slot.tool.slug}`}
                    className="cx-stack__subgroup-card-tool"
                  >
                    {slot.tool.name}
                  </Link>
                  <span className="cx-stack__subgroup-card-role">{slot.stage ?? "Opzionale"}</span>
                </header>
                {slot.note && (
                  <p className="cx-stack__subgroup-card-note">{slot.note}</p>
                )}
                {slot.when_to_skip && (
                  <p className="cx-stack__subgroup-card-when">
                    <strong>Quando saltarlo</strong>
                    {slot.when_to_skip}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="cx-stack__alternative">
          <span className="cx-stack__subgroup-eyebrow">
            <span className="cx-stack__subgroup-pill cx-stack__subgroup-pill--alternative">
              ALTERNATIVA
            </span>
            Sostituisce, non aggiunge
          </span>
          <div className="cx-stack__subgroup-grid">
            {alternatives.map((slot) => {
              const replaces = slot.alternatives ?? [];
              const replacesNames = replaces
                .map((slug) => collection.included_tools.find((s) => s.tool.slug === slug)?.tool.name ?? slug)
                .filter(Boolean);
              return (
                <article
                  key={`alt-${slot.tool.slug}`}
                  className="cx-stack__subgroup-card"
                >
                  <header className="cx-stack__subgroup-card-head">
                    <Link
                      href={`/toools/${slot.tool.slug}`}
                      className="cx-stack__subgroup-card-tool"
                    >
                      {slot.tool.name}
                    </Link>
                    <span className="cx-stack__subgroup-card-role">
                      {slot.stage ?? "Alternativa"}
                    </span>
                  </header>
                  {slot.note && (
                    <p className="cx-stack__subgroup-card-note">{slot.note}</p>
                  )}
                  {replacesNames.length > 0 && (
                    <p className="cx-stack__subgroup-card-when">
                      <strong>Sostituisce</strong>
                      {replacesNames.join(", ")}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
