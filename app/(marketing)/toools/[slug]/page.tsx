import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DirectoryToolCard } from "@/components/directory/directory-tool-card";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { siteConfig } from "@/lib/config/site";
import {
  directoryTools,
  getDirectoryToolBySlug,
  getRelatedDirectoryTools,
} from "@/lib/data/tooolvibes-directory";
import { formatItalianDate } from "@/lib/utils";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return directoryTools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getDirectoryToolBySlug(slug);

  if (!tool) {
    return {};
  }

  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | ${siteConfig.name}`,
      description: tool.description,
      url: `${siteConfig.url}/toools/${tool.slug}`,
    },
  };
}

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getDirectoryToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = getRelatedDirectoryTools(tool, 3);
  const sourceHref =
    tool.sourceSite === "weblium"
      ? "https://tooolvibes.weblium.site/all-tools"
      : tool.originalArticleUrl;

  return (
    <div className="page-shell space-y-6 pb-16 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
      <section
        className="overflow-hidden rounded-[40px] border border-[rgba(83,63,170,0.12)] px-5 py-6 shadow-[0_28px_74px_rgba(36,19,103,0.1)] sm:px-7 sm:py-8"
        style={{
          background: `radial-gradient(circle at top right, ${tool.accentFrom}26, transparent 30%), radial-gradient(circle at bottom left, ${tool.accentTo}24, transparent 32%), linear-gradient(135deg,#fefcff 0%,#f5f0ff 44%,#eef2ff 100%)`,
        }}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-[0.8rem] uppercase tracking-[0.16em] text-[var(--muted)]">
              <Link href="/" className="hover:text-[var(--accent-strong)]">
                Home
              </Link>
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
              <Link href="/archivio" className="hover:text-[var(--accent-strong)]">
                Archivio dei Toools
              </Link>
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
              <span>{tool.name}</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[rgba(109,59,255,0.1)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                {tool.categoryLabel}
              </span>
              <span className="rounded-full bg-white/78 px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                {tool.levelLabel}
              </span>
              {tool.toolOfWeek ? (
                <span className="rounded-full bg-[rgba(67,198,255,0.12)] px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  Tool della settimana
                </span>
              ) : null}
            </div>

            <h1 className="mt-6 max-w-[11ch] text-[2.6rem] leading-[0.94] text-[var(--foreground)] sm:text-[3.8rem]">
              {tool.name}
            </h1>
            <p className="mt-5 max-w-[42rem] text-[1.06rem] leading-8 text-[var(--muted-strong)]">
              {tool.longDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-[0.78rem] uppercase tracking-[0.16em] text-[var(--muted)]">
              <span>{formatItalianDate(tool.publishedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
              <span>{tool.readingTime}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
              <span>{tool.domain}</span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#8a61ff)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(95,66,255,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {tool.ctaLabel}
              </a>
              <Link
                href="/wishlist"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(83,63,170,0.12)] bg-white px-5 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Suggerisci alternativa
              </Link>
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(83,63,170,0.12)] bg-white/72 px-5 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Fonte originale
              </a>
            </div>
          </div>

          <aside className="rounded-[32px] border border-[rgba(83,63,170,0.12)] bg-white/82 p-5 shadow-[0_18px_48px_rgba(36,19,103,0.08)]">
            <div
              className="rounded-[28px] border border-[rgba(83,63,170,0.08)] p-5"
              style={{
                background: `radial-gradient(circle at top right, ${tool.accentFrom}20, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,241,255,0.92))`,
              }}
            >
              <div className="flex items-center gap-3">
                <DirectoryToolGlyph tool={tool} size="lg" />
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Profilo rapido
                  </p>
                  <p className="mt-1 text-[1.3rem] font-semibold text-[var(--foreground)]">
                    {tool.name}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--muted-strong)]">
                {tool.whyItMatters}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.88)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Category fit
                </p>
                <p className="mt-2 text-[0.98rem] leading-7 text-[var(--muted-strong)]">
                  {tool.categoryLabel}
                </p>
              </div>

              <div className="rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.88)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Highlights
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tool.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[rgba(83,63,170,0.1)] bg-white px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.88)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Tag
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/archivio?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-[rgba(83,63,170,0.1)] bg-white px-3 py-1 text-[0.72rem] font-semibold text-[var(--muted-strong)]"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-[32px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-5 shadow-[0_18px_54px_rgba(35,18,95,0.08)] sm:p-6">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Quando usarlo
          </p>
          <h2 className="mt-3 text-[1.7rem] leading-[0.98] text-[var(--foreground)]">
            I casi in cui {tool.name} ha pi&ugrave; senso.
          </h2>
          <div className="mt-5 grid gap-3">
            {tool.useCases.map((item, index) => (
              <div
                key={item}
                className="rounded-[22px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.86)] px-4 py-4"
              >
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Use case {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-[0.98rem] leading-7 text-[var(--muted-strong)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-5 shadow-[0_18px_54px_rgba(35,18,95,0.08)] sm:p-6">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Perch&eacute; conta
          </p>
          <h2 className="mt-3 text-[1.7rem] leading-[0.98] text-[var(--foreground)]">
            Il punto editoriale dietro la selezione.
          </h2>
          <p className="mt-5 text-[1rem] leading-8 text-[var(--muted-strong)]">
            {tool.longDescription}
          </p>

          <div className="mt-6 rounded-[24px] border border-[rgba(83,63,170,0.08)] bg-[rgba(246,244,255,0.86)] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Link rapidi
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[rgba(83,63,170,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                {tool.ctaLabel}
              </a>
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[rgba(83,63,170,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Apri la fonte originale TooolVibes
              </a>
            </div>
          </div>
        </article>
      </section>

      {relatedTools.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[40rem]">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Tool correlati
              </p>
              <h2 className="mt-3 text-[1.9rem] leading-[0.98] text-[var(--foreground)] sm:text-[2.5rem]">
                Se ti interessa {tool.name}, questi sono i confronti pi&ugrave;
                naturali.
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedTools.map((item) => (
              <DirectoryToolCard key={item.slug} tool={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
