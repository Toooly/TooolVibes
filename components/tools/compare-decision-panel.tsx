"use client";

/**
 * Wave 8 — Compare decision door.
 * Live Scegli/Scarta/Rimanda form is gone. This is a thin trigger that
 * opens the canonical DecisionSheet. Commits go through
 * DecisionSheet → @/lib/account/workspace-actions.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DecisionSheet } from "@/components/account/workspace/decision-sheet";
import { MIN_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import {
  getCompareObjectiveLabel,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { emitComparisonCompleted } from "@/lib/signal-progression/client";
import type { NormalisedTool } from "./tool-battle-shared";
import { noteCompareDecision } from "./compare-workbench-ephemeral";

export type CompareDecisionPanelProps = {
  tools: NormalisedTool[];
  objective?: CompareObjective | null;
  enabled?: boolean;
  idPrefix: string;
  onDecidi?: (slug?: string | null) => void;
};

export type CompareDecisionTarget = {
  slug: string;
  toolName: string;
  accentFrom?: string;
  accentTo?: string;
  alternatives: string[];
  alternativeNames: Array<{ slug: string; name: string }>;
};

export function captureCompareDecisionTarget(
  tools: readonly Pick<NormalisedTool, "slug" | "name" | "accentFrom" | "accentTo">[],
  chosenSlug?: string | null,
): CompareDecisionTarget | null {
  const chosen =
    (chosenSlug ? tools.find((tool) => tool.slug === chosenSlug) : null) ?? tools[0] ?? null;
  if (!chosen) return null;
  const rest = tools.filter((tool) => tool.slug !== chosen.slug);
  return {
    slug: chosen.slug,
    toolName: chosen.name,
    accentFrom: chosen.accentFrom,
    accentTo: chosen.accentTo,
    alternatives: rest.map((tool) => tool.slug),
    alternativeNames: rest.map((tool) => ({ slug: tool.slug, name: tool.name })),
  };
}

export function CompareDecideSheet({
  open,
  onOpenChange,
  target,
  objective = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CompareDecisionTarget | null;
  objective?: CompareObjective | null;
}) {
  if (!target) return null;
  return (
    <DecisionSheet
      open={open}
      onOpenChange={onOpenChange}
      slug={target.slug}
      toolName={target.toolName}
      accentFrom={target.accentFrom}
      accentTo={target.accentTo}
      alternatives={target.alternatives}
      alternativeNames={target.alternativeNames}
      source="compare"
      compareObjective={objective}
      defaultOutcome="selected"
      onCommitted={({ slug }) => {
        noteCompareDecision({ slug, name: target.toolName });
        emitComparisonCompleted([slug, ...target.alternatives]);
      }}
    />
  );
}

export function useCompareDecisionDoor(
  tools: readonly Pick<NormalisedTool, "slug" | "name" | "accentFrom" | "accentTo">[],
  objective: CompareObjective | null = null,
) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<CompareDecisionTarget | null>(null);

  function openDecide(chosenSlug?: string | null) {
    const next = captureCompareDecisionTarget(tools, chosenSlug);
    if (!next) return;
    setTarget(next);
    setOpen(true);
  }

  return {
    open,
    setOpen,
    target,
    openDecide,
    sheet: (
      <CompareDecideSheet
        open={open}
        onOpenChange={setOpen}
        target={target}
        objective={objective}
      />
    ),
  };
}

export function CompareDecisionPanel({
  tools,
  objective = null,
  enabled = true,
  idPrefix,
  onDecidi,
}: CompareDecisionPanelProps) {
  const [chosenSlug, setChosenSlug] = useState(tools[0]?.slug ?? "");
  if (!enabled || tools.length < MIN_COMPARE_TOOLS || !tools[0]) return null;

  const titleId = `${idPrefix}-compare-decision-title`;
  const contextLabel = objective
    ? `Confronto orientato a ${getCompareObjectiveLabel(objective)}`
    : "Confronto generale";
  const candidateNames = tools.map((tool) => tool.name).join(", ");
  const focusTool = tools.find((tool) => tool.slug === chosenSlug) ?? tools[0];

  return (
    <section
      id="compare-decide"
      className="compare-decision-panel mt-6 rounded-[24px] border p-5"
      style={{
        borderColor: "var(--line)",
        background: "rgba(255,255,255,0.04)",
      }}
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="editorial-label">Decisione dal confronto</p>
          <h3 id={titleId} className="mt-1 text-base font-semibold">
            Registra decisione
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--tv-ink-secondary)" }}>
            {contextLabel} · {candidateNames}
          </p>
          <fieldset className="mt-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.15em]">
              Quale scegli?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {tools.map((tool) => (
                <label key={tool.slug} className="selection-chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
                  <input
                    type="radio"
                    name={`${idPrefix}-chosen`}
                    value={tool.slug}
                    checked={chosenSlug === tool.slug}
                    onChange={() => setChosenSlug(tool.slug)}
                  />
                  {tool.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              borderColor: "rgba(112,82,255,0.24)",
              background: "rgba(112,82,255,0.2)",
              color: "var(--tv-ink-primary)",
            }}
            onClick={() => onDecidi?.(chosenSlug)}
          >
            Decidi
          </button>
          <Link
            href={`/toools/${focusTool.slug}`}
            className="selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              borderColor: "var(--line)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--tv-ink-primary)",
            }}
          >
            {`Vedi ${focusTool.name}`}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
