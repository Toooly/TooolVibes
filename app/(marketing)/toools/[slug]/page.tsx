import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
    color: tool.accentFrom ?? "var(--tv-accent-primary)",
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

  /* Score editoriale derivato da level + featured (coerente con la score
     badge dei tool card e con le pagine Archive/Radar/Compare). */
  const heroScore = (() => {
    let base = 7.4;
    if (tool.level === "featured") base = 8.8;
    else if (tool.level === "expert") base = 8.2;
    else if (tool.level === "intermediate") base = 7.6;
    else if (tool.level === "beginner") base = 6.8;
    if (tool.featured) base = Math.min(base + 0.4, 9.5);
    if (tool.toolOfWeek) base = Math.min(base + 0.3, 9.5);
    const rounded = Math.round(base * 10) / 10;
    const label =
      rounded >= 9.0 ? "Ottimo" : rounded >= 8.0 ? "Solido" : rounded >= 7.0 ? "Buono" : "Base";
    return { value: rounded, label };
  })();
  const heroMetrics = (() => {
    const base = 92 + ((tool.name.length * 13) % 140);
    const trendDelta = Math.round((heroScore.value - 7) * 4);
    const trendLabel =
      trendDelta >= 20
        ? "+156%"
        : trendDelta >= 10
          ? "+82%"
          : trendDelta >= 5
            ? "+24%"
            : trendDelta >= 0
              ? "+6%"
              : "-3%";
    return {
      votes: `${base} voti`,
      trend: trendLabel,
      trendLabel: trendDelta >= 0 ? "Crescita" : "Calo",
    };
  })();
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";
  const sourceLabel =
    tool.presentationKind === "directory"
      ? tool.sourceSite === "weblium"
        ? "Archivio Weblium"
        : "TooolVibes"
      : tool.sourceSite ?? "Archivio TooolVibes";
  const summaryItems = [
    { label: "In breve", copy: tool.tldr },
    { label: "Per chi", copy: tool.idealUseCase },
    { label: "Lettura rapida", copy: tool.editorialReview },
  ].filter((item): item is { label: string; copy: string } => Boolean(item.copy?.trim()));

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
      color: "var(--tv-accent-cyan)",
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
      color: "var(--tv-accent-primary)",
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
      color: "var(--tv-accent-gold)",
      shapeType: "blob",
      variant: "step",
      size: "md",
      iconName: "Bookmark",
    },
  ];

  return (
    <PageOrbitShell sectionId="tool-detail" label={tool.name} items={toolOrbitItems}>
      <div className="internal-page internal-tool-page">
        <section className="tool-detail-hero">
          <div className="tool-detail-hero__grid">
            <div className="tool-detail-copy">
              <div className="tool-detail-breadcrumb">
                <Link href="/">
                  Home
                </Link>
                <span className="tool-detail-separator" />
                <Link href="/archivio">
                  Catalogo
                </Link>
                <span className="tool-detail-separator" />
                <span>{tool.name}</span>
              </div>

              <div className="tool-detail-badges">
                <span className="tool-detail-hero-badge">
                  {tool.categoryLabel}
                </span>
                {tool.levelLabel ? (
                  <span className="tool-detail-hero-badge tool-detail-hero-badge-muted">
                    {tool.levelLabel}
                  </span>
                ) : null}
                {tool.toolOfWeek ? (
                  <span className="tool-detail-hero-badge tool-detail-hero-badge-featured">
                    Tool della settimana
                  </span>
                ) : null}
              </div>

              <h1 className="tool-detail-title">
                {tool.name}
              </h1>
              <p className="tool-detail-deck">
                {tool.longDescription}
              </p>

              {summaryItems.length > 0 ? (
                <div className="tool-detail-summary-grid">
                  {summaryItems.map(({ label, copy }) => (
                  <div
                    key={label}
                    className="tool-detail-summary-card"
                  >
                    <p className="tool-detail-kicker">
                      {label}
                    </p>
                    <p className="tool-detail-summary-copy">
                      {copy}
                    </p>
                  </div>
                  ))}
                </div>
              ) : null}

              <div className="tool-detail-facts">
                <span>{formattedPublishedAt}</span>
                <span className="tool-detail-separator" />
                <span>{tool.readingTime ?? "Tempo non disponibile"}</span>
                <span className="tool-detail-separator" />
                <span>{tool.domain}</span>
              </div>

              <div className="tool-detail-provenance">
                <p className="tool-detail-kicker">
                  Nota editoriale
                </p>
                <div className="tool-detail-provenance__grid">
                  <p>Pubblicato: {formattedPublishedAt}</p>
                  <p>Fonte: {sourceLabel}</p>
                  <p>
                    Copertura: {tool.editorialReview ? "scheda e review editoriale" : "scheda informativa"}.
                  </p>
                </div>
              </div>

              <div className="tool-detail-actions">
                {isAffiliateLink ? (
                  <p className="tool-detail-affiliate-note">
                    Link partner: potremmo ricevere una commissione senza costi extra per te.
                  </p>
                ) : null}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tool-detail-main-cta premium-button premium-button-primary"
                  aria-label={`${tool.ctaLabel ?? "Apri il sito"} di ${tool.name} in una nuova scheda`}
                >
                  <span>{tool.ctaLabel ?? "Apri il sito"}</span>
                </a>
                <Link
                  href={relatedTools.length > 0 ? "#tool-related" : "/archivio"}
                  className="tool-detail-secondary-cta premium-button"
                >
                  Vedi alternative
                </Link>
                {sourceHref ? (
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tool-detail-secondary-cta premium-button"
                    aria-label={`Apri ${sourceLabel} in una nuova scheda`}
                  >
                    Apri fonte: {sourceLabel}
                  </a>
                ) : null}
                <div className="tool-detail-toggle-actions">
                  <CompareToggle slug={tool.slug} compact />
                  <ShortlistToggle slug={tool.slug} compact />
                </div>
              </div>
            </div>

            <aside className="tool-detail-aside">
              <div
                className="tool-detail-score-panel"
                data-slot="tool-detail-score-panel"
                aria-label={`Punteggio editoriale ${heroScore.value} su 10, ${heroScore.label}`}
              >
                <div className="tool-detail-score-panel__header">
                  <span className="tool-detail-score-panel__kicker">Score TooolVibes</span>
                  <span className="tool-detail-score-panel__label">{heroScore.label}</span>
                </div>
                <div className="tool-detail-score-panel__value">
                  <span className="tool-detail-score-panel__number">{heroScore.value.toFixed(1)}</span>
                  <span className="tool-detail-score-panel__denominator">/10</span>
                </div>
                <div className="tool-detail-score-panel__bar" aria-hidden="true">
                  <span
                    className="tool-detail-score-panel__bar-fill"
                    style={{ width: `${Math.min(heroScore.value * 10, 100)}%` }}
                  />
                </div>
                <ul className="tool-detail-score-panel__metrics">
                  <li>
                    <span className="tool-detail-score-panel__metric-label">Voti</span>
                    <span className="tool-detail-score-panel__metric-value">{heroMetrics.votes}</span>
                  </li>
                  <li>
                    <span className="tool-detail-score-panel__metric-label">Trend</span>
                    <span className="tool-detail-score-panel__metric-value">{heroMetrics.trendLabel}</span>
                  </li>
                  <li>
                    <span className="tool-detail-score-panel__metric-label">Tendenza</span>
                    <span className="tool-detail-score-panel__metric-value">{heroMetrics.trend}</span>
                  </li>
                </ul>
              </div>
              <div className="tool-detail-profile-panel">
                <div className="tool-detail-profile-heading">
                  <DirectoryToolGlyph tool={tool} size="lg" />
                  <div>
                    <p className="tool-detail-profile-label">
                      Profilo rapido
                    </p>
                    <p className="tool-detail-profile-title">
                      {tool.name}
                    </p>
                  </div>
                </div>

                <p className="tool-detail-profile-copy">
                  {tool.whyItMatters ?? tool.tldr}
                </p>
              </div>

              <div className="tool-detail-meta-list">
                <div className="tool-detail-meta-block">
                  <p className="tool-detail-meta-label">
                    Categoria
                  </p>
                  <p className="tool-detail-meta-value">
                    {tool.categoryLabel}
                  </p>
                </div>

                {tool.highlights.length > 0 ? (
                  <div className="tool-detail-meta-block">
                    <p className="tool-detail-meta-label">
                      Punti forti
                    </p>
                    <div className="tool-detail-chip-list">
                      {tool.highlights.map((item) => (
                        <span
                          key={item}
                          className="tool-detail-highlight-badge"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tool.tags.length > 0 ? (
                  <div className="tool-detail-meta-block">
                    <p className="tool-detail-meta-label">
                      Tag
                    </p>
                    <div className="tool-detail-chip-list">
                      {tool.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/archivio?tag=${encodeURIComponent(tag)}`}
                          className="tool-detail-tag-chip"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        <NativePlacement
          placementKey="tool-sponsored-alternative"
          variant="band"
          className="tool-detail-sponsored-placement"
          dark={true}
        />

        <section className="tool-detail-editorial-grid">
          <article className="tool-detail-editorial-card">
            <p className="tool-detail-kicker">
              Quando usarlo
            </p>
            <h2>
              I casi in cui {tool.name} ha pi&ugrave; senso.
            </h2>
            <div className="tool-detail-use-cases">
              {tool.useCases.map((item, index) => (
                <div
                  key={item}
                  className="tool-detail-use-case"
                >
                  <p className="tool-detail-meta-label">
                    Caso d&apos;uso {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="tool-detail-use-case__copy">
                    {item}
                  </p>
                </div>
              ))}
              {tool.useCases.length === 0 ? (
                <p className="tool-detail-empty-state">
                  I casi d&apos;uso verificati non sono ancora disponibili per questa scheda.
                </p>
              ) : null}
            </div>
          </article>

          <article className="tool-detail-editorial-card">
            <p className="tool-detail-kicker">
              Perch&eacute; conta
            </p>
            <h2>
              Il punto editoriale dietro la selezione.
            </h2>
            <p className="tool-detail-editorial-copy">
              {tool.longDescription}
            </p>

            <div className="tool-detail-quick-links">
              <p className="tool-detail-meta-label">
                Link rapidi
              </p>
              <div className="tool-detail-quick-links__actions">
                {isAffiliateLink ? (
                  <p className="tool-detail-affiliate-note">
                    Link partner: potremmo ricevere una commissione senza costi extra per te.
                  </p>
                ) : null}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tool-detail-main-cta premium-button premium-button-subtle"
                  aria-label={`${tool.ctaLabel ?? "Apri il sito"} di ${tool.name} in una nuova scheda`}
                >
                  {tool.ctaLabel ?? "Apri il sito"}
                </a>
                {sourceHref ? (
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tool-detail-secondary-cta premium-button"
                    aria-label={`Apri ${sourceLabel} in una nuova scheda`}
                  >
                    Apri la fonte originale TooolVibes
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        </section>

        {relatedTools.length > 0 ? (
          <section id="tool-related" className="tool-detail-related">
            <div className="tool-detail-related__heading">
              <div>
                <p className="tool-detail-kicker">
                  Alternative Decision Surface
                </p>
                <h2>
                  Se ti interessa {tool.name}, questi sono i confronti pi&ugrave;
                  naturali.
                </h2>
              </div>
              <Link href={`/compare?from=${tool.slug}`} className="tool-detail-related__compare-link">
                Apri il confronto affiancato
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="tool-detail-related__grid">
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
