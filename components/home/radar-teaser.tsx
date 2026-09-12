"use client";

import { HomeRadarPreview } from "@/components/radar/radar-experience";
import { useOnceInView } from "@/lib/motion/use-once-in-view";

export function RadarTeaser() {
  const { ref, hasBeenVisible } = useOnceInView<HTMLElement>({ threshold: 0.2 });
  return (
    <section
      ref={ref}
      className="def-radar-teaser"
      aria-labelledby="def-radar-teaser-title"
      data-tv-surface="signal"
      data-assembled={hasBeenVisible ? "" : undefined}
    >
      <header className="def-radar-teaser__head">
        <p className="def-radar-teaser__kicker">Signal</p>
        <h2 id="def-radar-teaser-title" className="def-radar-teaser__title">
          Intelligenza live, anche quando i segnali sono pochi.
        </h2>
        <p className="def-radar-teaser__lede">
          Radar legge i lanci reali. Nessun grafico inventato, nessuna griglia di trattini.
        </p>
      </header>
      <HomeRadarPreview />
    </section>
  );
}
