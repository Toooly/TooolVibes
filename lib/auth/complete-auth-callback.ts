import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

import { mapAuthProviderError } from "@/lib/auth/auth-messages";

type AuthClient = Pick<SupabaseClient, "auth">;

export async function completeAuthCallback(
  client: AuthClient,
  input: { search: string; hash: string },
): Promise<{ ok: boolean; message: string }> {
  const searchParams = new URLSearchParams(
    input.search.startsWith("?") ? input.search.slice(1) : input.search,
  );
  const hashParams = new URLSearchParams(input.hash.replace(/^#/, ""));
  const authError =
    searchParams.get("error_description") ??
    searchParams.get("error") ??
    hashParams.get("error_description") ??
    hashParams.get("error");

  if (authError) {
    return { ok: false, message: mapAuthProviderError(authError) };
  }

  const code = searchParams.get("code");

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      return { ok: true, message: "Accesso completato." };
    }

    const existing = await client.auth.getSession();
    if (existing?.data?.session?.user) {
      return { ok: true, message: "Accesso completato." };
    }

    return { ok: false, message: mapAuthProviderError(error) };
  }

  const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return {
        ok: false,
        message:
          "Non sono riuscito a verificare il link. Apri l'ultima email ricevuta o richiedine una nuova.",
      };
    }

    return { ok: true, message: "Accesso completato." };
  }

  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return {
        ok: false,
        message:
          "Non siamo riusciti a salvare l'accesso. Il link potrebbe essere scaduto o già usato.",
      };
    }

    return { ok: true, message: "Accesso completato." };
  }

  const { data } = await client.auth.getSession();
  if (data.session?.user) {
    return { ok: true, message: "Accesso completato." };
  }

  return {
    ok: false,
    message:
      "Accesso non valido o già usato. Riprova dal social oppure richiedi un nuovo link email.",
  };
}
