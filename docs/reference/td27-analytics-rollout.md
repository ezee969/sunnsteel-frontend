# TD-27: implementation and staged rollout

The implementation is ready for staged deployment. TD-27 remains open until
production comparison, backfill coverage and query evidence pass. DATA-02 still
excludes progression, achievements and the other future event types. Existing
roadmap states have deliberately not been changed.

## Published contracts

`@sunsteel/contracts@0.7.0` was published to npm on 2026-09-06 and installed from
the registry in both consumers. It adds the existing progress response/query,
versioned prescription snapshots and account time-zone registration/status.
`UserProfile.timeZone` is optional. Neither consumer uses a local package link.

## Deployment order

1. Rehearse the expansion migration on a staging copy. In the backend,
   `prisma/migrations/20260906180000_analytics_expand/migration.sql` adds nullable
   columns, analytics tables and indexes. It does not run backfill or change the
   existing routine deletion FKs. Index creation can take locks; measure this on
   the copy before scheduling the production migration.
2. Deploy the snapshot-aware backend after the expansion. New starts capture the
   original routine/day/exercises, muscles, prescription, RIR, notes, rest and
   progression settings in the creation transaction. Finish, log writes, routine
   edits and backfill serialize using a per-account row lock. Finish claims
   `IN_PROGRESS` conditionally and commits progression, summary, completion event
   and active projection together. Repeated finishes return the original result.
3. Enable `WORKOUT_ANALYTICS_JOBS=true` in the backend and deploy the frontend.
   Keep `WORKOUT_PROGRESS_PROJECTION_READS` unset or `false` initially. The
   frontend registers the device zone only if the account is uninitialized;
   registration uses `onlyIfUnset` to protect simultaneous devices. It polls the
   status while BUILDING and does not request progress before an active zone
   exists. An old active generation remains readable during a zone change.
4. Backfill runs on the existing Nest scheduler (five-second tick, 25 sessions
   per batch). Each worker claims account/job rows with `SKIP LOCKED`. A first
   cursor snapshots all available sessions, including aborted/active ones; the
   second cursor folds completed sessions in `(endedAt, id)` order. A failed
   batch rolls back contributions and cursor to a savepoint, records the error
   and stops after three consecutive failures. Retry creates a fresh generation.
   Initial PRs are produced by backfill; once READY, finishes update PRs directly.
5. Compare legacy and projected results for controlled accounts. Repeat a
   rebuild with no intervening training and compare checksum, session/set totals,
   rollups and event counts. The account lock makes the empty-tail check and
   generation activation atomic with respect to finishes. Generation-local PR
   frontiers reconstruct the historical PR sequence without duplicating events.
6. After zero mismatches and no pending accounts, enable
   `WORKOUT_PROGRESS_PROJECTION_READS=true`. The projected reader performs exactly
   three queries in REPEATABLE READ: one active summary, five PRs and five recent
   sessions joined to their snapshots. It has no historical fallback when the
   flag is enabled; a missing generation returns 503.
7. Observe the rollout and retain the snapshot-aware legacy reader during the
   rollback window. Reverting the flag is the read-path rollback. Do not roll
   back to code that predates snapshots or atomic finish.
8. After the production gates and rollback observation, promote
   `prisma/deferred/analytics-fk-cutover.sql` into its own ordered Prisma
   migration in the deployment commit and run `prisma migrate deploy`. It is
   deliberately outside the automatic migration directory until that gate. It checks snapshot/source-ID
   coverage and READY projections, takes bounded locks and changes the three
   live relations to `ON DELETE SET NULL`. Before this step, structural edits or
   deletion of routines with history return 409 rather than destroying history.
   The Prisma schema already describes the final nullable relationships, so
   **do not use `prisma db push` or generate another migration from schema drift
   against production during this staged rollout**.
9. Once the rollback window is closed, remove `legacy-workout-progress.service.ts` and the flag
   branch. Only then update the roadmap with production evidence; this local
   implementation does not claim that cleanup or deployment has happened.

## Operations (backend working directory)

Use the explicitly selected environment's connection configuration:

```powershell
npm run analytics -- status
npm run analytics -- status <userId>
npm run analytics -- rebuild <userId> Europe/Berlin
npm run analytics -- batch
npm run analytics -- compare <userId>
```

`status` reports unregistered/pending accounts, job states and, for a selected
account, generations, checksums, cursors, attempts and approximated counts.
`rebuild` always starts empty unless a build is already underway. It requires an
explicit known account zone; never guess the zones of inactive users. `batch`
runs one bounded batch without mounting the application. `compare` performs both
reads under the same snapshot/account lock and exits nonzero on a mismatch.

Record batch duration, table row counts and storage in staging/production. Each
completion produces one completion event and at most one PR event per exercise;
daily/weekly muscle rows and record frontiers add storage per generation. Old
inactive generations are retained for audit in this delivery. Do not delete the
active or requested generation when introducing retention later.

## Historical limitations

Backfilled snapshots are explicitly `APPROXIMATED`; they represent the surviving
prescription, not a reconstruction of earlier edits. Missing prescription or
completion timestamps fail the job with the session ID rather than silently
activating an incomplete projection. Previously cascade-deleted sessions cannot
be discovered or restored from this database alone; reconcile them against a
backup/export if one exists. They must not be represented as successfully
recovered records.

The original PR query had no stable ordering for exact ties and recent-session
ties. The implementation follows the planned first achievement rule and explicit
`endedAt DESC, id DESC` activity ordering. Treat discrepancies in these historical
ties as comparison findings to review, not as permission to bypass the gate.

## Reproducible verification

Run `npm run verify` in all three repositories. Do not build this frontend while
its dev server is running. The backend CI includes an isolated PostgreSQL 17 job
that applies the frozen pre-expansion schema and the real expansion migration,
then runs the integration suite. No Supabase account or live API is needed.

For a manually provided **empty** local PostgreSQL database named `td27_test`:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:isolated@127.0.0.1:5432/td27_test'
$env:ANALYTICS_TEST_DATABASE = 'isolated'
npm run test:analytics:prepare
npm run test:analytics:integration
```

Preparation refuses a nonempty database. Tests refuse a non-loopback connection
or any other database name. They cover migration, parity, concurrent finishes and
workers, failure rollback, interrupted/repeated backfill, zone changes and tail
capture, snapshot preservation after routine editing/deletion, and EXPLAIN on
the actual parameterized ORM/SQL queries with a large synthetic history.

Local query evidence is in
[`../history/td27-analytics-explain-2026-09-06.json`](../history/td27-analytics-explain-2026-09-06.json).
These measurements are synthetic local evidence, not production timings.
