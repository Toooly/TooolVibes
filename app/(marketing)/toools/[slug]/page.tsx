import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DirectoryToolCard } from "@/components/directory/directory-tool-card";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { NativePlacement } from "@/components/monetization/native-placement";
import { siteConfig } from "@/lib/config/site";
import {
  getPublicToolViews,
  getRelatedToolViewsBySlug,
  getToolViewBySlug,
} from "@/lib/data/public-tools";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";
import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { PageOrbitShell } from "@/components/app/orbital-system";
import type { OrbitalItem } from "@/components/app/orbital-system";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const tools = await getPublicToolViews();
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolViewBySlug(slug);

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

function toolToOrbital(tool: ToolPublicView, sectionId: string): OrbitalItem {
  const words = tool.name.split(/\s+/).filter(Boolean);
  const initials = words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  return {
    id: `${sectionId}-${tool.slug}`,
    title: tool.name,
    initials: initials.toUpperCase(),
    description: tool.shortDescription || tool.description,
    category: tool.categoryLabel,
    href: `/toools/${tool.slug}`,
    sectionId,
    priority: 1,
    color: tool.accentFrom ?? "#6a3cff",
    shapeType: "gem",
    variant: "tool",
    size: "sm",
  };
}

function hasAffiliateSignal(href: string | null | undefined) {
  if (!href) {
    return false;
  }

  try {
    const url = new URL(href);
    return ["aff", "affiliate", "ref", "referral", "via"].some((key) => url.searchParams.has(key));
  } catch {
    return false;
  }
}

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = await getToolViewBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedToolViewsBySlug(tool.slug, 3);
  const sourceHref =
    tool.presentationKind === "directory" && tool.sourceSite === "weblium"
      ? "https://tooolvibes.weblium.site/all-tools"
      : tool.originalArticleUrl;
  const isAffiliateLink = Boolean(tool.affiliateUrl) || hasAffiliateSignal(tool.url);
  const accentFrom = tool.accentFrom ?? "#6a3cff";
  const accentTo = tool.accentTo ?? "#43c6ff";
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";
  const sourceLabel =
    tool.presentationKind === "directory"
      ? tool.sourceSite === "weblium"
        ? "Archivio Weblium"
        : "TooolVibes"
      : tool.sourceSite ?? "Archivio TooolVibes";

  // Build orbital items: related tools + navigation nodes
  const toolOrbitItems: OrbitalItem[] = [
    ...relatedTools.map((t) => toolToOrbital(t, "tool-detail")),
    {
      id: "tool-detail-archive",
      title: "Archivio",
      initials: "A",
      description: "Torna al catalogo completo.",
      category: "Navigazione",
      href: "/archivio",
      sectionId: "tool-detail",
      priority: 1,
      color: "#39d2f6",
      shapeType: "crystal",
      variant: "step",
      size: "md",
      iconName: "Search",
    },
    {
      id: "tool-detail-compare",
      title: "Confronta",
      initials: "C",
      description: "Aggiungi al confronto.",
      category: "Navigazione",
      href: "/compare",
      sectionId: "tool-detail",
      priority: 1,
      color: "#6a3cff",
      shapeType: "hexagon",
      variant: "step",
      size: "md",
      iconName: "GitCompare",
    },
    {
      id: "tool-detail-shortlist",
      title: "Salvati",
      initials: "S",
      description: "Salva per dopo.",
      category: "Navigazione",
      href: "/shortlist",
      sectionId: "tool-detail",
      priority: 1,
      color: "#f3bf4c",
      shapeType: "blob",
      variant: "step",
      size: "md",
      iconName: "Bookmark",
    },
  ];

  return (
    <PageOrbitShell sectionId="tool-detail" label={tool.name} items={toolOrbitItems}>
      <div className="internal-page internal-tool-page page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
        <section
          className="light-surface overflow-hidden rounded-[30px] border border-[rgba(83,63,170,0.12)] px-5 py-5 shadow-[0_28px_74px_rgba(36,19,103,0.1)] sm:rounded-[40px] sm:px-7 sm:py-8"
          style={{
            background: `radial-gradient(circle at top right, ${accentFrom}26, transparent 30%), radial-gradient(circle at bottom left, ${accentTo}24, transparent 32%), linear-gradient(135deg,#fefcff 0%,#f5f0ff 44%,#eef2ff 100%)`,
          }}
        >
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-start lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-start">
            <div>
              <div className="tool-detail-breadcrumb flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted-strong)] sm:gap-3 sm:text-[0.8rem]">
                <Link href="/" className="hover:text-[var(--accent-strong)]">
                  Home
                </Link>
                <span className="mx-1.5 h-1 w-1 rounded-full bg-[var(--line-strong)]" />
                <Link href="/archivio" className="hover:text-[var(--accent-strong)]">
                  Catalogo
                </Link>
                <span className="mx-1.5 h-1 w-1 rounded-full bg-[var(--line-strong)]" />
                <span>{tool.name}</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="tool-detail-hero-badge rounded-full border border-[rgba(109,59,255,0.14)] bg-[rgba(109,59,255,0.1)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] sm:px-4 sm:py-2">
                  {tool.categoryLabel}
                </span>
                {tool.levelLabel ? (
                  <span className="tool-detail-hero-badge tool-detail-hero-badge-muted rounded-full border border-[rgba(83,63,170,0.1)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)] sm:px-4 sm:py-2">
                    {tool.levelLabel}
                  </span>
                ) : null}
                {tool.toolOfWeek ? (
                  <span className="tool-detail-hero-badge rounded-full border border-[rgba(67,198,255,0.16)] bg-[rgba(67,198,255,0.12)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)] sm:px-4 sm:py-2">
                    Tool della settimana
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 max-w-[12ch] text-[clamp(2.15rem,14vw,3rem)] leading-[0.94] text-[var(--foreground)] sm:mt-6 sm:text-[3.8rem]">
                {tool.name}
              </h1>
              <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-[var(--muted-strong)] sm:mt-5 sm:text-[1.06rem] sm:leading-8">
                {tool.longDescription}
              </p>

              <div className="tool-detail-summary-grid mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["In breve", tool.tldr],
                  ["Per chi", tool.idealUseCase],
                  ["Lettura rapida", tool.editorialReview],
                ].map(([label, copy]) => (
                  <div
                    key={label}
                    className="tool-detail-summary-card rounded-[22px] border border-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                      {label}
                    </p>
                    <p className="tool-detail-summary-copy mt-2 text-[0.86rem] leading-6 text-[var(--muted-strong)]">
                      {copy}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--muted-strong)] sm:mt-6 sm:gap-3 sm:text-[0.78rem]">
                <span>{formattedPublishedAt}</span>
                <span className="mx-1.5 h-1 w-1 rounded-full bg-[var(--line-strong)]" />
                <span>{tool.readingTime ?? "Tempo non disponibile"}</span>
                <span className="mx-1.5 h-1 w-1 rounded-full bg-[var(--line-strong)]" />
                <span>{tool.domain}</span>
              </div>

              <div className="mt-4 rounded-[22px] border border-[rgba(83,63,170,0.12)] bg-white/68 px-4 py-3.5 text-[0.82rem] leading-6 text-[var(--muted-strong)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Nota editoriale
                </p>
                <div className="mt-2 grid gap-1 sm:grid-cols-3">
                  <p>Pubblicato: {formattedPublishedAt}</p>
                  <p>Fonte: {sourceLabel}</p>
                  <p>Revisione: dati editoriali in aggiornamento.</p>
                </div>
              </div>

              <div className="tool-detail-actions mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3">
                {isAffiliateLink ? (
                  <p className="basis-full text-[0.76rem] leading-5 text-[var(--muted-strong)]">
                    Link partner: potremmo ricevere una commissione senza costi extra per te.
                  </p>
                ) : null}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tool-detail-main-cta premium-button premium-button-primary inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(95,66,255,0.18)]"
                >
                  <span>{tool.ctaLabel ?? "Apri il sito"}</span>
                </a>
                <Link
                  href="/shortlist#wishlist"
                  className="tool-detail-secondary-cta premium-button inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Suggerisci un&apos;alternativa
                </Link>
                {sourceHref ? (
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tool-detail-secondary-cta premium-button inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Fonte TooolVibes
                  </a>
                ) : null}
                <div className="flex items-center gap-2">
                  <CompareToggle slug={tool.slug} compact />
                  <ShortlistToggle slug={tool.slug} compact />
                </div>
              </div>
            </div>

            <aside className="light-surface rounded-[26px] border border-[rgba(83,63,170,0.12)] bg-white/82 p-4 shadow-[0_18px_48px_rgba(36,19,103,0.08)] sm:rounded-[32px] sm:p-5">
              <div
                className="tool-detail-profile-panel rounded-[28px] p-5"
                style={{
                  background: `radial-gradient(circle at top right, ${accentFrom}20, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,241,255,0.92))`,
                }}
              >
                <div className="flex items-center gap-3">
                  <DirectoryToolGlyph tool={tool} size="lg" />
                  <div>
                    <p className="tool-detail-profile-label text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                      Profilo rapido
                    </p>
                    <p className="tool-detail-profile-title mt-1 text-[1.3rem] font-semibold text-[var(--foreground)]">
                      {tool.name}
                    </p>
                  </div>
                </div>

                <p className="tool-detail-profile-copy mt-5 text-sm leading-7 text-[var(--muted-strong)]">
                  {tool.whyItMatters}
                </p>
              </div>

              <div className="mt-4 space-y-3 sm:mt-5">
                <div className="tool-detail-meta-block rounded-[24px] bg-[rgba(246,244,255,0.88)] p-4">
                  <p className="tool-detail-meta-label text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    Categoria
                  </p>
                  <p className="mt-2 text-[0.98rem] leading-7 text-[var(--foreground)]">
                    {tool.categoryLabel}
                  </p>
                </div>

                <div className="tool-detail-meta-block rounded-[24px] bg-[rgba(246,244,255,0.88)] p-4">
                  <p className="tool-detail-meta-label text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    Punti forti
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tool.highlights.map((item) => (
                      <span
                        key={item}
                        className="tool-detail-highlight-badge rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="tool-detail-meta-block rounded-[24px] bg-[rgba(246,244,255,0.88)] p-4">
                  <p className="tool-detail-meta-label text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    Tag
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tool.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/archivio?tag=${encodeURIComponent(tag)}`}
                        className="tool-detail-tag-chip rounded-full px-3 py-1 text-xs font-semibold"
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

        <NativePlacement
          placementKey="tool-sponsored-alternative"
          variant="band"
          className="tool-detail-sponsored-placement"
        />

        <section className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:gap-6">
          <article className="light-surface rounded-[26px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-5 shadow-[0_18px_54px_rgba(35,18,95,0.08)] sm:rounded-[32px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Quando usarlo
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-[1.04] text-[var(--foreground)] sm:text-[1.7rem]">
              I casi in cui {tool.name} ha pi&ugrave; senso.
            </h2>
            <div className="mt-5 grid gap-3">
              {tool.useCases.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[22px] bg-[rgba(246,244,255,0.86)] px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    Caso d&apos;uso {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-[0.98rem] leading-7 text-[var(--foreground)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="light-surface rounded-[26px] border border-[rgba(83,63,170,0.12)] bg-white/88 p-5 shadow-[0_18px_54px_rgba(35,18,95,0.08)] sm:rounded-[32px] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Perch&eacute; conta
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-[1.04] text-[var(--foreground)] sm:text-[1.7rem]">
              Il punto editoriale dietro la selezione.
            </h2>
            <p className="mt-5 text-[1rem] leading-8 text-[var(--foreground)]">
              {tool.longDescription}
            </p>

            <div className="mt-6 rounded-[24px] bg-[rgba(246,244,255,0.86)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                Link rapidi
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {isAffiliateLink ? (
                  <p className="text-[0.76rem] leading-5 text-[var(--muted-strong)]">
                    Link partner: potremmo ricevere una commissione senza costi extra per te.
                  </p>
                ) : null}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tool-detail-main-cta premium-button premium-button-subtle inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                >
                  {tool.ctaLabel ?? "Apri il sito"}
                </a>
                {sourceHref ? (
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tool-detail-secondary-cta premium-button inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Apri la fonte originale TooolVibes
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        </section>

        {relatedTools.length > 0 ? (
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-[40rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Tool correlati
                </p>
                <h2 className="mt-3 text-[1.9rem] leading-[1.05] text-[var(--foreground)] sm:text-[2.5rem]">
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
    </PageOrbitShell>
  );
}
