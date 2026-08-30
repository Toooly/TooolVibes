export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_DISPOSITIONS = ["resolved", "dismissed"] as const;
export type ReportDisposition = (typeof REPORT_DISPOSITIONS)[number];

export const REPORT_RESOLUTION_NOTE_MAX = 500;
export const ADMIN_REPORT_PAGE_SIZE = 20;

export function isReportStatus(value: unknown): value is ReportStatus {
  return (
    typeof value === "string" &&
    (REPORT_STATUSES as readonly string[]).includes(value)
  );
}

export function isReportDisposition(
  value: unknown,
): value is ReportDisposition {
  return (
    typeof value === "string" &&
    (REPORT_DISPOSITIONS as readonly string[]).includes(value)
  );
}

export function normalizeReportResolutionNote(raw: unknown) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.normalize("NFC").trim();
  if (!trimmed) return null;
  if (trimmed.length > REPORT_RESOLUTION_NOTE_MAX) return null;
  return trimmed;
}

export type ReportResolutionPlan =
  | {
      ok: true;
      patch: {
        status: "resolved" | "dismissed";
        resolved_at: string;
        resolved_by: string;
        resolution_note: string | null;
      };
    }
  | { ok: false; code: "REPORT_STATE_CONFLICT" | "INVALID_INPUT" };

export function planReportResolution(input: {
  currentStatus: ReportStatus;
  disposition: ReportDisposition;
  note: string | null;
  actor: string;
  nowIso: string;
}): ReportResolutionPlan {
  const actor = input.actor.normalize("NFC").trim();
  if (actor.length < 1 || actor.length > 120) {
    return { ok: false, code: "INVALID_INPUT" };
  }
  const note = normalizeReportResolutionNote(input.note);
  if (input.note !== null && input.note !== undefined && input.note !== "" && !note) {
    return { ok: false, code: "INVALID_INPUT" };
  }
  if (input.currentStatus !== "open") {
    return { ok: false, code: "REPORT_STATE_CONFLICT" };
  }
  return {
    ok: true,
    patch: {
      status: input.disposition,
      resolved_at: input.nowIso,
      resolved_by: actor,
      resolution_note: note,
    },
  };
}

export function reportScopeForDisposition(
  disposition: ReportDisposition,
): "resolved" | "dismissed" {
  return disposition === "dismissed" ? "dismissed" : "resolved";
}
