import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enabled: false,
  admin: true,
  list: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/community/read-flag", () => ({
  isCommunityReadEnabled: () => mocks.enabled,
}));

vi.mock("@/lib/supabase/admin-client", () => ({
  isSupabaseAdminEnabled: () => mocks.admin,
}));

vi.mock("@/lib/community/repository", () => ({
  listPublishedExperiences: (...args: unknown[]) => mocks.list(...args),
}));

import { loadPublishedExperiencesForTool } from "@/lib/community/public-read";
import { MAX_PUBLIC_PAGE } from "@/lib/community/schema";

describe("loadPublishedExperiencesForTool", () => {
  beforeEach(() => {
    mocks.enabled = false;
    mocks.admin = true;
    mocks.list.mockReset();
  });

  it("H4-FLAG-03 does not query when flag is off", async () => {
    const result = await loadPublishedExperiencesForTool("blink");
    expect(result).toEqual({ skipped: true });
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("H4-DATA uses published page size 8", async () => {
    mocks.enabled = true;
    mocks.list.mockResolvedValue({
      ok: true,
      page: [{ id: "1", publishedAt: "2026-08-30T12:00:00.000Z" }],
      hasMore: true,
    });
    const result = await loadPublishedExperiencesForTool("blink");
    expect(mocks.list).toHaveBeenCalledWith({
      toolSlug: "blink",
      limit: MAX_PUBLIC_PAGE,
      cursor: null,
    });
    expect(MAX_PUBLIC_PAGE).toBe(8);
    expect(result.skipped).toBe(false);
    if (!result.skipped && result.ok) {
      expect(result.nextCursor).toBeTruthy();
    }
  });


  it("renders empty published list when admin client is unavailable at build", async () => {
    mocks.enabled = true;
    mocks.admin = false;
    const result = await loadPublishedExperiencesForTool("blink");
    expect(mocks.list).not.toHaveBeenCalled();
    expect(result).toEqual({
      skipped: false,
      ok: true,
      experiences: [],
      nextCursor: null,
    });
  });
  it("does not throw when repository fails", async () => {
    mocks.enabled = true;
    mocks.list.mockRejectedValue(new Error("db"));
    await expect(loadPublishedExperiencesForTool("blink")).resolves.toEqual({
      skipped: false,
      ok: true,
      experiences: [],
      nextCursor: null,
    });
  });
});
