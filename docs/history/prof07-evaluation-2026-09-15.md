# PROF-07 scope evaluation — 2026-09-15

PROF-07 is dependency-ready, but its original `M` size understated the verified
reach. The privacy foundation and source data exist; the ordered selection model
and a public achievement payload do not. Shipping it requires contracts,
backend, frontend and a database migration, so the roadmap now records it as
`L`.

## Verified starting point

- `ProfilePrivacySettings` already stores independent `records` and
  `achievements` visibility, and the backend resolves both before querying
  public-profile data.
- `PublicUserProfile` can include all current personal-record frontiers when
  records are allowed. It has no achievements or featured-accomplishment field.
- A record frontier has a stable per-user `exerciseId`. The `PersonalRecord`
  table keeps one current row per user and exercise.
- Earned achievements are immutable `ACHIEVEMENT_UNLOCKED` events whose payload
  carries the stable shared-catalog achievement id. Ranks are derived and are
  not persisted as awards.
- Settings can save who may see achievements, but correctly says that no
  profile achievement surface exists yet.

## Boundary that unblocks ACH-03

PROF-07 should own the generic public-profile foundation and record selection:

1. Add an ordered per-user `FeaturedProfileItem` relation with a discriminated
   kind (`RECORD`, `ACHIEVEMENT`, `RANK`), a stable reference id and a position.
   Cap the combined list at six, reject duplicate references and positions, and
   cascade on account deletion. Existing accounts start with an empty list; no
   backfill is needed.
2. Publish owner request/reference types plus a resolved, discriminated public
   payload. A record resolves through `PersonalRecord.exerciseId`; an
   achievement through its catalog id and earned event; a rank through the
   highest currently reached rank. Never serialize a stale, unknown or
   no-longer-valid reference.
3. Replace the owner's list atomically through a dedicated authenticated
   endpoint. PROF-07's Settings UI selects and orders current record frontiers,
   and the profile renders the resolved featured list as a ruled section.
4. Resolve privacy before data access. `RECORD` items require records access;
   `ACHIEVEMENT` and `RANK` items require achievements access. Filtering one
   kind must not reveal its reference or close the gaps by exposing a denied
   item.

ACH-03 then owns the achievement-specific product layer: choosing earned medals
and at most one earned rank title, using the model, request and public rendering
already delivered by PROF-07. That boundary avoids a second migration while
keeping PROF-07 from duplicating ACH-03's picker and eligibility copy.

## Required verification

- Contracts: discriminated input/output types, six-item limit and package
  publication before either consumer changes.
- Backend: migration and clean-database preparation, atomic replacement,
  ownership, cap/order/duplicate checks, eligibility validation, stale-reference
  omission, and signed-out/follower/owner privacy cases.
- Frontend: record selection and ordering tests, responsive Settings and profile
  states in both themes, then the authenticated owner and public/follower flows.
- Deployment order remains contracts, backend, then frontend. ACH-03 starts only
  after the production public-profile response proves the empty and record-only
  lists without leaking denied achievement slots.

## Recommendation

Start PROF-07 next after the current NOTIF-01 claim clears any contracts/backend
overlap. Claim all three repositories before publishing a contract version.
ACH-03 remains queued behind it and should not introduce its own persistence
model.
