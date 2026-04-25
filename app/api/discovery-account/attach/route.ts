import { NextResponse } from "next/server";

import type { DiscoveryPersistencePayload } from "@/lib/discovery/types";
import { normalizeDiscoveryWorkspaceState } from "@/lib/discovery/workspace-state";
import { attachAuthenticatedViewer } from "@/lib/discovery/remote-workspace";

export const dynamic = "force-dynamic";

function getLocalOnlyPayload(
  fallbackState?: Partial<DiscoveryPersistencePayload["data"]> | null,
  error?: string,
): DiscoveryPersistencePayload {
  return {
    data: normalizeDiscoveryWorkspaceState(fallbackState),
    meta: {
      mode: "local",
      remote_available: false,
      viewer_kind: "guest",
      synced_at: null,
      error: error ?? null,
    },
  };
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const body = (await request.json().catch(() => null)) as Partial<DiscoveryPersistencePayload["data"]> | null;
    const fallbackState = normalizeDiscoveryWorkspaceState(body ?? undefined);

    if (!accessToken) {
      return NextResponse.json(getLocalOnlyPayload(fallbackState, "missing-access-token"), { status: 401 });
    }

    const result = await attachAuthenticatedViewer(accessToken, fallbackState);

    if (!result.remoteAvailable) {
      return NextResponse.json(getLocalOnlyPayload(fallbackState, "remote-unavailable"), { status: 202 });
    }

    const viewerKind = "viewerKind" in result ? result.viewerKind : "guest";

    return NextResponse.json({
      data: result.state,
      meta: {
        mode: "remote",
        remote_available: true,
        viewer_kind: viewerKind,
        synced_at: new Date().toISOString(),
        error: null,
      },
    } satisfies DiscoveryPersistencePayload);
  } catch (error) {
    console.error("[api:/api/discovery-account/attach] POST failed", error);
    return NextResponse.json(getLocalOnlyPayload(undefined, "attach-failed"), { status: 503 });
  }
}
