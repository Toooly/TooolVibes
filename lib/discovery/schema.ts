import { z } from "@/lib/validation/zod";
import {
  MAX_COMPARE_TOOLS,
  MAX_WORKSPACE_COLLECTION_TOOLS,
  MAX_WORKSPACE_TOOL_STATES,
  WORKSPACE_SCHEMA_VERSION,
} from "@/lib/discovery/workspace-constants";
import { workspaceDecisionOutcomeValues } from "@/lib/discovery/types";

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
        slugs: z.array(z.string().min(1).max(120)).max(MAX_COMPARE_TOOLS).optional(),
        updated_at: z.string().datetime().nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const workspaceTimestampSchema = z.string().datetime({ offset: true });

export const workspaceSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function uniqueSlugList(maxLength?: number) {
  const schema = z.array(workspaceSlugSchema);
  const limited = maxLength === undefined ? schema : schema.max(maxLength);

  return limited.superRefine((slugs, context) => {
    if (new Set(slugs).size !== slugs.length) {
      context.addIssue({
        code: "custom",
        message: "Workspace slug lists must not contain duplicates.",
      });
    }
  });
}

export const workspaceOrderedListSchema = z
  .object({
    slugs: uniqueSlugList(),
    updatedAt: workspaceTimestampSchema.nullable(),
  })
  .strict();

export const workspaceCompareListSchema = z
  .object({
    slugs: uniqueSlugList(MAX_COMPARE_TOOLS),
    updatedAt: workspaceTimestampSchema.nullable(),
  })
  .strict();

export const workspaceDecisionSchema = z
  .object({
    outcome: z.enum(workspaceDecisionOutcomeValues).nullable(),
    updatedAt: workspaceTimestampSchema,
  })
  .strict();

export const workspaceToolStateSchema = z
  .object({
    stage: z.enum(["saved", "review", "top"]),
    note: z.string().trim().min(1).max(2000).nullable(),
    saveReason: saveReasonSchema.nullable(),
    pinned: z.boolean(),
    decision: workspaceDecisionSchema.nullable(),
    updatedAt: workspaceTimestampSchema.nullable(),
  })
  .strict();

const workspaceToolStatesSchema = z.record(
  workspaceSlugSchema,
  workspaceToolStateSchema,
);

export const workspaceStateV1Schema = z
  .object({
    schemaVersion: z.literal(WORKSPACE_SCHEMA_VERSION),
    clearedAt: workspaceTimestampSchema.nullable(),
    saved: workspaceOrderedListSchema,
    compare: workspaceCompareListSchema,
    stack: workspaceOrderedListSchema,
    toolStates: workspaceToolStatesSchema,
  })
  .strict();

/** Local state remains lossless; remote sync rejects oversized payloads. */
export const workspaceSyncStateV1Schema = workspaceStateV1Schema.superRefine(
  (state, context) => {
    for (const [path, slugs] of [
      ["saved", state.saved.slugs],
      ["stack", state.stack.slugs],
    ] as const) {
      if (slugs.length > MAX_WORKSPACE_COLLECTION_TOOLS) {
        context.addIssue({
          code: "custom",
          path: [path, "slugs"],
          message: `Workspace ${path} cannot exceed ${MAX_WORKSPACE_COLLECTION_TOOLS} tools for remote sync.`,
        });
      }
    }
    if (Object.keys(state.toolStates).length > MAX_WORKSPACE_TOOL_STATES) {
      context.addIssue({
        code: "custom",
        path: ["toolStates"],
        message: `Workspace toolStates cannot exceed ${MAX_WORKSPACE_TOOL_STATES} entries for remote sync.`,
      });
    }
  },
);

/**
 * The HTTP boundary validates the complete local shape without applying the
 * lower remote cardinality limits. Remote persistence owns that capacity
 * decision so it can return an explicit, lossless 422 response.
 */
export const workspaceMutationSchema = z
  .object({
    state: workspaceStateV1Schema,
    guest_state: workspaceStateV1Schema.optional(),
    base_revision: z.string().min(1).max(160).nullable(),
    operation_id: z.string().uuid(),
  })
  .strict();
