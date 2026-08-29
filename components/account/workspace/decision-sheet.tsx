"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import {
  commitWorkspaceDecision,
  reopenWorkspaceDecision,
} from "@/lib/account/workspace-actions";
import { OUTCOME_STATE_LABELS } from "@/lib/account/workspace-lifecycle";
import { MAX_USE_CASE_LENGTH } from "@/lib/discovery/workspace-constants";
import type {
  CompareObjective,
  WorkspaceDecisionOutcome,
  WorkspaceStateV1,
} from "@/lib/discovery/types";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

import { PrivateNoteEditor } from "./private-note-editor";
import { RevisitWhenChips } from "./revisit-when-chips";
import { useCanonicalWorkspace } from "./use-canonical-workspace";
import { WorkspaceToolMark } from "./workspace-tool-mark";

import "./decision-sheet.css";

export const DESKTOP_SHEET_QUERY = "(min-width: 1024px)";
const OUTCOMES: WorkspaceDecisionOutcome[] = ["selected", "rejected", "deferred"];

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

function recentUseCases(state: WorkspaceStateV1, limit = 4) {
  const ranked = Object.values(state.toolStates)
    .filter((tool) => tool.useCase?.trim())
    .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  const unique: string[] = [];
  for (const tool of ranked) {
    const value = tool.useCase?.trim();
    if (!value || unique.includes(value)) continue;
    unique.push(value);
    if (unique.length >= limit) break;
  }
  return unique;
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
  const whyId = useId();
  const useCaseId = useId();
  const isDesktop = useSyncExternalStore(
    subscribeDesktopSheet,
    desktopSheetSnapshot,
    () => false,
  );
  const currentOutcome = state.toolStates[slug]?.decision?.outcome ?? null;
  const [outcome, setOutcome] = useState<WorkspaceDecisionOutcome>(defaultOutcome);
  const [deepOpen, setDeepOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [useCase, setUseCase] = useState("");
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
      setDeepOpen(false);
      setReason("");
      setUseCase("");
      setRevisitAt(null);
      return;
    }
    frozenAltsRef.current = [...alternatives];
    frozenNamesRef.current = alternativeNames ? [...alternativeNames] : null;
    setOutcome(defaultOutcome);
    setDeepOpen(false);
    setReason("");
    setUseCase("");
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
  const useCaseChips = recentUseCases(state);

  function handleOpenChange(next: boolean) {
    if (submittingRef.current && !next) return;
    onOpenChange(next);
  }

  function handleReopen() {
    if (submittingRef.current) return;
    reopenWorkspaceDecision(slug);
    setOutcome(defaultOutcome);
    setDeepOpen(false);
    setReason("");
    setUseCase("");
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
    const why = reason.trim();
    const caseText = useCase.trim();
    try {
      commitWorkspaceDecision({
        slug,
        outcome,
        alternatives: frozenAlternatives,
        compareObjective,
        eventId: eventIdRef.current,
        ...(why ? { reason: why } : {}),
        ...(caseText ? { useCase: caseText } : {}),
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
              size="xl"
            />
            <div className="tv-decision-sheet__identity">
              <p className="tv-decision-sheet__kicker">Decidi</p>
              <SheetTitle id={titleId} className="tv-decision-sheet__title">
                {toolName}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Scegli un esito e conferma. Il contesto extra è facoltativo.
              </SheetDescription>
            </div>
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

            <button
              type="button"
              className="tv-decision-sheet__deep-toggle"
              aria-expanded={deepOpen}
              onClick={() => setDeepOpen((value) => !value)}
            >
              {deepOpen ? "Nascondi contesto" : "Aggiungi perché"}
            </button>

            {deepOpen ? (
              <div className="tv-decision-sheet__deep">
                <label className="tv-decision-sheet__field" htmlFor={whyId}>
                  <span className="tv-decision-sheet__field-label">Perché</span>
                  <textarea
                    id={whyId}
                    className="tv-decision-sheet__textarea"
                    value={reason}
                    maxLength={2000}
                    rows={3}
                    onChange={(event) => setReason(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey && event.metaKey) {
                        event.preventDefault();
                      }
                    }}
                  />
                </label>

                <div className="tv-decision-sheet__field">
                  <span className="tv-decision-sheet__field-label" id={useCaseId}>
                    Caso d&apos;uso
                  </span>
                  {useCaseChips.length > 0 ? (
                    <div className="tv-decision-sheet__chips" role="group" aria-labelledby={useCaseId}>
                      {useCaseChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          className="tv-decision-sheet__chip"
                          data-active={useCase === chip ? "true" : "false"}
                          onClick={() => setUseCase(chip)}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <input
                    className="tv-decision-sheet__input"
                    value={useCase}
                    maxLength={MAX_USE_CASE_LENGTH}
                    onChange={(event) => setUseCase(event.target.value)}
                    aria-labelledby={useCaseId}
                  />
                </div>

                <div className="tv-decision-sheet__field">
                  <p className="tv-decision-sheet__field-label">
                    {outcome === "deferred" ? "Quando rivedere" : "Rivedi più tardi (facoltativo)"}
                  </p>
                  <RevisitWhenChips
                    onSelect={(next) => setRevisitAt(next)}
                  />
                </div>
              </div>
            ) : null}

            <PrivateNoteEditor
              slug={slug}
              origin="decision"
              compact
              guestMode="hide"
            />

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
              className="tv-decision-sheet__confirm"
              disabled={submitting}
              onClick={handleConfirm}
            >
              Conferma
            </button>
          </footer>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
