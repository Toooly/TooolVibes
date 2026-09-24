"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import {
  composeDecisionReason,
  DECISION_REASON_CHIPS,
} from "@/lib/account/decision-memory";
import {
  commitWorkspaceDecision,
  reopenWorkspaceDecision,
} from "@/lib/account/workspace-actions";
import { OUTCOME_STATE_LABELS } from "@/lib/account/workspace-lifecycle";
import type {
  CompareObjective,
  WorkspaceDecisionOutcome,
} from "@/lib/discovery/types";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

import { RevisitWhenChips } from "./revisit-when-chips";
import { useCanonicalWorkspace } from "./use-canonical-workspace";
import { WorkspaceToolMark } from "./workspace-tool-mark";

import "./decision-sheet.css";

export const DESKTOP_SHEET_QUERY = "(min-width: 1024px)";
const OUTCOMES: WorkspaceDecisionOutcome[] = ["selected", "deferred", "rejected"];

export type DecisionSheetSource = "compare" | "salvati" | "home" | "shortlist";

export type DecisionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  toolName: string;
  accentFrom?: string;
  accentTo?: string;
  alternatives: string[];
  alternativeNames?: Array<{ slug: string; name: string }>;
  source: DecisionSheetSource;
  compareObjective?: CompareObjective | null;
  defaultOutcome?: WorkspaceDecisionOutcome;
  onCommitted?: (payload: { slug: string; outcome: WorkspaceDecisionOutcome }) => void;
};

function subscribeDesktopSheet(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(DESKTOP_SHEET_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function desktopSheetSnapshot() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DESKTOP_SHEET_QUERY).matches
    : false;
}

export function DecisionSheet({
  open,
  onOpenChange,
  slug,
  toolName,
  accentFrom,
  accentTo,
  alternatives,
  alternativeNames,
  source,
  compareObjective = null,
  defaultOutcome = "selected",
  onCommitted,
}: DecisionSheetProps) {
  const state = useCanonicalWorkspace();
  const titleId = useId();
  const isDesktop = useSyncExternalStore(
    subscribeDesktopSheet,
    desktopSheetSnapshot,
    () => false,
  );
  const currentOutcome = state.toolStates[slug]?.decision?.outcome ?? null;
  const [outcome, setOutcome] = useState<WorkspaceDecisionOutcome>(defaultOutcome);
  const [reason, setReason] = useState("");
  const [reasonChips, setReasonChips] = useState<string[]>([]);
  const [revisitAt, setRevisitAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const eventIdRef = useRef<string | null>(null);
  const frozenAltsRef = useRef<string[] | null>(null);
  const frozenNamesRef = useRef<Array<{ slug: string; name: string }> | null>(null);

  useEffect(() => {
    if (!open) {
      frozenAltsRef.current = null;
      frozenNamesRef.current = null;
      eventIdRef.current = null;
      submittingRef.current = false;
      setSubmitting(false);
      setError(null);
      setReason("");
      setReasonChips([]);
      setRevisitAt(null);
      return;
    }
    frozenAltsRef.current = [...alternatives];
    frozenNamesRef.current = alternativeNames ? [...alternativeNames] : null;
    setOutcome(defaultOutcome);
    setReason("");
    setReasonChips([]);
    setRevisitAt(null);
    setError(null);
    eventIdRef.current = null;
    submittingRef.current = false;
    setSubmitting(false);
    // Freeze at open. Do not re-read caller alternatives after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slug, defaultOutcome]);

  const frozenAlternatives = frozenAltsRef.current ?? alternatives;
  const frozenNames = frozenNamesRef.current ?? alternativeNames ?? [];

  function handleOpenChange(next: boolean) {
    if (submittingRef.current && !next) return;
    onOpenChange(next);
  }

  function handleReopen() {
    if (submittingRef.current) return;
    reopenWorkspaceDecision(slug);
    setOutcome(defaultOutcome);
    setReason("");
    setReasonChips([]);
    setRevisitAt(null);
    setError(null);
    eventIdRef.current = null;
  }

  function handleConfirm() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    if (!eventIdRef.current) {
      eventIdRef.current = crypto.randomUUID();
    }
    const why = composeDecisionReason(reasonChips, reason);
    try {
      commitWorkspaceDecision({
        slug,
        outcome,
        alternatives: frozenAlternatives,
        compareObjective,
        eventId: eventIdRef.current,
        ...(why ? { reason: why } : {}),
        ...(outcome === "deferred" || revisitAt ? { revisitAt } : { revisitAt: null }),
      });
      onCommitted?.({ slug, outcome });
      onOpenChange(false);
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
      setError("Salvataggio non riuscito. Riprova.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {open ? (
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          showCloseButton={!submitting}
          data-decision-sheet=""
          data-decision-source={source}
          className="tv-decision-sheet"
          aria-labelledby={titleId}
        >
          <header className="tv-decision-sheet__header">
            <WorkspaceToolMark
              slug={slug}
              name={toolName}
              accentFrom={accentFrom}
              accentTo={accentTo}
              size="sm"
            />
            <div className="tv-decision-sheet__identity">
              <SheetTitle id={titleId} className="tv-decision-sheet__title">
                Valuta {toolName}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Scegli un esito e conferma. Il contesto extra è facoltativo.
              </SheetDescription>
            </div>
            <button
              type="button"
              className="tv-decision-sheet__close"
              onClick={() => onOpenChange(false)}
              aria-label="Chiudi"
            >
              ×
            </button>
          </header>

          <div className="tv-decision-sheet__body">
            <div
              className="tv-decision-sheet__outcomes"
              role="radiogroup"
              aria-label="Esito"
            >
              {OUTCOMES.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={outcome === option}
                  data-active={outcome === option ? "true" : "false"}
                  className="tv-decision-sheet__outcome"
                  autoFocus={option === outcome}
                  onClick={() => setOutcome(option)}
                >
                  {OUTCOME_STATE_LABELS[option]}
                </button>
              ))}
            </div>

            {frozenAlternatives.length > 0 ? (
              <div className="tv-decision-sheet__alts" aria-label="Alternative">
                <p className="tv-decision-sheet__alts-label">Alternative</p>
                {frozenAlternatives.map((alt) => {
                  const named = frozenNames.find((item) => item.slug === alt);
                  return (
                    <WorkspaceToolMark
                      key={alt}
                      slug={alt}
                      name={named?.name ?? alt}
                      size="xs"
                    />
                  );
                })}
              </div>
            ) : null}

            <div className="tv-decision-sheet__field" role="group" aria-label="Perché questa decisione?">
              <span className="tv-decision-sheet__field-label">Perché questa decisione?</span>
              <div className="tv-decision-sheet__chips">
                {DECISION_REASON_CHIPS.map((chip) => {
                  const active = reasonChips.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      className="tv-decision-sheet__chip"
                      data-active={active ? "true" : "false"}
                      aria-pressed={active}
                      onClick={() =>
                        setReasonChips((current) =>
                          current.includes(chip.id)
                            ? current.filter((id) => id !== chip.id)
                            : [...current, chip.id],
                        )
                      }
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tv-decision-sheet__field">
              <p className="tv-decision-sheet__field-label">
                Conferma se lo usi tra 1 mese
              </p>
              <RevisitWhenChips
                tone="light"
                onSelect={(next) => setRevisitAt(next)}
              />
            </div>

            <label className="tv-decision-sheet__field" htmlFor={`${titleId}-nota`}>
              <span className="tv-decision-sheet__field-label">Nota privata</span>
              <input
                id={`${titleId}-nota`}
                className="tv-decision-sheet__input"
                value={reason}
                maxLength={200}
                placeholder="Es. È il più utile per me"
                onChange={(event) => setReason(event.target.value)}
              />
            </label>

            {currentOutcome ? (
              <button
                type="button"
                className="tv-decision-sheet__reopen"
                onClick={handleReopen}
              >
                Riapri
              </button>
            ) : null}
          </div>

          <footer className="tv-decision-sheet__footer">
            {error ? (
              <p className="tv-decision-sheet__error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="tv-decision-sheet__cancel"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </button>
            <button
              type="button"
              className="tv-decision-sheet__confirm"
              disabled={submitting}
              onClick={handleConfirm}
            >
              Salva decisione
            </button>
          </footer>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
