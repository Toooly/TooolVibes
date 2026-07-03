import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { CuratedCollection } from "@/lib/types/collection";
import {
  getCollectionAccessMeta,
  getCollectionDifficultyLabel,
  getCollectionPreviewTools,
  getCollectionThemeLabel,
  getCollectionToneMeta,
} from "@/lib/collections/helpers";
import { getCollectionFormatMeta, hasAdvancedSpecialIssue } from "@/lib/collections/format";
import { resolveCollectionPremiumAccess } from "@/lib/premium/access";
import { cn } from "@/lib/utils";

import { ButtonLink } from "@/components/ui/button";

type CollectionCardVariant = "featured" | "standard" | "compact";

type CollectionCardProps = {
  collection: CuratedCollection;
  variant?: CollectionCardVariant;
  swipeFriendly?: boolean;
  isMobile?: boolean;
};

function useViewportMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

export function CollectionCard({
  collection,
  variant = "standard",
  swipeFriendly = false,
  isMobile: isMobileProp,
}: CollectionCardProps) {
  const viewportMobile = useViewportMobile();
  const mobile = isMobileProp ?? viewportMobile;
  const effectiveVariant = mobile && variant === "standard" ? "compact" : variant;
  const tone = getCollectionToneMeta(collection.tone);
  const access = getCollectionAccessMeta(collection.access);
  const formatMeta = getCollectionFormatMeta(collection);
  const premium = resolveCollectionPremiumAccess(collection.access, {
    surface: collection.surface,
  });
  const previewTools = getCollectionPreviewTools(collection);
  const difficulty = getCollectionDifficultyLabel(collection.difficulty);
  const theme = getCollectionThemeLabel(collection.theme);
  const leadToolName =
    collection.featured_tool_slot?.tool.name ?? collection.included_tools[0]?.tool.name ?? null;
  const visibleToolCount =
    premium.state === "open" || premium.state === "unlocked"
      ? collection.tool_count
      : Math.min(collection.tool_count, premium.preview_tool_limit);
  const hiddenToolCount = Math.max(collection.tool_count - visibleToolCount, 0);
  const boundaryLabel =
    hiddenToolCount > 0
      ? `${visibleToolCount}/${collection.tool_count} tool aperti`
      : "Tutto visibile";
  const entryLabel =
    premium.state === "locked"
      ? "Apri anteprima"
      : premium.state === "preview"
        ? "Apri anteprima"
        : premium.entry_label;
  const secondaryAction =
    premium.state === "open" || premium.state === "unlocked"
      ? { href: "/shortlist", label: "Salvati" }
      : { href: premium.upgrade_href, label: "Cosa sblocchi" };

  if (effectiveVariant === "featured") {
    return (
      <article
        className={cn(
          "collection-card collection-card-featured brand-panel relative overflow-hidden rounded-[34px]",
          !mobile && !swipeFriendly && "brand-aura panel-lift",
          swipeFriendly && "w-[22.5rem] shrink-0 snap-start",
        )}
      >
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[17rem] overflow-hidden sm:min-h-[20rem]">
            <Image
              src={collection.cover_image_url}
              alt={collection.title}
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className={cn("object-cover", !mobile && "image-float")}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.24),rgba(18,15,35,0.78))]" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="selection-status">{collection.cover_kicker}</span>
              {collection.surface === "special-issue" ? (
                <span className="selection-status">
                  {hasAdvancedSpecialIssue(collection) ? "Speciale avanzato" : "Speciale"}
                </span>
              ) : null}
              <span
                className="selection-chip rounded-full px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]"
                style={{
                  background:
                    collection.access === "open"
                      ? "rgba(255,255,255,0.82)"
                      : "rgba(248,240,215,0.94)",
                  color: "var(--muted-strong)",
                }}
              >
                {premium.chip_label}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-white/70">{theme}</p>
              <h3 className="text-display-card mt-2 max-w-none text-[1.56rem] text-white sm:max-w-[14ch] sm:text-[1.92rem] sm:text-balance">
                {collection.title}
              </h3>
              <p className="mt-2 text-[0.75rem] uppercase tracking-[0.18em] text-white/68">
                {collection.tool_count} tool - {difficulty}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between p-4.5 sm:p-5 lg:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">Percorsi curati</span>
                {collection.surface === "special-issue" ? (
                  <span className="selection-status">{formatMeta.label}</span>
                ) : null}
                {collection.access !== "open" ? (
                  <span className="selection-status">
                    {collection.access === "premium" ? "Raccolta riservata" : "Anteprima premium"}
                  </span>
                ) : null}
              </div>
              <p className="text-display-card text-clamp-3 mt-3.5 max-w-[19ch] text-[1.2rem] sm:max-w-[20ch] sm:text-[1.34rem]">
                {collection.description}
              </p>
              <p className="text-body-soft text-clamp-3 mt-2.5 text-[0.9rem]" style={{ color: "var(--muted-strong)" }}>
                {collection.access === "open"
                  ? hasAdvancedSpecialIssue(collection)
                    ? formatMeta.description
                    : tone.description
                  : collection.premium_teaser ?? access.description}
              </p>

              <p className="mt-4 text-[0.86rem] leading-6" style={{ color: "var(--muted)" }}>
                {leadToolName ? `Tool guida: ${leadToolName}. ` : ""}
                {hiddenToolCount > 0
                  ? `${visibleToolCount} tool leggibili ora, ${hiddenToolCount} nella raccolta completa.`
                  : "Tutti i tool della raccolta sono già leggibili qui."}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <ButtonLink href={`/collections/${collection.slug}`}>{entryLabel}</ButtonLink>
              <Link
                href={secondaryAction.href}
                className="section-quiet-link inline-flex items-center text-sm font-semibold"
                style={{ color: "var(--accent-strong)" }}
              >
                {secondaryAction.label}
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (effectiveVariant === "compact") {
    return (
      <article
        className={cn(
          "collection-card brand-panel relative overflow-hidden rounded-[28px] p-3.5 sm:p-4.5",
          swipeFriendly && "w-[18.75rem] shrink-0 snap-start",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-[4.6rem] w-[4.6rem] shrink-0 overflow-hidden rounded-[18px]">
            <Image
              src={collection.cover_image_url}
              alt={collection.title}
              fill
              sizes="160px"
              className={cn("object-cover", !mobile && "image-float")}
            />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.22),rgba(18,15,35,0.72))]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-label">{collection.cover_kicker}</span>
              {collection.surface === "special-issue" ? (
                <span className="selection-status">
                  {hasAdvancedSpecialIssue(collection) ? "Speciale avanzato" : "Speciale"}
                </span>
              ) : null}
              <span className="selection-chip rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--line)", background: collection.access === "open" ? "rgba(255,255,255,0.76)" : "rgba(249,239,212,0.92)", color: "var(--muted-strong)" }}>
                {access.subtleLabel}
              </span>
            </div>
            <h3 className="text-display-card text-clamp-2 mt-1 text-[1rem]">{collection.title}</h3>
            <p className="text-body-soft text-clamp-3 mt-1 text-[0.8rem]" style={{ color: "var(--muted-strong)" }}>
              {collection.access === "open"
                ? collection.description
                : collection.premium_teaser ?? collection.description}
            </p>
            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {collection.tool_count} tool - {theme}
            </p>
            <p className="mt-1 text-[0.66rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
              {boundaryLabel}
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t pt-3 soft-divider">
          <span className="text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            {difficulty}
          </span>
          <Link href={`/collections/${collection.slug}`} className="section-quiet-link text-[0.76rem] font-semibold" style={{ color: "var(--accent-strong)" }}>
            {entryLabel}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("collection-card brand-panel relative flex h-full flex-col overflow-hidden rounded-[30px]", !mobile && "panel-lift")}>
      <Link href={`/collections/${collection.slug}`} className="block">
        <div className="relative h-44 overflow-hidden">
          <Image
            src={collection.cover_image_url}
            alt={collection.title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className={cn("object-cover", !mobile && "image-float")}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,35,0.22),rgba(18,15,35,0.76))]" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white" style={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(24,17,12,0.28)" }}>
              {collection.cover_kicker}
            </span>
            {collection.surface === "special-issue" ? (
              <span className="selection-status">
                {hasAdvancedSpecialIssue(collection) ? "Speciale avanzato" : "Speciale"}
              </span>
            ) : null}
            <span className="selection-chip rounded-full px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]" style={{ background: collection.access === "open" ? "rgba(255,255,255,0.82)" : "rgba(249,239,212,0.94)", color: "var(--muted-strong)" }}>
              {access.subtleLabel}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/70">{theme}</p>
            <h3 className="text-display-card mt-1.5 max-w-none text-[1.28rem] text-white sm:max-w-[14ch] sm:text-balance">
              {collection.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="flex grow flex-col p-4.5 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="selection-status">{tone.label}</span>
          {collection.surface === "special-issue" ? (
            <span className="selection-status">{formatMeta.label}</span>
          ) : null}
          <span className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}>
            {collection.tool_count} tool
          </span>
        </div>
        <p className="text-body-soft text-clamp-3 mt-3.5 text-[0.9rem]" style={{ color: "var(--muted-strong)" }}>
          {collection.access === "open"
            ? collection.description
            : collection.premium_teaser ?? collection.description}
        </p>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {previewTools.slice(0, 2).map((name) => (
            <span
              key={name}
              className="selection-chip rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.72)", color: "var(--muted)" }}
            >
              {name}
            </span>
          ))}
        </div>

        <div className="metadata-block mt-3.5 grid gap-2 rounded-[20px] px-3.5 py-3">
          <div>
            <p className="editorial-label">Tool guida</p>
            <p className="text-meta mt-1 text-[0.8rem]" style={{ color: "var(--muted-strong)" }}>
              {leadToolName ?? "Percorso editoriale"}
            </p>
          </div>
          <div>
            <p className="editorial-label">Accesso</p>
            <p className="text-meta mt-1 text-[0.8rem]" style={{ color: "var(--muted-strong)" }}>
              {hiddenToolCount > 0
                ? `${visibleToolCount} aperti, ${hiddenToolCount} nella raccolta completa`
                : "Tutti i tool sono visibili"}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3.5 soft-divider">
          <p className="text-[0.72rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
            {collection.audience}
          </p>
          <Link href={`/collections/${collection.slug}`} className="section-quiet-link text-sm font-semibold" style={{ color: "var(--accent-strong)" }}>
            {entryLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
