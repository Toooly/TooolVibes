// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DiscoveryLocalSnapshot } from "@/lib/discovery/local-storage";
import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-context";

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

const navigationRuntime = vi.hoisted(() => ({
  pathname: "/account",
  search: "",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationRuntime.pathname,
  useSearchParams: () => new URLSearchParams(navigationRuntime.search),
  useRouter: () => ({ push: navigationRuntime.push }),
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => accountRuntime.value,
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

vi.mock("@/lib/radar/use-product-hunt-radar", () => ({
  useProductHuntRadar: () => ({
    payload: undefined,
    isLoading: false,
    isFetching: false,
  }),
}));


import { AccountPanel } from "@/components/account/account-panel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

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

beforeEach(() => {
  navigationRuntime.pathname = "/account";
  navigationRuntime.search = "";
  navigationRuntime.push.mockReset();
  window.history.replaceState({}, "", "/");
  persistenceRuntime.value = { mode: "local", phase: "local-only" };
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

describe("AccountPanel — stato guest", () => {
  it("does not mount the retired guest workspace panel", () => {
    const account = makeAccount();
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    expect(container.querySelector(".account-hero")).toBeNull();
    expect(screen.queryByPlaceholderText("nome@email.com")).toBeNull();
    expect(screen.queryByRole("button", { name: "Invia link" })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("AccountPanel — stato authenticated", () => {
  it("mostra lo spazio autenticato senza chrome Decisioni/Recenti/Segnale", async () => {
    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
    });
    setPanelState({ account });
    render(<AccountPanel />);

    expect(document.querySelector(".tv-app")).toBeTruthy();
    expect(document.querySelector(".tv-app--loop")).toBeTruthy();
    expect(screen.getByText("Il tuo spazio è pronto")).toBeTruthy();
    expect(screen.queryByPlaceholderText("nome@email.com")).toBeNull();
    expect(screen.queryByText("Gamification")).toBeNull();
    expect(screen.getByRole("link", { name: "Decisioni" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Recenti" })).toBeNull();
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
    expect(document.querySelector(".tv-app__sidebar")).toBeNull();

    expect(fetch).not.toHaveBeenCalledWith("/api/account/submissions", {
      headers: { Authorization: "Bearer token-a" },
    });
  });

  it("riflette attach in corso sul banner, non sul HUD", () => {
    const pending = makeAccount({
      status: "authenticated",
      workspaceAttachPending: true,
    });
    setPanelState({ account: pending });
    render(<AccountPanel />);
    expect(screen.getAllByText("Salvataggio in corso").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Stato del toolbox")).toBeNull();
  });
});

describe("AccountPanel — messaggi auth e recovery", () => {
  it("mostra il messaggio positivo nella cella attach-success", () => {
    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
      authMessage: "Selezione collegata all'account senza perdere ciò che avevi salvato.",
    });
    setPanelState({ account });
    const { container } = render(<AccountPanel />);

    const banner = container.querySelector("[data-account-state='attach-success']");
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("Selezione collegata all'account");
  });

  it("mostra il backup in quarantena e invoca il ripristino", () => {
    const account = makeAccount({
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
      hasQuarantinedWorkspace: true,
    });
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
      status: "authenticated",
      user: { email: "mario@example.com" },
      session: { access_token: "token-a" },
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
