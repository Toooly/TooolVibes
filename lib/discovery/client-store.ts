"use client";

import { useSyncExternalStore } from "react";

import { workspaceStateV1Schema } from "@/lib/discovery/schema";
import { mergeWorkspaceForSync } from "@/lib/discovery/workspace-sync";
import { WORKSPACE_STORAGE_KEY } from "@/lib/discovery/workspace-storage-keys";
import {
  commitCanonicalToolWorkspaceState,
  replaceToolWorkspaceStateFromCanonical,
} from "@/lib/stores/tool-workspace-store";
import {
  DISCOVERY_SYNC_EVENT,
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

function handleStorage(event: StorageEvent) {
  if (event.key === WORKSPACE_STORAGE_KEY && event.newValue) {
    try {
      const incoming = workspaceStateV1Schema.parse(JSON.parse(event.newValue));
      const previousParsed = event.oldValue
        ? workspaceStateV1Schema.safeParse(JSON.parse(event.oldValue))
        : null;
      const merged = previousParsed?.success
        ? mergeWorkspaceForSync(previousParsed.data, incoming)
        : incoming;
      const committed = commitCanonicalToolWorkspaceState(merged);
      replaceToolWorkspaceStateFromCanonical(committed.state);
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

  window.addEventListener("storage", handleStorage);
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
