import "server-only";

import { cache } from "react";

import { getAdminToolRequestsFromSupabase } from "@/lib/supabase/suggestion-repository";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";
import type { ToolRequestRecord } from "@/lib/types/tool-request";

export type SuggestionRuntime = {
  suggestions: ToolRequestRecord[];
  canWrite: boolean;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

export const getSuggestionsRuntime = cache(async (): Promise<SuggestionRuntime> => {
  if (!isSupabaseAdminEnabled()) {
    return {
      suggestions: [],
      canWrite: false,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
    };
  }

  try {
    const suggestions = await getAdminToolRequestsFromSupabase();
    return {
      suggestions,
      canWrite: true,
      pendingCount: suggestions.filter((s) => s.status === "received" || s.status === "reviewing")
        .length,
      approvedCount: suggestions.filter((s) => s.status === "approved").length,
      rejectedCount: suggestions.filter((s) => s.status === "rejected").length,
    };
  } catch {
    return {
      suggestions: [],
      canWrite: false,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
    };
  }
});

export async function getAdminSuggestions() {
  const runtime = await getSuggestionsRuntime();
  return runtime.suggestions;
}
