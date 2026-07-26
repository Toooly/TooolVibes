import Link from "next/link";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { formatItalianDate } from "@/lib/utils";

import { VisualLabActionSurface } from "./visual-lab-action-surface";
import { VisualLabScoreInstrument } from "./visual-lab-score-instrument";

type VisualLabHeroProps = {
  tool: ToolPublicView;
  isAffiliateLink: boolean;
};

export function VisualLabHero({ tool, isAffiliateLink }: VisualLabHeroProps) {
  const formattedPublishedAt = tool.publishedAt
    ? formatItalianDate(tool.publishedAt)
    : "Data non disponibile";

  return (
    <section className="td-lab-command" aria-labelledby="td-lab-tool-name">
      <div className="td-lab-command__grid">
        <div className="td-lab-identity">
          <nav className="td-lab-identity__crumb" aria-label="Percorso lab">
            <Link href="/">Home</Link>
            <span aria-hidden="true" className="td-lab-identity__crumb-dot" />
            <span>Visual Lab</span>
            <span aria-hidden="true" className="td-lab-identity__crumb-dot" />
            <span aria-current="page">{tool.name}</span>
          </nav>

          <div className="td-lab-identity__badges">
            <span className="td-lab-badge td-lab-badge--category">{tool.categoryLabel}</span>
            {tool.featured ? (
              <span className="td-lab-badge td-lab-badge--status">
                <span className="td-lab-badge__signal" aria-hidden="true" />
                In evidenza
              </span>
            ) : null}
            {tool.toolOfWeek ? (
              <span className="td-lab-badge td-lab-badge--gold">
                <span className="td-lab-badge__lock" aria-hidden="true" />
                Tool della settimana
              </span>
            ) : null}
          </div>

          <div className="td-lab-identity__mark">
            <span className="td-lab-identity__avatar" aria-hidden="true">
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
              <span className="td-lab-identity__pulse" />
            </span>
            <div className="td-lab-identity__titles">
              <p className="td-lab-identity__eyebrow">Command surface</p>
              <h1 id="td-lab-tool-name" className="td-lab-identity__name">
                {tool.name}
              </h1>
            </div>
          </div>

          <p className="td-lab-identity__positioning">{tool.shortDescription}</p>

          <VisualLabActionSurface
            slug={tool.slug}
            name={tool.name}
            externalUrl={tool.url}
            primaryLabel={tool.ctaLabel ?? "Apri il sito"}
            isAffiliateLink={isAffiliateLink}
          />

          <dl className="td-lab-identity__meta" aria-label="Metadati">
            <div>
              <dt>Pubblicato</dt>
              <dd>{formattedPublishedAt}</dd>
            </div>
            {tool.readingTime ? (
              <div>
                <dt>Lettura</dt>
                <dd>{tool.readingTime}</dd>
              </div>
            ) : null}
            <div>
              <dt>Dominio</dt>
              <dd>{tool.domain}</dd>
            </div>
            {tool.tags.length > 0 ? (
              <div className="td-lab-identity__tags">
                <dt>Tag</dt>
                <dd>
                  {tool.tags.slice(0, 4).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <VisualLabScoreInstrument tool={tool} />
      </div>
    </section>
  );
}
