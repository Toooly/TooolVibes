import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { ToolRequestRecord, ToolRequestStatus } from "@/lib/types/tool-request";

export const toolRequestSelect = `
  id,
  submitter_type,
  tool_name,
  tool_url,
  category,
  level,
  email,
  message,
  use_case,
  referral_url,
  media_url,
  personal_notes,
  founder_name,
  company_role,
  launch_stage,
  budget_range,
  requested_services,
  status,
  admin_notes,
  created_at,
  updated_at
`;

export type ToolRequestCreateInput = {
  id?: string;
  submitter_type?: ToolRequestRecord["submitter_type"];
  tool_name: string;
  tool_url: string;
  category: string;
  level: string;
  email?: string | null;
  message?: string | null;
  use_case?: string | null;
  referral_url?: string | null;
  media_url?: string | null;
  personal_notes?: string | null;
  founder_name?: string | null;
  company_role?: string | null;
  launch_stage?: string | null;
  budget_range?: string | null;
  requested_services?: string[] | null;
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
