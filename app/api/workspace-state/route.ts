import { NextResponse } from "next/server";

import {
  consumeWorkspaceMutationRateLimit,
  parseWorkspaceMutationRequest,
  readWorkspaceBearerToken,
} from "@/lib/discovery/workspace-api-guard";
import {
  loadCanonicalRemoteWorkspace,
  saveCanonicalRemoteWorkspace,
} from "@/lib/discovery/canonical-remote-workspace";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  WorkspaceCapacityError,
  WorkspaceSyncConflictError,
} from "@/lib/discovery/workspace-sync";
import type { WorkspacePersistencePayload } from "@/lib/discovery/types";
import { rateLimitResponseHeaders } from "@/lib/security/distributed-state";

export const dynamic = "force-dynamic";

function localOnly(error?: string): WorkspacePersistencePayload {
  return {
    data: createEmptyWorkspaceState(),
    meta: {
      mode: "local",
      remote_available: false,
      synced_at: null,
      error: error ?? null,
      revision: null,
      recovery_required: Boolean(error),
    },
  };
}

function remote(result: {
  state: WorkspacePersistencePayload["data"];
  revision: string | null;
  viewerKind?: "guest" | "account";
  conflictRetries?: number;
}): WorkspacePersistencePayload {
  return {
    data: result.state,
    meta: {
      mode: "remote",
      remote_available: true,
      viewer_kind: result.viewerKind ?? "guest",
      synced_at: new Date().toISOString(),
      error: null,
      revision: result.revision,
      conflict_retries: result.conflictRetries ?? 0,
      recovery_required: false,
    },
  };
}

export async function GET(request: Request) {
  const token = readWorkspaceBearerToken(request);
  if (!token) {
    return NextResponse.json(localOnly("missing-access-token"));
  }

  try {
    const decision = await consumeWorkspaceMutationRateLimit(
      request,
      token,
      "load",
    );
    if (!decision.allowed) {
      return NextResponse.json(localOnly("rate-limited"), {
        status: 429,
        headers: rateLimitResponseHeaders(decision),
      });
    }
  } catch {
    return NextResponse.json(localOnly("security-state-unavailable"), {
      status: 503,
    });
  }

  try {
    const result = await loadCanonicalRemoteWorkspace(token);
    return result.remoteAvailable
      ? NextResponse.json(remote(result))
      : NextResponse.json(localOnly(result.error));
  } catch {
    return NextResponse.json(localOnly("remote-unavailable"));
  }
}

export async function PUT(request: Request) {
  const token = readWorkspaceBearerToken(request);
  if (!token) {
    return NextResponse.json(localOnly("missing-access-token"), {
      status: 401,
    });
  }

  try {
    const decision = await consumeWorkspaceMutationRateLimit(
      request,
      token,
      "save",
    );
    if (!decision.allowed) {
      return NextResponse.json(localOnly("rate-limited"), {
        status: 429,
        headers: rateLimitResponseHeaders(decision),
      });
    }
  } catch {
    return NextResponse.json(localOnly("security-state-unavailable"), {
      status: 503,
    });
  }

  const parsed = await parseWorkspaceMutationRequest(request);
  if (parsed.status === "too-large") {
    return NextResponse.json(localOnly("payload-too-large"), { status: 413 });
  }
  if (parsed.status === "invalid") {
    return NextResponse.json({
      ...localOnly("invalid-payload"),
      issues: parsed.issues,
    }, { status: 400 });
  }

  try {
    const result = await saveCanonicalRemoteWorkspace(
      parsed.data.state,
      token,
      parsed.data.operation_id,
    );
    return result.remoteAvailable
      ? NextResponse.json(remote(result))
      : NextResponse.json(localOnly(result.error), { status: 202 });
  } catch (error) {
    if (error instanceof WorkspaceCapacityError) {
      return NextResponse.json({
        data: error.state,
        meta: {
          mode: "local",
          remote_available: true,
          viewer_kind: "account",
          synced_at: null,
          error: "workspace-capacity-exceeded",
          revision: null,
          conflict_retries: 0,
          recovery_required: true,
        },
      } satisfies WorkspacePersistencePayload, { status: 422 });
    }
    if (error instanceof WorkspaceSyncConflictError) {
      return NextResponse.json({
        data: error.state,
        meta: {
          mode: "local",
          remote_available: true,
          synced_at: null,
          error: "revision-conflict",
          revision: error.revision,
          conflict_retries: error.retries,
          recovery_required: true,
        },
      } satisfies WorkspacePersistencePayload, { status: 409 });
    }
    console.error("[workspace.save]", {
      class: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message.slice(0, 180) : "unknown",
    });
    return NextResponse.json(localOnly("save-failed"), { status: 503 });
  }
}
