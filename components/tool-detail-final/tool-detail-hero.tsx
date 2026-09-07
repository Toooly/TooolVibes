import Link from "next/link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { buildPromoChips } from "@/lib/tools/public-badges";

import { ToolDetailActionSurface } from "./tool-detail-action-surface";
import { ToolDetailScore } from "./tool-detail-score";

/**
 * A. Hero (Identity + Action Surface)
 * Server component. Breadcrumb, avatar, chips, name, deck, compact
 * score / best-for, actions. Meta (date, reading time, domain, tags)
 * lives in Approfondisci → Dati tecnici.
 */

type ToolDetailHeroProps = {
  tool: ToolPublicView;
  isAffiliateLink: boolean;
};

export function ToolDetailHero({ tool, isAffiliateLink }: ToolDetailHeroProps) {
  const bestFor =
    tool.idealUseCase?.trim() ||
    tool.publicTool.content.bestFor ||
    tool.useCases[0] ||
    null;

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
          {buildPromoChips(tool)
            .filter((chip) => chip.kind === "level")
            .map((chip) => (
            <span
              key={chip.label}
              className={
                chip.kind === "level"
                  ? "td-final-chip td-final-chip--level"
                  : `td-final-chip td-final-chip--${chip.kind}`
              }
            >
              {chip.kind !== "level" ? (
                <span className="td-final-chip__dot" aria-hidden="true" />
              ) : null}
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <h1 id="td-final-tool-name" className="td-final-hero__name">
        {tool.name}
      </h1>
      <p className="td-final-hero__deck">{tool.shortDescription}</p>

      <div className="td-final-hero__facts">
        <ToolDetailScore tool={tool} />
        {bestFor ? (
          <p className="td-final-hero__bestfor">
            <span className="td-final-hero__bestfor-label">Ideale per</span>
            {bestFor}
          </p>
        ) : null}
      </div>

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
