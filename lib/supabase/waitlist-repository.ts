import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

type WaitlistRegistrationInput = {
  email: string;
  source: string;
  consentVersion: string;
};

function isWaitlistFlagEnabled() {
  return process.env.TOOOLVIBES_WAITLIST_ENABLED?.trim() !== "0";
}

export function isWaitlistRegistrationEnabled() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return isWaitlistFlagEnabled() && Boolean(url && serviceRoleKey);
}

export async function registerWaitlistEntry({
  email,
  source,
  consentVersion,
}: WaitlistRegistrationInput) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.rpc("register_waitlist_entry", {
    p_email: email,
    p_source: source,
    p_consent_version: consentVersion,
  });

  if (error) {
    throw new Error("WAITLIST_PERSISTENCE_ERROR", { cause: error });
  }

  if (typeof data !== "boolean") {
    throw new Error("WAITLIST_INVALID_RPC_RESPONSE");
  }

  return { created: data };
}
