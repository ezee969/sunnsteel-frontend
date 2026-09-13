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

Four entries are open: `TD-33` from the Phase 8/9 UI restyle, `TD-36` from the
Phase 14 regression sweep, and `TD-38` and `TD-39` from the Phase 15 cleanup.
`TD-30` closed in Phase 13, `TD-34` in Phase 14, `TD-35`, `TD-37` and `TD-31`
straight after it, and `TD-32` after Phase 15 (see the document history). All are frontend-only and none affects stored data.
Phase-by-phase narrative and the full measurement evidence live in
[ui-restyle-progress.md](../ui-restyle-progress.md); only the durable,
actionable residue is recorded here.

<a id="td-33"></a>

### TD-33 — `npm ci` breaks whenever the lock is regenerated on Windows

**Impact.** CI fails at the install step with `EUSAGE — Missing:
@emnapi/runtime@1.11.3 from lock file`, before any check runs. It blocks every
push until the lock is patched.

**Evidence.** `@img/sharp-wasm32` (an optional platform variant of `sharp`,
pulled in transitively by `next`) declares `@emnapi/runtime@^1.11.3`, and
`@rolldown/binding-wasm32-wasi` peer-depends on `@emnapi/core`. npm on Windows
resolves the native win32 binary and never writes the wasm32 branch's
dependencies into the lock; `npm ci` on Linux validates every platform and
fails. `HEAD`, `origin/main` and the merged index all lacked the entries, so this
predates the restyle. Fixed on 2026-09-09 by adding the two entries with
integrity hashes taken verbatim from the registry (+23/−0, insert-only).
**It recurred on 2026-09-13**: `npm uninstall` of two packages on Windows
dropped all five `@emnapi` entries — the two above, `@emnapi/wasi-threads`,
and two copies nested under `@tailwindcss/oxide-wasm32-wasi` — and added
`"peer": true` to 17 unrelated entries. The lock was rebuilt from the
pre-uninstall one minus exactly the removed packages, so every `@emnapi` entry
stayed byte-identical. Any `npm install`/`uninstall` on Windows needs that same
check until the durable fix lands.

**Two approaches that do not work**, recorded so they are not retried:
`npm install --package-lock-only` reproduces the same platform-blind resolution,
and deleting the lock to regenerate it drifts the tree (`npm ci --dry-run` then
reports "added 2, removed 4"). **`npm ci --dry-run` on Windows cannot reproduce
the failure** — it does not validate the Linux-only branch — so CI is the only
confirmation.

**Solution direction.** Either regenerate the lock in CI/a Linux container and
commit that, or keep patching the two entries after any Windows `npm install`.
The durable fix is the former.

**Closure.** A lock generated on Linux is committed, and a full `npm install` on
Windows no longer drops the entries — or a CI step is added that fails loudly
when they go missing.

<a id="td-36"></a>

### TD-36 — The mobile drawer cannot be closed or skipped from the keyboard

**Impact.** Below 768 the drawer has no close control, and while it is closed
its links stay in the tab order off-screen: a keyboard user passes ten
invisible stops — the nine nav items and the profile footer link — before
reaching the header.

**Evidence.** `features/shell/components/Sidebar.tsx` renders "Close navigation"
only when `isSidebarOpen && isMobile`, and `hooks/use-sidebar.ts` sets
`isSidebarOpen` to `false` below 768 — so the condition is never true. The
drawer closes only by tapping the scrim (a `div` with no key handler) or by
following a link; Escape does nothing. Closed, it is moved off-screen with
`-left-full` but stays rendered and focusable. The sweep's `mobile drawer close
control` test fails at 320/390/430, and `keyboard focus` lists the off-screen
stops at the same widths.

**Solution direction.** Behaviour, so outside the restyle's UI-only scope:
render the close control on the mobile branch, close on Escape, and make the
closed drawer inert (`inert`, or `visibility: hidden` once it has left).

**Closure.** Both tests pass at 320, 390 and 430.

<a id="td-38"></a>

### TD-38 — Four surfaces are clean on tokens but predate v1.0's composition

**Impact.** Inconsistency of layout rather than colour. After Phase 15 none of
these carries a raw colour, hex or off-scale radius, but none has been through a
restyle batch or a capture run, so their structure is the pre-v1.0 one.

**Evidence.**

- `/routines/[id]` (`RoutineHeader`, `RoutineDayAccordion`, `ExerciseCard`):
  `container` widths instead of `.ledger-page`, boxed exercise cards and
  outlined badges where §11.5 and §11.12 make lists ruled and read-only data
  unboxed.
- The route error boundaries (`app/error.tsx`, `global-error.tsx`, the four
  segment `error.tsx` files) and `not-found.tsx`: centred stacks with no
  masthead. They render only on failure, so no capture ever reached them.
- `app/(protected)/workouts/sessions/loading.tsx` still sketches the session
  screen's removed progress bar and action panel (Phase 13 removed both), and
  `workouts/loading.tsx` sketches three medallion cards the page no longer has.

**Solution direction.** One batch applying the existing patterns — masthead
over the double rule, ruled lists, skeletons that mirror the current page —
with no new decisions. Recorded in Phase 15 because a cleanup pass that also
recomposed pages would have been a restyle batch under another name.

**Closure.** Each surface captured at 390/768/1440 in both themes against its
current page, and the regression sweep's layout checks green on the routes that
have them.

<a id="td-39"></a>

### TD-39 — Unranked text renders in the system font, not Oswald

**Impact.** §5.1 and §5.2 make Oswald 400 the body face. Every element without a
`type-*` class — plain paragraphs, list items, form hints, badges, and inputs,
which inherit — renders in the platform's UI font instead: Segoe UI on Windows,
San Francisco on Apple devices. Every restyle review and capture was taken in
this state, so the approved look includes it.

**Evidence.** Measured in Phase 15 on `/routines/[id]`: `html`, `body` and an
unclassed paragraph all compute to `ui-sans-serif, system-ui, sans-serif, …`,
Tailwind's preflight stack; `--font-oswald`, `--font-sans` and
`--default-font-family` are empty on `:root`. `next/font` declares
`--font-oswald` on `<body>` (`app/layout.tsx`), preflight sets `font-family` on
`<html>` from `--default-font-family`, `@theme inline` inlines `--font-sans`
into utilities rather than emitting it, and `body` sets no family of its own —
so the chain never reaches the root. Ranked text is correct because each
`.type-*` class names `var(--font-oswald)` on an element under `<body>`, where
the variable exists.

**Solution direction.** One line: `font-sans` on `body` in `globals.css`'s base
layer, which resolves on `<body>`, where the variable lives. Deliberately not
applied in Phase 15: it changes the face of all unranked text on every screen at
once, which needs a capture review in both themes, not a cleanup commit.

**Closure.** Unranked text computes to Oswald, and a full capture set at
390/768/1440 in both themes has been reviewed.

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
