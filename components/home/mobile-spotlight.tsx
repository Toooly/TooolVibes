"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles, Trophy, Medal } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type MobileSpotlightProps = {
  tool: DirectoryTool;
  supportingTools?: DirectoryTool[];
};

function PodiumTool({
  tool,
  rank,
  className,
}: {
  tool: DirectoryTool;
  rank: number;
  className?: string;
}) {
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : undefined;

  const rankColors: Record<number, string> = {
    1: "linear-gradient(135deg, #FFD740 0%, #FF8F00 100%)",
    2: "linear-gradient(135deg, #C0C0C0 0%, #808080 100%)",
    3: "linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)",
  };

  const rankHeight: Record<number, string> = {
    1: "h-48 md:h-64",
    2: "h-36 md:h-48",
    3: "h-28 md:h-36",
  };

  return (
    <div className={`v-podium-step ${rankHeight[rank]} ${className || ""}`}>
      <div className="v-podium-step-glow" style={{ background: rankColors[rank] }} />
      <div className="v-podium-step-inner">
        <div className="v-podium-rank">
          {rank === 1 ? (
            <Trophy size={18} />
          ) : (
            <Medal size={16} />
          )}
          <span>#{rank}</span>
        </div>
        <div className="v-podium-avatar">
          {iconUrl ? (
            <img src={iconUrl} alt="" loading="eager" decoding="async" />
          ) : (
            <span>{tool.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <span className="v-podium-name">{tool.name}</span>
        <span className="v-podium-cat">{tool.categoryLabel}</span>
      </div>
    </div>
  );
}

export function MobileSpotlight({ tool, supportingTools = [] }: MobileSpotlightProps) {
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : undefined;

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
            Tool della settimana
          </span>
          <h2 className="v-spotlight-title">{tool.name}</h2>
          <p className="v-spotlight-category">
            {tool.categoryLabel} · {tool.levelLabel}
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
              <strong>{tool.readingTime}</strong>
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
              {tool.ctaLabel}
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
