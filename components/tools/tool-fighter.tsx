"use client";

import { type CSSProperties, useState } from "react";
import { motion } from "motion/react";
import { getToolBadgeLabel } from "@/lib/data/tooolvibes-directory";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { NormalisedTool } from "./tool-battle-shared";

export type ToolFighterVariant = "default" | "compact" | "micro";

export function ToolFighter({
  tool,
  variant = "default",
  isWinner,
  isDefeated,
  isFighting,
  isAnalyzing,
  isCharging,
  isClash,
  layoutId,
  style,
}: {
  tool: NormalisedTool;
  variant?: ToolFighterVariant;
  isWinner?: boolean;
  isDefeated?: boolean;
  isFighting?: boolean;
  isAnalyzing?: boolean;
  isCharging?: boolean;
  isClash?: boolean;
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
  const avatar = !tool.logoUrl || logoError ? (
    <span className="tool-fighter__initials">{initials}</span>
  ) : (
    /* eslint-disable-next-line @next/next/no-img-element -- runtime favicon from the official tool domain */
    <img
      src={tool.logoUrl}
      alt=""
      loading="lazy"
      decoding="async"
      className="tool-fighter__logo"
      onError={() => setLogoError(true)}
    />
  );

  if (variant === "micro") {
    return (
      <div className="tool-fighter tool-fighter--micro" style={fighterStyle}>
        <div className="tool-fighter__avatar">{avatar}</div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div
        className={cn(
          "tool-fighter tool-fighter--compact",
          isWinner && "is-winner",
          isDefeated && "is-defeated",
        )}
        data-winner={isWinner}
        data-defeated={isDefeated}
        data-fighting={isFighting}
        data-analyzing={isAnalyzing}
        data-charging={isCharging}
        data-clash={isClash}
        layoutId={reducedMotion ? undefined : layoutId}
        style={fighterStyle}
      >
        <div className="tool-fighter__avatar">{avatar}</div>
        <div className="tool-fighter__info">
          <span className="tool-fighter__name">{tool.name}</span>
          <span className="tool-fighter__cat">{tool.categoryLabel}</span>
          <span className="tool-fighter__score">
            {tool.battleScore === null ? "n/d" : `${tool.battleScore}/10`}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "tool-fighter",
        isWinner && "is-winner",
        isDefeated && "is-defeated",
      )}
      data-winner={isWinner}
      data-defeated={isDefeated}
      data-fighting={isFighting}
      data-analyzing={isAnalyzing}
      data-charging={isCharging}
      data-clash={isClash}
      layoutId={reducedMotion ? undefined : layoutId}
      style={fighterStyle}
    >
      <div className="tool-fighter__avatar">{avatar}</div>
      <div className="tool-fighter__info">
        <span className="tool-fighter__name">{tool.name}</span>
        <span className="tool-fighter__cat">{tool.categoryLabel}</span>
        <span className="tool-fighter__score">
          {tool.battleScore === null ? "n/d" : `${tool.battleScore}/10`}
        </span>
      </div>
    </motion.div>
  );
}
