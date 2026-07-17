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

type GuestWorkspaceClaim = {
  formatVersion: 1;
  status: "pending" | "complete";
  claimedBy: string;
  claimedAt: string;
  guestRaw: string;
  maskedRaw: string;
  completedAt?: string;
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

function readGuestWorkspaceClaimEnvelope(
  storage: StorageLike,
): GuestWorkspaceClaim | null {
  const value = readJson(storage, WORKSPACE_GUEST_CLAIM_KEY) as
    | Partial<GuestWorkspaceClaim>
    | null;
  return value?.formatVersion === 1 &&
      (value.status === "pending" || value.status === "complete") &&
      typeof value.claimedBy === "string" && value.claimedBy.length > 0 &&
      value.claimedBy.length <= 160 && typeof value.claimedAt === "string" &&
      typeof value.guestRaw === "string" &&
      (value.maskedRaw === undefined || typeof value.maskedRaw === "string")
    ? {
        ...value,
        maskedRaw: value.maskedRaw ?? value.guestRaw,
      } as GuestWorkspaceClaim
    : null;
}

export function readGuestWorkspaceClaim(storage: StorageLike) {
  const claim = readGuestWorkspaceClaimEnvelope(storage);
  return claim?.status === "pending" ? claim : null;
}

export function putGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
  guestRaw: string,
  maskedRaw = guestRaw,
) {
  const existing = readGuestWorkspaceClaim(storage);
  if (existing) return existing.claimedBy === userId ? existing : null;
  const claim: GuestWorkspaceClaim = {
    formatVersion: 1,
    status: "pending",
    claimedBy: userId,
    claimedAt: new Date().toISOString(),
    guestRaw,
    maskedRaw,
  };
  return writeVerified(storage, WORKSPACE_GUEST_CLAIM_KEY, claim)
    ? claim
    : null;
}

export function completeGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
) {
  const claim = readGuestWorkspaceClaim(storage);
  if (!claim || claim.claimedBy !== userId) return !claim;
  return writeVerified(storage, WORKSPACE_GUEST_CLAIM_KEY, {
    ...claim,
    status: "complete",
    completedAt: new Date().toISOString(),
  } satisfies GuestWorkspaceClaim);
}

export function releaseGuestWorkspaceClaim(
  storage: StorageLike,
  userId: string,
) {
  const claim = readGuestWorkspaceClaim(storage);
  if (!claim || claim.claimedBy !== userId) return !claim;
  return writeVerified(storage, WORKSPACE_GUEST_CLAIM_KEY, {
    ...claim,
    status: "complete",
    // A released claim must not hide the guest snapshot restored on logout.
    // Canonical workspace JSON can never equal this sentinel.
    maskedRaw: "__tooolvibes_guest_claim_released__",
    completedAt: new Date().toISOString(),
  } satisfies GuestWorkspaceClaim);
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
        const claim = readGuestWorkspaceClaimEnvelope(storage);
        if (!markerPresent &&
            (key === WORKSPACE_STORAGE_KEY || legacyKeys.has(key))) {
          return null;
        }
        if (claim && legacyKeys.has(key)) return null;
        if (key === WORKSPACE_STORAGE_KEY && claim) {
          const overlayRaw = storage.getItem(WORKSPACE_GUEST_OVERLAY_KEY);
          return claim.maskedRaw === overlayRaw ? null : overlayRaw;
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
        const claim = readGuestWorkspaceClaimEnvelope(storage);
        storage.setItem(
          key === WORKSPACE_STORAGE_KEY && claim
            ? WORKSPACE_GUEST_OVERLAY_KEY
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
