// @vitest-environment jsdom

/* ═══════════════════════════════════════════════════════════════
   B38 / MOB-702 — Catalog density policy (jsdom contract).

   Copertura acceptance:
   - una colonna sotto soglia: contract 320/360/390/430;
   - information priority: title → use case → CTA leggibili, long copy;
   - sponsor NON precede il primo valore organico utile, disclosure
     chiara, sponsor absent/present;
   - scroll end: ultima card e compare tray intatti a fine lista;
   - reversibilita': flag OFF → density "mobile" 1:1.

   Nota: jsdom non calcola layout — il contract verifica la variante
   applicata (classe + density), la priorita' informativa nel DOM e la
   policy sponsor; la colonna singola effettiva e' garantita dalla
   regola CSS statica (vedi __tests__/styles/catalog-density-policy-
   contract.test.ts) e rinviata al layer E2E device per la resa reale.
   ═══════════════════════════════════════════════════════════════ */

import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { createElement, Fragment, type ReactNode } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { CatalogFeaturedRail } from "@/components/directory/catalog/catalog-featured-rail";
import { CatalogResultList } from "@/components/directory/catalog/catalog-result-list";
import { MobileCatalogView } from "@/components/directory/mobile-catalog-view";
import {
  CATALOG_DENSITY_POLICY_ENV_KEY,
  isCatalogDensityPolicyEnabled,
  parseCatalogDensityPolicyFlag,
} from "@/lib/config/catalog-density-policy";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import {
  CATALOG_FILTER_GROUPS,
  makeCatalogTool,
  makeCatalogTools,
} from "./catalog-test-fixtures";

/* Router mock: il facade serializza lo stato gruppo via router.push. */
const { pushMock, replaceMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(""),
}));

/* Motion mock: strip animation internals (pattern test B25/B39). */
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
  "drag",
  "dragConstraints",
]);

type MotionProps = Record<string, unknown> & { children?: ReactNode };

function stripMotionProps(props: MotionProps): MotionProps {
  const clean: MotionProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) clean[key] = value;
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
    AnimatePresence: ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children),
    MotionConfig: ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

function resetWorkspace(state?: Partial<WorkspaceStateV1>) {
  activateToolWorkspaceOwner(
    { kind: "guest" },
    { ...createEmptyWorkspaceState(), ...state },
  );
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
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

const ORIGINAL_FLAG_VALUE = process.env[CATALOG_DENSITY_POLICY_ENV_KEY];

beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

beforeEach(() => {
  window.localStorage.clear();
  resetWorkspace();
  pushMock.mockClear();
  replaceMock.mockClear();
  delete process.env[CATALOG_DENSITY_POLICY_ENV_KEY];
});

afterEach(() => {
  cleanup();
  if (ORIGINAL_FLAG_VALUE === undefined) {
    delete process.env[CATALOG_DENSITY_POLICY_ENV_KEY];
  } else {
    process.env[CATALOG_DENSITY_POLICY_ENV_KEY] = ORIGINAL_FLAG_VALUE;
  }
});

describe("catalog density policy flag (B38)", () => {
  it("defaults to ON when the env key is unset", () => {
    expect(parseCatalogDensityPolicyFlag(undefined)).toBe(true);
    expect(isCatalogDensityPolicyEnabled()).toBe(true);
  });

  it("honours explicit kill-switch values, case-insensitive", () => {
    for (const value of ["0", "false", "off", "disabled", " FALSE ", "Off"]) {
      expect(parseCatalogDensityPolicyFlag(value)).toBe(false);
    }
    process.env[CATALOG_DENSITY_POLICY_ENV_KEY] = "0";
    expect(isCatalogDensityPolicyEnabled()).toBe(false);
  });

  it("stays ON for truthy or unknown values", () => {
    for (const value of ["1", "true", "on", "enabled", "anything"]) {
      expect(parseCatalogDensityPolicyFlag(value)).toBe(true);
    }
  });
});

describe("CatalogResultList — single-column contract 320/360/390/430 (B38)", () => {
  const viewports = [
    { name: "320px", width: 320, height: 568 },
    { name: "360px", width: 360, height: 640 },
    { name: "390px", width: 390, height: 844 },
    { name: "430px", width: 430, height: 932 },
  ];

  for (const viewport of viewports) {
    it(`applies the density-list variant with readable cards at ${viewport.name}`, () => {
      setViewport(viewport.width, viewport.height);
      const { container } = render(
        <MobileCatalogView
          tools={makeCatalogTools()}
          filterGroups={CATALOG_FILTER_GROUPS}
          initialGroup="vibe-coding"
        />,
      );

      const section = screen.getByRole("region", { name: "Tool in Vibe coding" });
      expect(section.className).toContain("mobile-tool-grid--density-list");
      expect(section.getAttribute("data-density-policy")).toBe("list");

      const articles = Array.from(
        container.querySelectorAll<HTMLElement>('[data-density="mobile-list"]'),
      );
      expect(articles.length).toBe(2);

      for (const article of articles) {
        /* Information priority: title, use case, CTA tutti presenti. */
        const title = article.querySelector('[data-slot="tool-card-title"]');
        expect(title).not.toBeNull();
        expect(title?.querySelector("a")).not.toBeNull();

        const description = article.querySelector(
          '[data-slot="tool-card-description"]',
        );
        expect(description).not.toBeNull();
        expect(description?.textContent?.trim().length).toBeGreaterThan(0);

        const cta = article.querySelector(
          `a[aria-label^="Apri la scheda di"]`,
        );
        expect(cta).not.toBeNull();

        const actions = article.querySelector('[data-slot="tool-card-actions"]');
        expect(actions).not.toBeNull();
        expect(actions?.querySelectorAll("button").length).toBe(2);
      }
    });
  }

  it("keeps title → use case → CTA DOM order (information priority)", () => {
    const { container } = render(
      <CatalogResultList
        tools={makeCatalogTools().slice(0, 2)}
        groupLabel="Vibe coding"
        searchQuery=""
      />,
    );

    const article = container.querySelector('[data-density="mobile-list"]');
    expect(article).not.toBeNull();

    const title = article?.querySelector('[data-slot="tool-card-title"]');
    const description = article?.querySelector(
      '[data-slot="tool-card-description"]',
    );
    const footer = article?.querySelector('[data-slot="tool-card-footer"]');
    expect(title && description && footer).toBeTruthy();

    expect(
      title!.compareDocumentPosition(description!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      description!.compareDocumentPosition(footer!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("stays readable with long copy (long name + long description)", async () => {
    const longTool = makeCatalogTool({
      slug: "long-copy",
      name: "Piattaforma integrata di orchestrazione avanzata per workflow di vibe coding collaborativo enterprise",
      categoryLabel: "Vibe coding",
      shortDescription:
        "Un tool che permette ai team di progettare, orchestrare e monitorare pipeline complesse di generazione codice con agenti multipli, revisione umana integrata, tracciamento delle decisioni e pubblicazione continua su ambienti di staging e produzione senza attrito operativo.",
      url: "https://long.example.com",
    });

    const { container } = render(
      <CatalogResultList tools={[longTool]} groupLabel="Vibe coding" searchQuery="" />,
    );

    const article = screen.getByRole("article", { name: longTool.name });
    const title = article.querySelector('[data-slot="tool-card-title"]');
    expect(title?.className).toContain("break-words");
    expect(title?.querySelector("a")?.className).toContain("line-clamp-2");

    const description = article.querySelector(
      '[data-slot="tool-card-description"]',
    );
    expect(description?.className).toContain("line-clamp-3");
    expect(description?.className).toContain("break-words");

    expect(
      article.querySelector('a[aria-label^="Apri la scheda di"]'),
    ).not.toBeNull();

    await expectNoAxeViolations(container);
  });

  it("reverts to the legacy mobile density 1:1 when the flag is OFF", () => {
    process.env[CATALOG_DENSITY_POLICY_ENV_KEY] = "0";

    const { container } = render(
      <CatalogResultList
        tools={makeCatalogTools().slice(0, 2)}
        groupLabel="Vibe coding"
        searchQuery=""
      />,
    );

    const section = screen.getByRole("region", { name: "Tool in Vibe coding" });
    expect(section.className).not.toContain("mobile-tool-grid--density-list");
    expect(section.getAttribute("data-density-policy")).toBeNull();

    const articles = container.querySelectorAll('[data-density="mobile"]');
    expect(articles.length).toBe(2);
    expect(container.querySelector('[data-density="mobile-list"]')).toBeNull();
  });

  it("keeps the last card and the compare tray intact at scroll end", () => {
    const tools = Array.from({ length: 8 }, (_, index) =>
      makeCatalogTool({
        slug: `tool-${index}`,
        name: `Tool ${index}`,
        shortDescription: `Use case del tool ${index}`,
      }),
    );

    render(
      <CatalogResultList tools={tools} groupLabel="Tutti i tool" searchQuery="" />,
    );

    const lastArticle = screen.getByRole("article", { name: "Tool 7" });
    expect(
      lastArticle.querySelector('a[aria-label="Apri la scheda di Tool 7"]'),
    ).not.toBeNull();
    expect(
      lastArticle.querySelector('[data-slot="tool-card-actions"]'),
    ).not.toBeNull();

    /* Il compare tray chiude la lista: presente a fine scroll. */
    const tray = screen.getByRole("region", { name: "Confronto rapido" });
    expect(tray).toBeTruthy();
    const list = document.querySelector(".mobile-tool-grid__list");
    expect(list).not.toBeNull();
    expect(
      list!.compareDocumentPosition(tray) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("CatalogFeaturedRail — sponsor policy (B38)", () => {
  it("renders nothing when the sponsor slot is absent", () => {
    const { container } = render(
      <CatalogFeaturedRail tools={[]} onSelectAll={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows a clear sponsor disclosure when present", async () => {
    const { container } = render(
      <CatalogFeaturedRail tools={makeCatalogTools().slice(0, 2)} onSelectAll={vi.fn()} />,
    );

    const rail = screen.getByRole("region", {
      name: "Tool consigliati, contenuto promosso",
    });
    expect(rail.getAttribute("data-sponsor-slot")).toBe("catalog-featured");
    expect(screen.getByText("Promosso")).toBeTruthy();
    expect(screen.getByText("Scelte consigliate")).toBeTruthy();

    const links = container.querySelectorAll('a[href^="/toools/"]');
    expect(links.length).toBe(2);

    await expectNoAxeViolations(container);
  });

  it("never precedes the first organic value in the categories view", () => {
    const { container } = render(
      <MobileCatalogView
        tools={makeCatalogTools()}
        filterGroups={CATALOG_FILTER_GROUPS}
      />,
    );

    const categories = container.querySelector("[data-catalog-categories]");
    const rail = container.querySelector('[data-sponsor-slot="catalog-featured"]');
    expect(categories).not.toBeNull();
    expect(rail).not.toBeNull();

    /* La griglia categorie (valore organico) precede lo slot sponsor. */
    expect(
      categories!.compareDocumentPosition(rail!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
