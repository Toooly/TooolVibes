import type { ToolRecord } from "@/lib/types/tool";

type SupabaseToolRow = ToolRecord;

export function mapSupabaseTool(row: SupabaseToolRow): ToolRecord {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}
