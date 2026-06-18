"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3 } from "lucide-react";

import { MAX_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

type CompareToggleProps = {
  slug: string;
  compact?: boolean;
  mode?: "default" | "icon";
  onChange?: (selected: boolean) => void;
};

export function CompareToggle({
  slug,
  compact = false,
  mode = "default",
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

      freshTimerRef.current = window.setTimeout(() => setIsFresh(false), 560);
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

  const handleToggle = () => {
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

      freshTimerRef.current = window.setTimeout(() => setIsFresh(false), 560);
    }

    previousCountRef.current = nextCount;
  };

  const isReady = count >= 2;

  if (mode === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`selection-chip toggle-chip-glow inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 ${
          isSelected ? "is-active" : ""
        } ${isReady ? "is-ready" : ""} ${isFresh ? "is-fresh" : ""}`}
        style={{
          borderColor: isSelected ? "rgba(112,82,255,0.24)" : "var(--line)",
          background: isSelected
            ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
            : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
          color: isSelected ? "var(--accent-strong)" : "var(--muted-strong)",
        }}
        aria-pressed={isSelected}
        aria-label={isSelected ? "Rimuovi dal confronto" : "Aggiungi al confronto"}
        data-sonic-action="compare"
      >
        <Columns3 className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`selection-chip toggle-chip-glow text-ui-strong inline-flex items-center gap-2 rounded-full border transition-all duration-200 hover:-translate-y-0.5 ${
        compact ? "px-2.75 py-1.25 text-[0.66rem]" : "justify-center px-4 py-2.25 text-[0.74rem] sm:text-[0.78rem]"
      } ${isSelected ? "is-active" : ""} ${isReady ? "is-ready" : ""} ${isFresh ? "is-fresh" : ""}`}
      style={{
        borderColor: isSelected ? "rgba(112,82,255,0.24)" : "var(--line)",
        background: isSelected
          ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
          : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
        color: isSelected ? "var(--accent-strong)" : "var(--muted-strong)",
      }}
      aria-pressed={isSelected}
      data-sonic-action="compare"
    >
      <span
        className="h-1.25 w-1.25 rounded-full"
        style={{
          background: isSelected ? "var(--accent)" : "var(--gold)",
          boxShadow: isSelected ? "0 0 0 4px rgba(112,82,255,0.12)" : "0 0 0 4px rgba(242,179,71,0.12)",
        }}
      />
      {isSelected ? "Nel confronto" : compact ? "Confronta" : "Aggiungi al confronto"}
      <span
        className={`count-badge-live rounded-full bg-white/76 px-1.5 py-0.5 text-[0.58rem] ${count > 0 ? "is-active" : ""} ${
          isReady ? "is-ready" : ""
        } ${isFresh ? "is-fresh" : ""}`}
        style={{ color: "var(--muted)" }}
      >
        {count}/{MAX_COMPARE_TOOLS}
      </span>
    </button>
  );
}
