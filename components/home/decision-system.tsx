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

function documentOffsetTop(el: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

function useDecisionNarrative(reduced: boolean) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [stage, setStage] = useState<DecisionLifecycleStage>(reduced ? "ricorda" : "scopri");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reduced) {
      root.style.setProperty("--decision-progress", "1");
      setStage("ricorda");
      return;
    }

    const beats = Array.from(root.querySelectorAll<HTMLElement>("[data-beat]"));
    let origin = 0;
    let span = 1;
    let beatTops: number[] = [];
    let frame = 0;
    const layout = () => {
      origin = documentOffsetTop(root);
      span = Math.max(root.offsetHeight - (window.innerHeight || 1), 1);
      beatTops = beats.map(documentOffsetTop);
    };
    const paint = () => {
      const progress = Math.min(1, Math.max(0, (window.scrollY - origin) / span));
      root.style.setProperty("--decision-progress", progress.toFixed(4));
      const focus = window.scrollY + (window.innerHeight || 1) * 0.5;
      let idx = 0;
      for (let i = 0; i < beatTops.length; i += 1) {
        if (focus >= beatTops[i]) idx = i;
      }
      const next = DECISION_LIFECYCLE[idx] ?? "scopri";
      setStage((prev) => (prev === next ? prev : next));
    };
    layout();
    paint();
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    const onResize = () => {
      layout();
      paint();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return { rootRef, stage };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function scoreLabelFor(tool: ToolPublicView | null) {
  if (!tool) return "—";
  const score = computeEditorialScore(tool);
  return score.status === "assessed" && score.value !== null ? score.value.toFixed(1) : "—";
}

export function DecisionSystem({ tools }: { tools: ToolPublicView[] }) {
  const reducedPref = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const reduced = mounted && reducedPref;
  const { rootRef, stage } = useDecisionNarrative(reduced);
  const stageIndex = DECISION_LIFECYCLE.indexOf(stage);
  const left = tools[0] ?? null;
  const right = tools[1] ?? null;

  return (
    <section
      ref={rootRef}
      className="def-decision"
      aria-labelledby="def-decision-title"
      data-stage={stage}
      data-tv-surface="dark"
      data-reduced={reduced ? "" : undefined}
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

      <div className="def-decision__sticky">
        <div className="def-decision__path" aria-hidden="true">
          <span className="def-decision__path-fill" />
        </div>

        <div className="def-decision__story" aria-label="Trasformazione del candidato">
          <CandidateObject tool={left} role="a" />
          <p className="def-decision__vs" aria-hidden="true">
            VS
          </p>
          <CandidateObject tool={right} role="b" />
          <p className="def-decision__memory">
            Ricorda il motivo. Tra tre mesi la scheda vince sul ricordo.
          </p>
        </div>

        <ol className="def-decision__rail" aria-label="Ciclo di decisione">
          {DECISION_LIFECYCLE.map((item, index) => {
            const state =
              index < stageIndex ? "done" : index === stageIndex ? "active" : "idle";
            return (
              <li key={item} data-step={item} data-state={state}>
                <span className="def-decision__index tv-type-data" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{DECISION_LIFECYCLE_LABELS[item]}</strong>
              </li>
            );
          })}
        </ol>

        <p className="def-decision__copy" aria-live="polite">
          {DECISION_LIFECYCLE_COPY[stage]}
        </p>

        <p className="def-decision__choice">
          Una scelta è un trade-off visibile, non una lista più lunga.
        </p>

        <Link href={STAGE_HREF[stage]} className="def-decision__compare-cta">
          {stageIndex >= 2 ? "Apri il confronto" : `Apri ${DECISION_LIFECYCLE_LABELS[stage]}`}
        </Link>
      </div>

      <div className="def-decision__runway" aria-hidden="true">
        {DECISION_LIFECYCLE.map((item) => (
          <div key={item} className="def-decision__beat" data-beat={item} />
        ))}
      </div>

      <DecisionJourney />
    </section>
  );
}

function CandidateObject({
  tool,
  role,
}: {
  tool: ToolPublicView | null;
  role: "a" | "b";
}) {
  const name = tool?.name ?? (role === "a" ? "Candidato" : "Alternativa");
  const meta = tool?.levelLabel ?? tool?.categoryLabel ?? "Catalogo";
  return (
    <article className={`def-decision__object def-decision__object--${role}`}>
      <span className="def-decision__object-mark" aria-hidden="true">
        {initials(name)}
      </span>
      <h3>{name}</h3>
      <p className="def-decision__object-meta">{meta}</p>
      <p className="def-decision__object-score">
        <span className="tv-type-data">{scoreLabelFor(tool)}</span>
        <span>valutazione</span>
      </p>
      <p className="def-decision__object-why">Perché: resta la scheda, non l&apos;impressione.</p>
    </article>
  );
}
