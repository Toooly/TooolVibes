"use client";

import Link from "next/link";

import { recommendWorkspaceTools } from "@/lib/account/personalization";
import {
  chooseResumeAction,
  deriveResurfaceSignals,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { workspaceViewHref } from "./workspace-model";
import { toolName } from "./workspace-tool-name";

const RESUME_COPY = {
  continue_compare: {
    title: "Continua il confronto",
    body: "Hai un confronto aperto. Chiudilo quando hai abbastanza evidenza.",
    href: "/compare",
  },
  review_decision: {
    title: "Rivedi questa decisione",
    body: "L’avevi rimandata. Vale la pena riprenderla ora.",
  },
  close_decision: {
    title: "Chiudi la decisione",
    body: "È tra i candidati ma non ha ancora un verdetto.",
  },
  evaluate_saved: {
    title: "Valuta questo candidato",
    body: "Salvato, ancora da passare in rassegna.",
  },
  empty: {
    title: "Il tuo spazio è pronto",
    body: "Salva un tool o apri una raccolta per iniziare una decisione.",
    href: "/archivio",
  },
} as const;

const RESURFACE_COPY = {
  stale_saved: "Salvato da tempo e mai valutato",
  open_compare: "Confronto ancora aperto",
  top_without_verdict: "In cima, senza verdetto",
  deferred_due: "Decisione rimandata da riprendere",
} as const;

export function WorkspaceRiprendi({
  state,
}: {
  state: WorkspaceStateV1;
}) {
  const catalog = usePublicToolCatalog();
  const resume = chooseResumeAction(state);
  const copy = RESUME_COPY[resume.kind];
  const resurface = deriveResurfaceSignals(state).slice(0, 3);
  const recs = recommendWorkspaceTools({ catalog, workspace: state, limit: 3 });

  return (
    <div className="tv-space-stack">
      <section className="tv-space-card tv-space-card--resume">
        <p className="account-label">Riprendi</p>
        <h2 className="tv-space-card__title">{copy.title}</h2>
        <p className="tv-space-card__body">
          {resume.slug ? `${copy.body} ${toolName(catalog, resume.slug)}.` : copy.body}
        </p>
        <div className="tv-space-actions">
          {"href" in copy && copy.href ? (
            <Link className="account-btn-primary" href={copy.href}>
              {resume.kind === "empty" ? "Apri l’archivio" : "Apri il confronto"}
            </Link>
          ) : (
            <Link
              className="account-btn-primary"
              href={workspaceViewHref(resume.kind === "evaluate_saved" ? "biblioteca" : "decisioni")}
            >
              Continua
            </Link>
          )}
          <Link className="account-btn-secondary" href={workspaceViewHref("biblioteca")}>
            Biblioteca
          </Link>
        </div>
      </section>

      {resurface.length > 0 ? (
        <section className="tv-space-card">
          <p className="account-label">Merita attenzione</p>
          <ul className="tv-space-list">
            {resurface.map((item) => (
              <li key={`${item.kind}-${item.slug ?? "none"}`}>
                <Link className="tv-space-row" href={workspaceViewHref("decisioni")}>
                  <span>{item.slug ? toolName(catalog, item.slug) : "Spazio"}</span>
                  <span className="tv-space-row__meta">{RESURFACE_COPY[item.kind]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recs.length > 0 ? (
        <section className="tv-space-card">
          <p className="account-label">Per te</p>
          <ul className="tv-space-list">
            {recs.map((item) => (
              <li key={item.slug}>
                <Link className="tv-space-row" href={`/toools/${item.slug}`}>
                  <span>{item.name}</span>
                  <span className="tv-space-row__meta">{item.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
