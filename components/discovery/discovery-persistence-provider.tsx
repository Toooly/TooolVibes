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

import {
  applyDiscoveryWorkspaceState,
  getLocalDiscoveryWorkspaceState,
} from "@/lib/discovery/local-storage";
import type {
  DiscoveryPersistencePhase,
  DiscoveryWorkspaceState,
  ViewerKind,
} from "@/lib/discovery/types";
import {
  hasDiscoveryWorkspaceData,
  mergeDiscoveryWorkspaceStates,
  normalizeDiscoveryWorkspaceState,
} from "@/lib/discovery/workspace-state";

type DiscoveryPersistenceContextValue = {
  mode: "local" | "remote";
  phase: DiscoveryPersistencePhase;
  remoteAvailable: boolean;
  viewerKind?: ViewerKind;
  lastSyncedAt?: string | null;
};

const DiscoveryPersistenceContext = createContext<DiscoveryPersistenceContextValue>({
  mode: "local",
  phase: "idle",
  remoteAvailable: false,
  viewerKind: "guest",
  lastSyncedAt: null,
});

async function parsePersistenceResponse(response: Response) {
  const payload = (await response.json()) as {
    data?: DiscoveryWorkspaceState;
    meta?: {
      mode?: "local" | "remote";
      remote_available?: boolean;
      viewer_kind?: ViewerKind;
      synced_at?: string | null;
    };
  };

  return {
    data: normalizeDiscoveryWorkspaceState(payload.data),
    meta: payload.meta,
  };
}

export function DiscoveryPersistenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<DiscoveryPersistenceContextValue>({
    mode: "local",
    phase: "loading",
    remoteAvailable: false,
    viewerKind: "guest",
    lastSyncedAt: null,
  });

  const statusRef = useRef(status);
  const isApplyingRemoteRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSnapshotRef = useRef<DiscoveryWorkspaceState | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const persistSnapshot = useCallback(async (snapshot: DiscoveryWorkspaceState) => {
    saveInFlightRef.current = true;
    setStatus((current) => ({
      ...current,
      phase: current.remoteAvailable ? "saving" : current.phase,
    }));

    try {
      const response = await fetch("/api/discovery-state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(snapshot),
      });

      const payload = await parsePersistenceResponse(response);

      if (!response.ok || !payload.meta?.remote_available) {
        setStatus({
          mode: "local",
          phase: "local-only",
          remoteAvailable: false,
          viewerKind: payload.meta?.viewer_kind ?? "guest",
          lastSyncedAt: payload.meta?.synced_at ?? null,
        });
        return;
      }

      isApplyingRemoteRef.current = true;
      applyDiscoveryWorkspaceState(payload.data, { source: "remote" });
      isApplyingRemoteRef.current = false;

      setStatus({
        mode: "remote",
        phase: "synced",
        remoteAvailable: true,
        viewerKind: payload.meta.viewer_kind ?? "guest",
        lastSyncedAt: payload.meta.synced_at ?? new Date().toISOString(),
      });
    } catch {
      setStatus((current) => ({
        ...current,
        phase: current.remoteAvailable ? "error" : "local-only",
      }));
    } finally {
      saveInFlightRef.current = false;

      if (queuedSnapshotRef.current) {
        const nextSnapshot = queuedSnapshotRef.current;
        queuedSnapshotRef.current = null;
        void persistSnapshot(nextSnapshot);
      }
    }
  }, []);

  const hydrateFromRemote = useCallback(async () => {
    const localSnapshot = getLocalDiscoveryWorkspaceState();

    const response = await fetch("/api/discovery-state", {
      cache: "no-store",
    });

    const payload = await parsePersistenceResponse(response);

    if (!response.ok || !payload.meta?.remote_available) {
      setStatus({
        mode: "local",
        phase: "local-only",
        remoteAvailable: false,
        viewerKind: payload.meta?.viewer_kind ?? "guest",
        lastSyncedAt: payload.meta?.synced_at ?? null,
      });
      return;
    }

    const mergedState = mergeDiscoveryWorkspaceStates(localSnapshot, payload.data);
    const shouldPushMergedState =
      JSON.stringify(mergedState) !== JSON.stringify(payload.data) &&
      (hasDiscoveryWorkspaceData(localSnapshot) || hasDiscoveryWorkspaceData(payload.data));

    isApplyingRemoteRef.current = true;
    applyDiscoveryWorkspaceState(mergedState, { source: "remote" });
    isApplyingRemoteRef.current = false;

    setStatus({
      mode: "remote",
      phase: shouldPushMergedState ? "saving" : "synced",
      remoteAvailable: true,
      viewerKind: payload.meta.viewer_kind ?? "guest",
      lastSyncedAt: payload.meta.synced_at ?? new Date().toISOString(),
    });

    if (shouldPushMergedState) {
      void persistSnapshot(mergedState);
    }
  }, [persistSnapshot]);

  useEffect(() => {
    let cancelled = false;

    async function hydratePersistence() {
      try {
        await hydrateFromRemote();

        if (cancelled) {
          return;
        }
      } catch {
        if (!cancelled) {
          setStatus({
            mode: "local",
            phase: "local-only",
            remoteAvailable: false,
            viewerKind: "guest",
            lastSyncedAt: null,
          });
        }
      }
    }

    void hydratePersistence();

    return () => {
      cancelled = true;

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [hydrateFromRemote]);

  useEffect(() => {
    function handleAccountUpdated() {
      void hydrateFromRemote();
    }

    window.addEventListener("tooolvibes:account-updated", handleAccountUpdated);

    return () => {
      window.removeEventListener("tooolvibes:account-updated", handleAccountUpdated);
    };
  }, [hydrateFromRemote]);

  useEffect(() => {
    function handleDiscoverySync(event: Event) {
      const source =
        event instanceof CustomEvent && event.detail?.source
          ? (event.detail.source as "local" | "remote")
          : "local";

      if (source === "remote" || isApplyingRemoteRef.current) {
        return;
      }

      const currentStatus = statusRef.current;

      if (currentStatus.mode !== "remote" || !currentStatus.remoteAvailable) {
        return;
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        const snapshot = getLocalDiscoveryWorkspaceState();

        if (saveInFlightRef.current) {
          queuedSnapshotRef.current = snapshot;
          return;
        }

        void persistSnapshot(snapshot);
      }, 420);
    }

    window.addEventListener("tooolvibes:discovery-sync", handleDiscoverySync);

    return () => {
      window.removeEventListener("tooolvibes:discovery-sync", handleDiscoverySync);
    };
  }, [persistSnapshot]);

  const value = useMemo(() => status, [status]);

  return (
    <DiscoveryPersistenceContext.Provider value={value}>
      {children}
    </DiscoveryPersistenceContext.Provider>
  );
}

export function useDiscoveryPersistence() {
  return useContext(DiscoveryPersistenceContext);
}
