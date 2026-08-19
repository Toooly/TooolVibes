// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
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

import { AccountSettingsPage } from "@/components/account/account-settings-page";

describe("AccountSettingsPage — Wave 3 grouping", () => {
  beforeEach(() => {
    accountRuntime.value.status = "authenticated";
    accountRuntime.value.user = { email: "mario@example.com" };
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps existing settings under Profilo, Segnale, and Account", () => {
    render(createElement(AccountSettingsPage));

    expect(screen.getByRole("heading", { name: "Profilo" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Segnale" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Account" })).toBeTruthy();
    expect(screen.getByText("mario@example.com")).toBeTruthy();
    expect(screen.getByText("Focus")).toBeTruthy();
    expect(screen.getByText("Obiettivo")).toBeTruthy();
    expect(screen.getByText("Modalità silenziosa")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Esci dall'account" })).toBeTruthy();
  });
});
