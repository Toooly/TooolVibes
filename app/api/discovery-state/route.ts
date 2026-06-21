import { NextResponse } from "next/server";

import type { DiscoveryPersistencePayload } from "@/lib/discovery/types";
import { discoveryWorkspaceStateSchema } from "@/lib/discovery/schema";
import { normalizeDiscoveryWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  loadRemoteDiscoveryWorkspace,
  saveRemoteDiscoveryWorkspace,
} from "@/lib/discovery/remote-workspace";

export const dynamic = "force-dynamic";

function createTraceId() {
  return crypto.randomUUID();
}

function getLocalOnlyPayload(error?: string): DiscoveryPersistencePayload {
  return {
    data: normalizeDiscoveryWorkspaceState({
      tool_states: {},
      compare: { slugs: [], updated_at: null },
    }),
    meta: {
      mode: "local",
      remote_available: false,
      synced_at: null,
      error: error ?? null,
    },
  };
}

export async function GET() {
  try {
    const result = await loadRemoteDiscoveryWorkspace();

    if (!result.remoteAvailable) {
      return NextResponse.json(getLocalOnlyPayload());
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
    console.error("[api:/api/discovery-state] GET failed", { traceId });
    return NextResponse.json({ ...getLocalOnlyPayload("remote-unavailable"), traceId });
  }
}

export async function PUT(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

    if (!accessToken) {
      return NextResponse.json(getLocalOnlyPayload("missing-access-token"), { status: 401 });
    }

    const parsed = discoveryWorkspaceStateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { ...getLocalOnlyPayload("invalid-payload"), issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const normalized = normalizeDiscoveryWorkspaceState(
      parsed.data as Partial<DiscoveryPersistencePayload["data"]>,
    );
    const result = await saveRemoteDiscoveryWorkspace(normalized, accessToken);

    if (!result.remoteAvailable) {
      return NextResponse.json(getLocalOnlyPayload("remote-unavailable"), { status: 202 });
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
    console.error("[api:/api/discovery-state] PUT failed", { traceId });
    return NextResponse.json({ ...getLocalOnlyPayload("save-failed"), traceId }, { status: 503 });
  }
}
