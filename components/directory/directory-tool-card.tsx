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
    <article className="premium-card group flex h-full min-h-[27rem] flex-col rounded-[30px] sm:min-h-[31rem]">
      <div
        className="overflow-hidden border-b border-white/10 p-5 sm:p-6"
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
            <div className="flex min-h-[2rem] flex-wrap items-center gap-2">
              {tool.toolOfWeek ? (
                <PremiumBadge tone="warning">Tool della settimana</PremiumBadge>
              ) : null}
              <PremiumBadge tone={levelTone[tool.level]}>{tool.levelLabel}</PremiumBadge>
            </div>

            <div className="mt-3 min-h-[4.7rem]">
              <h3 className="text-display-card text-[1.5rem] text-white">
                {tool.name}
              </h3>
              <p className="mt-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-white/54">
                {tool.categoryLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex min-h-[3.1rem] flex-wrap content-start gap-2">
          {tool.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-medium text-white/66"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
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

        <div className="mt-5 space-y-4">
            <p className="text-clamp-3 min-h-[5rem] text-[0.98rem] leading-7 text-white/66">
            {tool.description}
          </p>

          <div className="flex min-h-[3rem] flex-wrap content-start gap-2">
            {tool.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/archivio?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-white/10 bg-white/7 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/62 transition-colors duration-200 hover:border-white/24 hover:text-white"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-4 border-t border-white/10 pt-5">
          <p className="text-sm leading-6 text-white/54">{tool.whyItMatters}</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <PremiumLink href={tool.url} external>
              {tool.ctaLabel}
            </PremiumLink>
            <PremiumLink href={`/toools/${tool.slug}`} tone="secondary">
              Scopri di pi&ugrave;
            </PremiumLink>
          </div>

          <p className="text-center text-[0.7rem] uppercase tracking-[0.16em] text-white/42">
            Aggiornato {formatItalianDate(tool.publishedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
