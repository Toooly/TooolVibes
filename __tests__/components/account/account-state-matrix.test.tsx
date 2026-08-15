// @vitest-environment jsdom

import { createElement, forwardRef, Fragment, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-context";

import {
  classifySubmissionsHttpStatus,
  isAttachDegradedMessage,
  isAttachSuccessMessage,
  resolveAccountStateCell,
  resolveSubmissionsErrorCell,
  shouldRenderAccountStateBanner,
  type AccountStateMatrixInput,
} from "@/components/account/panel/account-state-matrix";
import { isAccountStateMatrixEnabled } from "@/components/account/panel/account-state-flags";
import { useAccountOnlineStatus } from "@/components/account/panel/use-account-online-status";
import { useAccountSubmissions } from "@/components/account/panel/use-account-submissions";
import { AccountStateBanner } from "@/components/account/panel/account-state-banner";

/* ═══════════════════════════════════════════════════════════════
   B59 / STATE-1002 — state matrix /account.
   Matrice: guest, magic-link pending, authenticated, loading,
   error, offline, attach success/retry. Regola d'oro: nessuna
   cella promette sync non avvenuta (data-sync-claim="synced" solo
   su attach riuscito).
   ═══════════════════════════════════════════════════════════════ */

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const ENV_FLAG = "NEXT_PUBLIC_TOOOLVIBES_ACCOUNT_STATE_MATRIX";

function matrixInput(
  overrides: Partial<AccountStateMatrixInput> = {},
): AccountStateMatrixInput {
  return {
    status: "guest",
    authEnabled: true,
    isOnline: true,
    isAttaching: false,
    workspaceAttachPending: false,
    pendingLinkEmail: null,
    authMessage: null,
    ...overrides,
  };
}

function stubOffline() {
  Object.defineProperty(window.navigator, "onLine", {
    value: false,
    configurable: true,
  });
}

function restoreOnline() {
  // Ripristina il getter del prototype rimuovendo lo shadow sull'istanza.
  Reflect.deleteProperty(window.navigator, "onLine");
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  restoreOnline();
  delete process.env[ENV_FLAG];
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

/* ── Modello puro: resolveAccountStateCell ─────────────────────── */

describe("B59 resolveAccountStateCell — matrice stati account", () => {
  it("offline ha precedenza su ogni altro stato e dichiara local-only", () => {
    const cell = resolveAccountStateCell(
      matrixInput({
        isOnline: false,
        status: "authenticated",
        isAttaching: true,
      }),
    );
    expect(cell.kind).toBe("offline");
    expect(cell.tone).toBe("warning");
    expect(cell.syncClaim).toBe("local-only");
    expect(cell.action).toBeNull();
    expect(shouldRenderAccountStateBanner(cell)).toBe(true);
  });

  it("loading: cella informativa senza claim di sync, non resa come banner", () => {
    const cell = resolveAccountStateCell(matrixInput({ status: "loading" }));
    expect(cell.kind).toBe("loading");
    expect(cell.syncClaim).toBe("none");
    expect(shouldRenderAccountStateBanner(cell)).toBe(false);
  });

  it("unavailable: auth disabilitato o status unavailable, recovery onesta", () => {
    for (const input of [
      matrixInput({ status: "unavailable", authEnabled: false }),
      matrixInput({ status: "guest", authEnabled: false }),
    ]) {
      const cell = resolveAccountStateCell(input);
      expect(cell.kind).toBe("unavailable");
      expect(cell.syncClaim).toBe("local-only");
      expect(cell.body).toContain("non viene sincronizzata");
      expect(shouldRenderAccountStateBanner(cell)).toBe(true);
    }
  });

  it("guest di default: non richiede attenzione, nessun banner", () => {
    const cell = resolveAccountStateCell(matrixInput());
    expect(cell.kind).toBe("guest");
    expect(cell.syncClaim).toBe("local-only");
    expect(shouldRenderAccountStateBanner(cell)).toBe(false);
  });

  it("link-pending: guest con invio riuscito ha cella distinta con resend", () => {
    const cell = resolveAccountStateCell(
      matrixInput({ pendingLinkEmail: "mario@example.com" }),
    );
    expect(cell.kind).toBe("link-pending");
    expect(cell.title).toContain("mario@example.com");
    expect(cell.action).toEqual({ id: "resend-link", label: "Invia di nuovo il link" });
    // Non promette il collegamento prima della conferma email.
    expect(cell.body).toContain("solo dopo la conferma");
    expect(cell.syncClaim).toBe("local-only");
    expect(shouldRenderAccountStateBanner(cell)).toBe(true);
  });

  it("attach-in-progress: esiste nella matrice ma resta ai badge esistenti", () => {
    const cell = resolveAccountStateCell(
      matrixInput({ status: "authenticated", isAttaching: true }),
    );
    expect(cell.kind).toBe("attach-in-progress");
    expect(cell.syncClaim).toBe("local-only");
    expect(shouldRenderAccountStateBanner(cell)).toBe(false);
  });

  it("attach-retry: messaggio degrado del provider, warning, nessuna sync promessa", () => {
    const message =
      "Account collegato, ma il salvataggio online non è disponibile: la selezione resta al sicuro su questo browser.";
    const cell = resolveAccountStateCell(
      matrixInput({ status: "authenticated", authMessage: message }),
    );
    expect(cell.kind).toBe("attach-retry");
    expect(cell.tone).toBe("warning");
    expect(cell.body).toBe(message);
    expect(cell.syncClaim).toBe("local-only");
    expect(shouldRenderAccountStateBanner(cell)).toBe(true);
  });

  it("attach-retry anche per pausa temporanea e limite capacità", () => {
    const pausa = resolveAccountStateCell(
      matrixInput({
        status: "authenticated",
        authMessage: "Account collegato, ma il salvataggio della selezione è temporaneamente in pausa.",
      }),
    );
    expect(pausa.kind).toBe("attach-retry");

    const capacita = resolveAccountStateCell(
      matrixInput({
        status: "authenticated",
        authMessage:
          "La selezione locale supera il limite di sincronizzazione. Riduci salvati, stack o note non più utili: il collegamento ripartirà automaticamente e nessun dato verrà cancellato.",
      }),
    );
    expect(capacita.kind).toBe("attach-retry");
    expect(capacita.syncClaim).toBe("local-only");
  });

  it("attach-success: unica cella che può dichiarare synced", () => {
    const message = "Selezione collegata all'account senza perdere ciò che avevi salvato.";
    const cell = resolveAccountStateCell(
      matrixInput({ status: "authenticated", authMessage: message }),
    );
    expect(cell.kind).toBe("attach-success");
    expect(cell.tone).toBe("success");
    expect(cell.syncClaim).toBe("synced");
    expect(shouldRenderAccountStateBanner(cell)).toBe(true);
  });

  it("attach-local-pending: workspace in attesa senza messaggio", () => {
    const cell = resolveAccountStateCell(
      matrixInput({ status: "authenticated", workspaceAttachPending: true }),
    );
    expect(cell.kind).toBe("attach-local-pending");
    expect(cell.body).toContain("salvataggio online riprenderà automaticamente");
    expect(cell.syncClaim).toBe("local-only");
    expect(shouldRenderAccountStateBanner(cell)).toBe(true);
  });

  it("authenticated senza esiti: cella neutra non resa come banner", () => {
    const cell = resolveAccountStateCell(matrixInput({ status: "authenticated" }));
    expect(cell.kind).toBe("authenticated");
    expect(cell.syncClaim).toBe("none");
    expect(shouldRenderAccountStateBanner(cell)).toBe(false);
  });

  it("keyword helper: degrado e successo non si sovrappongono", () => {
    expect(
      isAttachDegradedMessage("Account collegato, ma il salvataggio online non è disponibile."),
    ).toBe(true);
    expect(isAttachSuccessMessage("Selezione collegata all'account senza perdere ciò che avevi salvato.")).toBe(true);
    expect(
      isAttachSuccessMessage("Account collegato, ma il salvataggio online non è disponibile."),
    ).toBe(false);
  });
});

/* ── Modello puro: errori submission ───────────────────────────── */

describe("B59 classifySubmissionsHttpStatus — 401/429/500/offline", () => {
  it("mappa status e rete sulle celle canoniche", () => {
    expect(classifySubmissionsHttpStatus(401, false)).toBe("unauthorized");
    expect(classifySubmissionsHttpStatus(403, false)).toBe("unauthorized");
    expect(classifySubmissionsHttpStatus(429, false)).toBe("rate-limited");
    expect(classifySubmissionsHttpStatus(500, false)).toBe("server");
    expect(classifySubmissionsHttpStatus(503, false)).toBe("server");
    expect(classifySubmissionsHttpStatus(400, false)).toBe("unavailable");
    expect(classifySubmissionsHttpStatus(undefined, false)).toBe("unavailable");
    expect(classifySubmissionsHttpStatus(undefined, true)).toBe("offline");
    // Offline vince anche su uno status noto.
    expect(classifySubmissionsHttpStatus(500, true)).toBe("offline");
  });

  it("ogni cella errore ha titolo, corpo onesto e retry esplicito", () => {
    for (const kind of ["unauthorized", "rate-limited", "server", "offline", "unavailable"] as const) {
      const cell = resolveSubmissionsErrorCell(kind);
      expect(cell.title.length).toBeGreaterThan(0);
      expect(cell.retryLabel.length).toBeGreaterThan(0);
      // Mai promettere dati caricati o sincronizzati quando fallisce.
      expect(cell.body).not.toContain("sincronizzat");
    }
  });
});

/* ── Feature flag ──────────────────────────────────────────────── */

describe("B59 account state matrix — feature flag", () => {
  it("default ON senza env; kill switch con valori off", () => {
    expect(isAccountStateMatrixEnabled()).toBe(true);
    process.env[ENV_FLAG] = "1";
    expect(isAccountStateMatrixEnabled()).toBe(true);
    process.env[ENV_FLAG] = "0";
    expect(isAccountStateMatrixEnabled()).toBe(false);
    process.env[ENV_FLAG] = "false";
    expect(isAccountStateMatrixEnabled()).toBe(false);
    process.env[ENV_FLAG] = "off";
    expect(isAccountStateMatrixEnabled()).toBe(false);
  });
});

/* ── Hook online status ────────────────────────────────────────── */

describe("B59 useAccountOnlineStatus", () => {
  it("default online, riflette navigator.onLine e gli eventi", () => {
    const { result } = renderHook(() => useAccountOnlineStatus());
    expect(result.current).toBe(true);

    stubOffline();
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    restoreOnline();
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("legge navigator.onLine=false già al mount", () => {
    stubOffline();
    const { result } = renderHook(() => useAccountOnlineStatus());
    expect(result.current).toBe(false);
  });
});

/* ── Hook submissions: error + reload ──────────────────────────── */

describe("B59 useAccountSubmissions — esiti 401/429/500/offline e retry", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("401: errore unauthorized e fallback remoto non disponibile", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);
    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "authenticated", accessToken: "token-a" }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("unauthorized");
    expect(result.current.submissions?.remoteAvailable).toBe(false);
    expect(result.current.totalSubmissions).toBe(0);
  });

  it("429: errore rate-limited", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response);
    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "authenticated", accessToken: "token-a" }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("rate-limited");
  });

  it("500 poi reload: retry esplicito riporta i dati e azzera l'errore", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          toolRequests: [
            {
              id: "t1",
              tool_name: "Alpha",
              tool_url: "https://alpha.dev",
              status: "pending",
              created_at: "2026-07-01T10:00:00Z",
            },
          ],
          affiliateRequests: [],
          remoteAvailable: true,
        }),
      } as Response);

    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "authenticated", accessToken: "token-a" }),
    );
    await waitFor(() => expect(result.current.error).toBe("server"));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.totalSubmissions).toBe(1));
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("fetch rifiutata offline: errore offline", async () => {
    stubOffline();
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "authenticated", accessToken: "token-a" }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("offline");
  });

  it("guest: nessuna fetch, nessun errore", () => {
    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "guest", accessToken: undefined }),
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});

/* ── Banner presentazionale ────────────────────────────────────── */

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("B59 AccountStateBanner", () => {
  it("espone kind e sync claim come contract dati e invia l'azione", () => {
    const cell = resolveAccountStateCell(
      matrixInput({ pendingLinkEmail: "mario@example.com" }),
    );
    const onAction = vi.fn();
    const { container } = render(
      <AccountStateBanner cell={cell} onAction={onAction} />,
    );
    const banner = container.querySelector("[data-account-state='link-pending']");
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("data-sync-claim")).toBe("local-only");
    expect(banner?.getAttribute("role")).toBe("status");

    fireEvent.click(screen.getByRole("button", { name: /Invia di nuovo il link/ }));
    expect(onAction).toHaveBeenCalledWith("resend-link");
  });

  it("variante auth usa le classi v-auth e nessuna violazione axe", async () => {
    const cell = resolveAccountStateCell(matrixInput({ isOnline: false }));
    const { container } = render(
      <AccountStateBanner variant="auth" cell={cell} />,
    );
    expect(container.querySelector(".v-auth-message--error")).not.toBeNull();
    await expectNoAxeViolations(container);
  });

  it("toni warning/success su tutte le celle rese, axe pulito", async () => {
    const cells = [
      resolveAccountStateCell(matrixInput({ isOnline: false })),
      resolveAccountStateCell(matrixInput({ pendingLinkEmail: "a@b.c" })),
      resolveAccountStateCell(
        matrixInput({
          status: "authenticated",
          authMessage: "Selezione collegata all'account senza perdere ciò che avevi salvato.",
        }),
      ),
      resolveAccountStateCell(
        matrixInput({
          status: "authenticated",
          authMessage: "Account collegato, ma il salvataggio online non è disponibile: la selezione resta al sicuro su questo browser.",
        }),
      ),
    ];
    const { container } = render(
      createElement(
        "div",
        null,
        ...cells.map((cell, index) =>
          createElement(AccountStateBanner, { key: index, cell }),
        ),
      ),
    );
    expect(container.querySelectorAll("[role='status']").length).toBe(cells.length);
    await expectNoAxeViolations(container);
  });
});

/* ═══════════════════════════════════════════════════════════════
   Integrazione AccountPanel — mock canonici come
   account-panel.test.tsx (B27), fetch stubbato per submission.
   ═══════════════════════════════════════════════════════════════ */

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

function setPanelState(account: ReturnType<typeof makeAccount>) {
  accountRuntime.value = account;
  discoveryRuntime.value = makeDiscovery();
  catalogRuntime.value = [] as PublicToolCatalogItem[];
}

function submissionsOkResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      toolRequests: [],
      affiliateRequests: [],
      remoteAvailable: true,
    }),
  } as Response;
}

describe("B59 AccountPanel — state matrix integration", () => {
  beforeEach(() => {
    persistenceRuntime.value = { mode: "local", phase: "local-only" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(submissionsOkResponse()));
  });

  it("offline: banner esplicito local-only sopra l'hero", () => {
    stubOffline();
    setPanelState(makeAccount());
    const { container } = render(<AccountPanel />);

    const banner = container.querySelector("[data-account-state='offline']");
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("data-sync-claim")).toBe("local-only");
    expect(banner?.textContent).toContain("Sei offline");
    expect(banner?.textContent).toContain("resta salvata su questo browser");
    // Nessuna promessa di sync mentre offline.
    expect(banner?.getAttribute("data-sync-claim")).not.toBe("synced");
  });

  it("tornando online il banner sparisce", async () => {
    stubOffline();
    setPanelState(makeAccount());
    const { container } = render(<AccountPanel />);
    expect(container.querySelector("[data-account-state='offline']")).not.toBeNull();

    restoreOnline();
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => {
      expect(container.querySelector("[data-account-state='offline']")).toBeNull();
    });
  });

  it("auth non disponibile: cella unavailable distinta", () => {
    setPanelState(makeAccount({ authEnabled: false, status: "unavailable" }));
    const { container } = render(<AccountPanel />);

    const banner = container.querySelector("[data-account-state='unavailable']");
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Accesso email non disponibile");
  });

  it("link pending: invio riuscito mostra cella con resend distinto", async () => {
    const account = makeAccount();
    setPanelState(account);
    const { container } = render(<AccountPanel />);

    fireEvent.change(screen.getByPlaceholderText("nome@email.com"), {
      target: { value: "mario@example.com" },
    });
    fireEvent.submit(container.querySelector("#account-upgrade") as HTMLFormElement);

    await waitFor(() => {
      expect(
        container.querySelector("[data-account-state='link-pending']"),
      ).not.toBeNull();
    });
    const banner = container.querySelector("[data-account-state='link-pending']");
    expect(banner?.textContent).toContain("mario@example.com");

    fireEvent.click(screen.getByRole("button", { name: /Invia di nuovo il link/ }));
    await waitFor(() => {
      expect(account.sendMagicLink).toHaveBeenCalledTimes(2);
    });
    expect(account.sendMagicLink).toHaveBeenLastCalledWith("mario@example.com", undefined);
  });

  it("attach retry: cella warning distinta senza duplicare il messaggio grezzo", async () => {
    const message =
      "Account collegato, ma il salvataggio online non è disponibile: la selezione resta al sicuro su questo browser.";
    setPanelState(
      makeAccount({
        status: "authenticated",
        user: { email: "mario@example.com" },
        session: { access_token: "token-a" },
        authMessage: message,
      }),
    );
    const { container } = render(<AccountPanel />);

    const banner = container.querySelector("[data-account-state='attach-retry']");
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("data-sync-claim")).toBe("local-only");
    expect(banner?.textContent).toContain("Salvataggio online non disponibile");
    // Il messaggio compare una sola volta (banner), non duplicato nella recovery.
    const occurrences = screen.getAllByText(message);
    expect(occurrences).toHaveLength(1);
    await waitFor(() => {
      expect(screen.getByText(/Nessuna submission collegata/)).toBeTruthy();
    });
  });

  it("attach success: unica cella che dichiara synced, senza duplicati", async () => {
    const message = "Selezione collegata all'account senza perdere ciò che avevi salvato.";
    setPanelState(
      makeAccount({
        status: "authenticated",
        user: { email: "mario@example.com" },
        session: { access_token: "token-a" },
        authMessage: message,
      }),
    );
    const { container } = render(<AccountPanel />);

    const banner = container.querySelector("[data-account-state='attach-success']");
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("data-sync-claim")).toBe("synced");
    expect(banner?.textContent).toContain("Selezione collegata");
    expect(screen.getAllByText(message)).toHaveLength(1);
    await waitFor(() => {
      expect(screen.getByText(/Nessuna submission collegata/)).toBeTruthy();
    });
  });

  it("submission 500: cella errore esplicita con retry che rifà la fetch", async () => {
    vi.mocked(fetch)
      .mockReset()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce(submissionsOkResponse());
    setPanelState(
      makeAccount({
        status: "authenticated",
        user: { email: "mario@example.com" },
        session: { access_token: "token-a" },
      }),
    );
    const { container } = render(<AccountPanel />);

    await waitFor(() => {
      expect(container.querySelector("[data-submissions-error='server']")).not.toBeNull();
    });
    const card = container.querySelector("[data-submissions-error='server']");
    expect(card?.textContent).toContain("Servizio submission non disponibile");
    // Niente stato vuoto ingannevole durante l'errore.
    expect(screen.queryByText(/Nessuna submission collegata/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await waitFor(() => {
      expect(container.querySelector("[data-submissions-error]")).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByText(/Nessuna submission collegata/)).toBeTruthy();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("submission 429: cella rate-limited con copy attesa", async () => {
    vi.mocked(fetch).mockReset().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response);
    setPanelState(
      makeAccount({
        status: "authenticated",
        user: { email: "mario@example.com" },
        session: { access_token: "token-a" },
      }),
    );
    const { container } = render(<AccountPanel />);

    await waitFor(() => {
      expect(container.querySelector("[data-submissions-error='rate-limited']")).not.toBeNull();
    });
    expect(screen.getByText("Troppe richieste")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Riprova tra poco" })).toBeTruthy();
  });

  it("submission 401: cella unauthorized", async () => {
    vi.mocked(fetch).mockReset().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);
    setPanelState(
      makeAccount({
        status: "authenticated",
        user: { email: "mario@example.com" },
        session: { access_token: "token-a" },
      }),
    );
    const { container } = render(<AccountPanel />);

    await waitFor(() => {
      expect(container.querySelector("[data-submissions-error='unauthorized']")).not.toBeNull();
    });
    expect(screen.getByText("Sessione non riconosciuta")).toBeTruthy();
  });

  it("flag OFF: nessun banner e submission torna al silent fallback B27", async () => {
    process.env[ENV_FLAG] = "0";
    stubOffline();
    vi.mocked(fetch).mockReset().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);
    setPanelState(
      makeAccount({
        status: "authenticated",
        user: { email: "mario@example.com" },
        session: { access_token: "token-a" },
      }),
    );
    const { container } = render(<AccountPanel />);

    expect(container.querySelector("[data-account-state]")).toBeNull();
    await waitFor(() => {
      expect(screen.getByText(/Nessuna submission collegata/)).toBeTruthy();
    });
    expect(container.querySelector("[data-submissions-error]")).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Integrazione AuthPage — guest / magic-link pending / offline.
   Mock motion come auth-page-keyboard.test.tsx (B39).
   ═══════════════════════════════════════════════════════════════ */

vi.mock("motion/react", () => {
  const MOTION_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "layoutId",
    "whileHover",
    "whileTap",
  ]);
  const create = (tag: string) => {
    type StubProps = {
      children?: ReactNode;
      [key: string]: unknown;
    };
    const MotionStub = forwardRef<HTMLElement, StubProps>((props, ref) => {
      const { children, ...rest } = props;
      const domProps = Object.fromEntries(
        Object.entries(rest).filter(([key]) => !MOTION_PROPS.has(key)),
      );
      return createElement(tag, { ref, ...domProps }, children as ReactNode);
    });
    MotionStub.displayName = `MotionStub(${tag})`;
    return MotionStub;
  };
  return {
    motion: { div: create("div"), span: create("span") },
    AnimatePresence: ({ children }: { children?: ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

import { AuthPage } from "@/components/account/auth-page";

describe("B59 AuthPage — magic link pending / error / offline", () => {
  it("invio riuscito: cella link-pending sostituisce il messaggio grezzo", async () => {
    const account = makeAccount({
      sendMagicLink: vi.fn().mockResolvedValue({
        ok: true,
        message: "Email di conferma inviata a mario@example.com.",
      }),
      authMessage: "Email di conferma inviata a mario@example.com.",
    });
    accountRuntime.value = account;
    const { container } = render(<AuthPage />);

    fireEvent.change(screen.getByPlaceholderText("nome@email.com"), {
      target: { value: "mario@example.com" },
    });
    fireEvent.submit(container.querySelector("form.v-auth-form") as HTMLFormElement);

    await waitFor(() => {
      expect(
        container.querySelector("[data-account-state='link-pending']"),
      ).not.toBeNull();
    });
    const banner = container.querySelector("[data-account-state='link-pending']");
    expect(banner?.textContent).toContain("mario@example.com");
    expect(banner?.getAttribute("data-sync-claim")).toBe("local-only");
    // Il messaggio success grezzo non viene duplicato sotto il banner.
    expect(screen.queryByText("Email di conferma inviata a mario@example.com.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Invia di nuovo il link/ }));
    await waitFor(() => {
      expect(account.sendMagicLink).toHaveBeenCalledTimes(2);
    });
    expect(account.sendMagicLink).toHaveBeenLastCalledWith("mario@example.com", undefined);
  });

  it("invio fallito (429): nessuna cella pending, messaggio errore visibile", async () => {
    const account = makeAccount({
      sendMagicLink: vi.fn().mockResolvedValue({
        ok: false,
        message: "Troppe richieste. Riprova tra poco.",
      }),
      authMessage: "Troppe richieste. Riprova tra poco.",
    });
    accountRuntime.value = account;
    const { container } = render(<AuthPage />);

    fireEvent.change(screen.getByPlaceholderText("nome@email.com"), {
      target: { value: "mario@example.com" },
    });
    fireEvent.submit(container.querySelector("form.v-auth-form") as HTMLFormElement);

    await waitFor(() => {
      expect(account.sendMagicLink).toHaveBeenCalledTimes(1);
    });
    expect(container.querySelector("[data-account-state='link-pending']")).toBeNull();
    expect(screen.getByText("Troppe richieste. Riprova tra poco.")).toBeTruthy();
  });

  it("offline: cella dedicata anche sulla superficie auth", () => {
    stubOffline();
    accountRuntime.value = makeAccount();
    const { container } = render(<AuthPage />);

    const banner = container.querySelector("[data-account-state='offline']");
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Sei offline");
    expect(container.querySelector(".v-auth-message--error")).not.toBeNull();
  });

  it("flag OFF: nessuna cella sulla superficie auth", () => {
    process.env[ENV_FLAG] = "0";
    stubOffline();
    accountRuntime.value = makeAccount();
    const { container } = render(<AuthPage />);
    expect(container.querySelector("[data-account-state]")).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════
   Auth callback — link pending (verifica) ed expired/invalid con
   recovery esplicita verso /account (B59, STATE-1002).
   ═══════════════════════════════════════════════════════════════ */

const callbackRuntime = vi.hoisted(() => ({
  replace: vi.fn(),
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  setSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: callbackRuntime.replace }),
}));

vi.mock("@/lib/supabase/browser-client", () => ({
  isSupabaseBrowserEnabled: () => true,
  loadBrowserSupabaseRuntimeConfig: vi.fn().mockResolvedValue(undefined),
  getBrowserSupabaseClient: () => ({
    auth: {
      verifyOtp: callbackRuntime.verifyOtp,
      exchangeCodeForSession: callbackRuntime.exchangeCodeForSession,
      setSession: callbackRuntime.setSession,
      getSession: callbackRuntime.getSession,
    },
  }),
}));

import AuthCallbackPage from "@/app/auth/callback/page";

describe("B59 auth callback — link pending ed expired", () => {
  beforeEach(() => {
    callbackRuntime.replace.mockReset();
    callbackRuntime.verifyOtp.mockReset();
    callbackRuntime.exchangeCodeForSession.mockReset();
    callbackRuntime.setSession.mockReset();
    callbackRuntime.getSession.mockReset();
  });

  it("pending: mostra lo stato di verifica senza recovery prematura", async () => {
    callbackRuntime.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
    });
    window.history.replaceState({}, "", "/auth/callback");
    render(<AuthCallbackPage />);

    expect(screen.getByText("Sto collegando il tuo accesso...")).toBeTruthy();
    expect(screen.queryByText("Richiedi un nuovo link")).toBeNull();

    await waitFor(() => {
      expect(callbackRuntime.replace).toHaveBeenCalledWith("/account?connected=1");
    });
  });

  it("expired/invalid: messaggio onesto e recovery esplicita verso /account", async () => {
    callbackRuntime.verifyOtp.mockResolvedValue({ error: new Error("otp expired") });
    window.history.replaceState({}, "", "/auth/callback?token_hash=hash&type=email");
    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Non sono riuscito a verificare il link. Apri l'ultima email ricevuta o richiedine una nuova.",
        ),
      ).toBeTruthy();
    });
    const recovery = screen.getByText("Richiedi un nuovo link").closest("a");
    expect(recovery).not.toBeNull();
    expect(recovery?.getAttribute("href")).toBe("/account");
    expect(callbackRuntime.replace).not.toHaveBeenCalled();
  });

  it("code exchange fallito: link scaduto con recovery esplicita", async () => {
    callbackRuntime.exchangeCodeForSession.mockResolvedValue({
      error: new Error("code expired"),
    });
    window.history.replaceState({}, "", "/auth/callback?code=abc");
    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Non siamo riusciti a completare il collegamento. Il link potrebbe essere scaduto o già usato.",
        ),
      ).toBeTruthy();
    });
    expect(screen.getByText("Richiedi un nuovo link")).toBeTruthy();
  });
});
