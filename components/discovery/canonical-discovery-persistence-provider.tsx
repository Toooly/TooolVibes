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
import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import { DISCOVERY_SYNC_EVENT } from "@/lib/discovery/local-storage";
import { hasWorkspaceData } from "@/lib/discovery/workspace-state";
import {
  applyCanonicalRemotePayload,
  getWorkspaceAttachSnapshot,
  requestWorkspaceSave,
} from "@/lib/discovery/workspace-sync-client";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import type {
  WorkspacePersistencePayload,
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

function parsePayload(value: unknown): WorkspacePersistencePayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<WorkspacePersistencePayload>;
  const state = workspaceStateV1Schema.safeParse(payload.data);
  const meta = payload.meta;
  if (!state.success || !meta ||
      (meta.mode !== "local" && meta.mode !== "remote") ||
      typeof meta.remote_available !== "boolean" ||
      (meta.revision !== undefined && meta.revision !== null && typeof meta.revision !== "string") ||
      (meta.conflict_retries !== undefined && !Number.isSafeInteger(meta.conflict_retries))) {
    return null;
  }
  return { data: state.data, meta };
}

export function DiscoveryPersistenceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAccount();
  const token = session?.access_token ?? null;
  const userId = session?.user.id ?? null;
  const [status, setStatus] = useState<PersistenceContextValue>({
    mode: "local", phase: "loading", remoteAvailable: false,
    viewerKind: "guest", lastSyncedAt: null,
  });
  const statusRef = useRef(status);
  const applyingRemoteRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef<WorkspaceStateV1 | null>(null);

  useEffect(() => { statusRef.current = status; }, [status]);

  const persist = useCallback(async (snapshot: WorkspaceStateV1) => {
    if (!token || !userId) {
      setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: "guest", lastSyncedAt: null });
      return;
    }
    inFlightRef.current = true;
    setStatus((current) => ({ ...current, phase: current.remoteAvailable ? "saving" : current.phase }));
    try {
      const result = await requestWorkspaceSave(token, snapshot, { maxConflictRetries: 1 });
      const payload = result.payload;
      if (!result.response.ok || !payload?.meta.remote_available) {
        setStatus((current) => ({ ...current, mode: "local", phase: result.response.status === 409 ? "error" : "local-only", remoteAvailable: false }));
        return;
      }
      applyingRemoteRef.current = true;
      applyCanonicalRemotePayload(payload, { owner: { kind: "account", userId }, reason: "save" });
      applyingRemoteRef.current = false;
      setStatus({ mode: "remote", phase: "synced", remoteAvailable: true, viewerKind: "account", lastSyncedAt: payload.meta.synced_at ?? new Date().toISOString() });
    } catch {
      setStatus((current) => ({ ...current, phase: current.remoteAvailable ? "error" : "local-only" }));
    } finally {
      inFlightRef.current = false;
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued) void persist(queued);
    }
  }, [token, userId]);

  const hydrate = useCallback(async () => {
    if (!token || !userId) {
      setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: "guest", lastSyncedAt: null });
      return;
    }
    const local = getWorkspaceAttachSnapshot(userId);
    const response = await fetch("/api/workspace-state", { cache: "no-store" });
    const payload = parsePayload(await response.json().catch(() => null));
    if (!response.ok || !payload?.meta.remote_available) {
      setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: "account", lastSyncedAt: null });
      return;
    }
    const merged = mergeWorkspaceForSync(payload.data, local);
    const shouldPush = JSON.stringify(merged) !== JSON.stringify(payload.data) &&
      (hasWorkspaceData(local) || hasWorkspaceData(payload.data));
    applyingRemoteRef.current = true;
    applyCanonicalRemotePayload({ ...payload, data: merged }, {
      owner: { kind: "account", userId }, reason: "hydrate",
    });
    applyingRemoteRef.current = false;
    setStatus({ mode: "remote", phase: shouldPush ? "saving" : "synced", remoteAvailable: true, viewerKind: "account", lastSyncedAt: payload.meta.synced_at ?? new Date().toISOString() });
    if (shouldPush) void persist(merged);
  }, [persist, token, userId]);

  useEffect(() => {
    void hydrate().catch(() => setStatus({ mode: "local", phase: "local-only", remoteAvailable: false, viewerKind: userId ? "account" : "guest", lastSyncedAt: null }));
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [hydrate, userId]);

  useEffect(() => {
    const accountUpdated = () => { void hydrate(); };
    window.addEventListener("tooolvibes:account-updated", accountUpdated);
    return () => window.removeEventListener("tooolvibes:account-updated", accountUpdated);
  }, [hydrate]);

  useEffect(() => {
    const changed = (event: Event) => {
      const source = event instanceof CustomEvent ? event.detail?.source : "local";
      if (source === "remote" || applyingRemoteRef.current) return;
      if (statusRef.current.mode !== "remote" || !statusRef.current.remoteAvailable) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        const snapshot = getWorkspaceAttachSnapshot(userId ?? undefined);
        if (inFlightRef.current) queuedRef.current = snapshot;
        else void persist(snapshot);
      }, 420);
    };
    window.addEventListener(DISCOVERY_SYNC_EVENT, changed);
    return () => window.removeEventListener(DISCOVERY_SYNC_EVENT, changed);
  }, [persist, userId]);

  const value = useMemo(() => status, [status]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDiscoveryPersistence() {
  return useContext(Context);
}
