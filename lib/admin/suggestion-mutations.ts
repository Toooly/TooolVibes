import "server-only";

import { updateToolRequestStatusInSupabase, deleteToolRequestFromSupabase } from "@/lib/supabase/suggestion-repository";
import type { ToolRequestStatus } from "@/lib/types/tool-request";

export async function updateSuggestionStatus(
  id: string,
  status: ToolRequestStatus,
  adminNotes?: string,
) {
  return updateToolRequestStatusInSupabase(id, status, adminNotes);
}

export async function deleteSuggestion(id: string) {
  return deleteToolRequestFromSupabase(id);
}
