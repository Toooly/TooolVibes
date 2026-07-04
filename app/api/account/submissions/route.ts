import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";
import { toolRequestSelect } from "@/lib/supabase/suggestion-repository";

const affiliateRequestSelect = `
  id,
  first_name,
  last_name,
  email,
  brand_name,
  website_url,
  audience,
  channels,
  message,
  status,
  admin_notes,
  referral_code,
  referral_url,
  approved_at,
  rejected_at,
  created_at,
  updated_at
`;

function isAdminSupabaseReady() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  return Boolean(url && serviceRoleKey);
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function GET(request: Request) {
  if (!isAdminSupabaseReady()) {
    return NextResponse.json({
      toolRequests: [],
      affiliateRequests: [],
      remoteAvailable: false,
    });
  }

  const token = readBearerToken(request);

  if (!token) {
    return NextResponse.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const client = createAdminSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json({ message: "Utente non riconosciuto." }, { status: 401 });
  }

  const email = user.email.toLowerCase();

  const [toolRequestsResult, affiliateRequestsResult] = await Promise.all([
    client
      .from("tool_requests")
      .select(toolRequestSelect)
      .eq("email", email)
      .order("created_at", { ascending: false }),
    client
      .from("affiliate_requests")
      .select(affiliateRequestSelect)
      .eq("email", email)
      .order("created_at", { ascending: false }),
  ]);

  if (toolRequestsResult.error || affiliateRequestsResult.error) {
    return NextResponse.json(
      { message: "Non e' stato possibile caricare le submission." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    toolRequests: toolRequestsResult.data ?? [],
    affiliateRequests: affiliateRequestsResult.data ?? [],
    remoteAvailable: true,
  });
}
