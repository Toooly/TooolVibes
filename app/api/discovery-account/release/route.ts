import { NextResponse } from "next/server";

import type { DiscoveryPersistencePayload } from "@/lib/discovery/types";
import { normalizeDiscoveryWorkspaceState } from "@/lib/discovery/workspace-state";
import { releaseAuthenticatedViewer } from "@/lib/discovery/remote-workspace";

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
    const body = (await request.json().catch(() => null)) as Partial<DiscoveryPersistencePayload["data"]> | null;
    const fallbackState = normalizeDiscoveryWorkspaceState(body ?? undefined);
    const result = await releaseAuthenticatedViewer(fallbackState);

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
    console.error("[api:/api/discovery-account/release] POST failed", error);
    return NextResponse.json(getLocalOnlyPayload(undefined, "release-failed"), { status: 503 });
  }
}
