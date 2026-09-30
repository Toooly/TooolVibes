"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mapAuthProviderError } from "@/lib/auth/auth-messages";
import {
  normalizeOAuthProviderId,
  oauthProviderLabel,
  oauthRedirectTo,
  toSupabaseProvider,
  type OAuthProviderId,
} from "@/lib/auth/oauth-providers";

export type SocialAuthProviderInput = OAuthProviderId | (string & {});

export type SocialAuthResult = { ok: boolean; message: string };

export type SocialAuthClient = Pick<SupabaseClient, "auth"> & {
  auth: Pick<SupabaseClient["auth"], "signInWithOAuth" | "linkIdentity">;
};

function providerErrorMessage(provider: OAuthProviderId) {
  return `Non \u00e8 stato possibile accedere con ${oauthProviderLabel(provider)}. Riprova.`;
}

function baseErrorMessage() {
  return "Accesso non completato. Riprova.";
}

/** Canonical social login: UI calls this, never Supabase directly. */
export async function signInWithSocialProvider(
  client: SocialAuthClient | null | undefined,
  providerInput: SocialAuthProviderInput,
  options?: { next?: string },
): Promise<SocialAuthResult> {
  const provider = normalizeOAuthProviderId(providerInput);
  if (!provider || !client) {
    return { ok: false, message: baseErrorMessage() };
  }
  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: toSupabaseProvider(provider),
      options: {
        redirectTo: oauthRedirectTo(options?.next),
        skipBrowserRedirect: false,
        queryParams:
          provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });
    if (error) {
      return { ok: false, message: mapAuthProviderError(error) || providerErrorMessage(provider) };
    }
    return { ok: true, message: `Ti stiamo portando a ${oauthProviderLabel(provider)}.` };
  } catch (thrown) {
    const message = mapAuthProviderError(thrown instanceof Error ? thrown.message : null);
    return { ok: false, message: message || providerErrorMessage(provider) };
  }
}

/** Link an additional social identity to the current user (settings surface). */
export async function linkSocialIdentity(
  client: SocialAuthClient | null | undefined,
  providerInput: SocialAuthProviderInput,
  options?: { next?: string },
): Promise<SocialAuthResult> {
  const provider = normalizeOAuthProviderId(providerInput);
  if (!provider || !client) {
    return { ok: false, message: baseErrorMessage() };
  }
  try {
    const { error } = await client.auth.linkIdentity({
      provider: toSupabaseProvider(provider),
      options: { redirectTo: oauthRedirectTo(options?.next) },
    });
    if (error) {
      return { ok: false, message: mapAuthProviderError(error) || providerErrorMessage(provider) };
    }
    return { ok: true, message: `Ti stiamo portando a ${oauthProviderLabel(provider)}.` };
  } catch (thrown) {
    const message = mapAuthProviderError(thrown instanceof Error ? thrown.message : null);
    return { ok: false, message: message || providerErrorMessage(provider) };
  }
}
