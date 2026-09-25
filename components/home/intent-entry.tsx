"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

export function IntentEntry() {
  const [locking, setLocking] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const preferReducedMotion = useReducedMotion();
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
        aria-label="Cerca nel catalogo"
        onSubmit={onSubmit}
        data-locking={locking ? "" : undefined}
      >
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
            placeholder="Cerca tool, categoria, uso..."
            autoComplete="off"
            aria-label="Cerca tool, categoria, uso"
          />
          <button type="submit" aria-label="Cerca">
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
