"use client";

import { useState } from "react";

import {
  formatFiloSummary,
  humanizeFiloEvent,
  listFiloEvents,
  summarizeFilo,
} from "@/lib/account/workspace-filo";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

import { toolName } from "./workspace-tool-name";

export function WorkspaceFilo({
  state,
  slug,
  catalog,
  defaultOpen = false,
}: {
  state: WorkspaceStateV1;
  slug: string;
  catalog: readonly PublicToolCatalogItem[];
  defaultOpen?: boolean;
}) {
  const events = listFiloEvents(state, slug);
  const summary = summarizeFilo(state, slug);
  const label = formatFiloSummary(summary, events.length > 0);
  const [open, setOpen] = useState(defaultOpen);

  if (!label) return null;

  if (events.length === 0) {
    return <p className="tv-filo-l2">{label}</p>;
  }

  return (
    <details
      className="tv-filo"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="tv-filo__summary">{label}</summary>
      <div className="tv-filo-events">
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
