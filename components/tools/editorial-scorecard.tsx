"use client";

import { cn } from "@/lib/utils";
import {
  getEditorialScorecard,
  getEditorialScoreHighlights,
  getEditorialScoreLevelLabel,
} from "@/lib/tools/editorial-score";
import type { ToolRecord } from "@/lib/types/tool";

type EditorialScoreTone = "light" | "dark";
type EditorialScoreVariant = "detail" | "compact" | "signals";

type EditorialScoreMeterProps = {
  strength: number;
  tone?: EditorialScoreTone;
  compact?: boolean;
  className?: string;
};

type EditorialScorecardProps = {
  tool: ToolRecord;
  variant?: EditorialScoreVariant;
  tone?: EditorialScoreTone;
  limit?: number;
  showHeading?: boolean;
  heading?: string;
  description?: string;
  className?: string;
};

export function EditorialScoreMeter({
  strength,
  tone = "light",
  compact = false,
  className,
}: EditorialScoreMeterProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "editorial-score-meter",
        tone === "dark" && "is-dark",
        compact && "is-compact",
        className,
      )}
    >
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={cn("editorial-score-dot", step <= strength && "is-active")}
        />
      ))}
    </div>
  );
}

export function EditorialScorecard({
  tool,
  variant = "detail",
  tone = "light",
  limit = 3,
  showHeading = true,
  heading,
  description,
  className,
}: EditorialScorecardProps) {
  const scorecard = getEditorialScorecard(tool);
  const highlights = getEditorialScoreHighlights(tool, limit);
  const isDark = tone === "dark";

  if (variant === "signals") {
    return (
      <div className={className}>
        {showHeading ? (
          <p className={cn("editorial-label", isDark && "!text-white/58")}>
            {heading ?? "Lettura rapida"}
          </p>
        ) : null}
        <div className={cn("flex flex-wrap gap-2", showHeading && "mt-2.5")}>
          {highlights.map((entry) => (
            <div
              key={entry.key}
              className={cn(
                "editorial-score-signal",
                isDark && "is-dark",
              )}
            >
              <span className={cn("editorial-score-signal-label", isDark && "is-dark")}>
                {entry.label}
              </span>
              <EditorialScoreMeter strength={entry.strength} tone={tone} compact />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("editorial-score-compact", className)}>
        {showHeading ? (
          <div>
            <p className={cn("editorial-label", isDark && "!text-white/58")}>
              {heading ?? "Scorecard curatoriale"}
            </p>
            <p
              className={cn(
                "mt-2 text-sm leading-6",
                isDark ? "text-white/72" : "text-[var(--muted-strong)]",
              )}
            >
              {description ?? "Tre segnali per capire al volo dove questo tool convince davvero."}
            </p>
          </div>
        ) : null}

        <div className={cn("grid gap-2.5", showHeading && "mt-3.5")}>
          {highlights.map((entry) => (
            <div
              key={entry.key}
              className={cn(
                "editorial-score-compact-row",
                isDark && "is-dark",
              )}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.16em]",
                    isDark ? "text-white/52" : "text-[var(--muted)]",
                  )}
                >
                  {entry.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm leading-6",
                    isDark ? "text-white/84" : "text-[var(--muted-strong)]",
                  )}
                >
                  {entry.descriptor}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.18em]",
                    isDark ? "text-white/44" : "text-[var(--muted)]",
                  )}
                >
                  {getEditorialScoreLevelLabel(entry.level)}
                </p>
                <EditorialScoreMeter strength={entry.strength} tone={tone} className="mt-2 justify-end" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "editorial-score-shell rounded-[26px] border px-5 py-5",
        isDark ? "editorial-score-shell-dark" : "metadata-block",
        className,
      )}
    >
      {showHeading ? (
        <div>
          <p className={cn("brand-kicker", isDark && "!text-white/58")}>
            {heading ?? "Scorecard curatoriale"}
          </p>
          <p
            className={cn(
              "mt-2.5 text-[0.96rem] leading-7",
              isDark ? "text-white/74" : "text-[var(--muted-strong)]",
            )}
          >
            {description ??
              "Una lettura sintetica per capire dove il tool entra bene nel flusso di lavoro e dove resta più situazionale."}
          </p>
        </div>
      ) : null}

      <div className={cn("grid gap-3 sm:grid-cols-2", showHeading && "mt-4")}>
        {scorecard.map((entry) => (
          <div
            key={entry.key}
            className={cn(
              "editorial-score-row rounded-[22px] border px-4 py-4",
              isDark ? "editorial-score-row-dark" : "stat-block",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.18em]",
                    isDark ? "text-white/56" : "text-[var(--muted)]",
                  )}
                >
                  {entry.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-[0.94rem] leading-6",
                    isDark ? "text-white/86" : "text-[var(--muted-strong)]",
                  )}
                >
                  {entry.descriptor}
                </p>
              </div>
              <span
                className={cn(
                  "editorial-score-level",
                  isDark && "is-dark",
                )}
              >
                {getEditorialScoreLevelLabel(entry.level)}
              </span>
            </div>
            <EditorialScoreMeter strength={entry.strength} tone={tone} className="mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
