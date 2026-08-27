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
            borderColor: isSaved ? "rgba(112,82,255,0.24)" : "var(--line)",
            background: isSaved ? "#6a3cff" : "rgba(18, 13, 46, 0.92)",
            color: "#f4f1ff",
            touchAction: "manipulation",
          }}
          aria-pressed={isSaved}
          aria-label={ariaLabel}
          data-sonic-action="save"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M12 21l-1.1-1C6 15.6 3 13 3 9.8 3 7.2 5.1 5 7.7 5c1.5 0 3 .7 4 1.9 1-1.2 2.5-1.9 4-1.9C18.9 5 21 7.2 21 9.8c0 3.2-3 5.8-7.9 10.2L12 21z"
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
          borderColor: isSaved ? "rgba(112,82,255,0.24)" : "var(--line)",
          background: isSaved
            ? "#6a3cff"
            : "rgba(18, 13, 46, 0.92)",
          color: "#f4f1ff",
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
