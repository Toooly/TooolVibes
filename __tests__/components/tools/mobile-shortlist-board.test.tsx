// @vitest-environment jsdom

import { createElement, Fragment, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { dispatchWorkspaceChange } from "@/lib/discovery/workspace-events";
import { markGuestWorkspaceOwner } from "@/lib/discovery/workspace-owner-storage";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  createEmptyWorkspaceState,
  reduceWorkspaceState,
} from "@/lib/discovery/workspace-state";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activateToolWorkspaceOwner } from "@/lib/stores/tool-workspace-store";
import type { ToolPublic } from "@/lib/types/tool-public";

/* Motion mock: strip animation internals so assertions are deterministic
   under jsdom (behavior under test is state, not animation frames). */
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

/* The wishlist form is outside B32 scope; keep the test hermetic. */
vi.mock("@/components/wishlist/request-tool-form", () => ({
  RequestToolForm: () => null,
}));

const T0 = "2026-07-17T10:00:00.000Z";

function makeTool(slug: string, name: string): ToolPublic {
  return {
    slug,
    name,
    urls: { website: "https://example.com", affiliate: null, editorial: null },
    taxonomy: {
      canonicalCategory: null,
      sourceCategory: "test",
      sourceCategoryLabel: "Test",
      tags: [],
    },
  } as unknown as ToolPublic;
}

const TOOLS = [
  makeTool("alpha", "Alpha"),
  makeTool("beta", "Beta"),
  makeTool("gamma", "Gamma"),
];

function savedState(...slugs: string[]): WorkspaceStateV1 {
  return slugs.reduce(
    (state, slug) =>
      reduceWorkspaceState(state, {
        type: "saved/set",
        slug,
        saved: true,
        at: T0,
      }),
    createEmptyWorkspaceState(),
  );
}

function seedWorkspace(state: WorkspaceStateV1) {
  window.localStorage.clear();
  expect(markGuestWorkspaceOwner(window.localStorage)).toBe(true);
  activateToolWorkspaceOwner({ kind: "guest" }, state);
  dispatchWorkspaceChange({ source: "local", scope: "workspace" });
}

function readPersistedWorkspace() {
  const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  expect(raw).toBeTruthy();
  return JSON.parse(raw as string) as WorkspaceStateV1;
}

function openSheetFor(name: string) {
  // The same tool can appear on multiple shelves (e.g. "Da provare" and
  // "Recenti"), so several books expose the same open affordance.
  fireEvent.click(
    screen.getAllByRole("button", {
      name: `Apri nota e decisione di ${name}`,
    })[0],
  );
  return screen.getByRole("dialog", {
    name: `Memoria decisionale di ${name}`,
  });
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
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
  seedWorkspace(savedState("alpha", "beta"));
});

afterEach(() => {
  cleanup();
  activateToolWorkspaceOwner({ kind: "guest" }, createEmptyWorkspaceState());
  window.localStorage.clear();
});

describe("MobileShortlistBoard — B32 editable decision memory", () => {
  it("keeps a page-level heading and named region in the empty state", () => {
    seedWorkspace(createEmptyWorkspaceState());
    render(<MobileShortlistBoard tools={TOOLS} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "La tua shortlist è pronta a riempirsi.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", {
        name: "La tua shortlist è pronta a riempirsi.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("3 tool in 1 categorie, ordinati per utilità reale.")).toBeTruthy();
  });

  it("renders only saved tools and opens the decision sheet from a book", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);

    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Gamma")).toBeNull();

    const dialog = openSheetFor("Alpha");
    expect(dialog).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Nota personale" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Decidi" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("group", { name: "Motivo del salvataggio" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Candidato" }),
    ).toBeTruthy();
  });

  it("opens the comparison workspace directly for compare-ready tools", () => {
    let state = savedState("alpha", "beta");
    state = reduceWorkspaceState(state, {
      type: "compare/toggle",
      slug: "alpha",
      at: T0,
    });
    state = reduceWorkspaceState(state, {
      type: "compare/toggle",
      slug: "beta",
      at: T0,
    });
    seedWorkspace(state);

    render(<MobileShortlistBoard tools={TOOLS} />);

    expect(
      screen
        .getByRole("link", { name: "Apri il confronto con 2 tool" })
        .getAttribute("href"),
    ).toBe("/compare");
  });

  it("edits and saves a note, persists it and re-opens it after a reload", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    const textarea = screen.getByRole("textbox", {
      name: "Nota personale",
    }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Nota B32 da test" } });
    fireEvent.click(screen.getByRole("button", { name: "Salva nota" }));

    expect(readPersistedWorkspace().toolStates.alpha.note).toBe(
      "Nota B32 da test",
    );
    expect(
      screen.getByRole("button", { name: "Nota salvata" }),
    ).toBeTruthy();

    // Reload: a fresh board re-opens the saved note from durable storage.
    cleanup();
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Nota personale",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Nota B32 da test");
  });

  it("clears an existing note when the draft is saved empty", () => {
    seedWorkspace(
      reduceWorkspaceState(savedState("alpha", "beta"), {
        type: "tool/note",
        slug: "alpha",
        note: "Vecchia nota",
        at: T0,
      }),
    );
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    const textarea = screen.getByRole("textbox", {
      name: "Nota personale",
    }) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Vecchia nota");

    fireEvent.change(textarea, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salva nota" }));

    expect(readPersistedWorkspace().toolStates.alpha.note).toBeNull();
  });

  it("caps long notes at 2000 chars and rejects longer drafts safely", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    const textarea = screen.getByRole("textbox", {
      name: "Nota personale",
    }) as HTMLTextAreaElement;
    expect(textarea.getAttribute("maxlength")).toBe("2000");

    // Even if the cap is bypassed, the canonical reducer refuses >2000 chars.
    fireEvent.change(textarea, { target: { value: "y".repeat(2001) } });
    fireEvent.click(screen.getByRole("button", { name: "Salva nota" }));

    expect(
      readPersistedWorkspace().toolStates.alpha ?? null,
    ).toBeNull();
  });

  it("changes the stage from the sheet and persists it", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    fireEvent.click(screen.getByRole("button", { name: "Candidato" }));

    expect(readPersistedWorkspace().toolStates.alpha.stage).toBe("top");
    expect(screen.getAllByText("Candidato").length).toBeGreaterThan(0);
  });

  it("records a decision outcome and reopens it", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    fireEvent.click(screen.getByRole("button", { name: "Decidi" }));
    const decision = document.querySelector("[data-decision-sheet]");
    expect(decision).toBeInstanceOf(HTMLElement);
    fireEvent.click(
      within(decision as HTMLElement).getByRole("button", { name: "Conferma" }),
    );

    expect(readPersistedWorkspace().toolStates.alpha.decision?.outcome).toBe(
      "selected",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Riapri decisione" }),
    );

    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates.alpha.decision?.outcome).toBeNull();
    expect(persisted.toolStates.alpha.decision?.updatedAt).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Riapri decisione" }),
    ).toBeNull();
  });

  it("toggles save reason and pin from the sheet", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    fireEvent.click(screen.getByRole("button", { name: "Da confrontare" }));
    expect(readPersistedWorkspace().toolStates.alpha.saveReason).toBe(
      "compare",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Metti in primo piano" }),
    );
    expect(readPersistedWorkspace().toolStates.alpha.pinned).toBe(true);
    expect(
      screen.getByRole("button", { name: "In primo piano" }),
    ).toBeTruthy();
  });

  it("closes the sheet with Escape (keyboard)", () => {
    render(<MobileShortlistBoard tools={TOOLS} />);
    openSheetFor("Alpha");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the legacy read-only sheet when the release flag is off", () => {
    seedWorkspace(
      reduceWorkspaceState(savedState("alpha", "beta"), {
        type: "tool/note",
        slug: "alpha",
        note: "Nota legacy",
        at: T0,
      }),
    );
    render(
      <MobileShortlistBoard tools={TOOLS} decisionMemoryEnabled={false} />,
    );
    openSheetFor("Alpha");

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Nota legacy")).toBeTruthy();
    expect(
      screen.queryByRole("group", { name: "Esito della decisione" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Salva nota" }),
    ).toBeNull();
  });
});

describe("MobileShortlistBoard — B35 decision view (FLOW-604)", () => {
  it("mostra le decisioni registrate con contesto e le riapre dalla vista", () => {
    seedWorkspace(
      reduceWorkspaceState(savedState("alpha", "beta"), {
        type: "tool/decision",
        slug: "alpha",
        outcome: "selected",
        at: "2026-07-18T09:00:00.000Z",
      }),
    );
    render(<MobileShortlistBoard tools={TOOLS} />);

    const section = screen.getByRole("region", {
      name: "Decisioni registrate",
    });
    expect(
      within(section).getByRole("button", { name: "Apri decisione di Alpha" }),
    ).toBeTruthy();
    expect(section.textContent).toContain("Scelto");
    expect(section.textContent).toContain("Registrata");
    // Beta non ha alcuna decisione: non compare nella decision view.
    expect(
      within(section).queryByRole("button", { name: "Apri decisione di Beta" }),
    ).toBeNull();

    // Riapertura rapida: outcome azzerato, record versionato, sezione vuota.
    fireEvent.click(
      within(section).getByRole("button", {
        name: "Riapri decisione di Alpha",
      }),
    );
    const persisted = readPersistedWorkspace();
    expect(persisted.toolStates.alpha.decision?.outcome).toBeNull();
    expect(persisted.toolStates.alpha.decision?.updatedAt).toBeTruthy();
    expect(
      screen.queryByRole("region", { name: "Decisioni registrate" }),
    ).toBeNull();
  });

  it("ordina la decision view per timestamp decrescente", () => {
    let state = savedState("alpha", "beta");
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "alpha",
      outcome: "selected",
      at: "2026-07-18T09:00:00.000Z",
    });
    state = reduceWorkspaceState(state, {
      type: "tool/decision",
      slug: "beta",
      outcome: "deferred",
      at: "2026-07-18T10:00:00.000Z",
    });
    seedWorkspace(state);
    render(<MobileShortlistBoard tools={TOOLS} />);

    const section = screen.getByRole("region", {
      name: "Decisioni registrate",
    });
    const openButtons = within(section).getAllByRole("button", {
      name: /^Apri decisione di /,
    });
    expect(openButtons[0].getAttribute("aria-label")).toBe(
      "Apri decisione di Beta",
    );
    expect(openButtons[1].getAttribute("aria-label")).toBe(
      "Apri decisione di Alpha",
    );
    expect(section.textContent).toContain("Rimandato");
  });

  it("apre lo sheet dalla decision view e dichiara il timestamp decisione anche senza nota", () => {
    // Regressione B35: con la sola decisione (nessuna nota/motivo/pin) la
    // memoria è vuota e prima il "Registrata" cadeva su "Nessun aggiornamento".
    seedWorkspace(
      reduceWorkspaceState(savedState("alpha", "beta"), {
        type: "tool/decision",
        slug: "alpha",
        outcome: "rejected",
        at: "2026-07-18T09:00:00.000Z",
      }),
    );
    render(<MobileShortlistBoard tools={TOOLS} />);

    const section = screen.getByRole("region", {
      name: "Decisioni registrate",
    });
    fireEvent.click(
      within(section).getByRole("button", { name: "Apri decisione di Alpha" }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Memoria decisionale di Alpha",
    });
    // La riga della decisione dichiara un timestamp reale (non il fallback
    // "Nessun aggiornamento locale", che resta legittimo per la nota mai salvata).
    expect(dialog.textContent).toMatch(/Registrata \d/);
    expect(dialog.textContent).toContain("Scartato");
    expect(dialog.textContent).toContain("Scartato");
    expect(within(dialog).getByRole("button", { name: "Decidi" })).toBeTruthy();
  });

  it("nasconde la decision view quando il flag decision memory è OFF", () => {
    seedWorkspace(
      reduceWorkspaceState(savedState("alpha", "beta"), {
        type: "tool/decision",
        slug: "alpha",
        outcome: "selected",
        at: "2026-07-18T09:00:00.000Z",
      }),
    );
    render(
      <MobileShortlistBoard tools={TOOLS} decisionMemoryEnabled={false} />,
    );

    expect(
      screen.queryByRole("region", { name: "Decisioni registrate" }),
    ).toBeNull();
  });

  it("mostra In uso after marking Lo sto usando from the sheet", () => {
    seedWorkspace(
      reduceWorkspaceState(savedState("alpha", "beta"), {
        type: "tool/decision",
        slug: "alpha",
        outcome: "selected",
        at: "2026-07-18T09:00:00.000Z",
      }),
    );
    render(<MobileShortlistBoard tools={TOOLS} />);

    const section = screen.getByRole("region", {
      name: "Decisioni registrate",
    });
    expect(section.textContent).toContain("Scelto");
    expect(section.textContent).not.toContain("In uso");

    fireEvent.click(
      within(section).getByRole("button", { name: "Apri decisione di Alpha" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Memoria decisionale di Alpha",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lo sto usando" }));

    expect(readPersistedWorkspace().toolStates.alpha.usage).toBe("using");
    expect(readPersistedWorkspace().toolStates.alpha.decision?.outcome).toBe(
      "selected",
    );
    expect(section.textContent).toContain("In uso");
    expect(dialog.textContent).toContain("In uso");
  });
});
