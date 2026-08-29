"use client";

import { useState } from "react";

import {
  formatFiloSummary,
  humanizeFiloEvent,
  listFiloEvents,
  summarizeFilo,
} from "@/lib/account/workspace-filo";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type {
  WorkspaceRelationshipEvent,
  WorkspaceStateV1,
} from "@/lib/discovery/types";

import { excerptPrivateNote } from "@/lib/account/private-note";
import { toolName } from "./workspace-tool-name";

export function WorkspaceFilo({
  state,
  slug,
  catalog,
  defaultOpen = false,
  events: eventsProp,
}: {
  state: WorkspaceStateV1;
  slug: string;
  catalog: readonly PublicToolCatalogItem[];
  defaultOpen?: boolean;
  events?: WorkspaceRelationshipEvent[];
}) {
  const events = eventsProp ?? listFiloEvents(state, slug);
  const summary = summarizeFilo(state, slug);
  const label = formatFiloSummary(summary, events.length > 0);
  const [open, setOpen] = useState(defaultOpen);
  const noteExcerpt = excerptPrivateNote(state.toolStates[slug]?.note);

  if (!label && !noteExcerpt) return null;

  const noteLine = noteExcerpt ? (
    <p className="tv-filo-note">Nota: {noteExcerpt}</p>
  ) : null;

  if (events.length === 0) {
    return (
      <div className="tv-filo-snapshot">
        {label ? <p className="tv-filo-l2">{label}</p> : null}
        {noteLine}
      </div>
    );
  }

  return (
    <details
      className="tv-filo"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="tv-filo__summary">{label}</summary>
      <div className="tv-filo-events">
        {noteLine}
        {events.map((event) => {
          const human = humanizeFiloEvent(event, (item) => toolName(catalog, item));
          return (
            <div key={event.id} className="tv-filo-event">
              {human.date ? (
                <span className="tv-filo-event__date">{human.date}</span>
              ) : null}
              <span className="tv-filo-event__line">{human.line}</span>
            </div>
          );
        })}
      </div>
    </details>
  );
}
