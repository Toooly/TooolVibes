import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { ToolRequestRecord, ToolRequestStatus } from "@/lib/types/tool-request";

const toolRequestSelect = `
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

export const getAdminToolRequestsFromSupabase = cache(async (): Promise<ToolRequestRecord[]> => {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("tool_requests")
    .select(toolRequestSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load tool requests: ${error.message}`);
  }

  return data ?? [];
});

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
    throw new Error(`Unable to update tool request ${id}: ${error.message}`);
  }

  return data;
}

export async function deleteToolRequestFromSupabase(id: string): Promise<void> {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("tool_requests").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete tool request ${id}: ${error.message}`);
  }
}
