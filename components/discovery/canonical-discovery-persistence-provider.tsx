"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccount } from "@/components/account/account-provider";
import { hasWorkspaceData } from "@/lib/discovery/workspace-state";
import {
  applyCanonicalRemotePayload,
  getWorkspaceAttachSnapshot,
  parseWorkspacePersistencePayload,
  requestWorkspaceSave,
} from "@/lib/discovery/workspace-sync-client";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import {
  DISCOVERY_SYNC_EVENT,
  readWorkspaceChangeDetail,
} from "@/lib/discovery/workspace-events";
import type {
  DiscoveryPersistencePhase,
  ViewerKind,
  WorkspaceStateV1,
} from "@/lib/discovery/types";

type PersistenceContextValue = {
  mode: "local" | "remote";
  phase: DiscoveryPersistencePhase;
  remoteAvailable: boolean;
  viewerKind?: ViewerKind;
  lastSyncedAt?: string | null;
};

const Context = createContext<PersistenceContextValue>({
  mode: "local",
  phase: "idle",
  remoteAvailable: false,
  viewerKind: "guest",
  lastSyncedAt: null,
});

export function DiscoveryPersistenceProvider({ children }: { children: React.ReactNode }) {
  const { session, isAttaching, workspaceAttachPending } = useAccount();
  const token = session?.access_token ?? null;
  const userId = session?.user.id ?? null;
  const syncBlocked = isAttaching || workspaceAttachPending;
  const syncIdentity = token && userId && !syncBlocked
    ? `${userId}:${token}`
    : null;
  const [status, setStatus] = useState<PersistenceContextValue>({
    mode: "local", phase: "loading", remoteAvailable: false,
    viewerKind: "guest", lastSyncedAt: null,
  });
  const identityRef = useRef<string | null>(syncIdentity);
  const applyingRemoteRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef<{
    identity: string;
    requestId: symbol;
  } | null>(null);
  const queuedRef = useRef<{
    identity: string;
    state: WorkspaceStateV1;
  } | null>(null);

  identityRef.current = syncIdentity;

  const persist = useCallback(async (snapshot: WorkspaceStateV1) => {
    if (!token || !userId || syncBlocked) {
      if (!token || !userId) {
        setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: "guest", lastSyncedAt: null });
      }
      return;
    }

    const identity = `${userId}:${token}`;
    if (identityRef.current !== identity) return;
    if (inFlightRef.current?.identity === identity) {
      queuedRef.current = { identity, state: snapshot };
      return;
    }

    const requestId = Symbol("workspace-save");
    inFlightRef.current = { identity, requestId };
    setStatus((current) => ({
      ...current,
      phase: "saving",
      viewerKind: "account",
    }));
    try {
      const result = await requestWorkspaceSave(token, snapshot, { maxConflictRetries: 1 });
      if (identityRef.current !== identity) return;
      const payload = result.payload;
      if (!result.response.ok || !payload?.meta.remote_available ||
          payload.meta.mode !== "remote" ||
          payload.meta.viewer_kind !== "account") {
        const retryable = result.response.status === 409 || result.response.status >= 500;
        setStatus((current) => ({
          ...current,
          mode: "local",
          phase: retryable ? "error" : "local-only",
          remoteAvailable: false,
          viewerKind: "account",
        }));
        return;
      }
      applyingRemoteRef.current = true;
      try {
        const applied = applyCanonicalRemotePayload(payload, {
          owner: { kind: "account", userId },
          reason: "save",
          baseState: snapshot,
        });
        if (applied.recoveryRequired) {
          setStatus({
            mode: "remote",
            phase: "error",
            remoteAvailable: true,
            viewerKind: "account",
            lastSyncedAt: payload.meta.synced_at ?? null,
          });
          return;
        }
      } finally {
        applyingRemoteRef.current = false;
      }
      setStatus({ mode: "remote", phase: "synced", remoteAvailable: true, viewerKind: "account", lastSyncedAt: payload.meta.synced_at ?? new Date().toISOString() });
    } catch {
      if (identityRef.current === identity) {
        setStatus((current) => ({
          ...current,
          mode: "local",
          phase: "error",
          remoteAvailable: false,
          viewerKind: "account",
        }));
      }
    } finally {
      if (inFlightRef.current?.requestId === requestId) {
        inFlightRef.current = null;
        const queued = queuedRef.current;
        queuedRef.current = null;
        if (queued?.identity === identity && identityRef.current === identity) {
          void persist(queued.state);
        }
      }
    }
  }, [syncBlocked, token, userId]);

  const hydrate = useCallback(async () => {
    if (!token || !userId) {
      setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: "guest", lastSyncedAt: null });
      return;
    }
    if (syncBlocked) {
      setStatus({ mode: "local", phase: "loading", remoteAvailable: false, viewerKind: "account", lastSyncedAt: null });
      return;
    }

    const identity = `${userId}:${token}`;
    if (identityRef.current !== identity) return;
    setStatus({ mode: "local", phase: "loading", remoteAvailable: false, viewerKind: "account", lastSyncedAt: null });

    try {
      const local = getWorkspaceAttachSnapshot(userId);
      const response = await fetch("/api/workspace-state", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = parseWorkspacePersistencePayload(
        await response.json().catch(() => null),
      );
      if (identityRef.current !== identity) return;
      if (!response.ok || !payload?.meta.remote_available ||
          payload.meta.mode !== "remote" ||
          payload.meta.viewer_kind !== "account") {
        setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: "account", lastSyncedAt: null });
        return;
      }
      const merged = mergeWorkspaceForSync(payload.data, local);
      const shouldPush = JSON.stringify(merged) !== JSON.stringify(payload.data) &&
        (hasWorkspaceData(local) || hasWorkspaceData(payload.data));
      applyingRemoteRef.current = true;
      try {
        const applied = applyCanonicalRemotePayload({ ...payload, data: merged }, {
          owner: { kind: "account", userId },
          reason: "hydrate",
          baseState: local,
        });
        if (applied.recoveryRequired) {
          setStatus({
            mode: "remote",
            phase: "error",
            remoteAvailable: true,
            viewerKind: "account",
            lastSyncedAt: payload.meta.synced_at ?? null,
          });
          return;
        }
      } finally {
        applyingRemoteRef.current = false;
      }
      setStatus({ mode: "remote", phase: shouldPush ? "saving" : "synced", remoteAvailable: true, viewerKind: "account", lastSyncedAt: payload.meta.synced_at ?? new Date().toISOString() });
      if (shouldPush) void persist(merged);
    } catch {
      if (identityRef.current === identity) {
        setStatus({ mode: "local", phase: "error", remoteAvailable: false, viewerKind: "account", lastSyncedAt: null });
      }
    }
  }, [persist, syncBlocked, token, userId]);

  useEffect(() => {
    queuedRef.current = null;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void hydrate();
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hydrate]);

  useEffect(() => {
    const changed = (event: Event) => {
      const detail = readWorkspaceChangeDetail(event);
      if (!detail || detail.source === "remote" || detail.scope !== "workspace" ||
          applyingRemoteRef.current || !syncIdentity || !userId) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const snapshot = getWorkspaceAttachSnapshot(userId);
        void persist(snapshot);
      }, 420);
    };
    window.addEventListener(DISCOVERY_SYNC_EVENT, changed);
    return () => window.removeEventListener(DISCOVERY_SYNC_EVENT, changed);
  }, [persist, syncIdentity, userId]);

  const value = useMemo(() => status, [status]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDiscoveryPersistence() {
  return useContext(Context);
}
