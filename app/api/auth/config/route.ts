import { NextResponse } from "next/server";

import { parseEnabledOAuthProviders } from "@/lib/auth/oauth-providers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

async function readEnabledOAuthProviders(url: string, anonKey: string) {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      external?: Record<string, unknown>;
    };
    return parseEnabledOAuthProviders(payload.external);
  } catch {
    return [];
  }
}

export async function GET() {
  const { url, anonKey } = getSupabasePublicEnv();
  const enabled = Boolean(url && anonKey);
  const providers = enabled && url && anonKey
    ? await readEnabledOAuthProviders(url, anonKey)
    : [];

  return NextResponse.json(
    {
      enabled,
      url: enabled ? url : null,
      anonKey: enabled ? anonKey : null,
      providers,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
