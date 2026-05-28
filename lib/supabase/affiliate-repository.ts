import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { AffiliateLinkRecord } from "@/lib/types/affiliate-link";

const affiliateLinkSelect = `
  id,
  tool_id,
  label,
  destination_url,
  tracking_url,
  campaign,
  source,
  medium,
  is_active,
  created_at,
  updated_at
`;

export const getAffiliateLinksByToolId = cache(
  async (toolId: string): Promise<AffiliateLinkRecord[]> => {
    const client = createAdminSupabaseClient();
    const { data, error } = await client
      .from("affiliate_links")
      .select(affiliateLinkSelect)
      .eq("tool_id", toolId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Unable to load affiliate links for tool ${toolId}: ${error.message}`);
    }

    return data ?? [];
  },
);

export const getAllAffiliateLinksFromSupabase = cache(async (): Promise<
  (AffiliateLinkRecord & { tool_name?: string })[]
> => {
  const client = createAdminSupabaseClient();
  const { data: links, error: linksError } = await client
    .from("affiliate_links")
    .select(affiliateLinkSelect)
    .order("created_at", { ascending: false });

  if (linksError) {
    throw new Error(`Unable to load affiliate links: ${linksError.message}`);
  }

  if (!links || links.length === 0) return [];

  const toolIds = [...new Set(links.map((l) => l.tool_id))];
  const { data: toolsData, error: toolsError } = await client
    .from("tools")
    .select("id, name")
    .in("id", toolIds);

  if (toolsError) {
    throw new Error(`Unable to load tool names for affiliate links: ${toolsError.message}`);
  }

  const toolNameMap = new Map((toolsData ?? []).map((t) => [t.id, t.name]));

  return links.map((link) => ({
    ...link,
    tool_name: toolNameMap.get(link.tool_id),
  }));
});

export async function getAffiliateLinkById(id: string): Promise<AffiliateLinkRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_links")
    .select(affiliateLinkSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load affiliate link ${id}: ${error.message}`);
  }

  return data;
}

export type AffiliateLinkCreateInput = {
  tool_id: string;
  label: string;
  destination_url: string;
  tracking_url?: string | null;
  campaign?: string | null;
  source?: string | null;
  medium?: string | null;
  is_active?: boolean;
};

export type AffiliateLinkUpdateInput = Partial<AffiliateLinkCreateInput>;

export async function createAffiliateLinkInSupabase(
  input: AffiliateLinkCreateInput,
): Promise<AffiliateLinkRecord> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_links")
    .insert(input)
    .select(affiliateLinkSelect)
    .single();

  if (error) {
    throw new Error(`Unable to create affiliate link: ${error.message}`);
  }

  return data;
}

export async function updateAffiliateLinkInSupabase(
  id: string,
  input: AffiliateLinkUpdateInput,
): Promise<AffiliateLinkRecord> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("affiliate_links")
    .update(input)
    .eq("id", id)
    .select(affiliateLinkSelect)
    .single();

  if (error) {
    throw new Error(`Unable to update affiliate link ${id}: ${error.message}`);
  }

  return data;
}

export async function deleteAffiliateLinkFromSupabase(id: string): Promise<void> {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("affiliate_links").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete affiliate link ${id}: ${error.message}`);
  }
}
