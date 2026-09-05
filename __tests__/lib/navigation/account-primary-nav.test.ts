import { describe, expect, it } from "vitest";
import { Bookmark, Home, Layers3, LayoutGrid } from "lucide-react";

import {
  applyAuthenticatedPrimaryNav,
  isAuthenticatedNavActive,
} from "@/lib/navigation/account-primary-nav";
import type { ResolvedNavItem } from "@/lib/navigation/selectors";
import { getNavDestination } from "@/lib/navigation/selectors";

function item(id: string, href: string, label: string): ResolvedNavItem {
  return {
    id,
    kind: "route",
    href,
    label,
    canonicalLabel: label,
    owner: "product",
    audience: "public",
    scope: "primary",
    icon: id === "home" ? Home : id === "catalog" ? LayoutGrid : id === "collections" ? Layers3 : Bookmark,
    external: false,
    destination: getNavDestination(id === "decisions" ? "collections" : id),
  };
}

describe("authenticated primary nav", () => {
  const guest = [
    item("home", "/", "Home"),
    item("catalog", "/archivio", "Catalogo"),
    item("collections", "/collections", "Raccolte"),
    item("shortlist", "/shortlist", "Salvati"),
  ];

  it("leaves guest destinations unchanged", () => {
    expect(applyAuthenticatedPrimaryNav(guest, false)).toEqual(guest);
  });

  it("maps auth chrome to Spazio, Salvati, Decisioni", () => {
    const next = applyAuthenticatedPrimaryNav(guest, true);
    expect(next.map((entry) => [entry.id, entry.href, entry.label])).toEqual([
      ["home", "/account", "Spazio"],
      ["catalog", "/archivio", "Catalogo"],
      ["decisions", "/account?view=decisioni", "Decisioni"],
      ["shortlist", "/account?view=salvati", "Salvati"],
    ]);
  });

  it("matches account views without lighting every /account tab", () => {
    expect(isAuthenticatedNavActive("/account", "", "/account")).toBe(true);
    expect(isAuthenticatedNavActive("/account", "view=salvati", "/account")).toBe(false);
    expect(isAuthenticatedNavActive("/account", "view=salvati", "/account?view=salvati")).toBe(true);
    expect(isAuthenticatedNavActive("/account", "view=decisioni", "/account?view=decisioni")).toBe(
      true,
    );
  });
});
