// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

function renderControl(floating = false) {
  return render(
    createElement(HeaderAccountControl, {
      linkClassName: "command-bar__account",
      menuClassName: "command-bar__account-menu",
      panelClassName: "command-bar__account-panel",
      floating,
    }),
  );
}

describe("HeaderAccountControl", () => {
  afterEach(() => {
    cleanup();
    accountState.status = "guest";
    accountState.authEnabled = true;
    vi.clearAllMocks();
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

  it("dismisses an open account menu on outside touch even when propagation is stopped", () => {
    accountState.status = "authenticated";
    const { container } = renderControl();
    const menu = container.querySelector("details")!;
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.addEventListener("pointerdown", (event) => event.stopPropagation());
    try {
      menu.open = true;
      fireEvent.pointerDown(menu.querySelector("div")!, { pointerType: "touch" });
      expect(menu.open).toBe(true);
      fireEvent.pointerDown(outside, { pointerType: "touch" });
      expect(menu.open).toBe(false);
      menu.open = true;
      fireEvent.pointerDown(outside, { pointerType: "touch" });
      expect(menu.open).toBe(false);
    } finally {
      outside.remove();
    }
  });

  it("dismisses with Escape and restores focus to the profile trigger", () => {
    accountState.status = "authenticated";
    const { container } = renderControl();
    const menu = container.querySelector("details")!;
    menu.open = true;
    screen.getByRole("link", { name: "Stack" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(menu.querySelector("summary"));
  });

  it("dismisses taps on the mobile pseudo-element backdrop", () => {
    accountState.status = "authenticated";
    const { container } = renderControl();
    const menu = container.querySelector("details")!;
    menu.open = true;
    fireEvent.pointerDown(menu, { pointerType: "touch" });
    expect(menu.open).toBe(false);
  });

  it("closes after selecting a workspace link or signing out", () => {
    accountState.status = "authenticated";
    const { container } = renderControl();
    const menu = container.querySelector("details")!;
    const link = screen.getByRole("link", { name: "Stack" });
    link.addEventListener("click", (event) => event.preventDefault());
    menu.open = true;
    fireEvent.click(link);
    expect(menu.open).toBe(false);
    menu.open = true;
    fireEvent.click(screen.getByRole("button", { name: "Esci" }));
    expect(menu.open).toBe(false);
    expect(accountState.signOut).toHaveBeenCalledOnce();
  });

  it("keeps the floating account disclosure accessible and restores focus after Escape", () => {
    accountState.status = "authenticated";
    renderControl(true);
    const trigger = screen.getByRole("button", { name: "Il tuo spazio" });
    fireEvent.click(trigger);
    const panel = screen.getByRole("region", { name: "Il tuo spazio" });
    expect(panel.id).toBe(trigger.getAttribute("aria-controls"));
    fireEvent.pointerDown(panel);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Il tuo spazio" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
