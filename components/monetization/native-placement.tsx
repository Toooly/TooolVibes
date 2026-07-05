"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Megaphone, Sparkles } from "lucide-react";

import {
  getMonetizationPlacement,
  type MonetizationPlacementKey,
  type MonetizationStatus,
} from "@/lib/monetization/placements";
import { cn } from "@/lib/utils";

type NativePlacementVariant = "band" | "inline" | "rail" | "compact";

const statusLabel: Record<MonetizationStatus, string> = {
  ready: "Attivo",
  reserved: "Prenotabile",
  planned: "In arrivo",
};

const variantClasses: Record<NativePlacementVariant, string> = {
  band: "native-placement-band gap-5 p-4.5 sm:flex-row sm:items-center sm:justify-between sm:p-5",
  inline: "native-placement-inline gap-4 p-4.5 sm:p-5",
  rail: "native-placement-rail gap-4 p-4",
  compact: "native-placement-compact gap-3 p-4",
};

export function NativePlacement({
  placementKey,
  variant = "band",
  className,
  dark = false,
}: {
  placementKey: MonetizationPlacementKey;
  variant?: NativePlacementVariant;
  className?: string;
  dark?: boolean;
}) {
  const placement = getMonetizationPlacement(placementKey);

  if (!placement || !placement.visible) {
    return null;
  }

  const Icon = placement.status === "planned" ? Megaphone : placement.status === "ready" ? BadgeCheck : Sparkles;

  return (
    <aside
      aria-label={`${placement.label}: ${placement.surface}`}
      className={cn(
        "native-placement group relative flex overflow-hidden rounded-[28px] border transition duration-200 hover:-translate-y-0.5 focus-within:-translate-y-0.5",
        dark ? "native-placement-dark" : "native-placement-light",
        variantClasses[variant],
        variant === "rail" || variant === "compact" ? "flex-col" : "flex-col",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.62),transparent)] opacity-70" />
      <div className="relative flex min-w-0 flex-1 gap-3.5">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-[18px] border",
            dark
              ? "border-white/12 bg-white/8 text-white"
              : "border-[rgba(106,60,255,0.12)] bg-white/82 text-[var(--accent-strong)]",
          )}
        >
          <Icon aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("native-placement-label", dark && "native-placement-label-dark")}>
              {placement.label}
            </span>
            <span className={cn("native-placement-status", dark && "native-placement-status-dark")}>
              {statusLabel[placement.status]}
            </span>
          </div>
          <h2
            className={cn(
              "mt-2 text-[1.08rem] font-semibold leading-tight sm:text-[1.24rem]",
              dark ? "text-white" : "text-[var(--foreground)]",
            )}
          >
            {placement.title}
          </h2>
          <p
            className={cn(
              "mt-2 text-sm leading-6",
              dark ? "text-white/66" : "text-[var(--muted-strong)]",
              variant === "compact" && "line-clamp-3",
            )}
          >
            {placement.body}
          </p>
        </div>
      </div>

      <div className={cn("relative flex shrink-0 items-center", variant === "rail" || variant === "compact" ? "pt-1" : "")}>
        <Link
          href={placement.href}
          className={cn(
            "premium-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold",
            dark ? "premium-button-secondary" : "premium-button-subtle",
          )}
        >
          <span>{placement.ctaLabel}</span>
          <ArrowRight aria-hidden="true" size={15} className="transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </aside>
  );
}
