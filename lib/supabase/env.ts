import "server-only";

function cleanEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function extractSupabaseJwtRef(token: string | undefined) {
  if (!token) {
    return undefined;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return undefined;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      ref?: string;
    };

    return decoded.ref;
  } catch {
    return undefined;
  }
}

export function getSupabasePublicEnv() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    url,
    anonKey,
    anonKeyProjectRef: extractSupabaseJwtRef(anonKey),
  };
}

export function getSupabaseAdminEnv() {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    url,
    serviceRoleKey,
    serviceRoleProjectRef: extractSupabaseJwtRef(serviceRoleKey),
  };
}
