# Database restore drill evidence

Do not include full project references, database URLs, credentials, user data,
row values, or signed Storage URLs in this document.

## Identification

- Drill ID:
- Date:
- Change/batch:
- Operator:
- Reviewer:
- Data classification: synthetic-only / other (explain)
- Final decision: GO / NO-GO

## Environment guard

- Source alias:
- Source project-ref suffix (last four only):
- Disposable target alias:
- Target project-ref suffix (last four only):
- Production alias:
- Production project-ref suffix (last four only):
- All three references confirmed different: yes / no
- `STAGING_ONLY` confirmation present: yes / no
- Target confirmed disposable and empty: yes / no
- Production network access disabled for the drill where possible: yes / no

## Toolchain

- Node:
- npm:
- Supabase CLI:
- Docker:
- PostgreSQL client:
- Source PostgreSQL version:
- Target PostgreSQL version:

## Backup readiness

- Production managed backup/PITR available: yes / no / unknown
- Latest recovery point checked:
- Retention window:
- Expected production RPO:
- Storage object backup procedure available: yes / no / unknown
- Platform configuration inventory available: yes / no

## Snapshot

- Snapshot started:
- Snapshot completed:
- Schema artifact SHA-256 recorded: yes / no
- Data artifact SHA-256 recorded: yes / no
- Snapshot stored only in ignored/encrypted location: yes / no
- Fixture validator green: yes / no
- Strict migration manifest green: yes / no

## Restore

- Restore started:
- Restore completed:
- Restore command reviewed by:
- Transaction/error-stop enabled: yes / no
- Unexpected warning or retry:
- Application smoke result:
- RLS smoke result:
- Auth-dependent tables intentionally empty: yes / no

## Verification

- Source checksum contract valid: yes / no
- Target checksum contract valid: yes / no
- Schema signature match: yes / no
- Constraint signature match: yes / no
- Index signature match: yes / no
- Policy signature match: yes / no
- Function signature match: yes / no
- Trigger signature match: yes / no
- RLS signature match: yes / no
- Storage metadata signature match: yes / no
- All 22 table counts and row digests match: yes / no
- Mismatch paths, if any:

## Recovery objectives

- Measured RTO:
- Expected RTO:
- Measured snapshot-to-restore data gap:
- Expected RPO:
- Acceptance met: yes / no

## Cleanup

- Disposable target deletion owner:
- Disposable target deleted at:
- Local snapshot artifacts deleted at:
- Temporary credential file deleted at:
- Access token/session revoked at:
- Cleanup independently verified by:

## Exceptions and decision

- Exceptions:
- Required follow-up:
- Operator sign-off:
- Reviewer sign-off:
- Release owner decision:
