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
      await screen.findByRole("button", { name: "Continua con GitHub" }),
    ).toBeTruthy();
    const labels = screen.getAllByRole("button").map((button) => button.textContent);
    expect(labels).toEqual(["Continua con GitHub", "Continua con Apple"]);
    expect(screen.queryByRole("button", { name: "Continua con Google" })).toBeNull();
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
