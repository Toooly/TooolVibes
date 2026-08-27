// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CATALOGO_FACETS,
  CatalogoFacetHead,
  resolveCatalogoFacet,
} from "@/components/archive/catalogo-facet-head";

afterEach(() => {
  cleanup();
});

describe("CatalogoFacetHead — Wave 11", () => {
  it("W11-T6 Tutti is current on archive and links to /archivio", () => {
    render(<CatalogoFacetHead active="tutti" />);

    const tutti = screen.getByRole("link", { name: "Tutti" });
    const radar = screen.getByRole("link", { name: "Radar" });

    expect(tutti.getAttribute("href")).toBe("/archivio");
    expect(tutti.getAttribute("aria-current")).toBe("page");
    expect(tutti.getAttribute("data-catalogo-facet")).toBe("tutti");
    expect(radar.getAttribute("href")).toBe("/radar");
    expect(radar.getAttribute("aria-current")).toBeNull();
  });

  it("W11-T7 Radar is current on radar and links to /radar", () => {
    render(<CatalogoFacetHead active="radar" />);

    const tutti = screen.getByRole("link", { name: "Tutti" });
    const radar = screen.getByRole("link", { name: "Radar" });

    expect(radar.getAttribute("href")).toBe("/radar");
    expect(radar.getAttribute("aria-current")).toBe("page");
    expect(radar.getAttribute("data-catalogo-facet")).toBe("radar");
    expect(tutti.getAttribute("href")).toBe("/archivio");
    expect(tutti.getAttribute("aria-current")).toBeNull();
  });

  it("W11-T20 facet copy is Tutti / Radar, never Segnale", () => {
    const { container } = render(<CatalogoFacetHead active="radar" />);
    const nav = container.querySelector("[data-catalogo-facet-nav]");

    expect(nav?.getAttribute("aria-label")).toBe("Lente Catalogo");
    expect(CATALOGO_FACETS.map((facet) => facet.label)).toEqual(["Tutti", "Radar"]);
    expect(container.textContent).not.toContain("Segnale");
    expect(screen.queryByRole("heading", { name: "Segnale" })).toBeNull();
  });

  it("resolves archive and radar pathnames to the Catalogo lens", () => {
    expect(resolveCatalogoFacet("/archivio")).toBe("tutti");
    expect(resolveCatalogoFacet("/archivio/vibe")).toBe("tutti");
    expect(resolveCatalogoFacet("/radar")).toBe("radar");
    expect(resolveCatalogoFacet("/radar/day")).toBe("radar");
    expect(resolveCatalogoFacet("/account")).toBeNull();
  });
});
