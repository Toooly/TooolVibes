import Link from "next/link";

import { cn } from "@/lib/utils";

import "@/styles/catalogo-facet.css";

/**
 * Wave 11 — Catalogo local facet chrome.
 *
 * Radar is a lens of Catalogo, not a loop tab and not "Segnale".
 * Shared by `/archivio` (Tutti) and `/radar` (Radar). Page identity
 * stays Catalogo; this control only switches the lens.
 */
export const CATALOGO_FACETS = [
  { id: "tutti", label: "Tutti", href: "/archivio" },
  { id: "radar", label: "Radar", href: "/radar" },
] as const;

export type CatalogoFacetId = (typeof CATALOGO_FACETS)[number]["id"];

export function resolveCatalogoFacet(
  pathname: string | null | undefined,
): CatalogoFacetId | null {
  if (!pathname) return null;
  if (pathname === "/radar" || pathname.startsWith("/radar/")) return "radar";
  if (pathname === "/archivio" || pathname.startsWith("/archivio/")) {
    return "tutti";
  }
  return null;
}

type CatalogoFacetHeadProps = {
  active: CatalogoFacetId;
  className?: string;
};

export function CatalogoFacetHead({
  active,
  className,
}: CatalogoFacetHeadProps) {
  return (
    <nav
      className={cn("catalogo-facet", className)}
      aria-label="Lente Catalogo"
      data-catalogo-facet-nav=""
    >
      {CATALOGO_FACETS.map((facet) => {
        const isCurrent = facet.id === active;
        return (
          <Link
            key={facet.id}
            href={facet.href}
            className={cn("catalogo-facet__link", isCurrent && "is-active")}
            aria-current={isCurrent ? "page" : undefined}
            data-catalogo-facet={facet.id}
          >
            {facet.label}
          </Link>
        );
      })}
    </nav>
  );
}
