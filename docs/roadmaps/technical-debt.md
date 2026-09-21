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

Five entries are open: backend authentication debt `TD-43`, frontend PWA
maintenance debt `TD-44`, proxy client-IP handling `TD-46`, dead pre-Supabase
auth code `TD-47` and agent-document drift `TD-48`. `TD-45`, the middleware
matcher gap, closed on 2026-09-21. `TD-30` closed in Phase 13, `TD-34` in Phase 14,
`TD-35`, `TD-37` and `TD-31` straight after it, `TD-32` after Phase 15, and
`TD-33` and `TD-36` to `TD-42` on 2026-09-13 (see the document history).
Phase-by-phase narrative and the full measurement evidence live in
[ui-restyle-progress.md](../ui-restyle-progress.md); only the durable,
actionable residue is recorded here.

<a id="td-43"></a>

### TD-43 — The authentication guard calls Supabase Auth on every protected request

**Impact.** Every protected backend request waits for Supabase Auth and then
for the local user lookup before its controller runs. A page that fans out into
several API reads repeats both operations, adding avoidable latency and making
ordinary data reads depend on the availability of the remote Auth service.
This is not a demonstrated authorization defect or a measured production
bottleneck; it is an unnecessary hot-path dependency now that the project can
verify asymmetric access tokens locally.

**Evidence.**

- `SupabaseJwtStrategy.validate` calls `verifyToken` and then
  `getOrCreateUser` for every route protected by `SupabaseJwtGuard`.
- `verifyToken` calls `supabase.auth.getUser(token)`. Supabase documents that
  `getUser` always makes a request to the Auth server. `getOrCreateUser` then
  performs at least the unique local lookup by `supabaseUserId` and may also
  synchronize email, link a migrated account or create the user.
- The [July 2026 audit](../history/technical-debt-audit-2026-07.md) already
  established that the same verification and synchronization also happen in
  `POST /auth/supabase/verify`; that endpoint is not a prerequisite for
  protected data reads because the guard provisions the local user itself.
- Re-verified on 2026-09-16: the installed `@supabase/supabase-js` is `2.100.1`
  and exposes `auth.getClaims`; the configured project's JWKS endpoint
  advertises an `ES256` public key. Supabase documents `getClaims`/JWKS as the
  local verification path for asymmetric JWTs, with managed public-key
  caching. The legacy service-role API key being `HS256` does not require user
  access tokens to be checked through `getUser`.

**Solution direction.** Replace the normal `getUser(token)` hot path with
`supabase.auth.getClaims(token)` and derive the Supabase identity from the
verified `sub` claim. Preserve validation of expiry, issuer, audience and the
authenticated role; do not merely decode the JWT. `getClaims` must retain its
documented remote fallback for any still-valid symmetric token during the
transition.

Keep the frontend's established invariant that `/auth/supabase/verify` is not a
gate: on a cold local-user miss, a protected request must still be able to link
or create that user safely. Separate that provisioning path and explicit
profile synchronization from the steady-state request path. First remove and
measure the remote Auth call; the indexed local lookup may remain if it is not a
meaningful cost. If measurement justifies caching, cache only the bounded,
short-lived mapping from Supabase `sub` to the minimum local request identity,
with invalidation for account/profile changes and deletion. Do not cache a
mutable Prisma `User` indefinitely or add Redis solely for this item.

**Closure.** All of the following are verified:

- Repeated requests with a current asymmetric access token make no
  `/auth/v1/user` call; a JWKS fetch on an empty key cache is allowed.
- Malformed, expired, wrongly issued, wrongly targeted and unauthenticated-role
  tokens receive `401`.
- Existing, new and legacy-linked local users still resolve correctly; email
  change and conflicting-email behaviour remain explicit and tested.
- A protected request can still provision a new local account before
  `/auth/supabase/verify` finishes, preserving the frontend's non-gating auth
  flow.
- The local lookup count is measured under repeated requests. Any cache added
  has bounded TTL/size plus invalidation and multi-instance semantics covered
  by tests; otherwise the measurement is recorded as the reason to retain the
  indexed lookup.
- Backend lint, typecheck, tests and build pass, and a real bearer-token check
  confirms the production-shaped flow. The backend auth documentation is
  updated in the same change.

<a id="td-44"></a>

### TD-44 — The hand-written service worker owns revisioning and cache lifecycle

**Impact.** The current worker is functional and its known unsafe update paths
have been corrected, so this is not an active user-facing defect. It is a
release-safety and maintainability liability: Sunnsteel owns cache strategies,
precache population, namespace revisioning, obsolete-cache cleanup and worker
update coordination that mature service-worker tooling can generate or provide.
Changes to those concerns have previously hidden current assets during
development and required browser-only diagnosis. The risk increases when the
queued [Web Push foundation](product-roadmap.md#notifications-and-retention)
adds more responsibilities to the same worker.

**Evidence.**

- [public/sw.js](../../public/sw.js) hard-codes `CACHE_VERSION = 'v5'`, the
  precache URL list, three cache namespaces and the routing strategies. Next.js
  content-hashes its build assets, but stable URLs such as `/`, the manifest
  and icons have no build-generated revision manifest; the project must reason
  manually about when a namespace change is required.
- [pwa-provider.tsx](../../providers/pwa-provider.tsx) owns registration,
  waiting-worker activation, one-time reloads and development cleanup. Its
  active-workout deferral is a product invariant that must survive a tooling
  migration, not evidence that the caching implementation must remain manual.
- The [July 2026 audit](../history/technical-debt-audit-2026-07.md) records the
  concrete cost of this ownership: an oversized precached logo, five eager page
  requests on activation, an unreachable API-cache branch, stale cached assets
  obscuring current behavior, unsafe immediate activation and deletion of
  caches not owned by Sunnsteel. `TD-04`, `TD-08`, `TD-13` and `TD-25` repaired
  those symptoms without replacing the underlying manual machinery.
- Workbox, `next-pwa` and Serwist have never been dependencies in this
  repository. The original worker was introduced as a small direct PWA
  implementation; there is no recorded evaluation that rejected build-time
  revisioning in favor of the current design.

**Solution direction.** Replace the hand-maintained precache and runtime-cache
plumbing with an actively maintained, build-integrated service-worker tool. For
the current Next.js application, evaluate `@serwist/next` with an injected
precache manifest first; re-check its Next.js, webpack and Turbopack support at
implementation time rather than pinning this future task to today's package
compatibility. Raw Workbox or another maintained integration is acceptable if
it preserves the same guarantees with less framework coupling. Do not adopt a
zero-configuration default without auditing its generated routes and update
lifecycle.

Keep the application-specific policy explicit:

- navigation HTML stays network-first with offline fallback;
- same-origin static assets may use stale-while-revalidate;
- backend, cross-origin and authenticated API responses are not cached;
- production registration and development cleanup remain separate;
- a waiting worker does not activate or reload the page during
  `/workouts/sessions/*`; and
- cleanup removes only caches owned by the old Sunnsteel worker or the selected
  replacement, never every cache on the origin.

Use custom registration or disable the integration's automatic registration
and `skipWaiting` behavior where necessary to retain those rules. Plan the
upgrade from the currently deployed `/sw.js` and `ss-*-v5` caches as part of
the migration. Keep push subscription and notification behavior in the product
roadmap; this item supplies a safer worker foundation but does not implement
`NOTIF-02` or `NOTIF-08`.

**Closure.** All of the following are verified:

- A production build generates a content-revisioned precache manifest; no
  developer-maintained global cache version or hand-written list of generated
  Next.js assets remains.
- A browser upgrading from the current `/sw.js` installs and activates the new
  worker without an activation loop, mixed-version shell or deletion of
  unrelated origin caches.
- Online navigation, offline fallback, static-asset refresh, auth redirects and
  recovery after reconnect behave as documented. No backend, cross-origin or
  authenticated API response appears in Cache Storage.
- An update discovered during an active workout remains waiting and neither
  reloads nor takes control until the user leaves the session. First install
  does not cause an unnecessary reload.
- Development unregisters the Sunnsteel worker and clears only owned caches;
  a normal development session is not controlled by a production worker.
- The service-worker policy has automated coverage at the appropriate layer,
  `npm run verify` passes, and production-browser checks cover a fresh install,
  an update from the previous worker and an offline revisit. Because the PWA is
  an iPhone target, an installed-iPhone update smoke test is required before
  closure.
- `AGENTS.md`, `CLAUDE.md`, the PWA documentation and the `CORE-02` evidence are
  updated to describe the generated worker and its retained custom policy.

<a id="td-45"></a>

### TD-45 — The middleware matcher skipped four protected prefixes — CLOSED 2026-09-21

**Impact.** The middleware does not redirect signed-out visits to `/schedule`
and `/notifications`. The protected layout's client bundle loads and renders an
empty shell, and only then sends the visitor to `/login`. That redirect has no
`redirectTo`, so after signing in they land on the dashboard instead of the
page they asked for. Signed-in visitors are unaffected. No data is exposed:
every API read still requires a bearer token.

**Evidence.**

- [middleware.ts](../../middleware.ts) listed `/schedule` and `/notifications`
  in `PROTECTED_PREFIXES` with no matching `config.matcher` entry, so Next.js
  never ran the middleware for those paths.
- **It was four, not two, by the time it was fixed.** The drift kept happening
  because the two lists are edited independently: `/activity` arrived with
  `SOC-03` and `/moderation` with `TRUST-04`, each added to the prefixes and
  each missed in the matcher. That is the argument for the test rather than a
  one-time correction.
- [app/(protected)/layout.tsx](<../../app/(protected)/layout.tsx>) redirects
  with `router.replace('/login')`, which carries no `redirectTo`.
- Found in code while verifying `ARCHITECTURE.md` on 2026-09-16; not yet
  reproduced in a browser.

**Resolution (2026-09-21).** All four entries added, `PROTECTED_PREFIXES`
exported, and [middleware.test.ts](../../middleware.test.ts) added to compare
the lists in both directions — a protected prefix with no matcher entry, and a
matcher entry for a route nothing protects (the waste `TD-16` removed for
`/auth/:path*`). Next.js statically analyses `config.matcher` at build time and
rejects a computed value, so it has to stay literal; the test is what makes
that safe.

**Closure.** All of the following are verified:

- Signed-out requests to `/schedule`, `/notifications`, `/activity` and
  `/moderation` return `307` to `/login?redirectTo=<original>`, checked against
  the running app; `/dashboard` still behaves identically.
- The test fails, naming the missing prefix, when a matcher entry is removed —
  confirmed by removing `/moderation/:path*` and watching it report
  `expected [ '/moderation' ] to deeply equal []`.
- `npm run verify` passes.

<a id="td-46"></a>

### TD-46 — Client IP handling behind the proxy is unverified (throttling and `/metrics`)

**Impact.** Two backend controls depend on the caller's IP address, and
neither sets how that address is derived behind Railway's proxy. If the rate
limiter sees the proxy's address instead of the client's, all users share one
bucket of 100 requests per minute. One busy client, or a page that fans out
into many reads, could then exhaust it for everyone. Separately, the `/metrics`
allowlist trusts a header the client can set, so a caller can claim an
allowlisted address. The endpoint exposes only default Node process metrics, so
the `/metrics` issue is low severity. Neither issue has been observed in
production; this entry exists so both get checked.

**Evidence.** Backend, verified in code on 2026-09-16:

- `src/main.ts` never sets `trust proxy`, and no code overrides the
  throttler's tracker. The installed `@nestjs/throttler`'s
  `ThrottlerGuard.getTracker` returns `req.ip`. Without `trust proxy`, `req.ip`
  is the socket peer, which behind a reverse proxy is the proxy itself.
- `ThrottlerModule.forRoot` in `src/app.module.ts` registers one global limit:
  100 requests per 60 s.
- `MetricsController.clientIp` (`src/metrics/metrics.controller.ts`) uses the
  first `X-Forwarded-For` entry when the header is present. Proxies usually
  append the real peer to any incoming header, which leaves the client's own
  value first. The allowlist defaults to `127.0.0.1,::1` when
  `METRICS_IP_ALLOWLIST` is unset.
- Not verified: what `req.ip` is in production, how Railway's edge sets
  `X-Forwarded-For`, and whether `METRICS_IP_ALLOWLIST` is set in production.

**Solution direction.** Measure first: temporarily log `req.ip`,
`req.socket.remoteAddress` and `X-Forwarded-For` for one production request.
Then set `trust proxy` to exactly the number of proxy hops Railway adds, so
`req.ip` is the real client for both the throttler and `/metrics`. Change the
metrics controller to use `req.ip` instead of parsing the header itself. If
nothing scrapes `/metrics`, consider protecting it with a bearer secret, or
disabling it, instead of relying on an IP allowlist.

**Closure.** All of the following are verified:

- The production measurement is recorded here.
- Two clients on different addresses are throttled independently in
  production, or the measurement shows they already were.
- An external request to `/metrics` with a forged
  `X-Forwarded-For: 127.0.0.1` is refused.
- Backend lint, typecheck, tests and build pass.
- `ARCHITECTURE.md` is updated.

<a id="td-47"></a>

### TD-47 — Dead pre-Supabase auth code and unused dependencies remain wired

**Impact.** No user-visible effect. The leftover code misleads readers about how
auth works: a JWT module, refresh tokens, a token blacklist and a password check
all look live. It also keeps unused packages in the dependency audit, runs a
nightly job against a table nothing writes, and leaves an unguarded
password-checking endpoint reachable.

**Evidence.** Verified on 2026-09-16 by searching every import in the backend's
`src/`, `prisma/` and `scripts/` and in the frontend source.

- **Unused dependencies.** Nothing imports `redis` or `passport-jwt` (backend
  `dependencies`), or `@types/passport-jwt` and `@types/passport-local` (backend
  `devDependencies`). The auth strategy uses `passport-http-bearer`.
- **Dead token machinery.** `TokenModule`, `TokenService` and
  `JwtModule.register({})` in `AuthModule` are registered, but nothing calls
  `generateTokens`, `verifyRefreshToken`, `revokeAllUserTokens`,
  `blacklistAccessToken` or `isTokenBlacklisted`. Only the midnight `@Cron`
  runs, and it deletes expired `BlacklistedToken` rows that nothing creates. The
  `RefreshToken` and `BlacklistedToken` models remain in the schema.
- **Legacy password path.** `bcrypt` is used only by the unguarded
  `POST /auth/supabase/migrate`, which checks a password against
  `User.password`, and by `UsersService.create`, which has no callers. In the
  frontend, `useSupabaseMigrateUser` and `useSupabaseProfile`
  (`lib/api/hooks/useSupabaseAuth.ts`) have no consumers. They are the only
  callers of their service methods, and so the only frontend callers of
  `POST /auth/supabase/migrate` and `GET /auth/supabase/profile`.
- **Inert cookie.** `POST /auth/supabase/verify` and `/logout` set and clear a
  cookie on the backend's domain that the production middleware never sees.
  The July audit already noted this under TD-18. The frontend's `signOut` still
  calls `/logout` only for that cookie. `verify` also runs
  `getUserBySupabaseId` just to label a log line.
- **Broken script.** The backend's `docs:update` is an `echo`, and `docs:check`
  runs `scripts/run-update-docs.js`, which wraps `update-docs.sh`/`.ps1` for a
  backend `docs/` folder that was deliberately removed. The frontend removed its
  equivalents in CL-05.

**Solution direction.** Before removing the password path, query production
for users that still have a `password` and no `supabaseUserId`. If any remain,
decide with the owner how they migrate. Then, in one backend change:

- uninstall the four packages;
- delete `TokenModule`, `TokenService`, `JwtModule`, `@nestjs/jwt` and the cron;
- delete the migrate endpoint, `UsersService.create` and `bcrypt`;
- delete the backend's cookie handling and the `docs:*` scripts;
- drop the two token tables, and `User.password` if the query allows, in a
  migration that `scripts/prepare-analytics-test-db.ts` also applies.

In the frontend, delete the two unused hooks, their service methods and the
`/logout` call. Keep `passport` and `reflect-metadata`, which are required
peers.

**Closure.** All of the following are verified:

- The result of the production password query is recorded here.
- The listed code, packages, scripts and tables are gone, or kept with a
  recorded reason.
- `npm run verify` passes in both repositories, and so does the
  analytics-integration job.
- Sign-in, sign-out and a protected read work with a real Supabase token.
- `ARCHITECTURE.md` §1 and `TECH_STACK.md` no longer list the removed items.

<a id="td-48"></a>

### TD-48 — Agent documents contradict the code

**Impact.** Agents and contributors follow `CLAUDE.md` and `AGENTS.md` as
instructions, so each contradiction below can send work in the wrong direction.
The first one invites exactly the misunderstanding that TD-21, and decision D2
in `ARCHITECTURE.md`, explain.

**Evidence.** Verified on 2026-09-16:

- **Backend `CLAUDE.md`/`AGENTS.md`, Auth.** They say that
  `POST /auth/supabase/verify` sets the `ss_session=1` cookie the frontend
  middleware uses for route protection. The middleware actually reads the
  cookie set by the frontend's own `app/api/session/route.ts`. The backend's
  cookie never reaches it in production (see `TD-47`).
- **Backend `CLAUDE.md`/`AGENTS.md`, Commands.** They describe `start:dev` as
  "tsx watch". `package.json` actually runs
  `node --watch -r ts-node/register -r tsconfig-paths/register src/main.ts`.
- **Backend `CLAUDE.md`/`AGENTS.md`, Workouts module.** They say the workout
  services live under `src/workouts/services/`. Most of the listed services
  (read, strength trend, exercise performance, muscle heatmap, volume trend,
  progress timeline, plateaus) are top-level files in `src/workouts/`.
- **Frontend `CLAUDE.md`/`AGENTS.md`, Conventions.** They say
  `eslint-plugin-prettier`, `eslint-plugin-import` and
  `eslint-plugin-simple-import-sort` are installed but not configured. All
  three are imported and configured in `eslint.config.mjs`, which the same
  file's formatting bullet relies on.
- **`TECH_STACK.md`.** Its backend module list omits `schedule` (the
  schedule-overrides module), `notifications` and `goals`.

**Solution direction.** In one documentation change, correct each statement
against the code in both twins of each repository and fix the module list in
`TECH_STACK.md`.

**Closure.** All of the following are verified:

- Each statement above is corrected in both twins.
- In each repository, the two twins differ only in their headers and
  twin-pointer lines.
- `TECH_STACK.md` lists every module in `src/app.module.ts`.

---

TD-28 and TD-29 were closed on 2026-09-07 after device confirmation; see the
document history below. Both were frontend defects with no production impact on
stored data.

<a id="td-27"></a>

TD-27 closed on 2026-09-07. See the [closure record](../history/td27-closure-2026-09-07.md) for implementation and production evidence.

## Accepted limitations

- There are no real measurements on iPhone. Desktop checks can validate ordering
  and behaviour, but they do not quantify the PWA's performance on that device.
- **The layout is effectively two-state below `lg`.** 320, 375, 390 and 430 are
  byte-identical in layout signature on all eight routes in both themes, and
  nothing changes until 640 — measured in Phase 9 across 144 checks, not
  asserted. The cause is 290 `sm:` sites against 51 `md:` and 26 `lg:`.
  Redistributing them is a layout rewrite rather than a defect fix, so this is
  documented as a boundary. New evidence of a concrete problem at a specific
  width would be needed to make it active debt.
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

- **2026-09-16 (revision 18):** Recorded `TD-45` to `TD-48`, found while
  verifying the new workspace `ARCHITECTURE.md` against all three repositories.
  `TD-45`, `TD-47` and `TD-48` are verified in code. `TD-46` is verified in
  code, but its production effect depends on how Railway's proxy forwards
  addresses and still has to be measured. No implementation changed in this
  revision.
- **2026-09-16 (revision 17):** Recorded `TD-44`. The current service worker is
  safe enough to remain shipped, but cache revisioning and lifecycle behavior
  are still hand-maintained despite several closed incidents in the July audit.
  The future migration must preserve production-only registration, scoped
  cleanup, no API caching and active-workout update deferral. No implementation
  changed in this revision.
- **2026-09-16 (revision 16):** Recorded `TD-43` after re-verifying the backend
  guard and current Supabase capabilities. The July audit already documented
  the repeated `getUser` plus `getOrCreateUser` work, but only as evidence for
  removing the frontend verification gate; it had never been retained as an
  actionable backend optimization. No implementation changed in this revision.
- **2026-09-13 (revision 15):** Closed and removed `TD-39` on the owner's
  review of the A|B capture set, and `TD-40`, `TD-41` and `TD-42` once their
  checks passed. The register is empty.

  - `TD-40`: the layout titles `/profile` "Profile" and `/search` "Search", and
    a route without a sidebar item resolves to no active id, so nothing is
    marked. Neither function falls back to Dashboard any more.
  - `TD-41`: the owner kept the day rows. The Quick Start tiles are gone, and
    each row's caption now carries what only they said: `formatExerciseCount`
    ("1 exercise", tested) and "Not scheduled for today" where Start is
    disabled. The wizard's day card uses the same formatter.
    `features/routines/utils/routine-detail.utils.ts` lost its only importer
    and was deleted.
  - `TD-42`: the session, history-detail and skeleton lists rule their rows
    with `.rule-row` instead of `divide-*`.

  Verified in the browser in both themes:
  - `/profile`, `/profile/<username>` and `/search` at 390 and 1440: the right
    title, 0 `aria-current`, 0 markers.
  - The routine page at 390/768/1440: no Quick Start, three Start controls, and
    every caption reads "1 exercise · Not scheduled for today".
  - The only finished session has one exercise, so its row was cloned in place
    into completed, incomplete, completed. On history detail and on the session
    page, the completed rows computed `--success-strong`, the incomplete one a
    transparent edge, and only the last row dropped its bottom rule. The
    skeleton's rows were all transparent.

  Vitest 180 of 180. The first full sweep failed one test, `layout profile` at
  430 dark: the shell rendered before the profile content arrived. It passed on
  re-run, all 14 profile widths passed, and a second full sweep passed 283 of
  283.

  `TD-33` recurred at 12:28, and the new check caught it. The owner's
  PowerShell history shows a bare `npm install` in both repos, run to update a
  stale `node_modules`. It rewrote the frontend lock without four `@emnapi`
  entries and with `"peer": true` added to 18 others; the backend's lock came
  out unchanged. HEAD's lock already pinned the new version, so `npm ci` would
  have written nothing. Measured in a scratch package: npm runs the root
  `postinstall` after writing the lock for a bare `npm install` and for
  `npm ci`, and not at all for `npm install <pkg>` or `npm uninstall`.

  Three guards were added on that basis:
  - `postinstall` runs `scripts/check-lockfile.mjs --postinstall`. It restores
    missing entries unchanged from `HEAD`, at their original positions, and
    never fails an install.
  - `.githooks/pre-commit` refuses a staged lock that fails the check. It is
    activated by `prepare` through `core.hooksPath`, and `.gitattributes`
    pins it to LF.
  - `npm run lock:repair` does the same restore by hand.

  Tested on `d489872^`: 5 entries restored byte-identical to the fix commit,
  in its order, and a second run changed nothing. Against a bad ref the
  postinstall mode warned, exited 0 and left the lock untouched. In a scratch
  clone the hook refused a damaged staged lock and accepted the repaired one.
  The working lock was repaired the same way; its only difference from HEAD is
  the 18 `peer` flags. `CLAUDE.md` and `AGENTS.md` now say to sync with
  `npm ci`.
- **2026-09-13 (revision 14):** Closed and removed `TD-33`, `TD-36` and
  `TD-38`;
  applied `TD-39`, which stays open pending the owner's capture review (see
  its status note); recorded `TD-40`, spotted in that review's `profile`
  captures; and recorded `TD-41` and `TD-42` from `TD-38`'s captures. `TD-42`'s
  cascade was measured in the browser, but not yet on a live page with more
  than one exercise.
  `TD-33` closed by the entry's second route, a loud check, because a
  Linux-generated lock was not available (no WSL or Docker on the owner's
  machine). `scripts/check-lockfile.mjs` (`npm run lock:check`) walks
  `package-lock.json` with Node's resolution rules — nearest `node_modules`
  first, then upward — and fails, naming each gap, when a dependency, optional
  dependency, root dev dependency or non-optional peer has no entry. It reads
  only the lock, so it is the first step of both `npm run verify` and CI, ahead
  of `npm ci`, and it runs on Windows, where `npm ci --dry-run` cannot see the
  failure. Replayed over the last 40 lock revisions against 247 CI runs: it
  flags all four revisions whose run failed at install with `EUSAGE`
  (`60f0fba`, `f668e2d`, `ab2f151`, `cfacdbd`) and passes every revision whose
  run was green; the other failures it passes were typecheck errors (`09f0285`,
  `7639edc`) or February–March runs with no step data. Its first CI run is the
  owner's next push. `TD-36`: the close control now renders on the mobile
  branch; opening the drawer moves focus to it, Escape closes it, and focus
  returns to the header's menu button; the closed drawer is `inert`, and the
  main column is `inert` while the drawer is open, so Tab cannot reach controls
  under the scrim. The footer profile link also closes the drawer now — it was
  the one link that left it open. `inert` is a plain boolean: the App Router
  renders with Next's vendored React 19.2 canary, and `@types/react/experimental`
  types it, even though `package.json` pins React 18.3. Verified: `mobile
  drawer`, `mobile drawer close control` and `keyboard focus` 20 of 20 at every
  width in both themes, and a scripted pass at 320/390/430 — focus lands on the
  close control, Tab never reaches covered content (past the last stop it
  reaches only the dev-only Next.js overlay), Escape closes and restores focus,
  and React logs no attribute warnings. The full `npm run ui:regression`
  sweep then passed 283 of 283.

  `TD-38`, one batch on existing patterns, as the entry asked:
  - `/routines/[id]` moved to `.ledger-page`. `RoutineHeader` became the
    history detail page's masthead: back control, bracketed inscription, the
    schedule as a caption, and actions that wrap over the double rule.
  - The days became one ruled list, with each exercise a ruled entry whose sets
    are Space Mono data. That replaced the bordered `bg-card` boxes, the
    numbered tiles and the outlined badges.
  - The eight error and not-found boundaries now share
    `components/layout/RouteError.tsx`: masthead, the error text in a `sunk`
    well, one filled retry and outline alternatives. There were five segment
    boundaries, not four, and `routines/error.tsx` lost a `// @ts-nocheck`.
  - `sessions/loading.tsx` renders the page's own `SessionLoadingSkeleton`,
    rewritten to the current screen without the removed action card, and
    `workouts/loading.tsx` mirrors the "No Active Workout" page.

  Captured at 390/768/1440 in both themes, 36 captures, reaching the
  failure-only surfaces by holding or failing the requests that feed them:
  - the routine detail, with a day open;
  - `not-found`;
  - the session skeleton, by holding the session request;
  - `workouts/loading.tsx`, by holding the page chunk;
  - `routines/error.tsx` inside the shell, by failing its chunk;
  - `app/error.tsx` replacing the shell, by failing the dashboard chunk.

  The other segment boundaries and `global-error.tsx` render the same
  component, and were not captured individually. The captures caught one
  defect before closure: a `border-b-0` meant to stop double rules also
  cancelled the day list's `divide-y`, so the days had no rules. The sweep then
  passed 283 of 283. Retained for future sessions: the
  backend's `start:dev` is `node --watch`, which also watches `node_modules`,
  so an `npm install` in the backend repo restarts it — one did at 12:28 and
  took down a full sweep 171 tests in. A sweep that meets a restart reports the
  saved sign-in as signed out, or the backend as not answering. For a long
  sweep, run the backend without the watcher
  (`node -r ts-node/register -r tsconfig-paths/register src/main.ts`).
- **2026-09-13 (revision 13):** Closed and removed `TD-32` on the owner's
  confirmation. The thirteen files were re-checked first — their only importers
  were each other — then deleted with the two folders they left empty
  (`components/backgrounds/`, `app/(auth)/components/`) and the two
  dependencies only they imported, `react-day-picker` and
  `@radix-ui/react-popover` (with `react-day-picker`'s own three). Counted again over the Phase 1 scope, every file now matches live code: 2 hex values (the theme grounds in `themeColor`), 0 `rgba()`, 0 raw palette classes, 5 radius values, only `shadow-overlay` and `shadow-none`, and 7 files whose inline styles carry runtime values.
  The uninstall reproduced `TD-33` — recorded under that entry. `npm run verify` passes end to end on the final tree, after a clean `npm ci` from the rebuilt lock (549 packages, five fewer).
- **2026-09-12 (revision 12):** Phase 15 cleanup. Corrected `TD-32`: the
  parchment and gold-vignette overlays were not reachable only from dead files —
  the protected route fallback rendered both on every navigation until this
  phase took them out of it — and the list now holds thirteen files plus
  `react-day-picker`, flagged rather than deleted pending the owner's
  confirmation. Recorded `TD-38` for four surfaces that are token-clean but
  still carry pre-v1.0 composition, and `TD-39`: the body face never reached
  `<html>`, so unranked text has always rendered in the system font. Found only
  because deleting the Bebas heading rule exposed one heading that had been
  leaning on it. Retained for future sessions: the census
  script counts what a list asserts; this list was wrong in a way only a count
  could show. Verified: `npm run verify` green on the final tree.
- **2026-09-12 (revision 11):** Closed and removed `TD-31`. Both surfaces are
  on the system's tokens, checked by auditing each one's rendered DOM rather
  than its source. The splash went from 27 raw palette, gradient and radius
  classes plus 6 inline colour styles (gold hexes, glows) to none, at 390 and
  768 in both themes — it renders only below 1024, so 1440 has nothing to
  capture. The dev-only performance panel went from 8 to none at 390, 768 and
  1440 in both themes. The splash keeps its photograph, timing and copy: its
  ground follows the theme, the type sits on an opaque `panel` instead of
  gradient scrims and a vignette, the gold wordmark and laurel are ink with the
  screen's one pair of corner brackets in place of four amber corner frames,
  the progress track is square with an ink fill, and every entrance is an
  opacity fade — no rise, scale, spin, shimmer or particles. `children` still
  mount on the first frame, and the content wrapper animates opacity only. The
  panel gained a visible keyboard focus ring it never had, and stays inside a
  320px viewport. `corner-accent.tsx` lost its only importer and was deleted.
  Retained for future sessions: `HeroSection`'s comment cites a v1.0 §1.4 rule
  retiring the photographic hero that `ui-design-system.md` does not contain —
  cite the written rules, not the comment.
- **2026-09-12 (revision 10):** Closed and removed `TD-35` and `TD-37`. The
  closure check passed in full: every `npm run ui:regression` check on the
  changed routes — the members, routine detail, session and progress layouts
  at all seven widths in both themes, and both dialog checks on the session
  screen — 70 of 70. Two of `TD-35`'s recorded causes were wrong, and
  measurement corrected them before anything was changed: on `/routines/[id]`
  the overflow was `RoutineHeader`'s action row, which could not wrap, not the
  Quick Start day buttons; on the session screen it was the set row's fixed
  column minimums (46 + 62 + 72 + 48px plus the checkbox column, 273px against
  228px at 320), not the 13px captions, which fit their columns. The fixes are
  CSS and markup only: the header rows wrap; below `sm` the three field columns
  size to their captions, the weight column takes the larger share and the
  fields drop their side padding — a five-character weight measures 49px
  against a 53px field at 320, still at 16px (TD-29) — and the checkbox keeps
  its 44px hit area without reaching the RPE field; the public header's
  wordmark and spacing tighten below `sm` while the 44px theme toggle stays.
  `/progress` had three secondary `h1`s, not one: the selected exercise, plus
  error and empty states the sweep had not reached; all three are `h2` with
  unchanged classes. Retained for future sessions: record a cause only after
  measuring it — both wrong guesses were plausible readings of an offender
  list.
- **2026-09-12 (revision 9):** Closed and removed `TD-34`:
  `e2e/preconditions.ts` now fails both Playwright specs when a workout session
  is live. Verified by pointing the real check at a mocked active-session
  response (it returned the session's id) and at the real state (it returned
  none); the baseline keeps one declared exception, `UI_SESSION_ID`, for
  capturing the session screen itself. The same check fails fast, naming the
  failing request, when the backend is down or the app signs the saved session
  out — two conditions that had each been misreported as an expired sign-in.
  Recorded `TD-35`–`TD-37` from the Phase 14 regression sweep. Retained for
  future sessions: an open Radix menu marks the rest of the page `aria-hidden`,
  so a role-based locator for anything outside it returns nothing until the
  menu closes.
- **2026-09-11 (revision 8):** Narrowed `TD-31` to the splash and the debug
  panel: `/workouts/history/[id]` is restyled onto the session screen's
  patterns, verified with no raw-palette classes in its rendered `main` and 12
  captures (completed and aborted sessions, 390/768/1440, both themes).
- **2026-09-11 (revision 7):** Closed and removed `TD-30`: `honour-bright`
  no longer appears anywhere in the tree, and the session progress bar it
  coloured is `--success-strong`, verified in fresh session captures in both
  themes. Narrowed `TD-31` after the Phase 13 restyle rebuilt the auth screens
  and the profile, and added the history detail page, which no phase had
  covered. Widened `TD-32` with the auth components the rebuild orphaned and
  `calendar`. Retained for future sessions: `TD-30`'s closure took one class;
  finding it took a compiled-stylesheet grep, because the fallback it produced
  rendered plausibly.
- **2026-09-09 (revision 6):** Recorded `TD-30` to `TD-34` from the Phase 8/9 UI
  restyle. The register had been empty since revision 5; these are the durable
  residue of that work, not its narrative — the phase log and the full
  measurement evidence stay in `docs/ui-restyle-progress.md`, which is a working
  document for the restyle rather than a permanent register. Two of the five
  (`TD-30`, `TD-33`) are the same failure mode revision 5 called out: something
  that emits no error and still renders or installs plausibly. `TD-33` predates
  the restyle entirely and would have broken CI for anyone. Also recorded the
  `sm`/`md` cliff as an accepted limitation, now measured across 144 checks
  rather than inferred from the class counts.
- **2026-09-07 (revision 5):** Closed and removed `TD-28` and `TD-29` after the
  owner confirmed all three device criteria on an iPhone: focusing an input no
  longer zooms the page, a five-character weight stays legible at 16px, and the
  completion checkbox changes colour through a real save. The register is empty
  again. Retained for future sessions, because both defects were invisible to
  every automated check this repo has: an undefined Tailwind variant emits no
  CSS and no build error, and a class override that loses a deliberate
  accessibility mitigation still type-checks and still passes lint. Grepping the
  compiled stylesheet is what found and then verified both.
- **2026-09-07 (revision 4):** Applied the fixes for both entries. `TD-29`
  dropped the `text-sm` override at the three set inputs; `TD-28` moved the
  save state onto the completion checkbox as a ring, on the owner's decision,
  and removed the last `xs:` usages. Both remain open on purpose: their
  remaining criteria are device observations, and neither can be verified from
  a build. Vitest is Node-only, so no test covers either change.
- **2026-09-07 (revision 3):** Corrected `TD-29` against a device screenshot.
  The entry had claimed the 16px fix would widen the inputs and force a
  redesign; it does not, because the columns are `flex-1` and the input is
  `w-full`, so font size changes the digits and not the box. That inverts the
  pair: `TD-29` is a three-class change, and `TD-28` is the one needing a
  design decision, because the same screenshot shows no room left for a fourth
  element in that row.
- **2026-09-07 (revision 2):** Recorded `TD-29` from a device report: focusing a
  set input zooms the page on iOS. The cause is three call sites overriding the
  16px mobile font size that `components/ui/input.tsx` already sets for exactly
  this reason, not a missing mitigation. Cross-linked to `TD-28` because both
  closure checks need the same narrow-viewport pass on the same row.
- **2026-09-07:** Recorded `TD-28` after a production-build check of the compiled
  stylesheet showed the `xs:` variant generating no CSS. Found while adding the
  RPE column for `LIVE-04`, which shares the affected row; the two are related
  only by that layout, so the breakpoint defect was left out of that change
  rather than folded into it.
- **2026-09-06:** Translated from Spanish to English so both active registers and
  the four `CLAUDE.md`/`AGENTS.md` files share one language. Content is
  unchanged apart from the `DATA-01`-`DATA-05` status note and the pointer to the
  rollout runbook. A stable `td-27` anchor was added so cross-document links no
  longer depend on the heading text.
