# SUNNSTEEL — UI/UX Audit & Redesign Plan (2026-10-08)

Owner-approved on 2026-10-08. Analysis and plan only; implementation follows
the phased roadmap in §11. Structural changes await the §27 amendment.

---

## 0. Context

The owner is concerned that hierarchy, grouping and state are communicated
mostly through text, typefaces and hairlines, so screens — the Active Workout
above all — feel text-heavy and hard to scan in the gym. This audit verifies
that diagnosis against the code, the documented design system
(`docs/ui-design-system.md` v1.0 LOCKED + amendments §18–§26, v1.1 "Ledger and
Craft") and rendered captures, then proposes one coherent strategy.

**Governing constraint discovered in the repo.** The design system is LOCKED;
`CLAUDE.md` and the project skill `.claude/skills/sunnsteel-design/SKILL.md`
say general design-skill advice that contradicts a documented rule must become
a recorded **amendment** (like §26), never a local exception. Every structural
change below is therefore packaged as one proposed amendment, **§27 "Train
focus"**, plus defect fixes that need no amendment.

---

## 1. Executive summary

**Verdict on the owner's diagnosis — partly right, wrong about the cause.**

| Owner's assumption | Finding |
| --- | --- |
| UI relies on text, type and subtle borders | **True and deliberate** (§1, §11.5: identity "carried by structure — inscription type, hairline rules instead of card boxes"). Not the defect by itself |
| Too much font-weight hierarchy | **Mostly false.** The noise is *face and voice switching*: one exercise block uses ~10 font/colour treatments across 6 ranks (Oswald caps, Space Mono, Source Sans, ink/ink-2/ink-3, success, honour) |
| Text-heavy without excess information | **True — root cause is repetition.** The prescription is constant per exercise but restated per row: "Target: 8", "Target: 60 kg", "Optional", "RIR 2", "SET N" on every set → ~5 strings × 12–17 sets |
| Weak grouping / exercise boundaries | **True — root cause is a figure-ground inversion.** Each *set* is a boxed sunk well with bordered fields; the *exercise* (the parent) is only a heading and a 1px `rule-faint` hairline. The strongest containers sit on the least important level |
| Unclear active/completed/pending states | **True.** No current-set state exists at all (code-confirmed); in-progress and not-started exercises are identical; a completed set differs only by a 3px rule, a 20px check and the label colour; a pre-filled target weight looks identical to a logged one |
| Needs more colour | **False.** The four accents each have one job and v1.0 measured what happened when an accent did two (crimson read as "a page full of errors"). The fix is composition and tonal surfaces, not new hues |
| Overly compressed mobile controls | **True at 320**, mostly fine at 390 (Spanish at 320: title truncates, captions wrap to two lines, "COMPLETO" clipped) |
| Insufficient emphasis on the current task | **True.** At 390 the first ~440 of 844px are masthead, stats, a warning shown from set 0, Discard + full-width filled **Finish Session**, and the glossary line. The screen's single filled control is the terminal action, not the work |

**Five root causes** (each solved once, globally where possible):
1. **Containment is inverted** on the workout screen (boxes on sets, hairline on exercises).
2. **Prescriptions are repeated per row** instead of stated once per group (workout set rows, history rows, builder band).
3. **No state vocabulary** for *current / pending / done / skipped*; each screen improvises (history: coloured rule + caps word; workout: rule + check + caps "COMPLETE"; routines: green text; week strip: glyphs).
4. **Too many typographic voices per block**, incl. uppercase `type-label` inside repeated rows, which §5.3 already forbids ("SET 1", "COMPLETE", history "ABORTED").
5. **Terminal / secondary actions out-rank the task** (Finish Session; one filled "Start" per routine card, contrary to §4.3 rule 1).

**Recommendation (§9):** a hybrid. Direction A (foundations, low risk) across
the app; Direction C (interaction redesign) for the Active Workout only; a
light Direction B (structured rows + one status primitive) for list-heavy core
screens (History, Routines, Exercises, Builder). No new colours, fonts,
dependencies or breakpoints. Sequenced after the in-flight `LIVE-21` lands.

---

## 2. Architecture and design-system overview

- **Stack:** Next.js 15.5 App Router (effectively a client SPA), React 18.3,
  TS strict, Tailwind v4 CSS-first (`app/globals.css`, no config file — must
  not add one), shadcn/Radix primitives in `components/ui/`, TanStack Query,
  next-intl (EN/ES, ES 20–30% longer), framer-motion (limited), lucide-react +
  `ClassicalIcon`. Vitest in Node only (no component rendering). Playwright
  regression sweep (621 cases; scoped by `-g`) + portfolio captures.
- **Is it a coherent system?** Yes — unusually so. Tokens are semantic and
  measured (§4.4 contrast table), colour roles have one job each (§4.3), five
  faces have assigned jobs (§5), elevation is tonal (§8), motion is tokenised
  (§9), display preferences (higher contrast, larger controls/gym mode §22) and
  long-content patterns (§20–§21) exist. The gaps are *application* gaps, not
  missing foundations.
- **Themes:** "Stone" (light, warm) and "Night" (dark, warm near-black). Not
  black-and-white: warm neutrals + success green, honour gold, warning amber
  (mark-only), destructive crimson, six rank pigments (identity only).
- **Surfaces (dark):** sunk `#070503` < ground `#0f0c08` < surface `#1a1612`
  < muted `#221e1a`; rule `#443f39`, rule-faint `#2f2b26`. Ground→surface is a
  small step (ΔL 0.05); it is enough for a region, too little to carry
  hierarchy alone at arm's length — which is why the set wells (sunk) read
  stronger than anything on surface.
- **Faces:** Cinzel 600 (inscriptions), Bebas (large numerals), Source Sans 3
  (body), Oswald (titles/labels/buttons), Space Mono (standalone data).

### Doc ↔ implementation mismatches found
| # | Mismatch | Evidence |
| --- | --- | --- |
| M1 | `type-label` (uppercase, tracked) inside repeated rows, which §5.3 forbids | `set-log-input.tsx:255-278` ("Set N"), `exercise-group.tsx:363-365` ("Complete"), history status words (capture `history-390-dark`) |
| M2 | `mark-fill` documented as set-row only; actually on the exercise section, set row uses plain `mark` | `globals.css:545` vs `exercise-group.tsx:214` |
| M3 | §11.8 "state overall progress once": masthead shows **Sets x/y and Progress %** | `session-header.tsx` |
| M4 | §11.8 "primary action inline in the masthead region, not a standalone row with a full-width button": Finish is a full-width filled control in its own row on phones | `session-action-card.tsx:39-93` |
| M5 | §11.11 "inscription wraps, never truncates": live title line-clamps (`line-clamp-3/2/1`) and truncated in ES at 320 | `session-header.tsx`, capture `es-session-320-dark` |
| M6 | §4.3 rule 1 "a repeated list control is never primary": every RoutineCard renders a filled `default` Start/Resume | `features/routines/components/RoutineCard.tsx:229,254` |
| M7 | §23.3 "a number inside a sentence takes the sentence face": exercise rows set "Last trained" + Space Mono date that wraps mid-phrase | capture `exercises-390-dark` (baseline, retained in v1.1) |
| M8 | §5.3 "Cinzel at most twice per screen": builder shows 3 Cinzel inscriptions + step name stated 3× | portfolio `routine-builder.png` |
| M9 | `.type-body` (the §5.2 Body rank) is **used but never defined** — 20 uses in 9 files render in the inherited face | `features/messages/{conversation-list:86,conversation-thread:491,request-panel:69,attach-picker:204,send-in-message:239}`, `messages/new/page.tsx:74,94,97`, onboarding |
| M10 | `.type-data-emphatic` used, not defined (meant `type-data-strong`) | `features/progress/personal-goals.tsx:133` |
| M11 | `.duration-slot` (§5.4, fixed-width live durations) defined, **0 uses** — elapsed time and rest countdown reflow | `globals.css:608` |
| M12 | §11.5 Card variants `ruled` and `sunk` never built; `Card` is panel-only (30 uses) vs ~80 hand-rolled `border border-rule` boxes in 62 files | `components/ui/card.tsx:14-17` |
| M13 | Routine wizard still on stock shadcn: `tabs.tsx` segmented control (`bg-muted rounded-md`, 3px ring/50 focus), 2 gradient scroll-fades, ~12 `rounded-md` boxes, `text-muted-foreground`, `/NN` fills, `zoom-in-95` | `components/ui/tabs.tsx:29,45`, `features/routines/wizard/BuildDays.tsx:295,298`, `WizardExerciseCard:284,293,314,364`, `SetRow:152` |
| M14 | Sidebar active row takes a `bg-surface` fill on top of the marker (§11.10: "no filled block") | `features/shell/components/Sidebar.tsx:419-421,575` |
| M15 | Icon family switches per view: Dashboard = classical `pillar-icon` in Sidebar, lucide `Home` in BottomNav; sidebar mixes classical (7) and lucide | `Sidebar.tsx:81-149`, `BottomNav.tsx:32-38` |
| M16 | 101 lucide icons with neither `aria-hidden` nor a label | top: `wizard/components/SetRow.tsx` (12), auth forms (10), `RoutineCard.tsx` (6), `select.tsx` (4) |
| M17 | Dialog/AlertDialog descriptions are raw `text-sm text-ink-2`, not `type-body-sm`; `HeroSection` subtitle raw `text-sm sm:text-base`; BottomNav labels raw `text-xs font-medium`; 138 raw `text-*` sizes in 51 files | `dialog.tsx:135`, `alert-dialog.tsx:115`, `HeroSection.tsx`, `BottomNav.tsx:85` |
| M18 | Empty / inline-error / loading states have no single pattern: `EmptyModule` (18 uses) vs ~40 bespoke empties; no shared inline error (`PageError` local to `own-activity.tsx:55`); 6 `loading.tsx` disagree (dashboard spinner vs skeletons; 3/6 announce status; `history/loading.tsx:5` double gutter) | `components/layout/empty-module.tsx`, `app/[locale]/(protected)/**/loading.tsx` |
| M19 | Docs drift: §11.2 code block still says `type-body-sm` = Oswald 13/1.45 (code: Source Sans 14/1.5); CLAUDE.md lists a non-existent `heading-classical` utility | `docs/ui-design-system.md` §11.2, `CLAUDE.md` Gotchas |

**Clean areas (verified):** 0 raw palette classes, 0 generic shadows, 0
`backdrop-blur`, 0 `transition-all`, 0 opacity-disabled, old `h1–h4` Bebas
rule and `--ss-*`/gold/marble leftovers all gone, hex literals only where
platform/SVG masks need them, higher-contrast CSS duplicated correctly.

---

## 3. Inventory of audited screens

Evidence: **code** = explorer trace with file:line; **cap** = existing capture
(390/1440, dark/light, ES 320 where noted); **—** = code only.

| Pri | Route | Main owner | Evidence |
| --- | --- | --- | --- |
| P0 | `/workouts/sessions/[id]` live workout, rest bar, finish/discard, recap | `features/workout/*`, page | code + cap (live run, 390/1440, ES 320, gym mode) |
| P1 | `/routines/new`, `/routines/edit/[id]` (wizard) | `features/routines/wizard/*`, `components/ui/stepper.tsx` | code + cap (390, 1440) |
| P1 | `/routines`, `/routines/[id]`, `/routines/discover` | `features/routines/components/*` | code + cap (390) |
| P1 | `/exercises`, `/exercises/[id]` | `features/exercises/*` | code + cap (390) |
| P1 | Shell: Sidebar, drawer, BottomNav, Header, search, active-session banner | `features/shell/components/*`, protected layout | code + cap |
| P1 | `/workouts` landing | page | code |
| P2 | `/dashboard` | `dashboard/components/*` | code + cap (390) |
| P2 | `/workouts/history`, `/history/[id]` | `features/workout/workout-history-*`, `history-*` | code + cap (390) |
| P2 | `/progress` (+ strength, load, workouts, body) | `features/progress/*` | code + cap (390) |
| P2 | `/schedule`, `/achievements`, `/activity`, `/notifications` | features of same name | code (+ cap schedule) |
| P3 | `/settings/*` (5 tabs), `/profile/[[...userId]]`, `/search`, `/messages/*`, `/welcome`, `/moderation` | features of same name | code (+ cap settings) |
| P3 | Auth (login, signup, forgot/reset, callback), public `/members`, `/shared/routines|sessions/[token]`, `/offline`, 404, error boundaries | `(auth)`, `(public)`, `RouteError` | code |

All routes listed in `app/[locale]/**/page.tsx` (46) are covered; none was skipped.

## 4. Global UI/UX findings

| ID | Finding | Evidence | Class |
| --- | --- | --- | --- |
| G1 | **No state vocabulary.** Status is drawn ≥5 ways: coloured left rule + caps word (history), rule + check + caps "COMPLETE" (workout), green text (routines), tinted glyph + legend (week strip), heatmap shades only (load) | `workout-history-list.tsx:166`, `exercise-group.tsx:363`, `RoutineScheduleNote.tsx:51`, `muscle-group-heatmap.tsx:25-28` | C |
| G2 | **Primary-action discipline breaks both ways.** N+1 filled buttons on /routines (filled Start per card + Create); dashboard rows add a filled Start beside the card's own primary; while Schedule, Discover, Exercises and an idle Routine detail have **no** filled action | `RoutineCard.tsx:229,254`, `TodaysWorkouts.tsx:240` | C |
| G3 | **Toggles look like actions.** Filters, ranges, views and reactions toggle `secondary`↔`outline`/`ghost` — the same buttons used for commands | `WorkoutFilters.tsx:92-95`, `exercise-catalog.tsx:518-549`, `strength/page.tsx:155-160`, schedule/moderation toggles | C |
| G4 | **Four error styles, ~half without retry**: RouteError, boxed panel, red-bordered box, plain red text; history detail shows raw `String(error)` (fallback never fires); `WorkoutsList.tsx:73` hardcodes English "Error: "; login shows Supabase's raw English message in a red mark that `AuthNotice` says should be a warning | `history/[id]/page.tsx:69-71`, `WorkoutsList.tsx:73`, `SupabaseLoginForm.tsx:103-117` | C |
| G5 | **Two empty styles** (EmptyModule rows vs centred dashed boxes) and **three loading styles** (ClassicalLoader, `Loader2`, plain text); history pages show plain text although `loading.tsx` has a ruled skeleton | `volume-trends.tsx:164,223`, `session-comparison.tsx:183`, `strength/page.tsx:184` | C |
| G6 | **Masthead fragmentation.** HeroSection on 13 routes; 15 files hand-copy its markup (some drop the double rule); several inscriptions are slogans, not page names; on phones the running head is hidden so the slogan is the only page identity | `HeroSection.tsx`, `settings/layout.tsx`, `onboarding-flow.tsx`, messages `heroTitle: "Forge Your Path"` | C / S |
| G7 | **Repetition instead of structure**: per-row captions/labels restate what a column header or group line could say once (workout sets, history Started/Ended/Duration/Volume/Sets per row, exercises' 4-line rows) | captures `history-390-dark`, `exercises-390-dark`, live | C |
| G8 | **Containers inverted or nested.** Workout boxes sets not exercises; wizard nests Card → day Card → exercise Card (3 levels from `sm`); settings is a stack of Cards while the rest of the app is ruled | `BuildDays.tsx:354`, `WizardExerciseCard.tsx:267` | C |
| G9 | **Typographic voice count** high in repeated rows; `type-label` caps inside rows; mono dates inside sentences; undefined `type-body` (M1, M7, M9) | see §2 | C |
| G10 | **Interaction semantics**: history rows are `div role="button"` (no open-in-new-tab); routine names aren't links (only via ⋮ menu); routine "Completed" toggle hard-`disabled` with state by colour only; no "New message" entry point; Search page has no search field of its own | `workout-history-list.tsx:138`, `RoutineCard.tsx:184,301,312`, `conversation-list.tsx` | C |
| G11 | **Save models differ inside Settings**: auto-save (language, messaging, week start) vs Save buttons (privacy, time zone) in the same tab | `time-calendar-card.tsx:145,166` | C |
| G12 | **i18n leaks**: hardcoded English `aria-label` "Loading today's workouts"; "Error: "; public member page hardcodes KG/CM | `today-actions.tsx:56`, `members/[identifier]/page.tsx:50-54` | C |
| G13 | **Spacing doubles** on public shares (`main` `px-3 py-6` + page `px-4 py-8`) and `history/loading.tsx` (extra `p-4`) | `(public)/layout.tsx` | C |

What is **not** a problem (verified): token discipline (0 raw palette/shadow/blur/transition-all),
contrast values (§4.4/§22.2 measured), long-content patterns (§20), page tabs (§21),
display preferences (§22), dashboard hierarchy (§25), unread-as-a-word in notifications/messages,
dialogs (§11.9), Radix semantics preserved.

## 5. Screen-by-screen audit (except the workout, §6)

- **Dashboard (P2)** — Best-composed screen (§25). Issues: dashboard rows' filled Start beside the card's primary (G2); per-section errors differ (StatsOverview filled retry, WeekStrip boxed panel, TodaysWorkouts no retry); spinner loading unlike every other route. Light touch only.
- **Workouts landing (P1)** — Four buttons in one row with three variants (default/outline/outline/secondary); `Loader2` loading; skeleton draws 3 buttons for 4. → one filled (Train another day), others as links in a ruled list.
- **Routines list (P1)** — Filled Start per card (M6); 4 controls per row incl. a permanently disabled Completed toggle shown by colour; name not a link; "Recent" filter = "All"; hardcoded "Error: ". → outline Start, name links to detail, Completed as `StatusMark` text, remove dead toggle/filter (owner confirm).
- **Routine detail (P1)** — Three equal outline header buttons (Favourite, Completed, Edit; mixed sizes); no filled action when idle — Start of *today's* day should be the filled one; fetch error collapses into "not found".
- **Builder / wizard (P1)** — Heaviest screen after the workout: 3 stacked headings (+ step name ×3), 3 nested Card levels, stock shadcn tabs/gradients/`rounded-md`, SetRow with 12 buttons (8 steppers) per set, new vs edit width mismatch, edit's custom error. → one inscription + stepper owns the step title; day = ruled section, exercise = the one box (same containment rule as the workout, DS2); set rows use `ledger-columns` header; §21 tabs for days.
- **Discover (P1)** — h1 not a HeroSection; 5 filter selects always open (§20 says fold); error box; plain-text empty.
- **Exercises / detail (P1)** — Toggle-as-button (G3); 4-line rows with mono date wrapping (M7); boxed error, dashed empty box on detail.
- **Shell (P1)** — Sound (grouped nav, sliding markers, pinned Settings). Fix M14 active fill, M15 icon families, BottomNav label rank; search page lacks its own field.
- **History list/detail (P2)** — Rows as `div role="button"`; 5 label/value lines per row with seconds; plain-text loading; detail error bug (G4). → link rows, one summary line + StatusMark, column header ≥sm, RouteError/InlineError.
- **Progress (P2)** — Ruled and well-structured; issues: two empty styles, boxed chart panels and accordion cards in Strength, heatmap intensity by shade only (needs value labels/legend numbers), toggles-as-buttons for ranges.
- **Schedule (P2)** — §26.8 fixed rows; 3 buttons per row (Start outline, Skip, Reschedule ghost) and no filled action — today's Start should be filled.
- **Achievements (P2)** — Only the ledger has an error state; rank/comeback/milestones vanish silently on failure.
- **Activity / Notifications / Messages (P3)** — Ruled, word-not-colour unread (good). `type-body` undefined across messages (M9); no "New message" entry; own messages indistinguishable except author name (acceptable for the ledger idiom, flag only).
- **Profile (P3)** — Another member's header: up to 5 mixed-size controls in one row (§24.7 already notes it); errors fall into "not found".
- **Settings (P3)** — Card stack (acceptable per §11.5 "panel for forms"), mixed save models (G11), "Click the image to upload" hidden affordance.
- **Search / Welcome / Moderation (P3)** — Search: no own field; Welcome: "Step x of y" text only, no double rule; Moderation: up to 7 outline buttons per queue row → overflow menu.
- **Auth & public (P3)** — Login error colour/raw message (G4); doubled padding on shares (G13); public member page hardcodes units (G12); public error pages don't use RouteError.

---

## 6. Active Workout — deep dive (P0)

Sources: code trace of `app/[locale]/(protected)/workouts/sessions/[id]/page.tsx`,
`features/workout/{session-header,session-action-card,exercise-group,set-log-input,rest-timer-bar,session-notes}.tsx`,
`hooks/{use-set-log-form,use-compact-workout,use-collapsible-exercises,use-rest-timer}.ts`,
`lib/utils/{session-rounds,session-progress.utils}.ts`; captures
`.claude-worktrees/redesign-evidence/live/01–17` (390 dark, live run 2026-10-02),
`live/10-11` (1440), `after-w8/es-session-320-dark`, portfolio
`live-session*.png` (1440, 2026-10-03).

### 6.1 Current anatomy (390px, session start)

```
y   0 ┌ topbar: ☰  [Search…]  🔔 ☼ (E) ─────────────────────┐
   64 │ ← FULL BODY            Progress    ⊕(gym)             │  pinned masthead
      │   FOUNDATIONS┘         0%                             │  (Cinzel, clamps)
      │   Full Body C                                         │
  160 │ Elapsed      Sets       Started                       │  2nd stats row
      │ 33s          0/12       05:22 PM                      │  (progress ×2)
  220 ╞═══════════════════════════════════════════════════════╡  double rule
  240 │ ▌⚠ Complete all sets to finish the session            │  warning from set 0
  290 │ [🗑 Discard]  [██████ FINISH SESSION ██████]          │  ← only filled control
  375 │ Terms: RPE · RIR · Set kinds                          │
  425 ├───────────────────────────────────────────────────────┤  hairline = exercise boundary
  450 │ ⌄ Front Squat                                  •••    │  Oswald 16
      │   0/3 sets                                            │  mono ink-3
  495 │ ┌SET 1⌄┬[Reps ]┬[ 60  ]┬[RPE ]┬ ☐ ┐                  │  sunk well, boxed fields
      │ │RIR 2 │Target:8│Target: 60 kg│Optional│  │            │  captions per field
      │ │Last time                   8 reps · 60 kg │         │
      │ └──────┴───────┴───────┴──────┴───┘                   │
  625 │ ┌SET 2…  (identical to set 1 — nothing marks "next")    │
  715 │ ┌SET 3…                                               │
  844 └ (rest bar overlays from bottom when resting)          ┘
```

The first loggable field sits at **y≈510 of 844** (60% down the screen).

### 6.2 Scorecard — can the user instantly identify…

| # | Question | Today | Evidence |
| --- | --- | --- | --- |
| 1 | Current exercise | ✗ — no state; all exercises expanded and equal | `use-collapsible-exercises.ts` (all expanded), no active class anywhere |
| 2 | Active set | ✗ — no current-set treatment for single exercises; "Up next: set N" text only in supersets | `page.tsx:384-405`, `session-rounds.ts:140-157` |
| 3 | Values to enter | ◐ — bounded fields (§26.5) are clear; but a pre-filled target weight ("60") is indistinguishable from a logged value | captures 01/03 |
| 4 | Completed work | ◐ — 3px green rule + 20px check + green "SET N"; row tone unchanged; completed exercises stay fully expanded | `set-log-input.tsx:226-231` |
| 5 | Upcoming work | ✗ — identical to current | — |
| 6 | Next action | ✗ — the filled control is Finish; after a tick focus is not moved; single exercises don't scroll | `page.tsx:384-405` |
| 7 | Superset relationships | ✗ — text only ("Superset A1 · Round 2 of 3"); each member keeps its own hairline; builder has a shared rule, session doesn't | `exercise-group.tsx` roundLine |
| 8 | Overall progress | ◐ — stated twice (x/y and %), no bar; per-exercise x/y in mono | `session-header.tsx` |

### 6.3 Findings

| ID | Finding | Class | Principle |
| --- | --- | --- | --- |
| W1 | **Inputs are `disabled` while `saveState==='saving'`** (`set-log-input.tsx:270,351,410,444,468`). Disabling a focused input blurs it; on phones that dismisses the keyboard mid-entry after the 3.5s autosave debounce | Confirmed in code; device impact needs validation | Error prevention, input efficiency |
| W2 | No current-set / current-exercise state | Confirmed (code) | Visibility of system status; figure-ground |
| W3 | Containment inverted: sets boxed (sunk well + bordered fields), exercise = hairline | Confirmed (code + capture) | Common region, figure-ground |
| W4 | Prescription repeated per row (Target ×2, Optional, RIR, SET N) → text-heavy | Confirmed | Redundancy, cognitive load |
| W5 | Finish Session is the screen's only filled control, full width, from set 0; warning "Complete all sets…" shown from set 0 | Confirmed | Primary action = current task; M4 |
| W6 | Overall progress stated twice; no bar | Confirmed | §11.8 (M3) |
| W7 | Completed exercises don't fold; completed and pending rows have equal weight → scrolling past finished work | Confirmed; **LIVE-21 (in flight) adds auto-fold** | Progressive disclosure |
| W8 | Superset membership is text-only in the session | Confirmed | Common region / continuity |
| W9 | "COMPLETE"/"COMPLETO" status label clips at the container's right edge (390 EN, 320 ES, 1440) | Confirmed (captures) | Overflow |
| W10 | Masthead title line-clamps and truncates in ES at 320 | Confirmed (capture) | §11.11 (M5) |
| W11 | Exercise toggle: `<button>` wraps `h3`/`p` (invalid content), no `aria-expanded`/`aria-controls`; ghost variant underlines the whole header on hover | Confirmed (code) | WCAG 4.1.2 |
| W12 | Generic accessible names: checkbox "Mark set as complete", inputs "Performed reps" — no set/exercise; targets not linked by `aria-describedby`; N polite live regions | Confirmed (code) | WCAG 1.3.1, 2.4.6 |
| W13 | Compact-mode More trigger is 40px (`size-10`), below the screen's own 44px floor (§22.3) | Confirmed (code) | Touch target |
| W14 | Elapsed time is computed at render with no interval; ticks only when something else re-renders | Likely; validate idle | Status visibility |
| W15 | Rest bar is `fixed inset-x-0` (centres on viewport, not `<main>`); progress line has no `progressbar` role; earlier capture showed "RESTING" flush at x=0 (fix `8791584` claims resolved) | Confirmed / validate | Alignment, WCAG 4.1.2 |
| W16 | No `enterKeyHint` on any input in the repo; Enter does not advance Reps→Weight→RPE→tick | Confirmed | Input efficiency |
| W17 | Heading outline jumps h1 → h3 (only h2 is "Workout note", after the list) | Confirmed | WCAG 1.3.1 |
| W18 | ~10 type/colour treatments per exercise block; uppercase `type-label` in rows (M1) | Confirmed | Similarity / noise |
| W19 | At 1440 the content column (`md:max-w-3xl`) ends at ~1096px while Finish sits at the page's right edge (~1368px): two right edges | Confirmed (capture) | Alignment/continuity |
| W20 | Glossary "Terms:" line costs ~50px above the first exercise every session | Confirmed | Progressive disclosure |

### 6.4 Proposed structure (Direction C within the system)

**Principle:** *the exercise is the container; the current set is the figure;
done work recedes; the prescription is said once.*

```
390px, mid-workout
┌ ← FULL BODY FOUNDATIONS             ⊕ ┐  masthead: title wraps (no clamp)
│   Full Body C · 12:41 · 4 of 12 sets  │  ONE progress statement + 2px ink bar
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔░░░░░░░░░░░░░░░░░░░░░░░ │  (progressbar role; replaces % and x/y)
├──────────────────────────────────────────┤
│ ✓ Front Squat        3 of 3 · 60 kg  ⌄│  DONE exercise = one folded summary row
├──────────────────────────────────────────┤  (LIVE-21 auto-fold; this defines its look)
┃ Incline Bench Press             1 of 3 •••┃  CURRENT exercise = the one box:
┃ 3 × 6–8 · 57.5 kg · RIR 2 · rest 2:00    ┃  surface panel, 1px rule, 3px ink left mark
┃ ── Set   Reps    kg      RPE      ✓ ──   ┃  column header ONCE (type-body-sm ink-3)
┃  1 ✓     8       57.5    —        ■      ┃  done row: plain text on panel, no fields
┃▌ 2      [ 6–8 ] [57.5]  [   ]    ☐      ┃  CURRENT set: sunk well + bounded fields,
┃         Last: 8 × 57.5                    ┃   larger tick; "Last" only here
┃  3       ·       57.5     ·       ☐      ┃  upcoming: ruled row, quiet ink-3 values
┃  + Add set                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
│ ⌄ Romanian Deadlift      0 of 3         │  UPCOMING exercise: header + prescription,
│   3 × 10 · 80 kg                         │  sets collapsed until it becomes current
│ … Workout note · [Finish workout] (end) │  Finish at the END of the list (outline until
└ rest bar (fixed): RESTING 1:42  +15s Skip┘  all required sets done, then filled)
```

**Superset/circuit** (replaces text-only grouping): members render inside one
shared container with a continuous 3px ink left rule and the group label in
the container header ("Superset A · round 2 of 3"); each member is a sub-row
with its letter-number ("A1", "A2") as the leading column; the current
member/set gets the same current-set treatment. No connector lines or new
colour.

**Desktop (≥md):** same composition inside the `--cluster-max`/`max-w-3xl`
column; Finish moves into the masthead's right cluster as an inline control
(the §11.8 rule the code never met) and the action row disappears.

**State vocabulary for the session** (all from existing tokens; never colour alone):

| State | Exercise | Set row |
| --- | --- | --- |
| Upcoming | header + prescription line, folded sets, `ink-2` name | ruled row, values in `ink-3`, no field boxes (tap row → becomes editable) |
| Current | `surface` panel + 1px `rule` + 3px `primary` (ink) `.mark` | `surface-sunk` well, bounded fields, 28px tick (32 in gym mode), "Last" line |
| Done | folded one-line summary, ✓ glyph + `success` text, `ink-2` name | plain values in `foreground`, ✓ in `success-strong`, `.mark-success`; tapping edits |
| Skipped / ended early | — | dash glyph + "Skipped" word, `ink-3` |
| Saving / error | unchanged ring semantics (§11.7) but **fields never disabled** | — |

Uses the existing `.mark`, `mark-success`, `surface`, `surface-sunk`,
`primary` (ink) roles; adds no hue. The ink current-mark is new usage of an
existing role and must be recorded in §27 (honour stays capped; nav keeps
`honour-strong`).

**Interaction changes**
1. Current set = first required open set in session order (reuse `nextSetAfter`
   / `session-rounds.ts`); after a tick, focus moves to the next current set's
   Reps field (single exercises too) and it scrolls `nearest` (respect
   reduced motion — LIVE-21 already adds smooth hand-off for groups).
2. `enterKeyHint="next"` Reps→kg→RPE, `"done"` on last field; Enter on RPE
   ticks the set (validation from LIVE-21 applies).
3. Never disable inputs during save; keep the ring state; queue the next save.
4. Pre-filled target values render as placeholders (`ink-3`) until the row is
   ticked or edited, so "logged" vs "suggested" is visible; ticking with an
   untouched suggestion commits it (keeps today's one-tap logging).
5. Finish: outline + end-of-list while required sets remain; becomes the one
   filled control when all required sets are done; the "Complete all sets"
   banner shows only after a Finish attempt (confirmation dialog already states
   remaining sets).
6. Glossary line moves behind the masthead's ⓘ (or into the first exercise's
   header menu); definitions unchanged (§23.5 one-source rule kept).

---

## 7. Cross-application design-system recommendations

Global problems (solve once, in tokens/primitives/rules) vs feature problems
(solve per screen). Nothing below adds a colour, font, breakpoint or dependency.

### 7.1 Global (shared layer)

| ID | Recommendation | Where it lands | Fixes |
| --- | --- | --- | --- |
| DS1 | **State vocabulary** — one documented mapping for *upcoming / current / done / skipped / ended-early / disabled / saving / error*, each = glyph + word (+ optional `.mark`), tokens only. Encode as a `StatusMark` primitive (`components/ui/status-mark.tsx`: `state`, `label`, `variant: inline \| rule`) | §27.1 + primitive | Root cause 3; history, workout, routines, schedule, week strip, recap |
| DS2 | **Containment rule** — "the unit the user acts on is the box; its children are ruled rows". Build the missing §11.5 Card variants (`ruled`, `sunk`) and add `current` (panel + `.mark` in ink) to `card.tsx`; replace hand-rolled `border border-rule` boxes opportunistically | §27.2 + `card.tsx` | Root cause 1; M12 |
| DS3 | **Prescription-once pattern** — a `ColumnHeader` row (Body small `ink-3`, sentence case) above a ruled list + a one-line group summary; per-row captions only for deviations | §27.3 + `components/layout/ledger-columns.tsx` | Root cause 2; workout, history, builder, exercises |
| DS4 | **Voices per block ≤ 4** (rule): within one repeated row, at most one title rank, one data face, one caption rank, one state colour. Enforce §5.3 (no `type-label` in repeated rows) | §27.4 + review checklist | Root cause 4; M1 |
| DS5 | **Define the missing ranks**: `.type-body` (Source Sans 15/1.6, §5.2) and alias `type-data-emphatic`→`type-data-strong` (then delete the alias); apply `.duration-slot` to elapsed time, rest countdown, history durations | `globals.css` | M9, M10, M11 |
| DS6 | **Primary-action audit rule**: per region one filled control *and it must be the current task*; terminal actions (Finish, Delete) are filled only when they are the task. Repeated list controls = outline/ghost | §27.5 | Root cause 5; M4, M6 |
| DS7 | **Masthead rule**: the inscription names the page (or the object), slogans move to a subtitle or go; max 2 Cinzel per screen incl. wizard step headings | §27.6 + `HeroSection` call sites | M8, wayfinding on phone (running head hidden below `sm`) |
| DS8 | **Shared states**: `InlineError` (message + Retry, `role="alert"`, uses `useApiErrorMessage`) and one loading recipe (anatomy skeleton + `role="status"` + `aria-busy`), `EmptyModule` everywhere | `components/layout/` | M18 |
| DS9 | **Primitive cleanup**: `tabs.tsx` to §21 look (or retire — single consumer `BuildDays.tsx`), `select.tsx` chevron `text-ink-3` + `large-controls:` item size, dialog descriptions `type-body-sm`, BottomNav labels a type rank, icon `aria-hidden` sweep, one icon family per destination | `components/ui/*`, shell | M13–M17 |
| DS10 | **Docs sync**: §11.2 code block, CLAUDE.md `heading-classical`, `globals.css:545` comment | docs | M2, M19 |

### 7.2 Proposed amendment §27 "Train focus" (draft text for the owner)

Supersedes, narrowly:
- **§11.5** "Only three things stay boxed: overlays, the set rows in an active
  session, and a screen's single primary CTA" → *overlays, the **current
  exercise** in an active session, and the single primary CTA*. Set rows
  become ruled rows inside it; only the current set keeps a sunk well.
- **§11.7** set-log row: "The row is a `sunk` well… Reps/Weight/RPE are bounded
  fields" → bounded fields on the **current and edited** rows only; done rows
  read as data (§11.12 read-only treatment); upcoming rows show ink-3 values;
  targets move to the exercise's prescription line and one column header.
- **§11.8**: restated, not changed — one progress statement (a 2px ink bar +
  "4 of 12 sets"); Finish inline in the masthead from `md`, end-of-list below.
- **§4.3**: adds one use of `primary` (ink) as a **current mark** (3px `.mark`
  on the current exercise / set). Not an accent; honour stays capped and
  reserved; nav marker unchanged.
- **§9.1**: set-completion signature kept; adds no new signature. Folding and
  hand-off motion follow LIVE-21 and §9.3 (instant under reduced motion).

Skill log for the amendment (per `sunnsteel-design`): adopted — WCAG target
size, `enterKeyHint`, never disable focused inputs, one primary per screen
(ui-ux-pro-max `primary-action`), heading hierarchy, `aria-expanded`;
adapted — "card grouping" → one box per *unit of work*, not a card kit;
declined — ui-ux-pro-max fitness default (orange/electric palette,
"Vibrant & Block-based", Barlow, landing-page pattern, opacity-disabled,
"gamification"), Web Interface Guidelines "Title Case for buttons" (§23.2
sentence case stands).

---

## 8. Three redesign directions

| | **A — Minimal refinement** | **B — Structured visual redesign** | **C — UX-driven interaction redesign** |
| --- | --- | --- | --- |
| Philosophy | Keep every layout; fix rule violations, ranks, states, alignment | Stronger structural language: containers per unit, column headers, status primitive, stricter primary discipline | Re-think information priority and flow around the current task; progressive disclosure; contextual actions |
| Workout changes | Remove duplicate progress, fix clipping/clamp, `aria-*`, no disabled inputs, `enterKeyHint`, 44px More, `type-label` out of rows, duration slot | A + exercise becomes the box, set rows ruled, column header + prescription line, StatusMark, superset container | B + current exercise/set focus, upcoming folded, done = summary, prefilled-as-placeholder, Finish relocated, focus/scroll hand-off, glossary demoted |
| Problems addressed | M1–M19, W1, W9–W17 | + W3, W4, W8, W18, DS1–DS3 | + W2, W5, W6, W7, W19, W20 |
| UX benefit | Correctness, a11y, consistency; small perceived change | Clear grouping and state; ~30–40% fewer strings per exercise | Glanceable "what now"; first field above the fold; fewer taps between sets |
| Trade-offs | Doesn't fix "can't see where I am" | More markup churn across lists; risk of card-kit drift if over-applied | Behaviour change in the most-used screen; needs owner sign-off + LIVE-21 alignment; muscle memory |
| Technical impact | CSS classes, small JSX, primitives; tests unchanged | New primitives (`StatusMark`, card variants, `ledger-columns`), touched lists | Workout components + hooks (`use-set-log-form`, `use-collapsible-exercises`, page tick handler); pure logic in `lib/utils` testable in Vitest |
| Complexity | S–M | M | M–L (workout only) |
| Identity fit | Full | Full if containers stay tonal, square, unshadowed | Full — "Train" expression of §26 is literally this ("the current set… the next action. Glanceable at arm's length") |

## 9. Recommended strategy

**Hybrid, graded by priority:**
- **Whole app — Direction A** (Phase A + D): foundations, rule compliance, a11y, shared states.
- **Active Workout — Direction C** (Phase B): the §27 amendment, built on LIVE-21's auto-fold/validation.
- **Core list/builder screens — Direction B, light** (Phase C): StatusMark, column headers, one primary per region, builder heading diet. Settings/auxiliary stay A-only.

Why: the system is sound; the defects are where it was *applied* inconsistently
or where its "ruled ledger" idea was applied to the one screen that is not a
ledger but a task. C on the workout and A elsewhere gives the biggest UX gain
with the least identity risk, and DS1–DS3 make the workout's new language
reusable so History, Schedule and the recap read the same states.

---

## 10. Prioritised backlog

Impact (1–5) × Effort (S/M/L) → **QW** quick win (impact ≥3, S) / **ST** structural.
Class: **C** confirmed (code/capture) · **V** likely, needs validation · **S** subjective.

| ID | Screen / component | Problem → improvement | Principle | Impact | Effort | Pri | Class | Kind | Deps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | `set-log-input.tsx:270-468` | Inputs disabled while saving → never disable; keep ring state | Error prevention | 5 | S | P0 | C (device V) | QW | — |
| B2 | Workout page/hooks | No current set/exercise → current state (§6.4) + focus hand-off after tick | Status visibility | 5 | M | P0 | C | ST | §27, LIVE-21 |
| B3 | `exercise-group.tsx`, `set-log-input.tsx` | Containment inverted → exercise is the box, rows ruled, current well | Common region | 5 | M | P0 | C | ST | §27, DS2 |
| B4 | Set rows | Per-row captions → prescription line + one column header; "Last" only on current | Redundancy | 4 | M | P0 | C | ST | DS3 |
| B5 | `session-action-card.tsx`, `session-header.tsx` | Finish full-width filled from set 0 + warning from set 0 → end-of-list/inline, filled only when done; warning after attempt | Primary = task | 4 | S | P0 | C | QW | §27 |
| B6 | `session-header.tsx` | Progress ×2 → one statement + 2px bar (Radix `Progress`) | §11.8 | 3 | S | P0 | C | QW | — |
| B7 | `exercise-group.tsx:363` | "COMPLETE" clips → StatusMark glyph+word, `shrink-0`, sentence case | Overflow | 3 | S | P0 | C | QW | DS1 |
| B8 | `session-header.tsx` | Title clamps/truncates → wrap (balance), §11.11 | Legibility | 3 | S | P0 | C | QW | — |
| B9 | Exercise toggle | Invalid `button>h3`, no `aria-expanded/controls` → `h3 > button` pattern from `CollapsibleSection` | WCAG 4.1.2 | 3 | S | P0 | C | QW | — |
| B10 | Set inputs/checkbox | Generic names → "Set 2 of Front Squat, reps"; `aria-describedby` targets; one live region per exercise | WCAG 2.4.6 | 3 | S | P0 | C | QW | — |
| B11 | Inputs | `enterKeyHint` + Enter-to-advance/tick | Efficiency | 4 | S | P0 | C | QW | LIVE-21 validation |
| B12 | Prefilled weight | Looks logged → placeholder style until edited/ticked | Status visibility | 4 | M | P0 | V (owner decision) | ST | §27 |
| B13 | Superset | Text-only → shared container + A1/A2 lead column | Common region | 4 | M | P0 | C | ST | B3 |
| B14 | Compact More | 40px → 44px | Target size | 2 | S | P0 | C | QW | — |
| B15 | Elapsed / rest | No interval; reflow → 1s ticker in header + `.duration-slot` | Status | 2 | S | P0 | V | QW | DS5 |
| B16 | Rest bar | `fixed inset-x-0`, no progressbar role → align to `<main>` column, `role=progressbar` | Alignment, a11y | 2 | S | P0 | C | QW | — |
| B17 | Workout headings | h1→h3 jump → exercises `h2` (or list `h2` sr-only) | WCAG 1.3.1 | 2 | S | P0 | C | QW | — |
| B18 | Glossary line | 50px above first exercise → behind masthead ⓘ | Disclosure | 2 | S | P0 | S | QW | §23.5 |
| B19 | `RoutineCard.tsx:229,254` | Filled Start per card → outline; dashboard Today's Workouts keeps the filled one | §4.3 rule 1 | 3 | S | P1 | C | QW | DS6 |
| B20 | Builder (`routines/new`, `edit/[id]`) | 3 Cinzel + step name ×3, no exercise above fold at 1440 → one inscription, stepper carries step name, panel title dropped | §5.3, focus | 3 | M | P1 | C | ST | DS7 |
| B21 | Wizard primitives | stock tabs/gradients/rounded-md/muted-foreground → §21 tabs, ruled, tokens | Consistency | 3 | M | P1 | C | ST | DS9 |
| B22 | Masthead slogans | "Forge Your Path"/"Refine your program"/"Training archive" don't name the page; phone hides running head | Wayfinding | 3 | S | P1 | S (owner copy) | QW | DS7 |
| B23 | Shell nav | Active row fill (M14); icon family switch (M15) | Consistency | 2 | S | P1 | C | QW | — |
| B24 | History list | 5 label/value lines per row, seconds in timestamps, caps status → one summary line + StatusMark + column header ≥sm | Redundancy | 3 | M | P2 | C | ST | DS1, DS3 |
| B25 | Exercises catalog | 4-line rows, mono date wrapping in sentence (M7) → title + muscles + one meta line, sentence face | §23.3 | 2 | S | P2 | C | QW | — |
| B26 | Undefined classes | `type-body`, `type-data-emphatic` | Correctness | 3 | S | P1 | C | QW | DS5 |
| B27 | Shared states | `InlineError`, loading recipe, `EmptyModule` adoption | Consistency | 3 | M | P2 | C | ST | DS8 |
| B28 | Icons | 101 unlabelled lucide icons → `aria-hidden` | WCAG 1.1.1 | 2 | S | P2 | C | QW | — |
| B29 | Settings avatar | "Click the image to upload" — hidden affordance, "click" on touch → visible "Change photo" button | Discoverability | 2 | S | P3 | C | QW | — |
| B30 | Docs | M2, M19 | Accuracy | 1 | S | P3 | C | QW | — |
| B31 | `history/[id]/page.tsx:69-71` | `String(error) \|\| …` never falls back → `useApiErrorMessage` + retry | Error recovery | 3 | S | P2 | C | QW | DS8 |
| B32 | `WorkoutsList.tsx:73`, `today-actions.tsx:56`, login | Hardcoded English / raw Supabase message → message keys, `useApiErrorMessage`, warning-not-red per `AuthNotice` | i18n rule 1, 5 | 3 | S | P1 | C | QW | — |
| B33 | `workout-history-list.tsx:138` | Rows `div role="button"` → `<Link>` rows | Web guidelines (links) | 3 | S | P2 | C | QW | — |
| B34 | Filters/ranges/views/reactions | Toggles styled as commands → one `Toggle`/segmented pattern (`aria-pressed`, ink underline like §21, not a button fill) | Similarity | 3 | M | P1 | C | ST | DS9 |
| B35 | Routine detail, Schedule, Workouts landing | No filled action or 3–4 equal buttons → today's Start is the one filled control; rest outline/links | §4.3 rule 1 | 3 | S | P1 | C | QW | DS6 |
| B36 | Builder SetRow | 12 buttons/set (8 steppers) → steppers only below `sm` (as §TD-50 card), keyboard entry elsewhere; column header | Density | 3 | M | P1 | C | ST | DS3 |
| B37 | Wizard nesting | 3 Card levels → day ruled section, exercise = the one box | Common region | 3 | M | P1 | C | ST | DS2 |
| B38 | Muscle heatmap | Intensity by shade only → value in cell/tooltip-free legend numbers | WCAG 1.4.1 | 2 | S | P2 | C | QW | — |
| B39 | Achievements | Rank/comeback/milestones disappear on error → InlineError | Error visibility | 2 | S | P2 | C | QW | DS8 |
| B40 | Moderation queue | Up to 7 outline buttons/row → primary 2 + overflow menu | Hick's law | 2 | S | P3 | C | QW | — |
| B41 | Public shares | Doubled padding; member page hardcodes KG/CM | Consistency, i18n | 2 | S | P3 | C | QW | — |
| B42 | Settings | Mixed save models within a tab → per-card rule stated + consistent (owner choice) | Predictability | 2 | M | P3 | C | ST | — |
| B43 | Messages | No "New message" entry; `type-body` undefined | Discoverability | 2 | S | P3 | C | QW | DS5 |

**Quick wins first** (all S, impact ≥3): B1, B5, B6, B7, B8, B9, B10, B11, B19, B26, B31, B32, B33, B35.
**Highest-leverage global:** DS1 (StatusMark) + DS3 (columns) + DS6 (primary rule) — each fixes ≥4 screens.

---

## 11. Phased implementation roadmap

Each phase is an independent, mergeable slice per the repo's "Closing a slice"
(roadmap claim on `main` → worktree → lint/typecheck/test while iterating →
`npm run verify` with dev servers stopped → scoped sweep EN+ES → docs).

### Phase 0 — Approval and housekeeping (no UI change)
- Copy this report to `sunnsteel-frontend/docs/ui-audit-2026-10.md`; add roadmap
  items (e.g. `UX-24` foundations, `LIVE-22` train focus, `UX-25` core lists)
  and claim them per the In-flight rules.
- Owner decisions needed (see end): §27 text, B12 placeholder behaviour, B22 copy.

### Phase A — Design foundations (Direction A; no workout layout change)
- **Goals:** reconcile doc ↔ code; add the shared pieces the later phases reuse.
- **Files:** `app/globals.css` (`.type-body`, alias, `.duration-slot` usage, comment fix);
  `components/ui/{card,tabs,select,dialog,alert-dialog}.tsx`; new
  `components/ui/status-mark.tsx`, `components/layout/{ledger-columns,inline-error}.tsx`;
  `features/shell/components/{Sidebar,BottomNav}.tsx`; `docs/ui-design-system.md`
  (§11.2 fix + §27 amendment text); `CLAUDE.md`/`AGENTS.md` (sync).
- **Changes:** DS1, DS2 (variants only), DS3 (component only), DS5, DS8, DS9, DS10; B26, B23, B28.
- **Deps:** owner approval of §27 text (can land the defect-only parts first).
- **Risks:** primitive changes ripple to ~65 files → full sweep required (CLAUDE.md: any `components/ui/*` change).
- **Acceptance:** 0 undefined `type-*` classes (grep of class names vs `globals.css`);
  `StatusMark` has states for every status the app renders; tabs/select pass §21/§22;
  0 lucide icons without `aria-hidden`/label; full sweep 621/621 EN + scoped ES.
- **Verify:** `npm run lint && npm run typecheck && npm test`; compiled-CSS check (§15 gate 1);
  `npm run verify` (servers stopped); `npm run ui:regression` full; both themes.

### Phase B — Active Workout "Train focus" (Direction C)
- **Gate:** starts **after `LIVE-21` merges** — it has uncommitted edits right now in
  `exercise-group.tsx`, `set-log-input.tsx`, the session `page.tsx`, `globals.css`,
  `use-collapsible-exercises.ts`, `use-set-log-form.ts`. Phase B builds on its
  auto-fold (defines the folded summary's look) and tick validation.
- **Order (each a commit; quick wins first so they ship even if C is revised):**
  1. B1, B9, B10, B11, B14, B15, B16, B17 (defects, no amendment needed).
  2. B6, B7, B8, B5 (masthead/progress/Finish — §11.8 restated).
  3. B3 + B4 (containment + prescription line + column header) — §27.
  4. B2 (current state + focus hand-off) and B12 (suggested vs logged).
  5. B13 (superset container), B18 (glossary).
- **Files:** `app/[locale]/(protected)/workouts/sessions/[id]/page.tsx`;
  `features/workout/{session-header,session-action-card,exercise-group,set-log-input,rest-timer-bar,session-confirmation-dialog}.tsx`;
  `hooks/{use-set-log-form,use-collapsible-exercises,use-compact-workout}.ts`;
  pure logic in `lib/utils/session-rounds.ts` (reuse `nextSetAfter`) + new
  `lib/utils/session-focus.ts` (current-set selection, prescription line text) with
  Vitest tests in both languages; `messages/{en,es}/workout.json`.
  Reuse: `CollapsibleSection` heading pattern, `Progress` primitive, `.mark*`,
  `StatusMark`, `ledger-columns`, `formatDuration`, `weight-unit.ts`, `GlossaryLine`.
- **Must preserve:** gym mode sizes (§22.4) and compact grouping (§23.7),
  44px floor, 16px inputs below `md`, autosave + save ring semantics, rest
  timer/wake lock, LP fixed-load rows, extra sets, set-kind menu, swap, notes,
  plate calculator, superset rounds order, set-completion signature motion,
  reduced motion (both sources), higher contrast boundaries.
- **Risks:** muscle memory (Finish moves); LP/extra/warm-up row variants;
  Spanish length at 320; `groupSetLogsByExercise` dropping fields (gotcha) —
  any new per-set field must survive it.
- **Acceptance (390×844, fresh 3-exercise session):** first editable field ≤ y 300
  (today ≈510); overall progress stated once; exactly one filled control on screen
  and it is not Finish until all required sets are done; current set identifiable
  in a 1-second glance test (owner + 2 testers); ≤ 2 caption strings per set row
  (today 4–5); no clipped text at 320 ES; tick → next current Reps field focused
  without keyboard dismissal (device test iOS Safari + Android Chrome).
- **Verify:** Vitest for `session-focus.ts`; scoped sweep
  `-g "layout session|layout session-display|dialog|keyboard focus"` EN + `UI_LOCALE=es`;
  live run with the backend (start → log → superset → rest → finish) in both themes,
  gym mode on/off, 320/390/768/1024/1440; portfolio targets `live-session*` updated.

### Phase C — Core workflows (Direction B, light)
- **Scope:** Routines list (B19), Routine detail/Schedule/Workouts landing primaries (B35),
  Builder (B20, B21, B36, B37), toggle pattern (B34), Exercise picker, main navigation
  (B22/B23), Schedule entries (StatusMark), i18n leaks (B32).
- **Files:** `features/routines/components/RoutineCard.tsx`, `features/routines/wizard/**`
  (`BuildDays.tsx`, `WizardExerciseCard.tsx`, `SetRow.tsx`, `ExerciseList.tsx`),
  `app/[locale]/(protected)/routines/{new,edit/[id]}/page.tsx`, `components/ui/stepper.tsx`,
  `features/schedule/schedule-week-view.tsx`, `components/layout/HeroSection.tsx` call sites.
- **Acceptance:** one filled control per viewport on /routines; builder ≤ 2 Cinzel and
  the first exercise card visible at 1440×900 on step 3; no `rounded-md`/gradient/
  `muted-foreground` left in `wizard/`; routine-edit sweep extended to render a set row
  (CLAUDE.md notes the sweep never does today).

### Phase D — Remaining application (Direction A)
- Dashboard (section error consistency only; §25 is good), History list/detail
  (B24, B31, B33), Progress tabs (B38, empty styles), Exercises (B25), Achievements
  (B39), Profile, Settings (B29, B42), Activity/Messages (B43), Notifications,
  Moderation (B40), Auth, public shares (B41), 404/offline; adopt DS8 states everywhere.
- **Acceptance:** every list status uses `StatusMark`; every async view has empty,
  error (`InlineError`) and loading (recipe) states; scoped sweeps per route EN+ES.

### Phase E — Validation and refinement
- Full regression sweep (621) EN + full ES; contrast re-measure for any new usage
  (§15 gate 2; the ink current-mark on surface/sunk ≥3:1); keyboard-only pass of the
  workout and builder; VoiceOver/TalkBack pass on the workout; reduced-motion,
  higher-contrast, larger-controls matrix; portfolio recapture; §27 marked LOCKED
  with its verification record (like §22.5/§26.9).

---

## 12. Accessibility and responsive considerations

- **Verified in code:** B9, B10, B17, M16 (icons), W13 (40px), focus not managed
  after tick, no `enterKeyHint`, N live regions. **Needs device validation:** B1
  keyboard dismissal, elapsed ticking, iOS zoom (16px rule kept).
- **WCAG 2.2 AA targets:** 2.4.11 focus not obscured (keep `scroll-mt-52`/`scroll-mb-28`
  clearances when the masthead shrinks); 2.5.8 target size (44px floor kept, tick
  hit area ≥44); 1.4.11 non-text contrast for the ink current-mark and ruled rows
  (rule-faint 2.08 under higher contrast meets §22's 2:1 target, standard
  `rule-faint` is below 3:1 — so state must never rely on the hairline alone);
  1.3.1 heading outline; 4.1.3 status messages (one live region per exercise).
- **Widths:** 320 (ES worst case), 375, 390, 430 phones; 640/768/1024 exact
  shell boundaries with the `viewport − 256` budget; 1280/1440. Phone patterns:
  no horizontal scroll, prescription line wraps before fields shrink, column
  header hides below the width where it fits (captions return only for deviations).

## 13. Risks and regression prevention

| Risk | Mitigation |
| --- | --- |
| Conflict with in-flight `LIVE-21` | Phase B gated on its merge; reuse its fold/validation |
| Locked design system | All structural changes in one §27 amendment, owner-approved before Phase B step 3 |
| Primitive ripple | Full sweep for any `components/ui/*` change; one commit per primitive |
| Behaviour regressions on the workout | Behaviour logic in pure `lib/utils` with Vitest (Node-only tests can't render components); live run checklist; portfolio frames |
| Spanish overflow | `UI_LOCALE=es` sweeps at 320; prefer shorter ES copy, never smaller type |
| Card-kit drift | DS2 rule: one box per unit of work; reviewers reject boxes inside boxes |
| Silent Tailwind no-ops | §15 gate 1 compiled-CSS check after every `globals.css` change |
| `npm run verify` with dev server running | Stop servers first (CLAUDE.md) |

## 14. Measurable acceptance criteria (product-level)

1. Workout at 390: first editable field ≤ 300px from top at session start; one
   overall progress statement; one filled control; current set marked; ≤ 2
   captions per set row; 0 clipped strings at 320 ES.
2. Time-to-log a set (tap field → enter reps → tick) ≤ 3 taps, measured live,
   with focus landing on the next set automatically.
3. 0 `type-label` inside repeated rows (grep-reviewable list of call sites).
4. 0 undefined `type-*` classes; `.duration-slot` on every live duration.
5. ≤ 1 filled `Button variant="default"` per region on every route (sweep
   assertion candidate in `e2e/regression.spec.ts`).
6. Every status in lists renders through `StatusMark` (glyph + word).
7. 0 lucide icons without `aria-hidden` or an accessible name.
8. Full regression sweep green EN; ES sweep green on changed routes; both themes;
   reduced motion, higher contrast and larger controls checked on the workout.

## 15. Skills and tools actually used

| Resource | Used? | How it informed the audit |
| --- | --- | --- |
| `ui-ux-pro-max` | Yes — loaded SKILL.md, ran `--design-system` ("fitness strength training tracker dark") and 6 `--domain ux` queries; read `references/pro-rules.md` / `quick-reference.md` rules | Adopted: `primary-action`, `visual-hierarchy` ("size, spacing, contrast — not colour alone"), touch target/spacing, `inputmode`, visible labels, state parity across themes. **Declined** its generated system (orange `#F97316` + green, "Vibrant & Block-based", Barlow, landing-page pattern) as off-brief — v1.1 §26.0 declined the same. "dark mode surface elevation" returned 0 results (reported as such) |
| `web-design-guidelines` | Yes — fetched the current Vercel guideline set | Drove: `aria-expanded`, icon `aria-hidden`, `enterKeyHint`/input modes, live-region discipline, focus-not-obscured, `transition-all`/hover checks (both already clean). Declined: Title Case buttons (§23.2) |
| `frontend-design` | Yes — loaded instructions | "Spend boldness in one place" → the current set is the workout's one figure; "visual structure is information" → boxes only where they encode the unit of work; flagged template tells already avoided; no new palette |
| Project skill `sunnsteel-design` | Yes | Sorting rule (defect / fits / contradicts → amendment / other product) applied to every recommendation |
| Explore subagents (3) | Yes | Workout code trace; tokens/primitives/grep counts; route inventory |
| Visual evidence | **Existing captures only**: `docs/portfolio/screenshots/*` (1440 dark, 2026-10-03) and `.claude-worktrees/redesign-evidence/` (390/1440, both themes, live workout run 2026-10-02, ES 320) | **Limitation:** dev server (:3000) and backend (:4000) were down; plan mode forbids starting them, so no fresh Playwright capture was taken. Findings from captures older than the latest commits are marked V where the code may have moved. The screenshots mentioned in the brief were not attached to the conversation |
| Playwright MCP | Available, not used (no running app) | Phase E uses `npm run ui:regression` + portfolio capture |

### Owner decisions (2026-10-08)
1. Draft §27 "Train focus" (supersedes §11.5/§11.7 narrowly; §6.4 here) — **approved to draft**; the text returns to the owner before `LIVE-22` changes the workout layout.
2. B12: a pre-filled target shows as a suggestion (placeholder style) until edited or ticked — **yes**.
3. Finish: end of the list on phones, inline in the masthead from `md`, outline until the required sets are done — **yes**.
4. B22: mastheads name the page, the slogan becomes a subtitle or goes — **yes**.

Roadmap: `UX-24` (Phase A, claimed), `LIVE-22` (Phase B, after `LIVE-21`), `UX-25` (Phase C), `UX-26` (Phase D).
