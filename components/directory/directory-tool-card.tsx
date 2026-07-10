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
    <article className="directory-tool-card premium-card group flex h-full min-h-[21rem] flex-col rounded-[26px] sm:min-h-[30rem] sm:rounded-[30px]">
      <div
        className="overflow-hidden border-b border-[var(--line)] p-4 sm:p-6"
        style={{
          background: `radial-gradient(circle at top right, ${tool.accentFrom}18, transparent 36%), radial-gradient(circle at bottom left, ${tool.accentTo}14, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.94), rgba(244,239,255,0.88))`,
        }}
      >
        <div className="flex items-start gap-3">
          <DirectoryToolGlyph
            tool={tool}
            size="lg"
            className={priority ? "shadow-[0_16px_30px_rgba(92,60,255,0.18)]" : ""}
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-h-[1.7rem] flex-wrap items-center gap-1.5 sm:min-h-[2rem] sm:gap-2">
              {tool.toolOfWeek ? (
                <PremiumBadge tone="warning">Tool della settimana</PremiumBadge>
              ) : null}
              <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
            </div>

            <div className="mt-2 min-h-[3.8rem] sm:mt-3 sm:min-h-[4.7rem]">
              <h3 className="text-display-card text-[1.26rem] leading-tight text-[var(--foreground)] sm:text-[1.5rem]">
                {tool.name}
              </h3>
              <p className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)] sm:mt-2 sm:text-[0.78rem] sm:tracking-[0.16em]">
                {tool.categoryLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-[2.4rem] flex-wrap content-start gap-1.5 sm:mt-5 sm:min-h-[3.1rem] sm:gap-2">
          {tool.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-[rgba(37,37,43,0.86)] px-2.5 py-1 text-[0.62rem] font-medium text-white/86 sm:px-3 sm:text-[0.68rem]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-white/10 bg-[rgba(37,37,43,0.86)] px-4 py-3">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/58">
              Livello
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white/88">
              {tool.levelLabel}
            </p>
          </div>
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/58">
              Fonte
            </p>
            <p className="mt-2 truncate text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white/88">
              {tool.domain}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
          <div className="rounded-[22px] border border-white/10 bg-[rgba(37,37,43,0.86)] p-4">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/58">
              In breve
            </p>
            <p className="text-clamp-2 mt-2 text-[0.9rem] leading-6 text-white/82">
              {tool.tldr}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-[rgba(37,37,43,0.86)] p-3.5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/58">
                Cosa fa
              </p>
              <p className="text-clamp-3 mt-2 text-[0.84rem] leading-6 text-white/82">
                {tool.whatItDoes}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[rgba(37,37,43,0.86)] p-3.5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/58">
                Lettura rapida
              </p>
              <p className="text-clamp-3 mt-2 text-[0.84rem] leading-6 text-white/82">
                {tool.editorialReview}
              </p>
            </div>
          </div>

          <div className="flex min-h-[2.6rem] flex-wrap content-start gap-1.5 sm:min-h-[3rem] sm:gap-2">
            {tool.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/archivio?tag=${encodeURIComponent(tag)}`}
                className="directory-tool-card__tag-link rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:px-3 sm:text-[0.7rem] sm:tracking-[0.14em]"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-4 sm:space-y-4 sm:pt-5">
          <p className="text-clamp-2 text-[0.86rem] leading-6 text-[var(--foreground)] sm:text-sm">{tool.whyItMatters}</p>

          <div className="directory-tool-card__actions grid gap-2 sm:grid-cols-2">
            <PremiumLink
              href={tool.url}
              external
              size="sm"
              className="directory-tool-card__action directory-tool-card__action-primary"
            >
              {tool.ctaLabel}
            </PremiumLink>
            <Link
              href={`/toools/${tool.slug}`}
              className="directory-tool-card__action directory-tool-card__action-secondary premium-button inline-flex items-center justify-center gap-2 rounded-full font-semibold"
            >
              Scopri di pi&ugrave;
            </Link>
          </div>

          <p className="text-center text-[0.62rem] uppercase tracking-[0.14em] text-[var(--muted-strong)] sm:text-[0.7rem] sm:tracking-[0.16em]">
            Aggiornato {formatItalianDate(tool.publishedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
