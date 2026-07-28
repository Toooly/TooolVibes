export const fixedProductHuntUpdatedAt = "2026-01-15T10:00:00.000Z";

export const productHuntItems = [
  {
    id: "fixture-1",
    name: "Fixture Canvas",
    tagline: "A deterministic launch used only by the E2E harness.",
    votesCount: 420,
    commentsCount: 32,
    productHuntUrl: "https://www.producthunt.com/posts/fixture-canvas",
  },
  {
    id: "fixture-2",
    name: "Stable Signal",
    tagline: "Repeatable data for smoke and visual regression tests.",
    votesCount: 318,
    commentsCount: 21,
    productHuntUrl: "https://www.producthunt.com/posts/stable-signal",
  },
  {
    id: "fixture-3",
    name: "Release Lens",
    tagline: "A fixed third item that keeps ranking layout stable.",
    votesCount: 207,
    commentsCount: 14,
    productHuntUrl: "https://www.producthunt.com/posts/release-lens",
  },
] as const;

export function createProductHuntFixture(requestUrl: string) {
  const range = new URL(requestUrl).searchParams.get("range");

  return {
    status: "ok",
    source: "qa-fixture",
    stale: false,
    range: range === "week" || range === "month" ? range : "day",
    updatedAt: fixedProductHuntUpdatedAt,
    items: [...productHuntItems],
  } satisfies ProductHuntPayload;
}
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";
