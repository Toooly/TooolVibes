import "server-only";

/**
 * Server-side validation for the sponsor analytics ingest endpoint.
 *
 * Accepts only the three known sponsor events, validates the payload, rejects
 * oversized or malformed requests, ignores unknown fields, and never stores or
 * echoes raw personal data.
 */

export const SPONSOR_ANALYTICS_MAX_BODY_BYTES = 8 * 1024;
export const SPONSOR_ANALYTICS_MAX_FIELD_LENGTH = 2048;

export const SPONSOR_ANALYTICS_EVENT_NAMES = [
  "sponsor_impression",
  "sponsor_click",
  "sponsor_opportunity_click",
] as const;

export type SponsorAnalyticsEventName =
  (typeof SPONSOR_ANALYTICS_EVENT_NAMES)[number];

export type SponsorAnalyticsIngestEvent = {
  name: SponsorAnalyticsEventName;
  ts?: number;
  campaignId?: string;
  sponsorId?: string;
  placementId?: string;
  route?: string;
  destination?: string;
  toolSlug?: string;
};

export type SponsorAnalyticsIngestResult =
  | { ok: true; value: SponsorAnalyticsIngestEvent }
  | { ok: false; error: string; status: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, SPONSOR_ANALYTICS_MAX_FIELD_LENGTH);
}

function cleanUrl(value: unknown): string | undefined {
  const text = cleanString(value);
  if (!text) return undefined;
  try {
    const url = new URL(text, "https://tooolvibes.eu");
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().slice(0, SPONSOR_ANALYTICS_MAX_FIELD_LENGTH);
  } catch {
    // Relative paths are allowed (e.g. "/sponsorizza"); keep them but trim.
    return text.slice(0, SPONSOR_ANALYTICS_MAX_FIELD_LENGTH);
  }
}

function cleanTs(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const now = Date.now();
  if (value < now - 86_400_000 * 7 || value > now + 60_000) return undefined;
  return Math.floor(value);
}

export function validateSponsorAnalyticsPayload(
  body: unknown,
): SponsorAnalyticsIngestResult {
  if (!isRecord(body)) {
    return { ok: false, error: "invalid_payload", status: 400 };
  }

  const nameValue = body["name"];
  if (
    typeof nameValue !== "string" ||
    !(SPONSOR_ANALYTICS_EVENT_NAMES as readonly string[]).includes(nameValue)
  ) {
    return { ok: false, error: "unknown_event", status: 400 };
  }
  const name = nameValue as SponsorAnalyticsEventName;

  const placementId = cleanString(body["placementId"]);
  if (!placementId) {
    return { ok: false, error: "missing_placement", status: 400 };
  }

  const route = cleanString(body["route"]);
  if (!route) {
    return { ok: false, error: "missing_route", status: 400 };
  }

  const value: SponsorAnalyticsIngestEvent = {
    name,
    ts: cleanTs(body["ts"]),
    campaignId: cleanString(body["campaignId"]),
    sponsorId: cleanString(body["sponsorId"]),
    placementId,
    route,
    toolSlug: cleanString(body["toolSlug"]),
  };

  const destination = cleanUrl(body["destination"]);
  if (destination) value.destination = destination;

  return { ok: true, value };
}
