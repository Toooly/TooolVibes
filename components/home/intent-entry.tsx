"use client";

import { FormEvent } from "react";
import { Search } from "lucide-react";

import { DISCOVERY_INTENTS } from "@/lib/product/discovery-intents";

export function IntentEntry() {
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
        <div className="def-intent__field">
          <Search size={16} aria-hidden="true" />
          <input
            id="home-intent-query"
            type="search"
            name="q"
            placeholder="MVP, Make, video AI, WeWeb…"
            autoComplete="off"
            aria-describedby="home-intent-hint"
          />
          <button type="submit">Cerca nel catalogo</button>
        </div>
      </form>
      <ul className="def-intent__chips" aria-label="Obiettivi del catalogo">
        {DISCOVERY_INTENTS.map((intent) => (
          <li key={intent.id}>
            <a href={intent.href}>{intent.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
