import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { mapSupabaseTool } from "@/lib/supabase/mappers";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { publicToolSelect } from "@/lib/supabase/tool-columns";
import type { ToolRecord } from "@/lib/types/tool";

function orderByDiscoveryDate(items: ToolRecord[]) {
  return [...items].sort((left, right) =>
    right.date_discovered.localeCompare(left.date_discovered),
  );
}

export const getPublicPublishedToolsFromSupabase = cache(async (): Promise<ToolRecord[]> => {
  try {
    const client = createPublicSupabaseClient();
    const { data, error } = await client
      .from("tools")
      .select(publicToolSelect)
      .eq("is_published", true)
      .order("date_discovered", { ascending: false });

    if (error) {
      throw new Error(`Non è stato possibile caricare i tool pubblicati. Dettaglio: ${error.message}`);
    }

    return orderByDiscoveryDate((data ?? []).map(mapSupabaseTool));
  } catch (error) {
    throw error;
  }
});

export const canAccessSupabaseToolsAdmin = cache(async (): Promise<boolean> => {
  try {
    const client = createAdminSupabaseClient();
    const { error } = await client
      .from("tools")
      .select("id", { head: true, count: "estimated" })
      .limit(1);

    return !error;
  } catch {
    return false;
  }
});

export async function getAdminToolsFromSupabase(): Promise<ToolRecord[]> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("tools")
    .select(publicToolSelect)
    .order("date_discovered", { ascending: false });

  if (error) {
    throw new Error(`Non è stato possibile caricare i tool dell'area admin. Dettaglio: ${error.message}`);
  }

  return orderByDiscoveryDate((data ?? []).map(mapSupabaseTool));
}

export async function getAdminToolByIdFromSupabase(id: string): Promise<ToolRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("tools")
    .select(publicToolSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Non è stato possibile caricare questo tool. Dettaglio: ${error.message}`);
  }

  return data ? mapSupabaseTool(data) : null;
}
