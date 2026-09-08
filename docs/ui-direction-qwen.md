# UI Direction — Second Exploration (Qwen 3.8 Max)

Phase 2, second opinion. Independent of [ui-direction-opus.md](ui-direction-opus.md),
which was not read. Inputs: the 60 frozen baseline screenshots in
`docs/ui-restyle/screenshots/before/` (all viewed, both themes, 390/768/1440),
the Phase 1 inventory in [ui-restyle-progress.md](ui-restyle-progress.md),
`app/globals.css`, `app/layout.tsx`, and the primitives `button`, `card`, `input`.

Scope is the plan's strict UI-only scope: no route, component responsibility,
behaviour or responsive contract changes. Everything below is presentational.

## What the baseline actually shows

Observed, not inferred:

- **Light theme reads colder and thinner than the brand intends.** Token
  background is pure white, but most real surfaces are cool `neutral-100`
  greys, while the brand golds are warm. The result is a grey app with yellow
  accents, not a marble app with gold.
- **Dark theme is the stronger half.** Near-black plus gold is coherent; the
  failures there are inconsistent border ownership (some cards gold-edged,
  some neutral-edged, some edgeless) and amber text at low alpha.
- **The corner-bracket motif is the one ownable brand device.** Gold L-corners
  on the topbar title, the hero banner and the splash are the only element no
  generic fitness app has. Everything else "classical" is a blurred photo and
  a gradient wash.
- **Four accent colours compete.** Gold (`amber-*`, `--ss-gold`, nine hexes),
  blue (the wizard stepper circles and progress line), orange (the settings
  Save Changes button, the avatar ring), crimson-pink (the favourite heart).
  None of them is the token `--primary`, which is plain black/white.
- **Surfaces are boxes inside boxes.** History is a card containing 20 bordered
  cards; the dashboard is a card containing bordered chips containing badges.
  At 390 this stacks into a wall of 1px rectangles.
- **1440 is 768 stretched.** Confirmed visually: same two-column dashboard,
  same single-column history list, wider cards, no new information density.

---

# Direction A — "Gilt Frame"

Conservative refinement. Keeps the current identity — Bebas Neue poster
headings, gold on charcoal, marble paper, corner brackets, card-based layout —
and makes every value deliberate instead of accidental. The test for A: a user
who knows today's app sees the same app, calmer and warmer.

## A. Colour

The token palette stops being greyscale: brand colours enter `@theme inline`
as named roles for the first time. Values are hex for review; the
implementation may store them as oklch, but the *roles* are what matter.

Light theme:

| Role | Value | Notes |
| --- | --- | --- |
| background | `#F6F4EF` | warm marble paper, replaces pure white and `neutral-100` |
| surface | `#FDFCF9` | cards, dialogs |
| surface-subtle | `#EFECE4` | chips, stat header pills, hover fills |
| border | `#E2DCCE` | default 1px |
| border-strong | `#CBC2AC` | hovered controls, dividers that must read |
| text | `#201D18` | warm near-black |
| text-secondary | `#575147` | |
| text-muted | `#877F70` | captions, timestamps; AA on background and surface |
| gold-fill | `#DAA520` | fills, borders, progress, icons — never text on light |
| gold-ink | `#7A5C00` | gold as *text* on light (AA on background/surface) |
| gold-on-dark-fill | `#FFD700` | dark theme only, as today |
| action | `#201D18` | primary button stays charcoal, as today |
| destructive | `#A31621` | also fixes `--destructive-foreground` (→ `#FDFCF9`) |
| success | `#3F6B4A` | rest-timer "go", "+3 this week" |
| warning | `#8A6A00` | replaces `amber-600/700` text on amber washes |

Dark theme (a remap, not a second palette):

| Role | Value |
| --- | --- |
| background | `#161412` |
| surface | `#1E1B18` |
| surface-subtle | `#272320` |
| border | `#35302A` |
| border-strong | `#4C453B` |
| text | `#F2EEE6` |
| text-secondary | `#B7B0A2` |
| text-muted | `#8B8476` |
| gold-fill | `#E8C15A` |
| gold-ink | `#F0D488` |
| action | `#F2EEE6` (inverted, as today) |
| destructive | `#E07A7A` |
| success | `#8FBE9B` |
| warning | `#E8C15A` |

Retirements: the nine hardcoded gold hexes and the eight `rgba(218,165,32,…)` /
`rgba(255,215,0,…)` values collapse into `gold-fill` at opacity steps
(10 / 20 / 40 / 100). The blue stepper becomes `gold-fill` / `gold-ink`. The
orange Save Changes button becomes `action`. Crimson and bronze stay out of
the interactive palette in A — they remain reserved for the splash and badges.

## A. Backgrounds and surfaces

- Body is flat `background`. The `bg-marble-light` radial wash survives in
  exactly two places: the auth split panel and the hero banner. Everywhere
  else it is noise on top of noise.
- Card gradient washes (`from-white/92 to-white/78` and the dark equivalent)
  are deleted; cards are flat `surface` with a 1px `border`.
- The blurred-column hero photo stays, but its overlay darkens 10% in light
  mode so the white Bebas title clears AA without a text shadow.
- Skeletons take `surface-subtle` instead of grey, so first paint is warm.

## A. Typography

Faces unchanged (no new font payload): Bebas Neue display, Oswald body,
Space Mono data, Cinzel wordmark.

| Level | Face / size / leading / tracking / case |
| --- | --- |
| Page title | Bebas Neue, 28 mobile → 32 desktop, 1.1, 0.04em, upper |
| Section heading (RECENT ACTIVITY) | Bebas Neue, 19, 1.2, 0.05em, upper |
| Card title | Bebas Neue, 17, 1.25, 0.05em, upper |
| Stat value | Bebas Neue, 38 mobile → 44 desktop, 1.0, 0.01em |
| Body | Oswald 400, 15, 1.55, 0, sentence case |
| Body small / captions | Oswald 400, 13, 1.45, 0 |
| Labels (Started, Ended, Volume / Sets) | Oswald 500, 12, 1.3, 0.06em, upper, `text-muted` |
| Data (weights, dates, durations, timer) | Space Mono 400, 13, 1.5, 0 |
| Button | Oswald 500, 14, 1, 0.02em, sentence case |

Two changes with visible payoff: long body copy (history notes, empty states,
dialog text) moves off Oswald 15 onto Oswald 15/1.55 with a 68ch measure where
the container allows, and every numeric field that is *data* (not a headline
stat) moves to Space Mono, which is tabular — today "150,000,000 kg" and
"9,165 kg" sit in proportional faces and jitter.

Inputs keep 16px below `md` (iOS zoom mitigation, untouched).

## A. Hierarchy

One loud thing per region. Order of loudness: stat value / page title →
primary button → section heading → body → labels. Concretely:

- The stat-card header pill (gradient chip with icon + label) loses its
  gradient and its border; it becomes label + icon in `gold-ink` on
  `surface-subtle`, 12px upper. Today it out-shouts the number it labels.
- `SOON` badges drop to 10px `bronze` outline; they are furniture, not calls
  to action.
- In history rows the session title is the only bold element; started/ended/
  duration become label-over-mono-value columns; COMPLETED/ABORTED moves to
  an 11px upper `text-muted` tag, red-ink only for ABORTED.

## A. Spacing

4px base, named steps 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

- Card padding: 20 mobile, 24 desktop (today `px-6 py-6` everywhere).
- Gap inside cards: 12; between cards in a grid: 16 mobile, 24 desktop.
- Section rhythm (hero → title → grid → lists): 24 mobile, 40 desktop.
- List row vertical padding: 12 mobile, 16 desktop.
- More space above a heading than below it, always: 32/12 desktop, 24/8 mobile.

## A. Borders and radii

Three radii, declared once: `--radius-control: 8px`, `--radius-card: 12px`,
`--radius-full` (avatars, the search field, and nothing else).

- Cards 12 (down from 16), buttons/inputs/badges 8 (up from 6-7, down from
  the current mix), chips 8, progress tracks `full`.
- `rounded-full` on rectangular things (stat header pills, filter tabs) ends;
  they take 8.
- Borders: 1px `border` default; 1px `border-strong` on hovered controls;
  2px only for the focus ring and the active-nav left rule; 3px never.
- The gold corner brackets stay on the topbar title and hero, recoloured to
  `gold-fill` at 60% in light (today they are near-invisible amber at 20%).

## A. Shadows

Two levels plus none:

- `none` — default for cards in light. The border carries the edge.
- `raised` — `0 1px 2px rgba(32,29,24,0.06), 0 8px 24px -16px rgba(32,29,24,0.24)`
  for dialogs, dropdowns, toasts, the mobile FAB.
- Dark theme: shadows off entirely; elevation is `surface` → `surface-subtle`
  steps plus `border-strong`. Coloured shadows (`shadow-amber-900/5` etc.) die.

## A. Buttons

- `default` (charcoal / inverted ivory): unchanged shape, radius 8, height
  36 / 40 / 44 (sm / default / lg).
- `classical` (gold gradient): becomes **flat** `gold-fill` with `#201D18`
  text in both themes; the left-to-right gradient is the "excessive gradient"
  the brief forbids and adds nothing at 36px height. Hover darkens 6%.
- `bronze`: kept for the single place a secondary warm action is wanted
  (splash, achievements placeholder), flat `#B87333`.
- `outline`: `border-strong` on `surface`, hover `surface-subtle`.
- `ghost`: hover `surface-subtle`, no border.
- Destructive: `destructive` fill with the fixed foreground token.
- Press state stays `translate-y-[1px]`, immediate. Focus ring: 2px
  `gold-ink` at 60% offset 2 in light, `gold-fill` in dark — replacing the
  current grey ring and the scattered `ring-amber-500`.

## A. Cards

`Card` gains three declared variants so call sites stop improvising:

- `plain` — flat `surface`, 1px `border`, radius 12. The default.
- `quiet` — no border, `surface-subtle`, radius 12; for stat tiles and chips
  that sit *inside* another card (today's boxes-in-boxes).
- `framed` — `plain` plus gold corner brackets; reserved for the hero and the
  "Today's workouts" card, i.e. at most one per screen.

The copied `bg-card/50 + backdrop-blur-sm` glass string is deleted outright;
nothing in A is translucent.

## A. Inputs

- Radius 8, 1px `border-strong` at rest (today's `border` is invisible on
  white), `surface` fill in light, `surface-subtle` in dark.
- Focus: border `gold-ink` + 2px ring at 25%; no 3px grey ring.
- Invalid: `destructive` border + ring; the warning washes in the session
  screen become `warning` at 10% with `warning` text.
- Labels: 13px Oswald 500 sentence case, 8px above; helper text 12px muted.
- Selects and the sex/unit dropdowns inherit the same box; heights match
  buttons (36/40).

## A. Navigation

- Sidebar structure, order, collapse and mobile drawer unchanged.
- Light active item keeps its inverted block but warms to `#201D18` with a
  2px `gold-fill` left rule and gold icon (today: neutral-900 + amber-600).
  Dark active keeps the ivory block with a `gold-fill` left rule.
- Hover: `surface-subtle` fill + `border-strong` left rule at 2px, so hover
  and active differ by colour, not by geometry.
- Topbar: height 56 mobile / 64 desktop; the search pill keeps `full` radius
  as a deliberate exception; theme toggle and avatar unchanged.
- Mobile bottom-of-screen floating "New" FAB keeps its pill shape and gains
  `raised` shadow; it is the only floating element in A.

## A. Responsive, and what 1280+ is for

`sm` and `md` keep their current jobs exactly (stack→row; drawer→sidebar).

**1280+ is for rest, not for more.** At `xl`:

- Main content caps at 1160px and centres in the space right of the sidebar,
  killing the edge-to-edge stretch visible at 1440.
- One type step up: page title 32→36, stat value 44→48, body 15→16.
- Section rhythm 40→48.
- No new columns, no new regions, no density change. The dashboard keeps its
  3-up stat grid and 2-up lists; history keeps one list. Wider is calmer, not
  busier.

This is presentational only: one max-width wrapper, one type step, one
spacing step — three `xl:` utilities per affected primitive, not a layout
rewrite.

## A. Motion

Named tokens, no new library:

- `fast` 120ms — colour, border, icon tint on hover/focus.
- `base` 200ms — control state changes, tab and filter switches, tooltip and
  dropdown enter (exit 140ms).
- `slow` 300ms — theme crossfade (keeps today's body transition), dialog
  enter (exit 180ms), mobile drawer.
- Easings: `standard` `cubic-bezier(0.2, 0, 0, 1)`; `exit`
  `cubic-bezier(0.4, 0, 1, 1)`; `emphasized` `cubic-bezier(0.2, 0, 0, 1)` at
  `slow` for the drawer only.
- Progress bars animate width at `slow` / `standard`; the rest timer bar
  stays unanimated (it ticks).
- Press feedback is the existing 1px translate, 0ms.
- No entrance animations on sections, ever; the splash keeps its own choreo
  and keeps mounting `children` on frame one. The session screen animates
  with CSS only (broad re-renders, per the plan).
- `prefers-reduced-motion`: all of the above collapse to opacity-only at
  `fast`, translates and width animations off.

## A. Effort, honestly

- 436 raw palette classes: ~170 `neutral-*` map 1:1 onto the warm ramp above
  (mechanical, codemod-assistable, review per file); ~74 `amber-*` split into
  `gold-fill` (fills/borders/icons, ~55) and `gold-ink`/`warning` (text, ~19);
  the remainder (red/green/blue/orange) is ~40 sites mapped to
  destructive/success/stepper-gold/action.
- 17 hardcoded gold hex/rgba sites and 14 inline-style files fold into tokens
  (some inline styles are legitimate: dynamic widths, Cinzel workaround).
- Radius normalisation touches ~180 `rounded-*` sites but is rule-based
  (card→12, control→8, avatar/search→full).
- Net: A is dominated by mechanical remapping; the judgement work is the
  amber split and deleting the glass-card string at ~15 call sites.

---

# Direction B — "Epigraph"

Stronger redesign, same routes, components and behaviour. The classical
reference moves from *decoration* (blurred photos, gradient washes, corner
brackets) to *structure*: the app is set like an inscribed stone ledger —
flat stone ground, hairline rules instead of boxes, inscriptional display
type, and colour spent only where it means something. The test for B: strip
every image and every gold pixel and the screens are still unmistakably
Sunnsteel, because the structure itself is the brand.

## B. Colour

Three roles, strictly rationed: **stone** (everything structural),
**crimson** (the user's actions), **gold** (earned honour only — records,
streaks, medals, completion). Bronze appears once, on disabled/`SOON`.
The current gold-everywhere becomes gold-*sometimes*, which is what makes it
read as honour.

Light theme:

| Role | Value | Notes |
| --- | --- | --- |
| background | `#EDE9DF` | deeper stone paper than A; the ground is visibly tinted |
| surface | `#F7F4EC` | raised panels, used sparingly (see Cards) |
| surface-sunk | `#E5E0D3` | input wells, set-row strips |
| rule | `#CFC8B6` | the workhorse 1px |
| rule-faint | `#DDD7C8` | row separators |
| ink | `#1B1813` | |
| ink-2 | `#55503F` | |
| ink-3 | `#7C7663` | |
| action | `#8B0000` | the dormant `--ss-crimson`, promoted to the action colour |
| action-hover | `#6E0000` | |
| on-action | `#F7F4EC` | |
| honour | `#8A6A00` | gold as ink; fills use `#B8860B` |
| honour-bright | `#B8860B` | medal/record icons, progress fills |
| destructive | `#8B0000` | crimson doubles as destructive; context separates them |
| success | `#41603C` | |
| warning | `#7A5200` | |

Dark theme:

| Role | Value |
| --- | --- |
| background | `#131110` |
| surface | `#1B1917` |
| surface-sunk | `#0D0C0B` |
| rule | `#3A352C` |
| rule-faint | `#2A2620` |
| ink | `#EDE7DA` |
| ink-2 | `#B3AC9C` |
| ink-3 | `#847D6C` |
| action | `#C03434` | crimson lifted for dark grounds; on-action `#131110`-safe `#F7F4EC` |
| action-hover | `#D24A4A` |
| honour | `#E4C068` |
| honour-bright | `#F0D488` |
| destructive | `#D24A4A` |
| success | `#93BE8E` |
| warning | `#E4C068` |

Crimson as the action colour is the single biggest identity move: Start,
Finish Session, Save Changes, Create Routine, the active filter tab and the
wizard's current step all turn crimson. Gold retreats to personal records,
streaks, completion bars and the corner brackets. Nothing else is coloured.

## B. Backgrounds and surfaces

- Flat grounds only. No radial washes, no marble utility, no photo hero: the
  hero banner becomes a stone panel — `surface` with a 3px double rule top
  and bottom and the title set as an inscription (see Typography). The blurred
  column photograph is retired from every screen including the splash frame
  (the splash keeps its choreography and its corners on a flat ground).
- Elevation is tonal, never shadowed: `background` (ground) → `surface`
  (panel) → `surface-sunk` (wells inside panels). Three steps, used in that
  order, everywhere.
- Dark theme inverts the tonal order for wells (`surface-sunk` darker than
  the ground), which reads as carved rather than floated.

## B. Typography

The loaded faces are re-assigned, no new payload: **Cinzel** (already in the
bundle, currently only the wordmark) becomes the inscriptional display face;
**Bebas Neue** is demoted to numerals and the wordmark-adjacent display;
**Oswald** stays body; **Space Mono** becomes the data face for every set,
weight, date and timer.

| Level | Face / size / leading / tracking / case |
| --- | --- |
| Page title | Cinzel 700, 26 mobile → 34 desktop, 1.15, 0.06em, UPPER |
| Section heading | Cinzel 600, 17, 1.25, 0.08em, UPPER |
| Card / panel title | Cinzel 600, 15, 1.3, 0.06em, UPPER |
| Stat value | Bebas Neue, 40 mobile → 52 desktop, 0.95, 0.02em |
| Wordmark | Cinzel 900, unchanged |
| Body | Oswald 400, 15, 1.6, 0, sentence case |
| Labels | Oswald 500, 11.5, 1.3, 0.1em, UPPER, `ink-3` |
| Data (sets, kg, dates, durations, timer) | Space Mono 400, 13, 1.5, 0; values 700 where they are the row's point |
| Button | Oswald 600, 14, 1, 0.04em, UPPER |

Bebas-on-everything is today's loudest habit; Cinzel at heading scale with
wide tracking is slower, heavier, and unmistakably lapidary, while Bebas on
the big numerals keeps the gym-poster energy exactly where numbers live.

## B. Hierarchy

Rules, not size, carry hierarchy:

- Every region opens with its inscription (Cinzel) over a 3px double rule;
  nothing else on the screen uses a double rule.
- Inside a region, the first data element is the loud one: stat values in
  Bebas 40-52, session titles in Oswald 600 16, everything else at or below
  body size.
- Colour hierarchy: ink for content, `ink-3` for structure, crimson for the
  one action per region, honour-gold only on earned marks. A screen with two
  crimson elements is a bug; a screen with gold on anything unearned is a bug.
- The dashboard's six stat tiles lose their header pills entirely: label
  (11.5 upper) above value (Bebas) above rule above footnote. The number is
  the card.

## B. Spacing

Same 4px base, wider air: steps 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.

- Region rhythm: 32 mobile, 64 desktop (inscriptions need air above).
- Panel padding: 16 mobile, 32 desktop.
- Row padding in lists: 16 mobile, 20 desktop, separated by `rule-faint`.
- Between a rule and the first content under it: 16; above the rule: 24.
- 96 appears exactly once per page: above the page inscription.

## B. Borders and radii

Radii: `2px` on controls and panels, `0` on wells and rows, `full` on
avatars only. Near-zero radius is the direction's spine; the 16px cards of
today are the thing B refuses.

- Structural lines: 1px `rule`; row separators 1px `rule-faint`; the page
  and region double rule is `border-double` at 3px in `rule`.
- The gold corner brackets survive in B but change job: from photo-frame
  decoration to *page furniture* — one pair per screen, marking the topbar
  title, in `honour-bright`. The hero loses its brackets along with its photo.
- Focus: 2px `action` ring offset 2 (light), `honour-bright` in dark.

## B. Shadows

None. Zero ambient shadows in either theme. Overlays (dialogs, dropdowns,
toasts) separate by `surface` over a 40% ink scrim plus a 1px `rule`; the FAB
separates by `action` fill. If a surface needs a shadow to be understood in
B, it is in the wrong tonal step.

## B. Buttons

- Primary: flat `action` crimson, 2px radius, height 40 (36 sm / 44 lg),
  label Oswald 600 upper 14; hover `action-hover`; press 1px translate.
- Secondary: transparent, 1px `rule`, ink text; hover fills `surface`.
- Quiet/ghost: text only, `ink-2`, hover ink + 1px underline offset 4.
- The gold `classical` variant is **retired as a button style**; gold never
  fills a control in B. Where today's UI puts a gold Start button (dashboard
  today-card, routine cards), B puts the crimson primary — starting a workout
  is an action, not an honour.
- Destructive: crimson outline (1px `action`, `action` text) rather than a
  second crimson fill, so "Finish" and "Discard" never look identical.
- Disabled: `ink-3` text on `surface-sunk`, no border tint; `SOON` badges are
  bronze-outline 10px upper.

## B. Cards

B de-boxes. The `Card` primitive keeps its API but its default variant loses
the border and the fill: a "card" in B is a region delimited by rules, on the
ground, with `surface` used only when a region contains wells (forms, the set
logger).

- `panel` — `surface`, 2px radius, 1px `rule`; used for forms (settings,
  wizard step body, session progress) where inputs need a lighter ground.
- `ruled` — no fill, no box: inscription + double rule above, `rule-faint`
  below the region. Default for lists: recent activity, personal records,
  history, routine cards. Routine cards become ruled entries separated by
  `rule-faint`, with the favourite heart and menu as right-aligned row
  actions; the list reads as one ledger page instead of twenty boxes.
- `sunk` — `surface-sunk`, 0 radius: set-input rows in the session logger,
  the email well in settings.
- History at 768+ is a ruled table: one header row of labels under a double
  rule, then rows; the outer card and the per-row cards both disappear.

## B. Inputs

- Wells: `surface-sunk`, 0 radius, 1px `rule` only on focus-off contrast —
  i.e. no resting border; the tonal step is the box. Focus adds a 1px
  `action` border plus 2px ring at 20%.
- Height 40 desktop / 44 mobile (16px text below `md` preserved).
- Set logger: the Reps / Weight / RPE strip becomes one `sunk` row with
  vertical `rule-faint` separators between fields and Space Mono 15 values;
  targets sit under each field as 11.5 upper `ink-3` labels. The checkbox
  column keeps its square, 2px radius, `action` when checked.
- Labels above, 13 Oswald 500; required marks crimson.

## B. Navigation

- Sidebar becomes an index column: ground-coloured (no panel fill), 1px
  `rule` on its right edge, Cinzel 900 wordmark, items in Oswald 500 14 with
  12px upper group rules between clusters (train / archive / account).
- Active item: no filled block. A 3px `honour-bright` left rule, ink text at
  600, and the item's icon in `honour-bright`. Hover: `surface` fill + ink.
  The light-theme black active slab and the dark-theme ivory slab both retire
  — the inversion was the loudest thing on every screen.
- Topbar: ground-coloured, 1px `rule` below, page inscription in Cinzel with
  its corner brackets; search becomes a 2px-radius well (`surface-sunk`)
  instead of a pill; avatar and theme toggle unchanged in place.
- Mobile drawer keeps its behaviour; its items adopt the same rule-active
  language.

## B. Responsive, and what 1280+ is for

`sm` / `md` keep their jobs. **1280+ is for the open ledger.** At `xl`:

- Ground padding grows to 48 and regions run edge-to-edge of the content
  column (no centred cap): ruled tables and lists want full measure, the
  opposite of A's capped rest.
- Ruled tables gain their final column set: history shows status and volume
  as right-aligned mono columns; recent activity shows sets / volume /
  duration as three mono columns instead of badge chips.
- The dashboard stat row sets six values in one ruled band (label over
  number over footnote, separated by vertical `rule-faint`) instead of a
  3×2 card grid — same six stats, same order, same component, presented as a
  single inscription band.
- Type step: page inscription 34→38, stat value 52→60.

Again presentational only: column counts and padding inside existing
components; no new regions, no route or behaviour change.

## B. Motion

Same token names as A (one motion system whichever direction wins), different
signature:

- `fast` 120ms, `base` 200ms, `slow` 300ms; easings `standard`
  `cubic-bezier(0.2, 0, 0, 1)`, `exit` `cubic-bezier(0.4, 0, 1, 1)`.
- Signature motion is the **rule draw**: when a region mounts or a tab
  switches, its double rule scales in on X from the left, 240ms `standard`,
  once per region per visit — the inscription being cut. Content under the
  rule does not fade or rise; it is simply there when the rule lands.
- Nav active rule slides between items at 200ms `standard` (transform only).
- Dialogs: scrim 150ms, panel opacity 180ms + 4px rise, exit 120ms.
- Progress and completion bars: width 300ms `standard`; honour-gold fills
  draw once on first reveal, never loop.
- Press: 1px translate, 0ms. Theme crossfade keeps 300ms.
- Session screen: CSS-only, as the plan requires. Reduced motion: rules
  appear instantly, everything else opacity-only at `fast`.

## B. Effort, honestly

- The same 436 raw palette classes, but the amber split is a *semantic*
  triage, not a mechanical map: each of the ~74 amber sites must be judged
  action-crimson (~20: starts, saves, active tabs, focus), honour-gold
  (~30: records, streaks, completion, brackets) or plain ink (~24: washes and
  tints that should never have been coloured). The ~170 `neutral-*` sites map
  to the stone ramp mechanically.
- Radius work is heavier than A: ~57 `rounded-full` and ~30 `rounded-lg/xl/2xl`
  sites change against the grain of the current markup, plus de-boxing six
  list surfaces (history, records, recent activity, routine cards, search
  results, session exercise cards) from bordered cards to ruled regions.
- The hero photo retirement touches `HeroSection` and the four
  `components/backgrounds/` overlays — deletion, not restyle.
- Net: B costs meaningfully more judgement per site than A on the same 436
  touchpoints, plus the de-boxing pass. It is still bounded: no component
  gains a prop, no hook moves.

---

# Choosing between them

- **A** is the safe hand: same silhouette, warmer ground, one gold, three
  radii, capped desktop. Its risk is that it fixes the noise but keeps the
  app looking like a themed template — the boxes-in-boxes and the poster
  headings survive.
- **B** is the identity hand: structure carries the brand, colour is rationed
  to meaning, and 1280+ finally has a purpose (the open ledger). Its risks
  are real: near-zero radius plus rule-heavy lists can read austere at 390
  where today's cards give comfortable tap targets; crimson-as-action is a
  bigger jump for existing users; and the de-boxing pass is where regressions
  would hide.
- Shared ground, so the retreat is cheap: identical colour *roles*, spacing
  base, motion tokens and the Space Mono data decision. If B's proof of
  concept fails on the densest surface, falling back to A keeps every token
  name and only swaps values, radii and the card variants.
- Suggested proof-of-concept surface for either: the active session screen at
  390 and 1440 in both themes — it holds the set logger, progress, warnings,
  badges and the broadest re-renders in the app.

Both directions fix, regardless of choice: `--destructive-foreground` in
light mode, the blue stepper, the orange Save button, the nine gold hexes,
and the 16px-below-`md` input size stays untouched in both.
