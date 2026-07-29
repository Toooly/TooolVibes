"use client";

import { useState } from "react";

import type { EditorialPostRecord } from "@/lib/types/article";

import { EditorialPostCard } from "@/components/editorial/editorial-post-card";

const INITIAL_VISIBLE = 6;

type ProgressiveEditorialListProps = {
  listId: string;
  posts: EditorialPostRecord[];
  sectionLabel: string;
};

export function ProgressiveEditorialList({
  listId,
  posts,
  sectionLabel,
}: ProgressiveEditorialListProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = posts.length > INITIAL_VISIBLE;
  const shown = expanded ? posts : posts.slice(0, INITIAL_VISIBLE);

  return (
    <div>
      <div
        id={listId}
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {shown.map((post) => (
          <EditorialPostCard key={post.slug} post={post} variant="compact" />
        ))}
      </div>
      {hasOverflow ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            aria-controls={listId}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="selection-chip rounded-full border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--tv-ink-primary)] transition-colors hover:border-[var(--tv-accent-brand-aa)] focus-visible:border-[var(--tv-accent-brand-aa)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-accent-brand-aa)]"
          >
            {expanded
              ? `Mostra meno: ${sectionLabel}`
              : `Mostra tutto: ${sectionLabel} (+${posts.length - INITIAL_VISIBLE})`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
