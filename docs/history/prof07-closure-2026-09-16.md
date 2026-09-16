# PROF-07 closure — 2026-09-16

PROF-07 ships the reusable featured-accomplishment foundation and its first
owner workflow. Profiles can now show an ordered, curated ledger without
copying mutable record or achievement presentation data into profile storage.

## Product behavior

- Settings lets an owner choose and order up to six current personal records.
- The own profile, authenticated member profile and signed-out member profile
  render the resolved featured ledger when its source privacy permits it.
- Records follow Personal Records privacy. Achievement and rank references
  follow Achievements privacy. Denied, stale, unknown or no-longer-earned
  references are omitted rather than exposed as empty slots.
- The persisted/request model already accepts `ACHIEVEMENT` plus at most one
  `RANK`; ACH-03 owns that earned-item picker and its eligibility copy.

## Delivery

- Contracts: `@sunsteel/contracts@0.44.0` adds the six-slot limit, ordered owner
  selections/replacement request and discriminated record, achievement and rank
  profile payloads. Commit `3824508`; CI run 35073774617 passed, and the npm
  registry package and integrity were verified before either consumer changed.
- Backend: migration `20260916090000_featured_profile_items` adds the ordered
  per-user relation and database uniqueness/check constraints. The dedicated
  service validates current references and replaces the list atomically, then
  resolves public reads through existing records/achievements authorization.
  Commit `6ccb4ea`; documentation follow-up `a3b89fc`; CI runs 35074710042 and
  35076083968 passed. The latest successful Railway deployment contains both
  commits and the production health/deployment chain remains green.
- Frontend: Settings adds current-record selection, ordering, removal and one
  save action while preserving future achievement/rank selections. Profile
  presentation handles all three discriminated item kinds. Commit `0f2da97`;
  Frontend CI run 35102347330 and its Vercel deployment passed.

## Verification

The contracts gate, backend gate (173 tests across 31 files plus analytics
integration) and frontend gate (332 tests across 58 files) passed in isolated
worktrees. The frontend production build ran only in that isolated worktree;
the owner's checkout and active server were not used for a build.

The complete `npm run ui:regression` sweep passed 409/409 cases across every
layout, dialogs, menus, hover and keyboard focus, both themes and widths from
320 through 1440 px. A separate authenticated, reversible browser pass read the
owner's empty featured list, added one current record through Settings, observed
exactly one featured profile row and restored the original empty list. No page
or console error and no horizontal overflow was observed.

The first regression attempt correctly stopped because the backend was down;
the second exposed that a build made without local environment values cannot
initialize Supabase. The isolated stack was rebuilt with the local environment,
the backend was started, and the final focused plus complete runs passed. Two
concurrent migration attempts timed out on Prisma's advisory lock while Railway
was deploying; the deployed migration and the successful real read/write flow
subsequently proved the schema available.

## Not verified

- No authenticated browser session was established on the production Vercel
  origin; deployment readiness is from Vercel's successful status and CI.
- The browser account began with records private and no featured items, so a
  follower/public account with mixed records/achievements visibility was not
  mutated. Focused backend tests cover owner, follower, public, stale-reference
  and visibility filtering branches.
- The UI cannot yet select achievements or a rank; that is intentionally ACH-03,
  not unfinished PROF-07 work.

## Follow-up

Start ACH-03 next. It should add earned medals and at most one currently reached
rank to the existing ordered slots, reuse the published discriminated types and
owner endpoint, and avoid introducing a second persistence model or migration.
