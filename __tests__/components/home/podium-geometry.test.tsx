// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import { DefinitiveHome } from "@/components/home/definitive-home";
import { AdvertisingConsentProvider } from "@/components/ads/advertising-consent-provider";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

vi.mock("@/components/ui/app-link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));

vi.mock("@/components/radar/radar-experience", () => ({
  RadarExperience: () => null,
  HomeRadarPreview: () => null,
}));

vi.mock("@/components/monetization/partner-placements", () => ({
  FeaturedPartner: () => null,
}));

vi.mock("@/lib/monetization/placements", () => ({
  resolvePublicMonetizationPlacement: () => null,
}));

vi.mock("@/lib/motion/use-once-in-view", () => ({
  useOnceInView: () => ({ ref: { current: null }, hasBeenVisible: true, preferReducedMotion: true }),
}));

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function makeTool(slug: string, name: string): ToolPublicView {
  return {
    publicTool: {
      schemaVersion: 1,
      slug,
      name,
      publication: { status: "published", publishedAt: "2026-01-01T00:00:00.000Z" },
      urls: { website: `https://${slug}.example.com`, affiliate: null, editorial: null },
      taxonomy: { canonicalCategory: null, sourceCategory: "AI", sourceCategoryLabel: "AI", tags: [] },
      content: { summary: "Summary", description: "Description", bestFor: null, useCases: [] },
      editorial: { evidence: [] },
      score: null,
      attributes: { pricing: null, platforms: [], level: null, segments: [] },
      media: { coverImageUrl: null },
      flags: { featured: false },
      lifecycle: { discoveredAt: null, createdAt: null, updatedAt: null },
      provenance: {
        sourceKind: "directory-tool",
        sourceId: slug,
        sourceLabel: null,
        adapterVersion: "tool-public-v1",
        missingFields: [],
      },
    },
    presentationKind: "directory",
    id: slug,
    slug,
    name,
    category: "AI",
    categoryLabel: "AI",
    level: null,
    levelLabel: null,
    segments: [],
    filterGroups: [],
    shortDescription: "Short",
    description: "Desc",
    longDescription: "Long description",
    whyItMatters: null,
    tldr: "TLDR",
    whatItDoes: "What",
    idealUseCase: null,
    editorialReview: null,
    externalUrl: `https://${slug}.example.com`,
    affiliateUrl: null,
    url: `https://${slug}.example.com`,
    originalSourceUrl: null,
    originalArticleUrl: null,
    featured: false,
    toolOfWeek: false,
    tags: [],
    ctaLabel: null,
    publishedAt: null,
    readingTime: null,
    domain: `${slug}.example.com`,
    sourceSite: null,
    useCases: [],
    highlights: [],
    cautions: [],
    accentFrom: null,
    accentTo: null,
    extendedContent: null,
  };
}

const tools = [makeTool("blink", "Blink"), makeTool("vibecode", "VibeCode"), makeTool("weweb", "WeWeb")];

describe("DefinitiveHome — Ultime dal catalogo", () => {
  afterEach(cleanup);

  it("mostra 'Ultime dal catalogo' con rail 02/01/03 + CTA", () => {
    render(
      <AdvertisingConsentProvider>
        <DefinitiveHome tools={tools} />
      </AdvertisingConsentProvider>,
    );

    expect(screen.getByText("Ultime dal catalogo")).toBeTruthy();
    expect(screen.getByText("Vedi tutto il catalogo")).toBeTruthy();

    const stageCells = document.querySelectorAll(".def-podium__stage .def-podium__cell");
    expect(stageCells.length).toBe(3);
    const ranks = [...stageCells].map(
      (cell) => cell.querySelector(".def-podium__rank")?.textContent,
    );
    expect(ranks).toEqual(["02", "01", "03"]);
    expect(
      document.querySelector(".def-podium__stage .pos-first .def-podium__name")?.textContent,
    ).toBe("Blink");
    expect(document.querySelector(".def-podium__crown")).toBeTruthy();
    expect(document.querySelector(".def-podium__laurels")).toBeTruthy();
    const cards = [...document.querySelectorAll(".def-podium__stage .def-podium__card")];
    expect(cards.map(card => card.tagName)).toEqual(["A", "A", "A"]);
    expect(cards.map(card => card.getAttribute("aria-expanded"))).toEqual(["false", "false", "false"]);
    expect(document.querySelector(".def-podium__reading")).toBeNull();
    expect(document.querySelector(".def-podium__more")).toBeNull();
    expect(document.querySelectorAll(".def-podium__rail-item").length).toBeGreaterThanOrEqual(0);
  });

  it.each(tools)("expands $name on the first activation and follows its exact route on the second", tool => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools} /></AdvertisingConsentProvider>);
    const card = screen.getByRole("link", { name: `Ingrandisci ${tool.name}` });
    const firstClick = createEvent.click(card, { button: 0, cancelable: true });
    fireEvent(card, firstClick);
    expect(firstClick.defaultPrevented).toBe(true);
    expect(card.getAttribute("aria-expanded")).toBe("true");
    expect(card.getAttribute("href")).toBe(`/toools/${tool.slug}`);
    const detail = document.getElementById(card.getAttribute("aria-controls")!);
    expect(detail?.getAttribute("aria-hidden")).toBe("false");
    expect(detail?.textContent).toContain(tool.shortDescription);
    expect(detail?.closest("a")).toBe(card);
    expect(screen.getByRole("link", { name: `Apri la scheda di ${tool.name}` })).toBe(card);

    // Observe whether the component allows native navigation, then stop jsdom from following it.
    let navigationAllowed = false;
    document.addEventListener("click", event => {
      navigationAllowed = !event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    fireEvent.click(card);
    expect(navigationAllowed).toBe(true);
  });

  it("keeps modified clicks as native links without opening a preview", () => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools} /></AdvertisingConsentProvider>);
    const card = screen.getByRole("link", { name: "Ingrandisci Blink" });
    for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
      let navigationAllowed = false;
      document.addEventListener("click", event => {
        navigationAllowed = !event.defaultPrevented;
        event.preventDefault();
      }, { once: true });
      fireEvent.click(card, { [modifier]: true });
      expect(navigationAllowed).toBe(true);
      expect(card.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("keeps the selected tool in the floating action when the pointer leaves the cards", () => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools} /></AdvertisingConsentProvider>);
    fireEvent.click(screen.getByRole("link", { name: "Ingrandisci WeWeb" }));
    const action = document.querySelector<HTMLAnchorElement>('.def-podium__journey a[href="/toools/weweb"]');
    expect(action).toBeTruthy();
    fireEvent.mouseDown(action!);
    expect(document.querySelector('.def-podium__card.is-selected')?.getAttribute("aria-label")).toBe("Apri la scheda di WeWeb");
    expect(action?.getAttribute("href")).toBe("/toools/weweb");
  });

  it.each(tools)("closes $name on an outside tap, preserves scrolling and can reopen", tool => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools} /></AdvertisingConsentProvider>);
    const card = screen.getByRole("link", { name: `Ingrandisci ${tool.name}` });
    fireEvent.click(card);
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    fireEvent.touchMove(document.body);
    expect(card.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByText("Ultime dal catalogo"));
    expect(card.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector(".def-podium__stage")?.hasAttribute("data-expanded")).toBe(false);
    fireEvent.click(card);
    expect(card.getAttribute("aria-expanded")).toBe("true");
  });

  it("moves keyboard focus to the visible right-hand neighbour of a centered third card", () => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools} /></AdvertisingConsentProvider>);
    const weweb = screen.getByRole("link", { name: "Ingrandisci WeWeb" });
    fireEvent.click(weweb);
    fireEvent.keyDown(weweb, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Apri la scheda di Blink" }));
    expect(weweb.getAttribute("aria-expanded")).toBe("false");
  });

  it("previews from the keyboard, keeps the original link focused and collapses with Escape", () => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools} /></AdvertisingConsentProvider>);
    const blink = screen.getByRole("link", { name: "Ingrandisci Blink" });
    blink.focus();
    fireEvent.keyDown(blink, { key: "ArrowRight" });
    const weweb = screen.getByRole("link", { name: "Apri la scheda di WeWeb" });
    expect(document.activeElement).toBe(weweb);
    expect(weweb.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(weweb.getAttribute("aria-controls")!)?.getAttribute("aria-hidden")).toBe("false");
    expect(document.querySelector('.def-podium__journey a[href="/toools/weweb"]')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(weweb.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(weweb, { key: "Home" });
    const vibecode = screen.getByRole("link", { name: "Apri la scheda di VibeCode" });
    expect(document.activeElement).toBe(vibecode);
    fireEvent.keyDown(vibecode, { key: "Escape" });
    expect(document.activeElement).toBe(vibecode);
    expect(vibecode.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector(".def-podium__stage")?.hasAttribute("data-expanded")).toBe(false);
  });

  it("limits the podium to nine canonical tools and preserves exact continuation routes", () => {
    const catalog = Array.from({ length: 12 }, (_, i) => makeTool(`tool-${i}`, `Tool ${i}`));
    render(<AdvertisingConsentProvider><DefinitiveHome tools={catalog} /></AdvertisingConsentProvider>);
    const names = [...document.querySelectorAll(".def-podium__stage .def-podium__name")].map(node => node.textContent);
    expect(names).toEqual(["Tool 1", "Tool 0", "Tool 2"]);
    const routes = [...document.querySelectorAll(".def-podium__rail a")].map(node => node.getAttribute("href"));
    expect(routes).toEqual(catalog.slice(3, 9).map(tool => `/toools/${tool.slug}`));
    expect(document.querySelector('.def-podium__rail a[href="/toools/tool-9"]')).toBeNull();
    expect(document.querySelectorAll('.def-podium__badge[aria-hidden="true"]')).toHaveLength(3);
  });

  it("does not fabricate a podium when fewer than three tools are available", () => {
    render(<AdvertisingConsentProvider><DefinitiveHome tools={tools.slice(0, 2)} /></AdvertisingConsentProvider>);
    expect(document.querySelector(".def-podium__stage")).toBeNull();
    expect(document.querySelector(".def-podium__rail")).toBeNull();
  });

  it("non mostra piu il podio legacy", () => {
    render(
      <AdvertisingConsentProvider>
        <DefinitiveHome tools={tools} />
      </AdvertisingConsentProvider>,
    );

    expect(document.querySelector(".def-editorial__pod-stage")).toBeNull();
    expect(document.querySelector(".def-editorial__exploratory-card")).toBeNull();
  });
});
