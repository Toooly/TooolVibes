"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

import { DISCOVERY_INTENTS } from "@/lib/product/discovery-intents";

const PRIMARY_INTENT_COUNT = 3;

export function IntentEntry() {
  const [moreOpen, setMoreOpen] = useState(false);
  const extraIntents = DISCOVERY_INTENTS.length > PRIMARY_INTENT_COUNT;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") ?? "").trim();
    if (query) return;
    event.preventDefault();
    window.location.assign("/archivio");
  }

  return (
    <div className="def-intent">
      <form
        className="def-intent__form"
        action="/archivio"
        method="get"
        role="search"
        onSubmit={onSubmit}
      >
        <label className="def-intent__label" htmlFor="home-intent-query">
          Cosa vuoi fare?
        </label>
        <p className="def-intent__hint" id="home-intent-hint">
          Filtra il catalogo per obiettivo, nome o categoria. Non interpreta frasi libere.
        </p>
        <div className="def-intent__field tv-emphasis tv-emphasis--search">
          <Search size={16} aria-hidden="true" />
          <input
            id="home-intent-query"
            type="search"
            name="q"
            placeholder="Cerca un tool o un obiettivo…"
            autoComplete="off"
            aria-describedby="home-intent-hint"
          />
          <button type="submit">
            <span className="def-intent__submit-desktop">Cerca nel catalogo</span>
            <span className="def-intent__submit-mobile">Cerca</span>
          </button>
        </div>
      </form>
      <ul className="def-intent__chips" id="home-intent-extra" aria-label="Obiettivi del catalogo">
        {DISCOVERY_INTENTS.map((intent, index) => (
          <li
            key={intent.id}
            hidden={index >= PRIMARY_INTENT_COUNT && !moreOpen}
            data-intent-extra={index >= PRIMARY_INTENT_COUNT ? "" : undefined}
          >
            <a href={intent.href}>{intent.label}</a>
          </li>
        ))}
        {extraIntents ? (
          <li>
            <button
              type="button"
              className="def-intent__more"
              aria-expanded={moreOpen}
              aria-controls="home-intent-extra"
              onClick={() => setMoreOpen((open) => !open)}
            >
              Altri obiettivi
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
