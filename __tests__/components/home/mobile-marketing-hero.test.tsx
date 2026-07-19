// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeCatalogTool } from "../directory/catalog-test-fixtures";

/* Stato reduced-motion controllabile per i due scenari del contract. */
const { reducedMotionState } = vi.hoisted(() => ({
  reducedMotionState: { current: false },
}));

/* Motion mock: strip delle props di animazione + useReducedMotion pilotato
   (pattern condiviso con i test catalog B25). */
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileTap",
  "whileHover",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "variants",
]);

type MotionProps = Record<string, unknown> & { children?: ReactNode };

function stripMotionProps(props: MotionProps): MotionProps {
  const clean: MotionProps = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) clean[key] = props[key];
  }
  return clean;
}

vi.mock("motion/react", () => {
  const cache = new Map<string, (props: MotionProps) => ReactNode>();
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        if (!cache.has(tag)) {
          cache.set(tag, (props: MotionProps) =>
            createElement(tag, stripMotionProps(props)),
          );
        }
        return cache.get(tag);
      },
    },
  );
  return {
    motion: motionProxy,
    useReducedMotion: () => reducedMotionState.current,
  };
});

/* PremiumLink ridotto ad anchor: il contract sotto test e' il markup hero,
   non la variante premium (coperta dai test ui). */
vi.mock("@/components/ui/premium", () => ({
  PremiumLink: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children?: ReactNode;
  }) => createElement("a", { href, className }, children),
}));

import { MobileMarketingHero } from "@/components/home/mobile-marketing-hero";

const weeklyTool = makeCatalogTool({
  slug: "nebula-ai",
  name: "Nebula AI",
  toolOfWeek: true,
  featured: true,
});

const featuredTool = makeCatalogTool({
  slug: "orbita",
  name: "Orbita",
  toolOfWeek: false,
  featured: true,
});

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("B40 MobileMarketingHero — CTA e primi segnali tool nel primo viewport (MOB-704)", () => {
  beforeEach(() => {
    reducedMotionState.current = false;
  });

  afterEach(() => {
    cleanup();
  });

  it("legacy: hero 100svh senza chip tool, anche con spotlightTool passato", () => {
    const { container } = render(
      <MobileMarketingHero layout="legacy" spotlightTool={weeklyTool} />,
    );

    const section = container.querySelector("section");
    expect(section?.className).toContain("min-h-[100dvh]");
    expect(section?.className).not.toContain("v-hero-mobile--compact");
    expect(container.querySelector(".v-hero-mobile__tool-chip")).toBeNull();
  });

  it("time-to-value: hero compatto con CTA primaria catalogo e secondary radar", () => {
    const { container } = render(
      <MobileMarketingHero layout="time-to-value" spotlightTool={weeklyTool} />,
    );

    const section = container.querySelector("section");
    expect(section?.className).toContain("v-hero-mobile--compact");
    expect(section?.className).toContain("min-h-0");
    expect(section?.className).not.toContain("min-h-[100dvh]");

    const primaryCta = screen.getByRole("link", { name: "Esplora catalogo" });
    expect(primaryCta.getAttribute("href")).toBe("/archivio");
    expect(primaryCta.className).toContain("v-hero-mobile__cta--primary");

    const radarCta = screen.getByRole("link", { name: "Radar live" });
    expect(radarCta.getAttribute("href")).toBe("/radar");
  });

  it("time-to-value: chip tool della settimana nel primo viewport con href scheda", () => {
    const { container } = render(
      <MobileMarketingHero layout="time-to-value" spotlightTool={weeklyTool} />,
    );

    const chip = container.querySelector(".v-hero-mobile__tool-chip");
    expect(chip).not.toBeNull();
    expect(chip?.getAttribute("href")).toBe("/toools/nebula-ai");
    expect(chip?.textContent).toContain("Tool della settimana");
    expect(chip?.textContent).toContain("Nebula AI");
    expect(chip?.getAttribute("aria-label")).toContain("Nebula AI");
  });

  it("time-to-value: tool featured non settimanale etichettato 'Tool in evidenza'", () => {
    const { container } = render(
      <MobileMarketingHero layout="time-to-value" spotlightTool={featuredTool} />,
    );

    const chip = container.querySelector(".v-hero-mobile__tool-chip");
    expect(chip?.textContent).toContain("Tool in evidenza");
    expect(chip?.getAttribute("href")).toBe("/toools/orbita");
  });

  it("time-to-value senza spotlightTool: nessun chip ma CTA sempre presenti", () => {
    const { container } = render(
      <MobileMarketingHero layout="time-to-value" spotlightTool={null} />,
    );

    expect(container.querySelector(".v-hero-mobile__tool-chip")).toBeNull();
    expect(screen.getByRole("link", { name: "Esplora catalogo" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Radar live" })).toBeTruthy();
  });

  it("contract 390px: CTA primaria, radar e chip restano nel DOM", () => {
    window.innerWidth = 390;
    window.innerHeight = 844;
    window.dispatchEvent(new Event("resize"));

    const { container } = render(
      <MobileMarketingHero layout="time-to-value" spotlightTool={weeklyTool} />,
    );

    expect(screen.getByRole("link", { name: "Esplora catalogo" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Radar live" })).toBeTruthy();
    expect(container.querySelector(".v-hero-mobile__tool-chip")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Scorri per esplorare" }),
    ).toBeTruthy();
  });

  it("explore: scroll smooth verso #v-discovery-stage", () => {
    const target = document.createElement("div");
    target.id = "v-discovery-stage";
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(<MobileMarketingHero layout="time-to-value" spotlightTool={weeklyTool} />);
    fireEvent.click(screen.getByRole("button", { name: "Scorri per esplorare" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    target.remove();
  });

  it("reduced motion: explore usa scroll auto (nessuna animazione forzata)", () => {
    reducedMotionState.current = true;
    const target = document.createElement("div");
    target.id = "v-discovery-stage";
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(<MobileMarketingHero layout="time-to-value" spotlightTool={weeklyTool} />);
    fireEvent.click(screen.getByRole("button", { name: "Scorri per esplorare" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
    target.remove();
  });

  it("time-to-value: nessuna violazione axe su hero compatto con chip", async () => {
    const { container } = render(
      <MobileMarketingHero layout="time-to-value" spotlightTool={weeklyTool} />,
    );
    await expectNoAxeViolations(container);
  });

  it("legacy: nessuna violazione axe sul hero originale", async () => {
    const { container } = render(<MobileMarketingHero layout="legacy" />);
    await expectNoAxeViolations(container);
  });
});
