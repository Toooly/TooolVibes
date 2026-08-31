// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const accountState = vi.hoisted(() => ({
  status: "guest" as "guest" | "authenticated" | "loading" | "unavailable",
  authEnabled: true,
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/account/account-provider", () => ({
  useAccount: () => ({
    authEnabled: accountState.authEnabled,
    status: accountState.status,
    isAttaching: false,
    workspaceAttachPending: false,
    user: accountState.status === "authenticated" ? { email: "a@b.c" } : null,
    signOut: accountState.signOut,
  }),
}));

import { HeaderAccountControl } from "@/components/layout/header-account-control";

function renderControl() {
  return render(
    createElement(HeaderAccountControl, {
      linkClassName: "command-bar__account",
      menuClassName: "command-bar__account-menu",
      panelClassName: "command-bar__account-panel",
    }),
  );
}

describe("HeaderAccountControl", () => {
  afterEach(() => {
    cleanup();
    accountState.status = "guest";
    accountState.authEnabled = true;
  });

  it("SHELL-01 guest Accedi does not replace the public chrome control", () => {
    accountState.status = "guest";
    renderControl();
    const link = screen.getByRole("link", { name: "Accedi" });
    expect(link.getAttribute("href")).toBe("/account#account-upgrade");
    expect(screen.queryByRole("button", { name: "Esci" })).toBeNull();
  });

  it("SHELL-10 auth adds workspace links without swapping the account control", () => {
    accountState.status = "authenticated";
    renderControl();
    expect(screen.getByRole("link", { name: "Il tuo spazio" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Il tuo spazio" }).getAttribute("href")).toBe(
      "/account?view=riprendi",
    );
    expect(screen.getByRole("link", { name: "Stack" }).getAttribute("href")).toBe(
      "/account?view=stack",
    );
    expect(screen.getByRole("link", { name: "Impostazioni" }).getAttribute("href")).toBe(
      "/account/settings",
    );
    expect(screen.getByRole("button", { name: "Esci" })).toBeTruthy();
  });
});
