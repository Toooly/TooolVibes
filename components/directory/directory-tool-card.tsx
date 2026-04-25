import Link from "next/link";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type DirectoryToolCardProps = {
  tool: DirectoryTool;
  priority?: boolean;
};

export function DirectoryToolCard({
  tool,
  priority = false,
}: DirectoryToolCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[rgba(76,55,166,0.12)] bg-white/92 shadow-[0_18px_50px_rgba(35,18,95,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(108,76,255,0.26)] hover:shadow-[0_26px_64px_rgba(40,19,112,0.14)]">
      <div
        className="overflow-hidden border-b border-[rgba(76,55,166,0.08)] p-5 sm:p-6"
        style={{
          background: `radial-gradient(circle at top right, ${tool.accentFrom}22, transparent 36%), radial-gradient(circle at bottom left, ${tool.accentTo}22, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,240,255,0.94))`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <DirectoryToolGlyph
              tool={tool}
              size="lg"
              className={
                priority ? "shadow-[0_16px_30px_rgba(92,60,255,0.18)]" : ""
              }
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {tool.toolOfWeek ? (
                  <span className="rounded-full bg-[rgba(109,59,255,0.12)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                    Tool della settimana
                  </span>
                ) : null}
                {tool.featured && !tool.toolOfWeek ? (
                  <span className="rounded-full bg-[rgba(67,198,255,0.12)] px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                    In evidenza
                  </span>
                ) : null}
              </div>

              <div className="mt-3 min-h-[4.8rem]">
                <h3 className="text-[1.45rem] leading-[1.02] text-[var(--foreground)]">
                  {tool.name}
                </h3>
                <p className="mt-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                  {tool.categoryLabel}
                </p>
              </div>
            </div>
          </div>

          <span className="rounded-full border border-white/50 bg-white/82 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
            {tool.category}
          </span>
        </div>

        <div className="mt-5 flex min-h-[3rem] flex-wrap content-start gap-2">
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
              Pubblicato
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              {formatItalianDate(tool.publishedAt)}
            </p>
          </div>
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Lettura
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              {tool.readingTime}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-[0.98rem] leading-7 text-[var(--muted-strong)]">
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
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-4 py-3 text-sm font-semibold shadow-[0_14px_28px_rgba(95,66,255,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
              style={{ color: "#ffffff" }}
            >
              {tool.ctaLabel}
            </a>
            <Link
              href={`/toools/${tool.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-[rgba(76,55,166,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Scopri di più
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
