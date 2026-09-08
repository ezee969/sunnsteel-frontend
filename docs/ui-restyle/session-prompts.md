# Session prompts — UI restyle

One prompt per session, in order. Copy the block verbatim into a fresh session.

**Rules that apply to every one of them.** Each session runs exactly one phase or
batch and stops. Never ask a session to "continue as far as possible" — the
handoff protocol in [ui-restyle-plan.md](../ui-restyle-plan.md) exists because a
model that runs three phases in one context stops being reviewable. After every
session, its own prompt tells it to update
[ui-restyle-progress.md](../ui-restyle-progress.md); if it did not, the next
session starts blind.

Prompts marked **[Qwen]** or **[Sol]** are run with those models rather than
Claude Code. They read the repository like any other session.

**Verify once, before the first [Qwen] session: does the harness actually pass
PNGs to the model as images?** File access and image input are different things.
A model can read `screenshots/before/dashboard-390-dark.png` off disk and still
receive it as an unusable blob if the harness does not decode it. That is the
exact failure that removed GLM 5.2 from this plan, and it will not announce
itself — a model that cannot see the image will describe it plausibly anyway.

Cheap check: point the model at two baseline screenshots and ask what the
largest number on each one is. If it cannot answer, it is not seeing them, and
every visual phase assigned to it is worthless until that is fixed.

---

## 1 — Phase 2b · Visual exploration, second opinion **[Qwen 3.8 Max]**

Reads: the 60 images in `docs/ui-restyle/screenshots/before/`, the UI Inventory
section of `docs/ui-restyle-progress.md`, and `app/globals.css`.

**Do not let it read `docs/ui-direction-opus.md`.** Two independent explorations
are the point; priming this one with the first collapses them into one opinion
wearing two names. Say so in the prompt — a repo-aware agent will otherwise find
it on its own while looking around `docs/`.

```text
Read these first, in this order, before proposing anything:
1. AGENTS.md - repo conventions and verified gotchas
2. docs/ui-restyle-plan.md - the strict UI-only scope
3. The UI Inventory section of docs/ui-restyle-progress.md - a completed
   audit of primitives, tokens, breakpoints, animations and inconsistencies
4. app/globals.css - the entire styling configuration, 213 lines
5. Every image in docs/ui-restyle/screenshots/before/ - 60 full-page
   captures at 390, 768 and 1440 in light and dark

Do NOT read docs/ui-direction-opus.md. A second, independent exploration is
the point of this session; reading the first one collapses both into one
opinion.

Confirm you can actually SEE the screenshots before saying anything about
them: state the largest number visible in one of them. If you cannot, stop
and say so. Do not describe images you cannot see.

You are exploring visual directions for Sunnsteel, a workout-tracking web app
with a classical/Renaissance theme. Stack: Next.js 15 App Router, React 18,
Tailwind CSS v4 (CSS-first, no config file — tokens live in app/globals.css),
shadcn/ui over Radix, next-themes with a class-based dark variant.

This is a UI-only restyle. Structure, routes, functionality, component
responsibilities and responsive behaviour stay exactly as they are.

Produce TWO directions:
- Direction A — conservative refinement, close to the current identity.
- Direction B — stronger redesign, same structure and behaviour.

For each, define concretely: colour palette (both themes, real values),
backgrounds/surfaces, typography (faces, sizes, line heights, tracking, case),
hierarchy, spacing scale, borders, radii, shadows, buttons, cards, inputs,
navigation, responsive treatment, motion language (durations and easings).

Three facts about this codebase, established by audit, that you should not
re-derive:
- The token palette is fully desaturated (oklch chroma 0). The brand — crimson,
  gold, bronze — lives outside the token system entirely. A direction that
  "adjusts the palette" does not describe real work here.
- Responsive adaptation stops at the md breakpoint: sm: is used 290 times, md:
  51, lg: 26, xl: once. Any direction must state what 1280px and up is FOR.
- 436 raw Tailwind palette classes (neutral-*, amber-*, and others) bypass the
  tokens. They do not move when a token changes. Any effort estimate that
  ignores them is wrong.

Avoid: excessive gradients, glassmorphism, glow effects, pill shapes
everywhere, excessive rounded corners, every section wrapped in a card,
decorative blobs, floating elements, excessive shadows, repeated fade-up
entrance animations.

Be specific. No implementation code. Output a single markdown document.
```

Output goes to `docs/ui-direction-qwen.md`.

---

## 2 — Phase 3 · Design System v0.1 **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-direction-opus.md and docs/ui-direction-qwen.md - the two
   explorations
5. app/globals.css - where every token you define has to land

Execute Phase 3 only. Do not modify any UI code.

I have chosen direction: <A or B, and from which document>.

Consolidate it into one design system and write it to docs/ui-design-system.md
as v0.1. Define concrete tokens for colours (every role, both themes),
typography, spacing, radii, shadows, motion and responsive rules, and map each
one onto app/globals.css — @theme inline plus the custom utility layer. Do not
create tailwind.config.ts; Tailwind v4 here is CSS-first and a config file
would be silently ignored.

Fix these as correctness matters regardless of direction:
- --destructive-foreground currently equals --destructive in light mode.
- Every colour token needs a real value per theme, not a shared greyscale.

State explicitly which of the 436 raw palette classes each token replaces, and
whether the migration happens mechanically before Phase 8 or per batch during
it. Then update docs/ui-restyle-progress.md and stop.
```

---

## 3 — Phase 4 · Proof of concept **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-design-system.md - v0.1, the system you are applying
5. The source files of the section you are restyling, and app/globals.css

Execute Phase 4 only. UI-only: no business logic, state, API calls, hooks,
routing, data structures, validation, event handlers, permissions or component
responsibilities. If a visual change would require a behavioural change, do not
make it — report it.

Apply Design System v0.1 to ONE section only: <the section chosen in Phase 3;
the Opus exploration recommends the active session screen, because it is the
densest surface and the one most likely to break a boxless layout>.

Do not touch any other section. Then capture before/after at 390, 768 and 1440
in both themes:

  npm run dev
  npm run ui:capture:after

Never run npm run verify or npm run build while the dev server is up — they
share .next/ and the running server then 500s on every route, which looks
exactly like an auth bug.

Any new Tailwind breakpoint or variant must be defined in app/globals.css and
then verified against the compiled stylesheet: an undefined variant emits no
CSS, no error, and passes lint and typecheck. Grep .next/static/css/*.css after
a build — there are two bundles and the small one is not the main one.

Update docs/ui-restyle-progress.md and stop.
```

---

## 4 — Phase 5 · POC visual QA **[Sol]**

Reads: `docs/ui-design-system.md`, and the before/after images for the POC
section only — `docs/ui-restyle/screenshots/before/` and `after/`. Keep it to
that section; a reviewer looking at the whole app will critique screens this
phase never touched.

```text
Read these first:
1. docs/ui-design-system.md - the system this work claims to implement
2. docs/ui-restyle/screenshots/before/ and after/ - but ONLY the images for
   the section named in docs/ui-restyle-progress.md as the proof of concept.
   Do not critique screens this phase never touched.

Confirm you can actually SEE the screenshots before saying anything about
them: state the largest number visible in one of them. If you cannot, stop
and say so. Do not describe images you cannot see.

You are reviewing a UI restyle proof of concept as a senior product designer.

Pass A — design critique. Using ONLY the after screenshots and the design
system, assess hierarchy, typography, spacing, rhythm, alignment, surface
treatment, contrast, component consistency, responsive quality, polish, visual
noise, and whether anything reads as generic AI-generated UI. Return concrete,
specific issues. No praise, no summary.

Pass B — regression comparison. Compare before against after. Report missing
content, changed layout behaviour, responsive regressions, lost states, broken
structure.

Return a prioritised list of issues only.
```

Output goes to `docs/ui-poc-review-sol.md`.

---

## 5 — Phase 6 · Design System v1.0 **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-design-system.md - v0.1
5. docs/ui-poc-review-sol.md - the QA findings you are responding to

Execute Phase 6 only. Apply the validated QA feedback, adjust tokens where the
review justifies it, and finalise docs/ui-design-system.md as v1.0 LOCKED.

For each QA point, record whether it was accepted or rejected and why. A review
is input, not instruction.

After this phase, no new arbitrary design decisions. Update
docs/ui-restyle-progress.md and stop.
```

---

## 6 — Phase 7 · Shared primitives **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-design-system.md - v1.0 LOCKED
5. components/ui/ - all 31 primitives, before changing any of them

Execute Phase 7 only. UI-only, same strict scope as before.

Restyle the shared primitives in components/ui/ to v1.0: button, input,
textarea, select, checkbox, card, badge, dialog, dropdown-menu, tooltip,
separator, skeleton, avatar, label. Preserve every public API and all
behaviour. Do not refactor beyond what the styling needs.

Usage counts, so you know what a mistake costs: button is imported by 50 files,
card 26, badge 24, skeleton 11, input 10. Only button, badge and alert
currently carry cva variants; everything else is styled per call site, so a
primitive change will not reach those call sites — that is Phase 8's job, not
yours.

popover and alert exist but are imported by nothing. Leave them; flag them for
Phase 15.

Run npm run lint, npm run typecheck and npm test. Update
docs/ui-restyle-progress.md and stop.
```

---

## 7–10 — Phase 8 · Implementation batches **[Claude Code, one session each]**

Run these one at a time, in order. Substitute the batch line.

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-design-system.md - v1.0 LOCKED
5. The files this batch touches, plus the matching images in
   docs/ui-restyle/screenshots/before/

Execute Phase 8, BATCH <n> ONLY:
  Batch 1 — Sidebar, header, page headers
  Batch 2 — Cards, lists, results
  Batch 3 — Forms, search, filters
  Batch 4 — Menus, dropdowns, modals

UI-only, same strict scope. Do not redesign already approved patterns; apply
v1.0 as written.

Two traps in this codebase:
- SHOW_QUICK_WORKOUT_ENTRY is false on purpose in
  app/(protected)/workouts/page.tsx, and the handler it guards is deliberately
  unreachable, not dead. LIVE-06 resumes from it. Do not remove the flag, the
  handler or the isStartingEmpty branch.
- The protected layout scrolls an inner <main class="flex-1 overflow-auto">
  inside a flex h-screen, not the document. Sticky and scroll-driven treatments
  must attach to that element.

After the batch: npm run ui:capture:after, then compare against
docs/ui-restyle/screenshots/before/ at 390, 768 and 1440 in both themes. Fix
regressions before finishing. Update docs/ui-restyle-progress.md and stop.
```

---

## 11 — Phase 9 · Responsive QA **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-restyle/capture-manifest.md - the routes and states to sweep

Execute Phase 9 only. Verify every route at 320, 375, 390, 430, 768, 1024, 1280
and 1440, in both themes.

Check horizontal overflow, element overlap, clipped content, text wrapping,
grid behaviour, navigation behaviour, touch target size, section spacing, modal
sizing, dropdown positioning, image scaling and breakpoint transitions.

Two predictions from the audit worth confirming or refuting:
- 320 to 639 previously rendered identically, because sm is the smallest
  declared breakpoint and only one max-[400px] rule existed.
- 1024, 1280 and 1440 previously looked near-identical.

Correct UI issues only. Anything needing a behavioural change gets reported,
not fixed. Update docs/ui-restyle-progress.md and stop.
```

---

## 12 — Phase 10a · Motion proposal **[Qwen 3.8 Max]**

Reads: `docs/ui-restyle/screenshots/after/` and `docs/ui-design-system.md`.

```text
Read these first:
1. docs/ui-design-system.md - v1.0 LOCKED, including its motion tokens
2. docs/ui-restyle/screenshots/after/ - the finished static UI you are
   animating
3. The Known Risks section of docs/ui-restyle-progress.md

Confirm you can actually SEE the screenshots before saying anything about
them: state the largest number visible in one of them. If you cannot, stop
and say so. Do not describe images you cannot see.

Define a motion system for this finished static UI: buttons, hover states,
navigation, dropdowns, modals, tabs, accordions, loading states and state
transitions. Give exact durations and easing curves.

Constraints:
- Prefer transform and opacity. Avoid animating layout.
- No information may depend on hover alone.
- Respect prefers-reduced-motion.
- Motion must communicate hierarchy, feedback or state change. Nothing
  decorative.
- The app is an installed PWA on iPhone and cold-start performance is a stated
  product priority. There is no React.memo anywhere and the active session
  screen re-renders broadly, so prefer CSS transitions to JS-driven animation
  there.

Avoid: fade-up on every section, excessive scale on hover, floating cards,
glowing borders, animated gradients, parallax, repeated entrance animations.
```

Output goes to `docs/ui-motion-spec.md`.

---

## 13 — Phase 10b · Motion implementation **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-motion-spec.md - the approved motion system
5. docs/ui-design-system.md - v1.0 LOCKED

Execute Phase 10 implementation only. UI-only, same strict scope.

framer-motion 12 is already a dependency and already used by
InitialLoadAnimation and the search page, so no new library is needed.

Two existing hazards:
- InitialLoadAnimation must keep children mounted from the first frame. It once
  withheld them for 3.4s and blocked every page query.
- Remove the page-level animate-in fade-in slide-in-from-bottom entrance
  animations rather than restyling them.

Implement prefers-reduced-motion for everything you add. Update
docs/ui-restyle-progress.md and stop.
```

---

## 14 — Phase 11 · Accessibility visual QA **[Sol]**

Reads: `docs/ui-restyle/screenshots/after/` at all three widths in both themes,
plus `docs/ui-design-system.md`.

```text
Read these first:
1. docs/ui-design-system.md - v1.0 LOCKED
2. docs/ui-restyle/screenshots/after/ - all three widths, both themes

Confirm you can actually SEE the screenshots before saying anything about
them: state the largest number visible in one of them. If you cannot, stop
and say so. Do not describe images you cannot see.

Review this UI for accessibility, from the screenshots and the design system.

Check WCAG AA text contrast, focus-visible styling, focus visibility, hover,
active, selected, disabled and error states, practical touch target sizes,
readable typography, reduced-motion support, visible keyboard navigation, and
semantic heading hierarchy where it is visible from the implementation.

Return concrete issues only, prioritised. No summary.
```

Output goes to `docs/ui-accessibility-review-sol.md`.

---

## 15 — Phase 12 · Final independent visual QA **[Sol]**

Reads: `docs/ui-restyle/screenshots/after/` — full pages at 390, 768 and 1440 in
both themes, plus the section shots — and `docs/ui-design-system.md`.

```text
Read these first:
1. docs/ui-design-system.md - v1.0 LOCKED
2. docs/ui-restyle/screenshots/after/ - full pages at 390, 768 and 1440 in
   both themes, plus the section shots

Do not read the earlier reviews in docs/. This pass is meant to be
independent of them.

Confirm you can actually SEE the screenshots before saying anything about
them: state the largest number visible in one of them. If you cannot, stop
and say so. Do not describe images you cannot see.

Review this finished UI as a senior product designer.

Assess hierarchy, alignment, spacing, typography, colour, contrast, surface
consistency, radius consistency, shadow consistency, component consistency,
density, responsive behaviour, whether mobile, tablet and desktop each look
deliberate rather than scaled, visual noise, and any generic AI-generated UI
tropes.

Return a prioritised issue list. Concrete only.
```

Output goes to `docs/ui-final-review-sol.md`.

---

## 16 — Phase 13 · Final corrections **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-design-system.md - v1.0 LOCKED
5. docs/ui-accessibility-review-sol.md and docs/ui-final-review-sol.md - the
   findings you are applying

Execute Phase 13 only. Apply the approved fixes. No new visual direction, no
logic changes, no unrelated refactoring. Follow v1.0 and reuse established
patterns.

For each review point, record accepted or rejected and why. Re-run
npm run ui:capture:after afterwards. Update docs/ui-restyle-progress.md and
stop.
```

---

## 17 — Phase 14 · Automated regression sweep **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. e2e/ and playwright.config.ts - the capture harness you are extending
5. vitest.config.ts - so *.spec.ts and *.test.ts stay in separate runners

Execute Phase 14 only. Extend the existing Playwright setup in e2e/ to assert,
at 320, 390, 430, 768, 1024, 1280 and 1440: no horizontal overflow, no new
console errors, navigation works, modals open and close, dropdowns position
correctly, hover and focus states render, and mobile navigation works.

Then run npm run verify with the dev server stopped.

Do not weaken or delete an assertion to make a failure go away. A failing check
is the output of this phase, not an obstacle to it. Update
docs/ui-restyle-progress.md and stop.
```

---

## 18 — Phase 15 · Styling cleanup **[Claude Code]**

```text
Read these first, in this order, before doing anything else:
1. AGENTS.md - repo conventions and the verified gotchas list. Several of
   them will silently corrupt this work if you skip it.
2. docs/ui-restyle-plan.md - the strict UI-only scope and this phase's
   definition
3. docs/ui-restyle-progress.md - current state, findings, known risks, and
   the Do Not Revisit list
4. docs/ui-design-system.md - v1.0 LOCKED
5. app/globals.css - the end state every token should have reached

Execute Phase 15 only. Final consistency pass over styles the restyle touched:
leftover colours, hardcoded hex values, old shadows, old radii, duplicate CSS,
unused classes, arbitrary spacing values, deprecated styles, old animations,
one-off button and card styles, and local values that a token should replace.

Baseline for comparison, from the Phase 1 audit: 22 hardcoded hex values, 26
rgba() literals, 436 raw palette classes, 9 radius values, the full shadow
ladder, and 14 files using inline style={{ }}. Report the counts now versus
then.

Do not introduce new design decisions. Do not remove
SHOW_QUICK_WORKOUT_ENTRY, its handler or its isStartingEmpty branch — that code
is unreachable on purpose and LIVE-06 resumes from it. popover.tsx and
alert.tsx are imported by nothing and are safe to flag, but confirm before
deleting.

Run npm run verify with the dev server stopped. Update
docs/ui-restyle-progress.md and stop.
```
