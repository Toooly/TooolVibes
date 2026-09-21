"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { DISCOVERY_INTENTS } from "@/lib/product/discovery-intents";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

const PRIMARY_INTENT_COUNT = 3;

export function IntentEntry() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const preferReducedMotion = useReducedMotion();
  const extraIntents = DISCOVERY_INTENTS.length > PRIMARY_INTENT_COUNT;
  const setHeroSearchVisible = useMobileUIStore((s) => s.setHeroSearchVisible);

  useEffect(() => {
    const node = fieldRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setHeroSearchVisible(true);
      return () => setHeroSearchVisible(false);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroSearchVisible(entry.isIntersecting);
      },
      { threshold: 0.45, rootMargin: "-12% 0px -40% 0px" },
    );
    observer.observe(node);
    setHeroSearchVisible(true);
    return () => {
      observer.disconnect();
      setHeroSearchVisible(false);
    };
  }, [setHeroSearchVisible]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") ?? "").trim();
    const dest = query
      ? `/archivio?q=${encodeURIComponent(query)}`
      : "/archivio";

    if (preferReducedMotion) {
      if (!query) {
        event.preventDefault();
        window.location.assign(dest);
      }
      return;
    }

    event.preventDefault();
    setLocking(true);
    window.setTimeout(() => {
      window.location.assign(dest);
    }, 280);
  }

  return (
    <div className="def-intent">
      <form
        className="def-intent__form"
        action="/archivio"
        method="get"
        role="search"
        onSubmit={onSubmit}
        data-locking={locking ? "" : undefined}
      >
        <label className="def-intent__label" htmlFor="home-intent-query">
          Cosa vuoi fare?
        </label>
        <p className="def-intent__hint" id="home-intent-hint">
          Cerca per obiettivo, nome o categoria.
        </p>
        <div
          ref={fieldRef}
          className="def-intent__field tv-emphasis tv-emphasis--search tv-signal-search"
          data-tv-signal-search=""
          data-locking={locking ? "" : undefined}
        >
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
            Cerca<span className="def-intent__submit-rest"> nel catalogo</span>
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
            <a href={intent.href}>
              {index < PRIMARY_INTENT_COUNT ? intent.shortLabel : intent.label}
            </a>
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
              <span aria-hidden="true">+ </span>Altri obiettivi
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
