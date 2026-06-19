import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  if (!url || !anonKey) {
    throw new Error("L'archivio pubblico non è configurato.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method may be called from a Server Component where
          // the cookies API is read-only. Swallow the error to avoid breaking
          // the request; mutations should be performed in Server Actions.
        }
      },
    },
  });
}
