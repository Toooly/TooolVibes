"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

type MobileSpotlightProps = {
  tool: ToolPublicView;
  supportingTools?: ToolPublicView[];
};

function PodiumTool({
  tool,
  rank,
  className,
}: {
  tool: ToolPublicView;
  rank: number;
  className?: string;
}) {
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : undefined;
  const podiumClassName = `v-podium-step v-podium-step--rank-${rank} ${className || ""}`;
  const renderContent = () => (
    <>
      <div className="v-podium-rank" aria-label={`Posizione ${rank}`}>
        <span>{rank}</span>
      </div>
      <div className="v-podium-step-glow" />
      <div className="v-podium-step-inner">
        <div className="v-podium-avatar">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- TODO(B66): migrate this runtime image after the image contract is unified.
            <img src={iconUrl} alt="" loading="eager" decoding="async" />
          ) : (
            <span>{tool.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <span className="v-podium-name">{tool.name}</span>
        <span className="v-podium-cat">{tool.categoryLabel}</span>
      </div>
    </>
  );

  return (
    <>
      <Link
        href={`/toools/${tool.slug}`}
        className={`${podiumClassName} v-podium-step--mobile-link`}
        aria-label={`Apri la scheda di ${tool.name}, posizione ${rank}`}
      >
        {renderContent()}
      </Link>
      <div className={`${podiumClassName} v-podium-step--desktop-static`}>
        {renderContent()}
      </div>
    </>
  );
}

export function MobileSpotlight({ tool, supportingTools = [] }: MobileSpotlightProps) {
  const podiumTools = [tool, ...supportingTools.slice(0, 2)];
  const [first, second, third] = [
    podiumTools[0],
    podiumTools[1],
    podiumTools[2],
  ];

  return (
    <section className="v-spotlight-section" aria-label="Tool della settimana">
      {/* Starfield background */}
      <div className="v-spotlight-stars" aria-hidden="true" />

      <div className="v-spotlight-content">
        {/* Header */}
        <div className="v-spotlight-header">
          <span className="v-spotlight-eyebrow">
            <Sparkles className="size-3.5" />
            {tool.toolOfWeek ? "Tool della settimana" : "Tool in evidenza"}
          </span>
          <h2 className="v-spotlight-title">{tool.name}</h2>
          <p className="v-spotlight-category">
            {tool.categoryLabel}{tool.levelLabel ? ` · ${tool.levelLabel}` : ""}
          </p>
          <p className="v-spotlight-desc">
            {tool.tldr || tool.shortDescription}
          </p>
        </div>

        {/* Podium 3D */}
        <div className="v-podium-stage">
          <div className="v-podium-platform">
            {second && (
              <PodiumTool tool={second} rank={2} className="v-podium-step--second" />
            )}
            {first && (
              <PodiumTool tool={first} rank={1} className="v-podium-step--first" />
            )}
            {third && (
              <PodiumTool tool={third} rank={3} className="v-podium-step--third" />
            )}
          </div>
          {/* Floor reflection */}
          <div className="v-podium-floor" aria-hidden="true" />
        </div>

        {/* Info & actions */}
        <div className="v-spotlight-info">
          <div className="v-spotlight-stats">
            <div>
              <span>Casi d&apos;uso</span>
              <strong>{tool.useCases.length}</strong>
            </div>
            <div>
              <span>Lettura</span>
              <strong>{tool.readingTime ?? "—"}</strong>
            </div>
            <div>
              <span>Tag</span>
              <strong>{tool.highlights.length}</strong>
            </div>
          </div>

          <div className="v-spotlight-actions">
            <Link
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="v-spotlight-cta v-spotlight-cta--primary"
            >
              {tool.ctaLabel ?? "Apri il sito"}
              <ExternalLink className="size-3.5" />
            </Link>
            <Link
              href={`/toools/${tool.slug}`}
              className="v-spotlight-cta v-spotlight-cta--ghost"
            >
              Apri scheda
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
