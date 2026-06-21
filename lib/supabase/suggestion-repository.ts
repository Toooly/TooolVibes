import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { ToolRequestRecord, ToolRequestStatus } from "@/lib/types/tool-request";

export const toolRequestSelect = `
  id,
  tool_name,
  tool_url,
  category,
  level,
  email,
  message,
  status,
  admin_notes,
  created_at,
  updated_at
`;

export type ToolRequestCreateInput = {
  id?: string;
  tool_name: string;
  tool_url: string;
  category: string;
  level: string;
  email?: string | null;
  message?: string | null;
  created_at?: string;
};

export async function createToolRequestInSupabase(
  input: ToolRequestCreateInput,
): Promise<ToolRequestRecord> {
  const client = createPublicSupabaseClient();
  const { data, error } = await client
    .from("tool_requests")
    .insert(input)
    .select(toolRequestSelect)
    .single();

  if (error) {
    throw new Error(`Non è stato possibile inviare il suggerimento. Dettaglio: ${error.message}`);
  }

  return data;
}

export const getAdminToolRequestsFromSupabase = cache(async (): Promise<ToolRequestRecord[]> => {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("tool_requests")
    .select(toolRequestSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Non è stato possibile caricare i suggerimenti. Dettaglio: ${error.message}`);
  }

  return data ?? [];
});

export async function getToolRequestByIdFromSupabase(
  id: string,
): Promise<ToolRequestRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("tool_requests")
    .select(toolRequestSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Non è stato possibile caricare questo suggerimento. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function updateToolRequestStatusInSupabase(
  id: string,
  status: ToolRequestStatus,
  adminNotes?: string,
): Promise<ToolRequestRecord> {
  const client = createAdminSupabaseClient();
  const payload: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    payload.admin_notes = adminNotes;
  }

  const { data, error } = await client
    .from("tool_requests")
    .update(payload)
    .eq("id", id)
    .select(toolRequestSelect)
    .single();

  if (error) {
    throw new Error(`Non è stato possibile aggiornare questo suggerimento. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function deleteToolRequestFromSupabase(id: string): Promise<void> {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("tool_requests").delete().eq("id", id);

  if (error) {
    throw new Error(`Non è stato possibile eliminare questo suggerimento. Dettaglio: ${error.message}`);
  }
}
