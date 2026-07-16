import { beforeEach, describe, expect, it, vi } from "vitest";

const nextCache = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: nextCache.revalidatePath,
}));

import {
  getToolRevalidationTargets,
  revalidateToolPaths,
} from "@/app/(admin)/admin/actions/_helpers";

const sharedTargets = [
  { path: "/", type: "layout" as const },
  { path: "/archivio" },
  { path: "/tags" },
  { path: "/shortlist" },
  { path: "/compare" },
  { path: "/api/tools" },
  { path: "/sitemap.xml" },
  { path: "/toools/[slug]", type: "page" as const },
  { path: "/admin" },
  { path: "/admin/tools" },
];

describe("admin tool cache invalidation contract", () => {
  beforeEach(() => {
    nextCache.revalidatePath.mockReset();
  });

  it("covers every public tool surface and every related detail page", () => {
    expect(getToolRevalidationTargets("atlas-ai")).toEqual([
      ...sharedTargets,
      { path: "/toools/atlas-ai" },
    ]);

    revalidateToolPaths("atlas-ai");

    expect(nextCache.revalidatePath.mock.calls).toEqual(
      [...sharedTargets, { path: "/toools/atlas-ai" }].map((target) => [
        target.path,
        target.type,
      ]),
    );
  });

  it("invalidates both detail URLs when an admin update changes the slug", () => {
    expect(getToolRevalidationTargets("atlas-studio", "atlas-ai")).toEqual([
      ...sharedTargets,
      { path: "/toools/atlas-studio" },
      { path: "/toools/atlas-ai" },
    ]);
  });

  it("does not add a duplicate detail invalidation when the slug is unchanged", () => {
    const targets = getToolRevalidationTargets("atlas-ai", "atlas-ai");

    expect(targets.filter((target) => target.path === "/toools/atlas-ai")).toHaveLength(1);
  });
});
