"use client";

import Link from "next/link";

import { DecisionJourney } from "@/components/home/decision-journey";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import {
  DECISION_LIFECYCLE,
  DECISION_LIFECYCLE_COPY,
  DECISION_LIFECYCLE_LABELS,
} from "@/lib/product/decision-lifecycle";
import { useOnceInView } from "@/lib/motion/use-once-in-view";

const STAGE_HREF = {
  scopri: "/archivio",
  valuta: "/archivio",
  confronta: "/compare",
  decidi: "/compare",
  ricorda: "/shortlist",
} as const;

export function DecisionSystem({ tools }: { tools: ToolPublicView[] }) {
  const { ref, hasBeenVisible } = useOnceInView<HTMLElement>({
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  });
  const left = tools[0] ?? null;
  const right = tools[1] ?? null;

  return (
    <section
      ref={ref}
      className="def-decision"
      aria-labelledby="def-decision-title"
      data-assembled={hasBeenVisible ? "" : undefined}
    >
      <header className="def-decision__head">
        <p className="def-decision__kicker">TooolVibes Decision System</p>
        <h2 id="def-decision-title" className="def-decision__title">
          Scopri, valuta, confronta, decidi, ricorda.
        </h2>
        <p className="def-decision__lede">
          Cinque tappe distinte. Scegliere e ricordare il motivo non sono la stessa cosa.
        </p>
      </header>

      <ol className="def-decision__timeline" aria-label="Ciclo di decisione">
        {DECISION_LIFECYCLE.map((stage, index) => (
          <li key={stage} className="def-decision__node" data-step={stage} style={{ ["--i" as string]: String(index) }}>
            <span className="def-decision__index tv-type-data" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <strong>{DECISION_LIFECYCLE_LABELS[stage]}</strong>
            <p>{DECISION_LIFECYCLE_COPY[stage]}</p>
            <Link href={STAGE_HREF[stage]}>Apri {DECISION_LIFECYCLE_LABELS[stage]}</Link>
          </li>
        ))}
      </ol>

      {left && right ? (
        <div className="def-decision__compare" aria-label="Anteprima confronto">
          <p className="def-decision__compare-kicker">Durante Confronta</p>
          <div className="def-decision__compare-grid">
            <CompareTeaserColumn tool={left} />
            <p className="def-decision__vs" aria-hidden="true">VS</p>
            <CompareTeaserColumn tool={right} />
          </div>
          <Link href="/compare" className="def-decision__compare-cta">
            Apri il confronto
          </Link>
        </div>
      ) : null}

      <DecisionJourney />
    </section>
  );
}

function CompareTeaserColumn({ tool }: { tool: ToolPublicView }) {
  const score = computeEditorialScore(tool);
  const scoreLabel =
    score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
  return (
    <article className="def-decision__candidate">
      <h3>{tool.name}</h3>
      <dl>
        <div>
          <dt>Valutazione</dt>
          <dd className="tv-type-data">{scoreLabel}</dd>
        </div>
        <div>
          <dt>Ideale per</dt>
          <dd>{tool.levelLabel ?? tool.categoryLabel}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{tool.categoryLabel}</dd>
        </div>
      </dl>
    </article>
  );
}
