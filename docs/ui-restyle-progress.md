# UI Restyle — Progress

Companion to [ui-restyle-plan.md](ui-restyle-plan.md). Updated at the end of every
phase or implementation batch, per the plan's handoff protocol.

## Current Phase

**Phase 15 (styling cleanup) complete. The restyle plan's last phase is
done;** what remains is listed under Next Task and needs the owner.

The consistency pass found and removed the last off-system styling in live
code, and deleted the one deprecated rule the system had kept on purpose. Counted
over the Phase 1 audit's scope (`.tsx` under `app`, `components`, `features`,
`hooks`, `lib`):

| Measure | Phase 1 | Before Phase 15 | Now, all files | Now, live code |
| --- | --- | --- | --- | --- |
| Hardcoded hex values | 22 | 22 | 9 | **2** |
| `rgba()` literals | 26 | 20 | 16 | **0** |
| Raw palette classes | 436 | 16 (+7 `black`/`white`) | 13 (+1) | **0** |
| Distinct radius values | 9 | 11 | 8 | **5** |
| Shadow values | the whole ladder, `xs`–`xl` + `inner` + 3 coloured | `overlay`, `none`, `xs` | same | **`overlay`, `none`** |
| Files with inline `style={{ }}` | 14 | 13 | 11 | **7** |

"Live code" excludes comment text and the thirteen files nothing imports
(TD-32), which now hold every remaining `rgba()`, raw palette class, blur and
non-token shadow in the source. They are **flagged, not deleted**, pending the
owner's confirmation. The two live hex values are the theme's grounds in the
browser `themeColor`, which metadata can only take as hex. The five radius
values are `none`, `sm`, `md`, `full` and `[inherit]`. The seven inline styles
all carry runtime values. The before and now columns come from one script and
compare exactly; Phase 1 counted with its own scan, so that column compares in
kind, not to the unit.

`npm run ui:regression` on the routes Phase 15 changed passes: 43 of 43 (routine detail, routine edit, the wizard, dashboard, login and signup at 390/768/1440 in both themes, and navigation at every width), then routine detail again at all seven widths in both themes after the accordion fix, 14 of 14. `npm run verify` passes end to end on the final tree — lint, typecheck, 169 tests / 27 files and the production build — run in a throwaway worktree because the owner's dev server was up on this checkout; the compiled CSS no longer contains the heading rule, and every class Phase 15 introduced is present.

**TD-32 is closed** (2026-09-13, on the owner's confirmation): the thirteen
zero-importer files are deleted, with the two folders they left empty and the
two dependencies only they imported — `react-day-picker` and
`@radix-ui/react-popover`. Counted again over the Phase 1 scope, every file now matches live code: 2 hex values (the theme grounds in `themeColor`), 0 `rgba()`, 0 raw palette classes, 5 radius values, only `shadow-overlay` and `shadow-none`, and 7 files whose inline styles carry runtime values. The uninstall dropped the `@emnapi` lock
entries TD-33 guards; the lock was rebuilt from the pre-uninstall one minus the
removed packages, so those entries are unchanged. `npm run verify` passes end to end on the final tree, after a clean `npm ci` from the rebuilt lock (549 packages, five fewer).

Committed state: nothing since `dc13b1f` is committed — the Phase 14 fixes and
follow-ups, Phase 15 and every document change are in the working tree.

## Completed

### Phase 15 — Styling cleanup

A consistency pass over what the restyle touched, applying decisions v1.0 had
already made — no new ones. Counted by a census script
(`p15_count.mjs`, scratch) before and after, over every source `.tsx`, `.ts` and
`.css`; the table in Current Phase holds the numbers.

**Leftover colour, hex and gradients** — all in surfaces no batch had reached:

- `app/(protected)/loading.tsx`, the protected route fallback, rendered the
  parchment texture and the gold vignette on every navigation. Both removed; it
  is skeletons on the ground.
- The error boundaries: `login/error.tsx` was `bg-black` with a hex gradient
  over the `Button`; `global-error.tsx` the same with a hand-rolled button. Both
  are on the ground and ink, and use the Button's own variants.
- Both loading bars: `top-progress-bar` (the shell's navigation bar) drew a gold
  `rgba()` gradient with a glow, `top-loading-bar` a gold hex gradient sliding
  on a keyframe outside the motion spec's closed inventory. Both are ink
  (`bg-primary`, as `Progress` fills); the second pulses with the spec's own
  `pulse-opacity`.
- The note indicators in `ExerciseCard` and `ExerciseNoteRow` were a yellow hex
  dot with a white "!"; they are ink on the ground, matching the note icon's own
  ink.
- `RoutineHeader`'s favourite and completion icons were `red-500` and
  `green-500`; they are `foreground` and `success`, as on `RoutineCard`.
- The browser `themeColor` and the web manifest said pure white and black; they
  now carry the grounds from §4.1 and §4.2 (`#ede9e1`, `#0f0c08`).

**The deprecated heading rule.** §5.5 scheduled the global `h1`–`h4` Bebas rule
for deletion in the last Phase 8 batch; it survived six phases because 22
headings still depended on it — the error boundaries, `not-found`, routine
detail and the wizard's steps. Each now carries its §5.3 rank (`type-page`,
`type-section`, `type-panel`, and `type-numeral` for the 404), with the size
and weight utilities that would have overridden the rank removed, and the rule
and its unused `.heading-classical` selector are deleted. A multi-line scan
finds **no heading without a rank**. One heading the scan could not see was
caught in the browser: Radix's accordion renders its own `<h3>`, and
`AccordionTrigger` had no rank, so the routine detail's day headers fell back to
the system face the moment the rule went. The primitive's trigger now carries
`type-panel` (Findings 74).

**Radii.** `rounded-lg` (8 sites) and bare `rounded` (3) compile to 4px, the
same as `rounded-md` (§7.1 said Phase 15 would normalise them); `rounded-[2px]`
is `rounded-sm`. No pixel moved. A progress skeleton lost its pill, a badge its
circle, and three decorative medallions their circle and action-colour tint
(§7, §4.3 rule 1).

**One-off styles.** Four hand-rolled spinners became the loaders the app
already uses (`Loader2` in controls, `ClassicalLoader` at page level); an
emoji spinner went the same way; a hand-rolled `animate-pulse` skeleton became
the `Skeleton` primitive; the four remaining error-page buttons became `Button`
variants; four `duration-300` became `--motion-slow` (the same 300ms); one
static inline `maxHeight` became a class; the stock `animate-pulse` on the
active routine's dot became the spec's `pulse-opacity`.

**Left on purpose:**

- Three `rounded-full` uses that are not avatars, each an earlier phase's
  decision: the `ClassicalLoader` ring, the scroll-area thumb, and
  `RoutineCard`'s pulsing status dot.
- Two gradients: the wizard's horizontal-scroll edge fades, `muted` to
  transparent — an affordance, not an accent (§4.3 rule 6 governs accents).
- Seven files with inline styles, all runtime values: widths and transforms
  that track progress, the rest timer's `env(safe-area-inset-bottom)`, a
  measured `maxHeight`, the sidebar's `--nav-pitch`, and an icon's size prop.
- `rest-timer-bar`'s `ease-linear`: a countdown should move at constant speed.
- `SHOW_QUICK_WORKOUT_ENTRY`, `handleStartEmptyWorkout` and the
  `isStartingEmpty` branch — untouched.
- The thirteen zero-importer files (TD-32) and `react-day-picker`, which only
  `calendar.tsx` imports: flagged for the owner, not deleted.
- The composition of four surfaces that are now token-clean but were never in
  a batch — routine detail, the error boundaries and `not-found`, and two
  loading skeletons that still sketch removed layouts. Recomposing them would
  be a restyle batch, not cleanup: recorded as TD-38.
- **The body face.** Unranked text computes to the system UI font, not the
  Oswald §5.2 specifies (Findings 75). The fix is one class on `body`, but it
  changes every unranked line on every screen, and every review so far approved
  the current face — so it needs a capture review, not a cleanup commit.
  Recorded as TD-39.

**Verified:** `npm run ui:regression` on the routes Phase 15 changed passes: 43 of 43 (routine detail, routine edit, the wizard, dashboard, login and signup at 390/768/1440 in both themes, and navigation at every width), then routine detail again at all seven widths in both themes after the accordion fix, 14 of 14. Captures of the surfaces the sweep does not reach — `not-found`, routine detail, the wizard's first step and the auth callback, at 390 and 1440 in both themes — show no heading in Bebas except the 404 numeral, and no horizontal overflow. `npm run verify` passes end to end on the final tree — lint, typecheck, 169 tests / 27 files and the production build — run in a throwaway worktree because the owner's dev server was up on this checkout; the compiled CSS no longer contains the heading rule, and every class Phase 15 introduced is present.

### Phase 14 — Automated regression sweep

Extends the Phase 0 Playwright harness; no application file changed. Run with
`npm run ui:regression` against a running dev server and backend, signed in
(`npm run ui:login`).

**What the sweep asserts** (`e2e/regression.spec.ts`, project `regression`):

- **Layout — 16 routes x 7 widths x 2 themes = 224 checks.** No sideways
  scroll on the document or on the shell's inner `<main>`, which is the real
  scroll container, with the widest offenders named in the failure; no console
  error or uncaught exception; content rendered; exactly one visible `h1`.
  Routes: `/login`, `/signup` and `/members/<username>` signed out; dashboard,
  routines, the wizard, routine detail and edit, workouts, history, a history
  detail, the session screen (a finished session, rendered by id), progress,
  profile, search and settings. Ids come from the seeded data at run time.
- **Interactions, per width — 59 checks.** Navigation (five sidebar or drawer
  destinations with `aria-current`, plus one through the account menu); the
  mobile drawer (44px toggle, width, scrim, dismissal) and its close control;
  the desktop sidebar's collapse and expand, including the content column's
  offset; an alert dialog (the routine delete confirmation, dismissed by Escape
  and by Cancel — Delete is never pressed) and a dialog (the plate calculator,
  dismissed by Escape and by an outside click), each inside the 16px inset
  (§11.9) with focus moved in; the account and routine menus (inside the
  viewport, attached to and end-aligned with the trigger, Escape closes and
  returns focus) and the header search suggestions; hover on a ruled row and a
  sidebar item; keyboard focus in both themes — every Tab stop on screen, and
  `:focus-visible` with a painted ring on the account trigger, the search field
  and the highlighted menu item.
- **Console, everywhere.** An automatic fixture watches every test's page,
  interactions included: errors fail the test; warnings are recorded as
  annotations.

**Preconditions** (`e2e/preconditions.ts`, shared with the capture spec): a
saved sign-in, a backend answering `/health`, an app that keeps the session — a
bounce to `/login` is reported with the auth requests that caused it — and no
live workout session (TD-34). The capture spec keeps one declared exception:
`UI_SESSION_ID` set to the live session captures the session screen, and only
that screen and `/login` may be captured in that run. The check writes the
refreshed tokens back to `.auth/state.json`.

**Results** — run 5, the full suite (57 minutes against the owner's dev
server), plus a re-run of the two families whose harness defects were fixed
after it:

| Family | Checks | Pass | Fail | Cause |
| --- | --- | --- | --- | --- |
| Layout | 224 | 198 | 26 | TD-35 (12), TD-37 (14) |
| Navigation | 7 | 7 | 0 | |
| Mobile drawer | 3 | 3 | 0 | |
| Drawer close control | 3 | 0 | 3 | TD-36 |
| Desktop sidebar | 4 | 4 | 0 | |
| Alert dialog | 7 | 7 | 0 | |
| Dialog | 7 | 7 | 0 | |
| Dropdowns | 7 | 7 | 0 | |
| Hover | 7 | 7 | 0 | |
| Keyboard focus | 14 | 8 | 6 | TD-36 (320–430, both themes) |
| **Total** | **283** | **248** | **35** | |

**Harness defects found and fixed during the phase.** Five, each a wrong
measurement of the app rather than a wrong expectation of it — no assertion was
loosened:

1. The username pattern stopped at the first hyphen (`codex` for
   `codex-prof03-0909`) and sent the members check to a profile that does not
   exist. It is now built from the contract's `USERNAME_PATTERN_SOURCE`.
2. A backend restart surfaced as "the saved session has expired", which cost
   two runs. The precondition checks `/health` first and names the failing auth
   request on a bounce (Findings 60).
3. An open Radix menu marks the rest of the page `aria-hidden`, so the trigger's
   role-based locator timed out — all seven dropdown checks (Findings 61). The
   trigger is measured before the menu opens.
4. `nextjs-portal`, `next dev`'s development indicator, was counted as an
   off-screen Tab stop at every width (Findings 64). It is excluded as tooling a
   production build does not have; the drawer's off-screen links still count.
5. The highlighted menu item's ring was read once, a frame early on a slow dev
   server. It is polled now.

**The runs were taken against a moving tree.** The owner committed and merged
mid-phase — `dc13b1f` took the first draft of this harness (and
`.p14-probe.mjs`), `d345e72` bumped `@sunsteel/contracts` to 0.20.0 — which left
`node_modules` stale twice (`npm ci` both times, the lock unchanged), and the
owner's backend restarted under its file watcher several times. Runs 1, 2 and 4
and one targeted re-run were stopped by that environment, not by the app.

**Not done:** `npm run ui:capture:after` was not re-run — no UI changed.

#### Follow-up — TD-35, TD-37 and the stray probe

Requested by the owner after the phase closed. Every cause was **measured
before anything was changed**, and two of the three recorded in TD-35 turned
out to be wrong (Findings 66).

- **`/routines/[id]`** — `RoutineHeader`'s navigation row ("Back to Routines"
  plus Favorite, Mark Complete and Edit) could not wrap, pushing `<main>` to
  551px at 320 and 563px against 512 at 768. Both of its rows wrap now. The
  Quick Start day buttons, first blamed, were never involved.
- **The session screen at 320** — the set row's fixed column minimums (46 + 62
  + 72 + 48px, plus the 29px checkbox column and the gaps) needed 273px where
  the row has 228. The 13px captions, first blamed, fit their columns. Below
  `sm` the three field columns now size to their captions, the weight column
  takes the larger share (`flex-[1.4]`), the set column needs 40px rather than
  46, and the fields drop their side padding. Measured at 320: a five-character
  weight needs 49px and the weight field has 53, still at 16px (TD-29); the
  checkbox still catches a click 10px either side; the RPE field's edge hits
  the field, not the checkbox's hit area. From `sm` the row is unchanged.
- **The public members header at 320** — 353px for a 320 viewport. Below `sm`
  the wordmark steps to 16px and the gaps and button padding tighten; the 44px
  theme toggle keeps its target. It now ends at 304 with its padding intact.
- **`/progress`** — three secondary `h1`s, not one: the selected exercise, and
  the error and empty states the sweep had not reached. All three are `h2`,
  with their classes unchanged, so nothing moved (Findings 54).
- **`.p14-probe.mjs`** — deleted. It was a one-off console probe committed at
  the repo root; its two checks (per-route console output, active-session
  detection) are what `e2e/regression.spec.ts` and `e2e/preconditions.ts` now
  do properly, and it was the only file failing lint.
- **ESLint ignores** — `test-results/` and `playwright-report/` added. A lint
  run during a regression run crashed while globbing a folder Playwright was
  deleting (Findings 67).

**Verified:** the targeted regression runs — members, routine detail, session
and progress layouts at seven widths in both themes, plus both dialog checks on
the session screen — 70 of 70; the measurements above; `npm run verify` as in
Current Phase.

#### Follow-up — TD-31: the splash and the debug panel

Requested by the owner. The design system never mentions the splash, so it was
brought onto the rules that are written down rather than onto a new direction.

- **The splash** (`InitialLoadAnimation`) kept its photograph, its timing
  (1200ms, 500ms exit) and its copy. Its ground is the theme's ground instead
  of black. The type sits on an opaque `panel` (§11.5) instead of three
  gradient scrims and a vignette (§4.3 rule 6, §11.5). The gold gradient
  wordmark and laurel with their glows are ink (§4.3 rule 3, §8, §9.2), and the
  screen's one pair of corner brackets replaces four amber corner frames and an
  inner frame (§11.11). The progress track is square with an ink fill (§7), and
  every entrance is an opacity fade: the rise, scale, spin, shimmer sweep and
  floating particles are on the motion spec's prohibited list. The wordmark is
  a `p`, not a second `h1`. `children` still mount on the first frame, and the
  content wrapper's 0.98 scale is gone, so it animates opacity only, as the
  `AGENTS.md` gotcha requires. `corner-accent.tsx` lost its only importer and
  was deleted.
- **The performance panel** is a `panel` in Space Mono with no shadow (§8)
  instead of a blue button over a black terminal. It gained a visible keyboard
  focus ring — before, the button's only shadow was the decorative
  `shadow-lg` — and caps its width to the viewport below `sm`.

**Verified**, by auditing each surface's rendered DOM:

| Surface | Widths x themes | Raw classes before | After |
| --- | --- | --- | --- |
| Splash | 390, 768 x 2 (it renders only below 1024) | 27, plus 6 inline colour styles | 0, and 0 |
| Performance panel | 390, 768, 1440 x 2 | 8 | 0 |

At 320 the wordmark sits inside its panel and nothing scrolls sideways. The
panel's focus ring is ink in light and the honour mark in dark, like the Button
primitive's. The regression checks that load the splash — the dashboard, routines and workouts layouts at 320–768 in both themes, navigation at every width and the mobile drawer — pass, 34 of 34: one navigation check at 768 failed while a production build was loading the machine, and passed on an idle re-run. Lint, typecheck and 169 tests are green.

The panel renders only when `NEXT_PUBLIC_SHOW_PERFORMANCE_PANEL=true` at
dev-server start, so it was checked on a second dev server (port 3001) run from
a throwaway worktree with that flag — the owner's server and `.env.local` were
not touched. Turbopack could not build that worktree from the scratchpad
(Findings 69).

### Phase 13 — Final corrections

Applied the approved points from
[ui-accessibility-review-sol.md](ui-accessibility-review-sol.md) (Phase 11) and
[ui-final-review-sol.md](ui-final-review-sol.md) (Phase 12). Those two phases
ran in separate sessions and are recorded in their own documents rather than
here. Every point was checked against the **current** code before it was
accepted, because both reviews worked from captures that predated several
commits — three of the final review's points were already fixed.

**No new visual direction, no logic change, no token added or changed.**
`app/globals.css` changed only in its reduced-motion block. Every data hook,
service, query key, route and handler is untouched; where a clickable `<div>`
became a `<button>` or `<a>`, it calls the same handler. `SHOW_QUICK_WORKOUT_ENTRY`,
`handleStartEmptyWorkout` and the `isStartingEmpty` branch are intact — checked
explicitly after the Workouts empty state was recomposed.

**Verified, not assumed:**

- `npm run lint` clean, `npm run typecheck` clean, `npm test` **158 passing / 25
  files**.
- `npm run ui:capture:after` — 54 route captures — plus interaction captures:
  the keyboard-focused menu, the finish dialog (390/1440, both themes), the
  session screen fresh and with a completed set (390/768/1440, both themes,
  through the harness's own `UI_SESSION_ID` / `UI_SESSION_FULL_ID` targets), the
  recap dialog and the history recap panel.
- An overflow sweep of **11 routes x 8 widths x 2 themes = 176 checks, no
  horizontal overflow**, including signed-out `/login` and `/signup`.
- **Exactly one visible `h1` on every route** at 390 and 1440.
- Sidebar: **0** interactive elements nested in another, `aria-current="page"`
  on the active item, **0** unnamed buttons in the header, nav and sidebar.
- Stepper: 4 step buttons in each layout, `aria-current="step"` on the current
  one; at 390 the first form field now sits at 544px, inside the first viewport.
- Menu keyboard focus: a 2px ring on the focused item, seen on screen rather
  than inferred from a computed style.
- Touch targets at 390: header controls, routine row actions and filters all
  **44x44**; the floating action button count is **0**.
- Set-row checkbox: the visible box is 20x20; a click **10px outside it**
  completed the set. Reps field **44px** tall at 390.
- Login "Or": **6.09:1** light, **5.36:1** dark, rendered.

**The session screen was captured from a live test session**, started with the
owner's permission on a test account. Order mattered: the finish dialog only
appears while sets are outstanding — with everything complete, Finish finishes
immediately (Findings 22) — so the dialog was captured first, then the fresh
session, then a set was completed and the full-session captures taken, then
the session was finished to capture the recap. It leaves one COMPLETED session
in that account's history and **no active session** (confirmed: `/workouts` no
longer redirects).

#### Decision log — every review point

The rule applied throughout: **accept** anything that is styling, layout,
typography, tokens, or markup semantics that exposes state already on screen
(`aria-current`, `aria-pressed`, `aria-invalid`/`aria-describedby`, a native
`<button>`/`<a>` in place of a clickable `<div>` calling the *same* handler).
**Reject or report** anything that needs new behaviour, new keyboard logic, new
content, or a decision the locked system has already measured and closed.

**Accessibility review (`ui-accessibility-review-sol.md`)**

| # | Pri | Point | Decision | Why / what was done |
| --- | --- | --- | --- | --- |
| 1 | P0 | Set controls too small | **Accepted** | Numeric fields `h-11` below `md` (44px), `md:h-9` above. The 20px checkbox keeps its visible size and gains a 44px hit area through an `::after` inset on the Radix button — no layout width, the same trick the save ring already uses. Verified by clicking 10px *outside* the visible box and confirming the set completed. |
| 2 | P0 | Sidebar nests a `<button>` in each `<a>` | **Accepted** | One anchor per destination (`Button asChild` → `Link`), `aria-current="page"` on the active item and on Settings. The collapse and close icon buttons had no accessible name; they have one now. Verified: 0 nested controls, `aria-current` on Dashboard. |
| 3 | P0 | Stepper is pointer-only | **Accepted** | Every step is a real `<button>` calling the same guarded handler; `aria-current="step"`, `aria-disabled` on unreachable steps, and a label naming each state ("Step 2 of 4: Training Days, available"). Mouse behaviour is identical. |
| 4 | P0 | Menu/select keyboard focus invisible | **Accepted** | `focus-visible:ring-2 ring-inset ring-ring` on every menu item type and `SelectItem` — ink in light, honour mark in dark, both well over 3:1 against `--popover`. `focus-visible` rather than `focus`, so it appears on keyboard navigation, not on hover. Verified on screen. |
| 5 | P1 | Reduced motion misses Framer and stock animations | **Accepted** | `MotionConfig reducedMotion="user"` at the app root covers every framer-motion component in one place (transforms and layout off, opacity kept — motion spec §3). `animate-spin`/`pulse`/`ping`/`bounce` added to the reduced-motion block, where §3 says spinners are static. The auth screens' 20px slide-ins are gone entirely (see final 3). |
| 6 | P1 | Search suggestions not a keyboard composite | **Partly accepted** | "View all results" was a clickable `<div>`; it is a `<button>` with the same handler. The search-results cards on `/search` were the same defect and are now links. **Rejected:** the full combobox/listbox with Arrow/Escape handling and active-descendant state — that is new keyboard behaviour, outside a UI-only phase. Reported. |
| 7 | P1 | Validation errors not associated | **Accepted** | History date range: both fields get `aria-invalid` and `aria-describedby` to the message, which is now `role="alert"`. Set rows: each invalid field is linked to a per-row error id; a failed save is announced as `role="alert"` instead of a polite status. |
| 8 | P1 | Heading hierarchy changes with the viewport | **Accepted** | The top bar title is no longer a heading; the visible page inscription (`HeroSection` and the pages that stand in for it) is the single `h1`; secondary page headings are `h2`. Classes carry the styling, so no visual change. Verified: exactly one visible `h1` on every route at 390 and 1440. |
| 9 | P1 | Selected states not exposed | **Accepted** | `aria-pressed` on the routine filters and `CommonSplitCard`; the theme toggle names the theme it switches to. |
| 10 | P1 | Login "Or" fails contrast | **Accepted** | `--ink-3` on the panel surface: **6.09:1 light, 5.36:1 dark**, measured rendered. |
| 11 | P1 | Sub-12px text in set rows and the wizard | **Accepted, with one exception** | Set-row captions, RIR, previous-performance and improvement text move to 13px body-small sentence case (§11.7); wizard split cards, stat captions, set labels, badges and day labels to 12–13px. **Rejected for the sidebar's "Soon":** 10px bare uppercase is written into §11.10 of the locked system. |
| 12 | P2 | Mobile targets under 44px | **Accepted** | Header icon controls, theme toggle, routine row actions, filter buttons, menu rows (`min-h-11` below `md`), the toast's dismiss (hit area), the password show/hide control and the session back button. Verified 44x44 at 390. |
| 13 | P2 | Disabled semantics and visuals disagree | **Partly accepted** | "Start session with day" is a `DropdownMenuLabel`, not a live item made mouse-inert. Opacity-based disabled styling removed from the session actions, tabs, accordion and a wizard field — the primitives' `--ink-3` on `--surface-sunk` applies (§4.3 rule 7). **Rejected:** making the sidebar's "Soon" items inert — they deliberately explain themselves with a toast; changing that is behaviour. |
| 14 | P2 | Session captures stale | **Accepted** | Re-captured from a live test session (with the owner's permission) at 390/768/1440 in both themes, fresh and with a completed set, plus the finish dialog and the recap. |

**Final review (`ui-final-review-sol.md`)**

| # | Pri | Point | Decision | Why / what was done |
| --- | --- | --- | --- | --- |
| 1 | P0 | Session uses superseded colour semantics | **Accepted — most was already fixed** | Finish was already primary ink and checked boxes already `--success-strong` (Phase 7, Batch 4); the captures predated that. What remained, and is fixed: the progress bar named `honour-bright`, a token that does not exist (TD-30); the masthead painted 100% in gold; each completed exercise's "Complete" label and the completed set number were gold. All `--success` now (§4.3 rule 2). |
| 2 | P0 | Settings breaks at 768 ("Ki") | **Already fixed** | Phase 9 (Findings 47). Re-verified: no field value clipped at any width. |
| 3 | P0 | Login is a separate product | **Accepted** | The auth shell is rebuilt on the product's grammar: ground, top bar with wordmark and theme control, the inscription over the double rule, the form as a `panel` with the Input primitive's boundaries, status blocks as marks on wells. The glow grid, amber blur blobs, gradient wordmark, split-screen quote and all Framer entrance motion are gone. Closes the auth half of TD-31. |
| 4 | P1 | Session repeats its state | **Accepted** | §11.8 says exactly this. The standalone panel with its own progress bar is now an inline control row under the masthead; overall progress is stated once, in the masthead; per-exercise and per-set completion stay. The component keeps its responsibility — it still renders Discard, Finish and the outstanding-sets note. |
| 5 | P1 | Set row cramped on mobile, stretched on desktop | **Partly accepted** | Numeric fields cap at `--field-max` from `md` (§10.2), captions are readable 13px, and fields are 44px on touch. **Not done:** regrouping the row's inputs into a new desktop composition — a new layout for the densest control in the app, which §11.7 has not specified. Reported for a design decision. |
| 6 | P1 | History doesn't become desktop at 1440 | **Accepted** | From `xl` the archive uses `--content-max` and each row becomes a ledger line: title and status in one column, the four figures on stable axes beside it. |
| 7 | P1 | Profile is a card dashboard | **Accepted** | Masthead over the double rule instead of a gradient band; the third-party "stardust" texture (a request to transparenttextures.com on every view) removed; the blurred avatar halo gone; the three watermark stat cards are one ruled band; records are a ruled ledger; emerald/orange/blue trend colours removed. Closes the profile half of TD-31. |
| 8 | P1 | Empty states are generic placeholders | **Accepted** | Search (no query, no results) and Workouts are compositions on the page grid: the inscription over the rule and a message at a readable measure; the dashed box and centred icon medallions are gone. `SHOW_QUICK_WORKOUT_ENTRY`, its handler and the `isStartingEmpty` branch are untouched. |
| 9 | P1 | Dashboard desktop isn't an open ledger | **Partly rejected** | The six-column stat band is measured to overflow (Findings 34) and is on the Do Not Revisit list. Today's Workouts stays a panel — §11.5 keeps a screen's single primary call to action boxed. **Accepted:** the bordered row inside that panel was the card-in-card effect; rows are ruled now. |
| 10 | P1 | Routine filters clip; floating pill | **Accepted** | The strip wraps instead of hiding options off the edge. The floating "+ New" pill is gone; the rectangular Create Routine action shows at every width. That also removes Findings 50's mid-scroll overlap. |
| 11 | P1 | Wizard spends the mobile viewport on navigation | **Accepted** | Below `lg` the tracker is one compact row of markers plus the current step, so the first field sits in the first viewport at 390. **Rejected:** moving the active-session notice — it is the shell's banner, shown on every page. |
| 12 | P2 | Surface/radius drift | **Accepted** | Covered by 3, 7, 8 and 10. |
| 13 | P2 | Finish uses destructive emphasis | **Already fixed** | Batch 4 made Finish primary ink; crimson stays reserved for Discard and Delete. The review's screenshots predated it. |
| 14 | P2 | Finish dialog has competing axes | **Already fixed** | Batch 4 put `alert-dialog` on one left axis with the prescribed stacked/row actions. Verified in the new finish-dialog captures. |
| 15 | P2 | Small condensed metadata | **Accepted** | Same work as a11y 11. |
| 16 | P2 | AI-template tropes | **Accepted** | The split auth page with quote and glow, the profile gradient hero with stat-card trio, the dashed empty state and the floating pill — all four are gone (3, 7, 8, 10). |

#### Follow-up — the history detail page (TD-31)

Requested by the owner after Phase 13 closed. Same rules: UI only, v1.0 as
written, the session screen's existing patterns reused rather than a new
composition. `useWorkoutSessionData`, `useSessionRecap`, `useCollapseMap`, the
`SessionMetrics` shape and every prop contract are untouched.

- **Page**: `ledger-page` with the session screen's rhythm (`space-y-8 py-6
  md:py-8`), replacing `container max-w-4xl`. Loading and error states moved to
  `type-body-sm` on the ink tokens; an unavailable recap is a `mark-warning`
  note on a well, as the session screen's previous-performance notice is.
- **Masthead** (`history-session-header`): the inscription at page rank with
  its one pair of corner brackets over the page's one double rule (§11.11). It
  was an unclassed `h1` through the global Bebas rule. The summary card became
  a `dl` of captions over mono values; status is a mark plus its word
  (`mark-success` completed, `mark-warning` aborted, transparent in progress —
  the archive list's rule), not a filled or crimson badge. Back control named
  and 44px below `md`.
- **Recap** (`SessionRecapPanel`): ruled rather than boxed (§11.5) — an `h2`
  over a single rule, so the recap's `h3` subsections now nest correctly.
- **Exercises** (`history-exercise-group`): ruled entries in a `divide-y` list,
  the live `ExerciseGroup`'s shape, with a `mark-success` rule when every set
  was completed and an "n/m sets" count. The toggle is a native `<button>` with
  `aria-expanded`/`aria-controls` calling the same `onToggle`; it was a
  `role="button"` card header with a hand-rolled key handler. The
  muscles/equipment line is body-small instead of a bordered badge.
- **Set rows** (`set-comparison-row`): ruled ledger lines, not bordered mobile
  cards; values in Space Mono; captions sentence-case body-small (§5.3).
  Completion is a check glyph in `--success-strong` plus an `sr-only` name, or
  a dash with "Not completed" — it was a filled-ink badge (§4.3 rules 2, 8).
- An `sr-only` "Exercises" `h2` closes the outline gap: without it an aborted
  session (no recap) went `h1` → `h3`.

**Verified:** lint, typecheck, 158 tests; 12 captures (a completed session with
a recap, an aborted one without, 390/768/1440, both themes) compared against
captures of the old page taken first; no horizontal overflow in any; one `h1`
each; collapse toggles by click, Enter and Space with `aria-expanded`
following; back control 44x44 at 390; **zero** raw-palette, `rounded-lg`,
`bg-card` or `text-muted-foreground` classes inside `main`. The stale "takes
gold" comment on the live `ExerciseGroup` — contradicting its own
`mark-success` — was corrected in passing.

### Phase 10 — Motion implementation

Read `AGENTS.md`, the plan, this file, `docs/ui-motion-spec.md` and
`docs/ui-design-system.md` §9 first. No new dependency: `tailwindcss-animate`
remains the only animation utility source, per spec §4.

**The two signatures now exist.** Neither did before this phase.

- *Rule draw* (§2.9.1) is folded into `.rule-heading` itself, so all eleven
  consumers get it without touching a call site. The border stays in the box but
  transparent and the drawn rule is a `::after` overlay, so the heading's height
  is unchanged — a scaled border would have shifted every one of those layouts by
  3px. It is a mount-time animation, not a transition, so a re-render cannot
  replay it (§1.3 rule 1).
- *Set completion* (§2.9.2) is `.mark-fill` on the session exercise row. The 3px
  border holds the space and stays transparent; the fill is an overlay bar
  scaling on Y from the top. Completing a set therefore never reflows the row,
  which was the explicit reason the spec chose a transform over a growing border.

**§6 delta table, all applied:**

| File | Change |
| --- | --- |
| `accordion.tsx` | Row-template transition deleted — height is instant, reveal is opacity at 120ms; trigger `transition-all` → `transition-colors`; chevron 200ms standard |
| `dialog.tsx`, `alert-dialog.tsx` | Scale 0.98 not 0.95; enter 300ms standard, exit `data-[state=closed]:duration-[180ms] ease-exit`; scrim 200/180 |
| `dropdown-menu.tsx`, `select.tsx`, `popover.tsx` | Scale 0.98; enter 200ms standard, exit 140ms exit |
| `tooltip.tsx` | Scale 0.98; 120ms standard / 80ms exit |
| `tabs.tsx` | `transition-[color,box-shadow]` → `transition-colors` at 200ms standard; active `shadow-sm` removed |
| `toast.tsx` | Close button gains `hover-reveal`; opacity 1 at rest under `pointer: coarse` |
| `skeleton.tsx`, `classical-loader.tsx` | `pulse-opacity` 1600ms and `spin-slow` 800ms; spinner recoloured to `--ink-2` |
| `top-progress-bar.tsx` | Fill `width` → `scaleX`; opacity 120ms enter / 140ms exit |
| profile page | The last page-level `animate-in fade-in slide-in-from-bottom` deleted |

**Nav marker (§2.3).** The sidebar previously coloured each item's own 3px
border, which cross-fades rather than slides — the spec is explicit that per-item
borders cannot slide. There is now one marker element translated between rows.
The grid pitch is uniform (item height plus the 8px gap), so the offset is exact
and needs no measurement JS: a CSS variable and `translateY`. It hides when the
active route is not in the list, so Settings — which lives in the footer — keeps
its own mark rather than parking the marker on a wrong row.

**`prefers-reduced-motion` rewritten.** The previous block was a blanket
`transition-duration: 1ms` on every element. That is not what §3 asks for and it
is worse than it looks: it kills colour and opacity feedback along with motion.
The new block sets the three duration tokens to 120ms, disables the four
keyframes by name, forces the mark to its final state, and zeroes the enter/exit
scale and translate variables so overlays become opacity-only. Colour survives,
because colour at 120ms is not vestibular load.

**Keyframe inventory closed at four**, as §4 requires: `spin` (Tailwind's, driven
at 800ms), `pulse-opacity`, `rule-draw`, `mark-fill`.

### Phase 0 — Baseline

Done:

- Created `docs/ui-restyle/screenshots/before/` and `after/`, per the plan's
  location rule (nothing at the repository root).
- Added a `.gitignore` rule for `after/` only, with the reason inline. `before/`
  stays committed so the frozen baseline is actually frozen.
- Wrote [ui-restyle/capture-manifest.md](ui-restyle/capture-manifest.md): the
  exact checklist of 10 routes plus 10 component/state captures, at 390/768/1440
  in light and dark, DPR 1, with naming convention and preconditions.
- Defined the responsive sweep (320/375/390/430/768/1024/1280/1440) and
  pre-loaded it with two predictions from the Phase 1 audit about where this
  codebase will actually break.

Capture tooling built (Playwright, decided 2026-09-07 — see Visual Decisions):

- `@playwright/test` ^1.63 as a devDependency, Chromium downloaded.
- `playwright.config.ts` — DPR 1, `workers: 1`, no retries, `before`/`after` as
  projects rather than an environment variable (`VAR=x cmd` does not work in
  cmd.exe, and this repo runs on Windows). `webServer` reuses an already-running
  dev server instead of fighting over the same `.next/`.
- `e2e/capture-targets.ts` — the manifest in code, mirroring the markdown one.
- `e2e/baseline.spec.ts` — 54 captures (9 routes x 3 widths x 2 themes; the
  session route is skipped unless `UI_SESSION_ID` is set). Seeds `localStorage`
  before app scripts run to force the theme deterministically, because dark is
  class-based here and emulating `prefers-color-scheme` alone would not work.
  Fails loudly if the saved session has expired instead of silently capturing
  sixty copies of the login page.
- `e2e/save-auth.mjs` — opens a real browser so the owner signs in once; only the
  resulting cookies and `localStorage` are written to `.auth/state.json`, which
  is gitignored. The password is never read by the script.
- `npm run ui:login`, `ui:capture:before`, `ui:capture:after`.

Verified: `npm run typecheck` clean, `npx eslint e2e playwright.config.ts` clean,
`npm test` still 122 passing across 14 files (Playwright uses `*.spec.ts`, Vitest
includes `*.test.ts`, so neither runner picks up the other's files),
`playwright test --list` resolves all 54 captures.

**Baseline captured 2026-09-08**: 60 images in
`docs/ui-restyle/screenshots/before/`, 17 MB, DPR 1, in light and dark (30 each),
against seeded data. The owner signed in once through `ui:login`; the run needed
nothing further.

Note that light/dark was **not** in the source plan — it was added when adapting
the plan to this repo, after confirming `ThemeProvider` runs with
`attribute="class"` and `enableSystem`. Without it half the app would have gone
unaudited.

Three defects in the capture harness were found and fixed during the run. All
three produced plausible-looking output, which is why they are recorded here:

1. **`test.skip()` at module scope skips the whole file.** The first run reported
   `54 skipped` — Playwright treats a bare `test.skip(condition)` outside a test
   body as a file-level skip, so one route needing an unset id disabled every
   capture. Replaced with a plain `continue`.
2. **`/login` was captured while authenticated.** `middleware.ts` redirects a
   signed-in visitor from `/login` to `/dashboard`, so the six `login-*.png`
   files were dashboards under the wrong name — same viewport, same weight, only
   the checksums differed. `/login` now runs in a context built without the saved
   storage state, and asserts it actually stayed on `/login`.
3. **`fullPage: true` does not work on the authenticated shell.** The protected
   layout is `flex h-screen` with an inner `<main class="flex-1 overflow-auto">`
   (`app/(protected)/layout.tsx:159` and `:212`), so the document never grows and
   a "full page" screenshot is just the viewport. 48 of 54 images were silently
   truncated at exactly 900px. The capture now measures the scroll container,
   grows the viewport to the content (capped at 8000px) and then shoots. The
   dashboard went from 900px to 2212px at 390 and 2488px at 768.

**`session-*` was captured in a second pass.** The live-session screen is the
densest surface in the app and the audit flags it as a likely Phase 4 target, so
it should not be missing from a frozen baseline. No session was active by then,
so one was started from the dashboard, captured at all three widths in both
themes, and then aborted through the app's own
`PATCH /workouts/sessions/:id/finish` endpoint with `status: 'ABORTED'`. The
access token was read and used inside the browser context, never handled outside
it. The account ended in the state it started in — no active session, total
completed workouts unchanged at 41, since an aborted session does not count.

Caveat on those six images: they show a **freshly started** session with nothing
logged. A session mid-progress is visually much richer — completed sets, the
per-set "Last time" comparison, the progress bar, the rest timer. If Phase 4
targets this screen, capture that variant too.

Not captured, and deliberately left for a later pass:

- **The component and state shots** from `ui-restyle/capture-manifest.md` —
  dialogs, dropdowns, the mobile drawer, the rest timer, toasts. These need
  interaction, not navigation, and are better written once the Phase 2 direction
  says which of them matter.

### Phase 1 — UI Inventory

Complete. Read-only audit, no code modified. Inventory below.

### Phase 2 — Visual Exploration (Opus half)

Complete, in [ui-direction-opus.md](ui-direction-opus.md). Two directions, each
specifying all fourteen required dimensions with concrete values:

- **Direction A — "Quiet Authority."** Conservative. Same layout and identity,
  every value decided once: one gold, three radii, two shadows, a warmed neutral
  ramp, content capped at 1120 to kill the dead desktop margins.
- **Direction B — "The Ledger."** Stronger. Same routes, components and
  responsive contract, but the classical reference moves from decoration into
  structure: rules instead of cards, near-zero radii, Cinzel promoted to the
  masthead, and a persistent right rail at >=1280.

Both share the same colour roles, spacing base and motion principles, so A is a
clean retreat if B fails its proof of concept.

Recommendation recorded there: **B, with the active session screen as the Phase 4
proof of concept**, because it is the densest surface and the one where B's
boxless layout is most likely to fail. No implementation, no code touched.

### Phase 2 — Visual Exploration (Qwen half)

Complete, in [ui-direction-qwen.md](ui-direction-qwen.md). Independent — it
states it did not read the Opus document. Two directions:

- **Direction A — "Gilt Frame."** Conservative. Warm marble ground, one gold
  split into `gold-fill` / `gold-ink`, three radii, three declared `Card`
  variants, content capped at 1160. Its answer to 1280+ is **rest, not more**:
  one type step, one spacing step, no new columns.
- **Direction B — "Epigraph."** Stronger. Colour rationed to three meanings —
  stone for structure, **crimson for the user's actions**, gold for **earned
  honour only**. Cinzel becomes the display face and Bebas is demoted to
  numerals. De-boxed ruled lists, zero shadows, near-zero radii. Its answer to
  1280+ is the **open ledger**: ruled tables gain their final columns.

Qwen's independent contributions that Opus did not reach: the corner brackets as
the one ownable brand device, the four-competing-accents finding (gold, blue
stepper, orange Save, crimson heart), and the crimson-as-action / gold-as-honour
split that Phase 3 adopted.

### Phase 3 — Design System v0.1

Complete, in [ui-design-system.md](ui-design-system.md). One consolidated system
built from all four directions, with every conflict resolved explicitly rather
than blended. Colours (30 roles × 2 themes, oklch), typography, spacing, radii,
shadows, motion and responsive rules, each mapped onto `app/globals.css` —
`@theme inline` plus a `@layer components` utility layer. **No
`tailwind.config.ts`**, per the Do Not Revisit list.

Both correctness items in the brief are addressed: `--destructive-foreground`
(§2.1) and per-theme values for every role (§2.2, §4).

The 449-occurrence raw-class migration is mapped per family with an explicit
timing answer (§12) — summarised under Visual Decisions below.

No code changed. Read-only pass over `app/globals.css`, `app/layout.tsx`,
`components/ui/button.tsx` and aggregate greps across
`app components features hooks lib providers`.

### Phase 4 — Proof of Concept

Target: **the active session screen**, on which both explorations independently
agreed — densest surface, most interactive states, and the one where a boxless
layout fails first if it is going to.

Applied v0.1 to: the session page, `SessionHeader`, `SessionActionCard`,
`ExerciseGroup`, `SetLogInput`, `RestTimerBar`, `SessionConfirmationDialog` and
`SessionLoadingSkeleton`. Nothing else.

**How one section was restyled without restyling the app.** v0.1's palette lives
in `app/globals.css`, which is global, so a faithful application would have moved
every screen. Instead:

- New role tokens (`--action`, `--honour`, `--rule`, `--surface-sunk`, `--ink-2/3`,
  `--success`, `--warning`, `--scrim`, motion durations) are declared at `:root`
  and `.dark`. They are **additive and unconsumed elsewhere**, so they change no
  existing pixel.
- The *existing* shadcn tokens are re-valued only inside `.ds-v01`. Custom
  properties inherit, so `bg-card`, `text-muted-foreground` and `border-border`
  resolve to Stone/Night inside the wrapper and identically to before everywhere
  else. This is also how `--destructive-foreground` gets its §2.1 fix without a
  global change.
- `--radius: 6px` inside the scope re-points `rounded-sm`→2px and
  `rounded-md`→4px through the existing `calc()` derivation, confirming v0.1
  §7.1's claim that most of the radius migration is a token change.
- **No `components/ui/` primitive was edited.** Card/Button/Badge restyling is
  Phase 7; the POC achieves the look through `className` at the call sites.
- Two POC-only shims, both removed by Phase 8 batch 1: the `.ds-v01` scope
  itself, and a `-m-3 sm:-m-6` bleed that cancels the protected shell's own
  padding so the section reads as a page rather than a panel floating on the old
  ground.

**Structural changes.** Exercise groups stopped being `Card`s and became ruled
regions separated by `divide-rule-faint`, with a 3px left marker. Set rows became
`surface-sunk` wells with vertical `rule-faint` separators — one of the three
things v0.1 keeps boxed. The action card stayed boxed as the region's one call to
action. `Progress` was kept rather than replaced with a styled `div`, because the
Radix primitive carries the `progressbar` role and value that a div would drop.

**Captures.** `docs/ui-restyle/screenshots/after/` holds 60 route images plus four
`session-finish-dialog-*`. A new `session-full` capture target was added to
`e2e/capture-targets.ts` and taken in **both** sets, so Phase 5 has a true
like-for-like pair — see Visual Decisions. The frozen `before/` set was not
modified; `session-full-*` was added to it.

Measured, not eyeballed:

- **Density: −22%.** `session-full-1440-dark` went 4768px → 3728px for identical
  content.
- **No horizontal overflow** at 320/375/390/430/768/1024/1280/1440 in both
  themes, including the negative-margin bleed.
- **Every new utility emits.** Explicit `duration-[var(--motion-token)]` values resolve to
  0.12s/0.2s/0.3s and `ease-standard` to its curve, answering v0.1 §15 question 5.
  `.type-*` classes beat the global `h1`–`h4` Bebas rule on specificity, as §5.4
  predicted.

### Phase 5 — POC Visual QA

Delivered by GPT-5.6 Sol in [ui-poc-review-sol.md](ui-poc-review-sol.md): 15
prioritised issues, three P0. Read it before v1.0 — the design system's §16
answers every point but does not restate them.

The three P0s: crimson fails as the action colour; editable set fields lose their
affordance in light mode and behave differently per theme; light-mode supporting
text is not viable at the rendered sizes.

### Phase 6 — Design System v1.0 LOCKED

[ui-design-system.md](ui-design-system.md) is now v1.0. No code changed.

**What the proof of concept settled.** The *structural* direction survived and is
kept — Cinzel inscriptions, rules instead of card boxes, near-zero radii, stone
ground, tabular figures, −22% height on identical content, no overflow anywhere
from 320 to 1440. The *colour semantics* did not survive and are replaced.

**The headline change: crimson is no longer the action colour.** It was the
highest-risk decision in v0.1, flagged as such when taken, and two independent
sources rejected it — Phase 4 measured 16 crimson fills on a screen whose own rule
permitted one, and Phase 5 found the result read as "a page full of errors or
destructive controls". The primary control returns to **ink**, which is the
position Opus-A, Opus-B and Qwen-A all held; only Qwen-B proposed crimson. This is
not v0.1 §14's retreat, which would have moved the action colour to *gold* and
made the gold-saturation defect worse.

The four accents now have disjoint jobs, which is the root fix behind most of the
QA list:

| Role | Means | May be text |
| --- | --- | --- |
| `--primary` (ink) | The one control per region | — |
| `--success` | Done, as planned — all completion | yes |
| `--honour` (gold) | Better than planned — records, improvements | yes, max 2 per viewport |
| `--warning-strong` | Risk | **no** — mark only |
| `--destructive` (crimson) | Destroys data | yes |

**Token values are computed, not guessed.** With the dev server down (see
Findings 24) the oklch→sRGB transform was implemented offline and validated
against Phase 4's browser measurements — it reproduced them to within 0.02
(2.56 vs 2.55, 3.45 vs 3.44, 1.17 vs 1.17). Every role was then solved against the
exact backdrops it sits on. All text roles clear WCAG AA 4.5:1 in **both** themes;
all marks clear 3:1. v0.1's light mode failed at 2.55–3.92.

**One measurement changed the design rather than the values.** Gold and amber are
ΔEok 0.054–0.109 apart and converge to a distance of 3.6–16.7 (of 100) under
simulated deuteranopia — no pair of values separates them, and staggering
lightness helped dark while hurting light. So `--warning-strong` was demoted to a
non-text role carried by icon plus rule, removing the collision instead of tuning
it. That is the substantive answer to QA 4, which asked only for "a usable
semantic hierarchy".

**Dispositions: 14 accepted, 1 rejected.** The full log with reasons is design
system §16. The rejection is QA 14 (mobile loses elapsed-time precision):
`formatDuration` omits seconds only when they are zero, is width-independent and
untouched by the restyle — the 390 capture landed on a minute boundary while the
768 capture of the same screen reads "115h 10m 17s". The underlying issue it
points at is real and was accepted separately: a live value whose string length
changes shifts its neighbours, so durations now render in a fixed-width mono slot.

Two accepted points were sharpened by checking rather than taken at face value:

- **QA 5 understated the regression.** Verified in the frozen captures that 768
  truncates the title to "UPPER /…" — worse than the 390 case the review cited —
  because the summary columns appear at `sm` while the container is still narrow.
- **QA 13's specific observation could not be reproduced.** In the Phase 4 code
  every completed group carries the identical class, so a unique full-height
  marker should not be possible. Its substance was accepted anyway (a mark on
  every group carries no information) and recorded as unreproduced rather than
  silently agreed.

### Phase 7 — Shared Primitives

**1. The token block landed globally.** `app/globals.css` now carries the v1.0
palette at `:root` and `.dark` rather than inside the Phase 4 `.ds-v01` wrapper.
The wrapper and the `-m-3 sm:-m-6` shell bleed are both gone: they were
proof-of-concept shims, and leaving `.ds-v01` in place would have been actively
wrong, since it still held v0.1's values and would have overridden v1.0 on the
one screen that mattered most.

Also landed: the radius block (explicit `0/2/4/4/4`, `--radius` retired), the
`@layer components` utilities at v1.0 sizes, `--field-max` / `--cluster-max`,
and a **global** reduced-motion block (it was scoped to the POC).

Three things v1.0 §11.3 says to delete were **kept**, deliberately:

- **`--ss-gold`, `--ss-crimson`, `--ss-bronze` and their `-2` variants** are
  still declared, but now alias v1.0 roles instead of hex literals. Five files
  still read them (`StatCard`, `Sidebar`, `classical-loader`, `progress`,
  and until this phase `button`/`badge`). Deleting them would make
  `var(--ss-gold)` invalid at computed-value time — silently, which is this
  project's recurring failure mode. Aliasing means those consumers pick up the
  new palette now and the declarations die with their last consumer.
- **`.bg-marble-light`** is still declared because `Sidebar` reads it. `Card` and
  `Button` stopped using it in this phase.
- **`.text-gold` / `.border-gold`** were deleted — grep confirmed zero consumers.

**2. Fourteen primitives restyled**, public APIs and behaviour unchanged:

| Primitive | The substantive change |
| --- | --- |
| `button` | Primary is **ink**, not crimson. `destructive` is an outline by default with a new `destructiveSolid` for controls that actually destroy data. Heights 36/40/44. Three variants retired |
| `input`, `textarea`, `select` | **Visible resting boundary in both themes** (§11.6), reversing v0.1. The old base carried `dark:bg-input/30` with no light equivalent, which is why one component had two models |
| `checkbox` | Checked is `--success-strong`, not the primary colour: a repeated list control is never the region's action (§4.3 rule 1) |
| `card` | `panel`: surface, 2px radius, 1px rule, **no** gold-tinted gradient, marble wash or drop shadow |
| `badge` | `classical` retired; `success` and `honour` added; destructive is an outline |
| `dialog` | Inset at every width, one left reading axis, `--scrim` overlay, `shadow-overlay` in light and none in dark |
| `dropdown-menu` | Destructive items now use `--destructive`, not `--destructive-foreground` — that is the ON-colour, so the old rule would have rendered them near-invisible once §2.1 was fixed |
| `separator`, `skeleton`, `label`, `avatar`, `tooltip` | Token and radius alignment |

**3. Three retired `button` variants, 15 call sites converted.** `classical`,
`bronze` and `marble` are gone; every `variant="classical"` became `default`
(they were all primary actions) except one `Badge`, which became `honour`.
**`npm run typecheck` is the proof this is complete**: `variant` is typed by
`VariantProps<typeof buttonVariants>`, so a surviving `"classical"` would be a
type error. This is call-site editing in Phase 7 on purpose — v1.0 §11.4 requires
it in the same commit, because a variant name that silently falls through to
`default` is a correctness bug, not a styling one.

**4. The Phase 4 POC screen was moved off v0.1 tokens.** ~30 mechanical class
swaps across the 8 session-screen files: `bg-action`→`bg-primary`,
`text-on-action`→`text-primary-foreground`, `marker-honour`→`mark-success`,
`text-warning`→`text-ink-2` (warning has no text grade in v1.0). This is **not**
the Phase 8 restyle of that screen — its composition gaps (the action panel, the
masthead wrap, field caps, micro-caps inside rows) are still open and listed in
v1.0 §14. It was required because the tokens those classes referenced no longer
exist.

**Verification.** The v1.0 §15 gates were run, not assumed:

- **Gate 1, compiled stylesheet.** Forced a real recompile and fetched the served
  CSS: `type-body-sm`, `mark-success`, `duration-slot`, `bg-surface-sunk`,
  `text-ink-3`, `bg-success-strong`, `border-warning-strong`, `shadow-overlay`,
  `ease-standard` and `bg-scrim` all present; `ds-v01` and the old `--ss-*` hexes
  absent.
- **Gate 2, contrast re-measured in the browser, both themes.** Every text role
  clears 4.5:1 and every mark clears 3:1, with a maximum drift of **0.07** from
  the values Phase 6 computed offline. `--destructive-foreground` no longer
  equals `--destructive` — §2.1 confirmed fixed in the running app.

| | light | dark | needs |
| --- | --- | --- | --- |
| `ink` / `ink-2` / `ink-3` | 12.09 / 6.72 / 4.73 | 15.11 / 9.28 / 5.36 | 4.5 |
| `success` / `honour` / `destructive` | 4.54 / 5.28 / 4.85 | 9.20 / 9.62 / 5.41 | 4.5 |
| `*-strong` marks | 3.19 / 3.18 / 3.53 | 8.14 / 11.03 / 8.06 | 3.0 |
| on-primary / on-destructive | 15.56 / 6.24 | 16.39 / 5.86 | 4.5 |

- **Gate 3, both themes** — done for the measurements above and the login page.

**Not verified, and why.** The authenticated screens have no visual check this
phase: `.auth/state.json` has expired, so a capture run lands on `/login`. The
public login page was checked live in light mode and renders correctly — visible
field boundaries, ink primary, outline secondary, body-small labels. Re-running
`npm run ui:login` unblocks the rest, and Phase 8 captures per batch anyway.

### Phase 8 — Batch 1: shell (sidebar, header, page headers)

Applied v1.0 §11.10 and §11.11. **Verified** — before/after compared at
390/768/1440 in both themes, plus an 80-check responsive sweep.

**Sidebar** — the last consumer of two things v1.0 retires, so this batch was
the one that could finally remove them:

- Ground-coloured index column with a single `--rule` right edge. The marble
  wash, the gold hex borders, the `backdrop-blur` and the `shadow-lg` are gone,
  along with the decorative gold gradient rail (§4.3 rule 6 — no gradients).
- **Active item is no longer a filled slab.** It is a 3px `--honour-strong` left
  mark plus ink text at 600 and a `--surface` fill; hover is the same geometry in
  a different colour, which is what §11.10 asks for. The light black slab and
  dark ivory slab — "the heaviest object on every screen" — both retire.
- Item height 36px desktop. **44px on mobile**, because the sidebar is a touch
  drawer there; §11.6 already sets 40/44 for inputs on exactly that reasoning, so
  this follows an established rule rather than inventing one.
- `SOON` is now the bare word at 10px tracked `--ink-3`, no border box. The
  `Badge` import went with it.
- The wordmark stopped being an inline style with a literal font family and
  became `.type-wordmark`.
- The label's `translate-x-1` on hover is gone: §9.2 says hover changes colour
  only.

**Header** — 56 mobile / 64 desktop, ground-coloured, one rule below, opaque
rather than blurred. The framing `OrnateCorners` are retired and the gold
brackets moved onto the page title instead, which is the one pair per screen
§11.11 allows.

**Page headers** — `HeroSection` was the photographic hero on five pages. §1.4
retires the photograph, the parchment and vignette overlays and the framing
corners; it is now a typographic masthead: `.type-page` over a `.rule-heading`
double rule with the corner brackets, subtitle in `--ink-2` capped at 68ch.

`imageSrc`, `overlayGradient` and `blurPx` were **removed from the props**, not
accepted-and-ignored, and the five call sites updated. The three `loading.tsx`
hero skeletons were rebuilt to mirror the new masthead — otherwise first paint
would have shown a photographic band that the loaded page no longer has.
`HeroBackdrop` now has no consumers outside its own file.

**Protected layout** — the ground is one flat `--background`; the gold mesh
gradient and the parchment overlay are gone. The mobile drawer scrim uses
`--scrim`. The two auth-transition shells (cleanup and loading) were moved onto
tokens as well, since they are the first thing a signed-out visitor sees.

**Regressions found in the comparison, and fixed.** All five were mine:

1. **Nav items rendered uppercase.** They are `<Button>`s, so they inherited
   `type-button` (Oswald 600 UPPER) from Phase 7. §11.10 gives nav items their own
   rank — Oswald 500 at 14px — and §5.3 reserves tracked uppercase for buttons and
   region captions. Rendering a nav link as a Button must not change its type;
   fixed with `normal-case tracking-normal`.
2. **The dashboard masthead was centred** while everything under it was
   left-aligned — a hangover from the photo band, against §11.9's one reading
   axis. The call-site override was removed.
3. **The topbar title truncated at every width**, even "Routines". `w-48` was
   sized for condensed Bebas; Cinzel at the same size is wider. Now capped at
   18rem and shrinkable — pinning it with `shrink-0` overflowed the header row at
   768, which was the first fix attempt and had to be undone.
4. **The topbar's corner brackets were invisible.** `truncate` is
   `overflow: hidden`, which clips the pseudo-elements, so they rendered as
   nothing. Removed rather than un-clipped: §11.11 allows one pair per screen and
   the masthead already carries it.
5. **Horizontal overflow at 768 and at 320.** Both **pre-existing** — measured on
   a fully stashed tree at 890px against a 768px viewport, and 324px against 320 —
   but this batch made the 768 case worse, so both were fixed here:
   - The shell's main column is `flex-1` inside a viewport-wide flex row **and**
     carries `ml-64` for a `fixed` sidebar that takes no flow width. Without
     `min-w-0` it keeps a full-viewport basis and the margin pushes the document
     past the edge. One class, and 768–1023 is now correct for the first time.
   - `ActivityItem` had a non-wrapping badge row in a column with no `min-w-0`.
     Three metric badges never fit 320px even before v1.0; the uppercase label
     rank widened them. `flex-wrap` + `min-w-0`.

**A Phase 7 defect, found and fixed here.** `set-log-input.tsx` was overriding
the checkbox fill with `bg-primary` where the primitive correctly says
`bg-success-strong`. Cause: my Phase 7 migration ran the substitution
`bg-action` → `bg-primary` **before** the more specific
`data-[state=checked]:bg-action` → `data-[state=checked]:bg-success-strong`, so
the specific pattern never matched. Checked sets were rendering ink instead of
green, contradicting §4.3 rule 2 — and I reported that primitive as done in the
Phase 7 summary, which was wrong. The call site now sets only size and the
save-state ring; the fill comes from the primitive. **Ordering matters in a
find-and-replace migration: put the most specific pattern first.**

### Phase 8 — Batch 2: cards, lists, results

Applied v1.0 §11.5, §11.12, §10.1 and §10.2. **Verified** — before/after compared
at 390/768/1440 in both themes, an 80-check responsive sweep, and contrast
measured on rendered nodes.

**The dashboard stat tiles were the batch's headline violation, and are fixed.**
Six gold header pills and six gold gradient progress bars meant gold marked six
ordinary numbers — §4.3 rule 3 caps honour at **two marks per viewport** and
reserves it for "better than planned". A milestone bar is progress, not honour.
The tiles are now one ruled band (§10.1): no card boxes, no gold, `.type-label`
captions, `.type-numeral` values, and a hairline milestone bar in `--ink-2`.

The band's 1px grid lines are the container's own ground showing through a
`gap-px`, with each cell painting `bg-background`. That was chosen over per-cell
borders because a 2-or-3 column grid cannot express "rule between rows and
columns, none on the outside" without first/last-child bookkeeping that breaks
whenever the column count changes.

**`RecentActivity`, `PersonalRecords`, `WorkoutsList`/`RoutineCard`, the workout
history list and the search results are all `ruled` now** — the §11.5 default:
no fill, no box, a section heading over `.rule-heading`, `.rule-row` between
items. Every one of them was a card containing cards.

Two consequences worth recording:

- **`showSeparator` kept its meaning but changed its mechanism.** It used to
  mount a `<Separator />` element; it now paints a `border-b`. The prop, the
  `index < length - 1` call sites and the component API are untouched, so this is
  a styling change, not a structural one.
- **Read-only data lost its boxes.** §11.12 reserves a bounded box for editable
  fields, so the three metric badges per activity row, the record weight badge,
  the routine day-of-week badge strip and the frequency badges all became Space
  Mono runs separated by middots. That is also what §10 asks a ledger row to
  collapse to below 640 — which is why `ActivityItem` no longer needs the
  `flex-wrap` + `min-w-0` workaround Batch 1 added for 320px. **The workaround
  was removed together with the thing it worked around.**

**Colour corrections, each against a specific rule:**

| Was | Now | Rule |
| --- | --- | --- |
| Gold pill + gold gradient bar on 6 stat tiles | `--ink-3` caption, `--ink-2` bar | §4.3 rule 3 |
| `Badge variant="honour"` on today's weekday | `outline` | §4.3 rule 3 — a scheduled day is not an achievement |
| `yellow-500` left border + `yellow-50/30` tint on the active routine | `.mark` + `border-l-primary`, no fill | §11.12 — status is a mark, not a fill |
| `emerald-600` completed toggle | `--success` when set, `--ink-3` when not | §4.3 rule 2 |
| `rose-500` favourite heart | `--foreground` when set, `--ink-3` when not | §4.3 rule 5 — crimson means only destruction |
| `amber-600` "Next session · Today" | `--foreground` | Today is neither completion nor honour |
| `emerald-600` "Completed" note | `--success` | §4.3 rule 2 |
| `text-amber-500` spinner on `/workouts` | `--ink-3` | Decoration is never a semantic colour |
| Gold arc + gold wreath in `ClassicalLoader` | `--foreground` arc, `--ink-3` wreath | §4.3 rule 3 — honour is "never decoration" |

**`ClassicalLoader` losing its gold is the one place this batch traded brand for
the rule**, and it is worth flagging rather than burying: the gold arc orbiting a
laurel wreath was a recognisable device. §4.3 rule 3 is unambiguous ("never
completion, never status, never decoration") and a spinner marks nothing, so the
rule won. Putting the gold back is a v1.0 amendment, not an implementation
choice — see Known Issues.

**`--ss-*` and `.bg-marble-light` are deleted.** `StatCard` was the last
`--ss-gold` call site, `progress`'s `gold` variant the last gradient consumer,
and `classical-loader` the last `rgba(218,165,32,…)` literal in the app. All
three migrated here, so the six aliases and the marble utility came out of
`globals.css` in the same commit — confirmed absent from the **served**
stylesheet, not just the source. `progress`'s `variant` prop went with them: a
primitive that keeps a variant name nothing sets is how a silent fall-through
starts.

**`OrnateCorners` now has zero importers.** `HeroCard` was its last consumer and
this batch retired its gradient fill, its shadow and its frame. `HeroCard` and
`WorkoutItem` have zero importers themselves; both were restyled onto tokens
rather than deleted, because deletion is Phase 15's call and leaving an
off-palette component behind is worse either way.

**§10.1's `xl` behaviour, implemented and then partly overruled by measurement.**
The history ledger gains right-aligned mono duration and volume columns at `xl`,
as written. The dashboard stat band does **not** open to six columns, and its
third column arrives at `lg` rather than `sm` — both for the same measured
reason, recorded in Findings 34.

**Two page-level corrections that came with the batch:**

- The dashboard's `animate-in fade-in slide-in-from-bottom-2 duration-500`
  wrapper is gone (§9.2 — no page-level entrance animation), as is the search
  results' per-card framer-motion stagger, hover scale, hover gradient wash and
  shadow lift. `framer-motion` is still a dependency; `InitialLoadAnimation` is
  now its only consumer.
- The `Welcome back` heading's inline `style={{ fontFamily: … }}` is gone. It was
  a 30px rank that does not exist in §5.2, sitting directly under a 32px Cinzel
  masthead; it is `.type-panel` now. Region rhythm moved onto the §6 scale
  (32/48) at the same time.

**Regressions found in the comparison, and fixed.** Both were mine:

1. **Horizontal overflow at 768 on the dashboard, in both themes** — the only
   failure in 80 checks. Findings 34.
2. **The milestone bar read as a rule, not a bar.** The `Progress` primitive's
   default track is `--surface-sunk`, which is a well against `--surface`; the
   stat cell paints `--background`, where a sunken well is nearly invisible
   (measured 1.35:1). At 100% the bar was indistinguishable from the row rule
   above it. That call site sets a `--rule-faint` track and 4px rather than 2px.

**One §10.2 violation caught in the after-shots, not the sweep.** At 1440 the
routine card's schedule note put "Next session" at the far left of a 1120px row
and "Today" at the far right — QA 7's exact failure, which no overflow check can
see because nothing overflows. The data cluster is capped at `--cluster-max`
(480px). The routines page's empty spacer `<div />`, which held a band of dead
space open opposite the Create Routine button, went at the same time.

### Phase 8 — Batch 3: forms, search, filters

Applied v1.0 §11.6, §11.12, §12.1 and §10.2. **Verified** — before/after compared
at 390/768/1440 in both themes, an 80-check responsive sweep over the batch's own
routes, and contrast measured on rendered nodes.

**The settings page was the loudest surface left in the app**, and none of it was
on the palette: two panels bordered `amber-500/20` over a translucent `bg-card/50`
with `backdrop-blur-sm` and an amber-tinted `shadow-xl`, an amber avatar ring and
fallback, an amber map pin, and a **filled orange gradient submit button that grew
on hover**. §4.3 rule 6 retires the gradient, rule 1 makes the region's one
primary control a plain ink fill, §8 removes the shadow and §9.2 removes the
scale. The page now reads as the same application as the rest of the app.

**The stepper carried the largest raw-palette cluster left** — 22 classes across
`blue-*`, `green-*` and `gray-*`. §12.1 maps them by meaning:

| Step state | Was | Now |
| --- | --- | --- |
| Completed | `border-green-500 bg-green-500 text-white` | `--success` fill, `--background` glyph (§4.3 rule 2) |
| Current | `border-blue-500 bg-blue-50 text-blue-600` | 2px `--primary` border on `--surface`, ink text |
| Visited | `border-blue-400 bg-blue-100 text-blue-700` | 1px `--rule` on `--surface`, `--ink-2` |
| Unreached | `border-gray-300 bg-gray-50 text-gray-400` | `--ink-3` on `--surface-sunk` (§4.3 rule 7) |
| Connector | `bg-green-500` / `bg-blue-500` / `bg-gray-300` | `--success` / `--rule` / `--rule-faint` |

**The current step is an outline, not a fill.** §4.3 rule 1 allows one filled
`--primary` per region and the wizard's is the Next button; a filled ink marker
would have made "where you are" compete with "what to press". The markers are
also square — §7 keeps `rounded-full` for avatars.

**Every editable control now has the boundary §11.6 requires.** The three native
`<select>`s in the history filters were `h-9 rounded-md border bg-background
shadow-sm`, 14px, on a ground the `Input` primitive never uses; they share one
`SELECT_CLASS` matching `Input` exactly — 44px below `md`, 40px above, **16px text
below `md`**, which is the iOS zoom-on-focus mitigation (§2.4) and mattered most
on the control most likely to be tapped first. They stay native: swapping them for
Radix `Select` is a markup and event change, not a styling one.

The search field lost its pill shape, its translucent fill and its
`--primary`-tinted border and ring — it was the one control in the app that did
not look like the others. Its dropdown lost `backdrop-blur-md` and `shadow-lg` for
`--shadow-overlay` in light and a `--rule` in dark (§8).

**Colour corrections, each against a specific rule:**

| Was | Now | Rule |
| --- | --- | --- |
| Orange gradient "Save Changes" fill, growing on hover | Ink fill, colour-only hover | §4.3 rule 6, §9.2 |
| `amber-500/20` panel borders + `bg-card/50` + blur + amber shadow | `panel` — surface, 1px rule, no shadow | §11.5, §8 |
| Amber avatar ring, amber fallback tint | `--rule` border, `--surface-sunk` fill | §4.3 rule 3 |
| `bg-black/60 text-white` avatar upload scrim | `bg-foreground/70 text-background` | Fixed to one theme; the tonal pair inverts |
| Amber map pin, `text-amber-500` loader | `--ink-3` | Decoration is never a semantic colour |
| `accent-amber-500` zoom slider, blue native radio | `accent-[color:var(--primary)]` | §4.3 rule 1 |
| `text-destructive` on the required-field `*` | `--ink-3` | §4.3 rule 5 — crimson means only destruction |
| `text-green-500` review checkmarks | `--success` | §4.3 rule 2 |
| `bg-blue-500` locked-day dot | `--warning-strong`, square | §4.3 rule 4 — a constraint is a mark |
| `text-yellow-500` note glyph | `--foreground` / `--ink-3` | See below |

**One deliberate departure from §12.1's migration table.** It maps `yellow-*`
mechanically to `--warning-strong`, but the note glyph in `ExerciseNoteRow` marks
*presence of a note*, not risk — and §4.3 rule 4 scopes `--warning-strong` to
risk. Presence is carried by ink versus muted ink instead. **§4.3's invariants
outrank §12's convenience table when they disagree**; the table exists to make the
common case fast, not to override the rules it is implementing.

**Three translucent bands went opaque**, following Batch 1's topbar: the wizard's
sticky footer and both step bands were `bg-background/80 backdrop-blur
supports-[backdrop-filter]:bg-background/60`. Nothing in v1.0 is translucent, and
a blur costs a composite per frame to reveal a flat ground. The edit page's band
stays `sticky top-0` inside the shell's own scroll container, which is where it
has to be.

**§10.2 enforcement, which the overflow sweep cannot see.** Four controls were
stretching to fill space rather than to fit content: Age/Weight/Height and the
plate/bar-weight fields (up to 580px for a two-digit number) now cap at
`--field-max` (96px); the routine-name field and the two date fields cap at
`--cluster-max` (480px); and the filter panel's "Apply" button, which spanned half
the panel at 1440, is `w-full sm:w-auto`.

**Regressions found in the comparison, and fixed:**

1. **Horizontal overflow at 768 on `/routines/new`**, both themes — the only
   failure in 80 checks. Findings 39.
2. **The settings avatar panel stretched to the height of the form beside it**,
   leaving a ~500px empty box at 1440. `items-start` on the grid.
3. **The native "Default" radio kept the browser's blue accent** — the last
   off-palette colour on the page after everything else moved.

**A fourth silent no-op found and removed.** The settings page root carried
`slide-in-bottom`, which is defined nowhere in the stylesheet — confirmed absent
from the served CSS. It emitted nothing and raised nothing, the same failure class
as `honour-bright` (Findings 36) and `xs:` (TD-28/29). §9.2 forbids a page-level
entrance animation anyway, so it was deleted rather than defined.

**Four new capture targets.** The filter panel is the batch's main surface and no
route screenshot opens it, so `history-filters-{390,1440}-{light,dark}.png` were
captured by driving the disclosure button. A batch whose primary surface is only
reachable through interaction needs its own captures, or it ships unreviewed.

### Phase 8 — Batch 4: menus, dropdowns, modals

Applied v1.0 §11.9, §11.12, §8 and §9.2. **Verified** — eight new interaction
captures of the open menu and the open dialog at 390/1440 in both themes, an
overflow sweep with the overlays *open*, and contrast measured on the real
rendered dialog rather than on a probe element.

**`alert-dialog` had not been touched since the project started.** It was the
last primitive still on the shadcn defaults, and every confirmation in the app
goes through it:

| Was | Now | Rule |
| --- | --- | --- |
| `bg-black/50` overlay | `--scrim` | §4.2 sets the scrim per theme (0.42 / 0.62); `black/50` ignored both |
| `bg-background`, `rounded-lg`, `shadow-lg` | `--popover`, 4px, `--shadow-overlay` light / none dark | §8, §7 |
| `text-lg font-semibold` title | `.type-section` | It rendered through the global `h1`–`h4` Bebas rule (§5.5), so every confirmation read as a poster headline |
| `text-center sm:text-left` header | `text-left` | §11.9 — one reading axis. Header centred below `sm` while body and actions stayed left |
| Footer with no width rule | `[&>*]:w-full sm:[&>*]:w-auto` | §11.9 — when stacked, both full width |
| `duration-200` | `--motion-slow` | §9 |

It now matches `dialog` line for line, which is the point: two dialog primitives
with two different models is how QA 2 happened.

**The toast stopped being five different components.** Each variant was a tinted
card — `bg-emerald-50/90`, `bg-red-50/90`, `bg-amber-50/90`, `bg-sky-50/90`,
`bg-white/80` — with its own border, its own text colour and a matching accent
bar, all behind `backdrop-blur-md` and `shadow-lg`. §11.12 says status is a mark
plus a glyph with **no fill**, so every variant now sits on the same `--popover`
overlay surface and differs by a `.mark` left rule and its icon.

**`info` and `default` deliberately take no mark colour.** The palette has no
role for "neutral information" and inventing one would be a sixth accent; they
keep `.mark`'s transparent rule and are told apart by their glyph, which §4.3
rule 8 already requires of every state. The `sky-*` family leaves the codebase
with them.

**A dismiss control that was invisible for its whole life.** The toast's close
button carried `opacity-0 group-hover:opacity-100`, but no ancestor had the
`group` class — so `group-hover:` never matched and the button was permanently
`opacity-0`. It was still clickable, so nothing ever failed loudly. Fixed by
adding `group` to the container, and `focus-visible:opacity-100` so keyboard
users can see it at all.

**The last hardcoded gold in the app.** `loading-overlay` held `#FFD700` and
`#B8860B` in a bespoke spinner, inside a gradient card on an inverted
`bg-black/40 dark:bg-white/40` scrim — which flashed *white* over the dark theme.
It is `--scrim` plus a panel now, using `ClassicalLoader` rather than a second
spinner.

**One of the two live `honour-bright` references is closed** (Findings 36).
`session-confirmation-dialog.tsx:127` used it as a border colour on the
"complete session" callout; since it is not a token it emitted nothing and the
border silently fell back to the global `border-border`. The callout is
`.mark mark-success` now — completion is `--success` (§4.3 rule 2), which is
also what §14 says that screen owes. Its three callouts share the `.mark`
geometry instead of three ad-hoc left borders.

**Colour corrections at the call sites:**

| Was | Now | Rule |
| --- | --- | --- |
| `text-honour` on complete-session glyph and figure | `--success` | §4.3 rule 2 — gold is not completion |
| `text-amber-600` stale-session warning glyph | `--warning-strong` | §4.3 rule 4 |
| `bg-emerald-500/15` medallion, `text-emerald-700` figures | `--surface-sunk` well, `--honour` figure | An improved prescription genuinely *is* "better than planned" — the one place rule 3 applies on that screen |
| `bg-muted/30` / `bg-muted/40` / `bg-background` blocks | `--surface-sunk`, square | §8 — a well is a tonal step, not an opacity |
| `border-destructive/30 bg-destructive/5` warning block | `.mark border-l-destructive` on a well | §11.12 — a mark, not a tinted fill |
| `text-amber-700` plate-calculator note | `--ink-2` | Decoration is never a semantic colour |

**§11.9's action order, applied to the recovery dialog.** `AlertDialogFooter`
carried `sm:grid sm:grid-cols-3`, which gave Discard, Finish and Resume equal
weight and put *destruction first* in the reading order. It uses the default
footer now: one row, primary last.

**`popover` and the dropdown separator brought in line** — `shadow-md` and a bare
`border` became `--shadow-overlay` / `--rule`, and `bg-border` became
`--rule-faint` to match `select`. `popover` still has zero importers and stays a
Phase 15 deletion candidate; it was fixed anyway because a primitive left on the
wrong pattern is a wrong reference for the next person who reaches for it.

**Also stated explicitly rather than left to luck:** the routine-delete action
sets `text-destructive-foreground` on its crimson fill. It was inheriting
`--primary-foreground`, which happens to equal `--destructive-foreground` in both
themes today — §2.1 is the record of exactly that coincidence failing.

**No regression found in the comparison**, and no overflow in 32 checks with the
menu and the dialog open at all eight widths in both themes.

**What was verified by code and served CSS rather than by capture**, and why:
`toast`, `loading-overlay` and the three session dialogs are all reachable only
by mutating the owner's data — sending a real toast means submitting a real form,
and the session dialogs need a live workout. Their utilities were confirmed
present in the served stylesheet and their markup reviewed against §11.9. They
remain the strongest argument for building the component/state captures in
`ui-restyle/capture-manifest.md`.

### Phase 9 — Responsive QA

**144 checks** — 9 routes x 8 widths x 2 themes — measured in the browser rather
than reviewed by eye, plus a separate layout-signature pass to answer the two
audit predictions with data.

**Result: zero horizontal overflow, zero clipped content, zero unreachable
content.** Four defects were found and corrected; two more were investigated and
proved to be measurement artefacts rather than defects.

#### How it was measured

A scripted probe per route/width/theme, reporting: elements extending past the
viewport (measured on the shell's real scroll container, not the document, which
never grows); text clipped by `overflow:hidden`/`ellipsis` where `scrollWidth`
exceeds `clientWidth`; interactive elements under 24px below `md`; and geometric
intersection between `position:fixed` elements and page text.

Separately, a **layout signature** per width — every visible element's tag,
class, `display`, `flex-direction`, column count, `font-size`, `position` and
`text-align`, sorted, with pixel widths deliberately excluded so a fluid resize
does not register as a change. Comparing signatures answers "does any breakpoint
rule actually fire between these two widths" exactly, which is what both
predictions are really asking.

#### Prediction 1 — CONFIRMED

**320, 375, 390 and 430 are byte-identical in layout signature on all eight
routes, in both themes.** Nothing changes until **640** (`sm`), and even then two
routes — `search` and `workouts` — do not change at all, because neither has an
`sm:` rule that alters layout.

This is §10.3's `sm`/`md` cliff, measured rather than assumed: 290 `sm:` sites
against 51 `md:` and 26 `lg:`. Per the Do Not Revisit list it is **recorded, not
fixed** — redistributing those sites is a layout rewrite, not a restyle.

#### Prediction 2 — REFUTED, in exactly one place, on purpose

1024, 1280 and 1440 are identical on **seven of eight** routes. The exception is
`/workouts/history`, which differs at both 1280 and 1440 — the `xl:text-right`
Batch 2 added so the ledger's duration and volume become right-aligned mono
columns (§10.1's "open ledger").

So the audit was right about the pre-restyle app, and the restyle changed it in
precisely the one place v1.0 asked for and nowhere else. **`xl:` still fires on
one route only**; §10.1's other promises — the stat row as a single band, type
stepping at `xl` — were deliberately not implemented, because both were measured
to overflow (Findings 34).

#### Defects found and corrected

**1. The settings form collapsed to unreadable field widths at 768.** The
two-column split (`md:grid-cols-[1fr_2fr]`) and the field rows (`sm:grid-cols-3`,
`md:grid-cols-2`) all fired while the shell's main column was only **512px**, so
the form ended up ~212px wide with three ~60px cells. The Weight Unit select
rendered as **"Ki ⌄"** — its value box was 10px holding 89px of text.

All four grids now step at `lg`, and the three-across weight row at `xl`:
measured, that row needs ~179px per cell and gets 127px at 1024 but 166px at
1280. Verified `lost: 0` at all seven widths afterwards.

**This is the third instance of the same root cause** (Findings 34, 39): a
breakpoint firing at a viewport width where the shell has not given the main
column comparable room. `md:` means 768 viewport, which is a **512px** content
column here.

**2. `/routines` list content was unreachable behind the mobile FAB.** The
scrolling list reserved no space for the `fixed` "+ NEW" button, so at the bottom
of the scroll the last card sat under it at every width below `sm`. The list
reserves 96px below `sm` now; overlap at the end of the scroll went 3 → 0.

**3. The dashboard stat label was truncated at 320.** "Weekly Workouts" needed
102px in a 100px box, so `truncate` — added in Batch 2 to prevent overflow — cost
a letter to save 2px. It wraps instead; a caption that loses a word is worse than
one that takes two lines.

**4. `settings` first/last name row was a hard `grid-cols-2` at every width**,
including 320. Now `grid-cols-1 sm:grid-cols-2`.

#### Investigated, and NOT defects

- **The "Default" radio measured 13x13px.** The probe measures the `<input>`, but
  the input is wrapped by its `<label>`, which is **81x44px** — the real hit
  target, and exactly the §11.6 mobile height. Confirmed the label contains the
  input, so clicking anywhere in it toggles. No change made.
- **The FAB overlaps list text mid-scroll.** It still does, and that is what a
  floating action button is. The defect was content being *unreachable* at the
  end of the list, which is fixed. Moving the action out of the viewport
  altogether would be a layout/behavioural change, so it is reported, not fixed.
- **171 "clipped" hits on `.sr-only`.** Screen-reader-only text is clipped to 1px
  by design. Excluded from the analysis, noted so the next sweep does not
  re-investigate it.

## UI Inventory

### 1. Shared primitives

31 files in `components/ui/`, shadcn/ui `new-york` style over Radix. Usage counts
are files importing each primitive:

| Primitive | Files | Notes |
| --- | --- | --- |
| `button` | 50 | Only primitive with meaningful brand variants |
| `card` | 26 | The dominant surface; no variants, styled ad hoc at each call site |
| `badge` | 24 | Has `cva`, used heavily for status |
| `skeleton` | 11 | Loading states are widespread and hand-composed |
| `input` | 10 | Sets 16px on mobile deliberately, to stop iOS zoom |
| `label` | 8 | |
| `toast`, `separator`, `avatar` | 5 each | |
| `tooltip`, `dialog` | 4 each | |
| `select` | 3 | |
| `textarea`, `progress`, `dropdown-menu`, `accordion` | 2 each | |
| `tabs`, `scroll-area`, `checkbox` | 1 each | |
| `popover`, `alert` | 0 | Present but unused — candidates for Phase 15 |

Non-shadcn local primitives: `classical-loader`, `loading-overlay`, `search-bar`,
`stepper`, `top-loading-bar`, `top-progress-bar`, `image-cropper`.

**Only three primitives carry `cva` variants: `button`, `badge`, `alert`.**
Everything else is styled per call site. `button` is the one place the brand is
actually systematised, with `classical` (gold gradient), `bronze` and `marble`
variants beside the six shadcn defaults.

### 2. Repeated visual patterns

- **The "glass card"**: `bg-card/50` or `bg-card/30` + `backdrop-blur-sm` +
  `border-border/40` or `/50` + `shadow-sm`. Repeated across profile (7×),
  settings, dashboard cards, search and the wizard. This is the app's real
  surface treatment and it exists only as a copied class string, not a variant.
- **Decorative overlay layer**: `components/backgrounds/` holds
  `GoldVignetteOverlay`, `HeroBackdrop`, `OrnateCorners`, `ParchmentOverlay`,
  plus `components/layout/HeroSection` and `components/icons/ClassicalIcon`.
- **Gradient accents**: 36 `bg-gradient-to-*` usages, mostly `-r` (14) and
  `-br` (12), typically gold or a fade to transparent.
- **Icon + label + value stat card**, repeated across dashboard and profile with
  an oversized watermark icon at 3–10% opacity.
- **Skeleton blocks** hand-composed per screen rather than shared per shape.

### 3. Styling architecture

Tailwind CSS v4, CSS-first. `app/globals.css` is 213 lines and is the only
styling configuration; there is no `tailwind.config.ts` and none may be added.

- `@theme inline` maps ~35 `--color-*` and 4 `--radius-*` tokens onto CSS
  variables.
- `:root` and `.dark` define the shadcn palette in `oklch`.
- `@custom-variant dark (&:is(.dark *))` — dark is **class-based**, not
  media-query based. Relevant to how screenshots must be taken.
- `@layer base` holds heading typography, `.text-gold`, `.border-gold`,
  `.bg-marble-light`, and a global cursor policy on interactive elements.
- `.hide-scrollbar` sits outside any layer.

Fonts, all via `next/font/google`: **Bebas Neue** (headings, `h1`–`h4` and
`.heading-classical`, uppercase with letter-spacing), **Oswald** (`--font-sans`,
body), **Space Mono** (`--font-mono`), **Cinzel** (loaded but applied only
through inline styles, with a comment explaining the family-name resolution).

### 4. Inconsistencies

Ranked by how much they will cost during the restyle.

**a. 436 raw Tailwind palette classes bypass the token system.** `neutral-*`
(~170), `amber-*` (~74), plus red/green/blue/orange. `neutral-*` duplicates what
`--foreground`, `--muted-foreground` and `--border` already express, which means
a meaningful part of the UI does not follow theme tokens at all and must be
re-themed by hand rather than by changing a token.

**b. Three parallel gold systems.** `--ss-gold` / `--ss-gold-2` as CSS variables;
the `amber-*` Tailwind family used as the de-facto gold in the sidebar, badges
and focus accents; and **nine distinct hardcoded gold hex values** — `#FFD700`,
`#DAA520`/`#daa520`, `#B8860B`, `#D4AF37`, `#C8A83A`, `#E3C26E`, `#E5C687`,
`#E5D6B8`, `#CDBFA3` — plus 8 `rgba(255,215,0,…)` and `rgba(218,165,32,…)`
variants. One brand colour, expressed a dozen ways.

**c. The shadcn palette is fully desaturated.** Every `:root` and `.dark` colour
is `oklch(L 0 0)` — zero chroma — except `--destructive` and the five unused
`--chart-*`. `--primary` is near-black in light and near-white in dark. The
brand's crimson, gold and bronze live entirely outside `@theme`, so Tailwind
cannot generate utilities for them. **The token system contains no brand colour.**

**c-bis. The authenticated shell scrolls an inner container, not the document.**
`app/(protected)/layout.tsx` is `flex h-screen` wrapping `<main class="flex-1
overflow-auto">`. This is invisible in normal use but shapes several later
phases: the page never scrolls, so there is no document-level scroll position to
style against, sticky/scroll-driven treatments must attach to `<main>`, and any
tool that assumes document height — including screenshot tooling, as this phase
discovered the hard way — silently sees one viewport.

**d. `--destructive-foreground` equals `--destructive` in light mode.** Both are
`oklch(0.577 0.245 27.325)`. Any use of destructive-on-destructive renders
invisible text in light mode; the dark values differ, so it only fails in one
theme. `button`'s destructive variant sidesteps it by hardcoding `text-white`,
which is why this has not been noticed.

**e. No spacing or motion scale.** Durations are ad hoc: `duration-300` (29×),
`duration-200` (15×), `duration-500` (4×), with no named tokens and no easing
convention.

**f. Radius is fragmented.** `rounded-full` (57), `rounded-md` (54),
`rounded-lg` (30), plus `xl`, `sm`, `2xl`, `xs`, `none` and directional variants —
against a 4-step `--radius-*` scale that most call sites ignore.

**g. Shadow usage spans the whole Tailwind ladder**, `xs` through `xl` plus
`inner`, with three coloured shadows (`shadow-blue-100`, `shadow-black`,
`shadow-amber-900`) that belong to no system.

**h. 14 files use inline `style={{ }}`**, bypassing tokens entirely — including
`Sidebar`, the dashboard page, both progress bars and all four background
overlays. Some is legitimate (dynamic widths, the Cinzel family-name workaround);
some is static styling that should be classes.

### 5. Breakpoints

| Variant | Usages |
| --- | --- |
| `sm:` (640) | 290 |
| `md:` (768) | 51 |
| `lg:` (1024) | 26 |
| `xl:` (1280) | 1 |
| `max-[400px]:` | 2 |

Tailwind v4 defaults only; nothing custom is declared. **The app is effectively a
two-state layout**: below `sm` and above `sm`. This is the single most important
structural finding for the restyle — it means 320–639 all render identically with
one exception on the dashboard hero, and 1024/1280/1440 are near-identical
because adaptation stops at `md`. Desktop is not designed, it is stretched.

### 6. Existing animations

Entirely `tailwindcss-animate`; no custom `@keyframes` anywhere in `globals.css`.

- `animate-spin` (28) — loading spinners
- `animate-in` (16) / `animate-out` (11) — enter/exit on dialogs and page content
- `animate-pulse` (7) — skeletons

`framer-motion` 12 is a dependency, used by `InitialLoadAnimation` and the search
page. Body has a global `transition-colors duration-300` for theme switching.

### 7. High-impact components to restyle first

Ordered by reach × visual weight:

1. **`button`** — 50 files, and the only carrier of brand variants.
2. **`card`** — 26 files; the "glass card" pattern should become a variant here
   rather than a copied class string.
3. **`badge`** — 24 files, dense on the session and history screens.
4. **`Sidebar`** — every authenticated screen, and the heaviest concentration of
   hardcoded gold and inline styles.
5. **`input` / `label`** — the settings form and the session logger, the two
   highest-interaction surfaces. Note the deliberate 16px mobile size.
6. **`skeleton`** — 11 files; first paint on every route.
7. **`HeroSection` + `components/backgrounds/`** — carries most of the classical
   identity and most of the decorative cost.

## Files Inspected

Read-only. No modifications.

- `app/globals.css` (all 213 lines)
- `app/layout.tsx` (font configuration)
- `components/ui/` (31 files; `button.tsx` in full)
- `middleware.ts`
- `.gitignore`
- Aggregate scans across `app/`, `features/`, `components/`, `hooks/`, `lib/` —
  141 `.tsx` files — for breakpoints, animations, durations, shadows, radii,
  hex/rgba literals, raw palette classes, inline styles and `cva` usage.
- `CLAUDE.md`, `docs/roadmaps/product-roadmap.md`,
  `docs/roadmaps/technical-debt.md` for constraints.

## Files Changed

Documentation and configuration only:

- `docs/ui-restyle-progress.md` (new — this file)
- `docs/ui-restyle/capture-manifest.md` (new)
- `docs/ui-restyle/screenshots/before/.gitkeep`, `…/after/` (new directories)
- `.gitignore` (two rules appended: `after/`, and `.auth/` + Playwright artifacts)
- `playwright.config.ts` (new)
- `e2e/capture-targets.ts`, `e2e/fixtures.ts`, `e2e/baseline.spec.ts`,
  `e2e/save-auth.mjs` (new)
- `package.json` / `package-lock.json` — `@playwright/test` devDependency and
  three `ui:*` scripts
- `docs/ui-direction-opus.md`, `docs/ui-direction-qwen.md` (new — Phase 2)
- `docs/ui-design-system.md` (new — Phase 3, v0.1)

**Phase 4 — the first UI code changed in this project.** Scope is one section:

- `app/globals.css` — **+302 lines, −0**. Additive role tokens, the `.ds-v01`
  scope, a `@layer components` utility layer (`.type-*`, `.rule-*`, `.marker*`,
  `.corner-brackets`, `.ledger-page`) and a scoped reduced-motion block.
- `app/(protected)/workouts/sessions/[id]/page.tsx`
- `features/workout/session-header.tsx`, `session-action-card.tsx`,
  `exercise-group.tsx`, `set-log-input.tsx`, `rest-timer-bar.tsx`,
  `session-confirmation-dialog.tsx`, `session-loading-skeleton.tsx`
- `e2e/capture-targets.ts` — the `session-full` target (capture tooling, not UI)
- `docs/ui-restyle/screenshots/before/session-full-*.png` (6, added to the frozen
  set), `after/` (60 routes + 4 dialog states)

**No `components/ui/` primitive was touched**, and no hook, service, query key,
route or handler. Behaviour is unchanged: same props, same data, same events.

**Phase 7 — the palette went global and the primitives moved to v1.0.** 38
files, +1458/−593:

- `app/globals.css` — rewritten on the v1.0 palette. `.ds-v01` removed.
- `components/ui/` — 14 primitives: `button`, `input`, `textarea`, `select`,
  `checkbox`, `card`, `badge`, `dialog`, `dropdown-menu`, `tooltip`,
  `separator`, `skeleton`, `avatar`, `label`.
- 13 files converting retired `button`/`badge` variant call sites (correctness,
  not styling — v1.0 §11.4).
- The 8 Phase 4 session-screen files, moved off removed v0.1 tokens.

**`popover` and `alert` were left alone** — confirmed zero importers. Flagged for
Phase 15 with the other dead code. `progress`, `classical-loader`, `stepper`,
`toast` and `image-cropper` are also untouched: the first two keep working
through the `--ss-*` aliases, and the last three carry ~44 raw palette classes
that v1.0 §12.4 schedules for their own pass.

**TD-32 closure (after Phase 15).** 13 files and 2 folders deleted:
`components/ui/popover.tsx`, `alert.tsx`, `calendar.tsx`,
`components/InfoTooltip.tsx`, `components/backgrounds/` (`HeroBackdrop`,
`OrnateCorners`, `ParchmentOverlay`, `GoldVignetteOverlay`),
`app/(auth)/components/` (`BackgroundOverlay`, `ModernBrandHero`,
`ModernBackground`), `dashboard/components/HeroCard.tsx` and `WorkoutItem.tsx`.
`package.json` and `package-lock.json` lose `react-day-picker` and
`@radix-ui/react-popover`; `../TECH_STACK.md` drops `react-day-picker` from its
utilities line.

**Phase 15 — styling cleanup.** 39 files, plus the docs:

- `components/ui/accordion.tsx` — the trigger carries `type-panel`

- Route surfaces: `app/(protected)/loading.tsx`, `app/(auth)/login/error.tsx`,
  `app/global-error.tsx`, `app/error.tsx`, `app/not-found.tsx`, the four
  segment `error.tsx` files, `app/(protected)/workouts/loading.tsx`,
  `workouts/sessions/loading.tsx`, `app/(auth)/auth/callback/page.tsx`
- Routine detail: `routines/[id]/page.tsx`, `RoutineHeader`,
  `RoutineDayAccordion`, `ExerciseCard`; `RoutineCard` (one animation)
- Primitives: `top-progress-bar`, `top-loading-bar`, `tabs`, `tooltip`
- The wizard: `BuildDays`, `TrainingDays`, `ReviewAndCreate`,
  `WizardExerciseCard`, `ExerciseConfigSection`, `ExerciseHeader`,
  `ExerciseNoteRow`, `RoutineDayCard`, `RoutineSummaryStats`,
  `SelectedDaysSummary`, `SetListSection`, `SetRow`;
  `routines/edit/[id]/page.tsx`
- `features/workout/session-loading-skeleton.tsx`
- `app/globals.css` — the `h1`–`h4` Bebas rule and `.heading-classical`
  deleted, and the comment above the type ranks corrected
- `app/layout.tsx` (`themeColor`), `public/site.webmanifest`
- `docs/roadmaps/technical-debt.md` — revision 12: TD-32 corrected, TD-38
  recorded

**Phase 14 follow-up — TD-31.** 4 files:

- `features/initial-load-animation/InitialLoadAnimation.tsx` — the splash
- `features/initial-load-animation/corner-accent.tsx` — deleted (no importer)
- `components/PerformanceDebugPanel.tsx` — the panel
- `docs/roadmaps/technical-debt.md` — revision 11: TD-31 closed

**Phase 14 follow-up — TD-35, TD-37, the stray probe.** 7 files:

- `features/workout/set-log-input.tsx` — the set row below `sm` (TD-35)
- `features/routines/components/RoutineHeader.tsx` — rows wrap (TD-35)
- `app/(public)/layout.tsx` — the public header below `sm` (TD-35)
- `app/(protected)/progress/page.tsx` — three `h1`s to `h2` (TD-37)
- `eslint.config.mjs` — Playwright's output folders ignored
- `.p14-probe.mjs` — deleted
- `docs/roadmaps/technical-debt.md` — revision 10: TD-35 and TD-37 closed

**Phase 14 — automated regression sweep.** Test harness and documentation
only; no application file changed.

- `e2e/regression.spec.ts` (new) — the sweep
- `e2e/preconditions.ts` (new) — shared run preconditions (TD-34)
- `e2e/baseline.spec.ts` — uses the preconditions; the `UI_SESSION_ID` exception
- `e2e/capture-targets.ts` — `REGRESSION_WIDTHS`, `ID_ENV`, the
  `history-detail` target (`UI_HISTORY_ID`)
- `playwright.config.ts` — per-project `testMatch`, the `regression` project
- `package.json` — the `ui:regression` script
- `docs/ui-restyle/capture-manifest.md` — precondition 5, the `history-detail`
  row
- `docs/roadmaps/technical-debt.md` — revision 9: TD-34 closed, TD-35 to TD-37
  recorded
- `../TECH_STACK.md` (outside the repository) — the Playwright line

**Phase 13 follow-up — history detail page.** 6 files:
`app/(protected)/workouts/history/[id]/page.tsx`,
`features/workout/history-session-header.tsx`,
`history-exercise-group.tsx`, `set-comparison-row.tsx`, `session-recap.tsx`
(`SessionRecapPanel` only; the `Card` import went with it), `exercise-group.tsx`
(a comment). No token, hook or prop contract changed.

**Phase 13 — final corrections.** 48 files:

- Primitives: `dropdown-menu`, `select`, `tabs`, `accordion`, `toast`,
  `search-bar`, `stepper` (rewritten: real buttons + compact mobile tracker)
- Shell: `Sidebar`, `Header`, `mode-toggle`, `HeroSection`,
  `providers/app-provider.tsx` (`MotionConfig`), `app/globals.css` (reduced-motion
  block only)
- Auth (rebuilt): `app/(auth)/layout.tsx`, `login/page.tsx`, `signup/page.tsx`,
  `LoginHeader`, `SignupHeader`, `SupabaseLoginForm`, `SupabaseSignupForm`;
  `app/(public)/layout.tsx` (wordmark)
- Profile: `features/profile/profile-view.tsx`, `profile-loading.tsx`
- Session: `set-log-input`, `session-action-card`, `session-header`,
  `exercise-group`, `session-recap`
- Pages: dashboard (`page`, `TodaysWorkouts`), routines (`page`, `WorkoutFilters`,
  `WorkoutsList`, `RoutineCard`, `new/page`, `edit/[id]/page`), history (`page`,
  `loading`, `workout-history-list`, `workout-history-filters`), `search/page`,
  `settings/page`, `workouts/page`
- Wizard: `CommonSplitCard`, `BuildDays`, `SetRow`, `ExerciseHeader`,
  `TrainingDayButton`

No file was deleted. `ModernBackground` and `ModernBrandHero` lost their last
consumers with the auth rebuild and join the Phase 15 deletion list (TD-32).

**Phase 9 — responsive QA.** 3 files, all corrections rather than restyling:

- `app/(protected)/settings/page.tsx` — four grids stepped from `md`/`sm` to
  `lg`/`xl`, and the name row from a hard `grid-cols-2` to `grid-cols-1
  sm:grid-cols-2`
- `app/(protected)/dashboard/components/StatCard.tsx` — the caption wraps
  instead of truncating
- `app/(protected)/routines/components/WorkoutsList.tsx` — the list reserves
  96px below `sm` for the fixed FAB

**Also in the tree, from resolving the `origin/main` merge:**

- `features/workout/progression-result-dialog.tsx` — deleted, superseded
  upstream by `session-recap.tsx`
- `features/workout/session-recap.tsx` — new upstream component, restyled to
  v1.0 (it was written outside the restyle and arrived fully off-palette)
- `package-lock.json` — two optional-dependency entries added (+23/−0) to fix
  the `npm ci` failure on CI

**Phase 8 Batch 4 — menus, dropdowns, modals.** 10 files:

- Primitives: `components/ui/alert-dialog.tsx` (untouched since project start),
  `components/ui/toast.tsx`, `components/ui/loading-overlay.tsx`,
  `components/ui/popover.tsx`, `components/ui/dropdown-menu.tsx` (separator only)
- Dialog call sites: `features/workout/session-confirmation-dialog.tsx`,
  `stale-session-recovery-dialog.tsx`, `progression-result-dialog.tsx`,
  `plate-calculator-dialog.tsx`
- `app/(protected)/routines/components/WorkoutsList.tsx` — the delete action's
  label colour stated rather than inherited
- `docs/ui-restyle/screenshots/after/menu-*.png`, `dialog-*.png` (8, new
  interaction captures — `after/` is gitignored)

**`app/globals.css` was not touched**, for the second batch running. No token was
added, changed or removed.

**No hook, service, query key, route, handler or prop contract changed.**
`ToastVariant` keeps all five members and `push()` keeps its signature; the
variants differ only in what they paint.

**Phase 8 Batch 3 — forms, search, filters.** 16 files:

- Primitives: `components/ui/stepper.tsx` (the 22-class `blue`/`green`/`gray`
  cluster), `components/ui/search-bar.tsx`, `components/ui/image-cropper.tsx`
- Filters: `features/workout/workout-history-filters.tsx`,
  `app/(protected)/routines/components/WorkoutFilters.tsx`
- Settings: `app/(protected)/settings/page.tsx`,
  `features/settings/training-location-preferences-card.tsx`
- Wizard: `features/routines/wizard/` — `WizardNavigation.tsx`,
  `RoutineBasicInfo.tsx`, `ReviewAndCreate.tsx`, `WizardExerciseCard.tsx`,
  `components/ExerciseNoteRow.tsx`, `components/TrainingDayButton.tsx`,
  `components/ExercisePickerDropdown.tsx`
- Wizard shells: `app/(protected)/routines/new/page.tsx`,
  `app/(protected)/routines/edit/[id]/page.tsx`
- `docs/ui-restyle/screenshots/after/history-filters-*.png` (4, new interaction
  captures — `after/` is gitignored)

**`app/globals.css` was not touched.** No token was added, changed or removed;
every surface in this batch was already expressible in v1.0.

**No hook, service, query key, route, handler or prop contract changed.** The
three native `<select>`s stayed native, `Stepper`'s props are untouched, and the
`SHOW_QUICK_WORKOUT_ENTRY` file was not in this batch at all.

**Phase 8 Batch 2 — cards, lists, results.** 21 files:

- Dashboard (`app/(protected)/dashboard/`): `page.tsx`, `components/StatCard.tsx`,
  `StatsOverview.tsx`, `ActivityItem.tsx`, `RecentActivity.tsx`,
  `PersonalRecordItem.tsx`, `PersonalRecords.tsx`, `TodaysWorkouts.tsx`,
  `HeroCard.tsx`, `WorkoutItem.tsx`
- Routines: `features/routines/components/RoutineCard.tsx`,
  `RoutineMetaBadges.tsx`, `RoutineScheduleNote.tsx`, `RoutinesSkeletonList.tsx`,
  `EmptyRoutinesState.tsx`; `app/(protected)/routines/page.tsx`,
  `components/WorkoutsList.tsx`, `loading.tsx`
- History: `features/workout/workout-history-list.tsx`;
  `app/(protected)/workouts/history/page.tsx`, `loading.tsx`
- Results / empty states: `app/(protected)/search/page.tsx`,
  `app/(protected)/workouts/page.tsx`
- Primitives finishing the `--ss-*` migration: `components/ui/progress.tsx`
  (the `gold` variant and its `variant` prop retired), `components/ui/classical-loader.tsx`
- `app/globals.css` — the six `--ss-*` aliases and both `.bg-marble-light` rules
  deleted. **No token value changed**; nothing was added.

**No hook, service, query key, route, handler or prop contract changed.**
`showSeparator` and every other prop keeps its name, its type and its meaning.
`SHOW_QUICK_WORKOUT_ENTRY`, `handleStartEmptyWorkout` and the `isStartingEmpty`
branch in `app/(protected)/workouts/page.tsx` are untouched apart from the colour
of a spinner inside the branch — checked explicitly, because that file is a
documented trap.

**Phase 6 — documentation only.** `docs/ui-design-system.md` rewritten as v1.0
LOCKED (v0.1 is superseded; its consolidation history lives here under Visual
Decisions and in the two direction documents), and this file. **No code changed
in Phase 6.**

**Resolved since Phase 0.** That in-flight LIVE-10 stale-session work has been
committed; the tree is clean apart from this restyle's own documentation, and
`npx eslint lib/api/hooks/useWorkoutSession.ts` passes. Verified 2026-09-08 at
the end of Phase 3.

## Visual Decisions

### 2026-09-08 — Direction selected: the B-family, consolidated as "Inscription"

Recorded in full in [ui-design-system.md](ui-design-system.md) §1. **v0.1 is
provisional and unlocked**; it becomes v1.0 only after Phase 4 and Phase 5.

**Caveat on how this was decided.** The Phase 3 session prompt has a slot — *"I
have chosen direction: &lt;A or B, and from which document&gt;"* — and the
session that ran Phase 3 was given the instruction with that line removed and the
next sentence rewritten to *"consolidate the options described in the direction
files"*. It therefore made the A/B call itself rather than receiving it. The call
is defensible (both explorations independently converged on B) and it is cheap to
reverse (§14 of the design system is the swap, and it changes no role name, no
utility name and no call site) — **but it has not been ratified by the owner.**
If B is wrong, saying so before Phase 4 costs nothing; saying so after costs a
proof of concept.

The four decisions Phase 2 left open, now answered:

1. **A or B → B.** Opus and Qwen produced their B's independently and reached the
   same structure: Cinzel promoted to display, cards replaced by rules, near-zero
   radii, photographic hero deleted, gold rationed. Two independent readings of
   the same screenshots converging is the strongest evidence available.
2. **`bronze` and `marble` button variants → retired**, and `classical` with
   them. Gold never fills a control in this system. That is a public-API change
   to a primitive used in 50 files; call sites convert in the same Phase 7 commit
   so no variant name silently falls through to `default`.
3. **Hero image blocks → retired**, along with the marble wash, the parchment and
   vignette overlays, and the gold gradients. This is the direction's real
   exposure and it is stated as such (design system §1.4): the most literally
   Renaissance pixels in the app go, on the bet that Cinzel, rules and rationed
   gold carry the identity better from inside the content. The corner brackets
   survive, changing job from photo frame to page furniture.
4. **Raw-class migration → both, split by whether the replacement is recoverable
   from the class name.** ~310 colour occurrences plus 96 radius occurrences are
   mechanical and land before Phase 8; ~95 are per-batch during it; ~44 belong to
   Phase 7 with the primitives. Detail in design system §12.

Conflicts between the four directions, resolved rather than blended:

- **Crimson is the action colour; gold is earned honour** (Qwen-B over Opus-B).
  `--ss-crimson` has been declared and unused since the palette was written.
  Highest-risk decision in the system; Phase 4 exists to test it.
- **Destructive gets its own hue *and* its own treatment** (neither exploration).
  Qwen-B reused crimson for both and relied on context — that fails in the Finish
  Session dialog, where the primary and the destructive sit side by side. The
  action is always a fill; destructive is always an outline.
- **Cinzel stops at the section heading**, not the panel title. A high-contrast
  lapidary serif at 15px with 0.06em tracking loses more legibility than it gains
  character.
- **≥1280 is the open ledger, capped at 1200** (Qwen-B over Opus-B). Opus-B's
  persistent right rail is out of UI-only scope — deciding a rail's contents is a
  component-responsibility change. Reported, not adopted.
- **Motion 120 / 200 / 300**, because `body` already carries `duration-300` for
  the theme crossfade and that becomes a token reference rather than a
  grandfathered value.

### 2026-09-08 — Phase 6 · v1.0 LOCKED

Recorded in full in [ui-design-system.md](ui-design-system.md); §16 is the QA
disposition log. The decisions that reverse or supersede v0.1:

- **Crimson is no longer the action colour.** The primary control is ink
  (`--primary`); crimson is `--destructive` and nothing else. `--action`,
  `--action-hover` and `--on-action` are removed — with the control colour back
  on ink they duplicated `--primary` and cost only ambiguity.
- **Completion is green, not gold.** `--success` is the single completion
  language; `--honour` narrows to "better than planned" with a hard cap of two
  marks per viewport, which is the cardinality limit v0.1 lacked.
- **Warning is a mark, never text**, because gold and amber cannot be separated
  by hue under colour-vision deficiency at any values.
- **Inputs get a visible resting boundary in both themes**, reversing v0.1
  §11.6. The theme-dependent behaviour QA found came from `Input`'s base
  `dark:bg-input/30` surviving alongside `bg-transparent`.
- **The tracked uppercase label is restricted to region-level captions** and
  forbidden inside repeated rows.
- **A field never grows past the width its content needs** — `--field-max` 96px,
  `--cluster-max` 480px.
- **The masthead wraps to two lines below `lg`** instead of truncating.

**The plan's rule now binds: no new arbitrary design decisions.** Changes to v1.0
require a defect report against a named section, with evidence, routed through
Phase 13 — not a judgement call inside an implementation batch. That is exactly
how v0.1's §4.3/§11.6 contradiction was caught and resolved, and it is the
mechanism that keeps Phases 7–15 reviewable.

### 2026-09-08 — Phase 4 proof-of-concept decisions

- **The palette is scoped, not landed.** `.ds-v01` re-values the shadcn tokens
  locally rather than globally. Landing them globally is step 1 of the
  pre-Phase-8 mechanical migration (design system §12.4); doing it in Phase 4
  would have restyled every screen, which the phase forbids.
- **Primitives were not edited.** Phase 7 owns `components/ui/`. The POC gets the
  look through `className` at call sites, so a failed direction reverts without
  touching a primitive used in 50 files.
- **A `session-full` capture target was added rather than overwriting the frozen
  `session-*` baseline.** The frozen shots are of a *freshly started, empty*
  session, which hides almost everything this screen does — the progress doc
  already flagged that gap. Rather than replace them, `session-full` points at a
  finished session carrying real data (15 logged sets, previous-performance rows,
  an improvement mark) and was captured in **both** sets by stashing the UI
  changes, capturing `before`, then restoring. The route renders any session by
  id, so this needed no new data.
- **No workout data was created for the captures.** Phase 0 started and aborted a
  real session to get its baseline; this phase deliberately did not, because a
  finished session renders the same screen with richer content. See Findings for
  the one write that did happen by accident.

Two process decisions:

- **2026-09-08 — the second-opinion model is Qwen 3.8 Max.** It changed twice in
  one day. GLM 5.2 held the slot originally and has no image input, which Phases
  2 and 10 both require. Gemini 3 Pro replaced it and was itself wrong on two
  counts: the version was several releases stale, and the pick came from prior
  knowledge rather than data. Current benchmarks put Qwen 3.8 Max top-three on
  both leaderboards that matter here — WebDev Arena and Vision Arena — and it is
  open-weight, which helps the token cost that ruled out Kimi K3. The plan now
  states the role's two requirements, vision and a provider different from the QA
  model, so the slot survives the next model change too.
  Worth verifying before Phase 2b: leaderboard figures moved between two searches
  on the same day and aggregator sources disagreed with each other.

One tooling decision, which the plan requires before the baseline is frozen:

- **2026-09-07 — Playwright, not manual capture.** Chosen so the baseline is
  reproducible: every Phase 8 batch is compared against it, and hand-captured
  images cannot be re-taken identically. Cost accepted: one devDependency, a
  ~115 MB browser download, and ongoing maintenance. This does not reopen the
  Vitest boundary in `docs/roadmaps/technical-debt.md` — Playwright is here for
  screenshots, not for functional or component testing.

## Findings

### New in Phase 15

**70. A debt entry's "reachable only from dead files" was wrong, and only a
count showed it.** TD-32 said the parchment and gold-vignette overlays were
reachable only from other dead files. `app/(protected)/loading.tsx` — the
protected shell's live route fallback — rendered both on every navigation. The
census script flagged the hex and `rgba()` values; tracing them found the live
importer. Lists assert, counts check.

**71. The one deliberate transitional rule outlived its deletion date by six
phases.** §5.5 kept the `h1`–`h4` Bebas rule alive so unmigrated headings would
keep working, to be deleted in the last Phase 8 batch. Twenty-two headings still
leaned on it — error boundaries, `not-found`, routine detail and the wizard's
steps, none of which a batch had covered. A class-beats-element migration never
forces its own last step; something has to count the stragglers.

**72. Adding a rank to a heading is not enough when a size utility sits beside
it.** `.type-*` lives in `@layer components` and Tailwind's `text-lg` in the
utilities layer, which wins. Each ranked heading therefore had its old
`text-*`/`font-*` classes removed, not just a rank added — otherwise the rank
would have applied only its family.

**73. Error boundaries are the surfaces no capture reaches.** They render only
on failure, so every batch, review and sweep in this restyle passed them by; two
of them still drew black grounds and hex gradients. Recorded with the other
never-batched surfaces as TD-38.

**74. A source scan cannot see headings a primitive renders.** The multi-line
heading scan found zero unranked `<h1>`–`<h4>` in the source, and the browser
still found one: Radix's `AccordionPrimitive.Header` emits an `<h3>` around the
trigger. Checking computed fonts on rendered pages is what caught it. Dialog and
alert-dialog titles were already ranked; the accordion was the only gap.

**75. The body face has never reached the page.** `html`, `body` and every
unranked paragraph compute to Tailwind's fallback stack — `--font-oswald` lives
on `<body>` (where `next/font` puts it), preflight reads `--default-font-family`
on `<html>`, and `@theme inline` does not emit that variable. Text with a
`.type-*` class was always right, which is why sixteen phases of captures and
two independent reviews did not notice. TD-39.

### New in Phase 14

**60. "The session expired" was never the cause.** Three runs stopped on a
bounce to `/login`, and every one traced to the backend: a watcher restart makes
`/auth/supabase/verify` fail, and the protected layout treats a failed
verification as a sign-out (`error && !user`, TD-18). A context seeded from an
access token five hours stale still refreshed with a 200. The redirect looks the
same either way, which is why the precondition now names the request.

**61. An open Radix menu hides everything else from role queries.**
`DropdownMenu` is modal by default and marks the rest of the document
`aria-hidden`; Playwright's `getByRole` honours that, so a locator for the
trigger waits out the test while the menu is open. It cost seven checks and
looked like a layout hang.

**62. A pseudo-element hit area counts toward scroll width.** Phase 13 verified
that the checkbox's `::after` catches a click 10px outside the box (Findings
58); it did not check that the same 12px extension widens the scrollable area.
At 320 the set row already ends 7px past the edge, and the hit area takes
`<main>` to 338px (TD-35).

**63. The mobile drawer's close button is unreachable by construction.**
`Sidebar` renders it for `isSidebarOpen && isMobile`, and `use-sidebar` forces
`isSidebarOpen` false on mobile. Nothing ever rendered it, so nothing ever
flagged it; asserting on what the component intends did (TD-36).

**64. `next dev` puts its own control in the tab order.** `nextjs-portal` is a
Tab stop in development and absent in production. A keyboard sweep against the
dev server must exclude it, or it reports an off-screen stop at every width.

**65. `/routines/[id]` had never been loaded by any check.** It is not in the
capture manifest, so no screenshot phase saw it; the sweep is the first thing to
render it, and it overflows from 320 to 768 with pre-restyle classes still in
place (TD-35).

**66. Two of TD-35's three recorded causes were wrong.** The routine-detail
overflow was blamed on the day buttons and the session overflow on Phase 13's
13px captions; measurement found `RoutineHeader`'s unwrapping action row and the
set row's fixed column minimums. Both guesses were plausible readings of the
sweep's offender list, which names the widest elements, not the constraint that
put them there. Measure the constraint before recording a cause.

**67. Playwright's output folders can crash ESLint.** `eslint .` globbed
`test-results/` while a regression run was deleting it and exited 2 with a
filesystem error, not a lint result. Neither folder was in ESLint's ignores;
both are now.

**68. A rule cited in a code comment is not in the design system.**
`HeroSection` says "v1.0 §1.4 retires the photographic hero", and the splash's
restyle nearly removed its photographs on that authority. `ui-design-system.md`
contains no such rule — its §1.4 mention is v0.1's bet on structure-carried
identity. The splash kept its photographs and was brought onto the rules that
are written down. Check a cited rule in the document before acting on it.

**69. Turbopack cannot build from the scratchpad.** A dev server started in a
worktree under the session's scratchpad directory panicked on every request:
the path to one font's source map exceeded Windows' length limit. A worktree
beside the repository (`sunsteel/.claude-wt/`) built normally.

### New in Phase 13

**52. Three of the final review's points were already fixed, and the review
could not know.** "Settings breaks at 768" (Phase 9), "Finish uses destructive
emphasis" and "the finish dialog has competing axes" (both Batch 4) were all
closed before Phase 12 ran; its captures predated the fixes. The session-screen
P0 was only partly stale — the `honour-bright` bar and gold completion labels
were real. **A review against stale captures produces confident, specific,
wrong findings.** Capture immediately before any QA phase, and check each point
against the code before acting on it.

**53. Two more `group-hover:` rules with no `group` ancestor**, in both auth
forms: the Log in chevron's `opacity-50 group-hover:opacity-100` and the Google
logo's `grayscale group-hover:grayscale-0`. Same class as the toast's dismiss
button (Findings 43): valid CSS that can never match. That makes **seven**
silent-failure instances in this restyle. Both were removed with the rebuild.

**54. Moving heading levels cost nothing visually, because type is a class.**
Every heading whose level changed (`h2`→`h1`, `h1`→`h2`, `h3`→`h2`, or out of
the outline to `p`) already carried a `.type-*` class, which beats the global
`h1`–`h4` Bebas rule on specificity (§5.5), so no pixel moved. The migration
strategy chosen in Phase 4 is what made document semantics independent of
appearance. An unclassed heading would not have been free: changing its level
would have changed its look.

**55. One `MotionConfig` covers every framer-motion component.** None of the
files using framer-motion honoured reduced motion, and it writes transforms
inline, so the reduced-motion CSS block could not reach it. `reducedMotion="user"` at the root makes every framer component drop
transform and layout motion under the OS setting while keeping opacity — which
is motion spec §3's rule, applied once. It changes how state arrives, never what
renders, so it stays inside §3's "no JS decides what to render" constraint.

**56. The profile made a third-party request on every view.** The hero band's
texture was `url('https://www.transparenttextures.com/patterns/stardust.png')`,
loaded from an external host on every profile render, including the public
`/members/<username>` page. Removed with the band. Not a styling finding, but a
privacy and CSP one that only a visual review of this page would surface.

**57. `/workouts/history/[id]` is off-system and no phase has covered it.** Its
title renders through the global Bebas rule, the exercise block is a boxed
card, the set badge is a bordered box and the checked box is filled ink rather
than `--success`. Neither review listed it — it was only seen because the
restyled recap panel sits on that page. Added to TD-31, then **closed the same
day** in the Phase 13 follow-up.

**59. A per-state outline check caught what the captures could not.** The
restyled detail page looked right in all 12 captures, and an aborted session
still went `h1` → `h3`, because only a completed session renders the recap's
`h2`. A heading list per state, not per route, is what surfaced it — add state
variants to the Phase 14 heading check.

**58. A pseudo-element can be verified as a hit area.** `elementFromPoint` 10px
outside the visible 20px checkbox returns the checkbox, and a real click there
completed the set. This is the check for any `::after`-expanded target — its
`getBoundingClientRect` still reports the visible box, so a size probe alone
reports a failure that isn't one.

### New in Phase 9

**47. `md:` does not mean "a medium content column" in this shell.** Three
separate defects now share one root cause (Findings 34, 39, and the settings form
here): a breakpoint fires at a viewport width, but the protected layout hands its
main column **viewport minus 256px**. At a 768 viewport that is **512px**, and at
1024 it is 768. Every `md:`/`lg:` multi-column rule inside the shell is therefore
one step more optimistic than it looks.

The settings form was the worst case: a two-column page split *and* a
three-column field row both firing inside 512px produced ~60px cells, and the
Weight Unit select rendered as **"Ki"** — a 10px box holding 89px of text.

**Rule for the rest of the project: when adding a multi-column rule inside the
protected shell, budget `viewport - 256`, and verify at the breakpoint itself,
not above it.**

**48. A layout-signature diff answers "do these widths render the same" exactly.**
Comparing per-element `display`/`flex-direction`/column-count/`font-size`/
`position`/`text-align`, sorted, with pixel widths excluded, isolates "did a
breakpoint rule fire" from "did the page reflow fluidly". That is what made both
predictions answerable as facts rather than impressions.

**The first attempt was wrong and looked right.** Including `<head>` and
Next.js's dev-injected `SCRIPT`/`LINK`/`META`/`NEXTJS-PORTAL` nodes made every
width differ, "refuting" prediction 1 in 10 route/theme pairs. The diffs were all
injected-node churn shifting array indices. Filtering to visible content in the
scroll container flipped the answer to a clean confirmation. **A diff over an
unstable node set produces confident nonsense.**

**49. Two of the sweep's hits were artefacts of how it measures, not defects.**
The "Default" radio reports 13x13px, but the probe measures the `<input>` while
the real hit target is the `<label>` wrapping it — 81x44px, exactly §11.6's
mobile height. And `.sr-only` text reports as clipped 171 times because it is
clipped to 1px by design.

**An automated sweep needs its false-positive classes written down**, or the next
run re-investigates them. Both are now recorded here.

**50. A floating action button overlaps content; that is what it is.** The real
defect was different and worth separating: the scrolling list reserved no space
for it, so at the *end* of the scroll the last card was unreachable behind it.
That is fixed. Mid-scroll overlap remains and is intrinsic — removing it means
moving the action out of the viewport, which is a layout change, not a style one.
Reported, not fixed, per Phase 9's scope.

**51. `npm ci` failed on CI for a lock-file defect that predates the restyle.**
`@img/sharp-wasm32` (an optional platform variant of `sharp`, pulled in by
`next`) declares `@emnapi/runtime@^1.11.3`, and npm on Windows resolves the
native win32 binary and never writes the wasm32 branch's dependencies into the
lock. `npm ci` on Linux validates every platform and fails with EUSAGE.

`HEAD`, `origin/main` and the merged index all lacked the entries, so this would
have failed for anyone on any push. Fixed by adding the two entries with
integrity hashes taken verbatim from the registry (+23/−0, insert-only).

Two approaches that did **not** work, recorded so they are not retried:
`npm install --package-lock-only` reproduces the same platform-blind resolution;
deleting and regenerating the lock drifted the tree (`npm ci --dry-run` then
reported "added 2, removed 4"). **`npm ci --dry-run` on Windows cannot reproduce
the failure** — it does not validate the Linux-only branch — so CI is the only
real confirmation.

### New in Phase 8 Batch 4

**43. A `group-hover:` with no `group` ancestor is the same silent failure as an
undefined class.** The toast's dismiss button was `opacity-0
group-hover:opacity-100` inside a container that never had `group`, so it was
permanently invisible — and permanently clickable, which is why nothing ever
surfaced it. Tailwind compiles the rule perfectly; the selector simply never
matches.

That makes **five** silent-failure instances in this restyle: `xs:` (TD-28/29),
`honour-bright` x2 (Findings 36), `slide-in-bottom` (Findings 40) and this. The
first four were classes that emitted nothing; this one emitted correct CSS that
could not apply. **The check has to be "does this rule reach the element", not
just "is this class in the stylesheet".**

**44. Two v1.0 rules genuinely pull against each other on a destructive
confirmation, and both were followed.** §4.3 rule 5 says destructive fills a
control when that control destroys data; §11.9 says the primary is never
visually dominant over the content it is confirming; and §11.9 also says that
when stacked, both actions go full width. At 390 that produces a full-width
crimson DELETE sitting above the sentence it is confirming — dominant by
construction.

Recorded rather than resolved: every individual rule is satisfied, the outcome is
arguably correct for a permanent deletion, and picking a winner here would be a
new design decision in a locked system. **If Phase 11 or 12 flags it, the fix
belongs in §11.9's wording, not in the call site.**

**45. Five tinted variants were five surfaces pretending to be one component.**
The toast's `success`/`destructive`/`warning`/`info`/`default` each had their own
background, border and text colour, so "a toast" had no single appearance to
restyle — changing the component meant changing five designs. Collapsing them
onto one overlay surface with a `.mark` is what §11.12 asks for, and it also
made the component a third of its former size. **A variant that changes the
surface is a different component; a variant that changes a mark is a state.**

**46. The `after` set was captured once while the owner had a live session.**
`/workouts` redirects into an active session, and `/routines` and the dashboard
grow an active-session banner, so nine captures did not match the `before`
baseline's conditions. Caught by noticing a "RESUME" banner in a dialog
screenshot, then confirmed against workout history — the session was the owner's
own (`LIVE-09 authenticated browser verification`), not something the capture
harness started. Re-captured after it finished.

**The capture harness has no precondition check for this**, and
`ui-restyle/capture-manifest.md` lists "no active session" as a precondition it
does not enforce. Worth enforcing before Phase 12's final QA run, where a stale
comparison would be much more expensive.

### New in Phase 8 Batch 3

**39. A breakpoint that was already too small gets worse when type grows.** The
wizard stepper switched to its horizontal layout at `sm` (640). At a 768 viewport
the shell gives its main column **512px**, and four steps with 150px descriptions
need ~700 — so it ran 88px past the edge. **The `before` baseline shows the same
overflow**, with step 4 already cut off entirely, so this is pre-existing; but
moving the titles to `.type-panel` (15px) from `text-xs` (12px) widened it, which
is why it was fixed here rather than recorded. The stacked layout now runs to
`lg`.

This is Findings 34's twin: there, a column count and a type step shared the 768
breakpoint; here, a layout switch and a type rank did. **Both were invisible at
320 and at 1440.** Sweeping only the extremes would have missed both.

Note this is *not* the §10.3 `sm`/`md` cliff the Do Not Revisit list protects.
That entry forbids **redistributing** 290 `sm:` sites as a layout rewrite; moving
one breakpoint on one component to fix a measured overflow is a defect fix.

**40. `slide-in-bottom` was a fourth undefined class.** On the settings page root,
defined nowhere, absent from the served stylesheet, emitting nothing and raising
nothing. That makes four found so far in this restyle — `xs:` (TD-28/29),
`honour-bright` (Findings 36), and this. **The pattern is consistent enough to be
worth a rule: any class not obviously from Tailwind's own vocabulary should be
grepped against the served CSS before it is trusted**, and certainly before it is
preserved through a refactor because it "looks intentional".

**41. §12's migration table is subordinate to §4.3's invariants.** §12.1 maps
`yellow-*` to `--warning-strong` and calls it mechanical, but the one `yellow-500`
in this batch marked *presence of a note*, and §4.3 rule 4 scopes
`--warning-strong` to risk. Following the table would have made every exercise
with a note look like a hazard. The table is a shortcut for the common case, not
an override of the rules it implements — which §12.3 already says for `amber-*`
and is equally true of the families it calls mechanical.

**42. The batch's primary surface had no capture.** The history filter panel is
behind a disclosure button, so all 54 route screenshots show it collapsed — the
`before` set never contained it either. Four interaction captures were scripted
for it. **A batch whose main surface needs a click to exist needs its own
captures, or it ships unreviewed**, which is exactly the gap
`ui-restyle/capture-manifest.md`'s unbuilt component/state shots were meant to
close.

### New in Phase 8 Batch 2

**34. A type rank that steps at a breakpoint can overflow a column count that
was fine one pixel earlier.** The stat band was `grid-cols-2 sm:grid-cols-3`.
At 768 two things happen at once: the third column appears (`sm`), and
`.type-numeral` steps from 40px to 52px (§5.2's desktop size, also keyed to
768). The shell's main column at that width is only **512px** — the sidebar
takes 256 — so each cell got ~170px for a value that needs ~196px. Measured 16px
of overflow, in both themes, and it was the *only* failure in 80 checks.

The fix is `lg:grid-cols-3`, and the same measurement is why the band does not
open to six columns at `xl` as §10.1 suggests: at 1440 six cells are ~181px, the
same failure. **§10.1 is a direction, not a column count** — "one ruled band
rather than a 3×2 card grid" is satisfied by a band of three.

Generalisable: **the breakpoint where a column appears and the breakpoint where
type grows are the same number here, and that is the worst case, not the safest
one.** Check the width just above a shared breakpoint, not the extremes.

**35. `--surface-sunk` is invisible on `--background`.** Measured 1.35:1 light,
1.41:1 dark. It is designed as a well *inside* a `--surface` panel (§8's three
tonal steps), so on a ruled surface that paints the ground directly it does not
read at all — the stat milestone bar's track disappeared and a 100% bar looked
like a rule. Any component that moves from `panel` to `ruled` in a later batch
inherits this: **a sunken well needs a surface to be sunk into.** On the ground,
use `--rule-faint`.

**36. `honour-bright` does not exist, and two session-screen files use it.**
`features/workout/session-action-card.tsx:52`
(`[&_[data-slot=progress-indicator]]:bg-honour-bright`) and
`session-confirmation-dialog.tsx:127` (`border-honour-bright`). It is a name from
the Qwen direction document that never entered `@theme inline`; confirmed absent
from the served stylesheet. Neither fails loudly — the progress indicator falls
back to the primitive's `bg-primary` and the border to the global
`border-border`, so both render plausibly in the wrong colour. **This is the
TD-28/TD-29 silent-failure class inside the restyle itself.** Not fixed here: the
session screen belongs to a later batch, and changing it now would edit a surface
under a batch already signed off. Recorded in Known Issues.

**37. Measured contrast and §4.4's computed contrast do not agree as closely as
Phase 4 claimed.** Rendered figures, read off real nodes by rasterising the
computed `oklch()` through a 1×1 canvas:

| Pair | Light | Dark | §4.4 says (light) |
| --- | --- | --- | --- |
| `ink` on `background` | 13.77 | 16.39 | 12.13 |
| `ink-2` on `background` | 7.65 | 10.07 | 6.70 |
| `ink-3` on `background` | 5.39 | 5.81 | 4.75 |
| `ink-3` on `surface` | 6.09 | 5.36 | — |
| `success` on `background` | 5.17 | 9.98 | 4.52 |
| `success-strong` on `background` | 3.64 | 8.83 | 3.21 |
| `warning-strong` on `background` | 4.02 | 8.74 | 3.54 |
| `ink-2` on `rule-faint` (the milestone bar) | 5.66 | 7.15 | new pairing |
| `rule` on `background` | 1.84 | 1.87 | 1.62 |

Every role clears its target and the deltas all run **in the safe direction**, so
this is not a defect. But §4.4's "computed and rendered agreed to within 0.02"
does not reproduce at these values — the browser's oklch→sRGB gamut mapping is
not the transform the document used. **Treat §4.4 as a floor, and keep measuring
rather than trusting the table.** The first attempt at this measurement was
itself wrong and silently so: `getComputedStyle().color` returns `oklch(…)`
verbatim in Chromium, and parsing those three numbers as RGB produced a tidy
column of ~1.3:1 figures that looked like a catastrophic contrast failure.

**38. The `xl` right-alignment in the history ledger is real but nearly
invisible**, because the page is `mx-auto max-w-3xl` — 768px — at every width.
§10.1's "open ledger" cannot happen inside a 768px cap. Widening it is a page
layout change beyond this batch; recorded for whoever owns §10.1 next.

### New in Phase 8 Batch 1

32. **`@sunsteel/contracts` drift again, and it is red right now.** Nine type
    errors across `progression-result-dialog.tsx`, `progression-change.ts(.test)`
    and `workout.type.ts` — `ProgressionChange`, `ProgressionSetChange` and
    `FinishWorkoutResponse` are not exported by the installed package. They come
    from `aaaace9 feat(workouts): show why prescriptions progressed`. **No Batch 1
    file appears in the error list.** Same class as Findings 28: the contracts
    package needs publishing and bumping. Blocks `npm run verify` and CI.

33. **The stale-Turbopack trap caught me a second time, and I had written the
    rule myself.** Finding 18 says: after any git operation that rewrites
    `globals.css`, check the served stylesheet before trusting a screenshot. I
    ran `git stash push -u` / `pop` to attribute an overflow, did not re-check,
    and then ran a responsive sweep **and** a full 54-shot capture against a
    stylesheet with the entire `@layer components` block missing. The screenshots
    looked plausible — the palette was right, only the type ranks and structural
    utilities were absent — which is exactly what makes this failure dangerous.
    Caught by eye: labels rendering lowercase and the masthead in Bebas instead of
    Cinzel. Everything measured between the stash and the recompile was void and
    was re-run.
    **The rule needs teeth: the stylesheet check belongs immediately after the
    git operation, not at the end of the phase.** `touch` does not invalidate;
    only a real content change does.

34. **A pre-existing overflow can be worsened by a change that is not its cause.**
    The shell has overflowed at 768–1023 since before this project started (890px
    into a 768px viewport, measured on a clean tree). Batch 1 did not create it,
    but a wider masthead font pushed it to 935. Attribution by stashing answered
    "did I cause this?" — and the answer, "no, but I made it worse and the root
    cause is in my batch's file", is what justified fixing it here rather than
    logging it.

### New in Phase 7

28. **A stale `node_modules` produced seven type errors that looked like
    restyle damage. RESOLVED.** During Phase 7, `npm run typecheck` reported
    `TS2305: Module '@sunsteel/contracts' has no exported member ...` across
    `useTrainingLocations.ts`, `userService.ts` and
    `training-location-preferences.ts`. Cause: `package.json` required
    `^0.10.0` while `node_modules` still held **0.9.0**, and those files had
    arrived in `3eed435 feat(settings): capture equipment available at each gym`.
    Attribution was established by stashing every Phase 7 change and re-running —
    identical failures on a clean HEAD.
    **The owner ran `npm install` shortly afterwards**; 0.10.0 is now installed,
    it does export the missing members, and typecheck is clean. `package-lock.json`
    is dirty from that install (it dropped some optional peer entries) and is not
    part of the restyle.
    The transferable lesson: when a gate goes red mid-phase, check the dependency
    tree before the diff. **`@sunsteel/contracts` is a published package, not a
    `file:` link**, so the working tree and `node_modules` drift apart routinely
    and the failure surfaces as errors in files nobody touched.

29. **A retired cva variant is caught by the type system, which makes the
    migration safe.** `variant` is typed by `VariantProps<typeof buttonVariants>`,
    so removing `classical` turned all 15 call sites into type errors rather than
    silent fallbacks to `default`. Worth knowing before Phase 8 retires anything
    else: **cva variants fail loudly; utility classes fail silently.** That
    asymmetry is why v1.0 §11.4 insists variant removal and call-site conversion
    share a commit.

30. **`dropdown-menu` was painting destructive items with the ON-colour.** The
    shadcn base used `data-[variant=destructive]:text-destructive-foreground`.
    That token was broken (§2.1, it equalled `--destructive`), so the bug was
    invisible — and fixing §2.1 would have turned destructive menu items into
    near-invisible ivory-on-ivory text. Found while restyling, fixed to
    `--destructive`. **A latent defect that only surfaced because another one was
    repaired**, which is worth remembering when the remaining `-foreground`
    tokens get audited.

31. **The offline colour model held up a second time.** Browser-measured
    contrast matched Phase 6's computed table to within **0.07** across 18 pairs
    in two themes. The model is now validated against two independent live runs
    and can be trusted for future token work — without replacing the browser
    gate, which is what caught this agreement in the first place.

### New in Phase 6

24. **The dev server was clobbered again, by a build.** `/login` returned 500 and
    every page rendered an empty body — the black-screen signature from
    `AGENTS.md`. `.next/` manifests were rewritten at 15:28, after Phase 4
    finished, so a `npm run build` or `npm run verify` ran while the dev server
    was up. **This is the second time in two phases that `.next/` contention has
    cost real work** (Phase 4 lost a capture run to a stale Turbopack compile).
    Phase 6 needed no browser, so it was worked around rather than escalated: the
    oklch→sRGB transform was implemented offline and validated against Phase 4's
    recorded browser measurements before being trusted.

25. **Gold and amber cannot be separated by hue — measured, not asserted.**
    ΔEok 0.054–0.109 across every candidate pair, collapsing to a distance of
    3.6–16.7 (of 100) under simulated deuteranopia. Staggering lightness improved
    dark (4.3→16.7) while making light worse (4.9→3.6). This is why v1.0 removes
    the collision — warning becomes a non-text role — rather than tuning values.
    Any future proposal to "pick a better gold" should start here.

26. **Equal-luminance roles are indistinguishable to WCAG contrast maths.** The
    first separation check returned ~1.0 for every semantic pair and looked like a
    catastrophic failure; it was the wrong metric. Contrast ratio measures
    luminance only, and the roles had been deliberately set to equal luminance so
    each would clear AA identically. Perceptual distance (ΔEok) plus a CVD
    simulation is the right tool. Worth recording because the wrong number was
    alarming and would have justified a bad decision.

27. **An offline colour model is trustworthy here, and cheap.** The oklch→sRGB
    implementation reproduced Phase 4's browser figures to within 0.02 across six
    independent pairs. That made Phase 6 possible with the app down, and it makes
    every future token change checkable without a running server — but it does not
    replace the browser check, which stays a v1.0 gate (§15).

### New in Phase 4 — what the proof of concept actually proved

These are the point of the phase. Items 13–17 are **defects in v0.1 itself** and
are what Phase 6 has to resolve before locking v1.0.

13. **v0.1 contradicts itself on the action colour, and this screen exposes it.**
    §4.3 rule 1 says "one `action` element per region — two crimson elements in
    one region is a bug". §11.6 says the set-log checkbox is `action` when
    checked. On a session with 15 sets those cannot both hold: the rendered
    screen carries **16 crimson fills** (15 checkboxes + the Finish button).
    Visually the checked column reads as a row of error markers rather than
    confirmations. Either the rule needs a "per region, excluding repeated list
    controls" carve-out, or the checkbox needs a different role.

14. **Gold saturates for the same reason.** Rule 2 rations gold to earned marks
    but sets no cardinality limit, and on a completed session almost everything
    is earned: **43 gold marks** on one screen (set labels, exercise markers,
    "Complete" labels, the progress fill, the improvement mark). Direction A had
    "at most one gold element per card, two per viewport"; the consolidated
    document dropped that clause and needs it back in some form.

15. **`honour` and `warning` are the same colour in practice.** §4.3 rule 4
    claims they are "different hues on purpose". Measured contrast between them
    is **1.17:1 in light and 1.07:1 in dark** — indistinguishable. In the finish
    dialog the incomplete-session warning renders gold, which directly
    contradicts "gold means earned". Dark is the worse case: `#dfb86f` vs
    `#d9b16d`.

16. **Light mode fails WCAG AA on the roles v0.1 assigns to captions.** Measured
    on the rendered screen:

    | Pair | Light | Dark | AA (normal text) |
    | --- | --- | --- | --- |
    | `ink-3` on `surface-sunk` | **2.55** | 4.91 | 4.5 |
    | `ink-3` on ground | **2.90** | 4.70 | 4.5 |
    | `honour` on `surface-sunk` (11.5px) | **3.44** | 10.87 | 4.5 |
    | `honour` on ground | **3.92** | 10.43 | 4.5 |
    | `warning` on `surface-sunk` | **4.04** | 10.14 | 4.5 |
    | `on-action` on `action` | 8.21 | 4.86 | 4.5 ✓ |
    | body/masthead/field values | 13.8–14.6 | 12.1–16.4 | ✓ |

    §4.1 explicitly claims `honour` is "AA on ground and surface". **It is not.**
    Light `--ink-3` needs roughly `oklch(0.52)` and `--honour` a similar drop.
    Dark passes throughout. This is a Phase 6 token change, not a Phase 4 fix —
    left visible on purpose so Phase 5 and Phase 11 see the real system.

17. **The POC cannot answer §15 question 2.** "Does the destructive outline read
    as destructive next to a crimson fill?" has no answer here, because **this
    screen has no destructive control at all** — the only action is Finish, and
    its dialog offers Cancel and Finish (Findings item 6, pre-existing). The
    action/destructive collision has to be tested on a screen that has both;
    settings (Delete account) or the routine card menu are candidates.

18. **A stale Turbopack CSS compile silently invalidated a whole capture run.**
    After `git stash` / `git stash pop` on `globals.css`, the dev server kept
    serving the *pre-stash* stylesheet: everything appended to the end of the
    file — `.ds-v01` and the entire `@layer components` block — was missing, and
    `@layer components;` was emitted empty. `touch` did **not** invalidate it;
    only a real content change did. The first "after" run screenshotted new
    markup against absent CSS and looked plausible: ruled rows and mono figures
    rendered (those utilities live earlier in the file), only the palette and
    type ranks were gone. **This is the repo's existing silent-CSS-failure class
    (TD-28/TD-29) in a new form.** Rule going forward: after any git operation
    that rewrites `globals.css`, grep the served stylesheet before trusting a
    screenshot. `curl` the chunk from `/_next/static/chunks/*.css` and check for a
    known selector.

19. **Cinzel truncates the masthead at 390.** `line-clamp-1` plus 0.06em tracking
    turns "Upper / Lower - Autumn Block" into "UPPER / LOWER -…". The baseline
    showed the full name. Either the header title wraps to two lines at `<sm`, or
    Cinzel is too wide for this slot. Related to §15 question 3, which asked only
    about legibility and missed the width cost.

20. **The set-log row stretches badly at ≥1024.** Reps/Weight/RPE fields grow to
    roughly a third of a 1200px column each, so a two-digit number sits alone in
    a very wide box. v0.1 §10.1 gives `xl` more *columns* but says nothing about
    capping field width. The set row needs its own max-width.

21. **The direction's core claim held: de-boxing works on the densest screen.**
    Same content, `session-full-1440-dark` went **4768px → 3728px (−22%)**, with
    no horizontal overflow anywhere between 320 and 1440 in either theme. The
    ruled structure reads as a ledger rather than a stack of boxes, and the
    figures are tabular for the first time.

22. **An unintended write, reported.** While trying to capture the finish dialog
    I clicked "Finish Session" on the completed session used for captures,
    assuming it opened a confirmation. It does not: `use-session-management`
    short-circuits straight to the mutation when every set is complete, so four
    `PATCH .../finish` calls were sent. **The backend rejected them and the
    session is unchanged** — re-read afterwards: still `COMPLETED`, `endedAt`
    `2026-09-03T18:48`, `durationSec` 3720, `lastActivityAt` unchanged. The
    dialog was then captured on a session with sets outstanding, which takes the
    confirm path, with request monitoring asserting zero writes.

23. **A session went IN_PROGRESS during this phase and is not mine.**
    `21c430fd…` started 2026-09-08 14:50 local, on routine "UL 1" — the same
    routine as the three sessions the owner ran this morning. Nothing in this
    phase calls the start endpoint. The test suite also grew from 133 to 136
    tests in a file this phase did not write, so the owner was working in the
    repo concurrently. **Consequence for the next capture run:** `/workouts` now
    redirects into that live session and the shell shows a Resume banner on every
    page, so `workouts-*` and every other route will capture differently until it
    ends (Findings item 5).

### New in Phase 3

7. **Cinzel loads only weights 600 and 900, and both explorations specified
   weights that are not in the bundle.** Opus-B asks for Cinzel 400, Qwen-B for
   Cinzel 700; `app/layout.tsx:39` loads `['600', '900']`, deliberately cut from
   six weights in CL-07. Opus-A's "Space Mono 500" is the same mistake — Space
   Mono loads 400 and 700. A browser asked for an absent weight synthesises or
   falls back with **no error**, which puts this in the same silent-failure class
   as an undefined Tailwind variant. Design System v0.1 specifies only loaded
   weights; adding one is a font-payload decision and is not taken.

8. **Tailwind v4 has an `--ease-*` theme namespace but no `--duration-*` one.**
   `--ease-standard` in `@theme` yields a working `ease-standard` utility;
   `--motion-base` in `@theme` yields **nothing**, silently. Durations must be
   plain `:root` custom properties consumed via `duration-[var(--motion-base)]`
   or from the utility layer. This is the most likely place for the TD-28/TD-29
   failure mode to recur, and it needs the compiled-stylesheet check (both
   bundles) the first time it is used.

9. **Roughly half the radius migration is free.** `@theme inline` derives
   `--radius-sm/md/lg/xl` from `--radius`, so re-valuing that one block re-points
   96 `rounded-*` occurrences with no markup change. Only `rounded-full` (57) and
   ~23 stragglers need per-site work — and most of those are primitives. Radii
   and colour therefore migrate on different schedules.

10. **The raw-class debt is concentrated, not scattered.** A Phase 3 re-count
    finds **449 occurrences on ~215 lines in 36 of 141 `.tsx` files** (the Phase 1
    figure of 436 used a narrower property list; nothing turns on the difference).
    The top nine files hold ~60% of the affected lines, and three of them —
    `stepper.tsx` 22, `toast.tsx` 19, `image-cropper.tsx` 3 — are **primitives**,
    so they belong to Phase 7, not to a Phase 8 page batch. The two auth screens
    hold another ~52 lines and form a self-contained batch outside the protected
    shell. This is a materially smaller and better-shaped problem than "436
    classes" suggested.

11. **`--primary` and `--accent` must not be repurposed.** `--accent` means
    "hover fill" in shadcn (30 call sites); mapping brand gold onto it turns every
    hover gold. `--primary` means "ink" across ~104 sites including 5–20% opacity
    decorative washes; re-valuing it to crimson would put crimson washes on a
    hundred surfaces, which is the exact inverse of "one action per region". Both
    brand roles are therefore **new** tokens (`--honour`, `--action`), and
    promoting a site to `--action` stays a deliberate per-site decision.

12. **81 green/emerald occurrences is suspicious.** That is far more than a
    `success` role plausibly needs. Some of it is likely completion state that
    should be `honour`. Flagged for the mechanical migration pass — do not assume
    the count is right just because the map looks simple.

### From Phases 0–2

The four that shaped Phase 2 and 3:

1. **The design system has no brand in it.** The token palette is greyscale; the
   brand lives in loose hex values, an unrelated Tailwind colour family, and
   three hand-written utilities. Phase 3 is therefore not "adjust tokens" — it is
   "give the brand a token system for the first time".
2. **Desktop is not designed.** Adaptation stops at `md`; `xl:` appears once.
   Direction A and Direction B both need an explicit position on what 1280+ is
   for, or the restyle will produce a wider version of the same tablet layout.
3. **436 raw palette classes are the real cost of this project.** Changing a
   token will not move them. This is the work item that will dominate Phase 8,
   and it should be sized honestly before committing to a direction.
4. **`--destructive-foreground` is broken in light mode** and should be fixed in
   Phase 3 as a correctness matter, independent of any visual direction.
5. **`/workouts` renders two entirely different screens under one route.** It
   redirects into the live session whenever one exists, and shows a "no active
   workout" empty state otherwise. The committed `workouts-*` images are the
   empty state, and `session-*` covers the other branch — but the route is not
   self-stabilising, so any Phase 8 comparison of `workouts-*` must first confirm
   no session is active or it will diff two different pages.
6. **A session cannot be abandoned from the session screen.** The only control is
   "Finish Session", and its confirmation dialog offers just Cancel and Finish —
   even with zero sets logged, where the dialog itself warns the workout is
   incomplete. The backend accepts `ABORTED` on the same endpoint and the
   stale-session dialog offers a discard after 48 hours, so the capability exists
   and is simply not reachable in the moment a user would want it. Out of scope
   for a restyle; recorded because it was found while restoring the account
   state, and it belongs in the product roadmap rather than here.

**Findings 52 — two layout animations were live on the session screen's hot
path, and both are the exact defect §4 exists to prevent.**

- `rest-timer-bar.tsx` animated `width`. That bar ticks once a second for the
  length of every rest interval, on the screen that re-renders most broadly
  (TD-07), so it was relaying out the document on every tick for the duration of
  a workout. Now `scaleX` on a composited layer.
- `top-progress-bar.tsx` animated `width` on every route change.

Neither was in the §6 delta table; both were found by grepping the compiled
stylesheet for `transition-property:width` rather than by reading the source.

**Findings 53 — the auth pages never went through a Phase 8 batch.** `/login`
and `/signup` sit outside the protected shell, and the batches were scoped to
shell surfaces. They still carried `transition-all`, `hover:scale-[1.01]` and
`active:scale-[0.99]` — three things §5 prohibits outright — plus a password
strength meter animating width. All corrected here. Worth checking whether they
were skipped for the *visual* work too; that is a Phase 12 question, not a
Phase 10 one.

**Findings 54 — Tailwind v4 compiles class names out of prose.** Content
detection scans every non-ignored file, so a class name written in a code comment
or in `docs/` is emitted into the bundle even when nothing uses it. A comment I
wrote in `accordion.tsx` naming the deleted row-template transition put that
utility straight back into the stylesheet.

The comment is reworded, but the docs still do it: `docs/ui-motion-spec.md` and
the archived July audit mention `transition-all` and friends, so those utilities
appear in the compiled CSS with no consumer. Consequences worth carrying forward:

1. It is dead weight, though small.
2. **It defeats §7 gate 1 as written.** Grepping the bundle for a class name no
   longer proves anything about usage — presence can come from prose. The gate
   should assert on the emitted *declaration* (`transition-property:width`) and
   cross-check the source, which is how Findings 52 was actually caught.

Constraining scanning with `@source` would fix it, but narrowing content
detection late in a restyle risks silently dropping a class that is genuinely
used — the TD-28 failure class — so it is left alone deliberately.

## Known Risks

- **TD-36 keeps nine regression checks red** until the drawer gets a
  reachable close control and stops being tabbable while closed. That is a
  behaviour change, so a restyle phase cannot close it.
- **Check the served stylesheet immediately after any git operation on
  `globals.css`** — stash, pop, checkout, rebase. Finding 33 cost a sweep and a
  full capture run.
- **`@sunsteel/contracts` drift will keep biting.** It is a published dependency,
  not a `file:` link, so a bumped manifest with a stale `node_modules` shows up as
  type errors in files nobody edited (Findings 28, resolved). Check the dependency
  tree before blaming a diff.
- **Only a 400 from Supabase's token endpoint means `.auth/state.json` has
  expired** (`npm run ui:login`). A bounce with a failed verify is the backend
  (Findings 60); the precondition says which.
- **`.next/` contention has now cost work twice.** Phase 4 lost a capture run to a
  stale Turbopack compile after a `git stash`; Phase 6 opened with a dead dev
  server because a build ran while it was up. Both are documented in `AGENTS.md`
  and both still happened. Before trusting anything rendered, check that the dev
  server actually answers 200.
- **A stale dev-server stylesheet looks exactly like a working one.** New in
  Phase 4 (Findings 18): after a `git stash`/`pop` on `globals.css`, Turbopack
  served the old compile and `touch` did not invalidate it. Screenshots taken
  against it were plausible and wrong. Verify the served CSS after any git
  operation on that file.
- **The compiled-stylesheet check was run in Phases 14 and 15** against a
  production build. Repeat it after any new variant or arbitrary value.
- **A Tailwind variant that does not exist emits no CSS and no error**, and
  passes lint, typecheck and build. It caused TD-28 and TD-29. Any new breakpoint
  or variant must be verified against the compiled stylesheet at
  `.next/static/css/*.css` — and there are **two** bundles; the small one is not
  the main one.
- **Do not treat `SHOW_QUICK_WORKOUT_ENTRY` as dead code.** It is `false` on
  purpose and guards a deliberately unreachable branch that `LIVE-06` resumes
  from. This is a live trap for Phase 15 cleanup.
- **The session screen re-renders broadly.** No `React.memo` anywhere and
  `groupSetLogsByExercise` rebuilds every object per call, so Phase 10 should
  animate it with CSS rather than JS.
- **`InitialLoadAnimation` must keep `children` mounted from the first frame.**
  It previously withheld them for 3.4 s and blocked every page query (TD-03).
- **Dark mode is class-based**, not `prefers-color-scheme`. Emulating the media
  query will not produce dark screenshots.
- **The 16px mobile font size on `input` is an accessibility mitigation**, not a
  style choice — overriding it re-introduces iOS zoom-on-focus (TD-29).
- **Never run `npm run verify` or `npm run build` while the dev server is up.**
  Same `.next/`; the running server then 500s on every route and the app goes
  black in a way that looks like an auth bug.

- **A backend restart mid-run fails the regression sweep.** The preconditions
  run once per worker; a watch-mode restart during a run signs the app out and
  every later check fails. The failure names the request — re-run once the
  backend is stable, and do not record it as a defect.
- **Reported, not fixed** in Phase 13: the search suggestions' full combobox
  keyboard contract (a11y 6), making the sidebar's "Soon" items inert (a11y 13),
  and regrouping the session set row's inputs for desktop (final 5). Each needs
  behaviour or a design decision the locked system has not made.
- **Seven silent-failure instances** so far (Findings 53): undefined classes,
  and `group-hover:` with no `group`. Any class not obviously Tailwind's own must
  be traced to the element it is meant to reach.
- **Budget `viewport - 256` for any multi-column rule inside the protected
  shell** (Findings 47). `md:` fires at a 768 viewport, where the main column is
  512px. This has now caused three separate defects.
- **The sweep has two known false-positive classes** (Findings 49): `.sr-only`
  text always reports as clipped, and a bare `<input type=radio>` reports a small
  target when its wrapping `<label>` is the real one. Do not re-investigate them.
- **`npm ci` cannot be validated from Windows** (Findings 51). `npm ci --dry-run`
  does not check the Linux-only optional-dependency branch, so a green local run
  proves nothing about CI.
- **The sweep is slow against `next dev`** — 57 minutes for 283 checks while
  the owner was working on the same machine. Use `--grep` to re-run a family.
- **A destructive confirmation is dominant by construction** (Findings 44).
  §4.3 rule 5, §11.9's "never dominant" and §11.9's "both full width when
  stacked" cannot all be satisfied at 390. Do not resolve it at a call site.
- **The stepper's horizontal layout needs `lg`, not `sm`.** At 768 the shell's
  main column is 512px. Do not move it back (Findings 39).
- **`ClassicalLoader` is no longer gold**, by rule (§4.3 rule 3). If the owner
  wants the gold spinner back, that is a v1.0 amendment and should be recorded as
  one — not reverted quietly in a later batch.
- **`--surface-sunk` cannot be used as a well on `--background`** (Findings 35).
  Later batches converting `panel` surfaces to `ruled` will hit this.
- **`npm install` or `uninstall` on Windows drops the `@emnapi` lock entries**
  (TD-33) — it happened again when TD-32's dependencies were removed. Diff the
  lock after any such command and restore them before pushing.
- **A heading without a `type-*` class now renders in the system font.** The
  Bebas element rule that caught unranked headings is gone (Phase 15), and the
  body face does not reach `<html>` (TD-39). Give every new heading — including
  one a primitive renders — its §5.3 rank, and drop any `text-*`/`font-*`
  utility beside it, which would override the rank (Findings 72, 74).

## Do Not Revisit

- The location of screenshots and the `.gitignore` split (`before/` committed,
  `after/` ignored) — settled in Phase 0.
- `tailwind.config.ts` — it must not be created; tokens live in `globals.css`.
  Phase 3 restates this: Tailwind v4 here is CSS-first, and a config file is
  loaded only via `@config`, which nothing does. It would be silently ignored.
- MUI — it is not in this stack.
- **New breakpoints.** Design System v0.1 introduces none, deliberately, which
  removes the TD-28/TD-29 risk class from the restyle entirely. v4 defaults
  `sm`–`2xl` only.
- **The `sm`/`md` cliff.** 290 `sm:` sites against 51 `md:` and 26 `lg:` is
  pre-existing. Redistributing it is a layout rewrite, not a restyle. Phase 9
  will find 320–639 all rendering identically; record it, do not fix it.
- **The 16px input font size below `md`.** iOS zoom-on-focus mitigation (TD-29),
  preserved in every input rule in v0.1.
- **Renaming the shadcn tokens.** v0.1 §3.1 keeps the existing names and
  re-values them, so 700+ utility occurrences and 31 primitives keep working and
  the `neutral-*` migration targets utilities that already exist. Renaming would
  mean editing every primitive before a pixel changed.
- **Replacing Radix primitives with styled `div`s to get a look.** `Progress` was
  nearly swapped for a plain bar in Phase 4; that would have silently dropped the
  `progressbar` role and value. Style the primitive, do not replace it.
- **Crimson as the action colour.** Tested in Phase 4, rejected by Phase 5 and by
  measurement, replaced in v1.0. Do not reopen it; the primary control is ink.
- **"Pick a better gold" to separate honour from warning.** No values separate
  them under CVD (Findings 25). v1.0 removes the collision instead.
- **WCAG contrast ratio as a test of whether two colours look different.** It
  measures luminance only (Findings 26).
- **Gold on completion anywhere.** The masthead percentage, each exercise's
  "Complete" label, the completed set number and the progress bar are all
  `--success` (§4.3 rule 2). Gold is for records and improvements only.
- **Floating pill actions.** The routines "+ New" pill is gone; §7 keeps
  `rounded-full` for avatars. The rectangular action shows at every width.
- **Dashed placeholder boxes for empty states.** Search, Workouts and the
  session recap put the message on the page grid.
- **A standalone session action panel with its own progress bar.** §11.8: the
  actions are an inline row and progress is stated once, in the masthead.
- **Nesting a `<button>` inside a nav `<a>`.** One anchor per destination
  (`Button asChild` → `Link`) with `aria-current`.
- **Whole-control opacity for disabled.** `--ink-3` on `--surface-sunk`
  (§4.3 rule 7); tabs, accordion and the session actions no longer fade.
- **The `sm`/`md` cliff, now measured.** 320/375/390/430 are byte-identical on
  all eight routes, both themes; nothing changes until 640 (Phase 9). §10.3 says
  record it, not fix it — it is recorded.
- **`truncate` on the dashboard stat caption.** It cost a letter to save 2px at
  320. It wraps.
- **Settings grids at `md`/`sm`.** They produced ~60px field cells at a 768
  viewport (Findings 47). They step at `lg`, and the weight row at `xl`.
- **Tinting an overlay by variant.** The toast's five coloured cards were five
  surfaces for one component (Findings 45). Variants change a `.mark`, not the
  surface.
- **A second dialog model.** `alert-dialog` now matches `dialog` line for line.
  Diverging them is how one component ends up with two behaviours in one theme
  (QA 2).
- **`bg-black/50`, `bg-black/40` or `bg-white/40` as a scrim.** `--scrim` is
  defined per theme; the inverted pair flashed white over the dark theme.
- **Hardcoded gold hexes.** `#FFD700` / `#B8860B` in `loading-overlay` were the
  last ones in the app.
- **Amber, orange or blue as a control colour.** Settings' submit, the stepper
  and the zoom slider all had one; the palette has no such role. Actions are ink
  (§4.3 rule 1), completion is `--success`, and gold marks only what is earned.
- **Translucent or blurred bands.** The wizard footer and both step bands went
  opaque, following Batch 1's topbar. Nothing in v1.0 is translucent.
- **Pill-shaped fields or chips.** The search input and the filter chips both
  were; §7 keeps `rounded-full` for avatars only.
- **Restyling the native `<select>`s into Radix `Select`s.** They now match
  `Input` exactly. Swapping the component is a markup and event change, outside a
  UI-only scope.
- **Dropping the 16px field text below `md`.** It is the iOS zoom-on-focus
  mitigation (§2.4, TD-29), and the filter selects are the control most likely to
  be tapped first.
- **Boxing a list again.** §11.5 makes `ruled` the default and this batch
  converted every list in the app to it. A card around a list of cards is the
  pattern that was removed; do not reintroduce it for "separation".
- **Badging read-only data.** Metric badges, weight badges, weekday badges and
  frequency badges were all converted to Space Mono runs (§11.12). A bounded box
  means "editable" in this system.
- **Six columns in the dashboard stat band, or its third column at `sm`.** Both
  measured to overflow (Findings 34). The band is 2 columns to `lg`, 3 above.
- **The `--ss-*` aliases and `.bg-marble-light`.** Deleted, with all consumers
  migrated. Do not resurrect them; `--honour` / `--honour-strong` /
  `--destructive` / `--warning-strong` are the roles they pointed at.
- **`progress`'s `gold` variant.** Retired with its last call site. A gradient
  fill breaks §4.3 rule 6 and gold on ordinary progress breaks rule 3.
- **Clicking "Finish Session" to open a dialog.** It only confirms when sets are
  outstanding; with everything complete it finishes immediately
  (`use-session-management`). Findings 22.
- **Locating a Radix menu's trigger by role while the menu is open.** It is
  `aria-hidden` then (Findings 61); measure it before opening.
- **Reading a bounce to `/login` as an expired sign-in.** Read the auth requests
  the precondition names (Findings 60).
- **Loosening a sweep assertion to get a green run.** The nine remaining
  failures are TD-36; the fix belongs in the app.
- **Fixed column minimums on the set row below `sm`.** They needed 273px where
  the row has 228 at 320 (Findings 66). Below `sm` the columns size to their
  captions; the minimums apply from `sm`.
- **The global `h1`–`h4` element rule.** Deleted in Phase 15 (§5.5). Rank is a
  class; heading level is structure. Do not bring back an element selector to
  style headings.
- **`rounded-lg`, `rounded-xl` and bare `rounded`.** All were 4px; they are
  `rounded-md`. §7 has three radii and `full`.
- **Hand-rolled spinners.** `Loader2` inside a control, `ClassicalLoader` at
  page level.

## Next Task

**The restyle plan is complete** — Phase 15 was its last phase. What remains
needs the owner:

1. ~~Confirm deleting the thirteen zero-importer files~~ — **done**, TD-32
   closed on 2026-09-13.
2. **TD-38**: one batch for routine detail, the error boundaries and
   `not-found`, and the two stale loading skeletons, using existing patterns.
3. **TD-39**: decide whether unranked text should become Oswald, as §5.2 says.
   The change is one class on `body`; the review is every screen in both themes.
4. **TD-36**: the mobile drawer's close control and tab order — behaviour, so
   outside a UI-only plan. Its nine checks are the only red ones in
   `npm run ui:regression`.
5. **Commit.** Nothing since `dc13b1f` is committed.

Reported, not fixed, and still open: the search combobox keyboard contract,
inert "Soon" items, set-row desktop regrouping.
