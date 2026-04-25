import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/supabase/env";

export function createAdminSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
