import type { DirectoryToolLevel } from "@/lib/data/tooolvibes-directory";
import {
  getBrowserSupabaseClient,
  isSupabaseBrowserEnabled,
} from "@/lib/supabase/browser-client";

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
  storage: "local" | "supabase";
};

type SupabaseInsertClient = {
  from: (table: "tool_requests") => {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
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

function createStoredRequest(input: ToolRequestInput, storage: StoredToolRequest["storage"]) {
  return {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
    status: "received" as const,
    storage,
  };
}

function saveToolRequestLocally(input: ToolRequestInput) {
  const storage = getStorage();

  if (!storage) {
    throw new Error("Storage non disponibile.");
  }

  const request = createStoredRequest(input, "local");
  const existing = getStoredToolRequests();
  const nextValue = [request, ...existing].slice(0, 50);

  storage.setItem(STORAGE_KEY, JSON.stringify(nextValue));

  return request;
}

async function saveToolRequestViaApi(input: ToolRequestInput) {
  const response = await fetch("/api/tool-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("API request failed.");
  }

  const payload = (await response.json()) as {
    request?: {
      id?: string;
      created_at?: string;
      status?: StoredToolRequest["status"];
    };
  };

  return {
    ...input,
    id: payload.request?.id ?? createId(),
    createdAt: payload.request?.created_at ?? new Date().toISOString(),
    status: "received" as const,
    storage: "supabase" as const,
  };
}

export async function saveToolRequest(input: ToolRequestInput) {
  try {
    return await saveToolRequestViaApi(input);
  } catch {
    // Fallback for local/dev setups where the server route is not wired to Supabase yet.
  }

  if (isSupabaseBrowserEnabled()) {
    const supabase = getBrowserSupabaseClient() as unknown as SupabaseInsertClient;
    const request = createStoredRequest(input, "supabase");
    const { error } = await supabase
      .from("tool_requests")
      .insert({
        id: request.id,
        tool_name: input.toolName,
        tool_url: input.toolUrl,
        category: input.category,
        level: input.level,
        email: input.email ?? null,
        message: input.message ?? null,
        created_at: request.createdAt,
      });

    if (!error) {
      return request;
    }
  }

  return saveToolRequestLocally(input);
}
