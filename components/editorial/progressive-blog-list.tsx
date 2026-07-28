"use client";

import { useState } from "react";

import type { EditorialPostRecord } from "@/lib/types/article";

import { EditorialPostCard } from "@/components/editorial/editorial-post-card";

const INITIAL_VISIBLE = 6;

type ProgressiveBlogListProps = {
  posts: EditorialPostRecord[];
};

export function ProgressiveBlogList({ posts }: ProgressiveBlogListProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const shown = posts.slice(0, visible);
  const hasMore = visible < posts.length;

  return (
    <div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((post) => (
          <EditorialPostCard key={post.slug} post={post} variant="compact" />
        ))}
      </div>
      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((prev) => prev + INITIAL_VISIBLE)}
            className="selection-chip rounded-full border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--tv-ink-primary)] transition-colors hover:border-[var(--tv-accent-brand-aa)] focus-visible:border-[var(--tv-accent-brand-aa)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-accent-brand-aa)]"
          >
            Mostra più articoli ({posts.length - visible} rimanenti)
          </button>
        </div>
      ) : null}
    </div>
  );
}
