// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { COMPARE_OBJECTIVE_STORAGE_KEY } from "@/lib/compare/compare-objective";
import { CompareObjectiveSelector } from "@/components/tools/compare-objective-selector";
import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { useCompareObjective } from "@/lib/hooks/use-compare-objective";
import {
  completeToolPublicFixture,
} from "@/__tests__/fixtures/tool-public";
import {
  normalise,
  withBattleScores,
  withObjectiveScores,
} from "@/components/tools/tool-battle-shared";
import { createToolPublicView } from "@/lib/data/tool-public-view";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import { markGuestWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import type { ToolPublic } from "@/lib/types/tool-public";

/* Motion mock: strip animation internals so assertions are deterministic
   under jsdom (same pattern as the B32 shortlist board test). */
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

const VIEWS = [createToolPublicView(completeToolPublicFixture), createToolPublicView(gamma)];

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

function ObjectiveHarness() {
  const { objective, setObjective } = useCompareObjective();
  return (
    <CompareObjectiveSelector
      objective={objective}
      onObjectiveChange={setObjective}
      idPrefix="test"
    />
  );
}

function objectiveScoreOf(slug: string, objective: "save-time" | null) {
  const base = withBattleScores(normalise(VIEWS, ["atlas-ai", "gamma-app"]));
  const scored = withObjectiveScores(base, objective);
  const tool = scored.find((entry) => entry.slug === slug);
  return tool?.objectiveScore ?? tool?.battleScore;
}

/**
 * axe runs on rendered fragments, not on full pages (same rationale as
 * core-primitives.test): jsdom cannot compute real color contrast, and
 * landmark top-level rules assume a complete document outline — the
 * compare fragment legitimately nests the scoreboard <aside> inside the
 * compare <section>, and the structural compare layout is out of scope
 * here (B43).
 */
async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
      "landmark-complementary-is-top-level": { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

function expectRadioChecked(radio: HTMLElement, expected: boolean) {
  expect((radio as HTMLInputElement).checked).toBe(expected);
}

let desktopViewport = false;
const viewportChangeListeners = new Set<() => void>();

function setDesktopViewport(matches: boolean) {
  desktopViewport = matches;
  act(() => {
    viewportChangeListeners.forEach((listener) => listener());
  });
}

beforeAll(() => {
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
  window.localStorage.clear();
  window.history.replaceState(null, "", "/compare");
});

afterEach(() => {
  cleanup();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  window.localStorage.clear();
  window.history.replaceState(null, "", "/compare");
});

describe("CompareObjectiveSelector (B34)", () => {
  it("espone un gruppo radio accessibile con tutte le opzioni e il neutro", () => {
    render(
      <CompareObjectiveSelector objective={null} onObjectiveChange={() => {}} idPrefix="a11y" />,
    );

    const group = screen.getByRole("group", { name: "Obiettivo del confronto" });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(8);

    expectRadioChecked(within(group).getByRole("radio", { name: "Neutro" }), true);
    expectRadioChecked(
      within(group).getByRole("radio", { name: "Risparmiare tempo" }),
      false,
    );

    expect(group.textContent).toContain("Nessun punteggio aggiuntivo");
  });

  it("la selezione notifica il cambio verso un obiettivo e verso il neutro", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <CompareObjectiveSelector objective={null} onObjectiveChange={onChange} idPrefix="pick" />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Risparmiare tempo" }));
    expect(onChange).toHaveBeenLastCalledWith("save-time");
    unmount();

    // Un radio già selezionato non ri-emette change: il ritorno al neutro
    // si verifica partendo da un obiettivo attivo.
    render(
      <CompareObjectiveSelector
        objective="save-time"
        onObjectiveChange={onChange}
        idPrefix="pick-neutral"
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Neutro" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("con obiettivo attivo chiarisce che la priorità non crea un vincitore", () => {
    render(
      <CompareObjectiveSelector
        objective="save-time"
        onObjectiveChange={() => {}}
        idPrefix="explain"
      />,
    );

    const group = screen.getByRole("group", { name: "Obiettivo del confronto" });
    expect(group.textContent).toContain("Risparmiare tempo");
    expect(group.textContent).toContain("non assegna un vincitore automatico");
  });
});

describe("useCompareObjective — persistenza (B34)", () => {
  it("persiste la scelta e la ripristina dopo reload", () => {
    const first = render(<ObjectiveHarness />);
    fireEvent.click(screen.getByRole("radio", { name: "Imparare velocemente" }));
    expect(window.localStorage.getItem(COMPARE_OBJECTIVE_STORAGE_KEY)).toBe("learn-fast");
    first.unmount();

    render(<ObjectiveHarness />);
    expectRadioChecked(screen.getByRole("radio", { name: "Imparare velocemente" }), true);

    // Tornare al neutro rimuove il valore persistito.
    fireEvent.click(screen.getByRole("radio", { name: "Neutro" }));
    expect(window.localStorage.getItem(COMPARE_OBJECTIVE_STORAGE_KEY)).toBeNull();
  });

  it("il deep link ?objective= vince sullo storage e viene persistito", () => {
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "quality");
    window.history.replaceState(null, "", "/compare?objective=learn-fast");

    render(<ObjectiveHarness />);
    expectRadioChecked(screen.getByRole("radio", { name: "Imparare velocemente" }), true);
    expect(window.localStorage.getItem(COMPARE_OBJECTIVE_STORAGE_KEY)).toBe("learn-fast");
  });

  it("valori persistiti non validi ricadono sul neutro senza rompere", () => {
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "not-an-objective");

    render(<ObjectiveHarness />);
    expectRadioChecked(screen.getByRole("radio", { name: "Neutro" }), true);
  });
});

describe("ToolBattleView — viewport esclusivo e flag (B34)", () => {
  beforeEach(() => {
    seedWorkspace(compareState("atlas-ai", "gamma-app"));
  });

  it("obiettivo persistito: stesso stato e stessa lettura dopo il cambio viewport", () => {
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "save-time");

    const { container } = render(<ToolBattleView tools={VIEWS} />);

    expect(container.querySelectorAll(".mobile-compare-arena")).toHaveLength(1);
    expect(container.querySelectorAll(".desktop-compare")).toHaveLength(0);
    expectRadioChecked(screen.getByRole("radio", { name: "Risparmiare tempo" }), true);

    const expected = objectiveScoreOf("gamma-app", "save-time");
    expect(expected).toBe(objectiveScoreOf("gamma-app", null));
    expect(screen.getAllByText("Gamma").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Valutazione editoriale in preparazione").length).toBeGreaterThanOrEqual(1);

    setDesktopViewport(true);

    expect(container.querySelectorAll(".mobile-compare-arena")).toHaveLength(0);
    expect(container.querySelectorAll(".desktop-compare")).toHaveLength(1);
    expectRadioChecked(screen.getByRole("radio", { name: "Risparmiare tempo" }), true);
    expect(screen.getAllByText("Valutazione editoriale in preparazione").length).toBeGreaterThanOrEqual(1);
  });

  it("la priorità resta una guida senza delta numerici", () => {
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "save-time");

    render(<ToolBattleView tools={VIEWS} />);

    expect(screen.queryByText(/\+\d+ obiettivo/)).toBeNull();
    expect(screen.getAllByText(/non assegna un vincitore automatico/i).length).toBeGreaterThanOrEqual(1);
  });

  it("cambio obiettivo sopravvive allo swap tra superfici", () => {
    render(<ToolBattleView tools={VIEWS} />);

    fireEvent.click(screen.getByRole("radio", { name: "Collaborare" }));
    expectRadioChecked(screen.getByRole("radio", { name: "Collaborare" }), true);

    setDesktopViewport(true);

    expect(screen.getAllByRole("radio", { name: "Collaborare" })).toHaveLength(1);
    expectRadioChecked(screen.getByRole("radio", { name: "Collaborare" }), true);
    expect(window.localStorage.getItem(COMPARE_OBJECTIVE_STORAGE_KEY)).toBe("collaborate");
  });

  it("flag OFF: nessun selettore e nessun delta anche con obiettivo persistito", () => {
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "save-time");

    render(<ToolBattleView tools={VIEWS} objectiveEnabled={false} />);

    expect(screen.queryByRole("group", { name: "Obiettivo del confronto" })).toBeNull();
    expect(screen.queryByText(/\+\d+ obiettivo/)).toBeNull();

    expect(screen.getAllByText("Valutazione editoriale in preparazione").length).toBeGreaterThanOrEqual(1);
  });

  it("nessuna violazione axe sul confronto con selettore obiettivo", async () => {
    window.localStorage.setItem(COMPARE_OBJECTIVE_STORAGE_KEY, "save-time");

    const { container } = render(<ToolBattleView tools={VIEWS} />);
    await expectNoAxeViolations(container);
  });
});
