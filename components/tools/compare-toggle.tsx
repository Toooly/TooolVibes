"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Columns2 } from "lucide-react";

import { MOTION_DURATION_MS } from "@/lib/motion/tokens";
import { MAX_COMPARE_TOOLS, MIN_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

type CompareToggleProps = {
  slug: string;
  compact?: boolean;
  mode?: "default" | "icon";
  /** Tool name for tool-specific aria-labels (V2 catalog contract). */
  toolName?: string;
  onChange?: (selected: boolean) => void;
};

export function CompareToggle({
  slug,
  compact = false,
  mode = "default",
  toolName,
  onChange,
}: CompareToggleProps) {
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((state) => state.toggleCompare);
  const count = compareSlugs.length;
  const isSelected = compareSlugs.includes(slug);
  const [isFresh, setIsFresh] = useState(false);
  const previousCountRef = useRef(0);
  const mountedRef = useRef(false);
  const freshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mountedRef.current && previousCountRef.current !== count) {
      setIsFresh(true);

      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }

      freshTimerRef.current = window.setTimeout(() => setIsFresh(false), MOTION_DURATION_MS.reward);
    }

    previousCountRef.current = count;
    mountedRef.current = true;
    onChange?.(isSelected);

    return () => {
      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }
    };
  }, [count, isSelected, onChange]);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const result = toggleCompare(slug);
    if (result.limited) {
      return;
    }

    const nextCount = result.added ? count + 1 : Math.max(0, count - 1);

    if (nextCount !== previousCountRef.current) {
      setIsFresh(true);

      if (freshTimerRef.current) {
        window.clearTimeout(freshTimerRef.current);
      }

      freshTimerRef.current = window.setTimeout(() => setIsFresh(false), MOTION_DURATION_MS.reward);
    }

    previousCountRef.current = nextCount;
  };

  const isReady = count >= MIN_COMPARE_TOOLS;

  if (mode === "icon") {
    const ariaLabel = toolName
      ? isSelected
        ? `Rimuovi ${toolName} dal confronto`
        : `Aggiungi ${toolName} al confronto`
      : isSelected
        ? "Rimuovi dal confronto"
        : "Aggiungi al confronto";
    return (
      <LocalizedAttributes><button
        type="button"
        onClick={handleToggle}
        className={`selection-chip toggle-chip-glow inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border transition-colors duration-[var(--tv-duration-base)] hover:-translate-y-0.5 ${
          isSelected ? "is-active" : ""
        } ${isReady ? "is-ready" : ""} ${isFresh ? "is-fresh" : ""}`}
        style={{
          display: "inline-flex",
          // COMPARE = Logo Cyan (#22D3EE) — canonical Catalog semantics
          // (styles/archive-v4.css "COMPARE = Logo Cyan"). OFF is a
          // restrained cyan tint, ON is full cyan.
          borderColor: isSelected ? "#22d3ee" : "rgba(34, 211, 238, 0.3)",
          background: isSelected ? "#22d3ee" : "rgba(34, 211, 238, 0.1)",
          color: isSelected ? "#0b0620" : "#22d3ee",
        }}
        aria-pressed={isSelected}
        aria-label={ariaLabel}
        data-sonic-action="compare"
      >
        <Columns2 className="h-4 w-4" aria-hidden="true" />
      </button></LocalizedAttributes>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`selection-chip toggle-chip-glow text-ui-strong inline-flex items-center gap-2 rounded-full border transition-colors duration-[var(--tv-duration-base)] hover:-translate-y-0.5 ${
        compact ? "px-2.75 py-1.25 text-xs" : "justify-center px-4 py-2.25 text-xs sm:text-[0.78rem]"
      } ${isSelected ? "is-active" : ""} ${isReady ? "is-ready" : ""} ${isFresh ? "is-fresh" : ""}`}
      style={{
        // COMPARE = Logo Cyan — same canonical semantics as icon mode.
        borderColor: isSelected ? "#22d3ee" : "rgba(34, 211, 238, 0.3)",
        background: isSelected ? "#22d3ee" : "rgba(34, 211, 238, 0.1)",
        color: isSelected ? "#0b0620" : "#22d3ee",
      }}
      aria-pressed={isSelected}
      data-sonic-action="compare"
    >
      <span
        className="h-1.25 w-1.25 rounded-full"
        style={{
          background: isSelected ? "#22c55e" : "#ef4444",
          boxShadow: isSelected ? "0 0 0 4px rgba(34,197,94,0.14)" : "0 0 0 4px rgba(239,68,68,0.14)",
        }}
      />
      <LocalizedText>{compact ? "Confronta" : isSelected ? "Aggiunto al confronto" : "Aggiungi al confronto"}</LocalizedText>
      <span
        className={`count-badge-live rounded-full bg-white/10 px-1.5 py-0.5 text-xs ${count > 0 ? "is-active" : ""} ${
          isReady ? "is-ready" : ""
        } ${isFresh ? "is-fresh" : ""}`}
        style={{ color: "var(--muted)" }}
      >
        {count}/{MAX_COMPARE_TOOLS}
      </span>
    </button>
  );
}
