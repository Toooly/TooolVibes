// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import fs from "node:fs";
import path from "node:path";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { navRuntime } = vi.hoisted(() => ({
  navRuntime: { pathname: "/compare" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navRuntime.pathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

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
  };
});

vi.mock("@/components/tools/tool-battle-shared", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/tools/tool-battle-shared")>();
  return { ...actual, celebrateArenaFight: vi.fn() };
});
vi.mock("@/components/tools/compare-trend-list", () => ({
  CompareTrendList: () => null,
}));

import { CompareLiveChip } from "@/components/layout/compare-live-chip";
import { OverlayProvider } from "@/components/ui/overlay-provider";
import { CompareEditorialDetails } from "@/components/tools/compare-editorial-details";
import { MobileCompareView } from "@/components/tools/mobile-compare-view";
import { SaveOverflow } from "@/components/tools/save-overflow";
import { consumeCompareDecision } from "@/components/tools/compare-workbench-ephemeral";
import {
  getOpenSaveOverflowKey,
  closeSaveOverflow,
} from "@/components/tools/save-overflow-state";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import { markGuestWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import {
  activateToolWorkspaceOwner,
  getCanonicalToolWorkspaceState,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import type { ToolPublic } from "@/lib/types/tool-public";
import {
  setWorkspaceDecision,
  toggleWorkspaceCompare,
} from "@/lib/account/workspace-actions";
import { chooseResumeAction } from "@/lib/account/workspace-pipeline";
import type { NormalisedTool } from "@/components/tools/tool-battle-shared";
import type { CompareScoreResult } from "@/lib/compare/compare-score";

const T0 = "2026-07-17T10:00:00.000Z";

function publicTool(slug: string, name: string, extras: Partial<ToolPublic> = {}): ToolPublic {
  return {
    ...completeToolPublicFixture,
    ...extras,
    slug,
    name,
    provenance: {
      ...completeToolPublicFixture.provenance,
      sourceId: `tool-${slug}`,
    },
  };
}

const TOOLS = [
  createToolPublicView(publicTool("atlas-ai", "Atlas AI")),
  createToolPublicView(
    publicTool("gamma-app", "Gamma", {
      taxonomy: {
        canonicalCategory: "Produttività",
        sourceCategory: "Produttività",
        sourceCategoryLabel: "Produttività",
        tags: ["automation"],
      },
      content: {
        ...completeToolPublicFixture.content,
        summary: "Automazione workflow.",
        bestFor: "Team che automatizzano",
        useCases: ["Automazione onboarding", "Report automatici"],
      },
    }),
  ),
  createToolPublicView(publicTool("cursor", "Cursor")),
  createToolPublicView(publicTool("v0", "v0")),
  createToolPublicView(publicTool("weweb", "WeWeb")),
  createToolPublicView(publicTool("sixth", "Sixth")),
];

function compareState(...slugs: string[]): WorkspaceStateV1 {
  return slugs.reduce(
    (state, slug) =>
      reduceWorkspaceState(state, { type: "compare/toggle", slug, at: T0 }),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(state: WorkspaceStateV1) {
  window.localStorage.clear();
  expect(markGuestWorkspaceOwner(window.localStorage)).toBe(true);
  activateToolWorkspaceOwner({ kind: "guest" }, state);
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

function buildCompareScore(slug: string, name: string): CompareScoreResult {
  return {
    version: "compare-score-v3-trust" as CompareScoreResult["version"],
    slug,
    name,
    total: 8,
    rank: 1,
    assessment: { state: "verified", missing: [] },
    confidence: { level: "high", coverage: 1, missing: [] },
    components: [],
    explanation: [],
  };
}

function buildEditorialTool(
  slug: string,
  name: string,
  extras: Partial<NormalisedTool> = {},
): NormalisedTool {
  return {
    slug,
    name,
    category: "category",
    categoryLabel: extras.categoryLabel ?? `${name} ambito`,
    score: 8,
    editorialScore: 8,
    battleScore: 8,
    compareScore: buildCompareScore(slug, name),
    accentFrom: "#6a3cff",
    accentTo: "#6a3cff",
    tldr: extras.tldr ?? `${name} tldr`,
    useCase: extras.useCase ?? `${name} use`,
    review: extras.review ?? `${name} review`,
    highlights: extras.highlights ?? [`${name} forza`],
    useCases: extras.useCases ?? [`${name} caso`],
    tags: ["tag1"],
    readingTime: extras.readingTime ?? "5 min",
    url: "https://example.com",
    logoUrl: "",
    isDirectory: false,
    useCasesCount: 1,
    ...extras,
  };
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
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
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
});

beforeEach(() => {
  navRuntime.pathname = "/compare";
  consumeCompareDecision();
  closeSaveOverflow();
  seedWorkspace(createEmptyWorkspaceState());
});

afterEach(() => {
  cleanup();
  consumeCompareDecision();
  closeSaveOverflow();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  window.localStorage.clear();
});

describe("Wave 7 — Compare workbench", () => {
  it("W7-T1 0 tools → intentional empty, not a broken battle", () => {
    render(<MobileCompareView tools={TOOLS} />);
    expect(screen.getByText("Servono due strumenti.")).toBeTruthy();
    expect(screen.queryByText("Nessun candidato nel confronto.")).toBeNull();
    expect(screen.queryByText("La matrice è vuota")).toBeNull();
    expect(screen.queryByRole("region", { name: "Classifica del confronto" })).toBeNull();
    expect(screen.getByRole("link", { name: "Aggiungi da Salvati" }).getAttribute("href")).toBe(
      "/shortlist",
    );
    expect(screen.getByRole("link", { name: "Apri il catalogo" }).getAttribute("href")).toBe(
      "/archivio",
    );
  });

  it("W7-T2 1 tool → preparation, not a differences matrix", () => {
    seedWorkspace(compareState("atlas-ai"));
    render(<MobileCompareView tools={TOOLS} />);
    expect(screen.getByText("Serve ancora uno strumento per confrontare.")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Atlas AI" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Classifica del confronto" })).toBeNull();
    expect(document.querySelector(".compare-factor-matrix")).toBeNull();
    expect(screen.getByRole("button", { name: "Rimuovi Atlas AI dal confronto" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiudi confronto" })).toBeTruthy();
  });

  it("W7-T3 2 tools → comparison renders", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<MobileCompareView tools={TOOLS} />);
    expect(screen.getByRole("heading", { name: / vs / })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Classifica del confronto" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Registra decisione" })).toBeTruthy();
  });

  it("W7-T4 3–5 tools are supported", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app", "cursor"));
    const { unmount } = render(<MobileCompareView tools={TOOLS} />);
    expect(screen.getByRole("heading", { name: / vs / }).textContent).toMatch(
      /Atlas AI|Gamma|Cursor/,
    );
    expect(document.querySelector("[data-compare-identity]")?.getAttribute("data-count")).toBe(
      "3",
    );
    unmount();

    seedWorkspace(compareState("atlas-ai", "gamma-app", "cursor", "v0", "weweb"));
    render(<MobileCompareView tools={TOOLS} />);
    expect(document.querySelector("[data-compare-identity]")?.getAttribute("data-count")).toBe(
      "5",
    );
    expect(screen.getByText("5 su 5")).toBeTruthy();
  });

  it("W7-T5 sixth cannot be added", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app", "cursor", "v0", "weweb"));
    const added = useToolWorkspaceStore.getState().toggleCompare("sixth");
    expect(added.added).toBe(false);
    expect(added.limited).toBe(true);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([
      "atlas-ai",
      "gamma-app",
      "cursor",
      "v0",
      "weweb",
    ]);
  });

  it("W7-T6 chip hidden at 0", () => {
    render(<CompareLiveChip placement="dock" />);
    expect(document.querySelector("[data-compare-live-chip]")).toBeNull();
  });

  it("W7-T7 chip updates 1–5", () => {
    seedWorkspace(compareState("atlas-ai"));
    const view = render(<CompareLiveChip placement="dock" />);
    expect(screen.getByRole("link", { name: "Confronta 1 su 5" })).toBeTruthy();
    seedWorkspace(compareState("atlas-ai", "gamma-app", "cursor", "v0", "weweb"));
    view.rerender(<CompareLiveChip placement="dock" />);
    expect(screen.getByRole("link", { name: "Confronta 5 su 5" })).toBeTruthy();
  });

  it("W7-T8 collector reads the same compare.slugs", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(
      <>
        <CompareLiveChip placement="dock" />
        <MobileCompareView tools={TOOLS} />
      </>,
    );
    expect(screen.getByRole("link", { name: "Confronta 2 su 5" })).toBeTruthy();
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([
      "atlas-ai",
      "gamma-app",
    ]);
    expect(screen.getByRole("heading", { name: / vs / })).toBeTruthy();
  });

  it("W7-T9 duplicate archive tray is not live", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "components/archive/definitive-archive.tsx"),
      "utf8",
    );
    expect(source).not.toContain("ArchiveV4CompareTray");
  });

  it("W7-T10 remove tool updates workbench + store slugs", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<MobileCompareView tools={TOOLS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Rimuovi Gamma dal confronto" })[0]);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["atlas-ai"]);
    expect(screen.getByText("Serve ancora uno strumento per confrontare.")).toBeTruthy();
  });

  it("W7-T11 remove to 1 → prep state", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<MobileCompareView tools={TOOLS} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Rimuovi Atlas AI dal confronto" })[0]);
    expect(screen.getByText("Serve ancora uno strumento per confrontare.")).toBeTruthy();
    expect(document.querySelector('[data-compare-workbench-state="prep"]')).toBeTruthy();
  });

  it("W7-T12 remove to 0 → empty state", () => {
    seedWorkspace(compareState("atlas-ai"));
    render(<MobileCompareView tools={TOOLS} />);
    fireEvent.click(screen.getByRole("button", { name: "Rimuovi Atlas AI dal confronto" }));
    expect(screen.getByText("Servono due strumenti.")).toBeTruthy();
    expect(document.querySelector('[data-compare-workbench-state="empty"]')).toBeTruthy();
  });

  it("W7-T13 mobile criterion accordion renders values per tool", () => {
    render(
      <CompareEditorialDetails
        layoutMode="mobile"
        tools={[
          buildEditorialTool("atlas-ai", "Atlas AI"),
          buildEditorialTool("gamma-app", "Gamma"),
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Ambito principale" })).toBeTruthy();
    expect(screen.getByText("Atlas AI ambito")).toBeTruthy();
    expect(screen.getByText("Gamma ambito")).toBeTruthy();
    expect(screen.getByText("Atlas AI")).toBeTruthy();
    expect(screen.getByText("Gamma")).toBeTruthy();
  });

  it("W7-T14 accordion buttons expose aria-expanded", () => {
    render(
      <CompareEditorialDetails
        layoutMode="mobile"
        tools={[
          buildEditorialTool("atlas-ai", "Atlas AI"),
          buildEditorialTool("gamma-app", "Gamma"),
        ]}
      />,
    );
    const first = screen.getByRole("button", { name: "Ambito principale" });
    const second = screen.getByRole("button", { name: "Casi d'uso" });
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(second.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(second);
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(second.getAttribute("aria-expanded")).toBe("true");
  });

  it("W7-T15 sticky identity is present for n>=2", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<MobileCompareView tools={TOOLS} />);
    const strip = document.querySelector("[data-compare-identity]");
    expect(strip).toBeTruthy();
    expect(strip?.querySelector(".compare-workbench-identity__name")).toBeTruthy();
  });

  it("W7-T16 Save→Compare still writes compare.slugs", () => {
    toggleWorkspaceCompare("cursor");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["cursor"]);
    const added = useToolWorkspaceStore.getState().toggleCompare("v0");
    expect(added.added).toBe(true);
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual(["cursor", "v0"]);
  });

  it("W7-T17 Speed 2 sheet closes after Confronta", async () => {
    render(
      <OverlayProvider>
        <SaveOverflow slug="cursor" toolName="Cursor" />
      </OverlayProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Altre azioni per Cursor" }));
    await waitFor(() => {
      expect(document.querySelector("[data-save-overflow-title]")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Confronta" }));
    expect(getCanonicalToolWorkspaceState().compare.slugs).toContain("cursor");
    expect(getOpenSaveOverflowKey()).toBeNull();
  });

  it("W7-T18 live compare resume stays continue_compare when n>=2 undecided", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    expect(chooseResumeAction(getCanonicalToolWorkspaceState()).kind).toBe(
      "continue_compare",
    );
  });

  it("W7-T19 Decide clears battle slugs", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    act(() => {
      setWorkspaceDecision("atlas-ai", "selected");
    });
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
  });

  it("W7-T20 after decide the live chip unmounts", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(
      <>
        <CompareLiveChip placement="dock" />
        <MobileCompareView tools={TOOLS} />
      </>,
    );
    expect(document.querySelector("[data-compare-live-chip]")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Scegli" })[0],
    );
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([]);
    expect(document.querySelector("[data-compare-live-chip]")).toBeNull();
    expect(screen.getByText("Confronto chiuso.")).toBeTruthy();
  });

  it("W7-T21 completed battle is not resumable", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    act(() => {
      setWorkspaceDecision("atlas-ai", "selected");
    });
    expect(chooseResumeAction(getCanonicalToolWorkspaceState()).kind).not.toBe(
      "continue_compare",
    );
  });

  it("W7-T22 /compare workbench heading exists", () => {
    render(<MobileCompareView tools={TOOLS} />);
    expect(screen.getByRole("heading", { name: "Servono due strumenti." })).toBeTruthy();
    cleanup();
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<MobileCompareView tools={TOOLS} />);
    expect(screen.getByRole("heading", { name: / vs / })).toBeTruthy();
  });

  it("W7-T26 toggleWorkspaceCompare still writes the same slugs", () => {
    toggleWorkspaceCompare("atlas-ai");
    toggleWorkspaceCompare("gamma-app");
    expect(getCanonicalToolWorkspaceState().compare.slugs).toEqual([
      "atlas-ai",
      "gamma-app",
    ]);
  });

  it("W7-T27 guest compare is supported without an auth gate", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    render(<MobileCompareView tools={TOOLS} />);
    expect(screen.queryByText(/Accedi/i)).toBeNull();
    expect(screen.getByRole("region", { name: "Registra decisione" })).toBeTruthy();
  });

  it("W7-T28 decide still appends a decided event", () => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
    act(() => {
      setWorkspaceDecision("atlas-ai", "selected");
    });
    expect(
      getCanonicalToolWorkspaceState().events.some((event) => event.type === "decided"),
    ).toBe(true);
  });
});
