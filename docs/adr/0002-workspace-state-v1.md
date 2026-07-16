# ADR 0002: Canonical WorkspaceState v1 contract

- Status: Accepted for DATA-204
- Date: 2026-07-16
- Decision scope: saved, compare, stack and decision-memory state

## Context

TooolVibes currently has two independent client/workspace models:

- the Zustand persisted shape (`savedSlugs`, `compareSlugs`, `stackSlugs`);
- the discovery sync shape (`tool_states` plus `compare`).

The first powers the visible CTA and counters. The second owns stage, note,
save reason, pin and account persistence. They can therefore disagree after
reload, login or a second-device restore. Neither model carries a version or a
complete decision outcome.

DATA-204 defines the target contract and pure transition rules. It deliberately
does not migrate localStorage, change the database or connect remote sync. Those
operations belong to DATA-205 and DATA-206.

## Decision

### One versioned state

`WorkspaceStateV1` is the only target domain model. It contains:

- ordered `saved`, `compare` and `stack` collections, each with an update
  timestamp;
- per-tool `stage`, `note`, `saveReason`, `pinned`, `decision` and update
  timestamp;
- root `clearedAt`, used as the authority boundary for a full clear;
- `schemaVersion: 1`.

Slugs are the identity. Lists reject invalid slugs and duplicates at the strict
schema boundary. The tolerant normalizer removes corrupt values without
throwing and always returns a strict v1 payload.

### Compare has one application limit

`MAX_COMPARE_TOOLS` is defined once and equals 5. Reducer, normalizer, schema,
Zustand seam and existing local compare helper import that constant.

The deployed legacy database constraint in
`supabase/migrations/0005_create_viewer_workspace.sql` still limits
`compare_slugs` to 3. This batch does not alter it. DATA-206 must reconcile the
database constraint before canonical five-item compare state is written
remotely.

### Decision is explicit and timestamped

A decision is either absent or has:

- `outcome`: `selected`, `rejected`, `deferred`, or `null`;
- `updatedAt`: a valid ISO timestamp.

`null` plus a timestamp is an intentional cleared-decision tombstone. An
outcome without a valid timestamp is discarded by tolerant normalization and
rejected by strict validation. No timestamp is generated while parsing or
merging.

### Pure state transitions

`reduceWorkspaceState` is deterministic and has no clock or storage access.
Every mutating action receives its timestamp. It:

- preserves list order;
- deduplicates slugs;
- refuses a sixth compare item;
- requires stack reorder actions to contain exactly the current members;
- saves a tool when stage, note, reason, pin or decision memory is edited and
  reasserts the saved-list timestamp for that edit.

### Merge policy

For ordered collections, the side with the latest timestamp is authoritative,
including removals. When neither side has a timestamp, the merge uses an
ordered union and preserves first-seen order (compare keeps the most recent
five). This missing-timestamp legacy union intentionally preserves argument
order and is not claimed to be commutative; DATA-205 owns its migration policy.

When both collection timestamps are equal and non-null, a stable lexical
serialization tie-break chooses the same whole ordered list on every device.

For per-tool metadata, the latest valid tool timestamp wins. Equal or missing
timestamps merge conservatively: the more advanced stage wins, pin is additive,
non-empty note/reason are retained, and decision uses its own timestamp. Equal
timestamps use stable lexical tie-breaks; a timestamped cleared decision wins a
same-time outcome. Equal-timestamp canonical merges therefore converge.

A full clear sets `clearedAt`. During merge, list or tool metadata at or before
the opposing clear boundary is discarded; only explicitly timestamped edits
after the clear survive. This prevents an older remote snapshot from
resurrecting a cleared decision workspace.
Metadata and decision timestamps are evaluated independently across that
boundary, so a new decision cannot revive an old note, stage or pin. A state
containing only `clearedAt` is still synchronization material and must not be
treated as empty.

### Legacy compatibility is read-only

Two adapters convert existing payloads into v1:

- `adaptLegacyDiscoveryWorkspaceState`;
- `adaptLegacyToolWorkspaceState`.

They do not mutate input, write storage, emit legacy payloads or perform a
migration. The Zustand store keeps its existing persistence keys and partial
shape in this batch; it only routes in-memory collection actions through the
canonical reducer seam.

Because that legacy persisted shape has no timestamps, timestamps created by
the in-memory seam are projected away until DATA-205. Runtime sync convergence
is therefore not claimed by this batch.

## Consequences

Positive:

- subsequent storage and sync batches have one validated target;
- UI counters and account persistence can converge without another domain
  redesign;
- compare overflow, decision timestamps and merge behavior are testable as
  pure functions;
- corrupted or mixed legacy input cannot silently become a different schema.

Costs:

- current storage remains legacy until DATA-205;
- collection, decision and clear timestamps are not persisted by Zustand yet;
- current remote sync remains legacy until DATA-206;
- stack and decision outcome are not remotely persisted yet;
- database compare capacity remains 3 while the application contract is 5.

## Rejected alternatives

- Reusing the discovery shape: it has no stack, ordered saved list, version or
  decision outcome.
- Extending the Zustand shape with metadata: it duplicates remote semantics and
  still lacks merge timestamps.
- Generating timestamps inside normalization: parsing the same payload would no
  longer be idempotent.
- Unioning every timestamped list: removals would be resurrected indefinitely.
- Migrating localStorage in DATA-204: it would combine contract design and
  destructive persistence work in one rollback unit.

## Out of scope

This ADR does not migrate or write localStorage, alter Zustand persistence keys,
change Supabase schema, connect account sync, modify UI, or define compare
scoring and objective semantics.
