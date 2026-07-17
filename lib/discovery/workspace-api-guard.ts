import "server-only";

import { workspaceSyncMutationSchema } from "@/lib/discovery/schema";
import {
  consumeRateLimit,
  getRequestAddress,
} from "@/lib/security/distributed-state";

export const MAX_WORKSPACE_MUTATION_BYTES = 256 * 1024;

type WorkspaceMutationOperation = "attach" | "load" | "release" | "save";

export function workspaceRateLimitNamespace(
  operation: WorkspaceMutationOperation,
  dimension: "ip" | "token",
) {
  return `workspace-sync-${operation}-${dimension}`;
}

async function bearerFingerprint(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function readWorkspaceBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token.length > 0 && token.length <= 8192 ? token : null;
}

export async function parseWorkspaceMutationRequest(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) &&
      declaredLength > MAX_WORKSPACE_MUTATION_BYTES) {
    return { status: "too-large" as const };
  }

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > MAX_WORKSPACE_MUTATION_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { status: "too-large" as const };
      }
      chunks.push(chunk.value);
    }
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const raw = new TextDecoder().decode(body);

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = null;
  }
  const parsed = workspaceSyncMutationSchema.safeParse(value);
  return parsed.success
    ? { status: "valid" as const, data: parsed.data }
    : { status: "invalid" as const, issues: parsed.error.issues };
}

export function consumeWorkspaceMutationRateLimit(
  request: Request,
  token: string,
  operation: WorkspaceMutationOperation,
) {
  return (async () => {
    const policy = { limit: 90, windowMs: 60_000 } as const;
    const ipDecision = await consumeRateLimit({
      namespace: workspaceRateLimitNamespace(operation, "ip"),
      identifiers: [getRequestAddress(request)],
      ...policy,
    });
    if (!ipDecision.allowed) return ipDecision;

    return consumeRateLimit({
      namespace: workspaceRateLimitNamespace(operation, "token"),
      identifiers: [await bearerFingerprint(token)],
      ...policy,
    });
  })();
}
