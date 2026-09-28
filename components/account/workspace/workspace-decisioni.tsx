"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  composeDecisionMemory,
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

function DecisionRow({
  item,
  names,
  onReview,
}: {
  item: DecisionMemoryItem;
  names: Map<string, string>;
  onReview: (slug: string) => void;
}) {
  const statusLabel =
    item.outcome === "selected"
      ? OUTCOME_STATE_LABELS.selected
      : item.outcome === "rejected"
        ? OUTCOME_STATE_LABELS.rejected
        : OUTCOME_STATE_LABELS.deferred;
  return (
    <li className="tv-decision-row">
      <span className="tv-decision-row__mark" aria-hidden="true">
        <WorkspaceToolMark slug={item.slug} name={nameOf(names, item.slug)} size="sm" />
      </span>
      <span className="tv-decision-row__body">
        <strong className="tv-decision-row__name">{nameOf(names, item.slug)}</strong>
        <span className="tv-decision-row__status">
          {statusLabel}
          {item.status === "review" ? " · da rivedere" : ""}
        </span>
        {item.at ? (
          <span className="tv-decision-row__meta">{formatWorkspaceDate(item.at)}</span>
        ) : null}
        {item.reason ? (
          <span className="tv-decision-row__note">{item.reason}</span>
        ) : item.useCase ? (
          <span className="tv-decision-row__note">{item.useCase}</span>
        ) : null}
      </span>
      <button
        type="button"
        className="tv-decision-row__action"
        aria-label={`Rivedi la decisione su ${nameOf(names, item.slug)}`}
        onClick={() => onReview(item.slug)}
      >
        Rivedi
      </button>
    </li>
  );
}

export function WorkspaceDecisioni({
  state,
  focusSlug = null,
}: {
  state: WorkspaceStateV1;
  focusSlug?: string | null;
}) {
  const catalog = usePublicToolCatalog();
  const names = useMemo(
    () => new Map(catalog.map((tool) => [tool.slug, tool.name])),
    [catalog],
  );
  const allDecisions = composeDecisionMemory(state);
  const [reviewSlug, setReviewSlug] = useState<string | null>(focusSlug);
  const [filter, setFilter] = useState<"tutte" | "scelte" | "rimandate" | "scartate">("tutte");
  useEffect(() => {
    if (focusSlug) setReviewSlug(focusSlug);
  }, [focusSlug]);
  const reviewName = reviewSlug ? nameOf(names, reviewSlug) : "";
  const reviewAlts =
    allDecisions.find((item) => item.slug === reviewSlug)?.vsSlugs ??
    state.toolStates[reviewSlug ?? ""]?.alternatives ??
    [];

  if (allDecisions.length === 0) {
    return (
      <>
      <section
        className="tv-mod tv-mod--resume"
        data-workspace-view="decisioni"
        aria-labelledby="tv-decisioni-empty"
      >
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
    </>
    );
  }

  const reviewCount = allDecisions.filter((item) => item.status === "review").length;
  const visibleDecisions = allDecisions.filter((item) => {
    if (filter === "scelte") return item.outcome === "selected";
    if (filter === "rimandate") return item.outcome === "deferred";
    if (filter === "scartate") return item.outcome === "rejected";
    return true;
  });

  return (
    <div className="tv-home" data-workspace-view="decisioni">
      <p className="tv-decisions__summary" aria-live="polite">
        {allDecisions.length === 1
          ? "1 decisione"
          : `${allDecisions.length} decisioni`}
        {reviewCount > 0 ? ` · ${reviewCount} da rivedere` : ""}
      </p>

      <div className="tv-decisions__filters" role="group" aria-label="Filtra decisioni">
        {(
          [
            ["tutte", "Tutte"],
            ["scelte", "Scelte"],
            ["rimandate", "Rimandate"],
            ["scartate", "Scartate"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            className={filter === id ? "is-active" : undefined}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="tv-decisions" aria-label="Decisioni">
        <ul className="tv-decision-list">
          {visibleDecisions.map((item) => (
            <DecisionRow key={item.id} item={item} names={names} onReview={setReviewSlug} />
          ))}
        </ul>
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
