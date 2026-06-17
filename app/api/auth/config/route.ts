import { NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const { url, anonKey } = getSupabasePublicEnv();
  const enabled = Boolean(url && anonKey);

  return NextResponse.json(
    {
      enabled,
      url: enabled ? url : null,
      anonKey: enabled ? anonKey : null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
