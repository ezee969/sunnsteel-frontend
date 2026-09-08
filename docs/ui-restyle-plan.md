# UI Restyle Plan — Existing Responsive Web App

## Scope

UI-only restyle of an existing responsive web app.

### Strict constraints

Do not change:
- Business logic
- State management
- API calls
- Hooks behavior
- Routing
- Data structures
- Validation
- Event handler behavior
- Permissions
- Application flows
- Component responsibilities

Allowed changes:
- Styling
- Layout
- Visual component structure when required for styling
- CSS / Tailwind styles
- Design tokens
- Typography
- Spacing
- Responsive presentation
- Visual states
- Transitions
- Animations

Existing functionality must remain identical.

If a desired visual change requires a logic or behavior change, do not implement it. Report it instead.

---

## Repository context

This plan runs against `sunnsteel-frontend`. What follows are verified facts about
that repository, not preferences. Where they contradict generic guidance elsewhere
in this document, they win.

**Stack.** Next.js 15.5 App Router - React 18.3 - TypeScript strict - Tailwind CSS
v4 - shadcn/ui + Radix - TanStack Query 5 - framer-motion 12. **There is no MUI.**

**Tailwind v4 is CSS-first, and `tailwind.config.ts` must not be created.** Theme
tokens, `@theme inline` and the custom utilities (`heading-classical`,
`bg-marble-light`, `hide-scrollbar`) all live in `app/globals.css`.
`components.json` carries `"config": ""` and nothing loads a config via `@config`,
so a config file would be silently ignored. The design system produced in Phases 3
and 6 materialises in `app/globals.css`, not in a JavaScript config.

**Custom Tailwind variants fail silently.** An undefined variant such as `xs:`
compiles to no CSS, raises no build error, and passes both lint and typecheck -
`hidden xs:flex` therefore meant `hidden` at every width for months. This has
already produced two defects here (TD-28, TD-29). Any new breakpoint or variant
this restyle introduces must be defined in `app/globals.css` and then confirmed
against the compiled stylesheet: grep `.next/static/css/*.css` after a production
build, and note there are **two bundles - the small one is not the main one**.
Treat this as the standard check whenever a responsive or state class "does
nothing".

**Two themes are in scope.** `next-themes` drives light and dark. Every token
defined in Phase 3 needs both values, and every screenshot set in Phases 0, 4, 8
and 12 must cover both. Reviewing one theme leaves half the application unseen.

**The app is effectively an SPA.** Only `app/page.tsx`, `app/api/session/route.ts`
and six `loading.tsx` files are Server Components; every other page and both group
layouts are `'use client'`. Do not expect RSC boundaries to shape the work.

**Formatting is enforced, not a matter of taste.** Prettier runs as an ESLint
error: tabs, single quotes, no semicolons, `printWidth` 80, `arrowParens: avoid`,
with imports sorted by `simple-import-sort`. Run `npm run lint:fix` instead of
formatting by hand.

**Performance is a declared product priority** - specifically cold start and
navigation for an installed iPhone PWA. Phase 10 must not regress it. There is no
`React.memo` anywhere in this codebase and `groupSetLogsByExercise` rebuilds every
object on each call, so the active-session screen re-renders broadly; prefer CSS
transitions to JS-driven animation there.

### Never build while the dev server is running

`npm run verify` and `npm run build` write to the same `.next/` directory as
`npm run dev`. Running either while the dev server is up makes the running server
answer 500 on every route, which surfaces as a **black screen** that looks exactly
like an auth bug and sends you chasing the wrong thing. Stop the dev server first.

This matters more here than on a normal project: a restyle is a long loop of edit,
look, screenshot, so the dev server is up almost continuously.

**But do not ask the owner to stop their servers just to close routine work.** Run
`npm run lint`, `npm run typecheck` and `npm test` locally, push the coherent
change, and require a clean CI build. Ask for a stop only when CI is unavailable
or a local production-build diagnosis is genuinely needed - which, for this plan,
means the compiled-stylesheet check above.

---

## Model Assignment

| Task | Model |
|---|---|
| Frontend/UI audit | Claude Opus 5 High |
| Visual exploration | Claude Opus 5 High + Qwen 3.8 Max |
| Design system | Claude Opus 5 High |
| Proof of concept | Claude Opus 5 High |
| Full implementation | Claude Opus 5 High |
| Motion proposal | Qwen 3.8 Max |
| Motion implementation | Claude Opus 5 High |
| Visual QA | GPT-5.6 Sol High |
| Responsive/accessibility critique | GPT-5.6 Sol High |
| Corrections | Claude Opus 5 High |
| Final cleanup | Claude Opus 5 High |

**The second-opinion slot has two hard requirements**, and the model filling it
matters less than they do:

1. **Vision.** Phases 2 and 10 read baseline screenshots and the finished static
   UI. A text-only model cannot do either — `GLM 5.2` originally held this slot
   and was replaced on 2026-09-08 for exactly that reason. `Gemini 3 Pro` briefly
   replaced it and was itself replaced the same day: the version was stale and
   the pick was not backed by benchmark data.
2. **A different provider from the QA model.** Phase 5, 11 and 12 critique what
   Phases 2, 4 and 10 produced. If the same model authors and reviews, the
   critique is self-review and stops catching anything.

Substitute freely as models change, provided both hold.

---

# Phase 0 — Baseline

## Screenshots

Create permanent baseline screenshots before any UI changes.

Required reference widths:
- 390px — mobile
- 768px — tablet
- 1440px — desktop

Capture each width in **both light and dark themes**.

Capture:
- Full page
- Sidebar (expanded and collapsed) and mobile menu
- Hero/header
- Every major section
- Modals, dropdowns and overlays where relevant

Screenshots do not go at the repository root: `CLAUDE.md` forbids new files there.
Use:

```text
docs/ui-restyle/screenshots/
  before/
    full-390-light.png
    full-390-dark.png
    full-768-light.png
    full-1440-light.png
    sidebar-390-light.png
    ...
  after/
```

Keep `before/` frozen, and commit it — a frozen baseline that is not versioned is
not frozen. Add `after/` to `.gitignore`: it is regenerated after every batch.
Capture at device pixel ratio 1; this repository has already deleted oversized
assets for weight, and a full set at DPR 2 across two themes is tens of megabytes.

Routes worth covering, given that `/workouts` redirects into a live session
whenever one exists: `/dashboard`, `/routines`, `/routines/new`, `/workouts`,
`/workouts/history`, `/workouts/sessions/[id]`, `/profile`, `/search`,
`/settings`, plus `/login`.

## Responsive sweep

Check these widths during QA:

```text
320
375
390
430
768
1024
1280
1440
```

Detect:
- Horizontal overflow
- Clipping
- Overlap
- Broken grids
- Navigation wrapping
- Unexpected text wrapping
- Excessive whitespace
- Broken breakpoint transitions

---

# Phase 1 — UI Inventory

**Model: Claude Opus 5 High**

Audit the existing frontend without modifying code.

Identify:
- Shared UI primitives
- Buttons
- Inputs
- Cards
- Badges
- Modals
- Dropdowns
- Tooltips
- Navigation
- Typography patterns
- Containers
- Section wrappers
- Responsive breakpoints
- CSS variables
- Theme configuration
- Tailwind theme tokens in `app/globals.css`
- Hardcoded colors
- Hardcoded spacing
- Shadows
- Border radii
- Existing animations
- Duplicate visual patterns
- One-off styles
- Reusable components

Repository-specific items to include:
- `app/globals.css`: `@theme inline` tokens, custom utilities, and both theme scopes
- `cva` variants already added to the shadcn primitives in `components/ui/`
- The classical/Renaissance layer: `heading-classical`, `bg-marble-light`, the
  Cinzel/Oswald typography, `ClassicalIcon`, and gold-toned borders
- Any Tailwind variant used in markup but never defined in `app/globals.css`
- Inline `style={{ }}` usage, which bypasses the token system entirely

Produce a concise inventory grouped by:
1. Shared primitives
2. Repeated patterns
3. Styling architecture
4. Inconsistencies
5. High-impact components to restyle first

Do not modify code.

---

# Phase 2 — Visual Exploration

**Models: Claude Opus 5 High + Qwen 3.8 Max in parallel**

Provide both models with:
- Baseline screenshots
- UI inventory
- Relevant source files
- Existing branding
- Visual references
- Desired visual direction

Each model should produce two directions:

### Direction A
Conservative refinement.

### Direction B
Stronger visual redesign.

Each direction must define:
- Color palette
- Backgrounds and surfaces
- Typography
- Visual hierarchy
- Spacing
- Border radii
- Borders
- Shadows
- Buttons
- Cards
- Inputs
- Navigation
- Responsive behavior
- Motion language

No full implementation.

---

# Phase 3 — Design System v0.1

**Model: Claude Opus 5 High**

Create one consolidated design system from the selected direction.

Define concrete tokens for:

## Colors

Define every colour token **twice**, once per theme, and name them by role rather
than by value so the dark set is a remap and not a second palette.

- Background
- Surface
- Elevated surface
- Primary text
- Secondary text
- Muted text
- Border
- Accent
- Accent hover
- Success
- Warning
- Error
- Disabled states

## Typography
- Font family
- H1–H6
- Body
- Small text
- Labels
- Buttons
- Line heights
- Font weights
- Mobile variants where required

## Spacing
Use a defined spacing scale.

## Radius
Define a small radius scale.

## Shadows
Define limited elevation levels.

## Motion
Define:
- Fast duration
- Standard duration
- Slow duration
- Easing curves
- Hover behavior
- Enter/exit behavior

## Responsive
Define:
- Container widths
- Horizontal padding
- Section spacing
- Breakpoint behavior

Map tokens to the existing styling architecture: this means `@theme inline` and
the custom-utility layer in `app/globals.css`. Do not create `tailwind.config.ts`.

Preserve the classical/Renaissance identity as a deliberate input, not an accident
to be normalised away. If a token would erase it, say so and propose the trade-off
rather than silently flattening the brand.

---

# Phase 4 — Proof of Concept

**Model: Claude Opus 5 High**

Select one medium/high-complexity section containing several reusable patterns.

Prefer a section containing:
- Typography
- Buttons
- Cards or surfaces
- Responsive layout
- Interactive states
- Shared components

Apply Design System v0.1 only to that section.

Requirements:
- Preserve all existing behavior
- Do not modify unrelated sections
- Validate at 390px, 768px and 1440px
- Capture before/after screenshots

---

# Phase 5 — POC Visual QA

**Model: GPT-5.6 Sol High**

## Pass A — Design critique

Review:
- Design System v0.1
- Visual references
- After screenshots only

Check:
- Hierarchy
- Typography
- Spacing
- Rhythm
- Alignment
- Surface treatment
- Contrast
- Component consistency
- Responsive quality
- Professional polish
- Visual noise
- Generic AI-generated design patterns

Return concrete issues only.

## Pass B — Regression comparison

Review before vs after.

Check:
- Missing content
- Changed layout behavior
- Responsive regressions
- Interaction regressions visible in the UI
- Lost states
- Broken structure

---

# Phase 6 — Design System v1.0

**Model: Claude Opus 5 High**

Apply validated POC feedback.

Adjust tokens where needed.

Finalize:
- Colors
- Typography
- Spacing
- Radius
- Shadows
- Responsive rules
- Motion rules

Lock Design System v1.0.

After this phase, avoid new arbitrary design decisions.

---

# Phase 7 — Shared Primitives

**Model: Claude Opus 5 High**

Restyle reusable primitives before page-specific sections.

Prioritize:
- Button
- IconButton
- Input
- Textarea
- Select
- Checkbox/radio if present
- Card
- Badge
- Modal
- Dropdown
- Tooltip
- Section
- Container
- Typography primitives

Requirements:
- Use Design System v1.0
- Preserve public APIs where possible
- Preserve behavior
- Avoid unnecessary refactors

---

# Phase 8 — Incremental Implementation

**Model: Claude Opus 5 High**

Implement the page incrementally by visual family.

Example batches:

## Batch 1
- Navbar
- Sidebar
- Headers

## Batch 2
- Cards
- Lists
- Results

## Batch 3
- Forms
- Search
- Filters

## Batch 4
- Menus
- Dropdowns
- Modals

After each batch:
- Capture 390px
- Capture 768px
- Capture 1440px
- Capture full-page screenshots
- Check responsive sweep
- Fix regressions before continuing

Do not redesign already approved patterns.

---

# Phase 9 — Responsive QA

**Model: Claude Opus 5 High**

Verify:

```text
320
375
390
430
768
1024
1280
1440
```

Check:
- Horizontal overflow
- Element overlap
- Clipped content
- Text wrapping
- Grid behavior
- Navigation behavior
- Touch target usability
- Section spacing
- Modal sizing
- Dropdown positioning
- Image scaling
- Breakpoint transitions

Correct UI issues only.

---

# Phase 10 — Motion Design

## Proposal

**Model: Qwen 3.8 Max**

Review the completed static UI and define motion for:
- Buttons
- Hover states
- Navigation
- Dropdowns
- Modals
- Tabs
- Accordions
- Loading states
- State transitions

Use exact duration and easing values.

## Implementation

**Model: Claude Opus 5 High**

Implement the approved motion system.

`framer-motion` 12 is already a dependency and is already used by
`InitialLoadAnimation` and the search page, so motion needs no new library.

Two existing hazards: `InitialLoadAnimation` is an overlay that must keep
`children` mounted from the first frame — it previously withheld them for 3.4s and
blocked every page query — and the active-session screen re-renders broadly, so
animate it with CSS rather than JS.

Rules:
- Prefer `transform` and `opacity`
- Avoid unnecessary layout animations
- No information may depend only on hover
- Respect `prefers-reduced-motion`
- Motion must communicate hierarchy, feedback or state change
- Avoid decorative motion without purpose

Avoid:
- Fade-up on every section
- Excessive scale hover
- Floating cards
- Glowing borders
- Animated gradients
- Excessive parallax
- Repetitive entrance animations

---

# Phase 11 — Accessibility Visual QA

**Model: GPT-5.6 Sol High**

Check:
- WCAG AA text contrast
- `:focus-visible`
- Focus visibility
- Hover states
- Active states
- Selected states
- Disabled states
- Error states
- Practical touch targets
- Readable typography
- Reduced-motion support
- Visual keyboard navigation
- Semantic heading hierarchy where visible from implementation

Return concrete issues only.

---

# Phase 12 — Final Independent Visual QA

**Model: GPT-5.6 Sol High**

Review:
- Full-page 390px screenshot
- Full-page 768px screenshot
- Full-page 1440px screenshot
- Important section screenshots
- Design System v1.0
- Visual references

Review as a senior product designer.

Check:
- Hierarchy
- Alignment
- Spacing
- Typography
- Color
- Contrast
- Surface consistency
- Radius consistency
- Shadow consistency
- Component consistency
- Density
- Responsive behavior
- Mobile intentionality
- Tablet intentionality
- Desktop intentionality
- Visual noise
- AI-generated UI tropes

Return a prioritized issue list.

---

# Phase 13 — Final Corrections

**Model: Claude Opus 5 High**

Apply the approved QA fixes.

Rules:
- No new visual direction
- No logic changes
- No unrelated refactoring
- Follow Design System v1.0
- Reuse established patterns
- Re-run screenshots after fixes

---

# Phase 14 — Automated Regression Sweep

**Prerequisite decision: this repository has no browser test tooling.** Vitest runs
in a Node environment on purpose — no jsdom, no Testing Library, no Playwright —
and that boundary is recorded as an accepted limitation in
`docs/roadmaps/technical-debt.md`. Adopting Playwright is a tooling decision with
real maintenance cost, not a step of this plan.

Decide before Phase 0, because the answer changes how Phases 0, 4, 8 and 9 capture
screenshots:

- **A — Adopt Playwright.** Scripted screenshots at every width and theme, plus the
  assertions below. Costs a dev dependency, a CI job and ongoing maintenance. If
  chosen, adopt it before Phase 0 so the baseline is captured with the same tooling
  as everything compared against it.
- **B — Manual sweep.** Capture by hand and check the list below by eye. No new
  dependency, and no protection against silent regressions later.

Record the choice in `ui-restyle-progress.md` under Visual Decisions.

"Existing functional tests continue passing" here means `npm run verify` — lint,
typecheck, Vitest and a production build — run with the dev server stopped.

Run at:

```text
320
390
430
768
1024
1280
1440
```

Check:
- No horizontal overflow
- No new console errors
- No broken components
- Navigation works
- Modals work
- Dropdowns work
- Existing interactions work
- Hover/focus states work
- Mobile navigation works
- Screenshots render correctly
- Existing functional tests continue passing

Do not change tests to hide regressions.

---

# Phase 15 — Styling Cleanup

**Model: Claude Opus 5 High**

Final consistency pass.

Find and review:
- Old colors
- Hardcoded hex values
- Old shadows
- Old radii
- Duplicate CSS
- Unused classes
- Arbitrary spacing values
- Deprecated styles
- Old animations
- One-off button styles
- One-off card styles
- Tokens that should replace local values

**Do not remove code that only looks unused.** `SHOW_QUICK_WORKOUT_ENTRY` is
`false` on purpose in `app/(protected)/workouts/page.tsx`, which makes
`handleStartEmptyWorkout` and its `isStartingEmpty` branch deliberately
unreachable rather than dead. `LIVE-06` resumes from that handler. Leave the flag,
the handler and the branch alone, including their styles.

Only clean up styles related to the restyle.

Do not introduce new design decisions.

---

# Permanent UI Rules

Avoid unless explicitly justified by the brand:
- Excessive gradients
- Excessive glassmorphism
- Glow effects
- Pill shapes everywhere
- Every section inside a card
- Excessive rounded corners
- Oversized typography without hierarchy
- Decorative blobs
- Floating decorative elements
- Excessive shadows
- Repetitive microanimations
- Identical fade-up animations across the page

Target:
- Intentional
- Cohesive
- Professional
- Responsive
- Accessible
- Maintainable

---

# Permanent Implementation Rules

For every implementation phase:

```text
STRICT SCOPE

This task is UI-only.

Do not change:
- business logic
- state management
- API calls
- hooks behavior
- routing
- data structures
- validation
- event handler behavior
- permissions
- application flows
- component responsibilities

You may modify:
- styling
- layout
- visual component structure when required for styling
- CSS/Tailwind styles
- design tokens
- typography
- spacing
- responsive presentation
- visual states
- transitions and animations

Existing functionality must remain identical.

If a desired visual change would require a behavioral or logic change,
do not implement it. Report it instead.
```

---

# Project Tracking

Maintain:

```text
sunnsteel-frontend/docs/
  ui-restyle-plan.md
  ui-restyle-progress.md
  ui-design-system.md
  ui-restyle/screenshots/
```

Additional phase-specific documents may include:

```text
sunnsteel-frontend/docs/
  ui-direction-opus.md
  ui-direction-qwen.md
  ui-poc-review-sol.md
  ui-motion-spec.md
  ui-accessibility-review-sol.md
  ui-final-review-sol.md
```

These sit beside `docs/roadmaps/` and `docs/history/`. Nothing goes at the
repository root.

`ui-restyle-plan.md` is the master plan and should remain stable.

`ui-restyle-progress.md` must track:
- Current phase
- Completed phases
- Current task
- Files changed
- Important findings
- Approved visual decisions
- Known issues
- Next task
- Handoff information

`ui-design-system.md` contains the evolving design system:
- v0.1 during POC validation
- v1.0 LOCKED after POC review

---

# Handoff Protocol

At the end of each phase or implementation batch, update `docs/ui-restyle-progress.md` with:

```text
## Current Phase

## Completed

## Files Changed

## Visual Decisions

## Findings

## Known Issues

## Do Not Revisit

## Next Task
```

Each model should execute only the assigned phase or batch.

Do not continue automatically into the next phase.

Do not use instructions such as:

"Continue the plan as far as possible."

Instead, every session receives one clearly defined phase or batch.

---

# Final Workflow

```text
Baseline screenshots
        ↓
UI inventory — Opus 5 High
        ↓
Visual exploration — Opus 5 High + Qwen 3.8 Max
        ↓
Design System v0.1
        ↓
POC — Opus 5 High
        ↓
Visual QA — GPT-5.6 Sol High
        ↓
Design System v1.0 LOCK
        ↓
Shared primitives — Opus 5 High
        ↓
Incremental implementation — Opus 5 High
        ↓
Responsive QA
        ↓
Motion proposal — Qwen 3.8 Max
        ↓
Motion implementation — Opus 5 High
        ↓
Accessibility QA — GPT-5.6 Sol High
        ↓
Final visual QA — GPT-5.6 Sol High
        ↓
Corrections — Opus 5 High
        ↓
Automated regression sweep
        ↓
Styling cleanup — Opus 5 High
        ↓
DONE
```
