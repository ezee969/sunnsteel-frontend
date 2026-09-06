# Active technical-debt register

This document records only active, actionable technical debt. Functional
problems and missing capabilities belong to the
[product roadmap](product-roadmap.md); in particular, the profile, unit and
Quick Workout problems are not duplicated here.

## Maintenance rules

- Every entry must state impact, verifiable evidence, a solution direction and
  closure criteria.
- Debt is removed from this register when it is closed. Extensive evidence from
  closed audits is preserved in `docs/history/`.
- Product decisions are linked, never duplicated here.
- An accepted limitation is documented as context. It does not become active
  debt without new evidence that justifies prioritising it.

## Active debt

<a id="td-27"></a>

### TD-27 · `WorkoutProgressService.getProgress` scans the entire history

**Status:** active. Related to `DATA-01`-`DATA-05` in the
[product roadmap](product-roadmap.md#analytics-and-historical-data-foundation),
which are `IN_PROGRESS`: the implementation exists and is awaiting staged
rollout, so this entry stays open until the production gates pass.

**Impact:** the cost of `GET /workouts/progress` grows with the user's entire
training history. Every request transfers and processes all completed sets
needed for volume and records, plus every completed session date needed to
compute streaks. This increases database work, backend memory and CPU, and can
degrade dashboard latency as history grows.

**Evidence:** in
`../sunnsteel-backend/src/workouts/workout-progress.service.ts`, `getProgress`
runs, on every call, a `setLog.findMany` with no time window and no limit, plus a
separate unbounded `workoutSession.findMany` for all historical dates. It then
computes volume, personal records and streaks in memory. The frontend consumes
that request through `useWorkoutProgress` on the dashboard.

**Solution direction:** replace the lifetime scans with persisted data and
bounded queries. `DATA-01` supplies persistent personal records; `DATA-02` and
`DATA-03`, events and aggregates for volume and streaks; `DATA-04`, snapshots
that preserve historical meaning; and `DATA-05`, a repeatable backfill for
existing users. The public progress response must keep its contract while the
source of the calculations changes.

**Closure criteria:**

- `getProgress` no longer queries every completed set and every historical date
  on each request.
- Records, aggregates and events are updated consistently and idempotently, with
  a repeatable backfill for existing history.
- Logic and contract tests demonstrate that the response preserves current
  results, including volume, records, recent activity and streaks.
- A query inspection or measurement against a representative history confirms
  that read work stays bounded and does not grow with the user's whole lifetime.

**Remaining work is deployment, not construction.** The staged sequence, its
gates and the two flags (`WORKOUT_ANALYTICS_JOBS`,
`WORKOUT_PROGRESS_PROJECTION_READS`) live in the
[TD-27 rollout runbook](../reference/td27-analytics-rollout.md); local evidence
is in
[`td27-analytics-local-validation-2026-09-06.md`](../history/td27-analytics-local-validation-2026-09-06.md).

## Accepted limitations

- There are no real measurements on iPhone. Desktop checks can validate ordering
  and behaviour, but they do not quantify the PWA's performance on that device.
- The suite deliberately excludes component and E2E tests: Vitest stays in a Node
  environment for pure logic, auth orchestration and API contracts. This coverage
  boundary is accepted until a concrete need justifies expanding the tooling and
  its maintenance.

## Previous audit

All 27 items from the previous audit were closed or reframed. Their full content
remains as evidence in the
[July 2026 technical audit](../history/technical-debt-audit-2026-07.md), which is
written in Spanish and kept frozen as a historical record. It must not be used as
a list of active debt.

## Document history

- **2026-09-06:** Translated from Spanish to English so both active registers and
  the four `CLAUDE.md`/`AGENTS.md` files share one language. Content is
  unchanged apart from the `DATA-01`-`DATA-05` status note and the pointer to the
  rollout runbook. A stable `td-27` anchor was added so cross-document links no
  longer depend on the heading text.
