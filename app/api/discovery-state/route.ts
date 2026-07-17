import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const retiredPayload = {
  error: "workspace-endpoint-retired",
  replacement: "/api/workspace-state",
} as const;

function retiredResponse() {
  return NextResponse.json(retiredPayload, {
    status: 410,
    headers: {
      "Cache-Control": "no-store",
      Link: '</api/workspace-state>; rel="successor-version"',
    },
  });
}

export async function GET() {
  return retiredResponse();
}

export async function PUT() {
  return retiredResponse();
}
