import { NextResponse } from "next/server";

import { releaseMetadata } from "@/lib/release/metadata";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(releaseMetadata, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
