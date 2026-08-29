/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExperienceLoadMore } from "@/components/community/experience-load-more";

const pageTwo = {
  id: "22222222-2222-4222-8222-222222222222",
  toolSlug: "blink",
  displayName: "Marta",
  useCase: "No-code",
  body: "Used this tool daily for client landing pages and kept coming back when the stack already had a builder.",
  pros: ["Fast preview cycle"],
  limits: ["Weak collaboration"],
  durationBucket: "months_1_3",
  switchedFromSlug: null,
  switchedFromLabel: null,
  publishedAt: "2026-08-29T12:00:00.000Z",
  updatedAt: "2026-08-29T12:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ExperienceLoadMore", () => {
  it("H4-PAGE-02 appends the next page and hides at the end", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ experiences: [pageTwo], nextCursor: null }),
      }),
    );
    render(
      <ExperienceLoadMore
        toolSlug="blink"
        initialCursor="cursor-1"
        catalogNames={{ blink: "Blink" }}
        initialIds={["11111111-1111-4111-8111-111111111111"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mostra altre esperienze" }));
    await waitFor(() => {
      expect(screen.getByText("Marta")).toBeTruthy();
    });
    expect(screen.queryByRole("button", { name: "Mostra altre esperienze" })).toBeNull();
  });

  it("H4-PAGE-03 dedupes repeated ids", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          experiences: [
            { ...pageTwo, id: "11111111-1111-4111-8111-111111111111", displayName: "Dup" },
          ],
          nextCursor: null,
        }),
      }),
    );
    render(
      <ExperienceLoadMore
        toolSlug="blink"
        initialCursor="cursor-1"
        catalogNames={{}}
        initialIds={["11111111-1111-4111-8111-111111111111"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mostra altre esperienze" }));
    await waitFor(() => {
      expect(screen.queryByText("Dup")).toBeNull();
    });
  });

  it("H4-PAGE-05 keeps first page on error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    render(
      <ExperienceLoadMore
        toolSlug="blink"
        initialCursor="cursor-1"
        catalogNames={{}}
        initialIds={["keep"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mostra altre esperienze" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/Non siamo riusciti/);
    });
    expect(screen.getByRole("button", { name: "Mostra altre esperienze" })).toBeTruthy();
  });
});
