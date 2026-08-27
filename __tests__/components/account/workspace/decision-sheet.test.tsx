// @vitest-environment jsdom

import { createElement, useState } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DecisionSheet } from "@/components/account/workspace/decision-sheet";
import { WorkspaceBiblioteca } from "@/components/account/workspace/workspace-biblioteca";
import {
  CompareDecisionPanel,
  useCompareDecisionDoor,
} from "@/components/tools/compare-decision-panel";
import { workspaceTestFixtures } from "@/lib/account/test-fixtures";
import * as workspaceActions from "@/lib/account/workspace-actions";
import {
  commitWorkspaceDecision,
  toggleWorkspaceCompare,
} from "@/lib/account/workspace-actions";
import { chooseResumeAction } from "@/lib/account/workspace-pipeline";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { WorkspaceDecisionOutcome, WorkspaceStateV1 } from "@/lib/discovery/types";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
} from "@/lib/stores/tool-workspace-store";
import type { NormalisedTool } from "@/components/tools/tool-battle-shared";

const catalogRuntime = vi.hoisted(() => ({
  value: [] as PublicToolCatalogItem[],
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

const T0 = "2026-08-26T10:00:00.000Z";

function catalogFor(slugs: string[]): PublicToolCatalogItem[] {
  const named: Record<string, string> = {
    cursor: "Cursor",
    v0: "v0",
    meku: "Meku",
    "atlas-ai": "Atlas AI",
    "gamma-app": "Gamma",
  };
  return slugs.map((slug) => ({
    slug,
    name: named[slug] ?? slug,
    categoryLabel: "Coding",
    shortDescription: "",
    featured: false,
    toolOfWeek: false,
    tags: [],
    levelLabel: null,
  }));
}

function seed(state: WorkspaceStateV1 = createEmptyWorkspaceState()) {
  activateToolWorkspaceOwner({ kind: "guest" }, state);
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

function battleState(): WorkspaceStateV1 {
  return [
    { type: "saved/set" as const, slug: "cursor", saved: true, at: T0 },
    { type: "saved/set" as const, slug: "v0", saved: true, at: T0 },
    { type: "compare/toggle" as const, slug: "cursor", at: T0 },
    { type: "compare/toggle" as const, slug: "v0", at: T0 },
  ].reduce(
    (state, action) => reduceWorkspaceState(state, action),
    createEmptyWorkspaceState(),
  );
}

function fakeTool(slug: string, name: string): NormalisedTool {
  return {
    slug,
    name,
    category: "Coding",
    categoryLabel: "Coding",
    score: 8,
    editorialScore: 8,
    battleScore: 8,
    compareScore: {} as NormalisedTool["compareScore"],
    accentFrom: "#6a3cff",
    accentTo: "#43c6ff",
    tldr: "",
    useCase: "",
    review: "",
    highlights: [],
    useCases: [],
    tags: [],
    readingTime: "",
    url: "",
    logoUrl: "",
    isDirectory: false,
    useCasesCount: 0,
  };
}

function CompareDoor() {
  const tools = [fakeTool("cursor", "Cursor"), fakeTool("v0", "v0")];
  const door = useCompareDecisionDoor(tools, null);
  return createElement(
    "div",
    null,
    createElement(CompareDecisionPanel, {
      tools,
      enabled: true,
      idPrefix: "test",
      onDecidi: () => door.openDecide(),
    }),
    door.sheet,
  );
}

function SheetHarness({
  slug = "cursor",
  toolName = "Cursor",
  alternatives = [],
  source = "salvati",
  defaultOutcome = "selected",
  open = true,
}: {
  slug?: string;
  toolName?: string;
  alternatives?: string[];
  source?: "compare" | "salvati" | "home" | "shortlist";
  defaultOutcome?: WorkspaceDecisionOutcome;
  open?: boolean;
}) {
  const [isOpen, setOpen] = useState(open);
  return createElement(DecisionSheet, {
    open: isOpen,
    onOpenChange: setOpen,
    slug,
    toolName,
    alternatives,
    alternativeNames: alternatives.map((item) => ({ slug: item, name: item })),
    source,
    defaultOutcome,
  });
}

function sheetNode() {
  return document.querySelector("[data-decision-sheet]");
}

function confirm(outcome?: "Scelto" | "Scartato" | "Rimandato") {
  const node = sheetNode();
  expect(node).toBeInstanceOf(HTMLElement);
  const scope = within(node as HTMLElement);
  if (outcome) {
    fireEvent.click(scope.getByRole("radio", { name: outcome }));
  }
  fireEvent.click(scope.getByRole("button", { name: "Conferma" }));
}

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
  catalogRuntime.value = catalogFor(["cursor", "v0", "meku"]);
  seed(createEmptyWorkspaceState());
});

afterEach(() => {
  cleanup();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  vi.restoreAllMocks();
});

describe("DecisionSheet — Wave 8", () => {
  it("W8-T1 Compare opens DecisionSheet as a dialog", () => {
    seed(battleState());
    render(createElement(CompareDoor));
    fireEvent.click(screen.getByRole("button", { name: "Decidi" }));
    expect(sheetNode()).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("W8-T2 Salvati opens the same DecisionSheet", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(WorkspaceBiblioteca, { state: getCanonicalToolWorkspaceState() }));
    fireEvent.click(screen.getAllByRole("button", { name: "Decidi" })[0]);
    expect(sheetNode()?.getAttribute("data-decision-sheet")).toBe("");
    expect(sheetNode()?.getAttribute("data-decision-source")).toBe("salvati");
  });

  it("W8-T3/T4/T6/T8 Fast Conferma with no Deep fields writes one decided event and closes", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    expect((screen.getByRole("button", { name: "Conferma" }) as HTMLButtonElement).disabled).toBe(false);
    confirm();
    const state = getCanonicalToolWorkspaceState();
    expect(state.events.filter((event) => event.type === "decided")).toHaveLength(1);
    expect(state.events[0]?.reason).toBeUndefined();
    expect(state.events[0]?.useCase).toBeUndefined();
    expect(state.toolStates.cursor?.decision?.outcome).toBe("selected");
    expect(sheetNode()).toBeNull();
  });

  it("W8-T5/T13/T21 compare.slugs clear after decide, including empty-alt decide", () => {
    seed(battleState());
    render(
      createElement(SheetHarness, {
        alternatives: ["v0"],
        source: "compare",
      }),
    );
    confirm();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
    expect(chooseResumeAction(getCanonicalToolWorkspaceState()).kind).not.toBe(
      "continue_compare",
    );

    cleanup();
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness, { alternatives: [], source: "home" }));
    confirm();
    expect(getCanonicalToolWorkspaceState().events.at(-1)?.alternatives).toEqual([]);
  });

  it("W8-T7 Deep expands in place via Aggiungi perché", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    expect(screen.queryByLabelText("Perché")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi perché" }));
    expect(screen.getByLabelText("Perché")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Scelto" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("W8-T8/T9/T10 Deep fields are optional and land when present", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    fireEvent.click(screen.getByRole("button", { name: "Aggiungi perché" }));
    fireEvent.change(screen.getByLabelText("Perché"), {
      target: { value: "Per il daily coding" },
    });
    fireEvent.change(screen.getByLabelText("Caso d'uso"), {
      target: { value: "pair programming" },
    });
    confirm();
    const state = getCanonicalToolWorkspaceState();
    expect(state.toolStates.cursor?.note).toBe("Per il daily coding");
    expect(state.toolStates.cursor?.useCase).toBe("pair programming");
    expect(state.events[0]).toMatchObject({
      reason: "Per il daily coding",
      useCase: "pair programming",
    });
  });

  it("W8-T11 deferred Fast defaults to 90 days", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness, { defaultOutcome: "deferred" }));
    confirm("Rimandato");
    const revisit = getCanonicalToolWorkspaceState().toolStates.cursor?.revisitAt;
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.decision?.outcome).toBe(
      "deferred",
    );
    expect(revisit).toBeTruthy();
    const delta = new Date(revisit as string).getTime() - Date.now();
    expect(delta).toBeGreaterThan(80 * 24 * 60 * 60 * 1000);
    expect(delta).toBeLessThan(100 * 24 * 60 * 60 * 1000);
  });

  it("W8-T12 alternatives stay frozen if the live tray changes after open", () => {
    seed(battleState());
    render(
      createElement(SheetHarness, {
        alternatives: ["v0"],
        source: "compare",
      }),
    );
    toggleWorkspaceCompare("meku");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toContain("meku");
    confirm();
    expect(getCanonicalToolWorkspaceState().events[0]?.alternatives).toEqual(["v0"]);
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.alternatives).toEqual(["v0"]);
  });

  it("W8-T14 reject and W8-T15 defer write the matching outcomes", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    confirm("Scartato");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.decision?.outcome).toBe(
      "rejected",
    );

    cleanup();
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    confirm("Rimandato");
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.decision?.outcome).toBe(
      "deferred",
    );
  });

  it("W8-T16/T17/T18 reopen appends reopened, keeps old decided, and does not refill compare", () => {
    seed(battleState());
    commitWorkspaceDecision({
      slug: "cursor",
      outcome: "selected",
      alternatives: ["v0"],
    });
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
    render(createElement(SheetHarness, { alternatives: [] }));
    fireEvent.click(screen.getByRole("button", { name: "Riapri" }));
    const afterReopen = getCanonicalToolWorkspaceState();
    expect(afterReopen.toolStates.cursor?.decision?.outcome).toBeNull();
    expect(afterReopen.events.map((event) => event.type)).toEqual([
      "decided",
      "reopened",
      "revisit_set",
    ]);
    expect(afterReopen.compare.slugs).toEqual([]);
    expect(sheetNode()).toBeTruthy();
    confirm();
    const afterDecide = getCanonicalToolWorkspaceState();
    expect(afterDecide.events.filter((event) => event.type === "decided")).toHaveLength(2);
    expect(afterDecide.compare.slugs).toEqual([]);
  });

  it("W8-T19 double Conferma still writes one event", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    const button = screen.getByRole("button", { name: "Conferma" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(
      getCanonicalToolWorkspaceState().events.filter((event) => event.type === "decided"),
    ).toHaveLength(1);
  });

  it("W8-T20 failed submit keeps the sheet open and retries the same eventId", () => {
    seed(workspaceTestFixtures.withSaved);
    const commitSpy = vi.spyOn(workspaceActions, "commitWorkspaceDecision");
    commitSpy.mockImplementationOnce(() => {
      throw new Error("persist");
    });
    render(createElement(SheetHarness));
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    expect(sheetNode()).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/Riprova/);
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    expect(
      getCanonicalToolWorkspaceState().events.filter((event) => event.type === "decided"),
    ).toHaveLength(1);
    expect(sheetNode()).toBeNull();
  });

  it("W8-T22 chooseResumeAction is not continue_compare after decide", () => {
    seed(battleState());
    render(createElement(SheetHarness, { alternatives: ["v0"], source: "compare" }));
    confirm();
    expect(chooseResumeAction(getCanonicalToolWorkspaceState()).kind).not.toBe(
      "continue_compare",
    );
  });

  it("W8-T23 guest Fast decide has no Accedi wall", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    expect(screen.queryByText(/Accedi/i)).toBeNull();
    confirm();
    expect(getCanonicalToolWorkspaceState().toolStates.cursor?.decision?.outcome).toBe(
      "selected",
    );
  });

  it("W8-T24/T25 the sheet has an accessible name, Conferma is a button, Escape closes", () => {
    seed(workspaceTestFixtures.withSaved);
    render(createElement(SheetHarness));
    const dialog = screen.getByRole("dialog", { name: "Cursor" });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("button", { name: "Conferma" }).tagName).toBe("BUTTON");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(sheetNode()).toBeNull();
  });

  it("W8-T26/T27 live decide commits go through the sheet writer; tool/decision non-null stays zero", () => {
    const root = process.cwd();
    const read = (rel: string) => readFileSync(join(root, rel), "utf8");
    const sheet = read("components/account/workspace/decision-sheet.tsx");
    const panel = read("components/tools/compare-decision-panel.tsx");
    const shortlist = read("components/tools/mobile-shortlist-board.tsx");
    const biblioteca = read("components/account/workspace/workspace-biblioteca.tsx");
    const actions = read("lib/account/workspace-actions.ts");

    expect(sheet).toContain("commitWorkspaceDecision");
    expect(panel).not.toMatch(/setWorkspaceDecision\(/);
    expect(panel).not.toMatch(/deferWorkspaceTool\(/);
    expect(shortlist).not.toMatch(/setWorkspaceDecision\(/);
    expect(biblioteca).not.toMatch(/setWorkspaceDecision\([^,]+,\s*"(selected|rejected|deferred)"/);
    expect(actions).toContain('type: "workspace/decide"');

    for (const source of [sheet, panel, shortlist, biblioteca]) {
      expect(source).not.toMatch(/type:\s*"tool\/decision"/);
      expect(source).not.toMatch(/outcome:\s*"(selected|rejected|deferred)"[\s\S]{0,80}type:\s*"tool\/decision"/);
    }
  });

  it("W14 DecisionSheet desktop query is 1024 not 768", () => {
    const sheet = readFileSync(
      join(process.cwd(), "components/account/workspace/decision-sheet.tsx"),
      "utf8",
    );
    expect(sheet).toContain('export const DESKTOP_SHEET_QUERY = "(min-width: 1024px)"');
    expect(sheet).not.toContain('(min-width: 768px)');
  });

  it("W8-T30 decide does not change schemaVersion", () => {
    seed(workspaceTestFixtures.withSaved);
    expect(getCanonicalToolWorkspaceState().schemaVersion).toBe(1);
    render(createElement(SheetHarness));
    confirm();
    expect(getCanonicalToolWorkspaceState().schemaVersion).toBe(1);
  });
});
