import { createClient } from "@supabase/supabase-js";

type BrowserSupabaseClient = ReturnType<typeof createClient>;

let browserClient: BrowserSupabaseClient | null = null;

function cleanEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function isSupabaseBrowserEnabled() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return Boolean(url && anonKey);
}

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
