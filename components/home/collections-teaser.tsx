"use client";

import {
  HomeStacks,
  type HomeStackPreview,
} from "@/components/home/start-here";
import { useOnceInView } from "@/lib/motion/use-once-in-view";

export function CollectionsTeaser({ stacks }: { stacks: HomeStackPreview[] }) {
  const { ref, hasBeenVisible } = useOnceInView<HTMLElement>({ threshold: 0.2 });
  return (
    <section
      ref={ref}
      className="def-stack-teaser"
      aria-labelledby="def-stack-teaser-title"
      data-tv-surface="dark"
      data-assembled={hasBeenVisible ? "" : undefined}
    >
      <header className="def-stack-teaser__head">
        <p className="def-stack-teaser__kicker">Raccolte</p>
        <h2 id="def-stack-teaser-title" className="def-stack-teaser__title">
          Non ti serve un tool. Ti serve un sistema.
        </h2>
        <p className="def-stack-teaser__lede">
          Una raccolta è un percorso operativo: bisogno, ruoli, connessioni.
        </p>
      </header>
      <HomeStacks stacks={stacks} />
    </section>
  );
}
