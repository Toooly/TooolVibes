// @vitest-environment jsdom

import fs from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ArchiveV4ToolCard } from "@/components/archive/archive-v4-tool-card";
import { makeCatalogTool } from "../directory/catalog-test-fixtures";
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

  it("W11-T10 CompareLiveChip remains the collector; tray is not in archive source", () => {
    const archive = readSource("components/archive/definitive-archive.tsx");
    expect(archive).not.toContain("ArchiveV4CompareTray");
    expect(archive).toContain("CompareLiveChip");
  });

  it("W11-T12 ArchiveV4CompareTray is not mounted from catalog cards", () => {
    const card = readSource("components/archive/archive-v4-tool-card.tsx");
    expect(card).not.toContain("ArchiveV4CompareTray");
    const archive = readSource("components/archive/definitive-archive.tsx");
    expect(archive).not.toMatch(/<ArchiveV4CompareTray/);
  });

  it("W11-T13 ShortlistToggle stays on archive cards", () => {
    const { container } = render(
      <ArchiveV4ToolCard tool={makeCatalogTool({ slug: "cursor", name: "Cursor" })} />,
    );
    expect(container.querySelector('[data-sonic-action="save"]')).toBeTruthy();
    const card = readSource("components/archive/archive-v4-tool-card.tsx");
    expect(card).toContain("ShortlistToggle");
    expect(card).toContain("SaveOverflow");
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
    expect(page).toContain('title: "Radar Product Hunt"');
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
