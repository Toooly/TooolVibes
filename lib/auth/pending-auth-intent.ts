import { workspaceSlugSchema } from "@/lib/discovery/schema";
import { MAX_STACK_NAME_LENGTH } from "@/lib/discovery/workspace-constants";
import { MAX_PERSONAL_SEARCH_QUERY_LENGTH } from "@/lib/search/personal-search-query";

export const PENDING_AUTH_INTENT_STORAGE_KEY = "tooolvibes:pending-auth-intent:v1";
export const PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY =
  "tooolvibes:pending-auth-intent:consumed:v1";
export const PENDING_AUTH_INTENT_TTL_MS = 30 * 60 * 1000;
export const PENDING_AUTH_INTENT_VERSION = 1 as const;

const MAX_RETURN_TO_LENGTH = 500;
const MAX_ORIGIN_LENGTH = 80;
const MAX_JSON_BYTES = 2048;

export type PendingAuthCapability = "stack.create" | "note.private" | "search.personal";
export type PendingStackCreateCapability = PendingAuthCapability;

export type PendingStackCreatePayload = {
  toolSlug: string;
  desiredStackName?: string;
  targetStackId?: string;
  targetStackName?: string;
};

export type PendingNotePrivatePayload = {
  toolSlug: string;
};

export type PendingSearchPersonalPayload = {
  query: string;
};

export type PendingAuthIntentPayload =
  | PendingStackCreatePayload
  | PendingNotePrivatePayload
  | PendingSearchPersonalPayload;

export type PendingAuthIntent = {
  version: typeof PENDING_AUTH_INTENT_VERSION;
  id: string;
  capability: PendingAuthCapability;
  payload: PendingAuthIntentPayload;
  returnTo: string;
  origin?: string;
  createdAt: string;
  expiresAt: string;
};

export type PendingAuthIntentRead =
  | { status: "empty" }
  | { status: "invalid"; reason: string }
  | { status: "expired"; intent: PendingAuthIntent }
  | { status: "ready"; intent: PendingAuthIntent };

const consumedIds = new Set<string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createIntentId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `intent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isUnsafePath(value: string): boolean {
  if (!value.startsWith("/")) return true;
  if (value.startsWith("//")) return true;
  if (value.includes("://")) return true;
  if (value.includes("\\")) return true;
  if (/^[a-zA-Z][a-zA-Z+.-]*:/.test(value)) return true;
  if (value.length > MAX_RETURN_TO_LENGTH) return true;
  if (/[\u0000-\u001F]/.test(value)) return true;
  return false;
}

export function isSafeReturnTo(value: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (isUnsafePath(trimmed)) return false;
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed && isUnsafePath(decoded)) return false;
  } catch {
    return false;
  }
  return true;
}

function parseToolSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = workspaceSlugSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseStackName(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_STACK_NAME_LENGTH) return undefined;
  return trimmed;
}

export function parsePendingAuthIntent(input: unknown): PendingAuthIntentRead {
  if (input == null) {
    return { status: "empty" };
  }
  if (!isRecord(input)) {
    return { status: "invalid", reason: "malformed" };
  }
  if (input.version !== PENDING_AUTH_INTENT_VERSION) {
    return { status: "invalid", reason: "unknown-version" };
  }
  if (typeof input.id !== "string" || input.id.trim().length < 8 || input.id.length > 80) {
    return { status: "invalid", reason: "malformed-id" };
  }
  if (
    input.capability !== "stack.create" &&
    input.capability !== "note.private" &&
    input.capability !== "search.personal"
  ) {
    return { status: "invalid", reason: "unknown-capability" };
  }
  if (!isRecord(input.payload)) {
    return { status: "invalid", reason: "malformed-payload" };
  }
  const capability = input.capability;
  const allowedPayloadKeys =
    capability === "search.personal"
      ? ["query"]
      : capability === "note.private"
        ? ["toolSlug"]
        : ["toolSlug", "desiredStackName", "targetStackId", "targetStackName"];
  const extraPayloadKeys = Object.keys(input.payload).filter(
    (key) => !allowedPayloadKeys.includes(key),
  );
  if (extraPayloadKeys.length > 0) {
    return { status: "invalid", reason: "unknown-payload-keys" };
  }
  let searchQuery: string | undefined;
  if (capability === "search.personal") {
    if (typeof input.payload.query !== "string") {
      return { status: "invalid", reason: "invalid-query" };
    }
    const query = input.payload.query.trim();
    if (
      !query ||
      query.length > MAX_PERSONAL_SEARCH_QUERY_LENGTH ||
      /[\u0000-\u001F]/.test(query)
    ) {
      return { status: "invalid", reason: "invalid-query" };
    }
    searchQuery = query;
  }
  const toolSlug =
    capability === "search.personal" ? "search" : parseToolSlug(input.payload.toolSlug);
  if (capability !== "search.personal" && !toolSlug) {
    return { status: "invalid", reason: "invalid-slug" };
  }
  let desiredStackName: string | undefined;
  let targetStackId: string | undefined;
  let targetStackName: string | undefined;
  if (capability === "stack.create") {
    desiredStackName = parseStackName(input.payload.desiredStackName);
    if (input.payload.desiredStackName !== undefined && desiredStackName === undefined) {
      return { status: "invalid", reason: "invalid-stack-name" };
    }
    const parsedTargetId = parseToolSlug(input.payload.targetStackId);
    if (input.payload.targetStackId !== undefined && !parsedTargetId) {
      return { status: "invalid", reason: "invalid-target-stack-id" };
    }
    targetStackId = parsedTargetId ?? undefined;
    targetStackName = parseStackName(input.payload.targetStackName);
    if (input.payload.targetStackName !== undefined && targetStackName === undefined) {
      return { status: "invalid", reason: "invalid-target-stack-name" };
    }
  }
  if (typeof input.returnTo !== "string" || !isSafeReturnTo(input.returnTo)) {
    return { status: "invalid", reason: "unsafe-return-to" };
  }
  if (typeof input.createdAt !== "string" || Number.isNaN(Date.parse(input.createdAt))) {
    return { status: "invalid", reason: "malformed-created-at" };
  }
  if (typeof input.expiresAt !== "string" || Number.isNaN(Date.parse(input.expiresAt))) {
    return { status: "invalid", reason: "malformed-expires-at" };
  }
  let origin: string | undefined;
  if (input.origin !== undefined) {
    if (typeof input.origin !== "string" || input.origin.length > MAX_ORIGIN_LENGTH) {
      return { status: "invalid", reason: "invalid-origin" };
    }
    origin = input.origin;
  }

  const intent: PendingAuthIntent = {
    version: PENDING_AUTH_INTENT_VERSION,
    id: input.id.trim(),
    capability,
    payload:
      capability === "search.personal"
        ? { query: searchQuery ?? "" }
        : capability === "note.private"
          ? { toolSlug: toolSlug as string }
          : {
              toolSlug: toolSlug as string,
              ...(desiredStackName ? { desiredStackName } : {}),
              ...(targetStackId ? { targetStackId } : {}),
              ...(targetStackName ? { targetStackName } : {}),
            },
    returnTo: input.returnTo.trim(),
    origin,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
  };

  if (Date.parse(intent.expiresAt) <= Date.now()) {
    return { status: "expired", intent };
  }
  return { status: "ready", intent };
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readConsumedLedger(): Record<string, number> {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !isRecord(parsed.ids)) return {};
    const now = Date.now();
    const ids: Record<string, number> = {};
    for (const [id, expiresAt] of Object.entries(parsed.ids)) {
      if (typeof expiresAt === "number" && expiresAt > now) {
        ids[id] = expiresAt;
      }
    }
    return ids;
  } catch {
    return {};
  }
}

function writeConsumedLedger(ids: Record<string, number>) {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (Object.keys(ids).length === 0) {
      storage.removeItem(PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY);
      return;
    }
    storage.setItem(
      PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY,
      JSON.stringify({ ids }),
    );
  } catch {
    // non-fatal
  }
}

function isIntentConsumed(id: string): boolean {
  if (consumedIds.has(id)) return true;
  return Object.prototype.hasOwnProperty.call(readConsumedLedger(), id);
}

function markIntentConsumed(id: string, expiresAtMs: number) {
  consumedIds.add(id);
  const ids = readConsumedLedger();
  ids[id] = expiresAtMs;
  writeConsumedLedger(ids);
}

function unmarkIntentConsumed(id: string) {
  consumedIds.delete(id);
  const ids = readConsumedLedger();
  delete ids[id];
  writeConsumedLedger(ids);
}

export function writePendingAuthIntent(input: {
  capability?: PendingAuthCapability;
  toolSlug?: string;
  query?: string;
  desiredStackName?: string;
  targetStackId?: string;
  targetStackName?: string;
  returnTo: string;
  origin?: string;
  nowMs?: number;
}): PendingAuthIntentRead {
  const nowMs = input.nowMs ?? Date.now();
  const createdAt = new Date(nowMs).toISOString();
  const expiresAt = new Date(nowMs + PENDING_AUTH_INTENT_TTL_MS).toISOString();
  const capability = input.capability ?? "stack.create";
  const parsed = parsePendingAuthIntent({
    version: PENDING_AUTH_INTENT_VERSION,
    id: createIntentId(),
    capability,
    payload:
      capability === "search.personal"
        ? { query: input.query ?? "" }
        : capability === "note.private"
          ? { toolSlug: input.toolSlug }
          : {
              toolSlug: input.toolSlug,
              desiredStackName: input.desiredStackName,
              targetStackId: input.targetStackId,
              targetStackName: input.targetStackName,
            },
    returnTo: input.returnTo,
    origin: input.origin,
    createdAt,
    expiresAt,
  });
  if (parsed.status !== "ready") {
    return parsed;
  }
  const storage = getStorage();
  if (!storage) {
    return { status: "invalid", reason: "storage-unavailable" };
  }
  try {
    const serialized = JSON.stringify(parsed.intent);
    if (new TextEncoder().encode(serialized).length > MAX_JSON_BYTES) {
      return { status: "invalid", reason: "oversized" };
    }
    storage.setItem(PENDING_AUTH_INTENT_STORAGE_KEY, serialized);
    return parsed;
  } catch {
    return { status: "invalid", reason: "storage-failure" };
  }
}

export function readPendingAuthIntent(): PendingAuthIntentRead {
  const storage = getStorage();
  if (!storage) {
    return { status: "empty" };
  }
  let raw: string | null;
  try {
    raw = storage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY);
  } catch {
    return { status: "invalid", reason: "storage-failure" };
  }
  if (!raw) {
    return { status: "empty" };
  }
  if (raw.length > MAX_JSON_BYTES) {
    clearPendingAuthIntent();
    return { status: "invalid", reason: "oversized" };
  }
  try {
    const parsed = parsePendingAuthIntent(JSON.parse(raw) as unknown);
    if (parsed.status === "invalid" || parsed.status === "expired") {
      clearPendingAuthIntent();
    }
    return parsed;
  } catch {
    clearPendingAuthIntent();
    return { status: "invalid", reason: "malformed" };
  }
}

export function clearPendingAuthIntent() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(PENDING_AUTH_INTENT_STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

export function consumePendingAuthIntent(): PendingAuthIntentRead {
  const read = readPendingAuthIntent();
  if (read.status === "empty") {
    return read;
  }
  if (read.status === "invalid" || read.status === "expired") {
    return read;
  }
  if (isIntentConsumed(read.intent.id)) {
    clearPendingAuthIntent();
    return { status: "empty" };
  }
  markIntentConsumed(read.intent.id, Date.parse(read.intent.expiresAt));
  clearPendingAuthIntent();
  return read;
}

export function restorePendingAuthIntent(intent: PendingAuthIntent): PendingAuthIntentRead {
  const parsed = parsePendingAuthIntent(intent);
  if (parsed.status !== "ready") {
    return parsed;
  }
  unmarkIntentConsumed(parsed.intent.id);
  const storage = getStorage();
  if (!storage) {
    return { status: "invalid", reason: "storage-unavailable" };
  }
  try {
    storage.setItem(PENDING_AUTH_INTENT_STORAGE_KEY, JSON.stringify(parsed.intent));
    return parsed;
  } catch {
    return { status: "invalid", reason: "storage-failure" };
  }
}

export function resetPendingAuthIntentConsumptionsForTests() {
  consumedIds.clear();
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(PENDING_AUTH_INTENT_CONSUMED_STORAGE_KEY);
  } catch {
    // non-fatal
  }
}
