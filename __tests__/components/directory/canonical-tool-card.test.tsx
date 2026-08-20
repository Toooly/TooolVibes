// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";
import { DirectoryToolCard } from "@/components/directory/directory-tool-card";
import { MobileToolCard } from "@/components/directory/mobile-tool-card";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  activateToolWorkspaceOwner,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { makeCatalogTool } from "./catalog-test-fixtures";

/* Motion mock: strip animation internals so assertions stay deterministic
   under jsdom (same pattern as the B25 catalog tests). */
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
  return { motion: motionProxy };
});

/* Reset canonico del workspace (stesso contratto dei test dello store):
   attiva l'owner guest con uno stato seed, così durable/volatile/in-memory
   sono allineati e i toggle lavorano sul percorso canonico reale. */
function resetWorkspace(state?: Partial<WorkspaceStateV1>) {
  activateToolWorkspaceOwner(
    { kind: "guest" },
    { ...createEmptyWorkspaceState(), ...state },
  );
}

beforeEach(() => {
  window.localStorage.clear();
  resetWorkspace();
});

afterEach(() => {
  cleanup();
});

/**
 * axe runs on rendered fragments, not full pages: `region` applies only to
 * whole documents and jsdom cannot compute real contrast (the contrast
 * contract is enforced statically on the `--tv-*` tokens, see B20/B23).
 */
async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

function makeRichTool() {
  return makeCatalogTool({
    slug: "rich-tool",
    name: "Rich Tool",
    categoryLabel: "Vibe coding",
    level: "beginner",
    levelLabel: "Base",
    shortDescription: "Descrizione breve del tool",
    tldr: "Sintesi rapida del tool",
    whatItDoes: "Costruisce prototipi rapidamente",
    editorialReview: "Lettura editoriale positiva",
    whyItMatters: "Conta perché accelera il lavoro",
    highlights: ["Veloce", "Affidabile", "Open source"],
    tags: ["react", "starter", "oss"],
    toolOfWeek: true,
    ctaLabel: "Visita il sito",
    publishedAt: "2026-07-01",
    domain: "richtool.dev",
    url: "https://richtool.dev",
  });
}

describe("CanonicalToolCard — density grid", () => {
  it("rende tutte le regioni canoniche e le informazioni senza perdita", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="grid" />,
    );

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.getAttribute("data-slot")).toBe("card");
    expect(card.getAttribute("data-density")).toBe("grid");

    for (const slot of [
      "tool-card-media",
      "tool-card-badges",
      "tool-card-title",
      "tool-card-highlights",
      "tool-card-meta",
      "tool-card-body",
      "tool-card-section",
      "tool-card-tags",
      "tool-card-cta",
      "tool-card-actions",
      "tool-card-footer",
    ]) {
      expect(
        container.querySelector(`[data-slot='${slot}']`),
        `slot ${slot}`,
      ).not.toBeNull();
    }

    // Identità e evidenza
    expect(screen.getByRole("heading", { name: "Rich Tool" })).toBeTruthy();
    expect(screen.getByText("Vibe coding")).toBeTruthy();
    expect(screen.getByText("Selezione della redazione")).toBeTruthy();
    // "Base" compare sia nel badge livello sia nel meta panel "Livello".
    expect(screen.getAllByText("Base").length).toBeGreaterThan(0);
    for (const highlight of ["Veloce", "Affidabile", "Open source"]) {
      expect(screen.getByText(highlight)).toBeTruthy();
    }
    // Corpo informativo completo
    expect(screen.getByText("Sintesi rapida del tool")).toBeTruthy();
    expect(screen.getByText("Costruisce prototipi rapidamente")).toBeTruthy();
    expect(screen.getByText("Lettura editoriale positiva")).toBeTruthy();
    expect(screen.getByText("Conta perché accelera il lavoro")).toBeTruthy();
    expect(screen.getByText("richtool.dev")).toBeTruthy();
    // Tag come link di navigazione archivio
    const tagLink = screen.getByRole("link", { name: "react" });
    expect(tagLink.getAttribute("href")).toBe("/archivio?tag=react");
    // CTA gemelle: sito esterno + profilo interno
    const externalCta = screen.getByRole("link", { name: /Visita il sito/ });
    expect(externalCta.getAttribute("href")).toBe("https://richtool.dev");
    expect(externalCta.getAttribute("target")).toBe("_blank");
    expect(externalCta.getAttribute("rel")).toContain("noopener");
    expect(
      screen.getByRole("link", { name: "Scopri di più" }).getAttribute("href"),
    ).toBe("/toools/rich-tool");
    // Data di aggiornamento
    expect(screen.getByText(/Aggiornato/)).toBeTruthy();
    // Azioni save/compare condivise
    expect(
      screen.getByRole("button", { name: "Da salvare" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      screen.getByRole("button", { name: /Confronta/ }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(container.querySelector("[data-slot='personal-status']")).toBeNull();
  });

  it("mappa livello e toolOfWeek sulle varianti canoniche di Badge", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="grid" />,
    );

    const badges = container.querySelector("[data-slot='tool-card-badges']");
    expect(badges?.querySelector("[data-variant='warning']")?.textContent).toBe(
      "Selezione della redazione",
    );
    expect(badges?.querySelector("[data-variant='success']")?.textContent).toBe("Base");

    cleanup();

    const expert = render(
      <CanonicalToolCard
        tool={makeCatalogTool({
          slug: "expert-tool",
          name: "Expert Tool",
          level: "expert",
          levelLabel: "Avanzato",
        })}
        density="grid"
      />,
    );
    const expertBadges = expert.container.querySelector("[data-slot='tool-card-badges']");
    expect(expertBadges?.querySelector("[data-variant='info']")?.textContent).toBe(
      "Avanzato",
    );
  });

  it("rispetta il contratto responsive statico (classi 320/768/1024+)", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="grid" />,
    );
    const html = container.innerHTML;

    // Breakpoint logici: base 320, sm 640+, md 768, lg 1024 — in jsdom il
    // contratto deterministico è la presenza delle utility responsive.
    expect(html).toContain("sm:p-6");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("sm:text-[length:var(--tv-text-xl)]");
    expect(html).toContain("min-h-[21rem]");
    expect(html).toContain("sm:min-h-[30rem]");
  });

  it("non scende sotto il minimo tipografico B21 (12px)", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="grid" />,
    );
    // Nessuna utility text-* arbitraria sotto 0.75rem (--tv-text-xs).
    expect(container.innerHTML).not.toMatch(/text-\[0\.[0-6]\d*rem\]/);
    expect(container.innerHTML).toContain("var(--tv-text-");
  });
});

describe("CanonicalToolCard — density list", () => {
  it("rende le stesse informazioni della grid in layout orizzontale", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="list" />,
    );

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.getAttribute("data-density")).toBe("list");

    // Nessuna perdita informativa rispetto alla grid.
    expect(screen.getByRole("heading", { name: "Rich Tool" })).toBeTruthy();
    expect(screen.getByText("Vibe coding")).toBeTruthy();
    expect(screen.getByText("Sintesi rapida del tool")).toBeTruthy();
    expect(screen.getByText("Costruisce prototipi rapidamente")).toBeTruthy();
    expect(screen.getByText("Lettura editoriale positiva")).toBeTruthy();
    expect(screen.getByText("Conta perché accelera il lavoro")).toBeTruthy();
    expect(screen.getByText("richtool.dev")).toBeTruthy();
    expect(screen.getByRole("link", { name: "react" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Visita il sito/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Scopri di più" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Da salvare" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Confronta/ })).toBeTruthy();

    // Layout orizzontale da md (768) in su: contratto statico deterministico.
    const layout = container.querySelector(".md\\:flex-row");
    expect(layout).not.toBeNull();
    // Il titolo è un link al profilo anche in list.
    const titleLink = screen.getByRole("heading", { name: "Rich Tool" }).querySelector("a");
    expect(titleLink?.getAttribute("href")).toBe("/toools/rich-tool");
  });
});

describe("CanonicalToolCard — density mobile", () => {
  it("rende la card compatta con categoria, livello, titolo, descrizione e azioni", () => {
    render(<CanonicalToolCard tool={makeRichTool()} density="mobile" />);

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.getAttribute("data-density")).toBe("mobile");
    // Density sm propagata alla primitiva Card.
    expect(card.getAttribute("data-size")).toBe("sm");

    expect(screen.getByText("Vibe coding")).toBeTruthy();
    expect(screen.getByText("Base")).toBeTruthy();

    const titleLink = screen.getByRole("link", { name: "Rich Tool" });
    expect(titleLink.getAttribute("href")).toBe("/toools/rich-tool");

    expect(screen.getByText("Descrizione breve del tool")).toBeTruthy();

    const openLink = screen.getByRole("link", {
      name: "Apri la scheda di Rich Tool",
    });
    expect(openLink.getAttribute("href")).toBe("/toools/rich-tool");

    expect(screen.getByRole("button", { name: "Da salvare" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Confronta/ })).toBeTruthy();
  });

  it("usa il tldr come fallback quando shortDescription è vuota", () => {
    render(
      <CanonicalToolCard
        tool={makeCatalogTool({
          slug: "fallback-tool",
          name: "Fallback Tool",
          shortDescription: "",
          tldr: "Sintesi di riserva",
        })}
        density="mobile"
      />,
    );

    expect(screen.getByText("Sintesi di riserva")).toBeTruthy();
  });
});

describe("CanonicalToolCard — long copy e overflow", () => {
  it("mantiene il testo completo nel DOM con clamp CSS e break-words", () => {
    const longName = "Tool dal nome lunghissimo ".repeat(8).trim();
    const longDescription = "Descrizione molto lunga che non deve overflow. ".repeat(10).trim();
    const longTldr = "Sintesi estremamente dettagliata. ".repeat(10).trim();

    const { container, unmount } = render(
      <CanonicalToolCard
        tool={makeCatalogTool({
          slug: "long-tool",
          name: longName,
          shortDescription: longDescription,
        })}
        density="mobile"
      />,
    );

    // Nessuna troncatura lato JS: l'informazione resta integra nel DOM.
    expect(container.textContent).toContain(longName);
    expect(container.textContent).toContain(longDescription);
    // Troncatura affidata al CSS (clamp) e wrapping garantito.
    expect(container.innerHTML).toContain("line-clamp-2");
    expect(container.innerHTML).toContain("break-words");
    expect(container.innerHTML).toContain("min-w-0");

    unmount();

    const grid = render(
      <CanonicalToolCard
        tool={makeCatalogTool({
          slug: "long-grid-tool",
          name: longName,
          tldr: longTldr,
        })}
        density="grid"
      />,
    );
    expect(grid.container.textContent).toContain(longName);
    expect(grid.container.textContent).toContain(longTldr);
    expect(grid.container.innerHTML).toContain("line-clamp-2");
  });
});

describe("CanonicalToolCard — missing logo", () => {
  it("mostra il fallback con iniziali quando il logo non carica", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="grid" />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("favicons");

    // Prima dell'errore le iniziali sono nascoste.
    expect(screen.getByText("RI").className).toBe("hidden");

    fireEvent.error(img as HTMLImageElement);

    // Dopo l'errore: img smontata e iniziali visibili.
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("RI").className).toBe("block");
  });
});

describe("CanonicalToolCard — stati save/compare condivisi", () => {
  it("stato iniziale: non salvato e non in confronto", () => {
    render(<CanonicalToolCard tool={makeRichTool()} density="grid" />);

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.hasAttribute("data-saved")).toBe(false);
    expect(card.hasAttribute("data-compared")).toBe(false);
    expect(
      screen.getByRole("button", { name: "Da salvare" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      screen.getByRole("button", { name: /Confronta/ }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("stato salvato e in confronto riflesso su card e toggle", () => {
    resetWorkspace({
      saved: { slugs: ["rich-tool"], updatedAt: "2026-07-17T10:00:00.000Z" },
      compare: { slugs: ["rich-tool"], updatedAt: "2026-07-17T10:00:00.000Z" },
    });

    render(<CanonicalToolCard tool={makeRichTool()} density="grid" />);

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.hasAttribute("data-saved")).toBe(true);
    expect(card.hasAttribute("data-compared")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Salvato" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: /Confronta/ }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("il toggle save aggiorna lo store condiviso e la card", () => {
    render(<CanonicalToolCard tool={makeRichTool()} density="mobile" />);

    const card = screen.getByRole("article", { name: "Rich Tool" });
    fireEvent.click(screen.getByRole("button", { name: "Da salvare" }));

    expect(useToolWorkspaceStore.getState().savedSlugs).toContain("rich-tool");
    expect(
      screen.getByRole("button", { name: "Salvato" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(card.hasAttribute("data-saved")).toBe(true);
  });
});

describe("CanonicalToolCard — slot azioni", () => {
  it("accetta un override custom dello slot azioni", () => {
    render(
      <CanonicalToolCard
        tool={makeRichTool()}
        density="grid"
        actions={<button type="button">Azione custom</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Azione custom" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Da salvare" })).toBeNull();
  });

  it("showActions=false nasconde lo slot azioni", () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="grid" showActions={false} />,
    );

    expect(container.querySelector("[data-slot='tool-card-actions']")).toBeNull();
    expect(screen.queryByRole("button", { name: "Da salvare" })).toBeNull();
    // Le CTA restano: sono navigazione, non azioni workspace.
    expect(screen.getByRole("link", { name: /Visita il sito/ })).toBeTruthy();
  });
});

describe("adapter B24 — export e props invariati", () => {
  it("DirectoryToolCard è un adapter sottile sulla density grid", () => {
    const { container } = render(
      <DirectoryToolCard tool={makeRichTool()} priority />,
    );

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.getAttribute("data-density")).toBe("grid");
    // priority=true enfatizza il glyph come nella card storica.
    expect(container.innerHTML).toContain("shadow-[0_16px_30px");
    // Le azioni save/compare arrivano dalla card canonica.
    expect(screen.getByRole("button", { name: "Da salvare" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Confronta/ })).toBeTruthy();
  });

  it("MobileToolCard è un adapter sottile sulla density mobile", () => {
    render(<MobileToolCard tool={makeRichTool()} index={2} />);

    const card = screen.getByRole("article", { name: "Rich Tool" });
    expect(card.getAttribute("data-density")).toBe("mobile");
    expect(screen.getByText("Descrizione breve del tool")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Apri la scheda di Rich Tool" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Da salvare" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Confronta/ })).toBeTruthy();
  });
});

describe("CanonicalToolCard — accessibilità", () => {
  it("nessuna violazione axe sulle tre densità e sugli stati save/compare", async () => {
    resetWorkspace({
      saved: { slugs: ["rich-tool"], updatedAt: "2026-07-17T10:00:00.000Z" },
      compare: { slugs: ["rich-tool"], updatedAt: "2026-07-17T10:00:00.000Z" },
    });

    const { container } = render(
      <div>
        <CanonicalToolCard tool={makeRichTool()} density="grid" />
        <CanonicalToolCard tool={makeRichTool()} density="list" />
        <CanonicalToolCard tool={makeRichTool()} density="mobile" />
      </div>,
    );

    await expectNoAxeViolations(container);
  });

  it("nessuna violazione axe sullo stato iniziale non salvato", async () => {
    const { container } = render(
      <CanonicalToolCard tool={makeRichTool()} density="mobile" />,
    );

    await expectNoAxeViolations(container);
  });
});
