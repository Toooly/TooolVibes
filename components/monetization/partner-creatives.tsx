"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CheckCheck,
  ClipboardList,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Lock,
  MessageCircle,
  Palette,
  PenLine,
  RotateCcw,
  Search,
  UserPlus,
  UserRound,
  Users,
  Video,
} from "lucide-react";

import Image from "next/image";

import { SponsorKineticCore } from "@/components/monetization/sponsor-kinetic-core";
import type {
  SponsorBrandAsset,
  SponsorCreativeTheme,
} from "@/lib/sponsors/sponsor-placements";
import { cn } from "@/lib/utils";
export { partnerThemeKey } from "@/lib/sponsors/partner-theme";

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
 *   - PartnerBrandPlate        — canonical approved brand plate (preferred).
 *   - TayloraFlowCreative      — kinetic fallback narrative (onboarding/procedure).
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

export type PartnerCreativeDensity = "stage" | "strip" | "ribbon" | "contextual" | "ending" | "preview";

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
  id: "procedure" | "corsi" | "onboarding";
  label: string;
  x: number;
  y: number;
  icon: typeof Video;
};

/**
 * Taylora narrative (discover.taylora.com, audited 2026-08-07):
 * azienda → conoscenza/procedure/corsi → workspace strutturato e protetto
 * → team tracciato (completamenti, certificati, report di audit).
 */
const TAYLORA_SOURCE_NODES: readonly FlowNode[] = [
  { id: "procedure", label: "Procedure", x: 16, y: 24, icon: FileText },
  { id: "corsi", label: "Corsi", x: 16, y: 50, icon: GraduationCap },
  { id: "onboarding", label: "Onboarding", x: 16, y: 76, icon: UserPlus },
];

const TAYLORA_PHASES = ["Conoscenza", "Formazione", "Tracciamento"] as const;

/* Node coordinates shared between the SVG path space (viewBox 0 0 100 100,
   preserveAspectRatio="none") and the HTML chips (percentage offsets), so
   lines and nodes stay connected at any panel size. */
const TAYLORA_PATHS = {
  procedure: "M 16 24 C 30 24 34 50 45 50",
  corsi: "M 16 50 L 45 50",
  onboarding: "M 16 76 C 30 76 34 50 45 50",
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
      <span className="taylora-flow__monogram"><LocalizedText>{monogram}</LocalizedText></span>
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
              <span><LocalizedText>{node.label}</LocalizedText></span>
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
        <span className="taylora-flow__hub-label"><LocalizedText>{"Workspace protetto"}</LocalizedText></span>
      </div>

      <div
        className="taylora-flow__customer"
        style={{ left: "90%", top: "50%" } as CSSProperties}
      >
        <span className="taylora-flow__customer-icon">
          <UserRound aria-hidden="true" />
        </span>
        <span className="taylora-flow__customer-label"><LocalizedText>{"Team"}</LocalizedText></span>
      </div>

      <ol className="taylora-flow__phases">
        {TAYLORA_PHASES.map((phase) => (
          <li key={phase}><LocalizedText>{phase}</LocalizedText></li>
        ))}
      </ol>
    </div>
  );
}

/* ============================================================
   ONWEB24 — brief → design/copy/seo → site live → leads
   ============================================================ */

type CanvasNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  icon: typeof Globe;
};

/**
 * OnWeb24 narrative (onweb24.com, audited 2026-08-07): you answer a few
 * questions; the team handles design, copy, technical SEO, performance and
 * integrations; the site goes live (24h claim / 7-day guarantee) and the
 * lead system (forms, WhatsApp, booking) brings clients.
 * Composition intentionally distinct from Taylora: one brief fans out to
 * three parallel workstreams before converging to the live site.
 */
const ONWEB24_BRIEF: CanvasNode = {
  id: "brief",
  label: "Brief",
  x: 12,
  y: 50,
  icon: ClipboardList,
};

const ONWEB24_WORK_NODES: readonly CanvasNode[] = [
  { id: "design", label: "Design", x: 38, y: 22, icon: Palette },
  { id: "copy", label: "Copy", x: 38, y: 50, icon: PenLine },
  { id: "seo", label: "SEO", x: 38, y: 78, icon: Search },
];

const ONWEB24_PATHS = {
  briefDesign: "M 17 47 C 26 44 30 26 34 24",
  briefCopy: "M 17 50 L 33 50",
  briefSeo: "M 17 53 C 26 56 30 74 34 76",
  designLive: "M 43 24 C 52 26 56 44 61 47",
  copyLive: "M 43 50 L 61 50",
  seoLive: "M 43 76 C 52 74 56 56 61 53",
  out: "M 71 50 L 86 50",
} as const;

const ONWEB24_PHASES = ["Brief", "Realizzazione", "Clienti"] as const;

export function OnWeb24BuildCreative({
  density = "stage",
  monogram = "O",
  className,
}: {
  density?: PartnerCreativeDensity;
  monogram?: string;
  className?: string;
}) {
  const { rootRef, inView } = useInViewFlag(true);
  const BriefIcon = ONWEB24_BRIEF.icon;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      role="presentation"
      data-creative="onweb24-build"
      data-creative-density={density}
      data-in-view={inView ? "true" : "false"}
      className={cn(
        "partner-canvas",
        "onweb24-build",
        density === "strip" && "partner-canvas--strip",
        className,
      )}
    >
      <span className="partner-canvas__monogram"><LocalizedText>{monogram}</LocalizedText></span>
      <div className="partner-canvas__grid" />

      <svg
        className="partner-canvas__paths"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        {Object.values(ONWEB24_PATHS).map((d, i) => (
          <path
            key={`base-${i}`}
            className={cn(
              "partner-canvas__path",
              d === ONWEB24_PATHS.out && "partner-canvas__path--out",
            )}
            d={d}
            pathLength={100}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          className="partner-canvas__pulse partner-canvas__pulse--a"
          d={ONWEB24_PATHS.briefCopy}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="partner-canvas__pulse partner-canvas__pulse--b"
          d={ONWEB24_PATHS.designLive}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="partner-canvas__pulse partner-canvas__pulse--c"
          d={ONWEB24_PATHS.seoLive}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="partner-canvas__pulse partner-canvas__pulse--out"
          d={ONWEB24_PATHS.out}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="partner-canvas__arrow"
          d="M 79 46.5 L 85.5 50 L 79 53.5 Z"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        className="partner-canvas__node partner-canvas__node--brief"
        style={{ left: `${ONWEB24_BRIEF.x}%`, top: `${ONWEB24_BRIEF.y}%` } as CSSProperties}
      >
        <BriefIcon aria-hidden="true" />
        <span><LocalizedText>{ONWEB24_BRIEF.label}</LocalizedText></span>
      </span>

      <ul className="partner-canvas__sources">
        {ONWEB24_WORK_NODES.map((node) => {
          const Icon = node.icon;
          return (
            <li
              key={node.id}
              className={cn("partner-canvas__node", `partner-canvas__node--${node.id}`)}
              style={{ left: `${node.x}%`, top: `${node.y}%` } as CSSProperties}
            >
              <Icon aria-hidden="true" />
              <span><LocalizedText>{node.label}</LocalizedText></span>
            </li>
          );
        })}
      </ul>

      <div
        className="partner-canvas__hub"
        style={{ left: "66%", top: "50%" } as CSSProperties}
      >
        <span className="partner-canvas__hub-ring" />
        <span className="partner-canvas__hub-icon">
          <Globe aria-hidden="true" />
        </span>
        <span className="partner-canvas__hub-label"><LocalizedText>{"Sito live"}</LocalizedText></span>
      </div>

      <div
        className="partner-canvas__dest"
        style={{ left: "90%", top: "50%" } as CSSProperties}
      >
        <span className="partner-canvas__dest-icon">
          <Users aria-hidden="true" />
        </span>
        <span className="partner-canvas__dest-label"><LocalizedText>{"Clienti"}</LocalizedText></span>
      </div>

      <ol className="partner-canvas__phases">
        {ONWEB24_PHASES.map((phase) => (
          <li key={phase}><LocalizedText>{phase}</LocalizedText></li>
        ))}
      </ol>
    </div>
  );
}

/* ============================================================
   ZAPLATER — write now → schedule → chat/group → sent
   ============================================================ */

/**
 * ZapLater narrative (zaplater.com, audited 2026-08-07): "Write now, send
 * when it matters" — schedule WhatsApp messages: one-time, recurring, and
 * in groups. The creative world is a timeline: draft → scheduled clock →
 * chat/group delivery with a sent state.
 */
const ZAPLATER_DRAFT: CanvasNode = {
  id: "bozza",
  label: "Bozza",
  x: 12,
  y: 44,
  icon: PenLine,
};

const ZAPLATER_DESTINATIONS: readonly CanvasNode[] = [
  { id: "chat", label: "Chat", x: 84, y: 28, icon: MessageCircle },
  { id: "gruppo", label: "Gruppo", x: 84, y: 62, icon: Users },
];

const ZAPLATER_PATHS = {
  draftClock: "M 17 44 L 38 44",
  clockChat: "M 52 42 C 62 40 70 32 79 29",
  clockGroup: "M 52 46 C 62 48 70 58 79 61",
} as const;

const ZAPLATER_TICKS = [22, 32, 42, 52, 62, 72] as const;

const ZAPLATER_PHASES = ["Scrivi", "Programma", "Consegna"] as const;

export function ZapLaterScheduleCreative({
  density = "stage",
  monogram = "Z",
  className,
}: {
  density?: PartnerCreativeDensity;
  monogram?: string;
  className?: string;
}) {
  const { rootRef, inView } = useInViewFlag(true);
  const DraftIcon = ZAPLATER_DRAFT.icon;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      role="presentation"
      data-creative="zaplater-schedule"
      data-creative-density={density}
      data-in-view={inView ? "true" : "false"}
      className={cn(
        "partner-canvas",
        "zaplater-schedule",
        density === "strip" && "partner-canvas--strip",
        className,
      )}
    >
      <span className="partner-canvas__monogram"><LocalizedText>{monogram}</LocalizedText></span>
      <div className="partner-canvas__grid" />

      {/* Timeline rail: the scheduling world is time-based. */}
      <div className="zaplater-schedule__rail">
        {ZAPLATER_TICKS.map((tick) => (
          <span
            key={tick}
            className="zaplater-schedule__tick"
            style={{ left: `${tick}%` } as CSSProperties}
          />
        ))}
      </div>

      <svg
        className="partner-canvas__paths"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        {Object.values(ZAPLATER_PATHS).map((d, i) => (
          <path
            key={`base-${i}`}
            className="partner-canvas__path"
            d={d}
            pathLength={100}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          className="partner-canvas__pulse partner-canvas__pulse--a"
          d={ZAPLATER_PATHS.draftClock}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="partner-canvas__pulse partner-canvas__pulse--b"
          d={ZAPLATER_PATHS.clockChat}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
        <path
          className="partner-canvas__pulse partner-canvas__pulse--c"
          d={ZAPLATER_PATHS.clockGroup}
          pathLength={100}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        className="partner-canvas__node partner-canvas__node--bozza"
        style={{ left: `${ZAPLATER_DRAFT.x}%`, top: `${ZAPLATER_DRAFT.y}%` } as CSSProperties}
      >
        <DraftIcon aria-hidden="true" />
        <span><LocalizedText>{ZAPLATER_DRAFT.label}</LocalizedText></span>
      </span>

      <div
        className="partner-canvas__hub"
        style={{ left: "45%", top: "44%" } as CSSProperties}
      >
        <span className="partner-canvas__hub-ring" />
        <span className="partner-canvas__hub-icon">
          <Clock aria-hidden="true" />
        </span>
        <span className="partner-canvas__hub-badge">
          <RotateCcw aria-hidden="true" />
        </span>
        <span className="partner-canvas__hub-label"><LocalizedText>{"Programmato"}</LocalizedText></span>
      </div>

      <ul className="partner-canvas__sources">
        {ZAPLATER_DESTINATIONS.map((node) => {
          const Icon = node.icon;
          return (
            <li
              key={node.id}
              className={cn("partner-canvas__node", `partner-canvas__node--${node.id}`)}
              style={{ left: `${node.x}%`, top: `${node.y}%` } as CSSProperties}
            >
              <Icon aria-hidden="true" />
              <span><LocalizedText>{node.label}</LocalizedText></span>
              <CheckCheck className="partner-canvas__sent" aria-hidden="true" />
            </li>
          );
        })}
      </ul>

      <ol className="partner-canvas__phases">
        {ZAPLATER_PHASES.map((phase) => (
          <li key={phase}><LocalizedText>{phase}</LocalizedText></li>
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
            <span className="open-slot-preview__logo-label"><LocalizedText>{"Il tuo logo"}</LocalizedText></span>
          </span>
          <span className="open-slot-preview__headline">
            <i />
            <i />
          </span>
          <span className="open-slot-preview__prop" />
          <span className="open-slot-preview__cta"><LocalizedText>{"La tua CTA"}</LocalizedText></span>
        </div>
      </div>

      <ul className="open-slot-preview__modes">
        {OPEN_SLOT_MODES.map((mode) => (
          <li key={mode.id} data-mode={mode.id}>
            <LocalizedText>{mode.label}</LocalizedText>
          </li>
        ))}
      </ul>
    </div>
  );
}


/* ============================================================
   BRAND PLATE — canonical approved partner identity artwork
   ============================================================ */

export type PartnerBrandPlateProps = {
  asset: SponsorBrandAsset;
  density?: PartnerCreativeDensity;
  className?: string;
  /** Decorative when surrounding copy already names the partner. */
  decorative?: boolean;
};

/**
 * Renders the approved partner brand plate as the dominant identity field.
 * Uses object-fit: contain so the wordmark/icon is never cropped.
 * Purely presentational when decorative; otherwise exposes concise alt.
 */
export function PartnerBrandPlate({
  asset,
  density = "stage",
  className,
  decorative = true,
}: PartnerBrandPlateProps) {
  const fit = asset.fit ?? "contain";
  const position = asset.position ?? "center";
  const ratio =
    asset.width > 0 && asset.height > 0
      ? `${asset.width} / ${asset.height}`
      : "2 / 1";

  return (
    <div
      data-creative="brand-plate"
      data-creative-density={density}
      data-brand-fit={fit}
      className={cn("partner-brand-plate", `partner-brand-plate--${density}`, className)}
      style={{ ["--partner-plate-ratio" as string]: ratio } as CSSProperties}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? "presentation" : undefined}
    >
      <LocalizedAttributes><Image
        src={asset.src}
        alt={decorative ? "" : asset.alt}
        width={asset.width}
        height={asset.height}
        sizes={
          density === "stage"
            ? "(max-width: 768px) 100vw, 40vw"
            : density === "ending"
              ? "(max-width: 768px) 100vw, 36vw"
              : density === "ribbon" || density === "strip"
                ? "(max-width: 768px) 100vw, 260px"
                : "(max-width: 768px) 92vw, 280px"
        }
        className="partner-brand-plate__img"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          objectFit: fit === "cover" ? "contain" : fit,
          objectPosition: position,
        }}
        priority={density === "stage"}
      /></LocalizedAttributes>
    </div>
  );
}

/* ============================================================
   RENDERER — campaign creativeVariant → micro-world
   ============================================================ */

export type PartnerCreativeRendererProps = {
  creativeVariant?: string;
  creativeTheme?: SponsorCreativeTheme;
  brandAsset?: SponsorBrandAsset;
  partnerName: string;
  monogram?: string;
  density?: PartnerCreativeDensity;
  className?: string;
};

export function PartnerCreativeRenderer({
  creativeVariant,
  creativeTheme,
  brandAsset,
  partnerName,
  monogram,
  density = "stage",
  className,
}: PartnerCreativeRendererProps) {
  /* Approved brand plate is the preferred identity field when present. */
  if (brandAsset) {
    return (
      <PartnerBrandPlate
        asset={brandAsset}
        density={density}
        className={className}
        decorative
      />
    );
  }

  if (creativeVariant === "taylora-flow") {
    return (
      <TayloraFlowCreative
        density={density}
        monogram={creativeTheme?.monogram ?? monogram ?? "T"}
        className={className}
      />
    );
  }

  if (creativeVariant === "onweb24-build") {
    return (
      <OnWeb24BuildCreative
        density={density}
        monogram={creativeTheme?.monogram ?? monogram ?? "O"}
        className={className}
      />
    );
  }

  if (creativeVariant === "zaplater-schedule") {
    return (
      <ZapLaterScheduleCreative
        density={density}
        monogram={creativeTheme?.monogram ?? monogram ?? "Z"}
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
