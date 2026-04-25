"use client";

import { useEffect, useState } from "react";

import { getShortlist, toggleShortlistItem } from "@/lib/discovery/local-storage";

type ShortlistToggleProps = {
  slug: string;
  compact?: boolean;
  mode?: "default" | "compact" | "icon";
  onChange?: (saved: boolean) => void;
};

export function ShortlistToggle({
  slug,
  compact = false,
  mode = "default",
  onChange,
}: ShortlistToggleProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isFresh, setIsFresh] = useState(false);

  useEffect(() => {
    const sync = () => {
      const saved = getShortlist().includes(slug);
      setIsSaved(saved);
      onChange?.(saved);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("tooolvibes:discovery-sync", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("tooolvibes:discovery-sync", sync);
    };
  }, [onChange, slug]);

  const handleToggle = () => {
    const saved = toggleShortlistItem(slug).includes(slug);
    setIsSaved(saved);
    onChange?.(saved);
    setIsFresh(true);
    window.setTimeout(() => setIsFresh(false), 540);
  };

  if (mode === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`selection-chip toggle-chip-glow inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 ${
          isSaved ? "is-active" : ""
        } ${isFresh ? "is-fresh" : ""}`}
        style={{
          borderColor: isSaved ? "rgba(112,82,255,0.24)" : "var(--line)",
          background: isSaved
            ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
            : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
          color: isSaved ? "var(--accent-strong)" : "var(--muted-strong)",
        }}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Rimuovi dalla shortlist" : "Salva in shortlist"}
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
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`selection-chip toggle-chip-glow text-ui-strong inline-flex items-center gap-2 rounded-full border transition-all duration-200 hover:-translate-y-0.5 ${
        isSaved ? "is-active" : ""
      } ${isFresh ? "is-fresh" : ""} ${
        compact || mode === "compact"
          ? "px-2.75 py-1.25 text-[0.66rem]"
          : "justify-center px-4 py-2.25 text-[0.74rem] sm:text-[0.78rem]"
      }`}
      style={{
        borderColor: isSaved ? "rgba(112,82,255,0.24)" : "var(--line)",
        background: isSaved
          ? "linear-gradient(180deg, rgba(239,232,255,0.96), rgba(230,221,255,0.88))"
          : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
        color: isSaved ? "var(--accent-strong)" : "var(--muted-strong)",
      }}
      aria-pressed={isSaved}
    >
      <span
        className="h-1.25 w-1.25 rounded-full"
        style={{
          background: isSaved ? "var(--accent)" : "var(--gold)",
          boxShadow: isSaved ? "0 0 0 4px rgba(112,82,255,0.12)" : "0 0 0 4px rgba(242,179,71,0.12)",
        }}
      />
      {isSaved ? "In shortlist" : mode === "compact" ? "Salva" : "Salva shortlist"}
    </button>
  );
}
