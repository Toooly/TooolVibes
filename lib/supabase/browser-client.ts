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
const RUNTIME_CONFIG_TIMEOUT_MS = 6_000;

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

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    RUNTIME_CONFIG_TIMEOUT_MS,
  );

  try {
    const response = await fetch("/api/auth/config", {
      cache: "no-store",
      signal: controller.signal,
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
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const config = getSupabaseBrowserConfig();

  if (!config) {
    throw new Error("L'accesso all'account non è configurato.");
  }

  browserClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });

  return browserClient;
}
