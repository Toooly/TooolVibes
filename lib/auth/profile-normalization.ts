import type { User } from "@supabase/supabase-js";

import { normalizeIdentityProvider, type OAuthProviderId } from "@/lib/auth/oauth-providers";

export type NormalizedProfile = {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string | null;
  provider: OAuthProviderId | "email" | null;
};

type MetadataRecord = Record<string, unknown>;

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asHttpAvatar(value: unknown): string | null {
  const url = asNonEmptyString(value);
  if (!url) return null;
  // Only http(s) avatars; avoids data:/blob: injection and broken schemes.
  if (!/^https?:\/\//i.test(url)) return null;
  if (url.length > 2048) return null;
  return url;
}

function splitName(fullName: string | null): { firstName: string | null; lastName: string | null } {
  if (!fullName) return { firstName: null, lastName: null };
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0] ?? null, lastName: null };
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" "),
  };
}

function readMetadata(user: Pick<User, "user_metadata"> | null | undefined): MetadataRecord {
  const metadata = user?.user_metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as MetadataRecord;
  }
  return {};
}

/** Deterministic fallback chain shared by every surface (never scattered). */
export function normalizeUserProfile(
  user: Pick<User, "email" | "user_metadata" | "identities" | "app_metadata"> | null | undefined,
): NormalizedProfile {
  const metadata = readMetadata(user);
  const email = asNonEmptyString(user?.email) ?? asNonEmptyString(metadata.email);

  const givenFamily = [asNonEmptyString(metadata.given_name), asNonEmptyString(metadata.family_name)]
    .filter(Boolean)
    .join(" ");
  const fullName =
    asNonEmptyString(metadata.full_name) ??
    asNonEmptyString(metadata.name) ??
    (givenFamily ? givenFamily : null) ??
    asNonEmptyString(metadata.preferred_username) ??
    asNonEmptyString(metadata.user_name);

  const nameParts = splitName(fullName);
  const firstName = asNonEmptyString(metadata.given_name) ?? nameParts.firstName;
  const lastName = asNonEmptyString(metadata.family_name) ?? nameParts.lastName;

  const avatarUrl =
    asHttpAvatar(metadata.avatar_url) ??
    asHttpAvatar(metadata.picture) ??
    asHttpAvatar(metadata.avatar);

  // Provider: first Supabase identity wins; Apple private-relay still counts as apple.
  let provider: NormalizedProfile["provider"] = null;
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  for (const identity of identities) {
    const normalized = normalizeIdentityProvider(
      (identity as { provider?: unknown } | null)?.provider,
    );
    if (normalized) {
      provider = normalized;
      break;
    }
  }
  if (!provider) {
    const rawProvider =
      asNonEmptyString((user?.app_metadata as MetadataRecord | undefined)?.provider) ??
      asNonEmptyString(metadata.provider) ??
      asNonEmptyString(metadata.iss);
    provider = normalizeIdentityProvider(rawProvider) ?? (email ? "email" : null);
  }

  const displayName = fullName ?? (email ? email.split("@")[0] ?? null : null) ?? null;

  return { displayName, firstName, lastName, avatarUrl, email, provider };
}

export function profileDisplayName(
  user: Pick<User, "email" | "user_metadata" | "identities" | "app_metadata"> | null | undefined,
  fallback = "account",
): string {
  return normalizeUserProfile(user).displayName ?? fallback;
}

export function profileInitials(
  user: Pick<User, "email" | "user_metadata" | "identities" | "app_metadata"> | null | undefined,
  fallback = "TV",
): string {
  const profile = normalizeUserProfile(user);
  const source = profile.displayName ?? profile.email ?? "";
  const parts = source.split(/[@._+\-\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  const compact = source.replace(/[^a-zA-Z0-9]/g, "");
  return (compact.slice(0, 2) || fallback).toUpperCase();
}
