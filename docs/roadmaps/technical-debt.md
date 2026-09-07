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

Re-enabling the save-state indicator is **not** a pure class change. It competes
for horizontal space in a set row that gained an RPE column in `LIVE-04`, so it
needs a narrow-viewport layout check rather than only removing the dead variant.

**Closure criteria.** No `xs:` variant remains in the source without a matching
definition; the save-state indicator is observed rendering during a real set
save; and the set row is checked at 320px and 360px with both that indicator and
the RPE column present.

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
