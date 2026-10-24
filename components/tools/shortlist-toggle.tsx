"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Check } from "lucide-react";

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
  const freshTimerRef = useRef<number | null>(null);
  const announceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onChange?.(isSaved);
  }, [isSaved, onChange]);

  useEffect(() => () => {
    if (freshTimerRef.current !== null) window.clearTimeout(freshTimerRef.current);
    if (announceTimerRef.current !== null) window.clearTimeout(announceTimerRef.current);
  }, []);

  const hold = useSaveHold({
    isSaved,
    onToggle: () => {
      const saved = toggleSaved(slug);
      if (freshTimerRef.current !== null) window.clearTimeout(freshTimerRef.current);
      if (announceTimerRef.current !== null) window.clearTimeout(announceTimerRef.current);
      setIsFresh(saved);
      setAnnounceSaved(saved);
      if (saved) {
        freshTimerRef.current = window.setTimeout(() => setIsFresh(false), MOTION_DURATION_MS.reward);
        announceTimerRef.current = window.setTimeout(() => setAnnounceSaved(false), 1500);
      }
    },
    onSpeed2Open,
    slug,
  });

  const liveRegion = announceSaved ? (
    <span className="sr-only" aria-live="polite"><LocalizedText>{"Salvato "}</LocalizedText></span>
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
        <LocalizedAttributes><button
          type="button"
          {...hold}
          className={`selection-chip inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border select-none transition-colors duration-[var(--tv-duration-base)] ${
            isSaved ? "is-active" : ""
          }`}
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
          data-save-feedback={isSaved && isFresh ? "added" : undefined}
          data-sonic-action="save"
        >
          <span className="tool-action__icon" aria-hidden="true"><Bookmark className="tool-action__symbol h-4 w-4" fill={isSaved ? "currentColor" : "none"} />{isSaved ? <Check className="tool-action__check" /> : null}</span>
        </button></LocalizedAttributes>
        {liveRegion}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        {...hold}
        className={`selection-chip text-ui-strong inline-flex items-center gap-2 rounded-full border select-none transition-colors duration-[var(--tv-duration-base)] ${
          isSaved ? "is-active" : ""
        } ${
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
        data-save-feedback={isSaved && isFresh ? "added" : undefined}
        data-sonic-action="save"
      >
        <span className="tool-action__icon" aria-hidden="true"><Bookmark className="tool-action__symbol h-4 w-4" fill={isSaved ? "currentColor" : "none"} />{isSaved ? <Check className="tool-action__check" /> : null}</span>
        <LocalizedText>{isSaved ? "Salvato" : "Da salvare"}</LocalizedText>
      </button>
      {liveRegion}
    </span>
  );
}
