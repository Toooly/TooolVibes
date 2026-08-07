"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  FileText,
  GraduationCap,
  Lock,
  UserRound,
  Video,
} from "lucide-react";

import { SponsorKineticCore } from "@/components/monetization/sponsor-kinetic-core";
import type { SponsorCreativeTheme } from "@/lib/sponsors/sponsor-placements";
import { cn } from "@/lib/utils";

/**
 * Partner Experience creative layer.
 *
 * The placement shell (disclosure, identity, copy hierarchy, CTA, analytics,
 * accessibility) lives in partner-placements.tsx. This module renders only
 * the partner-specific creative centre of the stage:
 *
 *   - PartnerCreativeRenderer  — selects the micro-world per campaign
 *     (`creativeVariant` from the sponsor registry); unknown variants fall
 *     back to the generic partner creative.
 *   - TayloraFlowCreative      — kinetic product narrative:
 *     contenuti → raccolta protetta → cliente.
 *   - OpenSlotPreviewCreative  — self-assembling media-kit preview for the
 *     unsold placement ("your product could live here").
 *
 * Contracts shared by every creative:
 *   - Purely presentational: aria-hidden, no analytics, no interactive
 *     content; the copy already carries the full message.
 *   - Animation on transform / opacity / stroke-dashoffset only.
 *   - Pauses when offscreen (data-in-view="false").
 *   - prefers-reduced-motion: a complete static composition.
 */

export type PartnerCreativeDensity = "stage" | "strip";

function useInViewFlag(initial = true) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(initial);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setInView(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { rootRef, inView };
}

/* ============================================================
   TAYLORA — content → protected distribution → customer
   ============================================================ */

type FlowNode = {
  id: "video" | "pdf" | "corso";
  label: string;
  x: number;
  y: number;
  icon: typeof Video;
};

const TAYLORA_SOURCE_NODES: readonly FlowNode[] = [
  { id: "video", label: "Video", x: 16, y: 24, icon: Video },
  { id: "pdf", label: "PDF", x: 16, y: 50, icon: FileText },
  { id: "corso", label: "Corso", x: 16, y: 76, icon: GraduationCap },
];

const TAYLORA_PHASES = ["Contenuti", "Protezione", "Cliente"] as const;

/* Node coordinates shared between the SVG path space (viewBox 0 0 100 100,
   preserveAspectRatio="none") and the HTML chips (percentage offsets), so
   lines and nodes stay connected at any panel size. */
const TAYLORA_PATHS = {
  video: "M 16 24 C 30 24 34 50 45 50",
  pdf: "M 16 50 L 45 50",
  corso: "M 16 76 C 30 76 34 50 45 50",
  out: "M 57 50 L 86 50",
} as const;

export function TayloraFlowCreative({
  density = "stage",
  monogram = "T",
  className,
}: {
  density?: PartnerCreativeDensity;
  /** Partner monogram watermark (from the campaign creative theme). */
  monogram?: string;
  className?: string;
}) {
  const { rootRef, inView } = useInViewFlag(true);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      role="presentation"
      data-creative="taylora-flow"
      data-creative-density={density}
      data-in-view={inView ? "true" : "false"}
      className={cn(
        "taylora-flow",
        density === "stage" && "taylora-flow--stage",
        density === "strip" && "taylora-flow--strip",
        className,
      )}
    >
      <span className="taylora-flow__monogram">{monogram}</span>
      <div className="taylora-flow__grid" />

      <svg
        className="taylora-flow__paths"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        {TAYLORA_SOURCE_NODES.map((node) => (
          <path
            key={`base-${node.id}`}
            className="taylora-flow__path"
            d={TAYLORA_PATHS[node.id]}
            pathLength={100}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          className="taylora-flow__path taylora-flow__path--out"
          d={TAYLORA_PATHS.out}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        {TAYLORA_SOURCE_NODES.map((node) => (
          <path
            key={`pulse-${node.id}`}
            className={cn(
              "taylora-flow__pulse",
              `taylora-flow__pulse--${node.id}`,
            )}
            d={TAYLORA_PATHS[node.id]}
            pathLength={100}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          className="taylora-flow__pulse taylora-flow__pulse--out"
          d={TAYLORA_PATHS.out}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        {/* Direction cue: the delivery path ends in an arrowhead into the
            customer node so the flow reads left-to-right in under 2s. */}
        <path
          className="taylora-flow__arrow"
          d="M 79 46.5 L 85.5 50 L 79 53.5 Z"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <ul className="taylora-flow__sources">
        {TAYLORA_SOURCE_NODES.map((node) => {
          const Icon = node.icon;
          return (
            <li
              key={node.id}
              className={cn(
                "taylora-flow__node",
                `taylora-flow__node--${node.id}`,
              )}
              style={{ left: `${node.x}%`, top: `${node.y}%` } as CSSProperties}
            >
              <Icon aria-hidden="true" />
              <span>{node.label}</span>
            </li>
          );
        })}
      </ul>

      <div
        className="taylora-flow__hub"
        style={{ left: "51%", top: "50%" } as CSSProperties}
      >
        <span className="taylora-flow__hub-ring" />
        <span className="taylora-flow__hub-lock">
          <Lock aria-hidden="true" />
        </span>
        <span className="taylora-flow__hub-label">Raccolta protetta</span>
      </div>

      <div
        className="taylora-flow__customer"
        style={{ left: "90%", top: "50%" } as CSSProperties}
      >
        <span className="taylora-flow__customer-icon">
          <UserRound aria-hidden="true" />
        </span>
        <span className="taylora-flow__customer-label">Cliente</span>
      </div>

      <ol className="taylora-flow__phases">
        {TAYLORA_PHASES.map((phase) => (
          <li key={phase}>{phase}</li>
        ))}
      </ol>
    </div>
  );
}

/* ============================================================
   OPEN SLOT — self-assembling media-kit preview
   ============================================================ */

const OPEN_SLOT_MODES = [
  { id: "spotlight", label: "Homepage" },
  { id: "insert", label: "Catalogo" },
  { id: "editorial", label: "Editoriale" },
] as const;

/**
 * Open-slot media canvas: a single campaign mock whose frame morphs slowly
 * through the three placement silhouettes (Spotlight → Catalog Insert →
 * Editorial module) — "one partnership, several contextual expressions".
 * The brand content is persistent; only the structural frame accents and
 * the active context label cycle. One-shot assembly plays on first
 * viewport entry; reduced-motion renders the assembled Spotlight state.
 */
export function OpenSlotPreviewCreative({
  className,
}: {
  className?: string;
}) {
  /* Start hidden so the one-shot assembly plays only when the preview
     actually enters the viewport. Without IO (SSR/tests) no animation is
     applied and the canvas renders in its final assembled state. */
  const { rootRef, inView } = useInViewFlag(false);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      role="presentation"
      data-creative="open-slot-preview"
      data-in-view={inView ? "true" : "false"}
      className={cn("open-slot-preview", className)}
    >
      <div className="open-slot-preview__steps">
        <span>01</span>
        <span>02</span>
        <span>03</span>
      </div>

      <div className="open-slot-preview__canvas">
        <span className="open-slot-preview__accent open-slot-preview__accent--spotlight" />
        <span className="open-slot-preview__accent open-slot-preview__accent--insert" />
        <span className="open-slot-preview__accent open-slot-preview__accent--editorial" />

        <div className="open-slot-preview__content">
          <span className="open-slot-preview__logo">
            <span className="open-slot-preview__logo-label">Il tuo logo</span>
          </span>
          <span className="open-slot-preview__headline">
            <i />
            <i />
          </span>
          <span className="open-slot-preview__prop" />
          <span className="open-slot-preview__cta">La tua CTA</span>
        </div>
      </div>

      <ul className="open-slot-preview__modes">
        {OPEN_SLOT_MODES.map((mode) => (
          <li key={mode.id} data-mode={mode.id}>
            {mode.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   RENDERER — campaign creativeVariant → micro-world
   ============================================================ */

export type PartnerCreativeRendererProps = {
  creativeVariant?: string;
  creativeTheme?: SponsorCreativeTheme;
  partnerName: string;
  monogram?: string;
  density?: PartnerCreativeDensity;
  className?: string;
};

/**
 * Maps a campaign creative theme to the CSS theme block key consumed via
 * `data-partner-theme` on the placement shell. Returns undefined when the
 * campaign carries no theme, so the neutral treatment applies.
 */
export function partnerThemeKey(
  theme?: SponsorCreativeTheme,
): string | undefined {
  if (!theme?.accentPrimary) return undefined;
  return theme.accentSecondary
    ? `${theme.accentPrimary}-${theme.accentSecondary}`
    : theme.accentPrimary;
}

export function PartnerCreativeRenderer({
  creativeVariant,
  creativeTheme,
  partnerName,
  monogram,
  density = "stage",
  className,
}: PartnerCreativeRendererProps) {
  if (creativeVariant === "taylora-flow") {
    return (
      <TayloraFlowCreative
        density={density}
        monogram={creativeTheme?.monogram ?? monogram ?? "T"}
        className={className}
      />
    );
  }

  return (
    <div
      data-creative="generic"
      data-creative-density={density}
      className={cn("partner-generic", className)}
      aria-hidden="true"
      role="presentation"
    >
      <SponsorKineticCore
        partnerName={partnerName}
        monogram={monogram ?? creativeTheme?.monogram}
        density={density === "stage" ? "xl" : "card"}
      />
    </div>
  );
}
