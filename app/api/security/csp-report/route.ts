import { NextResponse } from "next/server";

const MAX_REPORT_BYTES = 32 * 1024;
const MAX_FIELD_LENGTH = 512;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, MAX_FIELD_LENGTH)
    : undefined;
}

function sanitizeUrl(value: unknown) {
  const text = sanitizeText(value);
  if (!text) {
    return undefined;
  }

  try {
    const url = new URL(text);
    if (url.protocol === "data:") {
      return "data:";
    }
    if (url.protocol === "blob:") {
      return "blob:";
    }
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
      return "[unsupported-url]";
    }
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().slice(0, MAX_FIELD_LENGTH);
  } catch {
    return "[invalid-url]";
  }
}

function sanitizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeReport(payload: unknown) {
  const envelope = isRecord(payload) ? payload : {};
  const nested = isRecord(envelope["csp-report"])
    ? envelope["csp-report"]
    : envelope;
  const body = isRecord(nested.body) ? nested.body : nested;

  return {
    documentUri: sanitizeUrl(
      body["document-uri"] ?? body.documentURL ?? body.documentUrl,
    ),
    blockedUri: sanitizeUrl(
      body["blocked-uri"] ?? body.blockedURL ?? body.blockedUrl,
    ),
    sourceFile: sanitizeUrl(body["source-file"] ?? body.sourceFile),
    effectiveDirective: sanitizeText(
      body["effective-directive"] ?? body.effectiveDirective,
    ),
    violatedDirective: sanitizeText(
      body["violated-directive"] ?? body.violatedDirective,
    ),
    disposition: sanitizeText(body.disposition),
    statusCode: sanitizeNumber(body["status-code"] ?? body.statusCode),
    lineNumber: sanitizeNumber(body["line-number"] ?? body.lineNumber),
    columnNumber: sanitizeNumber(body["column-number"] ?? body.columnNumber),
  };
}

function noStoreResponse(status = 204) {
  return new NextResponse(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_BYTES) {
    return noStoreResponse(413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REPORT_BYTES) {
    return noStoreResponse(413);
  }

  try {
    const payload: unknown = JSON.parse(rawBody);
    const reports = Array.isArray(payload) ? payload : [payload];

    for (const report of reports.slice(0, 20)) {
      console.warn("[security:csp-report]", normalizeReport(report));
    }
  } catch {
    return noStoreResponse(400);
  }

  return noStoreResponse();
}

export function GET() {
  return noStoreResponse(405);
}
