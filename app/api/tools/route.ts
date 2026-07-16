import { NextResponse } from "next/server";

import { getPublicToolsSnapshot } from "@/lib/data/public-tools";

export async function GET() {
  const snapshot = await getPublicToolsSnapshot();

  if (snapshot.status === "unavailable") {
    return NextResponse.json(
      {
        error: "tools-source-unavailable",
        meta: {
          requested_source: snapshot.requestedSource,
          warnings: snapshot.warnings,
        },
      },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }

  return NextResponse.json({
    data: snapshot.tools,
    meta: {
      source: snapshot.source,
      requested_source: snapshot.requestedSource,
      fallback_source: snapshot.fallbackSource,
      status: snapshot.status,
      schema_version: 1,
      warnings: snapshot.warnings,
      count: snapshot.tools.length,
      comparison: snapshot.comparison,
    },
  });
}
