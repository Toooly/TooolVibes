"use client";

import { useEffect, useRef, useState } from "react";

import { getCompareTools, toggleCompareTool } from "@/lib/discovery/local-storage";

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
  const [isSelected, setIsSelected] = useState(false);
  const [count, setCount] = useState(0);
  const [isFresh, setIsFresh] = useState(false);
  const previousCountRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      const compare = getCompareTools();
      const selected = compare.includes(slug);

      if (mountedRef.current && previousCountRef.current !== compare.length) {
        setIsFresh(true);
        window.setTimeout(() => setIsFresh(false), 560);
      }

      previousCountRef.current = compare.length;
      setIsSelected(selected);
      setCount(compare.length);
      onChange?.(selected);
    };

    sync();
    mountedRef.current = true;
    window.addEventListener("storage", sync);
    window.addEventListener("tooolvibes:discovery-sync", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("tooolvibes:discovery-sync", sync);
    };
  }, [onChange, slug]);

  const handleToggle = () => {
    const next = toggleCompareTool(slug);
    const selected = next.includes(slug);
    setIsFresh(true);
    window.setTimeout(() => setIsFresh(false), 560);
    previousCountRef.current = next.length;
    setIsSelected(selected);
    setCount(next.length);
    onChange?.(selected);
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
        aria-label={isSelected ? "Rimuovi dal compare" : "Aggiungi al compare"}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M4 7h16M4 12h10M4 17h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
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
    >
      <span
        className="h-1.25 w-1.25 rounded-full"
        style={{
          background: isSelected ? "var(--accent)" : "var(--gold)",
          boxShadow: isSelected ? "0 0 0 4px rgba(112,82,255,0.12)" : "0 0 0 4px rgba(242,179,71,0.12)",
        }}
      />
      {isSelected ? "Nel compare" : compact ? "Confronta" : "Aggiungi compare"}
      <span
        className={`count-badge-live rounded-full bg-white/76 px-1.5 py-0.5 text-[0.58rem] ${count > 0 ? "is-active" : ""} ${
          isReady ? "is-ready" : ""
        } ${isFresh ? "is-fresh" : ""}`}
        style={{ color: "var(--muted)" }}
      >
        {count}/3
      </span>
    </button>
  );
}
