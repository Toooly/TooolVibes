import { NextResponse } from "next/server";

import type { DiscoveryPersistencePayload } from "@/lib/discovery/types";
import { discoveryWorkspaceStateSchema } from "@/lib/discovery/schema";
import { normalizeDiscoveryWorkspaceState } from "@/lib/discovery/workspace-state";
import { releaseAuthenticatedViewer } from "@/lib/discovery/remote-workspace";

export const dynamic = "force-dynamic";

function createTraceId() {
  return crypto.randomUUID();
}

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
    const rawBody = await request.json().catch(() => null);
    const parsed = discoveryWorkspaceStateSchema.safeParse(rawBody ?? undefined);
    const fallbackState = normalizeDiscoveryWorkspaceState(
      parsed.success ? (parsed.data as Partial<DiscoveryPersistencePayload["data"]>) : undefined,
    );

    if (!accessToken) {
      return NextResponse.json(getLocalOnlyPayload(fallbackState, "missing-access-token"), { status: 401 });
    }

    if (!parsed.success) {
      return NextResponse.json(
        { ...getLocalOnlyPayload(fallbackState, "invalid-payload"), issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await releaseAuthenticatedViewer(accessToken, fallbackState);

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
  } catch {
    const traceId = createTraceId();
    console.error("[api:/api/discovery-account/release] POST failed", { traceId });
    return NextResponse.json(
      { ...getLocalOnlyPayload(undefined, "release-failed"), traceId },
      { status: 503 },
    );
  }
}
