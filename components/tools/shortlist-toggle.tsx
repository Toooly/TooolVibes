"use client";

import { useEffect, useRef, useState } from "react";

import { MOTION_DURATION_MS } from "@/lib/motion/tokens";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { useSaveHold } from "@/components/tools/save-hold";

type ShortlistToggleProps = {
  slug: string;
  compact?: boolean;
  mode?: "default" | "compact" | "icon";
  /** Tool name for tool-specific aria-labels (V2 catalog contract). */
  toolName?: string;
  onChange?: (saved: boolean) => void;
  /** Speed 2: hold 400ms. Parent should open SaveOverflow for this slug. */
  onSpeed2Open?: () => void;
};

export function ShortlistToggle({
  slug,
  compact = false,
  mode = "default",
  toolName,
  onChange,
  onSpeed2Open,
}: ShortlistToggleProps) {
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const toggleSaved = useToolWorkspaceStore((state) => state.toggleSaved);
  const isSaved = savedSlugs.includes(slug);
  const [isFresh, setIsFresh] = useState(false);
  const [announceSaved, setAnnounceSaved] = useState(false);
  const wasSavedRef = useRef(isSaved);
  const mountedRef = useRef(false);
  const freshTimerRef = useRef<number | null>(null);
  const announceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onChange?.(isSaved);
  }, [isSaved, onChange]);

  useEffect(() => {
    if (mountedRef.current && wasSavedRef.current !== isSaved) {
      setIsFresh(true);

      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }

      freshTimerRef.current = window.setTimeout(() => setIsFresh(false), MOTION_DURATION_MS.reward);

      if (isSaved) {
        setAnnounceSaved(true);
        if (announceTimerRef.current) {
          window.clearTimeout(announceTimerRef.current);
        }
        announceTimerRef.current = window.setTimeout(() => setAnnounceSaved(false), 2000);
      }
    }

    wasSavedRef.current = isSaved;
    mountedRef.current = true;

    return () => {
      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }
      if (announceTimerRef.current) {
        window.clearTimeout(announceTimerRef.current);
      }
    };
  }, [isSaved]);

  const hold = useSaveHold({
    isSaved,
    onToggle: () => {
      toggleSaved(slug);
    },
    onSpeed2Open,
    slug,
  });

  const liveRegion = announceSaved ? (
    <span className="sr-only" aria-live="polite">
      Salvato
    </span>
  ) : null;

  if (mode === "icon") {
    const ariaLabel = toolName
      ? isSaved
        ? `Rimuovi ${toolName} dai salvati`
        : `Salva ${toolName}`
      : isSaved
        ? "Rimuovi dai salvati"
        : "Salva tool";
    return (
      <span className="inline-flex">
        <button
          type="button"
          {...hold}
          className={`selection-chip toggle-chip-glow inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border select-none transition-all duration-[var(--tv-duration-base)] hover:-translate-y-0.5 ${
            isSaved ? "is-active" : ""
          } ${isFresh ? "is-fresh" : ""}`}
          style={{
            // SAVE = TrueVibes Gold (#F4C23E) — canonical Catalog semantics
            // (styles/archive-v4.css "SAVE = TrueVibes Gold"). OFF is a
            // restrained gold tint, ON is full gold. Never violet.
            borderColor: isSaved ? "#f4c23e" : "rgba(244, 194, 62, 0.3)",
            background: isSaved ? "#f4c23e" : "rgba(244, 194, 62, 0.1)",
            color: isSaved ? "#0b0620" : "#f4c23e",
            touchAction: "manipulation",
          }}
          aria-pressed={isSaved}
          aria-label={ariaLabel}
          data-sonic-action="save"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z"
              stroke="currentColor"
              strokeWidth="1.4"
              fill={isSaved ? "currentColor" : "none"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {liveRegion}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        {...hold}
        className={`selection-chip toggle-chip-glow text-ui-strong inline-flex items-center gap-2 rounded-full border select-none transition-all duration-[var(--tv-duration-base)] hover:-translate-y-0.5 ${
          isSaved ? "is-active" : ""
        } ${isFresh ? "is-fresh" : ""} ${
          compact || mode === "compact"
            ? "px-2.75 py-1.25 text-xs"
            : "justify-center px-4 py-2.25 text-xs sm:text-[0.78rem]"
        }`}
        style={{
          // SAVE = TrueVibes Gold — same canonical semantics as icon mode.
          borderColor: isSaved ? "#f4c23e" : "rgba(244, 194, 62, 0.3)",
          background: isSaved ? "#f4c23e" : "rgba(244, 194, 62, 0.1)",
          color: isSaved ? "#0b0620" : "#f4c23e",
          touchAction: "manipulation",
        }}
        aria-pressed={isSaved}
        data-sonic-action="save"
      >
        <span
          className="h-1.25 w-1.25 rounded-full"
          style={{
            background: isSaved ? "#22c55e" : "#ef4444",
            boxShadow: isSaved ? "0 0 0 4px rgba(34,197,94,0.14)" : "0 0 0 4px rgba(239,68,68,0.14)",
          }}
        />
        {isSaved ? "Salvato" : "Da salvare"}
      </button>
      {liveRegion}
    </span>
  );
}
