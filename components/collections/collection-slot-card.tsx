import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { CompareToggle } from "@/components/tools/compare-toggle";
import { ShortlistToggle } from "@/components/tools/shortlist-toggle";
import { getToolPricing, getToolWhyHere } from "@/lib/tools/discovery";
import type { ResolvedCollectionToolSlot } from "@/lib/types/collection";

type CollectionSlotCardProps = {
  slot: ResolvedCollectionToolSlot;
  index: number;
};

export function CollectionSlotCard({
  slot,
  index,
}: CollectionSlotCardProps) {
  const slotContext = slot.note ?? getToolWhyHere(slot.tool);
  const toolPricing = getToolPricing(slot.tool);
  const toolHref = `/toools/${slot.tool.slug}`;
  const externalHref = slot.tool.affiliate_url ?? slot.tool.website_url;
  const initials = slot.tool.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className="collection-slot-panel rounded-[26px] border p-4 sm:p-5"
      data-collection-step={index + 1}
      style={{
        background: "var(--tv-surface-inverted-raised)",
        borderColor:
          "color-mix(in srgb, var(--tv-ink-inverted-muted) 24%, transparent)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="editorial-label">Passaggio {String(index + 1).padStart(2, "0")}</p>
          <h3 className="text-display-card mt-2 text-[1.12rem]">{slot.role}</h3>
          <p
            className="mt-2 max-w-[68ch] text-sm leading-6"
            style={{ color: "var(--tv-ink-inverted-secondary)" }}
          >
            {slotContext}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {slot.featured ? (
            <span className="inline-flex min-h-7 items-center rounded-md border border-[color:var(--tv-accent-gold)] px-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tv-ink-inverted-primary)]">
              Tool guida
            </span>
          ) : null}
          <span className="inline-flex min-h-7 items-center rounded-md border border-black/15 px-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tv-ink-inverted-secondary)]">
            {toolPricing}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-black/10 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-black/10 bg-[var(--tv-surface-inverted)] font-[family-name:var(--tv-font-family-display)] text-base text-[var(--tv-ink-inverted-primary)]"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <Link
              href={toolHref}
              className="inline-flex items-center gap-1.5 text-base font-bold leading-tight text-[var(--tv-ink-inverted-primary)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-focus-ring)]"
            >
              {slot.tool.name}
              <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
            </Link>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tv-ink-inverted-muted)]">
              {slot.tool.category}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--tv-ink-inverted-secondary)]">
              {slot.tool.short_description_it}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 [&_button]:min-h-11">
          <ShortlistToggle slug={slot.tool.slug} compact />
          <CompareToggle slug={slot.tool.slug} compact />
          <Link
            href={toolHref}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-black/15 px-3 text-xs font-semibold text-[var(--tv-ink-inverted-primary)] transition-colors hover:border-[var(--tv-accent-violet-on-ivory)] hover:text-[var(--tv-accent-violet-on-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-focus-ring)]"
          >
            Scheda
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          {externalHref ? (
            <a
              href={externalHref}
              target="_blank"
              rel={
                slot.tool.affiliate_url
                  ? "sponsored noopener noreferrer"
                  : "noopener noreferrer"
              }
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-black/15 px-3 text-xs font-semibold text-[var(--tv-ink-inverted-primary)] transition-colors hover:border-[var(--tv-accent-violet-on-ivory)] hover:text-[var(--tv-accent-violet-on-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tv-focus-ring)]"
              aria-label={`Apri ${
                slot.tool.affiliate_url ? "il sito partner" : "il sito ufficiale"
              } di ${slot.tool.name}`}
            >
              {slot.tool.affiliate_url ? "Sito partner" : "Sito"}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
