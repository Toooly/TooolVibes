import { NextResponse } from "next/server";

import { getPublicToolsSnapshot } from "@/lib/data/public-tools";

export async function GET() {
  const snapshot = await getPublicToolsSnapshot();

  return NextResponse.json({
    data: snapshot.tools,
    meta: {
      source: snapshot.source,
      requested_source: snapshot.requestedSource,
      warnings: snapshot.warnings,
      count: snapshot.tools.length,
    },
  });
}
