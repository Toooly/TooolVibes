import { describe, expect, it } from "vitest";

import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";

import {
  getAccountStateLabel,
  getAuthMessageClassName,
  getAuthMessageTone,
  getContinuityCopy,
  getContinuityStatusLabel,
  getHeroBadgeLabel,
  getPersistenceLabel,
  readWorkspaceSnapshot,
  type AccountStateInput,
} from "@/components/account/panel/account-panel-model";

/* Fixture minima dello snapshot discovery locale. */
function makeSnapshot(
  overrides: Partial<DiscoveryLocalSnapshot> = {},
): DiscoveryLocalSnapshot {
  return {
    visitedTools: [],
    exploredCategories: [],
    shortlist: [],
    compare: [],
    shortlistStages: {},
    decisionMemories: {},
    toolStateMeta: {},
    compareMeta: {},
    ...overrides,
  };
}

function makeAccountState(
  overrides: Partial<AccountStateInput> = {},
): AccountStateInput {
  return {
    authEnabled: true,
    status: "guest",
    isAttaching: false,
    workspaceAttachPending: false,
    ...overrides,
  };
}

describe("readWorkspaceSnapshot", () => {
  it("conta saved, compare, stage, pinned e note come il monolite", () => {
    const snapshot = makeSnapshot({
      shortlist: ["alpha", "beta", "gamma", "delta"],
      compare: ["alpha", "beta"],
      shortlistStages: { alpha: "top", beta: "review", gamma: "saved" },
      decisionMemories: {
        alpha: { is_pinned: true, note: "da provare" },
        beta: { note: "  " },
        gamma: { note: "valido" },
      },
    });

    expect(readWorkspaceSnapshot(snapshot)).toEqual({
      saved: 4,
      compare: 2,
      top: 1,
      review: 1,
      pinned: 1,
      notes: 2,
    });
  });

  it("tratta lo stage mancante come 'saved' e ignora note vuote", () => {
    const snapshot = makeSnapshot({
      shortlist: ["alpha"],
      decisionMemories: { alpha: {} },
    });

    const result = readWorkspaceSnapshot(snapshot);
    expect(result.top).toBe(0);
    expect(result.review).toBe(0);
    expect(result.pinned).toBe(0);
    expect(result.notes).toBe(0);
  });
});

describe("getPersistenceLabel", () => {
  it("copre remote saving/error/synced e local", () => {
    expect(getPersistenceLabel({ mode: "remote", phase: "saving" })).toBe(
      "Salvataggio in corso",
    );
    expect(getPersistenceLabel({ mode: "remote", phase: "error" })).toBe(
      "Salvataggio non riuscito",
    );
    expect(getPersistenceLabel({ mode: "remote", phase: "synced" })).toBe(
      "Salvato online",
    );
    expect(getPersistenceLabel({ mode: "local", phase: "local-only" })).toBe(
      "Salvato su questo dispositivo",
    );
  });
});

describe("getAccountStateLabel / getHeroBadgeLabel / getContinuityStatusLabel", () => {
  it("mappa gli stati auth sulle label esistenti", () => {
    expect(getAccountStateLabel(makeAccountState({ status: "authenticated" }))).toBe(
      "Il tuo spazio",
    );
    expect(getAccountStateLabel(makeAccountState({ status: "loading" }))).toBe("Caricamento");
    expect(getAccountStateLabel(makeAccountState())).toBe("Accesso attivabile");
    expect(
      getAccountStateLabel(makeAccountState({ authEnabled: false, status: "unavailable" })),
    ).toBe("Continua senza account");
  });

  it("prioritizza attach e sync pending nel badge hero", () => {
    expect(
      getHeroBadgeLabel(makeAccountState({ status: "authenticated", isAttaching: true })),
    ).toBe("Collegamento in corso");
    expect(
      getHeroBadgeLabel(
        makeAccountState({ status: "authenticated", workspaceAttachPending: true }),
      ),
    ).toBe("Salvataggio in corso");
    expect(getHeroBadgeLabel(makeAccountState({ status: "authenticated" }))).toBe(
      "Il tuo spazio",
    );
  });

  it("mappa la continuità sui valori del pannello stato", () => {
    expect(getContinuityStatusLabel(makeAccountState({ isAttaching: true }))).toBe(
      "Collegamento in corso",
    );
    expect(getContinuityStatusLabel(makeAccountState({ workspaceAttachPending: true }))).toBe(
      "Su questo dispositivo",
    );
    expect(getContinuityStatusLabel(makeAccountState({ status: "authenticated" }))).toBe(
      "Salvato nel tuo spazio",
    );
    expect(getContinuityStatusLabel(makeAccountState())).toBe(
      "Continua senza account",
    );
  });
});

describe("getContinuityCopy", () => {
  it("restituisce il copy corretto per ogni stato di continuità", () => {
    expect(getContinuityCopy(makeAccountState({ isAttaching: true }))).toContain(
      "Stiamo collegando salvati, confronto e note",
    );
    expect(getContinuityCopy(makeAccountState({ workspaceAttachPending: true }))).toContain(
      "La sincronizzazione online è in attesa",
    );
    expect(getContinuityCopy(makeAccountState({ status: "authenticated" }))).toContain(
      "agganciata all'account",
    );
    expect(getContinuityCopy(makeAccountState())).toContain(
      "può essere collegata con una mail di conferma",
    );
    expect(
      getContinuityCopy(makeAccountState({ authEnabled: false, status: "unavailable" })),
    ).toContain("resta in questo browser finché l'accesso email non viene attivato");
  });
});

describe("auth message tone e classe", () => {
  it("classifica i messaggi di errore come warning", () => {
    const tone = getAuthMessageTone("Accesso email non disponibile in questo momento.");
    expect(tone.borderColor).toBe("rgba(161,105,47,0.18)");
    expect(getAuthMessageClassName("il salvataggio è in pausa")).toContain(
      "account-message--warning",
    );
    expect(getAuthMessageClassName("si è verificato un errore")).toContain(
      "account-message--warning",
    );
  });

  it("classifica i messaggi positivi come success", () => {
    const tone = getAuthMessageTone("Email di conferma inviata.");
    expect(tone.borderColor).toBe("rgba(15,118,110,0.18)");
    expect(getAuthMessageClassName("Selezione collegata all'account.")).toContain(
      "account-message--success",
    );
  });

  it("preserva la differenza originale: 'supera il limite' è warning solo nel tono", () => {
    const message = "La selezione locale supera il limite di sincronizzazione.";
    // Il tono inline include "supera il limite" tra le keyword warning...
    expect(getAuthMessageTone(message).borderColor).toBe("rgba(161,105,47,0.18)");
    // ...la classe CSS no (comportamento invariato dal monolite).
    expect(getAuthMessageClassName(message)).toContain("account-message--success");
  });
});
