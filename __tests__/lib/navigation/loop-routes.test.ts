import { describe, expect, it } from "vitest";

import {
  isLoopRoute,
  isRetiredLoopPrimaryLabel,
  loopPrimaryDestinations,
  loopShowsCatalogFooter,
  loopWordmarkHref,
  resolveLoopActiveDestination,
} from "@/lib/navigation/loop-routes";

describe("loop routes — Wave 4", () => {
  it("W4-T1 auth navigation has exactly 4 primary destinations", () => {
    const dests = loopPrimaryDestinations("authenticated");
    expect(dests.map((item) => item.id)).toEqual([
      "home",
      "salvati",
      "stack",
      "catalogo",
    ]);
    expect(dests.map((item) => item.label)).toEqual([
      "Home",
      "Salvati",
      "Stack",
      "Catalogo",
    ]);
    expect(dests.map((item) => item.href)).toEqual([
      "/account",
      "/account?view=salvati",
      "/account?view=stack",
      "/archivio",
    ]);
  });

  it("W4-T2 guest nav has exactly 2 primary destinations", () => {
    expect(loopPrimaryDestinations("guest").map((item) => item.id)).toEqual([
      "salvati",
      "catalogo",
    ]);
    expect(loopPrimaryDestinations("unavailable").map((item) => item.href)).toEqual([
      "/shortlist",
      "/archivio",
    ]);
  });

  it("hides primary destinations while auth is loading", () => {
    expect(loopPrimaryDestinations("loading")).toEqual([]);
  });

  it("W4-T3 T4 T5 T6 T12 retired labels are not primary destinations", () => {
    const labels = [
      ...loopPrimaryDestinations("authenticated"),
      ...loopPrimaryDestinations("guest"),
    ].map((item) => item.label);
    for (const label of [
      "Decisioni",
      "Recenti",
      "Segnale",
      "Biblioteca",
      "Confronto",
      "Confronta",
      "Radar",
    ]) {
      expect(labels).not.toContain(label);
      expect(isRetiredLoopPrimaryLabel(label)).toBe(true);
    }
  });

  it("W4-T7 T8 T9 T10 T11 T16 active destination mapping", () => {
    expect(resolveLoopActiveDestination("/account", "")).toBe("home");
    expect(resolveLoopActiveDestination("/account", "view=riprendi")).toBe("home");
    expect(resolveLoopActiveDestination("/account", "view=salvati")).toBe("salvati");
    expect(resolveLoopActiveDestination("/account", "view=biblioteca")).toBe(
      "salvati",
    );
    expect(resolveLoopActiveDestination("/account", "view=stack")).toBe("stack");
    expect(resolveLoopActiveDestination("/archivio", "")).toBe("catalogo");
    expect(resolveLoopActiveDestination("/radar", "")).toBe("catalogo");
    expect(resolveLoopActiveDestination("/toools/linear", "")).toBe("catalogo");
    expect(resolveLoopActiveDestination("/shortlist", "")).toBe("salvati");
    expect(resolveLoopActiveDestination("/compare", "")).toBeNull();
    expect(resolveLoopActiveDestination("/account/settings", "")).toBeNull();
    expect(resolveLoopActiveDestination("/account", "view=decisioni")).toBeNull();
    expect(resolveLoopActiveDestination("/account", "view=recenti")).toBeNull();
    expect(resolveLoopActiveDestination("/account", "view=segnale")).toBeNull();
    expect(resolveLoopActiveDestination("/", "")).toBeNull();
  });

  it("W4-T23 loop allowlist does not include magazine or create redirects", () => {
    expect(isLoopRoute("/")).toBe(false);
    expect(isLoopRoute("/posts")).toBe(false);
    expect(isLoopRoute("/collections")).toBe(false);
    expect(isLoopRoute("/auth/callback")).toBe(false);
    expect(isLoopRoute("/admin")).toBe(false);
    expect(isLoopRoute("/archivio")).toBe(true);
    expect(isLoopRoute("/compare")).toBe(true);
    expect(isLoopRoute("/shortlist")).toBe(true);
    expect(isLoopRoute("/account")).toBe(true);
    expect(isLoopRoute("/account/settings")).toBe(true);
    expect(isLoopRoute("/radar")).toBe(true);
    expect(isLoopRoute("/toools/notion")).toBe(true);
  });

  it("keeps catalog footer only on Catalogo", () => {
    expect(loopShowsCatalogFooter("/archivio")).toBe(true);
    expect(loopShowsCatalogFooter("/compare")).toBe(false);
    expect(loopShowsCatalogFooter("/account")).toBe(false);
  });

  it("points the wordmark at Home for auth and Catalogo for guests", () => {
    expect(loopWordmarkHref("authenticated")).toBe("/account");
    expect(loopWordmarkHref("guest")).toBe("/archivio");
    expect(loopWordmarkHref("loading")).toBe("/archivio");
  });
});
