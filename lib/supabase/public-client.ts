import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function isSupabasePublicEnabled() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(url && anonKey);
}

export function createPublicSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
