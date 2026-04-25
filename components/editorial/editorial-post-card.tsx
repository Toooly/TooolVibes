import Link from "next/link";

import type { EditorialPostRecord } from "@/lib/types/article";
import { cn } from "@/lib/utils";

import { ButtonLink } from "@/components/ui/button";

type EditorialPostCardProps = {
  post: EditorialPostRecord;
  compact?: boolean;
  className?: string;
};

const kindLabels: Record<EditorialPostRecord["kind"], string> = {
  "tool-writeup": "Approfondimento tool",
  guide: "Guida legacy",
};

export function EditorialPostCard({ post, compact = false, className }: EditorialPostCardProps) {
  return (
    <article
      className={cn(
        "brand-panel panel-lift relative flex h-full flex-col overflow-hidden rounded-[30px] p-4.5 sm:p-5",
        compact && "gap-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="editorial-label">{kindLabels[post.kind]}</span>
        <span className="selection-status">{post.source_label}</span>
        {post.featured ? <span className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)" }}>In primo piano</span> : null}
      </div>

      <h3
        className={cn(
          "text-display-card mt-3 max-w-none text-[1.28rem] sm:text-[1.48rem]",
          compact && "sm:text-[1.32rem]",
        )}
      >
        {post.title}
      </h3>
      <p className="text-body-soft mt-2.5 text-[0.94rem] leading-7" style={{ color: "var(--muted-strong)" }}>
        {post.dek}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {post.highlights.slice(0, compact ? 1 : 2).map((item) => (
          <span
            key={item}
            className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
            style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.72)", color: "var(--muted-strong)" }}
          >
            {item}
          </span>
        ))}
      </div>

      {!compact ? (
        <p className="mt-4 text-sm leading-7" style={{ color: "var(--muted-strong)" }}>
          {post.summary}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <ButtonLink href={`/posts/${post.slug}`} variant="secondary" className="sm:min-w-0">
          Apri il post
        </ButtonLink>
        {post.tool_slug ? (
          <Link href={`/toools/${post.tool_slug}`} className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
            Apri il tool
          </Link>
        ) : null}
      </div>
    </article>
  );
}
