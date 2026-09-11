"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DecisionJourney } from "@/components/home/decision-journey";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  DECISION_LIFECYCLE,
  DECISION_LIFECYCLE_COPY,
  DECISION_LIFECYCLE_LABELS,
  type DecisionLifecycleStage,
} from "@/lib/product/decision-lifecycle";

const STAGE_HREF = {
  scopri: "/archivio",
  valuta: "/archivio",
  confronta: "/compare",
  decidi: "/compare",
  ricorda: "/shortlist",
} as const;

function stageFromProgress(progress: number): DecisionLifecycleStage {
  const index = Math.min(
    DECISION_LIFECYCLE.length - 1,
    Math.floor(progress * DECISION_LIFECYCLE.length),
  );
  return DECISION_LIFECYCLE[index];
}

function useDecisionProgress(reduced: boolean) {
  const trackRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }

    const el = trackRef.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const desktop =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(min-width: 1024px)").matches;
      if (desktop) {
        const usable = Math.max(rect.height - vh, 1);
        setProgress(Math.min(1, Math.max(0, -rect.top / usable)));
        return;
      }
      const start = vh * 0.82;
      const span = Math.max(rect.height - vh * 0.28, 1);
      setProgress(Math.min(1, Math.max(0, (start - rect.top) / span)));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  return { trackRef, progress };
}

export function DecisionSystem({ tools }: { tools: ToolPublicView[] }) {
  const reducedPref = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const reduced = mounted && reducedPref;
  const { trackRef, progress } = useDecisionProgress(reduced);
  const stage = reduced ? "ricorda" : stageFromProgress(progress);
  const stageIndex = DECISION_LIFECYCLE.indexOf(stage);
  const left = tools[0] ?? null;
  const right = tools[1] ?? null;
  const showCompare = Boolean(left && right && stageIndex >= 2);
  const showMemory = stageIndex >= 4;

  return (
    <section
      ref={trackRef}
      className="def-decision"
      aria-labelledby="def-decision-title"
      data-stage={stage}
      data-reduced={reduced ? "" : undefined}
      style={{ ["--decision-progress" as string]: String(progress) }}
    >
      <div className="def-decision__stage">
        <header className="def-decision__head">
          <p className="def-decision__kicker">TooolVibes Decision System</p>
          <h2 id="def-decision-title" className="def-decision__title">
            Scopri, valuta, confronta, decidi, ricorda.
          </h2>
          <p className="def-decision__lede">
            Cinque tappe distinte. Scegliere e ricordare il motivo non sono la stessa cosa.
          </p>
        </header>

        <div className="def-decision__path" aria-hidden="true">
          <span className="def-decision__path-fill" />
        </div>

        <ol className="def-decision__timeline" aria-label="Ciclo di decisione">
          {DECISION_LIFECYCLE.map((item, index) => {
            const state =
              index < stageIndex ? "done" : index === stageIndex ? "active" : "idle";
            return (
              <li
                key={item}
                className="def-decision__node"
                data-step={item}
                data-state={state}
              >
                <span className="def-decision__index tv-type-data" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{DECISION_LIFECYCLE_LABELS[item]}</strong>
                <p>{DECISION_LIFECYCLE_COPY[item]}</p>
                {state !== "idle" ? (
                  <Link href={STAGE_HREF[item]}>Apri {DECISION_LIFECYCLE_LABELS[item]}</Link>
                ) : null}
              </li>
            );
          })}
        </ol>

        {showCompare && left && right ? (
          <div className="def-decision__compare" aria-label="Anteprima confronto">
            <p className="def-decision__compare-kicker">Durante Confronta</p>
            <div className="def-decision__compare-grid">
              <CompareTeaserColumn tool={left} lead={stageIndex >= 3} />
              <p className="def-decision__vs" aria-hidden="true">VS</p>
              <CompareTeaserColumn tool={right} lead={false} />
            </div>
            {stageIndex >= 3 ? (
              <p className="def-decision__choice">
                Una scelta è un trade-off visibile, non una lista più lunga.
              </p>
            ) : null}
            <Link href="/compare" className="def-decision__compare-cta">
              Apri il confronto
            </Link>
          </div>
        ) : null}

        {showMemory ? (
          <p className="def-decision__memory">
            Ricorda il motivo. Tra tre mesi la scheda vince sul ricordo.
          </p>
        ) : null}

        <DecisionJourney />
      </div>
    </section>
  );
}

function CompareTeaserColumn({
  tool,
  lead,
}: {
  tool: ToolPublicView;
  lead: boolean;
}) {
  const score = computeEditorialScore(tool);
  const scoreLabel =
    score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
  return (
    <article
      className={lead ? "def-decision__candidate def-decision__candidate--lead" : "def-decision__candidate"}
    >
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
