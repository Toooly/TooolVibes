// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeCatalogTool } from "../directory/catalog-test-fixtures";

/* Sponsor slot mockato: la policy di placement e' coperta dai test B38;
   qui conta solo l'ordine relativo delle sezioni. */
vi.mock("@/components/monetization/native-placement", () => ({
  NativePlacement: () =>
    createElement("div", { "data-testid": "native-placement-mock" }),
}));

/* next/image ridotto a img: il contract e' il markup, non l'optimizer. */
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import { VibeHomeV2 } from "@/components/home/vibe-home-v2";

const weeklyTool = makeCatalogTool({
  slug: "nebula-ai",
  name: "Nebula AI",
  toolOfWeek: true,
  featured: true,
  tldr: "Il tool della settimana",
});

const alphaTool = makeCatalogTool({
  slug: "alpha",
  name: "Alpha",
  featured: true,
});

const betaTool = makeCatalogTool({
  slug: "beta",
  name: "Beta",
  featured: true,
});

const tools = [weeklyTool, alphaTool, betaTool];
const supportingTools = [alphaTool, betaTool];

/** Classi delle sezioni di primo livello nell'ordine di rendering. */
function sectionOrder(container: HTMLElement) {
  const origin = container.querySelector(".vibe-home-mobile-origin");
  expect(origin).not.toBeNull();
  return Array.from(origin!.children).map((child) => {
    if (child.classList.contains("v-discovery-stage")) return "discovery";
    if (child.classList.contains("v-spotlight-section")) return "spotlight";
    if (child.querySelector("[data-testid='native-placement-mock']"))
      return "placement";
    if (child.classList.contains("v-method-section")) return "method";
    return child.className;
  });
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("B40 VibeHomeV2 — composizione home flaggabile (MOB-704)", () => {
  afterEach(() => {
    cleanup();
  });

  it("legacy: composizione originale senza classi time-to-value", () => {
    const { container } = render(
      <VibeHomeV2
        tools={tools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools}
        layout="legacy"
      />,
    );

    const origin = container.querySelector(".vibe-home-mobile-origin");
    expect(origin?.className).not.toContain("vibe-home-mobile-origin--ttv");
    expect(origin?.getAttribute("data-home-layout")).toBe("legacy");

    const discovery = container.querySelector(".v-discovery-stage");
    expect(discovery?.className).not.toContain("v-discovery-stage--flow");

    expect(sectionOrder(container)).toEqual([
      "discovery",
      "spotlight",
      "placement",
      "method",
    ]);
  });

  it("time-to-value: discovery a flusso e origine --ttv, ordine sezioni invariato", () => {
    const { container } = render(
      <VibeHomeV2
        tools={tools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools}
        layout="time-to-value"
      />,
    );

    const origin = container.querySelector(".vibe-home-mobile-origin");
    expect(origin?.className).toContain("vibe-home-mobile-origin--ttv");
    expect(origin?.getAttribute("data-home-layout")).toBe("time-to-value");

    const discovery = container.querySelector(".v-discovery-stage");
    expect(discovery?.className).toContain("v-discovery-stage--flow");
    // Lo stage orbitale resta la prima sezione: possiede l'offset dell'header.
    expect(discovery?.className).toContain("v-discovery-stage--orbital");

    expect(sectionOrder(container)).toEqual([
      "discovery",
      "spotlight",
      "placement",
      "method",
    ]);
  });

  it("sponsor dopo il primo valore organico in entrambe le modalita'", () => {
    for (const layout of ["legacy", "time-to-value"] as const) {
      const { container, unmount } = render(
        <VibeHomeV2
          tools={tools}
          weeklyTool={weeklyTool}
          supportingTools={supportingTools}
          layout={layout}
        />,
      );
      const order = sectionOrder(container);
      expect(order.indexOf("placement")).toBeGreaterThan(
        order.indexOf("spotlight"),
      );
      unmount();
    }
  });

  it("focus tool: weeklyTool guida spotlight e nodo 'Tool scelto'", () => {
    const { container } = render(
      <VibeHomeV2
        tools={tools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools}
        layout="time-to-value"
      />,
    );

    const spotlight = container.querySelector(".v-spotlight-section");
    expect(spotlight?.textContent).toContain("Nebula AI");
    expect(spotlight?.textContent).toContain("Tool della settimana");

    const chosenNode = container.querySelector(
      ".v-discovery-grid-node[aria-label='Tool scelto']",
    );
    expect(chosenNode?.getAttribute("href")).toBe("/toools/nebula-ai");
  });

  it("senza tools: spotlight omesso ma discovery e metodo restano", () => {
    const { container } = render(
      <VibeHomeV2 tools={[]} supportingTools={[]} layout="time-to-value" />,
    );

    expect(container.querySelector(".v-spotlight-section")).toBeNull();
    expect(container.querySelector(".v-discovery-stage")).not.toBeNull();
    expect(container.querySelector(".v-method-section")).not.toBeNull();
  });

  it("contract 390px: struttura delle sezioni stabile in time-to-value", () => {
    window.innerWidth = 390;
    window.innerHeight = 844;
    window.dispatchEvent(new Event("resize"));

    const { container } = render(
      <VibeHomeV2
        tools={tools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools}
        layout="time-to-value"
      />,
    );

    expect(sectionOrder(container)).toEqual([
      "discovery",
      "spotlight",
      "placement",
      "method",
    ]);
    // I 5 percorsi discovery restano raggiungibili come link.
    expect(
      container.querySelectorAll(".v-discovery-grid-node").length,
    ).toBe(5);
  });

  it("time-to-value: nessuna violazione axe sulla composizione", async () => {
    const { container } = render(
      <VibeHomeV2
        tools={tools}
        weeklyTool={weeklyTool}
        supportingTools={supportingTools}
        layout="time-to-value"
      />,
    );
    await expectNoAxeViolations(container);
  });
});
