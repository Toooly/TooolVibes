import { z } from "@/lib/validation/zod";
import {
  MAX_COMPARE_TOOLS,
  MAX_PERSONAL_STACKS,
  MAX_RELATIONSHIP_EVENT_ID_LENGTH,
  MAX_RELATIONSHIP_EVENTS,
  MAX_STACK_DESCRIPTION_LENGTH,
  MAX_STACK_NAME_LENGTH,
  MAX_USE_CASE_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_WORKSPACE_COLLECTION_TOOLS,
  MAX_WORKSPACE_TOOL_STATES,
  MAX_RADAR_WATCH_TOOLS,
  MAX_RADAR_WATCH_CATEGORIES,
  MAX_RADAR_WATCH_CATEGORY_LENGTH,
  WORKSPACE_SCHEMA_VERSION,
} from "@/lib/discovery/workspace-constants";
import {
  compareObjectiveValues,
  relationshipEventTypeValues,
  workspaceDecisionOutcomeValues,
  workspaceUsageValues,
} from "@/lib/discovery/types";

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
    note: z.string().max(MAX_NOTE_LENGTH).optional(),
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

export const personalStackSchema = z
  .object({
    id: workspaceSlugSchema,
    name: z.string().trim().min(1).max(MAX_STACK_NAME_LENGTH),
    description: z
      .string()
      .trim()
      .min(1)
      .max(MAX_STACK_DESCRIPTION_LENGTH)
      .nullable(),
    slugs: uniqueSlugList(),
    archivedAt: workspaceTimestampSchema.nullable(),
    updatedAt: workspaceTimestampSchema,
  })
  .strict();

export const workspaceToolStateSchema = z
  .object({
    stage: z.enum(["saved", "review", "top"]),
    note: z.string().trim().min(1).max(MAX_NOTE_LENGTH).nullable(),
    saveReason: saveReasonSchema.nullable(),
    pinned: z.boolean(),
    decision: workspaceDecisionSchema.nullable(),
    useCase: z.string().trim().min(1).max(MAX_USE_CASE_LENGTH).nullable().default(null),
    alternatives: uniqueSlugList(MAX_COMPARE_TOOLS).default([]),
    revisitAt: workspaceTimestampSchema.nullable().default(null),
    usage: z.enum(workspaceUsageValues).nullable().default(null),
    replacedBy: workspaceSlugSchema.nullable().default(null),
    compareObjective: z.enum(compareObjectiveValues).nullable().default(null),
    updatedAt: workspaceTimestampSchema.nullable(),
  })
  .strict();

const workspaceToolStatesSchema = z.record(
  workspaceSlugSchema,
  workspaceToolStateSchema,
);


export const workspaceRelationshipEventSchema = z
  .object({
    id: z.string().trim().min(1).max(MAX_RELATIONSHIP_EVENT_ID_LENGTH),
    type: z.enum(relationshipEventTypeValues),
    slug: workspaceSlugSchema,
    at: workspaceTimestampSchema,
    outcome: z.enum(workspaceDecisionOutcomeValues).nullable().optional(),
    reason: z.string().trim().min(1).max(MAX_NOTE_LENGTH).nullable().optional(),
    useCase: z
      .string()
      .trim()
      .min(1)
      .max(MAX_USE_CASE_LENGTH)
      .nullable()
      .optional(),
    alternatives: uniqueSlugList(MAX_COMPARE_TOOLS).optional(),
    replacementSlug: workspaceSlugSchema.nullable().optional(),
    revisitAt: workspaceTimestampSchema.nullable().optional(),
  })
  .strict();

const radarWatchCategorySchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_RADAR_WATCH_CATEGORY_LENGTH);

export const radarWatchSchema = z
  .object({
    slugs: uniqueSlugList(MAX_RADAR_WATCH_TOOLS),
    categories: z
      .array(radarWatchCategorySchema)
      .max(MAX_RADAR_WATCH_CATEGORIES)
      .superRefine((categories, context) => {
        if (new Set(categories).size !== categories.length) {
          context.addIssue({
            code: "custom",
            message: "Radar watch categories must not contain duplicates.",
          });
        }
      }),
    updatedAt: workspaceTimestampSchema.nullable(),
  })
  .strict();

export const workspaceStateV1Schema = z
  .object({
    schemaVersion: z.literal(WORKSPACE_SCHEMA_VERSION),
    clearedAt: workspaceTimestampSchema.nullable(),
    saved: workspaceOrderedListSchema,
    compare: workspaceCompareListSchema,
    stack: workspaceOrderedListSchema,
    personalStacks: z.array(personalStackSchema).max(MAX_PERSONAL_STACKS).default([]),
    toolStates: workspaceToolStatesSchema,
    events: z
      .array(workspaceRelationshipEventSchema)
      .max(MAX_RELATIONSHIP_EVENTS)
      .default([]),
    radarWatch: radarWatchSchema.default({
      slugs: [],
      categories: [],
      updatedAt: null,
    }),
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
    state.personalStacks.forEach((stack, index) => {
      if (stack.slugs.length > MAX_WORKSPACE_COLLECTION_TOOLS) {
        context.addIssue({
          code: "custom",
          path: ["personalStacks", index, "slugs"],
          message: `Workspace stack cannot exceed ${MAX_WORKSPACE_COLLECTION_TOOLS} tools for remote sync.`,
        });
      }
    });
    if (state.events.length > MAX_RELATIONSHIP_EVENTS) {
      context.addIssue({
        code: "custom",
        path: ["events"],
        message: `Workspace events cannot exceed ${MAX_RELATIONSHIP_EVENTS} entries for remote sync.`,
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
