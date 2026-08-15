import { NextResponse } from "next/server";

import { isCanonicalWorkspaceRemoteEnabled } from "@/lib/discovery/canonical-remote-workspace";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = process.env.TOOOLVIBES_WORKSPACE_SYNC_MODE?.trim().toLowerCase() ?? "";
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return NextResponse.json({
    mode_is_canonical: mode === "canonical",
    has_url: Boolean(url),
    has_service_role: Boolean(serviceRoleKey),
    enabled: isCanonicalWorkspaceRemoteEnabled(),
  });
}
