"use client";

import {
  HomeStacks,
  type HomeStackPreview,
} from "@/components/home/start-here";
import { useOnceInView } from "@/lib/motion/use-once-in-view";

export function CollectionsTeaser({ stacks }: { stacks: HomeStackPreview[] }) {
  const { ref, hasBeenVisible } = useOnceInView<HTMLElement>({ threshold: 0.2 });
  const featured = stacks[0] ?? null;
  return (
    <section
      ref={ref}
      className="def-stack-teaser"
      aria-labelledby="def-stack-teaser-title"
      data-assembled={hasBeenVisible ? "" : undefined}
    >
      <header className="def-stack-teaser__head">
        <p className="def-stack-teaser__kicker">Workflow</p>
        <h2 id="def-stack-teaser-title" className="def-stack-teaser__title">
          Non ti serve un tool. Ti serve un sistema.
        </h2>
        <p className="def-stack-teaser__lede">
          Una raccolta è un percorso operativo: bisogno, ruoli, connessioni.
        </p>
      </header>
      {featured ? (
        <ol className="def-stack-teaser__assembly" aria-label={featured.title}>
          <li>
            <span>Bisogno</span>
            <strong>{featured.outcome || featured.description || featured.title}</strong>
          </li>
          {(featured.stages ?? []).slice(0, 3).map((stage, index) => (
            <li key={`${featured.slug}-${stage.name}`}>
              <span>Tool {String.fromCharCode(65 + index)}</span>
              <strong>{stage.name}</strong>
              <em>{stage.label}</em>
            </li>
          ))}
        </ol>
      ) : null}
      <HomeStacks stacks={stacks} />
    </section>
  );
}
