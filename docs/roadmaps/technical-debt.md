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

Five entries recorded on 2026-09-09 from the Phase 8/9 UI restyle. All five are
frontend-only and none affects stored data. Phase-by-phase narrative and the
full measurement evidence live in
[ui-restyle-progress.md](../ui-restyle-progress.md); only the durable,
actionable residue is recorded here.

<a id="td-30"></a>

### TD-30 — `honour-bright` is not a token, and one live reference remains

**Impact.** `features/workout/session-action-card.tsx:52` sets
`[&_[data-slot=progress-indicator]]:bg-honour-bright`. `honour-bright` is a name
from the Qwen direction document that never entered `@theme inline`, so it emits
no CSS and no error. The session's progress bar falls back to the `Progress`
primitive's `bg-primary` and renders ink where gold was intended — plausible, and
wrong.

**Evidence.** Absent from the served stylesheet and from the production bundle:
`grep -c honour-bright .next/static/css/*.css` returns 0 while the class is still
in the source. A second reference in `session-confirmation-dialog.tsx` was closed
in Phase 8 Batch 4 by replacing it with `.mark mark-success`.

**Solution direction.** Decide what that bar should be under v1.0 §4.3 — rule 2
makes completion `--success`, rule 3 keeps gold for what is earned — and use the
token. Do not add `honour-bright` to the theme; the name does not exist in the
locked system.

**Closure.** No occurrence of `honour-bright` in the tree, and the session
screen's progress bar verified against §4.3 in both themes.

<a id="td-31"></a>

### TD-31 — Four surfaces never went through the restyle and are off-palette

**Impact.** The app is visually inconsistent on routes a user reaches early. The
two auth screens are the first thing a signed-out visitor sees, and they still
carry blurred amber blobs (`ModernBackground`), a gradient-clipped wordmark
(`(auth)/layout.tsx`) and raw `neutral-*` classes — all retired by v1.0 §4.3
rule 6.

**Evidence.** `app/(auth)/**`, `app/(protected)/profile/[[...userId]]/page.tsx`,
`features/initial-load-animation/InitialLoadAnimation.tsx` and
`components/PerformanceDebugPanel.tsx` still match
`grep -E '(amber|neutral|blue|emerald)-[0-9]{2,3}|backdrop-blur|bg-card/[0-9]'`.
Phase 8's four batches covered the protected shell only; v1.0 §12.4 explicitly
scopes the auth screens as a separate batch because they share no components
with it.

**Solution direction.** One batch for the two auth screens, one pass for the
profile page. `InitialLoadAnimation` and `PerformanceDebugPanel` are lower value:
the first is a splash overlay, the second is dev-only behind `SHOULD_*` flags.

**Closure.** No raw palette classes on those routes, and captures at
390/768/1440 in both themes compared against `before/`.

<a id="td-32"></a>

### TD-32 — Six components have zero importers

**Impact.** Dead code that still type-checks, lints and ships in the module
graph. Two of them (`HeroCard`, `WorkoutItem`) were restyled in Phase 8 Batch 2
purely so they would not sit on a retired pattern — work spent on code nothing
renders.

**Evidence.** `popover`, `alert`, `OrnateCorners`, `HeroBackdrop`, `HeroCard`,
`WorkoutItem` each return only self-references from a tree-wide grep.
`OrnateCorners` and `HeroBackdrop` lost their last consumers during the restyle
(Batch 1 retired the photographic hero, Batch 2 retired `HeroCard`'s frame).

**Solution direction.** Delete in Phase 15, together. Confirm zero importers at
that moment rather than trusting this entry — `SHOW_QUICK_WORKOUT_ENTRY` is the
standing reminder that "unused" and "deliberately unreachable" are different
things, and that flag, its handler and its `isStartingEmpty` branch must not be
touched.

**Closure.** The six files removed, `npm run verify` green.

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

<a id="td-34"></a>

### TD-34 — The capture harness does not enforce its own preconditions

**Impact.** Screenshot comparisons can be silently invalid.
`ui-restyle/capture-manifest.md` lists "no active session" as a precondition and
nothing checks it; `/workouts` redirects into a live session, and `/routines` and
the dashboard grow an active-session banner, so nine captures in one Phase 8
Batch 4 run did not match the `before/` baseline's conditions.

**Evidence.** Caught by noticing a stray "RESUME" banner in a dialog screenshot,
then confirmed against workout history — the session was the owner's own
(`LIVE-09 authenticated browser verification`), not something the harness
started. The whole set had to be re-captured. `.auth/state.json` expiry is the
same class of problem and *is* asserted; the active-session check is not.

**Solution direction.** Assert in `e2e/baseline.spec.ts` `beforeAll`: no active
session, and fail with a message telling the owner to finish it. Phase 12's final
QA is where a stale comparison would be most expensive.

**Closure.** A capture run with an active session fails loudly instead of
producing plausible images.

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
