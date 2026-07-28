import Link from "next/link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";

import { ToolDetailActionSurface } from "./tool-detail-action-surface";

/**
 * A. Hero (Identity + Action Surface)
 * Server component. Renders breadcrumb, avatar + chips, name, deck,
 * action surface, meta. No client JS in this file.
 */

type ToolDetailHeroProps = {
  tool: ToolPublicView;
  isAffiliateLink: boolean;
};

export function ToolDetailHero({ tool, isAffiliateLink }: ToolDetailHeroProps) {
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";

  return (
    <div className="td-final-hero__identity">
      <nav className="td-final-hero__breadcrumb" aria-label="Percorso">
        <Link href="/">Home</Link>
        <span className="td-final-hero__breadcrumb-dot" aria-hidden="true" />
        <Link href="/archivio">Catalogo</Link>
        <span className="td-final-hero__breadcrumb-dot" aria-hidden="true" />
        <span aria-current="page">{tool.name}</span>
      </nav>

      <div className="td-final-hero__row">
        <span className="td-final-hero__avatar" aria-hidden="true">
          {tool.domain ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`}
              alt=""
              loading="eager"
              decoding="async"
            />
          ) : (
            <span>{tool.name.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
        <div className="td-final-hero__chips">
          <span className="td-final-chip td-final-chip--category">
            {tool.categoryLabel}
          </span>
          {tool.levelLabel ? (
            <span className="td-final-chip td-final-chip--level">
              {tool.levelLabel}
            </span>
          ) : null}
          {tool.toolOfWeek ? (
            <span className="td-final-chip td-final-chip--tool-of-week">
              <span className="td-final-chip__dot" aria-hidden="true" />
              Tool della settimana
            </span>
          ) : tool.featured ? (
            <span className="td-final-chip td-final-chip--featured">
              <span className="td-final-chip__dot" aria-hidden="true" />
              In evidenza
            </span>
          ) : null}
        </div>
      </div>

      <h1 id="td-final-tool-name" className="td-final-hero__name">
        {tool.name}
      </h1>
      <p className="td-final-hero__deck">{tool.shortDescription}</p>

      <ToolDetailActionSurface
        slug={tool.slug}
        name={tool.name}
        externalUrl={tool.url}
        primaryLabel={tool.ctaLabel ?? "Apri il sito"}
        isAffiliateLink={isAffiliateLink}
      />

      <div className="td-final-hero__meta">
        <div>
          <strong>{formattedPublishedAt}</strong> · pubblicato
        </div>
        {tool.readingTime ? (
          <div>
            <strong>{tool.readingTime}</strong> · lettura
          </div>
        ) : null}
        <div>
          <strong>{tool.domain}</strong> · dominio
        </div>
        {tool.tags.length > 0 ? (
          <div>
            {tool.tags.slice(0, 3).map((tag) => (
              <span key={tag} style={{ marginRight: "0.5rem" }}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
