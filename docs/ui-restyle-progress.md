# UI Restyle — Progress

Companion to [ui-restyle-plan.md](ui-restyle-plan.md). Updated at the end of every
phase or implementation batch, per the plan's handoff protocol.

## Current Phase

**Phase 0 and Phase 1 complete. Phase 2 half complete: the Opus visual
exploration is delivered; the second opinion is outstanding.**

No UI was modified: no component, style, token, hook or behaviour was changed.
What was written is documentation, screenshot tooling and configuration.

## Completed

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

Still outstanding for Phase 2: the **second, independent exploration**. The plan
runs two models in parallel on purpose; one direction pair is not the phase.

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

Still no UI file touched: no component, style, token, hook or behaviour changed.

**Unrelated uncommitted work is present in the tree** from the LIVE-10
stale-session sessionwork — `app/(protected)/layout.tsx`,
`lib/api/hooks/useWorkoutSession.ts`, `features/workout/stale-session-recovery-dialog.tsx`,
`lib/utils/session-recovery.ts` and its test. Not mine, not touched.
`lib/api/hooks/useWorkoutSession.ts` currently fails `prettier/prettier` on line
endings; left alone rather than reformatting someone else's in-flight change.

## Visual Decisions

No *design* decision has been taken. Phase 1 is an audit.

Design directions are proposed but **not selected** — that is Phase 3's call,
after the second exploration lands.

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

The four that should shape Phase 2 and 3:

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

## Known Risks

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

## Do Not Revisit

- The location of screenshots and the `.gitignore` split (`before/` committed,
  `after/` ignored) — settled in Phase 0.
- `tailwind.config.ts` — it must not be created; tokens live in `globals.css`.
- MUI — it is not in this stack.

## Next Task

**Finish Phase 2: the Qwen 3.8 Max exploration.** Its output goes to
`docs/ui-direction-qwen.md`.

Do not show it [ui-direction-opus.md](ui-direction-opus.md). Two independent
explorations are the point; priming the second with the first collapses them into
one opinion wearing two names.

Inputs are ready: the 60 baseline images, the inventory above, and
`app/globals.css`. Tell it the three things the inventory establishes and that
would otherwise be re-derived wrongly:

- The token palette is greyscale; the brand exists only outside it. A direction
  that "adjusts the palette" does not describe real work here.
- Adaptation stops at `md`. Any direction must state what 1280+ is for.
- 436 raw palette classes will not move when tokens change. Sizing a direction
  without accounting for that will underestimate it badly.

Then Phase 3 selects one direction and builds Design System v0.1.

Every remaining session has a ready prompt in
[ui-restyle/session-prompts.md](ui-restyle/session-prompts.md) — one phase each,
in order, including the ones that go to Qwen and Sol rather than Claude Code.

Open items carried forward, none blocking:

- Commit `docs/ui-restyle/screenshots/before/` (17 MB, 60 images) once reviewed.
- Capture the component/state shots from `ui-restyle/capture-manifest.md`.
- Run the responsive sweep and record defects under Findings.
- `lib/api/hooks/useWorkoutSession.ts` fails `prettier/prettier` on line endings.
  Pre-existing, from the LIVE-10 work, not touched here — but `npm run lint` is
  red until someone owns it.
