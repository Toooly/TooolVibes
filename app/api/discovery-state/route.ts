import { NextResponse } from "next/server";

import type { DiscoveryPersistencePayload } from "@/lib/discovery/types";
import { normalizeDiscoveryWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  loadRemoteDiscoveryWorkspace,
  saveRemoteDiscoveryWorkspace,
} from "@/lib/discovery/remote-workspace";

export const dynamic = "force-dynamic";

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
  } catch (error) {
    console.error("[api:/api/discovery-state] GET failed", error);
    return NextResponse.json(getLocalOnlyPayload("remote-unavailable"));
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<DiscoveryPersistencePayload["data"]> | null;
    const normalized = normalizeDiscoveryWorkspaceState(body ?? undefined);
    const result = await saveRemoteDiscoveryWorkspace(normalized);

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
  } catch (error) {
    console.error("[api:/api/discovery-state] PUT failed", error);
    return NextResponse.json(getLocalOnlyPayload("save-failed"), { status: 503 });
  }
}
