import { createClient } from "@supabase/supabase-js";

type BrowserSupabaseClient = ReturnType<typeof createClient>;
type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseRuntimeConfigResponse = {
  enabled?: boolean;
  url?: string | null;
  anonKey?: string | null;
};

let browserClient: BrowserSupabaseClient | null = null;
let runtimeConfig: BrowserSupabaseConfig | null = null;

function cleanEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getBuildTimeConfig(): BrowserSupabaseConfig | null {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return url && anonKey ? { url, anonKey } : null;
}

function getSupabaseBrowserConfig(): BrowserSupabaseConfig | null {
  return runtimeConfig ?? getBuildTimeConfig();
}

export function configureBrowserSupabaseClient(config: {
  url?: string | null;
  anonKey?: string | null;
}) {
  const url = cleanEnvValue(config.url ?? undefined);
  const anonKey = cleanEnvValue(config.anonKey ?? undefined);

  if (!url || !anonKey) {
    runtimeConfig = null;
    browserClient = null;
    return false;
  }

  const changed = runtimeConfig?.url !== url || runtimeConfig?.anonKey !== anonKey;
  runtimeConfig = { url, anonKey };

  if (changed) {
    browserClient = null;
  }

  return true;
}

export function isSupabaseBrowserEnabled() {
  return Boolean(getSupabaseBrowserConfig());
}

export async function loadBrowserSupabaseRuntimeConfig() {
  if (isSupabaseBrowserEnabled()) {
    return true;
  }

  try {
    const response = await fetch("/api/auth/config", {
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as SupabaseRuntimeConfigResponse;

    if (!payload.enabled) {
      return false;
    }

    return configureBrowserSupabaseClient({
      url: payload.url,
      anonKey: payload.anonKey,
    });
  } catch {
    return false;
  }
}

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const config = getSupabaseBrowserConfig();

  if (!config) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  browserClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
