import { NextResponse } from "next/server";

import { attachCanonicalWorkspace } from "@/lib/discovery/canonical-remote-workspace";
import {
  consumeWorkspaceMutationRateLimit,
  parseWorkspaceMutationRequest,
  readWorkspaceBearerToken,
} from "@/lib/discovery/workspace-api-guard";
import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-state";
import {
  WorkspaceCapacityError,
  WorkspaceSyncConflictError,
} from "@/lib/discovery/workspace-sync";
import type {
  WorkspacePersistencePayload,
  WorkspaceStateV1,
} from "@/lib/discovery/types";
import { rateLimitResponseHeaders } from "@/lib/security/distributed-state";

export const dynamic = "force-dynamic";

function localOnly(
  state: WorkspaceStateV1 = createEmptyWorkspaceState(),
  error?: string,
): WorkspacePersistencePayload {
  return {
    data: state,
    meta: {
      mode: "local",
      remote_available: false,
      viewer_kind: "account",
      synced_at: null,
      error: error ?? null,
      revision: null,
      recovery_required: Boolean(error),
    },
  };
}

export async function POST(request: Request) {
  const token = readWorkspaceBearerToken(request);
  if (!token) {
    return NextResponse.json(localOnly(undefined, "missing-access-token"), {
      status: 401,
    });
  }

  try {
    const decision = await consumeWorkspaceMutationRateLimit(
      request,
      token,
      "attach",
    );
    if (!decision.allowed) {
      return NextResponse.json(localOnly(undefined, "rate-limited"), {
        status: 429,
        headers: rateLimitResponseHeaders(decision),
      });
    }
  } catch {
    return NextResponse.json(localOnly(undefined, "security-state-unavailable"), {
      status: 503,
    });
  }

  const parsed = await parseWorkspaceMutationRequest(request);
  if (parsed.status === "too-large") {
    return NextResponse.json(localOnly(undefined, "payload-too-large"), {
      status: 413,
    });
  }
  if (parsed.status === "invalid") {
    return NextResponse.json({
      ...localOnly(undefined, "invalid-payload"),
      issues: parsed.issues,
    }, { status: 400 });
  }
  const fallback = parsed.data.state;

  try {
    const result = await attachCanonicalWorkspace(
      token,
      fallback,
      parsed.data.guest_state ?? createEmptyWorkspaceState(),
      parsed.data.operation_id,
    );
    if (!result.remoteAvailable) {
      return NextResponse.json(localOnly(fallback, result.error), {
        status: 202,
      });
    }
    return NextResponse.json({
      data: result.state,
      meta: {
        mode: "remote",
        remote_available: true,
        viewer_kind: "account",
        synced_at: new Date().toISOString(),
        error: null,
        revision: result.revision,
        conflict_retries: result.conflictRetries,
        recovery_required: false,
      },
    } satisfies WorkspacePersistencePayload);
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
          viewer_kind: "account",
          synced_at: null,
          error: "revision-conflict",
          revision: error.revision,
          conflict_retries: error.retries,
          recovery_required: true,
        },
      } satisfies WorkspacePersistencePayload, { status: 409 });
    }
    return NextResponse.json(localOnly(fallback, "attach-failed"), {
      status: 503,
    });
  }
}
