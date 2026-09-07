# TD-27: implementation and staged rollout

> Closed 2026-09-07: [closure record](../history/td27-closure-2026-09-07.md).
> The rollout sequence below is historical. The projection reader is now unconditional;
> WORKOUT_PROGRESS_PROJECTION_READS is obsolete. Keep WORKOUT_ANALYTICS_JOBS=true.
> The comparison CLI uses an offline fixture, never a production API fallback.

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
4. Backfill runs on the existing Nest scheduler (five-second tick, two sessions
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
8. After the production gates and rollback observation, apply
   `prisma/migrations/20260907090000_analytics_fk_cutover/migration.sql`
   with `prisma migrate deploy`. Promoted on 2026-09-07, it checks snapshot/source-ID
   coverage and READY projections, takes bounded locks and changes the three
   live relations to `ON DELETE SET NULL`. Before this step, structural edits or
   deletion of routines with history return 409 rather than destroying history.
   The Prisma schema already describes the final nullable relationships, so
   **do not use `prisma db push` or generate another migration from schema drift
   against production during this staged rollout**.
9. Once the rollback window is closed, remove `legacy-workout-progress.service.ts` and the flag
   branch. Only then update the roadmap with production evidence; this local
   implementation does not claim that cleanup or deployment has happened.

## Lock profile of the expansion migration

Read out of
`prisma/migrations/20260906180000_analytics_expand/migration.sql` on 2026-09-07.
The expansion has since been applied in production, so this is kept as a record
of what step 1 exercised and as a constraint on future edits to that file -- not
as a pending instruction. It is a read of the SQL, never a measurement; no
duration stated here was observed.

**Free.** The eight new tables and their indexes are built empty. Every
`ADD COLUMN` against an already-populated table is nullable with no default --
`User.timeZone`, `User.analyticsProjectionId`, the four on `WorkoutSession`
(`completedSets`, `sourceRoutineDayId`, `sourceRoutineId`, `totalVolumeKg`) and
`SetLog.sourceRoutineExerciseId` -- so each is metadata-only on PostgreSQL 11+.
They still take `ACCESS EXCLUSIVE` briefly, which means they queue behind any
long-running open transaction; a stuck transaction, not the rewrite, is what
stalls this migration.

**What to time.** The file contains no `CONCURRENTLY`, so every index build takes
`SHARE` on its table and blocks writes for its whole duration. Five builds run
against populated tables:

| Table            | Index                                                 |
| ---------------- | ----------------------------------------------------- |
| `WorkoutSession` | `WorkoutSession_userId_id_idx`                        |
| `WorkoutSession` | `workout_recent_completed_sets` (partial)             |
| `WorkoutSession` | `workout_analytics_backfill_cursor` (partial)         |
| `WorkoutSession` | `workout_analytics_cursor_status`                     |
| `SetLog`         | `SetLog_sessionId_sourceRoutineExerciseId_setNumber_key` (UNIQUE) |

Expect `SetLog` to dominate: it holds one row per logged set, so it is the
largest table the migration touches.

**Why the unique index is safe on existing data, and how that breaks.**
`SetLog_sessionId_sourceRoutineExerciseId_setNumber_key` covers
`sourceRoutineExerciseId`, which this same migration has just added as `NULL` for
every pre-existing row. The index is not declared `NULLS NOT DISTINCT`, and
PostgreSQL treats NULLs as distinct from one another in a unique index, so no
historical row can collide no matter how much history the database holds. Adding
`NULLS NOT DISTINCT` to that statement would make the migration fail against any
database with existing set logs. Do not add it.

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

## Production checkpoint — 2026-09-07

- Expansion migration applied; backend deployment `6b27aff` succeeded.
- The registered Europe/Berlin account reached READY: 38 sessions snapshotted
  and processed. The legacy/projected comparison matched exactly (including
  five personal records and five recent activities).
- A batch of 25 exceeded the 30-second transaction timeout over the remote
  connection. Batches of two completed successfully; the worker default was
  reduced to two and passed backend `npm run verify`. Its deployment is
  recorded below.
- The owner explicitly authorized Europe/Berlin for the six empty test accounts;
  all seven accounts are READY with no pending jobs.
- A second production rebuild matched the original totals, daily/weekly and
  muscle rollups, record frontiers and checksum exactly. Event count remained
  94 before and after (2026-09-07T07:59:21Z).
- Legacy/projected dashboard comparisons passed for all seven accounts at
  2026-09-07T08:00:19Z (7/7 exact matches).
- Worker adjustment published as `c21f0cd`; startup fix `75dff50` passed CI and
  Railway deployment. Compiled module loading is now checked in CI and builds.
- The owner confirmed both analytics flags enabled on 2026-09-07. Independent
  post-activation checks at 08:29 UTC returned health `ok`, zero unregistered or
  pending accounts and eight COMPLETED jobs. Runtime flag values and an
  authenticated dashboard request were not independently inspected.
- The owner confirmed the post-activation workout check. The guarded FK cutover
  was applied and published as `47a9acf`: all three constraints report SET NULL,
  with 39 sessions and 39 snapshots after migration. Local backend verification
  and the isolated PostgreSQL integration suite passed before applying it.
- Pooled migration access hit a stale session advisory lock. The idle holder
  (no open transaction) was released and migration succeeded over the direct
  connection to the same Neon database. Use direct connections for migrations.
- The owner confirmed post-cutover functionality. The API legacy reader and
  projection-read flag were removed to close TD-27.
- **TD-27 closed on 2026-09-07.** The staged sequence above ran to completion;
  no step in `Deployment order` is outstanding. Evidence and the delivered/
  partial split are in
  [`../history/td27-closure-2026-09-07.md`](../history/td27-closure-2026-09-07.md).
  `WORKOUT_ANALYTICS_JOBS` is not a rollout flag and stays enabled: new accounts
  and rebuilds still need it. Steps 1-9 are retained as the record of how this
  shipped, not as pending work.

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
