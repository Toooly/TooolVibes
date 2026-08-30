import { describe, expect, it } from "vitest";

import {
  isReportDisposition,
  isReportStatus,
  normalizeReportResolutionNote,
  planReportResolution,
} from "@/lib/community/report-moderation";

const base = {
  note: null as string | null,
  actor: "founder-admin",
  nowIso: "2026-08-30T12:00:00.000Z",
};

describe("H6 report resolution matrix", () => {
  it("H6-RESOLVE-01 open -> resolved applies", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "open",
      disposition: "resolved",
      note: "Contenuto verificato.",
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.patch).toEqual({
        status: "resolved",
        resolved_at: base.nowIso,
        resolved_by: "founder-admin",
        resolution_note: "Contenuto verificato.",
      });
    }
  });

  it("H6-DISMISS-01 open -> dismissed applies first-class status", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "open",
      disposition: "dismissed",
      note: null,
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.patch.status).toBe("dismissed");
      expect(plan.patch.resolution_note).toBeNull();
    }
  });

  it("H6-DISMISS-02 dismissed keeps human note without machine prefix", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "open",
      disposition: "dismissed",
      note: "Non serve azione",
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.patch.status).toBe("dismissed");
      expect(plan.patch.resolution_note).toBe("Non serve azione");
    }
  });

  it("H6-RESOLVE-06 resolved -> resolve is invalid (no reopen)", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "resolved",
      disposition: "resolved",
      note: null,
    });
    expect(plan).toEqual({ ok: false, code: "REPORT_STATE_CONFLICT" });
  });

  it("H6-DISMISS-04 resolved -> dismissed is invalid", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "resolved",
      disposition: "dismissed",
      note: null,
    });
    expect(plan).toEqual({ ok: false, code: "REPORT_STATE_CONFLICT" });
  });

  it("H6-RESOLVE-04 note over 500 is invalid", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "open",
      disposition: "resolved",
      note: "a".repeat(501),
    });
    expect(plan).toEqual({ ok: false, code: "INVALID_INPUT" });
  });

  it("H6-ADMIN actor empty is invalid", () => {
    const plan = planReportResolution({
      ...base,
      currentStatus: "open",
      disposition: "resolved",
      actor: "  ",
      note: null,
    });
    expect(plan).toEqual({ ok: false, code: "INVALID_INPUT" });
  });

  it("guards recognise statuses and dispositions", () => {
    expect(isReportStatus("open")).toBe(true);
    expect(isReportStatus("dismissed")).toBe(true);
    expect(isReportStatus("ignored")).toBe(false);
    expect(isReportDisposition("dismissed")).toBe(true);
    expect(isReportDisposition("reopen")).toBe(false);
    expect(normalizeReportResolutionNote("  ")).toBeNull();
    expect(normalizeReportResolutionNote("ok")).toBe("ok");
  });
});
