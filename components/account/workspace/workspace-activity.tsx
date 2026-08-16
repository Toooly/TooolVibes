"use client";

import { deriveWorkspaceActivity } from "@/lib/account/workspace-pipeline";
import { usePublicToolCatalog } from "@/lib/data/public-tool-catalog-context";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { toolName } from "./workspace-tool-name";

const KIND_LABEL = {
  saved: "Salvataggio",
  compared: "Confronto",
  decision: "Decisione",
  stack: "Stack",
  journal: "Nota",
} as const;

export function WorkspaceActivity({ state }: { state: WorkspaceStateV1 }) {
  const catalog = usePublicToolCatalog();
  const items = deriveWorkspaceActivity(state).slice(0, 20);

  if (items.length === 0) {
    return (
      <section className="tv-space-card">
        <p className="account-label">Attività</p>
        <h2 className="tv-space-card__title">Ancora nulla da riprendere</h2>
        <p className="tv-space-card__body">
          Quando salvi, confronti o decidi, qui compare il filo recente. Non è un log tecnico.
        </p>
      </section>
    );
  }

  return (
    <section className="tv-space-card">
      <p className="account-label">Attività</p>
      <ul className="tv-space-list">
        {items.map((item) => (
          <li key={`${item.kind}-${item.slug ?? item.stackId ?? item.at}`} className="tv-space-row">
            <span>
              {KIND_LABEL[item.kind]}
              {item.slug ? ` · ${toolName(catalog, item.slug)}` : ""}
            </span>
            <span className="tv-space-row__meta">{item.at.slice(0, 10)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
