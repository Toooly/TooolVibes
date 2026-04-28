import Link from "next/link";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { PremiumBadge, PremiumLink } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type DirectoryToolCardProps = {
  tool: DirectoryTool;
  priority?: boolean;
};

const levelTone: Record<DirectoryTool["level"], "accent" | "success" | "neutral" | "dark"> = {
  featured: "accent",
  beginner: "success",
  intermediate: "neutral",
  expert: "dark",
};

export function DirectoryToolCard({
  tool,
  priority = false,
}: DirectoryToolCardProps) {
  return (
    <article className="premium-card group flex h-full min-h-[31rem] flex-col rounded-[30px]">
      <div
        className="overflow-hidden border-b border-[rgba(76,55,166,0.08)] p-5 sm:p-6"
        style={{
          background: `radial-gradient(circle at top right, ${tool.accentFrom}22, transparent 36%), radial-gradient(circle at bottom left, ${tool.accentTo}22, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,240,255,0.94))`,
        }}
      >
        <div className="flex items-start gap-3">
          <DirectoryToolGlyph
            tool={tool}
            size="lg"
            className={priority ? "shadow-[0_16px_30px_rgba(92,60,255,0.18)]" : ""}
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-h-[2rem] flex-wrap items-center gap-2">
              {tool.toolOfWeek ? (
                <PremiumBadge tone="warning">Tool della settimana</PremiumBadge>
              ) : null}
              <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
            </div>

            <div className="mt-3 min-h-[4.7rem]">
              <h3 className="text-display-card text-[1.5rem] text-[var(--foreground)]">
                {tool.name}
              </h3>
              <p className="mt-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                {tool.categoryLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex min-h-[3.1rem] flex-wrap content-start gap-2">
          {tool.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-[0.68rem] font-medium text-[var(--muted-strong)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-[rgba(76,55,166,0.08)] bg-[rgba(246,244,255,0.76)] px-4 py-3">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Livello
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              {tool.levelLabel}
            </p>
          </div>
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Fonte
            </p>
            <p className="mt-2 truncate text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              {tool.domain}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
            <p className="text-clamp-3 min-h-[5rem] text-[0.98rem] leading-7 text-[var(--muted-strong)]">
            {tool.description}
          </p>

          <div className="flex min-h-[3rem] flex-wrap content-start gap-2">
            {tool.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/archivio?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-[rgba(76,55,166,0.12)] bg-[rgba(244,240,255,0.82)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)] transition-colors duration-200 hover:border-[rgba(108,76,255,0.22)] hover:text-[var(--accent-strong)]"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-4 border-t border-[rgba(76,55,166,0.08)] pt-5">
          <p className="text-sm leading-6 text-[var(--muted)]">{tool.whyItMatters}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <PremiumLink href={tool.url} external>
              {tool.ctaLabel}
            </PremiumLink>
            <PremiumLink href={`/toools/${tool.slug}`} tone="secondary">
              Scopri di pi&ugrave;
            </PremiumLink>
          </div>

          <p className="text-center text-[0.7rem] uppercase tracking-[0.16em] text-[var(--muted)]">
            Aggiornato {formatItalianDate(tool.publishedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
