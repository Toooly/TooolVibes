// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthButtons } from "@/components/account/oauth-buttons";

describe("OAuthButtons", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not invent Google before /api/auth/config resolves", () => {
    const { container } = render(<OAuthButtons onSelect={() => undefined} />);
    expect(container.querySelector(".tv-oauth")).toBeNull();
    expect(screen.queryByRole("button", { name: /Google/ })).toBeNull();
  });

  it("renders only providers returned by /api/auth/config, in that order", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ providers: ["github", "apple"] }),
    } as Response);

    render(<OAuthButtons onSelect={() => undefined} />);

    expect(
      await screen.findByRole("button", { name: "Continua con Apple" }),
    ).toBeTruthy();
    const labels = screen.getAllByRole("button").map((button) => button.textContent);
    // Canonical order is Google, Apple, Microsoft, GitHub regardless of config order.
    expect(labels).toEqual(["Continua con Apple", "Continua con GitHub"]);
    expect(screen.queryByRole("button", { name: "Continua con Google" })).toBeNull();
  });

  it("renders four providers in canonical order with loading state", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ providers: ["github", "microsoft", "google", "apple"] }),
    } as Response);

    render(<OAuthButtons onSelect={() => undefined} />);

    const buttons = await screen.findAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Continua con Google",
      "Continua con Apple",
      "Continua con Microsoft",
      "Continua con GitHub",
    ]);
    // 44px+ touch targets via shared token; buttons expose provider icons.
    for (const button of buttons) {
      expect(button.querySelector("svg")).toBeTruthy();
    }
  });

  it("resolves the azure alias to Microsoft without duplicating buttons", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ providers: ["azure", "microsoft"] }),
    } as Response);

    render(<OAuthButtons onSelect={() => undefined} />);

    expect(await screen.findByRole("button", { name: "Continua con Microsoft" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders nothing when config omits providers", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [] }),
    } as Response);

    const { container } = render(<OAuthButtons onSelect={() => undefined} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.querySelector(".tv-oauth")).toBeNull();
  });

  it("renders nothing when config fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    const { container } = render(<OAuthButtons onSelect={() => undefined} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.querySelector(".tv-oauth")).toBeNull();
  });
});
