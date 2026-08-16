// @vitest-environment jsdom

import { createElement } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-context";

/* ── Runtime mock controllabili dai singoli test ───────────────── */

const accountRuntime = vi.hoisted(() => ({
  value: null as unknown,
}));

const persistenceRuntime = vi.hoisted(() => ({
  value: { mode: "local", phase: "local-only" } as { mode: "local" | "remote"; phase: string },
}));

const discoveryRuntime = vi.hoisted(() => ({
  value: null as unknown,
}));

const catalogRuntime = vi.hoisted(() => ({
  value: [] as unknown[],
}));

const gamificationRuntime = vi.hoisted(() => ({
  summary: {
    hasRewardedSurface: false,
    firstRewardedSurface: null as string | null,
  },
  surfaces: {
    missions: { mode: "OFF", surfaceEnabled: false, persistentRewardsEnabled: false },
    vibeRush: { mode: "OFF", surfaceEnabled: false, persistentRewardsEnabled: false },
  },
  gameProfile: {
    profile: null as null | { xp: number; level: number; streak_days: number },
    isLoading: false,
  },
  badges: [] as Array<Record<string, never>>,
  localXp: 0,
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => accountRuntime.value,
}));

vi.mock("@/components/account/account-vibes-background", () => ({
  AccountVibesBackground: () => null,
}));

vi.mock("@/components/discovery/canonical-discovery-persistence-provider", () => ({
  useDiscoveryPersistence: () => persistenceRuntime.value,
}));

vi.mock("@/lib/discovery/client-store", () => ({
  useDiscoverySnapshot: () => discoveryRuntime.value,
}));

vi.mock("@/lib/data/public-tool-catalog-context", () => ({
  usePublicToolCatalog: () => catalogRuntime.value,
}));

vi.mock("@/lib/gamification/release-context", () => ({
  useGamificationReleaseSummary: () => gamificationRuntime.summary,
  useGamificationSurface: (key: "missions" | "vibeRush") =>
    gamificationRuntime.surfaces[key],
}));

vi.mock("@/lib/gamification/hooks/use-game-profile", () => ({
  useGameProfile: () => gamificationRuntime.gameProfile,
}));

vi.mock("@/lib/gamification/hooks/use-badges", () => ({
  useBadges: () => ({ badges: gamificationRuntime.badges }),
}));

vi.mock("@/lib/gamification/game-progress-store", () => ({
  useGameProgressStore: (selector: (state: { totalXp: number }) => unknown) =>
    selector({ totalXp: gamificationRuntime.localXp }),
}));

vi.mock("@/components/gamification/game-mission-panel", () => ({
  GameMissionPanel: () => null,
}));

vi.mock("@/components/gamification/game-profile-bar", () => ({
  GameProfileBar: () => null,
}));

vi.mock("@/components/gamification/vibe-tap-mini-game", () => ({
  VibeTapMiniGame: () => null,
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => createElement("span", null, String(value)),
}));

import { AccountPanel } from "@/components/account/account-panel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

/* ── Builder fixture ───────────────────────────────────────────── */

function makeAccount(overrides: Record<string, unknown> = {}) {
  return {
    authEnabled: true,
    status: "guest",
    user: null,
    session: null,
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
    restoreQuarantinedWorkspace: vi.fn().mockResolvedValue({ ok: true, message: "ok" }),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeDiscovery(
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

function makeTool(slug: string, name: string, categoryLabel: string) {
  return {
    slug,
    name,
    categoryLabel,
    shortDescription: `${name} in breve.`,
  } as unknown as PublicToolCatalogItem;
}

function setPanelState({
  account,
  discovery = makeDiscovery(),
  catalog = [] as PublicToolCatalogItem[],
}: {
  account: ReturnType<typeof makeAccount>;
  discovery?: DiscoveryLocalSnapshot;
  catalog?: PublicToolCatalogItem[];
}) {
  accountRuntime.value = account;
  discoveryRuntime.value = discovery;
  catalogRuntime.value = catalog;
}

function heroOf(container: HTMLElement) {
  return within(container.querySelector(".account-hero") as HTMLElement);
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  persistenceRuntime.value = { mode: "local", phase: "local-only" };
  gamificationRuntime.summary = { hasRewardedSurface: false, firstRewardedSurface: null };
  gamificationRuntime.surfaces = {
    missions: { mode: "OFF", surfaceEnabled: false, persistentRewardsEnabled: false },
    vibeRush: { mode: "OFF", surfaceEnabled: false, persistentRewardsEnabled: false },
  };
  gamificationRuntime.gameProfile = { profile: null, isLoading: false };
  gamificationRuntime.badges = [];
  gamificationRuntime.localXp = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => ({ toolRequests: [], affiliateRequests: [], remoteAvailable: true }),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

/* ── Guest ─────────────────────────────────────────────────────── */

describe("AccountPanel — stato guest", () => {
  it("mostra form magic link, badge e messaggi guest senza fetchare submission", () => {
    const account = makeAccount();
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    const hero = heroOf(container);
    expect(hero.getByText("Accesso attivabile")).toBeTruthy();
    expect(hero.getByText("Continua con email")).toBeTruthy();
    expect(hero.getByText("Salvato su questo dispositivo")).toBeTruthy();

    expect(screen.getByPlaceholderText("nome@email.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Invia link" })).toBeTruthy();
    expect(
      screen.getByText(
        "Accedi per vedere lo stato delle submission associate alla tua email.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Account connesso")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("invia la richiesta magic link e resetta i campi su esito positivo", async () => {
    const account = makeAccount();
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    fireEvent.change(screen.getByPlaceholderText("nome@email.com"), {
      target: { value: "mario@example.com" },
    });
    fireEvent.submit(container.querySelector("#account-upgrade") as HTMLFormElement);

    await waitFor(() => {
      expect(account.sendMagicLink).toHaveBeenCalledWith("mario@example.com", undefined);
    });
    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText("nome@email.com") as HTMLInputElement).value,
      ).toBe("");
    });
  });

  it("mostra lo stato di invio in corso con pulsante disabilitato", () => {
    const account = makeAccount({ isSendingLink: true });
    setPanelState({ account });
    render(<AccountPanel />);

    const button = screen.getByRole("button", { name: /Invio/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText("Invio...")).toBeTruthy();
  });

  it("senza auth disabilita il form e dichiara la sessione locale", () => {
    const account = makeAccount({ authEnabled: false, status: "unavailable" });
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    expect(heroOf(container).getAllByText("Continua senza account").length).toBeGreaterThan(0);
    const button = screen.getByRole("button", { name: "Invia link" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(
      screen.getByText("Accesso email non disponibile in questo momento."),
    ).toBeTruthy();
  });
});

/* ── Authenticated ─────────────────────────────────────────────── */

describe("AccountPanel — stato authenticated", () => {
  it("mostra account connesso, fetcha le submission e permette il sign out", async () => {
    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
    });
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        toolRequests: [
          {
            id: "t1",
            tool_name: "Tool Alpha",
            tool_url: "https://alpha.dev",
            submitter_type: "founder",
            status: "pending",
            created_at: "2026-07-01T10:00:00Z",
          },
        ],
        affiliateRequests: [
          {
            id: "a1",
            brand_name: "Brand Beta",
            status: "approved",
            referral_url: "https://ref.example.com",
            created_at: "2026-07-02T10:00:00Z",
          },
        ],
        remoteAvailable: true,
      }),
    } as Response);
    setPanelState({ account });
    render(<AccountPanel />);

    expect(screen.getByText("Spazio connesso")).toBeTruthy();
    expect(screen.getByText("Il tuo spazio")).toBeTruthy();
    expect(screen.queryByPlaceholderText("nome@email.com")).toBeNull();
    expect(screen.queryByText("Proposta founder")).toBeNull();
    expect(screen.queryByText("Gamification")).toBeNull();

    expect(fetch).not.toHaveBeenCalledWith("/api/account/submissions", {
      headers: { Authorization: "Bearer token-a" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Esci dall'account/ }));
    expect(account.signOut).toHaveBeenCalledTimes(1);
  });

  it("segnala la pausa sync quando la persistenza remota è in errore", async () => {
    persistenceRuntime.value = { mode: "remote", phase: "error" };
    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
    });
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    expect(heroOf(container).getByText("Salvataggio non riuscito")).toBeTruthy();
  });

  it("riflette attach in corso e sync in attesa su badge e continuità", () => {
    const attaching = makeAccount({ status: "authenticated", isAttaching: true });
    setPanelState({ account: attaching });
    const { container, unmount } = render(<AccountPanel />);
    expect(heroOf(container).getByText("Collegamento in corso")).toBeTruthy();
    unmount();

    const pending = makeAccount({
      status: "authenticated",
      workspaceAttachPending: true,
    });
    setPanelState({ account: pending });
    const { container: second } = render(<AccountPanel />);
    expect(heroOf(second).getByText("Salvataggio in corso")).toBeTruthy();
    expect(screen.getByText("Su questo dispositivo")).toBeTruthy();
  });
});

/* ── Messaggi auth e recovery ──────────────────────────────────── */

describe("AccountPanel — messaggi auth e recovery", () => {
  it("mostra il messaggio di errore con classe warning", () => {
    const account = makeAccount({
      authMessage: "Accesso email non disponibile in questo momento.",
    });
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    const message = container.querySelector(".account-message--warning");
    expect(message).not.toBeNull();
    expect(message?.textContent).toContain("Accesso email non disponibile");
  });

  it("mostra il messaggio positivo con classe success", async () => {
    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
      authMessage: "Selezione collegata all'account senza perdere ciò che avevi salvato.",
    });
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    const message = container.querySelector(".account-message--success");
    expect(message).not.toBeNull();
    expect(message?.textContent).toContain("Selezione collegata all'account");
  });

  it("mostra il backup in quarantena e invoca il ripristino", () => {
    const account = makeAccount({ hasQuarantinedWorkspace: true });
    setPanelState({ account });
    render(<AccountPanel />);

    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Backup locale isolato")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Ripristina nello spazio corrente/ }),
    );
    expect(account.restoreQuarantinedWorkspace).toHaveBeenCalledTimes(1);
  });

  it("disabilita il ripristino mentre è in corso", () => {
    const account = makeAccount({
      hasQuarantinedWorkspace: true,
      isRestoringQuarantinedWorkspace: true,
    });
    setPanelState({ account });
    render(<AccountPanel />);

    const button = screen.getByRole("button", {
      name: /Ripristino in corso/,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});

/* ── Riepilogo workspace e sezioni ─────────────────────────────── */

describe("AccountPanel — riepilogo workspace e sezioni", () => {
  it("deriva conteggi, card salvati e consigliati da discovery snapshot e catalogo", () => {
    const account = makeAccount();
    setPanelState({
      account,
      discovery: makeDiscovery({
        shortlist: ["alpha"],
        compare: ["alpha", "beta"],
        shortlistStages: { alpha: "top" },
        decisionMemories: { alpha: { is_pinned: true, note: "nota alpha" } },
      }),
      catalog: [
        makeTool("alpha", "Alpha", "Vibe coding"),
        makeTool("beta", "Beta", "Vibe coding"),
        makeTool("gamma", "Gamma", "Design"),
      ],
    });
    const { container } = render(<AccountPanel />);

    const hero = heroOf(container);
    expect(hero.getByText(/tool salvati/).textContent).toContain("1");
    expect(hero.getByText(/nel confronto/).textContent).toContain("2");

    // Card salvata con dati dal catalogo e stage/pin dalla memoria.
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText(/Priorita alta/)).toBeTruthy();
    expect(screen.getByText("nota alpha")).toBeTruthy();

    // Consigliati: stessa categoria dei salvati, esclusi quelli già in shortlist.
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.queryByText("Gamma")).toBeNull();

    // CTA e preferenze riflettono i conteggi reali.
    expect(screen.getByText("Apri salvati (1)")).toBeTruthy();
    expect(screen.getByText("1 segnali dai tool salvati")).toBeTruthy();
    expect(screen.getByText("Richiede login")).toBeTruthy();
  });

  it("mostra lo stato vuoto della selezione senza tool salvati", () => {
    const account = makeAccount();
    setPanelState({ account });
    render(<AccountPanel />);

    expect(
      screen.getByText(/Nessun tool salvato ancora/),
    ).toBeTruthy();
    expect(screen.getByText("Inizia dal catalogo")).toBeTruthy();
    expect(screen.getByText("Da costruire")).toBeTruthy();
  });
});

/* ── Gamification ──────────────────────────────────────────────── */

describe("AccountPanel — gamification", () => {
  it("non renderizza il blocco quando nessuna surface è rewarded", () => {
    const account = makeAccount();
    setPanelState({ account });
    render(<AccountPanel />);

    expect(screen.queryByText("Gamification")).toBeNull();
    expect(screen.queryByText("Progressi e attivita")).toBeNull();
  });

  it("renderizza statistiche di gioco e best locale quando rewarded", async () => {
    window.localStorage.setItem("tooolvibes:vibe-rush-best", "42");
    gamificationRuntime.summary = {
      hasRewardedSurface: true,
      firstRewardedSurface: "missions",
    };
    gamificationRuntime.gameProfile = {
      profile: { xp: 250, level: 3, streak_days: 5 },
      isLoading: false,
    };
    gamificationRuntime.badges = [{}, {}];
    gamificationRuntime.localXp = 100;

    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
    });
    setPanelState({ account });
    render(<AccountPanel />);

    expect(screen.queryByText("Gamification")).toBeNull();
    expect(screen.getByText("Il tuo spazio")).toBeTruthy();
    expect(screen.getByText("Impostazioni")).toBeTruthy();
  });
});

/* ── Vibe Rush signup ──────────────────────────────────────────── */

describe("AccountPanel — signup Vibe Rush", () => {
  it("legge il contesto URL, precompila la mail e invia i metadata della partita", async () => {
    window.history.replaceState(
      {},
      "",
      "/account?source=vibe-rush&email=mario%40example.com&vibes=12&xp=340",
    );
    const account = makeAccount();
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    expect(screen.getByText("Salva Vibe Rush")).toBeTruthy();
    // Sottotitolo e riepilogo partita riportano entrambi il punteggio.
    expect(screen.getAllByText(/12 vibe raccolti, 340 XP/).length).toBe(2);

    const emailInput = (await waitFor(() => {
      const input = screen.getByPlaceholderText("nome@email.com") as HTMLInputElement;
      expect(input.value).toBe("mario@example.com");
      return input;
    })) as HTMLInputElement;

    fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Mario" } });
    fireEvent.change(screen.getByPlaceholderText("Cognome"), { target: { value: "Rossi" } });
    fireEvent.submit(container.querySelector("#account-upgrade") as HTMLFormElement);

    await waitFor(() => {
      expect(account.sendMagicLink).toHaveBeenCalledWith("mario@example.com", {
        source: "vibe-rush",
        first_name: "Mario",
        last_name: "Rossi",
        phone: null,
        vibe_score: 12,
        vibe_xp: 340,
      });
    });
    await waitFor(() => {
      expect(emailInput.value).toBe("");
    });
  });
});
