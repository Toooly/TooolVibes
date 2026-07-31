import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { getSupabaseAdminEnv } from "@/lib/supabase/env";

/** Production-safe projection: only columns present on live tool_requests. */
const toolRequestSelect = `
  id,
  tool_name,
  tool_url,
  status,
  created_at
`;

const affiliateRequestSelect = `
  id,
  brand_name,
  status,
  referral_url,
  created_at
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

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
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

  if (toolRequestsResult.error) {
    return NextResponse.json(
      { message: "Non e' stato possibile caricare le submission." },
      { status: 500 },
    );
  }

  // affiliate_requests is optional on Free-plan production shape.
  const affiliateMissing = isMissingRelationError(affiliateRequestsResult.error);
  if (affiliateRequestsResult.error && !affiliateMissing) {
    return NextResponse.json(
      { message: "Non e' stato possibile caricare le submission." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    toolRequests: toolRequestsResult.data ?? [],
    affiliateRequests: affiliateMissing ? [] : affiliateRequestsResult.data ?? [],
    remoteAvailable: true,
  });
}
