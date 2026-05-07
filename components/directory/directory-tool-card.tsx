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
    <article className="premium-card group flex h-full min-h-[21rem] flex-col rounded-[26px] sm:min-h-[30rem] sm:rounded-[30px]">
      <div
        className="overflow-hidden border-b border-white/10 p-4 sm:p-6"
        style={{
          background: `radial-gradient(circle at top right, ${tool.accentFrom}32, transparent 36%), radial-gradient(circle at bottom left, ${tool.accentTo}22, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))`,
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
              <h3 className="text-display-card text-[1.26rem] leading-tight text-white sm:text-[1.5rem]">
                {tool.name}
              </h3>
              <p className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/56 sm:mt-2 sm:text-[0.78rem] sm:tracking-[0.16em]">
                {tool.categoryLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-[2.4rem] flex-wrap content-start gap-1.5 sm:mt-5 sm:min-h-[3.1rem] sm:gap-2">
          {tool.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[0.62rem] font-medium text-white/68 sm:px-3 sm:text-[0.68rem]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-white/10 bg-white/7 px-4 py-3">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/44">
              Livello
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white">
              {tool.levelLabel}
            </p>
          </div>
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/44">
              Fonte
            </p>
            <p className="mt-2 truncate text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white">
              {tool.domain}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
          <div className="rounded-[22px] border border-white/10 bg-white/7 p-4">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/44">
              TL;DR
            </p>
            <p className="text-clamp-2 mt-2 text-[0.9rem] leading-6 text-white/72">
              {tool.tldr}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-white/7 p-3.5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/44">
                Cosa fa
              </p>
              <p className="text-clamp-3 mt-2 text-[0.84rem] leading-6 text-white/66">
                {tool.whatItDoes}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/7 p-3.5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/44">
                Review rapida
              </p>
              <p className="text-clamp-3 mt-2 text-[0.84rem] leading-6 text-white/66">
                {tool.editorialReview}
              </p>
            </div>
          </div>

          <div className="flex min-h-[2.6rem] flex-wrap content-start gap-1.5 sm:min-h-[3rem] sm:gap-2">
            {tool.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/archivio?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/64 transition-colors duration-200 hover:border-white/24 hover:text-white sm:px-3 sm:text-[0.7rem] sm:tracking-[0.14em]"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4 sm:space-y-4 sm:pt-5">
          <p className="text-clamp-2 text-[0.86rem] leading-6 text-white/56 sm:text-sm">{tool.whyItMatters}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <PremiumLink href={tool.url} external>
              {tool.ctaLabel}
            </PremiumLink>
            <PremiumLink href={`/toools/${tool.slug}`} tone="secondary">
              Scopri di pi&ugrave;
            </PremiumLink>
          </div>

          <p className="text-center text-[0.62rem] uppercase tracking-[0.14em] text-white/44 sm:text-[0.7rem] sm:tracking-[0.16em]">
            Aggiornato {formatItalianDate(tool.publishedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
