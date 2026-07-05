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

  if (variant === "micro") {
    return (
      <div className="tool-fighter tool-fighter--micro" style={fighterStyle}>
        <div
          className="tool-fighter__orb tool-fighter__orb--micro"
          style={{
            borderColor: tool.accentFrom,
            boxShadow: isWinner ? `0 0 16px ${tool.accentFrom}66` : undefined,
          }}
        >
          {!tool.logoUrl || logoError ? (
            <span className="tool-fighter__initials">{initials}</span>
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
        layoutId={reducedMotion ? undefined : layoutId}
        style={fighterStyle}
      >
        <div
          className="tool-fighter__orb"
          style={{
            borderColor: tool.accentFrom,
            boxShadow: isWinner ? `0 0 24px ${tool.accentFrom}66` : undefined,
          }}
        >
          {!tool.logoUrl || logoError ? (
            <span className="tool-fighter__initials">{initials}</span>
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
          <span className="tool-fighter__cat">{tool.categoryLabel}</span>
          <div className="tool-fighter__health" aria-hidden="true">
            <span style={{ width: `${Math.max(14, tool.battleScore)}%` }} />
          </div>
          <span className="tool-fighter__score">{tool.battleScore}</span>
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
      layoutId={reducedMotion ? undefined : layoutId}
      style={fighterStyle}
    >
      <div
        className="tool-fighter__orb"
        style={{
          borderColor: tool.accentFrom,
          boxShadow: isWinner ? `0 0 24px ${tool.accentFrom}66` : undefined,
        }}
      >
        {!tool.logoUrl || logoError ? (
          <span className="tool-fighter__initials">{initials}</span>
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
