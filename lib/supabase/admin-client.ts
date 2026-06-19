import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import { createTimeoutFetch } from "@/lib/utils/timeout-fetch";

export function createAdminSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  if (!url || !serviceRoleKey) {
    throw new Error("Il salvataggio dell'area admin non è configurato.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: createTimeoutFetch(),
    },
  });
}
