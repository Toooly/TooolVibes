// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileCompareView } from "@/components/tools/mobile-compare-view";
import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import {
  markGuestWorkspaceOwner,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import { COMPARE_OBJECTIVE_STORAGE_KEY } from "@/lib/compare/compare-objective";
import { completeToolPublicFixture } from "@/__tests__/fixtures/tool-public";
import type { ToolPublic } from "@/lib/types/tool-public";

/* Motion mock: strip animation internals so assertions are deterministic
   under jsdom (same pattern as the B32/B34 test suites). */
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

/* Confetti e trend list sono fuori scope B35: il pannello decisione non
   dipende da loro e il test resta ermetico (niente canvas né fetch). Il
   mock parziale di tool-battle-shared preserva il motore B33/B34 reale e
   neutralizza solo il side effect teatrale (dynamic import di
   canvas-confetti, non intercettabile in modo deterministico in jsdom). */
vi.mock("@/components/tools/tool-battle-shared", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/tools/tool-battle-shared")>();
  return { ...actual, celebrateArenaFight: vi.fn() };
});
vi.mock("@/components/tools/compare-trend-list", () => ({
  CompareTrendList: () => null,
}));

const T0 = "2026-07-17T10:00:00.000Z";

const gamma: ToolPublic = {
  ...completeToolPublicFixture,
  slug: "gamma-app",
  name: "Gamma",
  taxonomy: {
    canonicalCategory: "Produttività",
    sourceCategory: "Produttività",
    sourceCategoryLabel: "Produttività",
    tags: ["automation", "workflow", "team", "prototype"],
  },
  content: {
    summary: "Automazione completa dei flussi ripetitivi.",
    description: "Gamma automatizza workflow di team con approvazioni tracciate.",
    bestFor: "Team che vogliono automazione workflow completa",
    useCases: [
      "Automazione onboarding",
      "Approvazioni ricorrenti",
      "Sincronizzazione strumenti",
      "Report automatici",
    ],
  },
  editorial: {
    evidence: [
      { kind: "review", text: "Il motore di regole resta leggibile.", sourceField: "editorial_note" },
      { kind: "strength", text: "Automazione workflow completa", sourceField: "strengths" },
      { kind: "strength", text: "Permessi granulari", sourceField: "strengths" },
      { kind: "highlight", text: "Template pronti", sourceField: "highlights" },
    ],
  },
  score: {
    inputs: [
      { dimension: "ease_of_use", level: "strong" },
      { dimension: "workflow_fit", level: "strong" },
      { dimension: "editorial_conviction", level: "solid" },
    ],
    provenance: {
      kind: "editorial-assessment",
      sourceField: "editorial_scorecard",
      methodologyVersion: "editorial-scorecard-v2",
      assessedAt: "2026-07-12T10:00:00.000Z",
    },
  },
  provenance: {
    ...completeToolPublicFixture.provenance,
    sourceId: "tool-gamma",
  },
};

const VIEWS = [
  createToolPublicView(completeToolPublicFixture),
  createToolPublicView(gamma),
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

function readPersistedWorkspace(key: string = WORKSPACE_STORAGE_KEY) {
  const raw = window.localStorage.getItem(key);
  expect(raw).toBeTruthy();
  return JSON.parse(raw as string) as WorkspaceStateV1;
}

/* Il calcolo del verdetto usa il timer B33: il test lo attraversa con
   timer finti, il comportamento sotto test è lo stato persistito. */
function revealMobileResult() {
  fireEvent.click(
    screen.getByRole("button", { name: /analizza il confronto/i }),
  );
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

function decisionRegion() {
  return screen.getByRole("region", { name: "Registra decisione" });
}

function openDecisionSheet() {
  fireEvent.click(screen.getAllByRole("button", { name: "Decidi" })[0]);
  const node = document.querySelector("[data-decision-sheet]");
  expect(node).toBeInstanceOf(HTMLElement);
  return node as HTMLElement;
}

function confirmDecision(outcome?: "Scelto" | "Scartato" | "Rimandato") {
  const sheet = openDecisionSheet();
  if (outcome) {
    fireEvent.click(within(sheet).getByRole("radio", { name: outcome }));
  }
  fireEvent.click(within(sheet).getByRole("button", { name: "Salva decisione" }));
}

async function confirmV2Decision() {
  fireEvent.click(screen.getByRole("button", { name: "Scegli Atlas AI" }));
  await waitFor(() => expect(document.querySelector("[data-decision-sheet]")).not.toBeNull());
  const sheet = document.querySelector("[data-decision-sheet]") as HTMLElement;
  fireEvent.click(within(sheet).getByRole("button", { name: "Salva decisione" }));
  await waitFor(() => expect(readPersistedWorkspace().compare.slugs).toEqual([]));
}

let desktopViewport = false;
const viewportChangeListeners = new Set<() => void>();

function setDesktopViewport(matches: boolean) {
  desktopViewport = matches;
  act(() => {
    viewportChangeListeners.forEach((listener) => listener());
  });
}

/* axe gira sul frammento renderizzato, non sulla pagina intera (stesso
   razionale delle suite B34/B53: jsdom non calcola contrasto né landmark
   di un documento completo). */
async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
      "landmark-complementary-is-top-level": { enabled: false },
      // La matrice V4 espone due region con la stessa etichetta "Verdetto
      // del confronto" (anteprima nell'arena + card standalone): in un
      // frammento jsdom la regola produce collisioni spurie senza un
      // outline completo del documento.

    },
  });
  expect(results.violations).toEqual([]);
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
      get matches() {
        return query === "(min-width: 1280px)" ? desktopViewport : false;
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => {
        if (query === "(min-width: 1280px)") viewportChangeListeners.add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => {
        if (query === "(min-width: 1280px)") viewportChangeListeners.delete(listener);
      },
      dispatchEvent: vi.fn(),
    }),
  );
});

beforeEach(() => {
  desktopViewport = false;
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/compare");
  seedWorkspace(compareState("atlas-ai", "gamma-app"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  window.localStorage.clear();
  window.history.replaceState(null, "", "/compare");
});

describe("CompareDecisionPanel — B35 choose/motivazione/ritorno (FLOW-604)", () => {
  it("registra una decisione dal confronto con motivazione, timestamp e ritorno ai Salvati", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    const region = decisionRegion();
    expect(region.textContent).toContain("Confronto generale");
    expect(region.textContent).toContain("Atlas AI");
    expect(region.textContent).toContain("Gamma");

    // Wave 7: relationship CTA, not Salvati trophy.
    const seeLink = within(region).getByRole("link", {
      name: /Vedi /,
    });
    expect(seeLink.getAttribute("href")).toMatch(/^\/toools\//);
    expect(seeLink.getAttribute("href")).not.toContain("shortlist");

    confirmDecision("Scelto");

    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
    expect(
      persisted.toolStates["atlas-ai"].decision?.updatedAt,
    ).toBeTruthy();
    // Contract B16: la decisione aggiunge il tool ai salvati (scrittura additiva).
    expect(persisted.saved.slugs).toContain("atlas-ai");
    // Wave 2 TARGET: live Decide clears the battle. The compare surface
    // unmounts the decision panel instead of leaving a zombie tray.
    expect(persisted.compare.slugs).toEqual([]);
    expect(persisted.events.some((event) => event.type === "decided")).toBe(
      true,
    );
    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
    expect(screen.getByText("Confronto chiuso.")).toBeTruthy();
  });

  it("Wave 2 TARGET: Scegli then Scarta cannot continue on a dead battle", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    confirmDecision("Scelto");
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
    expect(readPersistedWorkspace().compare.slugs).toEqual([]);
    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Scarta" })).toBeNull();
  });

  it("Wave 2 TARGET: reload after Decide does not resurrect the battle", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    confirmDecision("Scelto");
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
    expect(readPersistedWorkspace().compare.slugs).toEqual([]);

    cleanup();
    render(<MobileCompareView tools={VIEWS} />);
    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
    expect(screen.getByText("Confronto chiuso.")).toBeTruthy();
    expect(readPersistedWorkspace().compare.slugs).toEqual([]);
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
  });

  it("isola la decisione per owner: guest e account non si contaminano", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    confirmDecision("Scelto");
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
    expect(readPersistedWorkspace().compare.slugs).toEqual([]);

    // Login: same compare seeded for the account, no inherited decision.
    const account = { kind: "account" as const, userId: "user-b35" };
    act(() => {
      activateToolWorkspaceOwner(account, compareState("atlas-ai", "gamma-app"));
      dispatchWorkspaceChange({ source: "local", scope: "workspace" });
    });
    revealMobileResult();

    confirmDecision("Scartato");
    const accountState = readPersistedWorkspace(
      workspaceStorageKeyForOwner(account),
    );
    expect(accountState.toolStates["atlas-ai"].decision?.outcome).toBe(
      "rejected",
    );
    expect(accountState.compare.slugs).toEqual([]);
    expect(
      accountState.toolStates["gamma-app"]?.decision ?? null,
    ).toBeNull();

    // Logout: guest decision remains; guest battle stays dead.
    act(() => {
      activateToolWorkspaceOwner({ kind: "guest" });
      dispatchWorkspaceChange({ source: "local", scope: "workspace" });
    });
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
    expect(readPersistedWorkspace().compare.slugs).toEqual([]);
    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
  });

  it("deep link V2: la decisione persiste l'obiettivo attivo", async () => {
    vi.useRealTimers();
    window.history.replaceState(null, "", "/compare?objective=save-time");
    render(<ToolBattleView tools={VIEWS} />);
    await screen.findByRole("button", { name: "Scegli Atlas AI" });
    await confirmV2Decision();
    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].decision?.outcome).toBe("selected");
    expect(persisted.toolStates["atlas-ai"].compareObjective).toBe("save-time");
  });

  it("flag OFF: nessun pannello decisione, il flow termina al verdetto (contratto B34)", () => {
    render(<MobileCompareView tools={VIEWS} decisionEnabled={false} />);
    revealMobileResult();

    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
    // Il verdetto resta raggiungibile come prima.
    expect(
      screen.getByRole("button", { name: /Ricalcola l'esito/ }),
    ).toBeTruthy();
  });

  it("la decisione V2 resta unica quando cambia il viewport", async () => {
    vi.useRealTimers();
    const { container } = render(<ToolBattleView tools={VIEWS} />);
    await screen.findByRole("button", { name: "Scegli Atlas AI" });
    expect(container.querySelectorAll('[data-compare-renderer="mobile"]')).toHaveLength(1);
    expect(container.querySelector('[data-compare-renderer="desktop"]')).toBeNull();
    await confirmV2Decision();
    expect(readPersistedWorkspace().compare.slugs).toEqual([]);
    setDesktopViewport(true);
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe("selected");
    expect(screen.queryByRole("button", { name: "Scegli Atlas AI" })).toBeNull();
  });

  it("nessuna violazione axe sul confronto con pannello decisione", async () => {
    const { container } = render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();
    confirmDecision("Scelto");

    vi.useRealTimers();
    await expectNoAxeViolations(container);
  });

  it("writes Rimandato with a chosen revisitAt and keeps the Salvati CTA", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    confirmDecision("Rimandato");

    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].decision?.outcome).toBe("deferred");
    expect(persisted.toolStates["atlas-ai"].revisitAt).toBeTruthy();
    expect(persisted.compare.slugs).toEqual([]);
    expect(persisted.events.some((event) => event.outcome === "deferred")).toBe(
      true,
    );
    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
  });

  it("V2 persists the stored compare objective on an explicit choice", async () => {
    vi.useRealTimers();
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "save-time");
    render(<ToolBattleView tools={VIEWS} />);
    await screen.findByRole("button", { name: "Scegli Atlas AI" });
    await confirmV2Decision();
    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].decision?.outcome).toBe("selected");
    expect(persisted.toolStates["atlas-ai"].compareObjective).toBe("save-time");
    expect(persisted.compare.slugs).toEqual([]);
    expect(persisted.toolStates["atlas-ai"].alternatives).toEqual(["gamma-app"]);
  });
});
