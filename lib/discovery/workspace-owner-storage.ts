import {
  LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS,
  WORKSPACE_ACCOUNT_STORAGE_PREFIX,
  WORKSPACE_GUEST_CLAIM_KEY,
  WORKSPACE_GUEST_OVERLAY_KEY,
  WORKSPACE_LEGACY_BACKUP_KEY,
  WORKSPACE_MIGRATION_STATUS_KEY,
  WORKSPACE_OWNER_MARKER_KEY,
  WORKSPACE_QUARANTINE_KEY,
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_SYNC_PREVIOUS_KEY,
  WORKSPACE_SYNC_RECOVERY_KEY,
} from "@/lib/discovery/workspace-storage-keys";

export type WorkspaceOwner =
  | { kind: "guest" }
  | { kind: "account"; userId: string };

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type GuestWorkspaceClaim = {
  formatVersion: 2;
  status: "pending" | "complete";
  claimedBy: string;
  claimedAt: string;
  sourceGeneration: number;
  guestRaw: string;
  accountBaseRaw: string;
  stagedRaw: string;
  completedAt?: string;
  released?: boolean;
};

type GuestWorkspaceClaimLedger = {
  formatVersion: 2;
  activeGeneration: number;
  claims: Record<string, GuestWorkspaceClaim>;
};

type LegacyGuestWorkspaceClaim = {
  formatVersion?: unknown;
  status?: unknown;
  claimedBy?: unknown;
  claimedAt?: unknown;
  guestRaw?: unknown;
  completedAt?: unknown;
};

type GuestOwnerMarker = {
  formatVersion: 1;
  owner: "guest";
};

const accountMetadataKeys = new Set([
  WORKSPACE_LEGACY_BACKUP_KEY,
  WORKSPACE_MIGRATION_STATUS_KEY,
  WORKSPACE_QUARANTINE_KEY,
  WORKSPACE_SYNC_PREVIOUS_KEY,
  WORKSPACE_SYNC_RECOVERY_KEY,
]);
const legacyKeys = new Set<string>(LEGACY_WORKSPACE_BACKUP_STORAGE_KEYS);
let activeOwner: WorkspaceOwner = { kind: "guest" };

function accountSuffix(userId: string) {
  return encodeURIComponent(userId.trim().slice(0, 160));
}

function validUserId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 160;
}

function readJson(storage: StorageLike, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeVerified(storage: StorageLike, key: string, value: unknown) {
  const raw = JSON.stringify(value);
  try {
    storage.setItem(key, raw);
    return storage.getItem(key) === raw;
  } catch {
    return false;
  }
}

function validClaim(value: unknown): value is GuestWorkspaceClaim {
  if (!value || typeof value !== "object") return false;
  const claim = value as Partial<GuestWorkspaceClaim>;
  return claim.formatVersion === 2 &&
    (claim.status === "pending" || claim.status === "complete") &&
    validUserId(claim.claimedBy) &&
    typeof claim.claimedAt === "string" &&
    Number.isSafeInteger(claim.sourceGeneration) &&
    (claim.sourceGeneration ?? -1) >= 0 &&
    typeof claim.guestRaw === "string" &&
    typeof claim.accountBaseRaw === "string" &&
    typeof claim.stagedRaw === "string";
}

function emptyClaimLedger(): GuestWorkspaceClaimLedger {
  return { formatVersion: 2, activeGeneration: 0, claims: {} };
}

function readGuestWorkspaceClaimLedger(
  storage: StorageLike,
): GuestWorkspaceClaimLedger {
  const value = readJson(storage, WORKSPACE_GUEST_CLAIM_KEY);
  if (value && typeof value === "object") {
    const ledger = value as Partial<GuestWorkspaceClaimLedger>;
    if (ledger.formatVersion === 2 &&
        Number.isSafeInteger(ledger.activeGeneration) &&
        (ledger.activeGeneration ?? -1) >= 0 &&
        ledger.claims && typeof ledger.claims === "object") {
      const claims = Object.fromEntries(
        Object.entries(ledger.claims).filter(
          ([userId, claim]) => validUserId(userId) && validClaim(claim) &&
            claim.claimedBy === userId,
        ),
      );
      return {
        formatVersion: 2,
        activeGeneration: ledger.activeGeneration as number,
        claims,
      };
    }

    // Compatibility with the short-lived format-v1 claim. Its first overlay
    // is generation 1; account/staged snapshots were not recorded yet.
    const legacy = value as LegacyGuestWorkspaceClaim;
    if (legacy.formatVersion === 1 &&
        (legacy.status === "pending" || legacy.status === "complete") &&
        validUserId(legacy.claimedBy) &&
        typeof legacy.claimedAt === "string" &&
        typeof legacy.guestRaw === "string") {
      const claim: GuestWorkspaceClaim = {
        formatVersion: 2,
        status: legacy.status,
        claimedBy: legacy.claimedBy,
        claimedAt: legacy.claimedAt,
        sourceGeneration: 0,
        guestRaw: legacy.guestRaw,
        accountBaseRaw: "",
        stagedRaw: "",
        completedAt: typeof legacy.completedAt === "string"
          ? legacy.completedAt
          : undefined,
      };
      return {
        formatVersion: 2,
        activeGeneration: 1,
        claims: { [claim.claimedBy]: claim },
      };
    }
  }
  return emptyClaimLedger();
}

export function guestWorkspaceGenerationKey(generation: number) {
  if (generation <= 0) return WORKSPACE_STORAGE_KEY;
  if (generation === 1) return WORKSPACE_GUEST_OVERLAY_KEY;
  return `${WORKSPACE_GUEST_OVERLAY_KEY}:${generation}`;
}

export function isGuestWorkspaceStorageKey(key: string | null) {
  return key === WORKSPACE_STORAGE_KEY ||
    key === WORKSPACE_GUEST_CLAIM_KEY ||
    key === WORKSPACE_GUEST_OVERLAY_KEY ||
    Boolean(key?.startsWith(`${WORKSPACE_GUEST_OVERLAY_KEY}:`));
}

export function hasGuestWorkspaceOwnerMarker(storage: StorageLike) {
  const value = readJson(storage, WORKSPACE_OWNER_MARKER_KEY) as
    | Partial<GuestOwnerMarker>
    | null;
  return value?.formatVersion === 1 && value.owner === "guest";
}

export function markGuestWorkspaceOwner(storage: StorageLike) {
  return writeVerified(storage, WORKSPACE_OWNER_MARKER_KEY, {
    formatVersion: 1,
    owner: "guest",
  } satisfies GuestOwnerMarker);
}

export function readGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
) {
  const claim = readGuestWorkspaceClaimLedger(storage).claims[userId];
  return claim?.status === "pending" ? claim : null;
}

export function putGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
  guestRaw: string,
  options: { accountBaseRaw: string; stagedRaw: string },
) {
  const ledger = readGuestWorkspaceClaimLedger(storage);
  const existing = ledger.claims[userId];
  if (existing?.status === "pending") return existing;

  const sourceGeneration = ledger.activeGeneration;
  const sourceKey = guestWorkspaceGenerationKey(sourceGeneration);
  try {
    if (storage.getItem(sourceKey) !== guestRaw) return null;
  } catch {
    return null;
  }

  const claim: GuestWorkspaceClaim = {
    formatVersion: 2,
    status: "pending",
    claimedBy: userId,
    claimedAt: new Date().toISOString(),
    sourceGeneration,
    guestRaw,
    accountBaseRaw: options.accountBaseRaw,
    stagedRaw: options.stagedRaw,
  };
  const next: GuestWorkspaceClaimLedger = {
    formatVersion: 2,
    activeGeneration: sourceGeneration + 1,
    claims: { ...ledger.claims, [userId]: claim },
  };
  return writeVerified(storage, WORKSPACE_GUEST_CLAIM_KEY, next)
    ? readGuestWorkspaceClaim(storage, userId)
    : null;
}

function settleGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
  released: boolean,
) {
  const ledger = readGuestWorkspaceClaimLedger(storage);
  const claim = ledger.claims[userId];
  if (!claim || claim.status !== "pending") return true;
  const complete: GuestWorkspaceClaim = {
    ...claim,
    status: "complete",
    completedAt: new Date().toISOString(),
    released,
  };
  return writeVerified(storage, WORKSPACE_GUEST_CLAIM_KEY, {
    ...ledger,
    claims: { ...ledger.claims, [userId]: complete },
  } satisfies GuestWorkspaceClaimLedger);
}

export function completeGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
) {
  return settleGuestWorkspaceClaim(storage, userId, false);
}

export function releaseGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
) {
  return settleGuestWorkspaceClaim(storage, userId, true);
}

export function workspaceStorageKeyForOwner(owner: WorkspaceOwner) {
  return owner.kind === "guest"
    ? WORKSPACE_STORAGE_KEY
    : `${WORKSPACE_ACCOUNT_STORAGE_PREFIX}${accountSuffix(owner.userId)}`;
}

function scopedKey(key: string, owner: WorkspaceOwner) {
  if (owner.kind === "guest") return key;
  if (key === WORKSPACE_STORAGE_KEY) return workspaceStorageKeyForOwner(owner);
  if (accountMetadataKeys.has(key)) {
    return `${key}:account:${accountSuffix(owner.userId)}`;
  }
  return key;
}

export function scopeWorkspaceStorage(
  storage: StorageLike,
  owner: WorkspaceOwner,
): StorageLike {
  if (owner.kind === "guest") {
    return {
      getItem(key) {
        const markerPresent = hasGuestWorkspaceOwnerMarker(storage);
        const ledger = readGuestWorkspaceClaimLedger(storage);
        if (!markerPresent &&
            (key === WORKSPACE_STORAGE_KEY || legacyKeys.has(key))) {
          return null;
        }
        if (ledger.activeGeneration > 0 && legacyKeys.has(key)) return null;
        if (key === WORKSPACE_STORAGE_KEY) {
          return storage.getItem(
            guestWorkspaceGenerationKey(ledger.activeGeneration),
          );
        }
        return storage.getItem(key);
      },
      setItem(key, value) {
        if (key === WORKSPACE_STORAGE_KEY &&
            !hasGuestWorkspaceOwnerMarker(storage)) {
          throw new DOMException(
            "Guest workspace ownership has not been initialized.",
            "InvalidStateError",
          );
        }
        const ledger = readGuestWorkspaceClaimLedger(storage);
        storage.setItem(
          key === WORKSPACE_STORAGE_KEY
            ? guestWorkspaceGenerationKey(ledger.activeGeneration)
            : key,
          value,
        );
      },
    };
  }
  return {
    getItem(key) {
      if (legacyKeys.has(key)) return null;
      return storage.getItem(scopedKey(key, owner));
    },
    setItem(key, value) {
      if (legacyKeys.has(key)) return;
      storage.setItem(scopedKey(key, owner), value);
    },
  };
}

export function getActiveWorkspaceOwner(): WorkspaceOwner {
  return activeOwner.kind === "guest"
    ? { kind: "guest" }
    : { ...activeOwner };
}

export function setActiveWorkspaceOwner(owner: WorkspaceOwner) {
  activeOwner = owner.kind === "guest"
    ? { kind: "guest" }
    : { kind: "account", userId: owner.userId };
}

export function workspaceOwnersMatch(
  left: WorkspaceOwner,
  right: WorkspaceOwner,
) {
  return left.kind === right.kind &&
    (left.kind === "guest" ||
      (right.kind === "account" && left.userId === right.userId));
}
