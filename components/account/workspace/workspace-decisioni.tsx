"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  composeDecisionMemory,
  currentDecisionMemories,
  type DecisionMemoryItem,
} from "@/lib/account/decision-memory";
import { OUTCOME_STATE_LABELS } from "@/lib/account/workspace-lifecycle";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { DecisionSheet } from "./decision-sheet";
import { formatWorkspaceDate, workspaceViewHref } from "./workspace-model";
import { WorkspaceToolMark } from "./workspace-tool-mark";

function nameOf(names: Map<string, string>, slug: string) {
  return names.get(slug) ?? slug;
}

function DecisionCard({
  item,
  names,
  onReview,
}: {
  item: DecisionMemoryItem;
  names: Map<string, string>;
  onReview: (slug: string) => void;
}) {
  const vs = item.vsSlugs.map((slug) => nameOf(names, slug)).filter(Boolean);
  return (
    <article className="tv-mod" data-decision-card={item.status}>
      <p className="tv-home-copy">
        {OUTCOME_STATE_LABELS[item.outcome]}
        {item.status === "review" ? " · da rivedere" : ""}
        {item.at ? ` · ${formatWorkspaceDate(item.at)}` : ""}
      </p>
      <h3 className="tv-home-title">
        <WorkspaceToolMark slug={item.slug} name={nameOf(names, item.slug)} size="sm" />{" "}
        {nameOf(names, item.slug)}
      </h3>
      {vs.length > 0 ? (
        <p className="tv-home-copy">Scelto rispetto a {vs.join(", ")}</p>
      ) : (
        <p className="tv-home-copy">Senza alternative registrate.</p>
      )}
      {item.reason ? <p className="tv-home-copy">{item.reason}</p> : null}
      {item.useCase ? <p className="tv-home-copy">Contesto: {item.useCase}</p> : null}
      <div className="tv-home-actions">
        <Link className="tv-home-textbtn" href={`/toools/${item.slug}`}>
          Apri scheda
        </Link>
        <button type="button" className="tv-home-cta" onClick={() => onReview(item.slug)}>
          Rivedi
        </button>
      </div>
    </article>
  );
}

export function WorkspaceDecisioni({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const names = useMemo(
    () => new Map(catalog.map((tool) => [tool.slug, tool.name])),
    [catalog],
  );
  const current = currentDecisionMemories(state);
  const history = composeDecisionMemory(state);
  const [reviewSlug, setReviewSlug] = useState<string | null>(null);
  const reviewName = reviewSlug ? nameOf(names, reviewSlug) : "";
  const reviewAlts =
    history.find((item) => item.slug === reviewSlug)?.vsSlugs ??
    state.toolStates[reviewSlug ?? ""]?.alternatives ??
    [];

  if (history.length === 0) {
    return (
      <section className="tv-mod tv-mod--resume" aria-labelledby="tv-decisioni-empty">
        <h2 id="tv-decisioni-empty" className="tv-home-title">
          Quando scegli un tool, salva anche il perché.
        </h2>
        <p className="tv-home-copy">Lo ritroverai qui, con le alternative che avevi scartato.</p>
        <div className="tv-home-actions">
          <Link className="tv-home-cta tv-home-cta--primary" href="/compare">
            Crea la prima decisione
          </Link>
          <Link className="tv-home-textbtn" href={workspaceViewHref("salvati")}>
            Parti dai Salvati
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="tv-home">
      <section className="tv-mod" aria-labelledby="tv-decisioni-current">
        <h2 id="tv-decisioni-current" className="tv-home-title">
          In corso
        </h2>
        {current.length === 0 ? (
          <p className="tv-home-copy">Nessuna decisione aperta. Lo storico resta sotto.</p>
        ) : (
          <div className="tv-home-stack">
            {current.map((item) => (
              <DecisionCard
                key={item.id}
                item={item}
                names={names}
                onReview={setReviewSlug}
              />
            ))}
          </div>
        )}
      </section>
      <section className="tv-mod" aria-labelledby="tv-decisioni-history">
        <h2 id="tv-decisioni-history" className="tv-home-title">
          Storico
        </h2>
        <div className="tv-home-stack">
          {history.map((item) => (
            <DecisionCard key={item.id} item={item} names={names} onReview={setReviewSlug} />
          ))}
        </div>
      </section>
      {reviewSlug ? (
        <DecisionSheet
          open
          onOpenChange={(open) => {
            if (!open) setReviewSlug(null);
          }}
          slug={reviewSlug}
          toolName={reviewName}
          alternatives={reviewAlts}
          source="home"
        />
      ) : null}
    </div>
  );
}
