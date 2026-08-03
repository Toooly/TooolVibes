"use client";

/**
 * BATCH 35 / FLOW-604 — Compare → Decision.
 *
 * Pannello condiviso (mobile e desktop) che chiude il confronto in una
 * decisione riapribile con contesto:
 * - azione esplicita per ogni candidato: Scegli / Scarta / Rimanda, con
 *   motivazione annotabile e timestamp versionato;
 * - scrittura additiva e versionata: riusa le action B32
 *   `setToolDecisionOutcome` / `reopenToolDecision` / `updateToolDecisionMemory`
 *   sul contract B16 (nessuna action duplicata, nessun campo nuovo persistito);
 * - ritorno a Salvati: la decisione resta visibile in shortlist dopo reload
 *   e login (owner scope guest/account gestito dallo store canonico B16–B19).
 *
 * Reversibilità: l'intero pannello è dietro flag B35
 * (`TOOOLVIBES_COMPARE_DECISION_ENABLED`); OFF riproduce il contratto B34
 * (il confronto termina al verdetto). Reward/XP non sono toccati.
 */

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Check,
  Clock,
  NotebookPen,
  RotateCcw,
} from "lucide-react";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import {
  reopenToolDecision,
  setToolDecisionOutcome,
  updateToolDecisionMemory,
} from "@/lib/discovery/local-storage";
import { MIN_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import type { WorkspaceDecisionOutcome } from "@/lib/discovery/types";
import {
  getCompareObjectiveLabel,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { formatDecisionTimestamp } from "@/lib/tools/discovery";
import { cn } from "@/lib/utils";
import { emitComparisonCompleted } from "@/lib/signal-progression/client";
import type { NormalisedTool } from "./tool-battle-shared";

export type CompareDecisionPanelProps = {
  /** Candidati nell'ordine del verdetto canonico (rank 1..n). */
  tools: NormalisedTool[];
  /** Obiettivo attivo (B34); null = confronto generale. */
  objective?: CompareObjective | null;
  /** Flag B35: OFF nasconde il pannello e riproduce il contratto B34. */
  enabled?: boolean;
  /** Prefisso univoco per gli id (mobile/desktop montati insieme). */
  idPrefix: string;
};

const DECISION_OUTCOME_ORDER: WorkspaceDecisionOutcome[] = [
  "selected",
  "rejected",
  "deferred",
];

/* Stessa lingua visiva dei chip decisione della MobileNoteSheet (B32):
   etichette di stato identiche, qui con verbi d'azione per la scelta. */
const decisionOutcomeMeta: Record<
  WorkspaceDecisionOutcome,
  {
    actionLabel: string;
    stateLabel: string;
    tone: string;
    background: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  selected: {
    actionLabel: "Scegli",
    stateLabel: "Scelto",
    tone: "var(--accent-strong)",
    background: "#efe8ff",
    icon: Check,
  },
  rejected: {
    actionLabel: "Scarta",
    stateLabel: "Scartato",
    tone: "var(--muted-strong)",
    background: "#fff2ec",
    icon: Ban,
  },
  deferred: {
    actionLabel: "Rimanda",
    stateLabel: "Rimandato",
    tone: "var(--muted-strong)",
    background: "#fff5df",
    icon: Clock,
  },
};

const decisionChipClassName =
  "selection-chip text-ui-strong inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] disabled:cursor-default disabled:opacity-100";

const decisionChipIdleStyle: CSSProperties = {
  borderColor: "var(--line)",
  background: "#f7f4ff",
  color: "var(--muted-strong)",
};

export function CompareDecisionPanel({
  tools,
  objective = null,
  enabled = true,
  idPrefix,
}: CompareDecisionPanelProps) {
  const discovery = useDiscoverySnapshot();
  const decisionOutcomes = discovery.decisionOutcomes ?? {};
  const decisionUpdatedAts = discovery.decisionUpdatedAts ?? {};
  const decisionMemories = discovery.decisionMemories;

  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  // Il motivo si annota sul candidato "a fuoco": l'ultimo su cui si è agito,
  // altrimenti il primo con decisione registrata, altrimenti il vincitore.
  const firstDecidedSlug =
    tools.find((tool) => decisionOutcomes[tool.slug])?.slug ?? null;
  const resolvedFocusSlug =
    focusSlug && tools.some((tool) => tool.slug === focusSlug)
      ? focusSlug
      : firstDecidedSlug ?? tools[0]?.slug ?? null;
  const focusTool =
    tools.find((tool) => tool.slug === resolvedFocusSlug) ?? null;
  const focusNote = resolvedFocusSlug
    ? decisionMemories[resolvedFocusSlug]?.note ?? ""
    : "";

  useEffect(() => {
    setNoteDraft(focusNote);
  }, [focusNote, resolvedFocusSlug]);

  if (!enabled || tools.length < MIN_COMPARE_TOOLS || !focusTool) return null;

  const noteIsDirty = noteDraft.trim() !== focusNote;
  const noteId = `${idPrefix}-compare-decision-note`;
  const titleId = `${idPrefix}-compare-decision-title`;
  const contextLabel = objective
    ? `Confronto orientato a ${getCompareObjectiveLabel(objective)}`
    : "Confronto generale";
  const candidateNames = tools.map((tool) => tool.name).join(", ");

  function handleOutcome(
    slug: string,
    outcome: WorkspaceDecisionOutcome,
    active: boolean,
  ) {
    if (active) return;
    setFocusSlug(slug);
    setToolDecisionOutcome(slug, outcome);
    // Meaningful completion: explicit decision on a compare set (not page view).
    if (outcome === "selected" || outcome === "rejected" || outcome === "deferred") {
      emitComparisonCompleted(tools.map((tool) => tool.slug));
    }
  }

  return (
    <section
      className="compare-decision-panel mt-6 rounded-[24px] border p-5"
      style={{
        borderColor: "var(--line)",
        background: "#fbfaff",
      }}
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="editorial-label">Decisione dal confronto</p>
          <h3 id={titleId} className="mt-1 text-base font-semibold">
            Registra decisione
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            {contextLabel} · {candidateNames}
          </p>
        </div>
        <Link
          href="/shortlist"
          className={decisionChipClassName}
          style={decisionChipIdleStyle}
        >
          Vai ai Salvati
          <ArrowRight size={12} />
        </Link>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {tools.map((tool, index) => {
          const outcome = decisionOutcomes[tool.slug] ?? null;
          const recordedAt = decisionUpdatedAts[tool.slug] ?? null;
          const isFocused = tool.slug === focusTool.slug;

          return (
            <li
              key={tool.slug}
              className="rounded-[18px] border p-3"
              style={{
                borderColor: isFocused
                  ? "rgba(112,82,255,0.32)"
                  : "var(--line)",
                background: "#ffffff",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.14em]"
                    style={{ color: "var(--muted)" }}
                  >
                    #{index + 1}
                  </span>
                  <strong className="truncate text-sm">{tool.name}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {tool.battleScore === null ? "Valutazione editoriale in preparazione" : `${tool.battleScore}/10`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusSlug(tool.slug)}
                    disabled={isFocused}
                    aria-pressed={isFocused}
                    aria-label={`Annota motivo per ${tool.name}`}
                    data-sonic-action="tab"
                    className={cn(
                      decisionChipClassName,
                      isFocused && "quick-filter-chip is-active",
                    )}
                    style={
                      isFocused
                        ? {
                            borderColor: "rgba(112,82,255,0.24)",
                            background: decisionOutcomeMeta.selected.background,
                            color: decisionOutcomeMeta.selected.tone,
                          }
                        : decisionChipIdleStyle
                    }
                  >
                    <NotebookPen size={12} />
                    Motivo
                  </button>
                </div>
              </div>

              <div
                className="tool-rail mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
                role="group"
                aria-label={`Decisione per ${tool.name}`}
              >
                {DECISION_OUTCOME_ORDER.map((option) => {
                  const meta = decisionOutcomeMeta[option];
                  const active = outcome === option;
                  const Icon = meta.icon;

                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={active}
                      aria-pressed={active}
                      onClick={() => handleOutcome(tool.slug, option, active)}
                      data-sonic-action="tab"
                      className={cn(
                        decisionChipClassName,
                        active && "quick-filter-chip is-active",
                      )}
                      style={
                        active
                          ? {
                              borderColor: "rgba(112,82,255,0.24)",
                              background: meta.background,
                              color: meta.tone,
                            }
                          : decisionChipIdleStyle
                      }
                    >
                      <Icon size={12} />
                      {meta.actionLabel}
                    </button>
                  );
                })}
              </div>

              {outcome ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p
                    className="text-xs uppercase tracking-[0.16em]"
                    style={{ color: "var(--muted)" }}
                  >
                    {decisionOutcomeMeta[outcome].stateLabel} · Registrata{" "}
                    {formatDecisionTimestamp(recordedAt)}
                  </p>
                  <button
                    type="button"
                    onClick={() => reopenToolDecision(tool.slug)}
                    aria-label={`Riapri decisione per ${tool.name}`}
                    data-sonic-action="update"
                    className={decisionChipClassName}
                    style={decisionChipIdleStyle}
                  >
                    <RotateCcw size={12} />
                    Riapri
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-4">
        <label className="editorial-label" htmlFor={noteId}>
          Motivo della decisione per {focusTool.name}
        </label>
        <textarea
          id={noteId}
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={`Perché questa scelta dopo il confronto? Resta nella memoria di ${focusTool.name}...`}
          data-sonic-action="update"
          className="filter-control mt-3 w-full rounded-[18px] border px-4 py-3 outline-none"
          style={{
            borderColor: "var(--line)",
            background: "#ffffff",
          }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p
            className="text-xs uppercase tracking-[0.16em]"
            style={{ color: "var(--muted)" }}
          >
            {noteDraft.length}/2000 · Resta nei Salvati con motivo e timestamp
          </p>
          <button
            type="button"
            onClick={() =>
              updateToolDecisionMemory(focusTool.slug, { note: noteDraft })
            }
            disabled={!noteIsDirty}
            data-sonic-action="save"
            className="selection-chip text-ui-strong inline-flex items-center rounded-full border px-2.75 py-1.25 text-xs font-semibold uppercase tracking-[0.14em] disabled:cursor-default disabled:opacity-55"
            style={{
              borderColor: noteIsDirty
                ? "rgba(112,82,255,0.24)"
                : "var(--line)",
              background: noteIsDirty
                ? "#efe8ff"
                : "#f7f4ff",
              color: noteIsDirty ? "var(--accent-strong)" : "var(--muted)",
            }}
          >
            {noteIsDirty ? "Salva motivo" : "Motivo salvato"}
          </button>
        </div>
      </div>
    </section>
  );
}
