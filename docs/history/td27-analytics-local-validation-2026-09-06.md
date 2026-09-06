# TD-27 local validation — 2026-09-06

This is local implementation evidence. No staging/production migration or
backfill was executed, and TD-27 has not been closed. Deployment destinations
still need to be identified before the remaining rollout gates can run.

## Completed checks

- Contracts: `npm run verify` passed; `@sunsteel/contracts@0.7.0` published to the
  npm registry and installed in both consumers.
- Backend: `npm run verify` passed (lint, typecheck, 16 Node tests, build).
- Frontend: `npm run verify` passed (lint, typecheck, 91 tests, Next.js build).
- PostgreSQL 17.9 integration suite passed against a disposable local database,
  applying the actual expansion SQL to a frozen legacy schema. The checked-in
  preparation script and test suite were both exercised. CI now has a separate
  PostgreSQL 17 integration job; that remote CI job has not been run here.
- No frontend/backend application server was started. Existing frontend
  documentation edits were preserved.

## Integration assertions

- Legacy/projected JSON equality before and after a live finish, including
  fractional volume, empty completed sessions, PR ties and local dates.
- Concurrent finishes retain the original end timestamp, one completion event,
  one aggregate contribution and one progression update.
- Injected event failure rolls back both the final status and progression.
- Injected rollup failure leaves no events/rollups or advanced cursor. Three
  failures produce FAILED; explicit retry creates a new generation and retains
  the initially selected zone, even when the retrying device supplies another.
- Interrupted backfill resumes. Rebuild repeats the checksum and event count.
  Concurrent workers skip claimed work rather than duplicating it.
- Aborted sessions do not contribute. A completion during a zone rebuild is
  included in the tail before activation; the old zone stays active until then.
- Session prescription, source IDs and logs remain identical after routine
  editing and deletion, once the guarded deferred FK SQL is applied.
- Pure tests cover DST, midnight, duplicate days, gaps of one to three and more
  than three days, null/zero/fractional volume and PR tie ordering.

## Actual read-query evidence

The fixture adds 20,000 summarized sessions, 2,000 PRs and 2,000 other accounts
and active projections. The test captures the three queries emitted by
`getProjectedProgress` and executes `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` with
their actual parameters. It asserts that no plan contains a sequential scan.

| Main read | Index | Main rows returned |
| --- | --- | --- |
| Active projection | `analytics_one_active_user` | 1 |
| Latest PRs | `PersonalRecord_userId_achievedAt_idx` | 5 |
| Recent sessions | `workout_recent_completed_sets` | 5 |
| Snapshot join | `WorkoutSessionSnapshot_pkey` | 1 per session, 5 loops |

Full plans and queries are retained in
[`td27-analytics-explain-2026-09-06.json`](td27-analytics-explain-2026-09-06.json).
No read touches `SetLog`, training events or historical rollups.

The first real-query test caught an ORM detail: Prisma's text-to-enum cast made
PostgreSQL ignore the partial recent-session index and scan all 20,000 rows.
The final reader uses parameterized SQL with static partial-index predicates;
the captured-query test verifies the fix. A separate non-partial composite index
covers the offline cursor query's ORM enum casts.

Follow the [rollout runbook](../reference/td27-analytics-rollout.md) for staging,
production comparison, rollout flags and deferred cleanup. Local timings are
not production latency measurements.
