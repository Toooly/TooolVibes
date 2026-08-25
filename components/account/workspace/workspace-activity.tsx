"use client";

import Link from "next/link";

import {
  deriveWorkspaceActivity,
  type DerivedActivityItem,
} from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { formatWorkspaceDate, workspaceViewHref } from "./workspace-model";
import { WorkspaceCatalogMark } from "./workspace-tool-mark";
import { WorkspaceEmptyMotif } from "./workspace-visual";
import { toolName } from "./workspace-tool-name";

const KIND_LABEL = {
  saved: "Salvataggio",
  compared: "Confronto",
  decision: "Decisione",
  stack: "Stack",
  journal: "Nota",
} as const;

function activityHref(item: DerivedActivityItem) {
  if (item.kind === "compared") return "/compare";
  if (item.kind === "saved") return workspaceViewHref("biblioteca");
  if (item.kind === "stack") return workspaceViewHref("stack");
  return workspaceViewHref("decisioni");
}

export function WorkspaceActivity({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const items = deriveWorkspaceActivity(state).slice(0, 20);

  if (items.length === 0) {
    return (
      <section className="tv-recenti" aria-labelledby="tv-recenti-title">
        <WorkspaceEmptyMotif variant="journal" />
        <p className="account-label">Recenti</p>
        <h2 id="tv-recenti-title" className="tv-recenti__title">
          Ancora niente di recente
        </h2>
        <p className="tv-recenti__copy">
          Quando salvi, confronti o decidi, il filo compare qui.
        </p>
      </section>
    );
  }

  return (
    <section className="tv-recenti" aria-labelledby="tv-recenti-title">
      <p className="account-label">Recenti</p>
      <h2 id="tv-recenti-title" className="sr-only">
        Recenti
      </h2>
      <ul className="tv-recenti-list">
        {items.map((item) => {
          const when = formatWorkspaceDate(item.at);
          return (
            <li key={`${item.kind}-${item.slug ?? item.stackId ?? item.at}`}>
              <Link className="tv-recenti-row" href={activityHref(item)}>
                {item.slug ? (
                  <WorkspaceCatalogMark catalog={catalog} slug={item.slug} size="sm" />
                ) : (
                  <span className="tv-tool-mark tv-tool-mark--sm" aria-hidden="true" />
                )}
                <span>
                  {KIND_LABEL[item.kind]}
                  {item.slug ? ` · ${toolName(catalog, item.slug)}` : ""}
                </span>
                {when ? <span className="tv-recenti-row__meta">{when}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
