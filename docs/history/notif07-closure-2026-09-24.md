# NOTIF-07 closure — partner activity alerts

Closed 2026-09-24.

## Shipped behavior

- Settings has two independent, off-by-default choices: partner workout
  completions and partner achievements.
- Enabling a choice establishes its timestamp boundary. Earlier activity is
  not replayed, and disabling it removes its visible alerts.
- A workout creates one alert for the completed session, never one per record
  or progression change. Achievements alert only when earned live and exclude
  streak milestones, which already have their own notification behavior.
- Every alert requires an active training partnership, the actor's directional
  activity grant, the actor's current activity audience and no block or
  moderation hide. These rules are re-evaluated on every sync.
- Losing authorization revokes the durable recipient row immediately. Restoring
  it reuses the same source key and keeps the original push claim, so the alert
  may become visible again but Web Push is not delivered twice.
- The notification centre links both facts to the partner's profile. Optional
  Web Push uses the existing device, category and quiet-hours controls.

## Delivery

- Contracts commits
  [`d62cf91`](https://github.com/ezee969/sunnsteel-contracts/commit/d62cf91)
  and
  [`6a8492a`](https://github.com/ezee969/sunnsteel-contracts/commit/6a8492a)
  were published as `@sunsteel/contracts@0.66.1`.
- Backend commit
  [`a2b287a`](https://github.com/ezee969/sunnsteel-backend/commit/a2b287a)
  added migration `20260924100000_partner_activity_alerts`, the minute sweep,
  read catch-up, privacy synchronization, atomic push claim and account-export
  fields.
- Frontend commit
  [`1c38492`](https://github.com/ezee969/sunnsteel-frontend/commit/1c38492)
  added the two controls and the two notification presentations. It was merged
  with the concurrent `ROUT-03` mainline at
  [`1cee9b3`](https://github.com/ezee969/sunnsteel-frontend/commit/1cee9b3)
  without changing `PROG-10`, whose claim remains active.

## Verification

- Contracts verify passed at version `0.66.1`.
- Backend verify passed: lint with no errors and the pre-existing
  `routine-lineage.ts` warning, typecheck, 424 tests across 51 files, build and
  compiled-module import. The CI migration job also applied all migrations to
  an empty PostgreSQL database, checked the schema and proved a second deploy
  is a no-op.
- Frontend verify passed after merging current `main`: lock check, lint with no
  errors and the pre-existing `useSupabaseAuth.ts` warning, typecheck, 599 tests
  across 87 files and the production build.
- Authenticated real-stack flow: both switches changed from off to on through
  `PUT /notifications/preferences` (200); their enable instants were stored;
  a newly seeded partner completion and live achievement appeared through
  authenticated `GET /notifications`; withdrawing the actor's activity grant
  hid both; restoring it returned the same row IDs and `pushProcessedAt`
  values, proving there was no duplicate push claim.
- Browser presentation was checked authenticated with no console errors. The
  scoped Playwright sweep passed 28/28 for Settings and Notifications at
  320/390/430/768/1024/1280/1440 in both themes, one worker.
- CI passed for contracts
  [36007914231](https://github.com/ezee969/sunnsteel-contracts/actions/runs/36007914231),
  backend
  [36007974085](https://github.com/ezee969/sunnsteel-backend/actions/runs/36007974085)
  and frontend
  [36008773294](https://github.com/ezee969/sunnsteel-frontend/actions/runs/36008773294).
- Railway deployment `d8ab166d-e193-45c5-9c24-635cfedf491a` succeeded for
  backend commit `a2b287a`; its pre-deploy log says all 78 migrations were
  applied, `/api/health` returned 200 and a bad bearer token on
  `/api/notifications` returned 401.
- Vercel deployment `dpl_fa1dMjD5dpbQps6tQ3GL6K4EzVB1` reached READY for
  frontend commit `1cee9b3`, and `sunnsteel-frontend.vercel.app` is one of its
  production aliases.

## Not verified

- A physical-device receipt of a partner Web Push. The persisted one-shot claim
  and payload were exercised, but no subscribed phone was made to receive a
  test alert.
- An authenticated browser pass against the production origin. Authentication,
  preferences, privacy withdrawal/restoration and presentation were exercised
  against the real local stack; production was checked through deployment
  metadata, migration logs, health and guarded-route behavior.
- The full 480-case UI sweep. The change is confined to Settings and
  Notifications, so the required page-scoped 28-case sweep was used.
