# Portfolio captures

`npm run ui:capture:portfolio` photographs the app for the Sunnsteel case study
in the owner's portfolio (`web_portfolio_next`, which sits beside this workspace
on the development machine). It writes 1440×900 dark viewport frames to
`screenshots/<slug>.png` and regenerates `manifest.json` (slug, route, roadmap
IDs, capture time, pixel size). It is not part of CI or `npm run verify`.

The portfolio copies frames from here byte for byte, and its drift check
(`npm run drift:sunnsteel` over there) compares each published image with the
frame of the same slug by git blob id. So commit the frames exactly as the
capture wrote them, and keep slugs stable: renaming one orphans the image the
portfolio built on it.

Targets live in [e2e/portfolio-targets.ts](../../e2e/portfolio-targets.ts).
When a user-facing page ships or visibly changes, add or update its entry in
the same change (see `CLAUDE.md`, "Portfolio screenshots").

## Before every run: re-seed

A capture run cannot be repeatable on its own. The `live-session` targets have
to start a real session, and the API has no way to remove one: discarding sets
it to `ABORTED`, which the schedule and the dashboard render as "Ended early".
Every run therefore changes the data the next run photographs.

Re-seeding is what makes two runs identical. The reset deletes every session
on the seeded routines, residue included, and rebuilds the history relative to
the day it runs, which also keeps the current week populated. A seed left from
an earlier day is why the dashboard once read 0/4 weekly workouts, 0/7 active
days and a 0-day streak.

```bash
cd ../sunnsteel-backend && npm run db:teardown:portfolio && npm run db:seed:portfolio
```

The capture enforces it: `assertSeedNewerThanLastCapture` in
[e2e/preconditions.ts](../../e2e/preconditions.ts) refuses to start when the
backend's `prisma/.portfolio-seed-manifest.json` is older than the newest frame
in `manifest.json`. `UI_SKIP_SEED_CHECK=1` overrides it.

**Watch the seed's output: it takes several minutes and it can fail late.** The
reset runs first, so a failure after it leaves the account with no portfolio
data at all. On 2026-09-16 the analytics replay overran Prisma's 60-second
interactive-transaction limit against the hosted database and did exactly
that. The batch size and transaction budget are now tunable
(`SEED_REPLAY_BATCH`, `SEED_TX_TIMEOUT_MS`, `SEED_TX_MAX_WAIT_MS` in the
backend's `prisma/portfolio-seed.analytics.ts`), with defaults chosen for the
hosted link. A successful run ends with `Verification passed.` and rewrites the
seed manifest; check for both before capturing. Budget about fifteen minutes
against the hosted database (measured 2026-09-16), most of it the analytics
replay.

The seed picks the active routine's training days around the day it runs,
reaching backwards so the current week already has completed sessions in it
(`activeTrainingDows` in the backend's `prisma/seed-portfolio.ts`). Run it on a
Monday and the dashboard's weekly counters still read zero, because the week
genuinely has nothing behind it yet. That is the one day to avoid for a cover
shot.

## Run

The same prerequisites as `npm run ui:regression`: the local PostgreSQL server,
the backend and the dev server running, and a saved sign-in.

```bash
npm run ui:login
```

```bash
npm run ui:capture:portfolio
```

The run refuses to start while a workout session is open, which is what keeps
the Resume banner out of every frame ([e2e/preconditions.ts](../../e2e/preconditions.ts)).
Each capture ([e2e/portfolio.spec.ts](../../e2e/portfolio.spec.ts)) hides the
Next.js dev overlay, takes the shot with animations disabled, and replaces the
owner's email with `eze@sunnsteel.app` through a MutationObserver, because
React re-renders restore the text. A target fails if the email is still
anywhere in the page's HTML or in a form field.

## Check every frame

Each target declares a `ready` list: text that must be visible before the shot
is taken. It is what stops a frame being a loading skeleton, an empty state or
the wrong record. It is a floor, not a guarantee, so open each PNG anyway. The
2026-09-16 run passed `achievements` while capturing nothing but its skeleton,
and an earlier run passed `routine-builder` and `routine-detail` while pointed
at a stray empty routine; both predate the check.

## Target order and setup steps

Order in `portfolio-targets.ts` is deliberate. The `live-session` targets run
last, because the scratch session each one starts leaves an "Ended early" row
behind and puts a Resume banner on every other protected page. Anything that
must show a clean week, such as `schedule-week`, has to run before them.

A setup step may open a wizard step or start a scratch session and log sets.
It **never presses Finish**: finishing runs the progression engine and
rewrites the next session's prescriptions. It discards the scratch session
afterwards.

Starting a session can still land on a page that does not route into it, so
the live-session setup recovers through `/workouts`, which replaces itself with
the live session. The race behind that was fixed in `7f5dbf7` (2026-09-16); the
recovery stays as a guard.

## Manual fallback

If the command cannot run (for example through the Playwright MCP instead):

1. Load the seed as above, and make sure no workout session is open.
2. The owner signs in. An agent never enters the credentials.
3. Dark theme, 1440×900 viewport, viewport-only shots.
4. Before each shot, hide `nextjs-portal` and the dev indicators, hide
   scrollbars (the command does nothing for them; headless viewport shots have
   shown none so far),
   and replace the owner's email with `eze@sunnsteel.app` under a running
   MutationObserver.
5. A scratch session is fine for a live-session shot. Never press Finish, and
   delete the session afterwards.
6. Check every shot for the real email and for transient banners such as
   "Active workout session in progress".
