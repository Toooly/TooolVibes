// @vitest-environment jsdom

import fs from "node:fs";
import path from "node:path";

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { DefinitiveArchive } from "@/components/archive/definitive-archive";
import { CATALOG_FILTER_GROUPS, makeCatalogTool } from "../directory/catalog-test-fixtures";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceAction } from "@/lib/discovery/types";
import { WORKSPACE_SCHEMA_VERSION } from "@/lib/discovery/workspace-constants";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";

const T0 = "2026-07-17T10:00:00.000Z";

function apply(actions: WorkspaceAction[]) {
  return actions.reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(actions: WorkspaceAction[] = []) {
  activateToolWorkspaceOwner({ kind: "guest" }, apply(actions));
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

function readSource(rel: string) {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

beforeEach(() => {
  window.localStorage.clear();
  seedWorkspace();
});

afterEach(() => {
  cleanup();
});

describe("Wave 11 — Catalogo / Radar characterizations", () => {
  it("W11-T4 /radar page still renders RadarExperience", () => {
    const page = readSource("app/(marketing)/radar/page.tsx");
    expect(page).toContain("RadarExperience");
    expect(page).toContain("initialVisual={radarDesktopVisual}");
  });

  it("W11-T6 T7 shared facet chrome is wired into archive and radar", () => {
    const archive = readSource("components/archive/definitive-archive.tsx");
    const radar = readSource("components/radar/radar-experience.tsx");
    expect(archive).toContain("CatalogoFacetHead");
    expect(archive).toContain('active="tutti"');
    expect(radar).toContain("CatalogoFacetHead");
    expect(radar).toContain('active="radar"');
  });

  it("W11-T10 tray is not in archive source", () => {
    const archive = readSource("components/archive/definitive-archive.tsx");
    expect(archive).not.toContain("ArchiveV4CompareTray");
  });

  it("W11-T12 ArchiveV4CompareTray is not mounted from catalog cards", () => {
    const card = readSource("components/archive/archive-v4-tool-card.tsx");
    expect(card).not.toContain("ArchiveV4CompareTray");
    const archive = readSource("components/archive/definitive-archive.tsx");
    expect(archive).not.toMatch(/<ArchiveV4CompareTray/);
  });

  it("W11-T13 bookmark + CompareToggle stay on archive cards", () => {
    const { container } = render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );
    expect(container.querySelector(".ar4-card__bookmark")).toBeTruthy();
    const card = readSource("components/archive/archive-v4-tool-card.tsx");
    expect(card).not.toContain("SaveOverflow");
    expect(card).toContain("CompareToggle");
  });

  it("W11-T24 Filo is not on archive-v4-tool-card", () => {
    const card = readSource("components/archive/archive-v4-tool-card.tsx");
    expect(card).not.toMatch(/Filo|WorkspaceFilo/);
    expect(card).not.toContain("DecisionSheet");
  });

  it("W11-T29 workspace schema version is unchanged", () => {
    expect(WORKSPACE_SCHEMA_VERSION).toBe(1);
  });

  it("W11-T20 radar page title is not Segnale", () => {
    const page = readSource("app/(marketing)/radar/page.tsx");
    expect(page).not.toMatch(/title:\s*"Segnale"/);
    expect(page).toContain('title: "Radar: lanci da seguire"');
    const experience = readSource("components/radar/radar-experience.tsx");
    expect(experience).toContain("CatalogoFacetHead");
    expect(experience).not.toMatch(/<h1[^>]*>\s*Segnale/);
  });

  it("does not add save controls to Radar PH rows", () => {
    const experience = readSource("components/radar/radar-experience.tsx");
    expect(experience).not.toContain("ShortlistToggle");
    expect(experience).not.toContain("SaveOverflow");
    expect(experience).not.toContain("DecisionSheet");
  });
});

describe("Wave 11 — quiet personal signals on Catalogo cards", () => {
  it("W11-T9 saved fills the heart and does not add a Salvato badge", () => {
    seedWorkspace([{ type: "saved/set", slug: "cursor", saved: true, at: T0 }]);

    const { container } = render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    const heart = screen.getByRole("button", { name: "Rimuovi Cursor dai salvati" });
    expect(heart.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("[data-slot='personal-status']")).toBeNull();
    expect(screen.queryByText("Salvato")).toBeNull();
  });

  it("W11-T11 a decision word may show when it is not just Salvato", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "selected", at: T0 },
    ]);

    render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    expect(screen.getByText("Scelto")).toBeTruthy();
    expect(screen.queryByText("Salvato")).toBeNull();
  });

  it("hides compare rank when a personal word is showing", () => {
    seedWorkspace([
      { type: "saved/set", slug: "cursor", saved: true, at: T0 },
      { type: "tool/decision", slug: "cursor", outcome: "rejected", at: T0 },
      { type: "compare/toggle", slug: "cursor", at: T0 },
    ]);

    const { container } = render(
      <ArchiveV4ToolCard
        tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })}
        rank={1}
      />,
    );

    expect(screen.getByText("Scartato")).toBeTruthy();
    expect(container.querySelector(".ar4-card__rank")).toBeNull();
  });
});

describe("Catalogo — compressed mobile discovery", () => {
  it("opens the tool from the name link without a redundant CTA", () => {
    render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );

    const nameLink = screen.getByRole("link", { name: /Apri la scheda di/ });
    expect(nameLink.getAttribute("href")).toBe("/toools/cursor");
    expect(nameLink.textContent).toBe("Cursor");
    expect(nameLink.getAttribute("aria-label")).toBe("Apri la scheda di Cursor");
    expect(screen.queryByText("Apri la scheda")).toBeNull();
    expect(document.querySelector(".ar4-card__open")).toBeNull();
    // GM-02: bookmark + compare + overflow in the row.
    expect(document.querySelector(".ar4-card__bookmark")).toBeTruthy();
    expect(document.querySelector(".ar4-card__bookmark")).toBeTruthy();
  });

  it("renders compact score · skill copy without the editorial label", () => {
    render(
      <ArchiveV4ToolCard
        tool={makeCatalogTool({
          slug: "cursor",
          name: "Cursor",
          level: "intermediate",
          levelLabel: "Intermedio",
          idealUseCase: "Prototipi con AI",
          highlights: ["Differenziatore unico"],
          publicTool: {
            ...completeToolPublicFixture,
            score: {
              ...completeToolPublicFixture.score,
              value: 8.4,
              verdict: "Una scelta solida per ricerche con fonti controllabili.",
              limitationsAssessed: true,
            },
          },
          cautions: ["Serve revisione umana"],
        })}
      />,
    );

    expect(screen.queryByText(/Valutazione editoriale/)).toBeNull();
    expect(screen.getByText("★ 8.4")).toBeTruthy();
    expect(screen.getByText(/Prototipi con AI/)).toBeTruthy();
    expect(document.querySelector(".ar4-card__diff")).toBeNull();
  });

  it("keeps the mobile density, stretched-link, and gutter contracts", () => {
    const css = readSource("styles/archive-v4.css");
    const card = readSource("components/archive/archive-v4-tool-card.tsx");

    expect(card).not.toContain("Valutazione editoriale");
    expect(card).toContain('aria-label={`Apri la scheda di ${tool.name}`}');
    expect(card).toContain("ar4-card__name-link");
    expect(card).toContain("ar4-card__bookmark");
    expect(card).toContain("CompareToggle");
    expect(card).toContain("ar4-card__bookmark");

    expect(css).toContain(".ar4-card__name-link::after");
    expect(css).toContain("inset: 0");
    expect(css).toContain("padding: 24px var(--tv-gutter-mobile) 28px");
    expect(css).toContain("padding: 28px var(--tv-gutter-mobile) 36px");
    expect(css).not.toContain("padding: 24px 18px 28px");
    expect(css).not.toContain("padding: 28px 18px 36px");
    expect(css).toContain(".ar4-intro__data");
    expect(css).toContain(".ar4-card__diff");
    expect(css).toContain(".ar4-card__bookmark");
    expect(css).toContain("-webkit-line-clamp: 1");
    expect(css).toContain("background: var(--tv-button-activation-bg)");
    expect(css).not.toContain("100vw");
  });

  it("keeps a single catalog search and moves filters into an exclusive sheet accordion", () => {
    render(
      <DefinitiveArchive
        tools={[makeCatalogTool({ slug: "cursor", name: "Cursor", filterGroups: ["vibe-coding"] })]}
        filterGroups={CATALOG_FILTER_GROUPS}
      />,
    );

    expect(screen.getAllByPlaceholderText("Cerca per nome o categoria…")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Apri filtri catalogo" }));
    const dialog = screen.getByRole("dialog", { name: "Filtra il catalogo" });

    expect(within(dialog).queryByPlaceholderText("Cerca per nome o categoria…")).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Categoria" }).getAttribute("aria-expanded")).toBe("true");
    expect(within(dialog).getByRole("region", { name: "Categoria" })).toBeTruthy();
    expect(within(dialog).queryByRole("region", { name: "Obiettivi" })).toBeNull();
    expect(within(dialog).queryByRole("region", { name: "Livello" })).toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "Obiettivi" }));
    expect(within(dialog).getByRole("button", { name: "Categoria" }).getAttribute("aria-expanded")).toBe("false");
    expect(within(dialog).queryByRole("region", { name: "Categoria" })).toBeNull();
    expect(within(dialog).getByRole("region", { name: "Obiettivi" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Creare un MVP" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Livello" }));
    expect(within(dialog).getByRole("region", { name: "Livello" })).toBeTruthy();
    expect(within(dialog).queryByRole("region", { name: "Obiettivi" })).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Principiante" })).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Altri filtri" })).toBeNull();
  });

  it("discloses every category inside the Categoria group", () => {
    const filterGroups = [
      { key: "all", label: "Tutti" },
      ...Array.from({ length: 10 }, (_, index) => ({
        key: `cat-${index}`,
        label: `Gruppo ${index + 1}`,
      })),
    ];

    render(
      <DefinitiveArchive
        tools={[makeCatalogTool({ slug: "one", name: "One", filterGroups: ["cat-0"] })]}
        filterGroups={filterGroups}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apri filtri catalogo" }));
    const dialog = screen.getByRole("dialog", { name: "Filtra il catalogo" });

    expect(within(dialog).getByRole("button", { name: /Gruppo 1/ })).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: /Gruppo 10/ })).toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "Mostra tutte le categorie" }));
    expect(within(dialog).getByRole("button", { name: /Gruppo 10/ })).toBeTruthy();
  });

  it("keeps the archive method band as a compact integrity note", () => {
    const page = readSource("app/(marketing)/archivio/page.tsx");
    expect(page).toContain("Il catalogo resta editoriale. Gli sponsor restano dichiarati.");
    expect(page).toContain("Scopri il metodo");
    expect(page).not.toContain("archive-method-band__items");
    expect(page).not.toContain("Selezione curata");
  });

  it("traps focus in the filter sheet, closes on Escape, and returns focus to the opener", async () => {
    render(
      <DefinitiveArchive
        tools={[makeCatalogTool({ slug: "cursor", name: "Cursor", filterGroups: ["vibe-coding"] })]}
        filterGroups={CATALOG_FILTER_GROUPS}
      />,
    );

    const opener = screen.getByRole("button", { name: "Apri filtri catalogo" });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Filtra il catalogo" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBe("ar4-sheet-desc");
    expect(opener.getAttribute("aria-controls")).toBe("ar4-filter-sheet");

    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    const close = screen.getByRole("button", { name: "Chiudi i filtri" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(close);
    });

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Filtra il catalogo" })).toBeNull();
      expect(document.activeElement).toBe(opener);
    });
  });
});
