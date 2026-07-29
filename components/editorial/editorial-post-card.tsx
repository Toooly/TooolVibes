import Link from "next/link";

import type { EditorialPostRecord } from "@/lib/types/article";
import { cn } from "@/lib/utils";

import { ButtonLink } from "@/components/ui/button";

export type EditorialPostCardVariant = "hero" | "card" | "compact";

type EditorialPostCardProps = {
  post: EditorialPostRecord;
  variant?: EditorialPostCardVariant;
  className?: string;
};

const kindLabels: Record<EditorialPostRecord["kind"], string> = {
  "tool-writeup": "Approfondimento tool",
  guide: "Guida",
  editorial: "Blog",
};

/** Hide source label when it repeats what the kind label already says. */
function isSourceLabelRedundant(post: EditorialPostRecord): boolean {
  if (post.kind === "guide" && post.source_label === "Guida TooolVibes") return true;
  if (post.kind === "tool-writeup" && post.source_label === "Archivio TooolVibes") return true;
  return false;
}

export function EditorialPostCard({ post, variant = "card", className }: EditorialPostCardProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  const kindLabel =
    post.kind === "guide" && post.source_label === "Blog TooolVibes"
      ? "Guida"
      : kindLabels[post.kind];

  const showSourceLabel = !isSourceLabelRedundant(post);

  return (
    <article
      className={cn(
        "brand-panel panel-lift relative flex h-full flex-col overflow-hidden rounded-[30px] p-4.5 sm:p-5",
        isHero && "p-5 sm:p-6 lg:p-7",
        className,
      )}
    >
      {/* One type label (no redundant source, no "In primo piano" inside featured) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="editorial-label">{kindLabel}</span>
        {showSourceLabel ? (
          <span className="selection-status">{post.source_label}</span>
        ) : null}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "text-display-card mt-3 max-w-none",
          isHero && "text-[1.6rem] sm:text-[2rem]",
          !isHero && !isCompact && "text-[1.28rem] sm:text-[1.48rem]",
          isCompact && "text-[1.12rem] sm:text-[1.24rem]",
        )}
      >
        {post.title}
      </h3>

      {/* Show either dek (featured) or summary (compact), never both */}
      {isCompact ? (
        post.summary ? (
          <p
            className="text-body-soft mt-2.5 text-[0.9375rem] leading-6"
            style={{ color: "var(--muted-strong)" }}
          >
            {post.summary}
          </p>
        ) : null
      ) : (
        <p
          className={cn(
            "text-body-soft mt-2.5 leading-7",
            isHero ? "text-[1rem] sm:text-[1.05rem]" : "text-[0.94rem]",
          )}
          style={{ color: "var(--muted-strong)" }}
        >
          {post.dek}
        </p>
      )}

      {/* Maximum one highlight */}
      {post.highlights.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: "var(--line)",
              background: "var(--tv-surface-inverted-raised)",
              color: "var(--muted-strong)",
            }}
          >
            {post.highlights[0]}
          </span>
        </div>
      ) : null}

      {/* One primary CTA + clearly secondary tool link */}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <ButtonLink
          href={`/posts/${post.slug}`}
          variant="secondary"
          className="sm:min-w-0"
        >
          Apri il post
        </ButtonLink>
        {post.tool_slug ? (
          <Link
            href={`/toools/${post.tool_slug}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] opacity-50 transition-opacity hover:opacity-100"
            style={{ color: "var(--accent-strong)" }}
          >
            Vedi tool →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
