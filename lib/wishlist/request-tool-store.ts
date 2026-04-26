import type { DirectoryToolLevel } from "@/lib/data/tooolvibes-directory";

export type ToolRequestInput = {
  toolName: string;
  toolUrl: string;
  category: string;
  level: DirectoryToolLevel;
  email?: string;
  message?: string;
};

export type StoredToolRequest = ToolRequestInput & {
  id: string;
  createdAt: string;
  status: "received";
};

const STORAGE_KEY = "tooolvibes_tool_requests_v1";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `request-${Date.now()}`;
}

export function getStoredToolRequests(): StoredToolRequest[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const value = storage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToolRequest(input: ToolRequestInput) {
  const storage = getStorage();

  if (!storage) {
    throw new Error("Storage non disponibile.");
  }

  const request: StoredToolRequest = {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
    status: "received",
  };
  const existing = getStoredToolRequests();
  const nextValue = [request, ...existing].slice(0, 50);

  storage.setItem(STORAGE_KEY, JSON.stringify(nextValue));

  return request;
}
