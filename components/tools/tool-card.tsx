"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolRecord } from "@/lib/types/tool";
import {
  getToolBestFor,
  getToolEditorialNote,
  getShortlistStageMeta,
  getToolMemorySignals,
  getToolEditorialState,
  getToolPricing,
} from "@/lib/tools/discovery";
import { cn, formatItalianDate } from "@/lib/utils";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { EditorialScorecard } from "@/components/tools/editorial-scorecard";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { TagPill } from "@/components/tools/tag-pill";

export type ToolCardVariant = "featured" | "standard" | "compact" | "scan";

type ToolCardProps = {
  tool: ToolRecord;
  variant?: ToolCardVariant;
  priority?: boolean;
  index?: number;
  contextLabel?: string;
  selected?: boolean;
  swipeFriendly?: boolean;
  onSelect?: (slug: string) => void;
};

function ToolCardComponent({
  tool,
  variant = "standard",
  priority = false,
  index = 0,
  contextLabel = "Archivio curato",
  selected = false,
  swipeFriendly = false,
  onSelect,
}: ToolCardProps) {
  const discovery = useDiscoverySnapshot();
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const isSaved = savedSlugs.includes(tool.slug);
  const isCompared = compareSlugs.includes(tool.slug);
  const shortlistStage = discovery.shortlistStages[tool.slug] ?? "saved";
  const decisionMemory = discovery.decisionMemories[tool.slug] ?? {};

  const discoverySignal = useMemo(() => {
    const editorialState = getToolEditorialState(tool, index);

    if (priority || tool.is_featured) {
      return "In evidenza";
    }

    return editorialState === "Selezione core" ? undefined : editorialState;
  }, [index, priority, tool]);
  const shortlistMeta = getShortlistStageMeta(shortlistStage);
  const memorySignals = getToolMemorySignals(decisionMemory).slice(0, 2);

  const formattedIndex = String(index + 1).padStart(2, "0");
  const formattedDate = formatItalianDate(tool.date_discovered);
  const pricingLabel = getToolPricing(tool);
  const bestFor = getToolBestFor(tool);
  const editorialNote = getToolEditorialNote(tool);
  const cardMetaItems = [
    { label: "Uso ideale", value: bestFor },
    { label: "Prezzo", value: pricingLabel },
  ];
  const visibleCardMetaItems = variant === "compact" ? [] : cardMetaItems;
  const visibleTags = variant === "compact" ? [] : tool.tags.slice(0, 1);

  if (variant === "featured") {
    return (
        <article
          className={cn(
          "tool-card-base tool-card-featured group interactive-surface surface-sheen relative overflow-hidden rounded-[32px]",
          selected && "tool-card-selected",
          isSaved && "tool-card-saved",
          isCompared && "tool-card-compared",
          swipeFriendly && "w-[22.25rem] shrink-0 snap-start",
        )}
      >
        <div className="card-glow absolute inset-0" />
        <div className="topline-reveal absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),var(--accent),transparent)] opacity-85" />

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <Link href={`/toools/${tool.slug}`} className="tool-card-media relative block min-h-[15rem] overflow-hidden sm:min-h-[19rem]">
            <Image
              src={tool.cover_image_url}
              alt={tool.name}
              fill
              sizes="(max-width: 1024px) 100vw, 44vw"
              className="image-float object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.12),rgba(26,20,64,0.66))]" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span
                className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white"
                style={{ borderColor: "rgba(255,255,255,0.22)", background: "rgba(24,17,12,0.32)" }}
              >
                {contextLabel}
              </span>
              {discoverySignal ? (
                <span
                  className="selection-chip rounded-full px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]"
                  style={{ background: "rgba(248,240,215,0.94)", color: "var(--muted-strong)" }}
                >
                  {discoverySignal}
                </span>
              ) : null}
              {isCompared ? (
                <span
                  className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]"
                  style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(112,82,255,0.18)", color: "white" }}
                >
                  Compare
                </span>
              ) : null}
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/74">{tool.category}</p>
              <h3 className="text-display-card mt-2 max-w-none text-[1.62rem] text-white sm:max-w-[11.5ch] sm:text-[2.08rem] sm:text-balance">
                {tool.name}
              </h3>
              <p className="mt-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-white/68">{formattedDate}</p>
            </div>
          </Link>

          <div className="flex flex-col justify-between p-4.5 sm:p-5 lg:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="selection-status">Lead selezione</span>
                <span className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.74)" }}>
                  {formattedIndex}
                </span>
              </div>
              <p className="text-display-card mt-3.5 max-w-[18ch] text-[1.26rem] sm:max-w-[19ch] sm:text-[1.42rem]">
                Il profilo più forte da cui iniziare la lettura.
              </p>
              <p className="text-body-soft text-clamp-3 mt-2.5 text-[0.9rem]" style={{ color: "var(--muted-strong)" }}>
                {tool.short_description_it}
              </p>
              <EditorialScorecard tool={tool} variant="signals" limit={2} showHeading={false} className="mt-3.5" />
            </div>

            <div className="mt-4.5 border-t pt-3.5 soft-divider">
              <p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Uso ideale: {bestFor}
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/toools/${tool.slug}`}
                  className="button-shell button-primary text-ui-strong inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.82rem] font-semibold text-white"
                >
                  Apri profilo
                  <ArrowRight aria-hidden="true" className="button-arrow size-4" />
                </Link>
                <ShortlistToggle slug={tool.slug} mode="compact" />
                <CompareToggle slug={tool.slug} compact />
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "scan") {
    return (
      <article
        className={cn(
          "tool-card-base tool-card-scan mini-compare-card group interactive-surface surface-sheen relative overflow-hidden rounded-[24px] p-3.5 sm:p-4",
          selected && "tool-card-selected",
          isSaved && "tool-card-saved",
          isCompared && "tool-card-compared",
          selected && "is-selected",
          swipeFriendly && "w-[18.25rem] shrink-0 snap-start",
        )}
      >
        <div className="card-glow absolute inset-0" />
        <div className="absolute -right-5 top-1 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(112,82,255,0.18),transparent_68%)] blur-xl" />
        <div className="absolute -bottom-5 left-3 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(242,179,71,0.16),transparent_72%)] blur-xl" />
        <div className="relative flex items-start gap-3">
          <Link href={`/toools/${tool.slug}`} className="relative block h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-[17px] shadow-[0_16px_32px_rgba(20,15,56,0.16)]">
            <Image
              src={tool.cover_image_url}
              alt={tool.name}
              fill
              sizes="120px"
              className="image-float object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.06),rgba(18,15,35,0.42))]" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="editorial-label">{tool.category}</p>
              {discoverySignal ? (
                <span className="selection-chip rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
                  {discoverySignal}
                </span>
              ) : null}
              {isSaved && memorySignals[0] ? (
                <span
                  className="selection-chip rounded-full border px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em]"
                  style={{ borderColor: "var(--line)", background: memorySignals[0].background, color: memorySignals[0].tone }}
                >
                  {memorySignals[0].label}
                </span>
              ) : null}
            </div>
            <h3 className="text-display-card mt-1.5 text-[1.16rem] leading-[1.02]">{tool.name}</h3>
            <p className="text-body-soft text-clamp-2 mt-1 text-[0.84rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              {bestFor}
            </p>
            <EditorialScorecard tool={tool} variant="signals" limit={1} showHeading={false} className="mt-3" />
          </div>

          <div className="flex items-center gap-2">
            <CompareToggle slug={tool.slug} mode="icon" />
            <ShortlistToggle slug={tool.slug} mode="icon" />
          </div>
        </div>

        <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 soft-divider">
          <button
            type="button"
            onClick={() => onSelect?.(tool.slug)}
            className={cn(
              "button-shell text-ui-strong inline-flex items-center rounded-full px-3.5 py-1.75 text-[0.68rem] font-semibold uppercase tracking-[0.16em]",
              selected ? "button-primary text-white" : "button-secondary",
            )}
          >
            {selected ? "In focus" : "Metti a fuoco"}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[0.66rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {formattedDate}
            </span>
            <Link href={`/toools/${tool.slug}`} className="section-quiet-link text-[0.74rem] font-semibold" style={{ color: "var(--accent-strong)" }}>
              Apri profilo
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "tool-card-base group interactive-surface surface-sheen relative overflow-hidden rounded-[28px]",
        variant === "compact" ? "tool-card-compact" : "tool-card-standard",
        selected && "tool-card-selected",
        isSaved && "tool-card-saved",
        isCompared && "tool-card-compared",
        swipeFriendly &&
          (variant === "compact" ? "w-[20rem] shrink-0 snap-start" : "w-[22rem] shrink-0 snap-start"),
      )}
    >
      <div className="card-glow absolute inset-0" />
      <div
        className="topline-reveal absolute inset-x-0 top-0 h-1"
        style={{
          background: priority
            ? "linear-gradient(90deg, var(--accent), var(--gold))"
            : "linear-gradient(90deg, rgba(108,77,255,0.76), rgba(240,180,74,0.72))",
        }}
      />

      <Link href={`/toools/${tool.slug}`} className="block">
        <div className={cn("tool-card-media relative overflow-hidden", variant === "compact" ? "h-40" : "h-48")}>
          <Image
            src={tool.cover_image_url}
            alt={tool.name}
            fill
            sizes={variant === "compact" ? "(max-width: 1024px) 86vw, 26vw" : "(max-width: 1024px) 100vw, 33vw"}
            className="image-float object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.08),rgba(18,15,35,0.54))]" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span
              className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white"
              style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(24,17,12,0.32)" }}
            >
              {tool.category}
            </span>
            {tool.is_featured ? (
              <span
                className="selection-chip rounded-full px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]"
                style={{ background: "rgba(248,240,215,0.94)", color: "var(--muted-strong)" }}
              >
                In evidenza
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/72">
                {contextLabel}
              </p>
              <h3 className={cn("text-display-card mt-1.5 max-w-none text-white sm:max-w-[12.5ch] sm:text-balance", variant === "compact" ? "text-[1.12rem]" : "text-[1.28rem]")}>
                {tool.name}
              </h3>
            </div>
            <span
              className="selection-chip rounded-full px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white"
              style={{ background: "rgba(24,17,12,0.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
            >
              {formattedDate}
            </span>
          </div>
        </div>
      </Link>

      <div className={cn("space-y-3.5 p-4 sm:p-4.5", variant === "compact" && "space-y-3")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="editorial-label">Profilo</p>
            {discoverySignal ? (
              <div className="mt-2">
                <span className="selection-status">{discoverySignal}</span>
              </div>
            ) : null}
            {isSaved ? (
              <>
                <div className="mt-2">
                  <span
                    className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                    style={{ borderColor: "var(--line)", background: shortlistMeta.background, color: shortlistMeta.tone }}
                  >
                    {shortlistMeta.label}
                  </span>
                </div>
                {memorySignals.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {memorySignals.map((signal) => (
                      <span
                        key={signal.label}
                        className="selection-chip rounded-full border px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em]"
                        style={{ borderColor: "var(--line)", background: signal.background, color: signal.tone }}
                      >
                        {signal.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <p className="text-[1.05rem] leading-none" style={{ color: "var(--gold)" }}>
            {formattedIndex}
          </p>
        </div>

        <p className={cn("text-body-soft text-[0.88rem] text-clamp-3", variant === "compact" && "text-clamp-2")} style={{ color: "var(--muted-strong)" }}>
          {tool.short_description_it}
        </p>

        <div
          className="rounded-[18px] border px-3.5 py-3"
          style={{
            borderColor: "var(--line)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.72))",
          }}
        >
          <p className="editorial-label">{variant === "compact" ? "Nota" : "Review rapida"}</p>
          <p className={cn("mt-2 text-[0.82rem] leading-6", variant === "compact" ? "text-clamp-2" : "text-clamp-3")} style={{ color: "var(--muted-strong)" }}>
            {editorialNote}
          </p>
        </div>

        {variant === "compact" ? (
          <div
            className="rounded-[18px] border px-3.5 py-3"
            style={{
              borderColor: "var(--line)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(243,237,255,0.72))",
            }}
          >
            <p className="editorial-label">Best for</p>
            <p className="mt-2 text-[0.82rem] leading-6" style={{ color: "var(--muted-strong)" }}>
              {bestFor}
            </p>
          </div>
        ) : null}

        <EditorialScorecard
          tool={tool}
          variant="signals"
          limit={variant === "compact" ? 1 : 2}
          showHeading={false}
        />

        {visibleCardMetaItems.length > 0 ? (
          <div className="metadata-block grid gap-2.5 rounded-[20px] px-3 py-3 sm:grid-cols-2">
            {visibleCardMetaItems.map((item) => (
              <div key={item.label}>
                <p className="editorial-label">{item.label}</p>
                <p className="text-meta mt-1 text-[0.8rem]" style={{ color: "var(--muted-strong)" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {visibleTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        ) : null}

        {variant === "compact" ? (
          <div className="hover-reveal space-y-3 border-t pt-3.5 soft-divider">
            <Link
              href={`/toools/${tool.slug}`}
              className="button-shell button-primary text-ui-strong inline-flex w-full items-center justify-center gap-2 rounded-full px-3.5 py-2.25 text-[0.78rem] font-semibold text-white"
            >
              Apri profilo
              <ArrowRight aria-hidden="true" className="button-arrow size-4" />
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ShortlistToggle slug={tool.slug} mode="compact" />
                <CompareToggle slug={tool.slug} compact />
              </div>
              <span className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                {pricingLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="hover-reveal flex flex-wrap items-center justify-between gap-3 border-t pt-3.5 soft-divider">
            <div className="flex flex-wrap items-center gap-2">
              <ShortlistToggle slug={tool.slug} mode="default" />
              <CompareToggle slug={tool.slug} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/toools/${tool.slug}`}
                className="button-shell button-secondary text-ui-strong inline-flex items-center gap-2 rounded-full px-3.25 py-1.75 text-[0.74rem] font-semibold"
              >
                Apri profilo
                <ArrowRight aria-hidden="true" className="button-arrow size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export const ToolCard = memo(ToolCardComponent);
