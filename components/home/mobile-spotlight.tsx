"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

type MobileSpotlightProps = {
  tool: DirectoryTool;
  supportingTools?: DirectoryTool[];
};

function ToolSatellite({ tool, angle }: { tool: DirectoryTool; angle: number }) {
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;

  return (
    <Link
      href={`/toools/${tool.slug}`}
      className="mobile-spotlight-cosmic__satellite"
      style={
        {
          "--sat-angle": `${angle}deg`,
          "--sat-angle-back": `${-angle}deg`,
        } as CSSProperties
      }
      aria-label={tool.name}
    >
      <span className="mobile-spotlight-cosmic__satellite-ring" />
      <span className="mobile-spotlight-cosmic__satellite-body">
        {iconUrl ? (
          <img src={iconUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <small>{tool.name.slice(0, 2).toUpperCase()}</small>
        )}
      </span>
      <span className="mobile-spotlight-cosmic__satellite-name">{tool.name}</span>
    </Link>
  );
}

export function MobileSpotlight({ tool, supportingTools = [] }: MobileSpotlightProps) {
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : undefined;

  const satellites = supportingTools.slice(0, 3);

  return (
    <section className="mobile-spotlight-cosmic" aria-label="Tool della settimana">
      {/* Sfondo stellato */}
      <div className="mobile-spotlight-cosmic__stars" aria-hidden="true" />

      {/* Sistema centrale */}
      <div className="mobile-spotlight-cosmic__system">
        {/* Orbita esterna animata */}
        <div className="mobile-spotlight-cosmic__orbit" aria-hidden="true">
          <div className="mobile-spotlight-cosmic__orbit-track" />
        </div>

        <span className="mobile-spotlight-cosmic__weekly-pill">
          <Sparkles className="size-3" />
          Tool della settimana
        </span>
        <div
          className="mobile-spotlight-cosmic__planet"
          style={
            {
              "--planet-a": tool.accentFrom,
              "--planet-b": tool.accentTo,
            } as CSSProperties
          }
        >
          <div className="mobile-spotlight-cosmic__planet-glow" />
          <div className="mobile-spotlight-cosmic__planet-core">
            {iconUrl ? (
              <img src={iconUrl} alt="" loading="eager" decoding="async" />
            ) : (
              <span>{tool.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className="mobile-spotlight-cosmic__planet-label">
            {tool.name}
          </span>
        </div>

        {/* Satelliti */}
        <div className="mobile-spotlight-cosmic__satellites">
          {satellites.map((sat, i) => (
            <ToolSatellite
              key={sat.slug}
              tool={sat}
              angle={-135 + i * 120}
            />
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="mobile-spotlight-cosmic__info">
        <div className="mobile-spotlight-cosmic__badge">
          <Sparkles className="size-3.5" />
          <span>Tool della settimana</span>
        </div>
        <h2 className="mobile-spotlight-cosmic__title">{tool.name}</h2>
        <p className="mobile-spotlight-cosmic__category">{tool.categoryLabel} · {tool.levelLabel}</p>
        <p className="mobile-spotlight-cosmic__desc">{tool.tldr || tool.shortDescription}</p>

        <div className="mobile-spotlight-cosmic__stats">
          <div>
            <span>Use case</span>
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

        <div className="mobile-spotlight-cosmic__actions">
          <Link
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-spotlight-cosmic__cta mobile-spotlight-cosmic__cta--primary"
          >
            {tool.ctaLabel}
            <ExternalLink className="size-3.5" />
          </Link>
          <Link
            href={`/toools/${tool.slug}`}
            className="mobile-spotlight-cosmic__cta mobile-spotlight-cosmic__cta--ghost"
          >
            Scheda
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Altre candidate */}
      {satellites.length > 0 && (
        <div className="mobile-spotlight-cosmic__candidates">
          <p className="mobile-spotlight-cosmic__candidates-label">Altre candidate</p>
          <div className="mobile-spotlight-cosmic__candidates-scroll">
            {satellites.map((sat) => (
              <Link
                key={sat.slug}
                href={`/toools/${sat.slug}`}
                className="mobile-spotlight-cosmic__candidate"
                style={
                  {
                    "--candidate-a": sat.accentFrom,
                    "--candidate-b": sat.accentTo,
                  } as CSSProperties
                }
              >
                <span className="mobile-spotlight-cosmic__candidate-glow" />
                <span className="mobile-spotlight-cosmic__candidate-name">{sat.name}</span>
                <span className="mobile-spotlight-cosmic__candidate-cat">{sat.categoryLabel}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
