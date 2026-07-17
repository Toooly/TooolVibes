// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccountSubmissions } from "@/components/account/panel/use-account-submissions";
import type { AccountSubmissionsPayload } from "@/components/account/panel/account-panel-model";

function payload(
  overrides: Partial<AccountSubmissionsPayload> = {},
): AccountSubmissionsPayload {
  return {
    toolRequests: [],
    affiliateRequests: [],
    remoteAvailable: true,
    ...overrides,
  };
}

function jsonResponse(body: unknown) {
  return { json: async () => body } as Response;
}

describe("useAccountSubmissions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("non fetcha e resta null quando la sessione non è autenticata", () => {
    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "guest", accessToken: undefined }),
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.submissions).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalSubmissions).toBe(0);
  });

  it("recupera le submission con bearer token e ne deriva il totale", async () => {
    const body = payload({
      toolRequests: [
        {
          id: "t1",
          tool_name: "Alpha",
          tool_url: "https://alpha.dev",
          status: "pending",
          created_at: "2026-07-01T10:00:00Z",
        },
        {
          id: "t2",
          tool_name: "Beta",
          tool_url: "https://beta.dev",
          submitter_type: "founder",
          status: "approved",
          created_at: "2026-07-02T10:00:00Z",
        },
      ],
      affiliateRequests: [
        {
          id: "a1",
          brand_name: "Gamma",
          status: "pending",
          referral_url: "https://ref.example.com",
          created_at: "2026-07-03T10:00:00Z",
        },
      ],
    });
    vi.mocked(fetch).mockResolvedValue(jsonResponse(body));

    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "authenticated", accessToken: "token-a" }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith("/api/account/submissions", {
      headers: { Authorization: "Bearer token-a" },
    });
    expect(result.current.submissions?.toolRequests).toHaveLength(2);
    expect(result.current.submissions?.affiliateRequests).toHaveLength(1);
    expect(result.current.totalSubmissions).toBe(3);
  });

  it("usa il fallback remoteAvailable=false quando la fetch fallisce", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() =>
      useAccountSubmissions({ status: "authenticated", accessToken: "token-a" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.submissions).toEqual({
      toolRequests: [],
      affiliateRequests: [],
      remoteAvailable: false,
    });
    expect(result.current.totalSubmissions).toBe(0);
  });

  it("resetta le submission quando la sessione torna guest", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        payload({
          toolRequests: [
            {
              id: "t1",
              tool_name: "Alpha",
              tool_url: "https://alpha.dev",
              status: "pending",
              created_at: "2026-07-01T10:00:00Z",
            },
          ],
        }),
      ),
    );

    const { result, rerender } = renderHook(
      ({ status, accessToken }: { status: "guest" | "authenticated"; accessToken?: string }) =>
        useAccountSubmissions({ status, accessToken }),
      {
        initialProps: { status: "authenticated", accessToken: "token-a" } as {
          status: "guest" | "authenticated";
          accessToken?: string;
        },
      },
    );

    await waitFor(() => {
      expect(result.current.submissions?.toolRequests).toHaveLength(1);
    });

    act(() => {
      rerender({ status: "guest", accessToken: undefined });
    });

    expect(result.current.submissions).toBeNull();
    expect(result.current.totalSubmissions).toBe(0);
  });
});
