import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "workspace-endpoint-retired",
      replacement: "/api/workspace-account/release",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        Link: '</api/workspace-account/release>; rel="successor-version"',
      },
    },
  );
}
