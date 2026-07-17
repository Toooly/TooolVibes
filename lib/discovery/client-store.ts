"use client";

import { useSyncExternalStore } from "react";

import {
  getActiveWorkspaceOwner,
  isGuestWorkspaceStorageKey,
  workspaceStorageKeyForOwner,
} from "@/lib/discovery/workspace-owner-storage";
import {
  DISCOVERY_SYNC_EVENT,
  dispatchWorkspaceChange,
} from "@/lib/discovery/workspace-events";
import {
  refreshCanonicalToolWorkspaceStateFromStorage,
} from "@/lib/stores/tool-workspace-store";
import {
  getDiscoveryLocalSnapshot,
  type DiscoveryLocalSnapshot,
} from "@/lib/discovery/local-storage";

type Listener = () => void;

const listeners = new Set<Listener>();

const emptySnapshot: DiscoveryLocalSnapshot = {
  visitedTools: [],
  exploredCategories: [],
  shortlist: [],
  compare: [],
  shortlistStages: {},
  decisionMemories: {},
  toolStateMeta: {},
  compareMeta: {},
};

let cachedSnapshot = emptySnapshot;
let initialized = false;

function emitChange() {
  cachedSnapshot = getDiscoveryLocalSnapshot();
  listeners.forEach((listener) => listener());
}

export function handleWorkspaceStorageEvent(event: StorageEvent) {
  const activeOwner = getActiveWorkspaceOwner();
  const activeWorkspaceChanged = activeOwner.kind === "guest"
    ? isGuestWorkspaceStorageKey(event.key)
    : event.key === workspaceStorageKeyForOwner(activeOwner);
  if (activeWorkspaceChanged) {
    try {
      // A StorageEvent payload can already be stale when it is delivered.
      // Treat it only as an invalidation signal and reread the current durable
      // owner scope without writing it back through Zustand persist.
      refreshCanonicalToolWorkspaceStateFromStorage();
      dispatchWorkspaceChange({ source: "cross-tab", scope: "workspace" });
    } catch {
      // DATA-205 owns quarantine. A malformed storage event never replaces
      // the last valid in-memory snapshot.
    }
  }
  emitChange();
}

function ensureStoreInitialized() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  cachedSnapshot = getDiscoveryLocalSnapshot();

  window.addEventListener("storage", handleWorkspaceStorageEvent);
  window.addEventListener(DISCOVERY_SYNC_EVENT, emitChange);

  initialized = true;
}

function subscribe(listener: Listener) {
  ensureStoreInitialized();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  if (typeof window !== "undefined") {
    ensureStoreInitialized();
  }

  return cachedSnapshot;
}

function getServerSnapshot() {
  return emptySnapshot;
}

export function useDiscoverySnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
