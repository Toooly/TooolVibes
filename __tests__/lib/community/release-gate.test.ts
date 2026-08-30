import { afterEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({
  read: false,
  write: false,
  report: false,
}));

vi.mock("@/lib/community/read-flag", () => ({
  isCommunityReadEnabled: () => flags.read,
}));
vi.mock("@/lib/community/write-flag", () => ({
  isCommunityWriteFlagEnabled: () => flags.write,
}));
vi.mock("@/lib/community/report-flag", () => ({
  isCommunityReportFlagEnabled: () => flags.report,
}));

import {
  isCommunityOwnerGetReleased,
  isCommunityPublicReadReleased,
  isCommunityReportReleased,
  isCommunityWriteReleased,
} from "@/lib/community/release-gate";

function set(read: boolean, write: boolean, report: boolean) {
  flags.read = read;
  flags.write = write;
  flags.report = report;
}

describe("H7 community release gates", () => {
  afterEach(() => set(false, false, false));

  it("R0 W0 P0: everything dark", () => {
    set(false, false, false);
    expect(isCommunityPublicReadReleased()).toBe(false);
    expect(isCommunityWriteReleased()).toBe(false);
    expect(isCommunityReportReleased()).toBe(false);
    expect(isCommunityOwnerGetReleased()).toBe(false);
  });

  it("R1 W0 P0: public read only", () => {
    set(true, false, false);
    expect(isCommunityPublicReadReleased()).toBe(true);
    expect(isCommunityWriteReleased()).toBe(false);
    expect(isCommunityReportReleased()).toBe(false);
    expect(isCommunityOwnerGetReleased()).toBe(false);
  });

  it("R1 W1 P0: read + write, owner GET on", () => {
    set(true, true, false);
    expect(isCommunityWriteReleased()).toBe(true);
    expect(isCommunityReportReleased()).toBe(false);
    expect(isCommunityOwnerGetReleased()).toBe(true);
  });

  it("R1 W0 P1: read + report, owner GET on for self-report suppression", () => {
    set(true, false, true);
    expect(isCommunityWriteReleased()).toBe(false);
    expect(isCommunityReportReleased()).toBe(true);
    expect(isCommunityOwnerGetReleased()).toBe(true);
  });

  it("R1 W1 P1: all on", () => {
    set(true, true, true);
    expect(isCommunityPublicReadReleased()).toBe(true);
    expect(isCommunityWriteReleased()).toBe(true);
    expect(isCommunityReportReleased()).toBe(true);
    expect(isCommunityOwnerGetReleased()).toBe(true);
  });

  it("R0 W1 P1: write/report cannot escape read-off", () => {
    set(false, true, true);
    expect(isCommunityPublicReadReleased()).toBe(false);
    expect(isCommunityWriteReleased()).toBe(false);
    expect(isCommunityReportReleased()).toBe(false);
    expect(isCommunityOwnerGetReleased()).toBe(false);
  });
});
