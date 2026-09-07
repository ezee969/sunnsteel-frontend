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

### TD-29 - Focusing a set input zooms the page on iOS and does not zoom back

**Impact.** Reported from an iPhone on 2026-09-07 (platform confirmed with the
reporter, since the auto-zoom below is iOS-specific -- Android Chrome does not
zoom on focus, so an Android report would have needed a different diagnosis): tapping an input during a
session zooms the page in, and iOS does not restore the previous scale on blur,
so the user has to pinch out by hand mid-workout. It breaks the installed PWA's
illusion of being an app, on the one screen that is used while training and
one-handed.

**Cause, verified 2026-09-07.** iOS Safari auto-zooms any focused form control
whose computed `font-size` is below 16px. The design system already handles
this: [`components/ui/input.tsx`](../../components/ui/input.tsx) sets
`text-base` with `md:text-sm`, which is 16px on phones and 14px only from the
`md` breakpoint up. That mitigation is deliberate and correct.

Three call sites defeat it.
[`features/workout/set-log-input.tsx`](../../features/workout/set-log-input.tsx)
passes an unconditional `text-sm` on lines 114 (reps), 136 (weight) and 162
(RPE), which overrides the base and lands every set input at 14px on exactly the
screen where this hurts. No other input in the app overrides the base size, so
the defect is contained to this component. The RPE input is new in `LIVE-04`, so
that change added a third trigger to an existing two rather than causing the
problem.

**Solution direction.** Drop the unconditional `text-sm` so the base
`text-base md:text-sm` applies, or restate that pair explicitly at the three call
sites.

**Do not fix this in the viewport.** Adding `maximum-scale=1` or
`user-scalable=no` to the `viewport` export in
[`app/layout.tsx`](../../app/layout.tsx) also stops the zoom, and is the first
result any search returns, but it disables pinch-zoom for every user on every
screen -- a real accessibility regression traded for a cosmetic fix. The viewport
currently sets only `width` and `initialScale`; keep it that way.

**This fix does not resize the row.** An earlier revision of this entry claimed
16px inputs would be wider than 14px ones and that the fix therefore needed a
layout redesign. That was wrong, and is corrected here so nobody plans around
it. Each column is `flex-1 ... min-w-[70px]` and `Input` carries
`w-full min-w-0`, so the box width comes from the flex distribution, not from
its content: raising the font size enlarges the digits inside a box of unchanged
width. The only real question is whether the longest value still fits, and a
device screenshot on 2026-09-07 shows `67.5` rendering with room to spare at
14px, so a five-character `102.5` fits at 16px. The fix is the three-class
change and nothing more. [`TD-28`](#td-28) is the half of this pair that still
needs a decision.

**Fix applied 2026-09-07, awaiting device confirmation.** The unconditional
`text-sm` was removed from all three inputs, so the base `text-base md:text-sm`
now governs. Confirmed against the compiled stylesheet: the rule survives with
`md` at `min-width:48rem`, so the inputs compute 16px below 768px and 14px above.
The viewport export was not touched and still permits user scaling.

**Closure criteria.** Two of four are met by the above. Still open, and only
answerable on the device: focusing reps, weight and RPE on a real iPhone causes
no zoom, and a five-character weight such as `102.5` remains fully legible at
the larger size.

<a id="td-28"></a>

### TD-28 - `xs:` is not a defined breakpoint, so three responsive classes emit no CSS

**Impact.** Two components silently lose their responsive behaviour, in different
ways.

- [`features/workout/set-log-input.tsx`](../../features/workout/set-log-input.tsx)
  line 175: `hidden xs:flex` collapses to plain `hidden`, so the per-set
  save-state indicator (`pending` / `saving` / `saved`) never renders at any
  viewport width. Save **errors** are unaffected -- they surface through a
  separate footer block that carries no `xs:` class -- so what is lost is the
  transient confirmation that a set was written, not the failure report.
- [`ExercisePickerDropdown.tsx`](../../features/routines/wizard/components/ExercisePickerDropdown.tsx)
  lines 59-60: the pair `hidden xs:inline` / `xs:hidden` collapses so the button
  always reads `Add` and never `Add Exercise`. Degraded rather than broken; the
  short label is always visible.

**Evidence, verified 2026-09-07.** `xs` is not defined anywhere in
[`app/globals.css`](../../app/globals.css). Tailwind is v4 CSS-first with no
`tailwind.config.ts`, and one must not be added (a config file is only loaded via
`@config`, so it would be silently ignored -- see `CLAUDE.md`), which leaves the
default `sm`-`2xl` set. The compiled stylesheet from a production build contains
no `xs:` variant rule at all; the only `xs` strings in it are theme tokens
(`--text-xs`, `--container-xs`, `--radius-xs`). An undefined Tailwind variant
produces no rule and no build error, which is why this survived unnoticed.

**Solution direction.** Either define an `xs` breakpoint in the `@theme` block of
`globals.css`, which is the CSS-first way to add one and makes all three call
sites behave as written, or rewrite the three sites against an existing
breakpoint and keep the breakpoint set small. Prefer whichever is decided
deliberately: the current state is neither.

Re-enabling the save-state indicator is **not** a pure class change, and a
device screenshot on 2026-09-07 settles why: after the RPE column added in
`LIVE-04` there is no meaningful gap left between that input and the completion
checkbox, so defining an `xs` breakpoint would restore an indicator with nowhere
to go. Decide where the state belongs before reviving it -- as colour on the
completion checkbox, or in the small caption line that currently reads
`Optional`, rather than as a fourth column. This is the harder half of the pair:
`TD-29` turned out to be a three-class change that resizes nothing, while this
one needs a design decision.

**Fix applied 2026-09-07, awaiting device confirmation.** The state moved onto
the completion checkbox as a coloured ring -- amber while pending or saving,
green when saved, red on error. A Tailwind ring is a box-shadow, so it consumes
no layout width, which is what made this viable in a row with no space left. The
focus ring is unaffected because its rule is variant-scoped and therefore does
not collide. Colour cannot carry state on its own, so the same text is now in an
`sr-only` live region; the visible error footer was already separate and still
renders. `ExercisePickerDropdown` dropped its label pair entirely rather than
switching breakpoint, because the button is `w-full` on mobile and the short
label solved nothing. No `xs:` variant remains anywhere in the source, and the
compiled stylesheet carries the new `ring-*` and `sr-only` rules.

**Closure criteria.** The source and stylesheet halves are met. Still open, and
only answerable on the device: the ring is observed changing colour during a
real set save, and the row is checked on a phone with the ring and the RPE
column both present.

<a id="td-27"></a>

TD-27 closed on 2026-09-07. See the [closure record](../history/td27-closure-2026-09-07.md) for implementation and production evidence.

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
