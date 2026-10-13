import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";

import { ToolDetailScore } from "./tool-detail-score";

/**
 * A. Hero (Identity)
 * Server component. Breadcrumb, avatar, category, name, deck, compact
 * score · level. Actions live in ToolDetailActionSurface (rendered by
 * ToolDetailFinalPage after this component — exactly one instance).
 * Meta (date, reading time, domain, tags) lives in Approfondisci → Dati tecnici.
 * Fit copy lives in In breve, not in the hero facts.
 */

type ToolDetailHeroProps = {
  tool: ToolPublicView;
};

export function ToolDetailHero({ tool }: ToolDetailHeroProps) {
  return (
    <div className="td-final-hero__identity">
      <LocalizedAttributes><nav className="td-final-hero__breadcrumb" aria-label="Percorso">
        <Link href="/"><LocalizedText>{"Home"}</LocalizedText></Link>
        <span className="td-final-hero__breadcrumb-dot" aria-hidden="true" />
        <Link href="/archivio"><LocalizedText>{"Catalogo"}</LocalizedText></Link>
        <span className="td-final-hero__breadcrumb-dot" aria-hidden="true" />
        <span aria-current="page">{tool.name}</span>
      </nav></LocalizedAttributes>

      <div className="td-final-hero__row">
        <span className="td-final-hero__avatar" aria-hidden="true">
          {tool.domain ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <LocalizedAttributes><img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`}
              alt=""
              loading="eager"
              decoding="async"
            /></LocalizedAttributes>
          ) : (
            <span>{tool.name.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
        <div className="td-final-hero__identity-copy">
          <h1 id="td-final-tool-name" className="td-final-hero__name">
            {tool.name}
          </h1>
          <p className="td-final-hero__category"><LocalizedText>{tool.categoryLabel}</LocalizedText></p>
        </div>
      </div>
      <div className="td-final-hero__facts">
        <ToolDetailScore tool={tool} />
        {tool.levelLabel ? (
          <span className="td-final-hero__level-pill"><LocalizedText>{tool.levelLabel}</LocalizedText></span>
        ) : null}
      </div>
      <p className="td-final-hero__deck"><LocalizedText>{tool.shortDescription}</LocalizedText></p>

    </div>
  );
}
