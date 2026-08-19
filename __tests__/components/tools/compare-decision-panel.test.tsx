// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
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

function revealDesktopResult() {
  fireEvent.click(screen.getByRole("button", { name: "Analizza il confronto" }));
  act(() => {
    vi.advanceTimersByTime(2000);
  });
}

function decisionRegion() {
  return screen.getByRole("region", { name: "Registra decisione" });
}

function decisionGroupFor(name: string) {
  return within(decisionRegion()).getByRole("group", {
    name: `Decisione per ${name}`,
  });
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
    "matchMedia",
    (query: string) => ({
      get matches() {
        return query === "(min-width: 1180px)" ? desktopViewport : false;
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => {
        if (query === "(min-width: 1180px)") viewportChangeListeners.add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => {
        if (query === "(min-width: 1180px)") viewportChangeListeners.delete(listener);
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

    // Ritorno a Shortlist: il link ai Salvati è parte dell'azione.
    const backLink = within(region).getByRole("link", {
      name: /Vai ai Salvati/,
    });
    expect(backLink.getAttribute("href")).toBe("/shortlist");

    // Choose: azione esplicita "Scegli" sul candidato.
    const group = decisionGroupFor("Atlas AI");
    fireEvent.click(within(group).getByRole("button", { name: "Scegli" }));

    let persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
    expect(
      persisted.toolStates["atlas-ai"].decision?.updatedAt,
    ).toBeTruthy();
    // Contract B16: la decisione aggiunge il tool ai salvati (scrittura additiva).
    expect(persisted.saved.slugs).toContain("atlas-ai");
    expect(
      within(group)
        .getByRole("button", { name: "Scegli" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(region.textContent).toContain("Scelto");
    expect(region.textContent).toContain("Registrata");

    // Motivazione: il focus si è spostato sul tool appena scelto.
    const textarea = screen.getByRole("textbox", {
      name: "Motivo della decisione per Atlas AI",
    }) as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: "Copre meglio i casi d'uso del team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salva motivo" }));

    persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].note).toBe(
      "Copre meglio i casi d'uso del team",
    );
    expect(
      screen.getByRole("button", { name: "Motivo salvato" }),
    ).toBeTruthy();
  });

  it("cambia esito e riapre la decisione (change/undo) lasciando il record versionato", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    const group = decisionGroupFor("Gamma");
    fireEvent.click(within(group).getByRole("button", { name: "Scegli" }));
    expect(readPersistedWorkspace().toolStates["gamma-app"].decision?.outcome).toBe(
      "selected",
    );

    // Change: stessa riga, nuovo esito.
    fireEvent.click(within(group).getByRole("button", { name: "Scarta" }));
    const changed = readPersistedWorkspace();
    expect(changed.toolStates["gamma-app"].decision?.outcome).toBe("rejected");
    expect(
      within(group)
        .getByRole("button", { name: "Scarta" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(group)
        .getByRole("button", { name: "Scegli" })
        .getAttribute("aria-pressed"),
    ).toBe("false");

    // Undo: reopen mantiene il record con timestamp (merge cross-device B32).
    fireEvent.click(
      screen.getByRole("button", { name: "Riapri decisione per Gamma" }),
    );
    const reopened = readPersistedWorkspace();
    expect(reopened.toolStates["gamma-app"].decision?.outcome).toBeNull();
    expect(
      reopened.toolStates["gamma-app"].decision?.updatedAt,
    ).toBeTruthy();
    for (const name of ["Scegli", "Scarta", "Rimanda"]) {
      expect(
        within(group).getByRole("button", { name }).getAttribute("aria-pressed"),
      ).toBe("false");
    }
    expect(
      screen.queryByRole("button", { name: "Riapri decisione per Gamma" }),
    ).toBeNull();
  });

  it("riapre il confronto dopo reload ritrovando decisione e motivo (riapribile con contesto)", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    fireEvent.click(
      within(decisionGroupFor("Atlas AI")).getByRole("button", {
        name: "Scegli",
      }),
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Motivo della decisione per Atlas AI",
      }),
      { target: { value: "Vince sul dettaglio" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Salva motivo" }));

    // Reload: nuovo mount, stesso storage durevole; il reveal va rifatto
    // perché lo stato teatrale dell'arena non è persistito (per design B33).
    cleanup();
    render(<MobileCompareView tools={VIEWS} />);
    expect(
      screen.queryByRole("region", { name: "Registra decisione" }),
    ).toBeNull();
    revealMobileResult();

    const group = decisionGroupFor("Atlas AI");
    expect(
      within(group)
        .getByRole("button", { name: "Scegli" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(decisionRegion().textContent).toContain("Scelto");

    // Il motivo salvato è precaricato sul tool deciso (focus automatico).
    const textarea = screen.getByRole("textbox", {
      name: "Motivo della decisione per Atlas AI",
    }) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Vince sul dettaglio");
  });

  it("isola la decisione per owner: guest e account non si contaminano", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    fireEvent.click(
      within(decisionGroupFor("Atlas AI")).getByRole("button", {
        name: "Scegli",
      }),
    );
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );

    // Login: stesso confronto seedato per l'account, nessuna decisione ereditata.
    // Lo switch owner è fuori da un evento DOM: act() flusha il re-render
    // dello snapshot (useSyncExternalStore) prima delle asserzioni.
    const account = { kind: "account" as const, userId: "user-b35" };
    act(() => {
      activateToolWorkspaceOwner(account, compareState("atlas-ai", "gamma-app"));
      dispatchWorkspaceChange({ source: "local", scope: "workspace" });
    });

    expect(
      within(decisionGroupFor("Atlas AI"))
        .getByRole("button", { name: "Scegli" })
        .getAttribute("aria-pressed"),
    ).toBe("false");

    fireEvent.click(
      within(decisionGroupFor("Gamma")).getByRole("button", {
        name: "Scarta",
      }),
    );
    const accountState = readPersistedWorkspace(
      workspaceStorageKeyForOwner(account),
    );
    expect(accountState.toolStates["gamma-app"].decision?.outcome).toBe(
      "rejected",
    );
    expect(
      accountState.toolStates["atlas-ai"]?.decision ?? null,
    ).toBeNull();

    // Logout verso guest: la decisione guest è intatta e riappare.
    act(() => {
      activateToolWorkspaceOwner({ kind: "guest" });
      dispatchWorkspaceChange({ source: "local", scope: "workspace" });
    });
    expect(
      within(decisionGroupFor("Atlas AI"))
        .getByRole("button", { name: "Scegli" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
  });

  it("deep link: il contesto della decisione dichiara l'obiettivo attivo", () => {
    window.history.replaceState(null, "", "/compare?objective=save-time");

    render(<ToolBattleView tools={VIEWS} />);
    revealMobileResult();

    const region = decisionRegion();
    expect(region.textContent).toContain("Confronto orientato a Risparmiare tempo");

    // La decisione registrata dal deep link persiste come qualsiasi altra.
    const group = within(region).getByRole("group", {
      name: "Decisione per Gamma",
    });
    fireEvent.click(within(group).getByRole("button", { name: "Scegli" }));
    expect(readPersistedWorkspace().toolStates["gamma-app"].decision?.outcome).toBe(
      "selected",
    );
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

  it("la decisione resta unica quando il viewport cambia superficie", () => {
    const { container } = render(<ToolBattleView tools={VIEWS} />);
    expect(container.querySelectorAll(".mobile-compare-arena")).toHaveLength(1);
    expect(container.querySelectorAll(".desktop-compare")).toHaveLength(0);

    revealMobileResult();
    fireEvent.click(
      within(decisionGroupFor("Atlas AI")).getByRole("button", { name: "Scegli" }),
    );

    setDesktopViewport(true);
    expect(container.querySelectorAll(".mobile-compare-arena")).toHaveLength(0);
    expect(container.querySelectorAll(".desktop-compare")).toHaveLength(1);

    revealDesktopResult();
    expect(screen.getAllByRole("region", { name: "Registra decisione" })).toHaveLength(1);
    expect(
      within(decisionGroupFor("Atlas AI"))
        .getByRole("button", { name: "Scegli" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(readPersistedWorkspace().toolStates["atlas-ai"].decision?.outcome).toBe(
      "selected",
    );
  });

  it("nessuna violazione axe sul confronto con pannello decisione", async () => {
    const { container } = render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();
    fireEvent.click(
      within(decisionGroupFor("Atlas AI")).getByRole("button", {
        name: "Scegli",
      }),
    );

    vi.useRealTimers();
    await expectNoAxeViolations(container);
  });

  it("writes Rimandato with a chosen revisitAt and keeps the Salvati CTA", () => {
    render(<MobileCompareView tools={VIEWS} />);
    revealMobileResult();

    const group = decisionGroupFor("Atlas AI");
    fireEvent.click(within(group).getByRole("button", { name: "Rimanda" }));
    fireEvent.click(screen.getByRole("button", { name: "1 settimana" }));

    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates["atlas-ai"].decision?.outcome).toBe("deferred");
    expect(persisted.toolStates["atlas-ai"].revisitAt).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Vai ai Salvati/ }).getAttribute("href"),
    ).toBe("/shortlist");
    expect(screen.getByText(/Rivedi:/)).toBeTruthy();
  });
});
