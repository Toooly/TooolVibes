import {
  parseWorkspaceView,
  workspaceViewHref,
} from "@/components/account/workspace/workspace-model";

/**
 * Wave 4 loop routing.
 *
 * No `loopShell` feature flag: a dual-chrome kill switch would recreate the
 * costume-change this wave exists to remove. Rollback is the Wave 3 SHA.
 *
 * Magazine `/` and editorial/legal/admin routes stay off-loop.
 */

export type LoopDestinationId = "home" | "salvati" | "stack" | "catalogo";

export type LoopAccountStatus =
  | "loading"
  | "guest"
  | "authenticated"
  | "unavailable";

export type LoopDestination = {
  id: LoopDestinationId;
  label: string;
  href: string;
};

export const LOOP_RAIL_MIN_WIDTH_PX = 1024;

export const LOOP_AUTH_DESTINATIONS: readonly LoopDestination[] = [
  { id: "home", label: "Home", href: workspaceViewHref("riprendi") },
  { id: "salvati", label: "Salvati", href: workspaceViewHref("salvati") },
  { id: "stack", label: "Stack", href: workspaceViewHref("stack") },
  { id: "catalogo", label: "Catalogo", href: "/archivio" },
];

export const LOOP_GUEST_DESTINATIONS: readonly LoopDestination[] = [
  { id: "salvati", label: "Salvati", href: "/shortlist" },
  { id: "catalogo", label: "Catalogo", href: "/archivio" },
];

const RETIRED_PRIMARY_LABELS = [
  "Decisioni",
  "Recenti",
  "Segnale",
  "Biblioteca",
  "Confronto",
  "Confronta",
  "Radar",
] as const;

export function isLoopRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/archivio" || pathname.startsWith("/archivio/")) return true;
  if (pathname === "/radar" || pathname.startsWith("/radar/")) return true;
  if (pathname.startsWith("/toools/")) return true;
  if (pathname === "/compare" || pathname.startsWith("/compare/")) return true;
  if (pathname === "/shortlist" || pathname.startsWith("/shortlist/")) return true;
  return pathname === "/account" || pathname.startsWith("/account/");
}

export function isLoopCatalogoPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/archivio" ||
    pathname.startsWith("/archivio/") ||
    pathname === "/radar" ||
    pathname.startsWith("/radar/") ||
    pathname.startsWith("/toools/")
  );
}

export function loopShowsCatalogFooter(
  pathname: string | null | undefined,
): boolean {
  return pathname === "/archivio" || Boolean(pathname?.startsWith("/archivio/"));
}

export function loopPrimaryDestinations(
  status: LoopAccountStatus,
): readonly LoopDestination[] {
  if (status === "authenticated") return LOOP_AUTH_DESTINATIONS;
  if (status === "loading") return [];
  return LOOP_GUEST_DESTINATIONS;
}

export function loopWordmarkHref(status: LoopAccountStatus): string {
  return status === "authenticated" ? workspaceViewHref("riprendi") : "/archivio";
}

export function resolveLoopActiveDestination(
  pathname: string | null | undefined,
  search: string | null | undefined,
): LoopDestinationId | null {
  if (!pathname) return null;
  if (pathname === "/compare" || pathname.startsWith("/compare/")) return null;
  if (
    pathname === "/account/settings" ||
    pathname.startsWith("/account/settings/")
  ) {
    return null;
  }
  if (pathname === "/shortlist" || pathname.startsWith("/shortlist/")) {
    return "salvati";
  }
  if (isLoopCatalogoPath(pathname)) return "catalogo";
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    const view = parseWorkspaceView(readViewParam(search));
    if (view === "riprendi") return "home";
    if (view === "salvati") return "salvati";
    if (view === "stack") return "stack";
    return null;
  }
  return null;
}

export function isRetiredLoopPrimaryLabel(label: string): boolean {
  return (RETIRED_PRIMARY_LABELS as readonly string[]).includes(label);
}

function readViewParam(search: string | null | undefined): string | null {
  if (!search) return null;
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(trimmed).get("view");
}
