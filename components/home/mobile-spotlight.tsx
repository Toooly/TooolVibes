"use client";

import Link from "next/link";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type MobileSpotlightProps = {
  tool: DirectoryTool;
  supportingTools?: DirectoryTool[];
};

export function MobileSpotlight({ tool, supportingTools = [] }: MobileSpotlightProps) {
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : undefined;
  const alternatives = supportingTools.slice(0, 4);

  return (
    <section className="featured-tool-card" aria-label="Tool della settimana">
      <div className="featured-tool-card__top">
        <div className="featured-tool-card__logo">
          {iconUrl ? <img src={iconUrl} alt="" loading="eager" decoding="async" /> : <span>{tool.name.slice(0, 2).toUpperCase()}</span>}
        </div>
        <div>
          <h2 className="featured-tool-card__title">{tool.name}</h2>
          <p className="featured-tool-card__meta">{tool.categoryLabel} · {tool.levelLabel}</p>
        </div>
      </div>
      <p className="featured-tool-card__desc">{tool.tldr || tool.shortDescription}</p>
      <div className="featured-tool-card__actions">
        <Link href={`/toools/${tool.slug}`} className="featured-tool-card__primary">Dettagli</Link>
        <Link href={`/compare?add=${tool.slug}`} className="featured-tool-card__ghost">Confronta</Link>
      </div>

      {alternatives.length > 0 && (
        <div className="featured-tool-card__rail">
          {alternatives.map((alt) => (
            <Link key={alt.slug} href={`/toools/${alt.slug}`} className="featured-tool-card__mini">
              <span>{alt.name.slice(0, 2).toUpperCase()}</span>
              <strong>{alt.name}</strong>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
