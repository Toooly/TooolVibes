# Local workspace recovery

## Purpose

This procedure protects pre-release shortlist, compare, stack, stage, note,
reason, and pin data before the workspace unification batches.

The exported file can contain personal notes. Treat it as confidential:

- never commit it;
- never upload it to chat, analytics, support, or cloud storage;
- never paste its contents into logs;
- delete it after migration verification.

## Supported keys

Only these keys belong to the recovery envelope:

```text
tooolvibes:visited-tools
tooolvibes:explored-categories
tooolvibes:shortlist
tooolvibes:shortlist-state
tooolvibes:decision-memory
tooolvibes:compare
tooolvibes:tool-state-meta
tooolvibes:compare-meta
tooolvibes-tool-workspace
```

Sound, music, gamification, authentication, Supabase, gate, and admin values
must not be exported.

## Backup envelope

The JSON file contract is:

```json
{
  "format_version": 1,
  "origin": "https://expected-origin.example",
  "exported_at": "ISO-8601 timestamp",
  "entries": {
    "approved-key": "raw localStorage JSON string"
  }
}
```

Maximum file size is 256 KiB. Every entry value must be a JSON string that can
be parsed independently. Unknown keys or an unexpected origin make restore
fail without changing localStorage.

## Export

Perform export only in a browser profile and origin controlled by the user:

1. close other TooolVibes tabs;
2. open browser developer tools on the expected origin;
3. verify the address bar manually;
4. inspect Local Storage and confirm only the approved keys will be selected;
5. create an envelope with the raw string value for each present approved key;
6. validate each raw value with `JSON.parse`;
7. reject an envelope larger than 256 KiB;
8. save it locally as `tooolvibes-workspace-backup-v1.json`;
9. do not print the envelope or its entries to the console.

Record only the file SHA-256 and creation time in release evidence.

## Restore

Restore must be performed on the same origin recorded in the envelope:

1. close every other TooolVibes tab;
2. verify file size before reading;
3. parse the envelope and require `format_version = 1`;
4. require exact origin equality;
5. reject every key outside the allowlist;
6. require every value to be a string and valid JSON;
7. capture the current approved keys as an in-memory rollback snapshot;
8. write all envelope entries;
9. remove approved keys absent from the envelope;
10. if any write fails, restore the in-memory snapshot before returning;
11. reload once and verify the UI;
12. do not send a discovery sync event until all writes succeeded.

## Verification matrix

Verify with synthetic slugs and notes only:

| Case | Expected result |
|---|---|
| Valid envelope | All nine keys restored exactly |
| Second restore | No additional change |
| Unknown key | Full rejection, zero writes |
| Wrong origin | Full rejection, zero writes |
| Invalid JSON entry | Full rejection, zero writes |
| Oversized file | Full rejection, zero reads/writes |
| Storage quota failure | Automatic rollback |
| Missing optional key | Key removed to match snapshot |
| Corrupt current state | Valid envelope still restores |

After reload, verify:

- shortlist count and slugs;
- compare count and order;
- stack order;
- shortlist stage;
- note;
- save reason;
- pinned state;
- no console error;
- no remote mutation before account sync is explicitly requested.

## Cleanup

After the workspace migration and a second reload:

1. compare the visible state against the pre-migration checklist;
2. delete the backup file;
3. empty the operating-system recycle bin if required by the data policy;
4. record deletion time without recording file contents.

If any field differs, stop the migration batch and keep the file locally until
the rollback decision is made.
