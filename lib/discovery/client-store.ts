"use client";

import { useSyncExternalStore } from "react";

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

function ensureStoreInitialized() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  cachedSnapshot = getDiscoveryLocalSnapshot();

  window.addEventListener("storage", emitChange);
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
