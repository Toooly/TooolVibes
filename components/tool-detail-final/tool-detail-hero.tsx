import Link from "next/link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";

import { ToolDetailActionSurface } from "./tool-detail-action-surface";
import { ToolDetailScore } from "./tool-detail-score";

/**
 * A. Hero (Identity + Action Surface)
 * Server component. Breadcrumb, avatar, category, name, deck, compact
 * score · level, actions. Meta (date, reading time, domain, tags)
 * lives in Approfondisci → Dati tecnici.
 * Fit copy lives in In breve, not in the hero facts.
 */

type ToolDetailHeroProps = {
  tool: ToolPublicView;
  isAffiliateLink: boolean;
};

export function ToolDetailHero({ tool, isAffiliateLink }: ToolDetailHeroProps) {
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
        <div className="td-final-hero__identity-copy">
          <h1 id="td-final-tool-name" className="td-final-hero__name">
            {tool.name}
          </h1>
          <p className="td-final-hero__category">{tool.categoryLabel}</p>
        </div>
      </div>
      <div className="td-final-hero__facts">
        <ToolDetailScore tool={tool} />
        {tool.levelLabel ? (
          <span className="td-final-hero__level-pill">{tool.levelLabel}</span>
        ) : null}
      </div>
      <p className="td-final-hero__deck">{tool.shortDescription}</p>

      <ToolDetailActionSurface
        slug={tool.slug}
        name={tool.name}
        externalUrl={tool.url}
        primaryLabel={tool.ctaLabel ?? "Apri il sito"}
        isAffiliateLink={isAffiliateLink}
      />
    </div>
  );
}
