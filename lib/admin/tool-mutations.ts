"use server";

import "server-only";

import type { ToolRecord } from "@/lib/types/tool";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

export type ToolMutationInput = Omit<ToolRecord, "id" | "created_at" | "updated_at">;

export async function createTool(input: ToolMutationInput) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("tools").insert(input).select().single();

  if (error) {
    throw new Error(`Non è stato possibile creare il tool. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function updateTool(id: string, input: Partial<ToolMutationInput>) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from("tools").update(input).eq("id", id).select().single();

  if (error) {
    throw new Error(`Non è stato possibile aggiornare il tool. Dettaglio: ${error.message}`);
  }

  return data;
}

export async function deleteTool(id: string) {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("tools").delete().eq("id", id);

  if (error) {
    throw new Error(`Non è stato possibile eliminare il tool. Dettaglio: ${error.message}`);
  }
}
