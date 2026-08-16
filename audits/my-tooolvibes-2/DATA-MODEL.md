# Data model

## Keep (do not mutate first)

WorkspaceStateV1 `schemaVersion: 1`:

- saved / compare / stack (single working list)
- toolStates: stage, note, saveReason, pinned, decision {outcome, updatedAt}

Remote: viewer workspace + workspace_state v1 CAS (DATA-206).

Signal: engagement events, grants, profile context, achievements RPCs. Already authoritative.

## Extend (backward compatible, schemaVersion stays 1)

Normalizer supplies defaults so old payloads still load.

### personalStacks: PersonalStack[]

```
{ id, name, description | null, slugs[], archivedAt | null, updatedAt }
```

- Not `stack.slugs` (that remains the discovery working stack).
- Merge: union by id; last-write-wins on updatedAt; slugs LWW with that timestamp.
- Actions: stacks/create|rename|archive|add|remove|reorder.
- Caps: align with MAX_WORKSPACE_COLLECTION_TOOLS; max stacks ~30.

### toolStates journal extras (defaults)

- useCase: string | null
- alternatives: string[]   // Decision Trace snapshot
- revisitAt: string | null

Rebase/merge must copy these fields like note/saveReason.

### Activity / resurfacing / For You

Derived read models. Do not persist a parallel event log in V1.

Resurface rules (workspace-only, not notifications):

- saved ≥ 30d, no outcome, stage=saved
- compare ≥ 2 still open
- stage=top and no outcome
- outcome=deferred and (revisitAt passed or updatedAt ≥ 90d)

Recommendations (explainable, no black box):

1. other tools in an open compare category
2. tools matching stack name/category
3. alternatives to two saved tools in same category
4. Radar-adjacent only if a real radar signal API is already available — otherwise skip

Profile context: keep server table; make Settings edit call existing PUT (upsert). Allow updates after complete. SP grant stays once-only via dedupe `profile:{userId}`.

Preferences: keep existing reward preference rows.

## Migrations

No SQL migration required for stacks/journal if they live in workspace JSON.

Forward-only. `normalizeWorkspaceState` ignores unknown future keys only after we stop using `.strict()` on the *input* normalizer path — keep parse strict on the constructed object.

Guest merge must include new fields via mergeWorkspaceStates + rebaseWorkspaceIntent.

## Forbidden

- Destructive rewrite of saved/compare/notes
- Dual schemaVersion bump without adapter
- Client-awarded SP
- New public tables for V1 stacks


## Exact current types (do not invent)

WorkspaceStateV1 today:

```
schemaVersion: 1
clearedAt: string | null
saved / compare / stack: { slugs: string[]; updatedAt: string | null }
toolStates[slug]: {
  stage: saved | review | top
  note: string | null
  saveReason: SaveReason | null
  pinned: boolean
  decision: { outcome: selected | rejected | deferred | null; updatedAt } | null
  updatedAt: string | null
}
```

WorkspaceAction today: saved/set|toggle, compare/toggle|clear, stack/add|remove|reorder, tool/stage|note|save-reason|pin|decision, workspace/clear.

## Strict schema implication

`workspaceStateV1Schema` and `workspaceToolStateSchema` are `.strict()`.

Adding `personalStacks` or journal extras **must** update:

- lib/discovery/types.ts
- lib/discovery/schema.ts (new fields with `.default(...)` so old payloads parse)
- normalizeWorkspaceState
- mergeWorkspaceStates
- rebaseWorkspaceIntent (today only rebases saved/compare/stack lists)
- workspace-contract tests + guest-account-merge-contract
- any snapshot fixtures

Old payloads without the new keys must still parse (defaults). New keys on old production workers would 422 if we shipped clients first — ship schema + client together.

Remote sync still uses MAX_WORKSPACE_COLLECTION_TOOLS and MAX_WORKSPACE_TOOL_STATES. Personal stacks must respect the same per-stack cap and a total-stack cap so sync cannot 422 mature users.

## Signal hub already sufficient

`SignalProgressHub` already returns balance, level, missions, recentGrants, badges, achievementProgress, profileContext, preferences (quietMode, reduceRewardAnimations, muteRewardSounds, suppressAutomaticAchievements, suppressMajorCelebrations).

No new Signal table for V1 workspace UI.

Profile context enums stay:

- focus: product | design | engineering | marketing | operations | research
- goal: discover | compare | shortlist | learn | decide

Settings edits reuse PUT upsert. Completion SP remains once-only.
