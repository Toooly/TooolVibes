import { z } from "zod";

const saveReasonSchema = z.enum([
  "test",
  "compare",
  "design-fit",
  "marketing-fit",
  "client-project",
  "observe",
]);

const toolUserStateSchema = z
  .object({
    is_saved: z.boolean().optional(),
    shortlist_stage: z.enum(["saved", "review", "top"]).optional(),
    note: z.string().max(2000).optional(),
    save_reason: saveReasonSchema.nullable().optional(),
    is_pinned: z.boolean().optional(),
    updated_at: z.string().datetime().nullable().optional(),
  })
  .strict();

export const discoveryWorkspaceStateSchema = z
  .object({
    tool_states: z.record(z.string(), toolUserStateSchema).optional(),
    compare: z
      .object({
        slugs: z.array(z.string().min(1).max(120)).max(20).optional(),
        updated_at: z.string().datetime().nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
