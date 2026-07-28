import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  Building2,
  Layers3,
  Sparkles,
} from "lucide-react";

import {
  getMonetizationPlacement,
  isPublicMonetizationPlacement,
  type MonetizationPlacementKey,
  type PublicMonetizationPlacement,
} from "@/lib/monetization/placements";
import { cn } from "@/lib/utils";

type PartnerPlacementProps = {
  placementKey: MonetizationPlacementKey;
  className?: string;
};

function resolvePublicPlacement(placementKey: MonetizationPlacementKey) {
  const placement = getMonetizationPlacement(placementKey);
  return isPublicMonetizationPlacement(placement) ? placement : null;
}

function PartnerMeta({ formatLabel }: { formatLabel: string }) {
  return (
    <div className="partner-placement__meta">
      <span className="partner-placement__disclosure">
        Contenuto sponsorizzato
      </span>
      <span className="partner-placement__format">{formatLabel}</span>
    </div>
  );
}

function PartnerIdentity({
  placement,
}: {
  placement: PublicMonetizationPlacement;
}) {
  return (
    <div className="partner-placement__identity">
      <span className="partner-placement__identity-mark" aria-hidden="true">
        <Building2 />
      </span>
      <span className="partner-placement__identity-copy">
        <strong>{placement.partner.name}</strong>
        <span>{placement.partner.category}</span>
      </span>
    </div>
  );
}

function PartnerEditorial({
  placement,
}: {
  placement: PublicMonetizationPlacement;
}) {
  return (
    <div className="partner-placement__editorial">
      <p className="partner-placement__reason-label">Perché è rilevante qui</p>
      <h2>{placement.title}</h2>
      <p>{placement.editorialReason}</p>
    </div>
  );
}

function PartnerAction({
  placement,
}: {
  placement: PublicMonetizationPlacement;
}) {
  const isExternal = /^https?:\/\//.test(placement.partner.href);

  return (
    <div className="partner-placement__action">
      <Link
        href={placement.partner.href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "sponsored noopener noreferrer" : "sponsored"}
      >
        <span>{placement.ctaLabel}</span>
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </div>
  );
}

export function FeaturedPartner({
  placementKey,
  className,
}: PartnerPlacementProps) {
  const placement = resolvePublicPlacement(placementKey);
  if (!placement) return null;

  return (
    <aside
      aria-label={`Contenuto sponsorizzato: ${placement.partner.name}`}
      className={cn(
        "partner-placement partner-placement--featured",
        className,
      )}
    >
      <div className="partner-placement__rail" aria-hidden="true">
        <Sparkles />
      </div>
      <div className="partner-placement__body">
        <PartnerMeta formatLabel="Featured partner" />
        <PartnerIdentity placement={placement} />
        <PartnerEditorial placement={placement} />
      </div>
      <PartnerAction placement={placement} />
    </aside>
  );
}

export function PartnerToolCard({
  placementKey,
  className,
}: PartnerPlacementProps) {
  const placement = resolvePublicPlacement(placementKey);
  if (!placement) return null;

  return (
    <aside
      aria-label={`Contenuto sponsorizzato: ${placement.partner.name}`}
      className={cn("partner-placement partner-placement--tool", className)}
    >
      <div className="partner-placement__tool-heading">
        <PartnerMeta formatLabel="Partner tool" />
        <BadgeCheck aria-hidden="true" />
      </div>
      <div className="partner-placement__body">
        <PartnerIdentity placement={placement} />
        <PartnerEditorial placement={placement} />
      </div>
      <PartnerAction placement={placement} />
    </aside>
  );
}

export function ContextualPartnerBlock({
  placementKey,
  className,
}: PartnerPlacementProps) {
  const placement = resolvePublicPlacement(placementKey);
  if (!placement) return null;

  return (
    <aside
      aria-label={`Contenuto sponsorizzato: ${placement.partner.name}`}
      className={cn(
        "partner-placement partner-placement--contextual",
        className,
      )}
    >
      <div className="partner-placement__context-marker" aria-hidden="true">
        <BookOpenText />
      </div>
      <div className="partner-placement__body">
        <PartnerMeta formatLabel="Partner della lettura" />
        <PartnerEditorial placement={placement} />
        <PartnerIdentity placement={placement} />
      </div>
      <PartnerAction placement={placement} />
    </aside>
  );
}

export function PartnerCollectionModule({
  placementKey,
  className,
}: PartnerPlacementProps) {
  const placement = resolvePublicPlacement(placementKey);
  if (!placement) return null;

  return (
    <aside
      aria-label={`Contenuto sponsorizzato: ${placement.partner.name}`}
      className={cn(
        "partner-placement partner-placement--collection",
        className,
      )}
    >
      <div className="partner-placement__collection-index" aria-hidden="true">
        <span>Partner</span>
        <Layers3 />
      </div>
      <div className="partner-placement__body">
        <PartnerMeta formatLabel="Partner della raccolta" />
        <PartnerIdentity placement={placement} />
        <PartnerEditorial placement={placement} />
      </div>
      <PartnerAction placement={placement} />
    </aside>
  );
}
