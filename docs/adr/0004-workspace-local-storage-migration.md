# ADR 0004: Non-destructive WorkspaceStateV1 local migration

- Status: Accepted for DATA-205
- Date: 2026-07-16
- Decision scope: browser storage bootstrap and Zustand persistence

## Context

Before DATA-205, one browser can contain two independent workspace families:

- Zustand A, under `tooolvibes-tool-workspace`, with saved, compare and stack;
- discovery B, under six `tooolvibes:*` workspace keys, with saved, compare,
  stage, note, reason, pin and timestamps.

Neither family alone is complete. Replacing either one in place would make
rollback unsafe, while repeatedly unioning legacy data with a canonical state
would resurrect items after a remove or full clear.

## Decision

### Canonical key

`tooolvibes:workspace:v1` stores raw strict `WorkspaceStateV1` JSON. It is not
a Zustand envelope. Zustand uses a custom synchronous `PersistStorage` adapter
which exposes the existing collection facade to consumers while preserving
canonical metadata, decisions, timestamps and clear tombstones in storage.

### Canonical-first bootstrap

Bootstrap follows this order:

1. A strict canonical v1 payload is authoritative and causes zero writes.
2. A future schema version is read-only and is never downgraded.
3. A completed migration with a missing canonical key does not rebuild stale
   legacy data.
4. Only when canonical v1 is absent or recoverably corrupt are A and B decoded.
5. A raw backup is written and verified before canonical is written.
6. Canonical is strict-validated, written and read back.
7. A data-free status marker records completion.

This is the temporary dual-read policy: legacy is a migration/recovery input,
not a permanent peer of a valid canonical payload.

### Legacy merge

The migration uses a dedicated merge instead of the runtime sync merge:

- saved is an ordered, deduplicated A-first union;
- stack comes from A because B cannot represent it;
- stage, note, reason, pin and their timestamps come from B;
- a B list timestamp is retained only when it still describes the final
  membership;
- Compare uses dated B as primary, otherwise A, then fills from the secondary
  source up to the shared limit of five;
- overflow remains in the raw backup and is returned in migration diagnostics;
- no timestamp, decision or clear boundary is invented for legacy data.

### Backup, quarantine and failure policy

The backup contains the exact raw A/B values and is immutable after creation.
Discovery visited/category keys are not part of `WorkspaceStateV1`, but their
raw values are included in the rollback snapshot and otherwise left untouched.

Corrupt entries are decoded independently. Valid sibling keys are salvaged.
Corrupt canonical raw must be quarantined before it can be replaced. Corrupt
legacy raw already remains both in its original key and in the backup.

Storage access is fail-closed:

- a getter `SecurityError` returns a read-only/in-memory result;
- backup failure prevents canonical writes;
- canonical quota/readback failure leaves legacy and backup untouched;
- status failure does not invalidate an already verified canonical payload;
- clear writes an empty timestamped state and never removes the canonical key.

The backup is retained through the first safety release using DATA-205 and may
be removed no earlier than the next successful release, after rollback is no
longer supported. Cleanup must be an explicit later batch because backups can
contain private local notes.

## Compatibility boundary

DATA-205 changes only local canonical persistence and the Zustand facade.
Legacy discovery keys are not deleted or rewritten. Account/discovery remote
providers, API payloads, database constraints, UI and cross-device merge remain
unchanged until DATA-206. Cross-tab conflict UX and storage-event convergence
remain in the later storage edge-case batch.

## Consequences

Positive:

- migration is idempotent and reruns are write-free;
- no valid legacy source is silently discarded;
- stale legacy values cannot resurrect canonical deletes;
- raw rollback inputs survive migration byte-for-byte;
- Zustand no longer projects canonical timestamps or decisions away.

Costs:

- legacy B remains active for remote compatibility until DATA-206;
- a rollback release reads the preserved pre-migration legacy snapshot, not
  post-migration canonical-only edits;
- simultaneous cross-tab writes still require the later sync/event contract.
