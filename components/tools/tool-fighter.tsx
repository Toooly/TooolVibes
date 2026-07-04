"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { getToolBadgeLabel } from "@/lib/data/tooolvibes-directory";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { NormalisedTool } from "./tool-battle-shared";

export type ToolFighterVariant = "default";

export function ToolFighter({
  tool,
  variant = "default",
  isWinner,
  isFighting,
  layoutId,
}: {
  tool: NormalisedTool;
  variant?: ToolFighterVariant;
  isWinner?: boolean;
  isFighting?: boolean;
  layoutId?: string;
}) {
  const [logoError, setLogoError] = useState(false);
  const reducedMotion = useReducedMotion();

  if (variant !== "default") {
    return (
      <div className="tool-fighter tool-fighter--placeholder" data-variant={variant}>
        <span className="tool-fighter__initials">{getToolBadgeLabel(tool.name)}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="tool-fighter"
      data-winner={isWinner}
      data-fighting={isFighting}
      layoutId={reducedMotion ? undefined : layoutId}
    >
      <div
        className="tool-fighter__orb"
        style={{
          borderColor: tool.accentFrom,
          boxShadow: isWinner ? `0 0 24px ${tool.accentFrom}66` : undefined,
        }}
      >
        {!tool.logoUrl || logoError ? (
          <span className="tool-fighter__initials">{getToolBadgeLabel(tool.name)}</span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={tool.logoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="tool-fighter__logo"
            onError={() => setLogoError(true)}
          />
        )}
      </div>
      <div className="tool-fighter__base" aria-hidden="true" />
      <div className="tool-fighter__info">
        <span className="tool-fighter__name">{tool.name}</span>
        <div
          className="tool-fighter__health"
          style={{
            background: `linear-gradient(90deg, ${tool.accentFrom}, ${tool.accentTo})`,
          }}
        />
        <span className="tool-fighter__score">{tool.battleScore}</span>
      </div>
    </motion.div>
  );
}
