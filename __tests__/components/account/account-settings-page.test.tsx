// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const accountRuntime = vi.hoisted(() => ({
  value: {
    authEnabled: true,
    status: "authenticated",
    user: { email: "mario@example.com" },
    session: { access_token: "token-a" },
    isSendingLink: false,
    isAttaching: false,
    workspaceAttachPending: false,
    hasQuarantinedWorkspace: false,
    isRestoringQuarantinedWorkspace: false,
    authMessage: null,
    sendMagicLink: vi.fn(),
    restoreQuarantinedWorkspace: vi.fn(),
    signOut: vi.fn(),
  },
}));

const workspaceRuntime = vi.hoisted(() => ({
  clearWorkspace: vi.fn(),
  state: {
    schemaVersion: 1 as const,
    clearedAt: null,
    saved: { slugs: ["cursor"], updatedAt: "2026-08-20T09:30:00.000Z" },
    compare: { slugs: [], updatedAt: null },
    stack: { slugs: [], updatedAt: null },
    personalStacks: [],
    toolStates: { cursor: { stage: "saved" } },
  },
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => accountRuntime.value,
}));

vi.mock("@/components/account/workspace/account-workspace-frame", () => ({
  AccountWorkspaceFrame: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/account/auth-page", () => ({
  AuthPage: () => null,
}));

vi.mock("@/components/account/panel/use-account-submissions", () => ({
  useAccountSubmissions: () => ({
    submissions: null,
    isLoading: false,
    totalSubmissions: 0,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/signal-progression/client", () => ({
  fetchSignalHub: vi.fn().mockResolvedValue(null),
  saveSignalPreferences: vi.fn().mockResolvedValue(true),
  saveSignalProfileContext: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/stores/tool-workspace-store", () => ({
  getCanonicalToolWorkspaceState: () => workspaceRuntime.state,
  useToolWorkspaceStore: (
    selector: (state: { clearWorkspace: () => void }) => unknown,
  ) => selector({ clearWorkspace: workspaceRuntime.clearWorkspace }),
}));

vi.mock("@/lib/account/workspace-export", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account/workspace-export")>(
    "@/lib/account/workspace-export",
  );
  return {
    ...actual,
    downloadWorkspaceExportJson: vi.fn(),
  };
});

import { AccountSettingsPage } from "@/components/account/account-settings-page";

describe("AccountSettingsPage — account center", () => {
  beforeEach(() => {
    accountRuntime.value.status = "authenticated";
    accountRuntime.value.user = { email: "mario@example.com" };
    workspaceRuntime.clearWorkspace.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not reset the workspace without RESET confirmation", () => {
    render(createElement(AccountSettingsPage));

    const resetButton = screen.getByRole("button", { name: "Svuota lo spazio" });
    expect(resetButton).toHaveProperty("disabled", true);

    fireEvent.click(resetButton);
    expect(workspaceRuntime.clearWorkspace).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Scrivi RESET per confermare"), {
      target: { value: "reset" },
    });
    expect(resetButton).toHaveProperty("disabled", true);
    fireEvent.click(resetButton);
    expect(workspaceRuntime.clearWorkspace).not.toHaveBeenCalled();
  });

  it("resets the workspace only after typing RESET", () => {
    render(createElement(AccountSettingsPage));

    const resetButton = screen.getByRole("button", { name: "Svuota lo spazio" });
    fireEvent.change(screen.getByLabelText("Scrivi RESET per confermare"), {
      target: { value: "RESET" },
    });
    expect(resetButton).toHaveProperty("disabled", false);

    fireEvent.click(resetButton);
    expect(workspaceRuntime.clearWorkspace).toHaveBeenCalledTimes(1);
  });
});
