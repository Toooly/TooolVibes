import { NextResponse } from "next/server";

import { releaseMetadata } from "@/lib/release/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json(releaseMetadata, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
