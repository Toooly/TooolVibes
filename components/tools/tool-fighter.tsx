"use client";

import { type CSSProperties } from "react";
import { motion } from "motion/react";
import { useState } from "react";
import { getToolBadgeLabel } from "@/lib/data/tooolvibes-directory";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { NormalisedTool } from "./tool-battle-shared";

export type ToolFighterVariant = "default";

export function ToolFighter({
  tool,
  variant = "default",
  isWinner,
  isDefeated,
  isFighting,
  layoutId,
  style,
}: {
  tool: NormalisedTool;
  variant?: ToolFighterVariant;
  isWinner?: boolean;
  isDefeated?: boolean;
  isFighting?: boolean;
  layoutId?: string;
  style?: CSSProperties;
}) {
  const [logoError, setLogoError] = useState(false);
  const reducedMotion = useReducedMotion();
  const initials = getToolBadgeLabel(tool.name);
  const fighterStyle = {
    "--arena-a": tool.accentFrom,
    "--arena-b": tool.accentTo,
    ...style,
  } as CSSProperties;

  if (variant !== "default") {
    return (
      <div className="tool-fighter tool-fighter--placeholder" data-variant={variant}>
        <span className="tool-fighter__initials">{initials}</span>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "tool-fighter mobile-compare-arena__fighter",
        isWinner && "is-winner",
        isDefeated && "is-defeated",
      )}
      data-winner={isWinner}
      data-defeated={isDefeated}
      data-fighting={isFighting}
      layoutId={reducedMotion ? undefined : layoutId}
      style={fighterStyle}
    >
      <span className="mobile-compare-arena__fighter-shadow" aria-hidden="true" />
      <span className="mobile-compare-arena__fighter-aura" aria-hidden="true" />

      <div className="mobile-compare-arena__fighter-character" aria-hidden="true">
        <span className="mobile-compare-arena__fighter-head">
          <span className="mobile-compare-arena__fighter-eye mobile-compare-arena__fighter-eye--left" />
          <span className="mobile-compare-arena__fighter-eye mobile-compare-arena__fighter-eye--right" />
        </span>
        <span className="mobile-compare-arena__fighter-hand mobile-compare-arena__fighter-hand--left">
          <span className="mobile-compare-arena__fighter-shield" />
        </span>
        <div
          className="tool-fighter__orb mobile-compare-arena__fighter-orb"
          style={{
            borderColor: tool.accentFrom,
            boxShadow: isWinner ? `0 0 24px ${tool.accentFrom}66` : undefined,
          }}
        >
          <span className="mobile-compare-arena__fighter-face">
            {!tool.logoUrl || logoError ? (
              <span className="tool-fighter__initials mobile-compare-arena__fighter-initials">{initials}</span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tool.logoUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="tool-fighter__logo mobile-compare-arena__fighter-logo"
                onError={() => setLogoError(true)}
              />
            )}
          </span>
        </div>
        <span className="mobile-compare-arena__fighter-hand mobile-compare-arena__fighter-hand--right">
          <span className="mobile-compare-arena__fighter-sword" />
        </span>
        <span className="mobile-compare-arena__fighter-foot mobile-compare-arena__fighter-foot--left" />
        <span className="mobile-compare-arena__fighter-foot mobile-compare-arena__fighter-foot--right" />
      </div>

      <div className="tool-fighter__base mobile-compare-arena__fighter-base" aria-hidden="true" />
      <div className="tool-fighter__info">
        <span className="tool-fighter__name mobile-compare-arena__fighter-name">{tool.name}</span>
        <small>{tool.battleScore}/100</small>
        <div className="tool-fighter__health mobile-compare-arena__fighter-health" aria-hidden="true">
          <span style={{ width: `${Math.max(14, tool.battleScore)}%` }} />
        </div>
        <div className="mobile-compare-arena__fighter-loadout" aria-hidden="true">
          {tool.highlights.slice(0, 2).map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </div>
        <span className="tool-fighter__score sr-only">{tool.battleScore}</span>
      </div>
    </motion.div>
  );
}
