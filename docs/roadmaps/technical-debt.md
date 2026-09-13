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

Three entries are open: `TD-40`, found during `TD-39`'s capture review, and
`TD-41` and `TD-42`, found during `TD-38`'s. `TD-30` closed in Phase 13,
`TD-34` in Phase 14, `TD-35`, `TD-37` and `TD-31` straight after it, `TD-32`
after Phase 15, and `TD-33`, `TD-36`, `TD-38` and `TD-39` on 2026-09-13 (see
the document history). All three open entries are frontend-only and none
affects stored data.
Phase-by-phase narrative and the full measurement evidence live in
[ui-restyle-progress.md](../ui-restyle-progress.md); only the durable,
actionable residue is recorded here.

<a id="td-40"></a>

### TD-40 — `/profile` and `/search` are titled and marked as the Dashboard

**Impact.** On every profile page — the owner's and other members' — and on
search results, the header reads "Dashboard" and the sidebar marks Dashboard as
the current page, including `aria-current="page"` on its link. A sighted user
is shown the wrong location, and a screen-reader user is told it.

**Evidence.** `app/(protected)/layout.tsx` derives both from the pathname, in
`getActiveNavFromPath` and `getTitleFromPath`. Neither has a case for
`/profile` (`profile/[[...userId]]`, which serves both the owner and other
members) or `/search`, and both fall back to `'dashboard'`/`'Dashboard'`. The
other eleven protected routes are covered. Seen in the 2026-09-13 TD-39
captures: `profile` at 1440 shows "DASHBOARD" in the header and the Dashboard
marker in both themes.

**Solution direction.** Add title cases for both routes. Neither has a sidebar
item, so the nav should resolve to an id outside `SIDEBAR_NAV_ITEMS`:
`Sidebar.tsx` already hides the marker when the active id is not in that list.
Replace the silent `'dashboard'` fallback too, so a future route shows no
marker rather than a wrong one. The two titles' wording is a copy decision.

**Closure.** On `/profile`, `/profile/<username>` and `/search` the header
names the page and no sidebar item carries the marker or `aria-current`,
checked in both themes at 390 and 1440, and `npm run ui:regression` stays green.

<a id="td-41"></a>

### TD-41 — Routine detail starts each day from two places and says "1 exercises"

**Impact.** On `/routines/[id]` every day has two start controls: a Quick
Start tile and the Start/Resume button on its row in Routine Days. The tiles
are a grid of boxed buttons, where §11.5 keeps boxes for overlays, session set
rows and a screen's single primary action. Each tile also reads "1 EXERCISES"
for a one-exercise day.

**Evidence.** In `app/(protected)/routines/[id]/page.tsx` the Quick Start grid
and `RoutineDayAccordion`'s `onStartWorkout` both call
`sessionManager.handleStart(day.id, activeSession)`. The count is
`{day.exercises?.length || 0} exercises` (`page.tsx:166`), and the wizard's
`RoutineDayCard.tsx:41` has the same unpluralised count.
`lib/utils/routine-format.ts` pluralises days (`formatDaysPerWeek`) but nothing
covers exercises. Seen in the 2026-09-13 TD-38 captures of a three-day routine.
The tiles also carry the only "Not scheduled for today" explanation: the row
buttons are disabled without one.

**Solution direction.** Pluralise the count through a formatter beside
`formatDaysPerWeek`, with a Node test, and use it in both places. Which start
surface stays is the owner's decision — the tiles or the rows. Whichever stays
must keep the "Not scheduled for today" explanation.

**Closure.** Counts read "1 exercise" and "N exercises" everywhere; each day
has one start control on the page, or the decision to keep both is recorded
here; captured at 390/768/1440 in both themes; `npm run ui:regression` green.

<a id="td-42"></a>

### TD-42 — `divide-rule-faint` repaints the `.mark` edge of every row but the last

**Impact.** In a ruled list whose rows carry `.mark`, every row except the last
gets a 3px left bar in `--rule-faint`, and a status colour set through
`.mark-success`, `.mark-honour` or `.mark-warning` is replaced by that grey. A
completed exercise therefore loses its success mark (§4.3 rule 2) unless it is
the last row, and an unmarked row gains a mark it should not have.

**Evidence.** Tailwind v4's `divide-*` colour utility sets `border-color`, all
four sides, on every child but the last, from `@layer utilities`. `.mark` and
`.mark-*` set `border-left-color` in `@layer components`
(`app/globals.css:345-356`), and a later layer wins regardless of specificity.
Measured on 2026-09-13 on the session skeleton at 1440: rows 0 and 1 compute a
3px left border in `--rule-faint` and the last row a transparent one. With
`mark-success` added in place, row 0 still computed `--rule-faint` and the last
row `--success-strong`. Three lists pair the two:
- the session page (`workouts/sessions/[id]/page.tsx:266`). Its
  `ExerciseGroup` uses `mark mark-fill`, whose completion fill is a `::before`
  overlay, so completion still draws there but incomplete rows get the bar.
- history detail (`workouts/history/[id]/page.tsx:87`). `HistoryExerciseGroup`
  is `mark mark-success`, so the success mark is lost on every row but the
  last.
- `features/workout/session-loading-skeleton.tsx:82`.

Not yet observed on a live page: the one finished session in the dev data has a
single exercise, which is always the last row. The other `divide-rule-faint`
lists (progress, session comparison, performance history, muscle heatmap) have
not been checked for `.mark` rows.

**Solution direction.** Rule these lists with `.rule-row` on the rows instead of
`divide-*` on the parent: §11.5 names `.rule-row` as the between-items rule, and
it sets only `border-bottom`, so it never touches the mark's edge. Check the
remaining `divide-rule-faint` lists at the same time.

**Closure.** On a session and a history detail with at least three exercises,
incomplete rows other than the last show no left bar and completed ones show
`--success-strong`, in both themes. The skeleton matches, and
`npm run ui:regression` is green.

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

- **2026-09-13 (revision 15):** Closed and removed `TD-39` on the owner's
  review of the A|B capture set.

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
