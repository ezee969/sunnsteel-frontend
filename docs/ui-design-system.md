# Sunnsteel Design System — v1.0 · LOCKED

Phase 6 of [ui-restyle-plan.md](ui-restyle-plan.md). Supersedes v0.1, which was
provisional. v0.1's history — how four exploration directions were consolidated,
and which conflicts were resolved which way — is preserved in
[ui-restyle-progress.md](ui-restyle-progress.md) under Visual Decisions and in
the two direction documents.

**LOCKED means: no new design decisions after this point.** Phases 7–15 apply
what is written here. If implementation reveals that a rule cannot hold, that is
a defect report against this document, not licence to decide something new on the
spot — the way v0.1's §4.3/§11.6 contradiction was handled in Phase 5/6.

**What changed from v0.1, in one line each:**

| | v0.1 | v1.0 | Why |
| --- | --- | --- | --- |
| Action colour | Crimson fill | **Ink** (`--primary`) | QA 1 — crimson read as error/danger |
| Crimson | Action | **Destructive only** | Red now means exactly one thing |
| Completion | Gold | **Green (`--success`)** | QA 4, 6 — gold had no singular meaning |
| Gold | Everything earned | **Exceeded expectation only** | QA 4 — records, improvements, streaks |
| Warning | A text colour | **Non-text role only** | Measured: indistinguishable from gold under CVD |
| Inputs | No resting border | **Explicit boundary, both themes** | QA 2, 11 — fields lost their affordance |
| Light `--ink-3` | 2.92:1 | **4.75:1** | Phase 4 measured an AA failure |

**Every colour value in §4 is verified**, not asserted: contrast and
colour-difference figures were computed from the oklch→sRGB transform against the
exact backdrops each role sits on. §4.4 carries the numbers.

---

## 1. What survived the proof of concept, and what did not

Phase 4 applied v0.1 to the active session screen; Phase 5 reviewed it
([ui-poc-review-sol.md](ui-poc-review-sol.md)). §16 logs every QA point and its
disposition.

**The structural direction survived and is kept.** Identity is carried by
structure — Cinzel inscription type, hairline rules instead of card boxes,
near-zero radii, a stone ground, tabular figures. Measured on identical content,
the session screen went from 4768px to 3728px at 1440 (**−22%**) with no
horizontal overflow at any width from 320 to 1440 in either theme. That is the
bet §1.4 of v0.1 made, and it paid.

**The colour semantics did not survive and are replaced.** Crimson-as-action was
the single highest-risk decision in v0.1, flagged as such when it was taken. Two
independent sources rejected it: Phase 4 measured 16 crimson fills on one screen
against a rule permitting one, and Phase 5 reported that the result "reads as a
page full of errors or destructive controls, not successful completion".

It is worth being precise about *why*, because the fix follows from it. v0.1 gave
crimson to the primary action **and** to a repeated list control (the set
checkbox, §11.6), while §4.3 rule 1 permitted one action element per region.
Those cannot both hold on a screen with fifteen sets. Behind that lay a deeper
error: the system had two warm accents, gold and crimson, and assigned each of
them several unrelated jobs. Gold marked progress, set numbers, exercise status,
completion, records, active rules **and** warnings, so "COMPLETE", "IMPROVEMENT"
and "1 set remaining" shared one voice while meaning success, reward and risk.

v1.0 fixes this by giving every accent exactly one job (§4.3) and by moving the
primary control off the accent scale entirely.

**Note on the retreat.** v0.1 §14 offered an A-family retreat that swapped the
action colour to gold. That is *not* what happened here, and it would have made
QA 4 worse. Ink is the primary control colour in Opus-A, Opus-B and Qwen-A —
three of the four explorations — so this is a return to the majority position,
not a new invention.

---

## 2. Correctness fixes carried forward from v0.1

All still apply, and one is now measured rather than asserted.

### 2.1 `--destructive-foreground` equals `--destructive` in light mode

`app/globals.css` today:

```css
--destructive: oklch(0.577 0.245 27.325);
--destructive-foreground: oklch(0.577 0.245 27.325);
```

Identical, so destructive-on-destructive is invisible in light mode only.
`components/ui/button.tsx` hides it by hardcoding `text-white`, which is why it
went unnoticed and why the token is never exercised. **Fixed in §4:**
`--destructive-foreground` is the ivory on-colour, verified at **6.22:1** in
light and **5.88:1** in dark. `button`'s destructive variant stops hardcoding
`text-white`.

### 2.2 Every colour token has a real value per theme

The shipped palette is `oklch(L 0 0)` — chroma zero — for every role except
`--destructive` and five unused `--chart-*`. §4 defines every role twice with
real chroma; dark is a remap of the same roles, not an inversion.

### 2.3 Light mode failed AA on the roles v0.1 assigned to captions

Phase 4 measured this on the rendered screen. v0.1 §4.1 explicitly claimed gold
was "AA on ground and surface"; it was not.

| Role | v0.1 measured | v1.0 computed | AA |
| --- | --- | --- | --- |
| `ink-3` on `surface-sunk` | 2.55 | **4.75** | 4.5 |
| `ink-3` on ground | 2.90 | 4.75 | 4.5 |
| gold as text on `surface-sunk` | 3.44 | **5.30** | 4.5 |
| gold as text on ground | 3.92 | 5.30 | 4.5 |

### 2.4 What must not be touched

- **`input` keeps 16px below `md`.** iOS zoom-on-focus mitigation (TD-29), not a
  type choice. §5.2 and §11.6 preserve it, and §11.6's new field boundary is
  specified so as not to disturb it.
- **No `tailwind.config.ts`.** Tailwind v4 here is CSS-first and nothing loads a
  config via `@config`; one would be silently ignored.
- **No new breakpoints.** v4 defaults `sm`–`2xl` only. An undefined variant emits
  no CSS and no error — TD-28 and TD-29, twice.
- **Radix primitives are styled, never replaced.** Phase 4 nearly swapped
  `Progress` for a styled `div`, which would have silently dropped the
  `progressbar` role and value.

---

## 3. Token architecture

Unchanged from v0.1 and validated by the proof of concept: **keep the shadcn
token names, re-value them, and add roles only where shadcn has no equivalent.**
Phase 4 confirmed the mechanism works — re-valuing the tokens inside a wrapper
moved one whole section onto the new palette with no call-site changes.

### 3.1 Two shadcn tokens are not repurposed

- **`--accent` stays the neutral hover surface.** In shadcn it means "the fill a
  ghost or outline control takes on hover" (30 call sites). It is not a brand
  accent.
- **`--primary` stays ink — and in v1.0 it *is* the action colour.** v0.1 added a
  separate `--action` so that promoting a site to crimson stayed deliberate. With
  the primary control back on ink, that indirection buys nothing and costs
  clarity, so **`--action`, `--action-hover` and `--on-action` are removed.**
  `--primary-hover` is added for the hover step.

### 3.2 Roles added beyond shadcn

| Token | Job | May be text? |
| --- | --- | --- |
| `--surface`, `--surface-sunk` | Panel and well tones | — |
| `--rule`, `--rule-faint` | Structural hairline; row separator | — |
| `--ink-2`, `--ink-3` | Secondary text; tertiary captions | yes |
| `--primary-hover` | Hover step for the one control colour | — |
| `--success`, `--success-strong` | Completion, as text / as mark | yes / no |
| `--honour`, `--honour-strong` | Exceeded expectation, as text / as mark | yes / no |
| `--warning-strong` | Risk. **Non-text only** (§4.3 rule 4) | **no** |
| `--scrim` | Overlay backdrop | — |

Each semantic role has a **text-grade** value cleared to 4.5:1 and, where it is
also drawn as a mark, a **strong** value cleared to 3:1. Warning has only a
strong value, deliberately.

### 3.3 `ink-2` / `ink-3` versus `muted-foreground`

shadcn has one step between foreground and nothing (`muted-foreground`, 183 call
sites); the system needs two. `--muted-foreground` is re-valued to equal
`--ink-2`, and `--ink-3` is added for the caption rank. Sites that should be
`ink-3` are promoted per batch during Phase 8; sites left alone stay correct at
`ink-2`, so no call site is wrong at any point in the migration.

---

## 4. Colour

Values are **oklch**, matching the file they land in. Hex is given as a reviewer
aid and is computed from the same transform used for the contrast figures, so the
two cannot drift.

### 4.1 Light — "Stone"

| Role | Token | oklch | hex |
| --- | --- | --- | --- |
| Ground | `--background` | `oklch(0.935 0.012 88)` | `#ede9e1` |
| Surface | `--card`, `--popover`, `--surface` | `oklch(0.975 0.008 88)` | `#f9f7f1` |
| Sunken | `--surface-sunk` | `oklch(0.893 0.014 86)` | `#e0dbd2` |
| Muted fill | `--muted`, `--secondary`, `--accent` | `oklch(0.912 0.010 87)` | `#e7e3da` |
| Rule | `--rule`, `--border`, `--input` | `oklch(0.750 0.014 84)` | `#b2ada4` |
| Rule, faint | `--rule-faint` | `oklch(0.840 0.010 86)` | `#cdcac3` |
| Ink | `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground` | `oklch(0.235 0.014 62)` | `#231d17` |
| Ink 2 | `--ink-2`, `--muted-foreground` | `oklch(0.400 0.013 62)` | `#4d4641` |
| Ink 3 | `--ink-3` | `oklch(0.480 0.012 70)` | `#625d56` |
| Action | `--primary` | `oklch(0.235 0.014 62)` | `#231d17` |
| Action hover | `--primary-hover` | `oklch(0.170 0.014 62)` | `#140e09` |
| On action | `--primary-foreground` | `oklch(0.975 0.008 88)` | `#f9f7f1` |
| Success | `--success` | `oklch(0.480 0.100 152)` | `#296d40` |
| Success mark | `--success-strong` | `oklch(0.560 0.110 152)` | `#3a8753` |
| Honour | `--honour` | `oklch(0.455 0.090 90)` | `#6a5407` |
| Honour mark | `--honour-strong` | `oklch(0.575 0.115 90)` | `#93750a` |
| Warning mark | `--warning-strong` | `oklch(0.560 0.130 52)` | `#ae5b1d` |
| Destructive | `--destructive` | `oklch(0.495 0.170 28)` | `#ae2923` |
| On destructive | `--destructive-foreground` | `oklch(0.975 0.008 88)` | `#f9f7f1` |
| Focus ring | `--ring` | `oklch(0.235 0.014 62)` | `#231d17` |
| Scrim | `--scrim` | `oklch(0.235 0.014 62 / 0.42)` | — |

### 4.2 Dark — "Night"

| Role | Token | oklch | hex |
| --- | --- | --- | --- |
| Ground | `--background` | `oklch(0.155 0.010 70)` | `#0f0c08` |
| Surface | `--card`, `--popover`, `--surface` | `oklch(0.205 0.011 70)` | `#1a1612` |
| Sunken | `--surface-sunk` | `oklch(0.118 0.009 70)` | `#070503` |
| Muted fill | `--muted`, `--secondary`, `--accent` | `oklch(0.248 0.011 70)` | `#221e1a` |
| Rule | `--rule`, `--border`, `--input` | `oklch(0.370 0.012 72)` | `#443f39` |
| Rule, faint | `--rule-faint` | `oklch(0.295 0.010 72)` | `#2f2b26` |
| Ink | `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--accent-foreground` | `oklch(0.940 0.010 88)` | `#eeebe4` |
| Ink 2 | `--ink-2`, `--muted-foreground` | `oklch(0.790 0.010 84)` | `#bdbab3` |
| Ink 3 | `--ink-3` | `oklch(0.640 0.010 80)` | `#8f8c85` |
| Action | `--primary` | `oklch(0.940 0.010 88)` | `#eeebe4` |
| Action hover | `--primary-hover` | `oklch(0.870 0.010 88)` | `#d7d4cd` |
| On action | `--primary-foreground` | `oklch(0.155 0.010 70)` | `#0f0c08` |
| Success | `--success` | `oklch(0.775 0.095 152)` | `#87c898` |
| Success mark | `--success-strong` | `oklch(0.740 0.105 152)` | `#76be8a` |
| Honour | `--honour` | `oklch(0.800 0.100 90)` | `#d7bb70` |
| Honour mark | `--honour-strong` | `oklch(0.840 0.110 90)` | `#e6c873` |
| Warning mark | `--warning-strong` | `oklch(0.760 0.125 52)` | `#ef9963` |
| Destructive | `--destructive` | `oklch(0.660 0.150 28)` | `#df695c` |
| On destructive | `--destructive-foreground` | `oklch(0.155 0.010 70)` | `#0f0c08` |
| Focus ring | `--ring` | `oklch(0.840 0.110 90)` | `#e6c873` |
| Scrim | `--scrim` | `oklch(0.075 0.006 70 / 0.62)` | — |

The focus ring differs per theme on purpose: ink is invisible as a ring on a
near-black ground, so dark uses the honour mark.

### 4.3 Colour rules

System invariants. A violation is a defect, not a variation.

1. **One primary control per region.** Filled `--primary` marks the single most
   important action. A repeated list control is never the primary — that is the
   error v0.1 made with the set checkbox.
2. **`--success` means "done, as planned."** Set complete, exercise complete,
   session complete. It is the completion language and it is the *only*
   completion language.
3. **`--honour` means "better than planned."** Personal records, improvements
   over last time, streaks. Never completion, never status, never decoration.
   **At most two honour marks per viewport**, and never more than one per row.
   This cardinality limit is what v0.1 lacked, and its absence produced 43 gold
   marks on one screen.
4. **`--warning-strong` is a mark, never text.** Risk is carried by an icon plus
   a left rule in `--warning-strong`, with the copy in `--ink` or `--ink-2`.
   Reason, measured: gold and amber cannot be reliably separated by hue. Their
   perceptual distance is ΔEok 0.054–0.109, and under simulated deuteranopia they
   converge to a distance of 3.6–16.7 on a 0–100 scale — i.e. the same colour.
   No pair of values fixes this, so the system removes the collision instead of
   tuning it.
5. **`--destructive` is crimson and means only destruction.** It fills a control
   only when that control destroys data. Elsewhere it is an outline plus text.
   Because nothing else in the system is red, red is unambiguous.
6. **No accent ever fills a large area**, and no accent appears as a gradient.
7. **Disabled is `--ink-3` on `--surface-sunk`**, never a global opacity
   reduction — opacity dims the border and the focus ring with the text.
8. **Colour never carries information alone.** Every state that has a colour also
   has a glyph, a label or a rule: completion has a check, honour has an arrow,
   warning has a triangle, destructive has its wording.

### 4.4 Verification

Computed from the oklch→sRGB transform, worst case across `--background`,
`--surface` and `--surface-sunk`. Text roles target WCAG AA 4.5:1; marks target
3:1.

| Role | Light | Dark | Target |
| --- | --- | --- | --- |
| `ink` | 12.13 | 15.04 | 4.5 |
| `ink-2` | 6.70 | 9.27 | 4.5 |
| `ink-3` | 4.75 | 5.33 | 4.5 |
| `success` | 4.52 | 9.14 | 4.5 |
| `honour` | 5.30 | 9.59 | 4.5 |
| `destructive` | 4.85 | 5.39 | 4.5 |
| `success-strong` | 3.21 | 8.11 | 3.0 |
| `honour-strong` | 3.19 | 10.97 | 3.0 |
| `warning-strong` | 3.54 | 8.05 | 3.0 |
| `primary-foreground` on `primary` | 15.54 | 16.40 | 4.5 |
| `destructive-foreground` on `destructive` | 6.22 | 5.88 | 4.5 |
| `rule` vs its grounds | 1.62 | 1.72 | ≥1.5 |

`ink-2` and `ink-3` are a real step apart (ΔEok 0.080 light, 0.150 dark), which
v0.1's values were not — there they collapsed to nearly the same colour.

**These are computed, not observed.** Phase 7 must re-measure them in the browser
once the tokens land, exactly as Phase 4 did; a computed figure and a rendered
one agreed to within 0.02 last time, but agreement is checked, not assumed.

---

## 5. Typography

Five faces, five jobs. The fifth, the body face, was added by §23 (UX-14,
2026-09-30); until then this read "four faces, four jobs, no new font payload".

### 5.1 Loaded weights — a constraint, not a preference

| Face | Loaded | Job |
| --- | --- | --- |
| Cinzel | **600 only** | Page and section inscriptions; wordmark (§18) |
| Bebas Neue | **400 only** | Large numerals only |
| Source Sans 3 | Variable (one file) | Body, body small (§23) |
| Oswald | 400, 500, 600, 700 | Labels, item titles, buttons |
| Space Mono | **400, 700 only** | All data: weights, reps, dates, durations, timers |

Asking for an absent weight synthesises or falls back silently. Every value below
uses a loaded weight. Adding one is a font-payload decision, deliberately taken
once already (CL-07), and is **not** taken here.

### 5.2 Scale

| Rank | Face / weight | Mobile | Desktop | Line | Tracking | Case |
| --- | --- | --- | --- | --- | --- | --- |
| Page title | Cinzel 600 | 24 | 32 | 1.20 | 0.045em | UPPER |
| Section heading | Cinzel 600 | 16 | 18 | 1.25 | 0.06em | UPPER |
| Panel / item title | Oswald 600 | 15 | 16 | 1.30 | 0.02em | Sentence |
| Body | Source Sans 3 400 | 15 | 15 | 1.60 | 0 | Sentence |
| Body small | Source Sans 3 400 | 14 | 14 | 1.50 | 0 | Sentence |
| Label | Oswald 500 | **12** | 12 | 1.30 | **0.06em** | UPPER |
| Button | Oswald 600 | 14 | 14 | 1 | 0.04em | UPPER |
| Numeral, large | Bebas Neue 400 | 40 | 52 | 0.95 | 0.02em | — |
| Data | Space Mono 400 | 13 | 13 | 1.50 | 0 | — |
| Data, emphatic | Space Mono 700 | 13 | 13 | 1.50 | 0 | — |
| Wordmark | Cinzel 600 | unchanged | — | 0.12em | UPPER |

Changed from v0.1: page title 26/34 → **24/32** and tracking 0.06em → 0.045em
(QA 5 — Cinzel's width was truncating titles); section 17 → **16** on mobile;
label 11.5 → **12px** and tracking 0.10em → **0.06em** (QA 3, 10).

**Input text is 16px below `md`, always** — not a design decision (§2.4).

### 5.3 Where each rank may be used

QA 10 found the type system over-applied: widely tracked uppercase micro-caps in
the masthead, the progress panel, every set, every target and every status,
producing "visual chatter around the values users need during a workout". The
scale is therefore now **scoped**, not just sized:

- **Label (uppercase, tracked)** is for **region-level captions only** — the
  masthead summary, a panel heading, a table column header. It is **not** used
  inside a repeated row.
- **Inside a repeated row**, captions are Body small in `--ink-3`, sentence case,
  untracked. A set's "Target: 3-5" is body small, not a micro-cap.
- **Data** is Space Mono wherever a number stands alone (§23.3: a number inside a sentence takes the sentence's face). It is monospaced,
  therefore tabular by construction: weights, volumes, durations and timers stop
  reflowing as digits change.
- **Large numerals** are Bebas, and only where a number is the headline of its
  own block. Bebas-on-everything was the old habit; it does not return.
- **Cinzel** appears at most twice per screen: the page inscription and, where a
  screen has them, section headings. Never below 16px.

### 5.4 Durations render in a fixed slot

An elapsed time is a live value whose *string length* changes — `formatDuration`
omits seconds when they are zero, so "115h 10m 17s" becomes "115h 10m" once a
minute. Rendered in a shrink-to-fit slot this shifts its neighbours. Durations
therefore render in Space Mono in a slot with a reserved minimum width.

This is the one thing QA 14 was right about, though not for the reason given —
see §16.

### 5.5 The `h1`–`h4` element rule, and how it is retired

`app/globals.css` forces every `h1`–`h4` to Bebas Neue, uppercase, 0.05em — the
rule that flattens four ranks into one texture. It cannot be re-pointed in one
edit without changing every heading in the app at once.

Migration, confirmed working in Phase 4: `.type-*` classes live in
`@layer components`, and a class beats an element selector, so a migrated heading
wins while an unmigrated one keeps working. The element rule is deleted in the
**last** Phase 8 batch. This is the only deliberate transitional overlap in the
system.

---

## 6. Spacing

Base 4. Scale: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96**.

| Context | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Region rhythm | 32 | 48 | 64 |
| Panel padding | 16 | 24 | 32 |
| List row padding (vertical) | 12 | 12 | 16 |
| Below a rule, before content | 16 | 16 | 16 |
| Above a rule | 24 | 24 | 24 |
| Page gutter | 16 | 32 | 48 |
| Above the page inscription | 32 | 64 | 96 |

- **More space above a heading than below it, always.**
- **96 appears exactly once per page**, above the page inscription.

**This scale is a convention enforced by review, not by CSS.** Tailwind v4
derives spacing from one `--spacing` multiplier, so `p-5` and `p-7` exist whether
or not the scale names them. Defining `--spacing-region` would add a utility, not
remove the others. Only the page gutter and content cap are tokenised, because
they live in one layout wrapper rather than scattered through markup.

---

## 7. Radii

| Token | Value | Applies to |
| --- | --- | --- |
| `--radius-none` | `0` | Ledger rows, wells, table cells, badges, section blocks |
| `--radius-sm` | `2px` | Buttons, inputs, checkboxes, panels |
| `--radius-md` | `4px` | Dialogs, dropdowns, popovers, toasts |
| `--radius-full` | `9999px` | Avatars only |

### 7.1 Most of the radius migration is a token change

`@theme inline` derives `--radius-sm/md/lg/xl` from `--radius`. Setting
`--radius: 6px` re-points `rounded-sm`→2px and `rounded-md`→4px through the
existing `calc()`, with no markup change — **verified in Phase 4**, where the
whole session screen picked up the new scale from one declaration. That covers
`rounded-sm` (6), `rounded-md` (54), `rounded-lg` (30) and `rounded-xl` (6):
**96 occurrences**.

`--radius-lg` and `--radius-xl` collapse onto 4px rather than being deleted, so
those 36 sites re-point instead of breaking; Phase 15 can normalise them to
`rounded-md` with no visual effect.

The remainder needs per-site work: **`rounded-full` (57)**, mostly badges and
rectangular chips that become 0 or 2px, with avatars keeping it — largely a
Phase 7 job — plus ~23 stragglers (`rounded-2xl`, `rounded-xs`, bare `rounded`).

---

## 8. Shadows and elevation

**Elevation is tonal, not shadowed.** Three steps, in this order: `background`
(ground) → `surface` (panel) → `surface-sunk` (well). In dark the well is
*darker* than the ground, which reads as carved rather than floated.

**One shadow exists**, light mode only:

```css
--shadow-overlay: 0 16px 40px -12px oklch(0.235 0.014 62 / 0.32);
```

It applies to exactly three things: dialogs, dropdowns/popovers, toasts. In dark
it is `none`; overlays separate by `--scrim` plus a 1px `--rule`.

Retired: `shadow-lg` (17), `shadow-md` (9), `shadow-xs` (9), `shadow-inner` (1),
most `shadow-sm` (14), and all three coloured shadows, which belong to no system.

**If a surface needs a shadow to be understood, it is in the wrong tonal step.**

---

## 9. Motion

| Token | Value | Use |
| --- | --- | --- |
| `--motion-fast` | `120ms` | Colour, border and icon tint on hover/focus |
| `--motion-base` | `200ms` | Control state, tab switch, dropdown enter |
| `--motion-slow` | `300ms` | Dialog enter, drawer, theme crossfade, progress width |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Entering or changing |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving |

Exits run at 60–70% of their enter duration: dropdown 140ms, dialog 180ms,
drawer 200ms.

### 9.1 Signature motion

Two, each used in exactly one place — that is what keeps them meaningful.

1. **The rule draw.** A region's heading rule scales in on X from the left over
   240ms `standard`, once per region per visit. Content under it does not fade or
   rise; it is simply there when the rule lands.
2. **Set completion.** A completed set's left mark fills top to bottom over
   300ms and the row settles onto the completed tone. This is the one moment in
   the app that earns reward feedback.

The nav active marker slides between items at 200ms, transform only. That is
chrome, not signature.

### 9.2 Prohibited

No page-level entrance animation — `animate-in fade-in slide-in-from-bottom`
currently runs on whole pages, delays perceived load and is the exact trope the
plan forbids. No fade-up per section, no scale-on-hover, no floating cards, no
glow, no animated gradients. Hover changes colour only, never transform. Press
stays the existing `translate-y-[1px]` at 0ms.

### 9.3 `prefers-reduced-motion`

Both signatures collapse to an instant colour change; everything else becomes
opacity-only at `--motion-fast`. Width and transform animations off.

### 9.4 The session screen animates with CSS only

No `React.memo` anywhere and `groupSetLogsByExercise` rebuilds every object per
call, so every prop into that screen is a fresh reference and it re-renders
broadly (TD-07).

### 9.5 Tailwind v4 has no `--duration-*` namespace

`--ease-*` **is** a v4 theme namespace and yields `ease-standard`. `--duration-*`
is **not**, so `--motion-base` in `@theme` would emit nothing, silently.
Durations are plain `:root` custom properties consumed as
`duration-[var(--motion-base)]`.

**Verified working in Phase 4**: measured 0.12s / 0.2s / 0.3s on rendered nodes,
and `ease-standard` resolved to its curve. This closes v0.1's open question 5.

---

## 10. Responsive

No new breakpoints. Tailwind v4 defaults only: `sm` 640, `md` 768, `lg` 1024,
`xl` 1280, `2xl` 1536.

| Range | Gutter | Content | Behaviour |
| --- | --- | --- | --- |
| < 640 | 16 | fluid | Single column. Ledger rows collapse to two lines: title, then inline data separated by middots. The status mark survives the collapse |
| 640–1023 | 24 | fluid | Ledger keeps three columns |
| 1024–1279 | 32 | 960 | Two-column where content allows |
| 1280–1535 | 48 | 1200 | The open ledger — §10.1 |
| ≥ 1536 | fluid | 1200 | Gutters absorb the extra; line length never exceeds ~90ch |

### 10.1 What ≥1280 is for

`xl:` appears **once** in the whole codebase today; 1440 is 768 stretched. At
`xl` the app becomes an open ledger: ruled tables gain their final columns
(history shows status and volume as right-aligned mono columns), the dashboard
stat row becomes one ruled band rather than a 3×2 card grid, and type steps once
(page title 32 → 36, large numeral 52 → 60).

All of that is column counts and padding inside components that already render
that data. No new region, no new data, no route change.

### 10.2 Wider is not the same as looser

QA 7 found the failure mode this rule exists to prevent: at 1440 three small
numeric fields were stretched across the full 1200px column, leaving hundreds of
pixels between a label and its value. **A field or control never grows past the
width its content needs.** Concretely: numeric entry fields cap at 96px, a data
cluster caps at 480px, and surplus width goes to the gutter or to additional
columns — never to stretching a two-digit number across a third of the screen.

### 10.3 The `sm`/`md` cliff stays

`sm:` is used 290 times against `md:` 51 and `lg:` 26; the app is effectively a
two-state layout. Rebalancing that is a layout rewrite, not a restyle, and would
put all 290 sites in scope. v1.0 adds `xl` behaviour on top and does not
redistribute what is there. **Expect Phase 9 to find 320–639 rendering
identically. That is pre-existing; record it, do not fix it.**

---

## 11. Components

### 11.1 `@theme inline` additions

Every new colour follows the existing pattern: declare the raw variable in
`:root` and `.dark`, then alias it inside `@theme inline`. `inline` means the
generated utility references `var(--x)` rather than re-declaring it, which is why
the `.dark` override works.

```css
@theme inline {
  /* ...existing --color-* aliases, unchanged... */
  --color-surface: var(--surface);
  --color-surface-sunk: var(--surface-sunk);
  --color-rule: var(--rule);
  --color-rule-faint: var(--rule-faint);
  --color-ink-2: var(--ink-2);
  --color-ink-3: var(--ink-3);
  --color-primary-hover: var(--primary-hover);
  --color-success: var(--success);
  --color-success-strong: var(--success-strong);
  --color-honour: var(--honour);
  --color-honour-strong: var(--honour-strong);
  --color-warning-strong: var(--warning-strong);
  --color-scrim: var(--scrim);

  --radius-none: 0px;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 4px;
  --radius-xl: 4px;

  /* --ease-* IS a v4 namespace; --duration-* is NOT (§9.5) */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  --shadow-overlay: 0 16px 40px -12px oklch(0.235 0.014 62 / 0.32);
}
```

`--action`, `--action-hover` and `--on-action` from v0.1 are **not** declared.

### 11.2 The custom utility layer

Confirmed working in Phase 4, including that `@layer components` classes beat the
`h1`–`h4` element rule.

```css
:root {
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --motion-slow: 300ms;
  --content-max: 1200px;
  --field-max: 96px;   /* §10.2 */
  --cluster-max: 480px;
}

@layer components {
  .type-page      { /* Cinzel 600, 24→32, 1.20, 0.045em, uppercase */ }
  .type-section   { /* Cinzel 600, 16→18, 1.25, 0.06em,  uppercase */ }
  .type-panel     { /* Oswald 600, 15→16, 1.30, 0.02em */ }
  .type-label     { /* Oswald 500, 12,    1.30, 0.06em,  uppercase */ }
  .type-body-sm   { /* Oswald 400, 13,    1.45 */ }
  .type-data      { /* Space Mono 400, 13, 1.50, tabular */ }
  .type-numeral   { /* Bebas 400, 40→52, 0.95, 0.02em */ }

  .rule-heading   { /* 3px double border-bottom in --rule */ }
  .rule-row       { /* 1px border-bottom in --rule-faint */ }
  .mark           { /* 3px left border, transparent by default */ }
  .mark-success   { /* border-left-color: var(--success-strong) */ }
  .mark-honour    { /* border-left-color: var(--honour-strong) */ }
  .mark-warning   { /* border-left-color: var(--warning-strong) */ }

  .ledger-page    { /* max-width var(--content-max), gutters per §10 */ }
  .duration-slot  { /* Space Mono, min-width reserved (§5.4) */ }
}
```

The double rule appears **once per page**, under the page inscription.

### 11.3 What is deleted from the current file

| What | Why |
| --- | --- |
| The 12 `--ss-*` palette variables | Superseded. `--ss-crimson` → `--destructive`; `--ss-gold`/`-2` → `--honour`/`--honour-strong`; the rest unused |
| The three `--ss-grad-*` gradients | Gold and crimson gradients retired; `button`'s `classical`/`bronze` are their only consumers |
| `--chart-1` … `--chart-5` | Nothing reads them; `recharts` was removed in CL-04 |
| The `h1`–`h4` Bebas rule | Replaced by `.type-*` — **deleted last** (§5.5) |
| `.text-gold`, `.border-gold` | Replaced by `text-honour` / `border-honour` |
| `.bg-marble-light` | The marble wash is retired; also kills `button`'s `marble` variant |

`body`'s `duration-300` becomes `var(--motion-slow)`. The cursor policy and
`.hide-scrollbar` stay.

### 11.4 Buttons

Phase 7. Heights 36 / 40 / 44 (sm / default / lg), radius 2px, label Oswald 600
14, press stays `translate-y-[1px]`. Since §23.2 (UX-15) only the filled
variants, `default` and `destructiveSolid`, are uppercase at 0.04em
(`type-button`); every other variant is sentence case at 0.01em
(`type-action`).

| Variant | Treatment | Change from today |
| --- | --- | --- |
| `default` | Solid `--primary`, `--primary-foreground` text | Value only |
| `secondary` | 1px `--rule`, `--surface` fill | |
| `outline` | 1px `--rule`, transparent; hover fills `--surface` | |
| `ghost` | Text only, `--ink-2`; hover ink + underline offset 4 | |
| `destructive` | **1px `--destructive` border + `--destructive` text**, no fill | Stops hardcoding `text-white` (§2.1) |
| `link` | `--primary` text, underline on hover | |
| `classical` | **Retired** | Gold never fills a control |
| `bronze` | **Retired** | Near-duplicate of a retired variant |
| `marble` | **Retired** | Depends on `.bg-marble-light`, deleted |

`destructive` fills only when the control destroys data (§4.3 rule 5); the
outline is the default because most destructive controls sit beside a primary.

Retiring three variants is a public-API change to a primitive used in 50 files.
`grep -r 'variant="classical"'` before the Phase 7 batch and convert call sites
in the same commit; never leave a variant name that silently falls through.

Focus ring: 2px `--ring` at offset 2 — ink in light, honour mark in dark.

### 11.5 Cards

Three variants replace the copied `bg-card/50 + backdrop-blur-sm +
border-border/40` string (~15 call sites), which is deleted. Nothing in this
system is translucent: the blur costs a composite per card to reveal nothing.

| Variant | Treatment | Default for |
| --- | --- | --- |
| `ruled` | No fill, no box. Section heading + `.rule-heading` above, `.rule-row` between items | **Default.** History, records, recent activity, routine cards, search results |
| `panel` | `--surface`, 2px radius, 1px `--rule`, no shadow | Forms: settings, wizard step body |
| `sunk` | `--surface-sunk`, 0 radius | Wells: set-log rows, the email field |

Only three things stay boxed: overlays, the set rows in an active session, and a
screen's single primary call to action.

### 11.6 Inputs — revised from v0.1

v0.1 specified "no resting border — the tonal step is the box". **Phase 5
rejected that** (QA 2): the fields read as a read-only ledger, and because
`Input`'s base class carries `dark:bg-input/30`, dark got wells while light got
none — one component with two models.

v1.0:

- **Every editable field has a visible resting boundary in both themes**: 1px
  `--rule` on all sides, `--surface` fill on a `--surface-sunk` row (light) and
  `--surface` fill on the same row (dark). The fill is specified per theme so no
  primitive-level `dark:` rule decides it by accident.
- Focus: 1px `--ring` border plus a 2px ring at 40%.
- Height 40 desktop / 44 mobile. **16px text below `md`, preserved** (§2.4).
- Invalid: `--destructive` border and ring **plus text** — never colour alone.
- Labels above in Body small `--ink-3`; helper text 12px `--ink-3`.
- **Numeric fields cap at `--field-max` (96px)** and the row's data cluster at
  `--cluster-max` (§10.2).

### 11.7 The set-log row

The densest control in the app and the one Phase 4 proved on, so it is specified
directly rather than left to inference.

- The row is a `sunk` well, square, with a `.mark` on the left.
- **Completion is `--success`**: a checked box in `--success-strong`, a
  `.mark-success` left rule, and the row settling onto a completed tone. Not
  gold, and not the primary control colour.
- Reps / Weight / RPE are bounded fields (§11.6), separated by 1px
  `--rule-faint`, values in Space Mono.
- Captions under each field are Body small in `--ink-3`, sentence case — **not**
  uppercase micro-caps (§5.3).
- An improvement over last time is the row's one honour mark: an arrow glyph plus
  `--honour` text. Absent when there is no improvement.
- Save state is drawn on the checkbox as a ring — `--warning-strong` saving,
  `--success-strong` saved, `--destructive` error — and announced to screen
  readers, because colour never carries it alone (§4.3 rule 8). A ring is a
  box-shadow and costs no layout width, which is why it lives there (TD-28).

### 11.8 Progress is stated once per screen

QA 9 found completion stated six ways on one screen: `COMPLETE 100%`,
`SETS 15/15`, `PROGRESS 100%`, a full bar, per-exercise `COMPLETE`, and every set
checked. **A screen states its overall progress in exactly one place.** Per-item
completion stays, because that is per-item information.

The session's primary action belongs in the masthead region as an inline control,
not in a standalone panel with its own progress bar and full-width button — QA 12
found that composition reads as a generic dashboard "metric card plus giant
button", and at desktop it became the largest object on the page despite being a
terminal action.

### 11.9 Dialogs

- Inset from the viewport by 16 at all widths — **never edge-to-edge** unless it
  is deliberately a sheet with a sheet's cues (QA 8).
- One reading axis: title, body, details and actions all left-aligned. v0.1's
  mix of left title, centred copy and left details had no stable axis.
- Actions in one row where they fit, primary last; when stacked, primary first
  and both full width. The primary is never visually dominant over the content
  it is confirming.
- `--shadow-overlay` in light, none in dark, `--scrim` behind both.
- Radix portals dialogs outside any wrapper, so a scoped palette must travel with
  the content element.

### 11.10 Navigation

- Sidebar as an index column: ground-coloured, no panel fill, 1px `--rule` on its
  right edge, the brand lockup (§18), items Oswald 500 at 14/36px.
- **Active item: no filled block.** A 3px `--honour-strong` left marker, ink text
  at 600, icon in `--honour-strong`. The light black slab and dark ivory slab
  both retire — that inversion is the heaviest object on every screen.
- Hover fills `--surface` and darkens text. Hover and active differ by colour,
  not geometry.
- Disabled / `SOON`: `--ink-3`, and `SOON` becomes the bare word at 10px
  uppercase tracked, right-aligned, no border box.
- Topbar 56 mobile / 64 desktop, ground-coloured, 1px `--rule` below, the
  sidebar collapse chevron at its leading edge on desktop (§18.3), page
  inscription with its gold corner brackets, search as a 2px well.

The active-nav marker is the one place `--honour-strong` marks something not
earned. It is grandfathered deliberately: it is a single persistent mark in the
chrome, never adjacent to content honour marks, and it is the app's existing
navigation language.

### 11.11 The masthead

QA 5: at 390 the routine title truncated to "UPPER / LOWER -…" and at 768 — the
worse case, because the summary columns appear while the container is still
narrow — to "UPPER /…". The before state showed it in full.

- The page inscription **wraps to two lines below `lg`** rather than truncating.
- The summary block (elapsed / sets / progress) collapses to its own row below
  `lg`, not below `sm`, so it never competes with the title for width.
- Cinzel tracking drops to 0.045em at the page rank (§5.2).
- Corner brackets stay: one pair per screen, on the inscription. This is the one
  ownable brand device the direction keeps.

### 11.12 Treatment follows semantics

QA 15 read the POC as "token-generated because the visual treatment is more
consistent than the interaction semantics" — the same recipe (condensed uppercase
label, gold accent, hairline rule, tinted well) applied to navigation, editable
data, completion, warning and history alike.

**Rule: surfaces are distinguishable by what they do, not only by tone.**

| Kind | Treatment |
| --- | --- |
| Editable | Bounded field, visible border, `--surface` fill, focus ring |
| Read-only data | No border, no fill, Space Mono on the row ground |
| Status | A `.mark` plus a glyph; no fill |
| Navigation | Ground-coloured, marker on active, no field affordance |
| Terminal action | Filled `--primary`, one per region |

A reviewer must be able to tell an editable field from a read-only value without
reading the label. That is the test.

---

## 12. Raw palette class migration

449 occurrences on ~215 lines in 36 of 141 `.tsx` files. The debt is concentrated,
not scattered: three primitives (`stepper` 22, `toast` 19, `image-cropper` 3),
two auth screens (~52 lines), the sidebar (14), and a long tail.

### 12.1 Per-family map

| Family | Count | Replaced by | When |
| --- | --- | --- | --- |
| `neutral-*` | 168 | Existing tokens (§12.2) | Mechanical, before Phase 8 |
| `amber-*` | 98 | `honour` / `success` / `warning-strong` / `ink-3` (§12.3) | Per batch, Phase 8 |
| `green-*` | 63 | `success` | Mechanical |
| `red-*` | 37 | `destructive` | Mechanical |
| `blue-*` | 32 | `primary` (current step) / `success` (completed step) | Per batch — Forms |
| `emerald-*` | 18 | `success` | Mechanical |
| `gray-*` | 15 | As `neutral-*` | Mechanical |
| `sky-*` | 8 | `primary` — same stepper | Per batch — Forms |
| `yellow-*` | 6 | `warning-strong` | Mechanical |
| `rose-*` | 2 | `destructive` | Mechanical |
| `orange-*` | 2 | `primary` | Mechanical |

**Simpler than v0.1.** With the action colour back on ink, ~20 amber sites that
v0.1 required a per-site "is this an action?" judgement for now map mechanically
to `primary`, and `red-*` no longer needs a destructive-vs-action call at all.

### 12.2 The `neutral-*` / `gray-*` map (183)

| Raw class | ≈ | Replacement |
| --- | --- | --- |
| `text-neutral-500/400/600` | 31 | `text-muted-foreground` |
| `text-neutral-900/950` | 16 | `text-foreground` |
| `text-neutral-100/300` | 17 | `text-foreground` (dark half of a pair) |
| `bg-neutral-100/50/200` | 21 | `bg-muted` |
| `bg-neutral-900/950/800` | 32 | `bg-card` or `bg-background` |
| `border-neutral-*` | 40 | `border-border` |
| `from-`/`to-`/`via-neutral-*` | 13 | Retired with the gradient |

**Mechanical but reviewed per file, never codemodded.** Most sites are light/dark
pairs collapsing into one token, and **any pair that is asymmetric is a design
decision hiding in a class string.** One commit per directory; read the diff.

### 12.3 Why `amber-*` still cannot be mechanical

Gold currently means five things, and v1.0 splits it four ways by meaning, which
is not recoverable from a class name: `honour` (records, improvements),
`success` (completion — the largest share, since much of today's amber and green
both mean "done"), `warning-strong` (risk marks), and `ink-3` (tints that should
never have been coloured). Deciding which needs the surrounding screen.

### 12.4 Sequencing

**Before Phase 8 — mechanical, ~310 occurrences plus 96 radius:**

1. Land the token block (§11.1, §11.3). The whole app moves to Stone/Night in one
   commit with raw classes still overriding in 36 files. Screenshot that
   intermediate state — it shows exactly which surfaces are still off-token.
2. Re-value the radius block: 96 `rounded-*` re-point with no markup change.
3. `neutral-*` + `gray-*` (183), one commit per directory.
4. `green-*` + `emerald-*` → `success` (81), `yellow-*` → `warning-strong` (6),
   `rose-*`/`red-*` → `destructive`. **Note:** 81 green/emerald is more than a
   status role needs — much of it is completion, which is now `success` anyway,
   so this folds in cleanly where v0.1 would have forced a gold/green split.

**Phase 7 — with the primitives (~44):** `stepper`, `toast`, `image-cropper`.
Migrating a primitive inside a Phase 8 page batch would change it under a page
already signed off.

**Phase 8 — per batch (~95):** remaining `amber-*`, the `blue-*`/`sky-*` stepper.
The two auth screens form a self-contained batch: outside the protected shell,
sharing no components with it.

**Alongside, Phase 7:** the 17 hardcoded gold hexes and 20 `rgba(255,215,0,…)` /
`rgba(218,165,32,…)` literals in `button.tsx`, `Sidebar.tsx` and
`components/backgrounds/`. No Tailwind grep catches them — search `#` and
`rgba(`.

---

## 13. Reported, not adopted

Out of scope for a UI-only restyle; belongs in the product roadmap.

1. **A persistent right rail at ≥1280.** Deciding a rail's contents is a
   component-responsibility change. Revisitable as pure layout if Phase 8 finds
   every proposed item already rendered on that page.
2. **A session cannot be abandoned from the session screen.** The only control is
   Finish; its dialog offers Cancel and Finish even with zero sets logged. The
   backend accepts `ABORTED` on the same endpoint. This is also why Phase 4 could
   not test the primary-versus-destructive pairing — the screen has no
   destructive control (§16, QA 1).
3. **`handleFinishAttempt` skips confirmation when every set is complete.** A
   terminal action with no confirmation step. Behavioural, not visual.
4. **Adding a Cinzel weight** (400 or 700). A font-payload decision, deliberately
   reduced once already (CL-07).
5. **The `sm`/`md` cliff** (§10.3). Redistributing 290 `sm:` sites is a layout
   rewrite.
6. **`1 days/week`** — fixed meanwhile in `8148c26`.

---

## 14. Where v1.0 leaves the Phase 4 code

The proof of concept implements **v0.1** and stands as evidence, not as the
target. It is not retrofitted in this phase; Phase 7 brings primitives to v1.0
and Phase 8 brings the session screen with the rest of its batch. The known gaps,
so nobody re-derives them:

- Crimson fills on the primary button and 15 set checkboxes → `--primary` and
  `--success-strong`.
- Gold on set numbers, exercise status and completion → `--success`.
- Uppercase micro-caps inside set rows → Body small (§5.3).
- Inputs with no resting border, and `dark:bg-input/30` giving dark a well that
  light does not have → §11.6.
- The standalone action panel → inline control (§11.8).
- Group-level gold markers on every completed exercise → removed; completion is
  the check plus label (§16, QA 13).
- Unbounded numeric fields at ≥1024 → `--field-max` (§10.2).
- Truncating masthead → two-line wrap below `lg` (§11.11).
- The `.ds-v01` scope and the `-m-3 sm:-m-6` shell bleed are POC-only and go when
  the palette lands globally (§12.4 step 1).

---

## 15. Verification gates

Non-negotiable, because each corresponds to a defect this project has already
shipped once.

1. **Compiled-stylesheet check.** After any change to `globals.css`, confirm the
   new selectors are in the served CSS before trusting a screenshot. An undefined
   variant emits nothing and no error (TD-28, TD-29), and in Phase 4 a stale
   Turbopack compile silently dropped the entire appended block after a
   `git stash`/`pop` — `touch` did not invalidate it, only a real content change
   did.
2. **Contrast re-measured in the browser** once tokens land, against §4.4.
   Computed and rendered agreed to 0.02 in Phase 4; agreement is checked, not
   assumed.
3. **Both themes, every time.** Half the app is unseen otherwise, and QA 2 was
   precisely a defect that existed in one theme only.
4. **No horizontal overflow** at 320/375/390/430/768/1024/1280/1440.
5. **`npm run verify` with the dev server stopped.** Never while it is running —
   they share `.next/` and the running server then 500s on every route, which
   looks exactly like an auth bug. This happened again during Phase 6.

---

## 16. QA disposition log

Every point from [ui-poc-review-sol.md](ui-poc-review-sol.md), with the decision
and the reason. **A review is input, not instruction** — one point is rejected,
and several are accepted with a different fix from the one implied.

| # | Pri | Summary | Disposition |
| --- | --- | --- | --- |
| 1 | P0 | Crimson fails as the action colour | **Accepted** |
| 2 | P0 | Set fields lose affordance; theme-dependent | **Accepted** |
| 3 | P0 | Light supporting text not viable | **Accepted** |
| 4 | P1 | Gold has no semantic hierarchy | **Accepted, stronger fix** |
| 5 | P1 | Routine title regresses responsively | **Accepted, worse than reported** |
| 6 | P1 | Completion less explicit and scannable | **Accepted** |
| 7 | P1 | 1440 set layout expands, not informs | **Accepted** |
| 8 | P1 | Mobile dialog is an accidental sheet | **Accepted** |
| 9 | P1 | Completion information repeated | **Accepted** |
| 10 | P2 | Type system over-applied at micro level | **Accepted** |
| 11 | P2 | Dark retains box-within-box | **Accepted** (same cause as 2) |
| 12 | P2 | Action panel detached from content | **Accepted** |
| 13 | P2 | Status-marker logic unexplained | **Accepted in substance; observation not reproduced** |
| 14 | P2 | Mobile loses elapsed-time precision | **Rejected** — misattribution |
| 15 | P2 | Generic AI-theme-pass signature | **Accepted as a constraint** |

**1 — Accepted.** Corroborated independently: Phase 4 measured 16 crimson fills
against a rule permitting one. Crimson becomes destructive-only; the primary
control returns to ink — the position three of four explorations held. §4.3, §11.4.
Note that the review's dialog observation ("makes Finish Session look explicitly
dangerous") is the strongest single piece of evidence, because that dialog is the
one place a user is asked to commit.

**2 — Accepted.** Root cause found in code: `Input`'s base class carries
`dark:bg-input/30`, and tailwind-merge treats a `dark:` variant as a different key
from `bg-transparent`, so both survived — dark got a well, light did not. v0.1's
"no resting border" is reversed and the fill is now specified per theme so no
primitive-level `dark:` rule decides it by accident. §11.6.

**3 — Accepted.** Two independent causes, both fixed: token values (`ink-3`
2.92→4.75, gold-as-text 3.92→5.30) and type (label 11.5→12px, tracking
0.10em→0.06em, and micro-caps removed from repeated rows). §4.4, §5.2, §5.3.

**4 — Accepted, with a stronger fix than proposed.** The review asks for a usable
hierarchy; simply re-tuning the golds would not deliver one. Measured: gold and
amber are ΔEok 0.054–0.109 apart and converge to 3.6–16.7 (of 100) under
simulated deuteranopia — no pair of values separates them. So the collision is
removed rather than tuned: completion moves to `--success`, gold is restricted to
"better than planned" with a two-per-viewport cap, and warning stops being a text
colour at all. §4.3 rules 2–4.

**5 — Accepted, and the regression is worse than reported.** Verified in the
frozen captures: 390 truncates to "UPPER / LOWER -…" and **768 to "UPPER /…"**,
because the summary columns appear at `sm` while the container is still narrow.
Fixed by wrapping to two lines below `lg`, collapsing the summary at `lg` not
`sm`, and reducing Cinzel tracking. §11.11.

**6 — Accepted.** Follows from 4: completion returns to green with the check
glyph, and the "3/3 sets completed" wording is restored — Phase 4 shortened it to
"3/3 sets", which was an information change dressed as a style change. §11.7.

**7 — Accepted.** Made a general rule rather than a session-screen fix, because
the same failure will recur on history and search: a field or control never grows
past the width its content needs; surplus width goes to gutters or columns.
§10.2, `--field-max`, `--cluster-max`.

**8 — Accepted.** All four sub-points adopted: inset rather than edge-to-edge, one
left-aligned reading axis, defined button order, and the primary not dominating
the content it confirms. §11.9.

**9 — Accepted.** A screen states overall progress once; per-item completion
stays, being per-item information. §11.8.

**10 — Accepted.** The fix is scope, not size: the tracked uppercase label is now
restricted to region-level captions and forbidden inside repeated rows. §5.3.

**11 — Accepted.** Same root cause as 2 — one set-row surface model, specified
identically in both themes. §11.6, §11.7.

**12 — Accepted.** The standalone panel becomes an inline control in the masthead
region. §11.8.

**13 — Accepted in substance; the specific observation could not be reproduced.**
In the Phase 4 code every completed group receives the identical class, so a
unique full-height marker on one group should not be possible; the dev server was
down for Phase 6 (§15 gate 5) so this could not be re-checked live, and it is not
clear from the captures whether the last group's mark differs or simply reads
that way where the ruled list ends. The substance is right regardless — **a mark
present on every group carries no information** — so group-level markers are
removed and completion is carried by the check plus label. Recorded as
unreproduced rather than silently accepted.

**14 — Rejected.** `formatDuration` (`lib/utils/time-format.utils.ts`) omits
seconds only when they are zero. It is width-independent, shared, and untouched by
this restyle; the 390 capture happened to land on a minute boundary, and the 768
capture of the same screen — taken seconds later — reads "115h 10m 17s". No
content was changed at any breakpoint. **The observation nonetheless points at a
real defect:** a live value whose string length changes shifts its neighbours, so
v1.0 renders durations in a fixed-width mono slot (§5.4). Accepting the fix while
rejecting the diagnosis is deliberate — recording the wrong cause would send Phase
8 looking for a breakpoint rule that does not exist.

**15 — Accepted as a constraint.** The sharpest point in the review and the
hardest to action, because it is about the system rather than any element. Turned
into a testable rule: treatment must vary with interaction semantics, and a
reviewer must be able to tell an editable field from a read-only value without
reading the label. §11.12.

---

## 17. Locked

v1.0 is the reference for Phases 7–15. Changes to it require a defect report
against a specific section, with evidence, and go through Phase 13 rather than
being decided in an implementation batch.

Open items that are **verification**, not decisions:

- Re-measure §4.4 in the browser once the tokens land (§15 gate 2).
- Confirm the new utilities emit in the compiled stylesheet (§15 gate 1).
- QA 13's specific observation, if it recurs once the session screen is rebuilt.

---

## 18. Amendment — the brand lockup (2026-09-17)

An owner-approved identity change, taken deliberately outside an implementation
batch as §17 requires. It is recorded here rather than in a new document because
it re-values two rows of §5 and one line of §11.10.

### 18.1 Why the wordmark changed

The wordmark was Cinzel 900 at 20px, tracked 0.05em, in a shell where `type-page`
and `type-section` are also Cinzel uppercase. Three defects, in order of weight:

1. **No voice of its own.** Set in the same face and case as every page and
   section inscription, the wordmark read as one more heading. Nothing in the
   chrome said "brand".
2. **Wrong optical size.** Cinzel is Trajan-derived display type. At the 20px the
   sidebar actually renders, 900 closes the counters of `S`, `E` and the two
   `N`s; the word thickens rather than reading as carved.
3. **Tracked like a label.** Heavy Roman capitals need 0.10–0.18em to separate at
   that size. 0.05em is a body-label value.

`SUNNSTEEL`'s double `N` compounds all three: Cinzel's wide `N` puts the heaviest,
widest form dead centre in the word.

### 18.2 What the lockup is

A drawn **mark** plus the wordmark, as one object.

The mark is a sun disc above a barbell — the two shapes the existing app icon is
already built from, reduced to five strokes in a 24-unit box so the glyph holds
at 16px. It lives in
[components/brand/sunnsteel-lockup.tsx](../components/brand/sunnsteel-lockup.tsx)
as inline SVG on `currentColor`, not as a `ClassicalIcon`: that component is the
classical *icon set*, loaded by CSS mask from `public/icons/classical/`, and the
brand mark belongs to neither that set nor a second request in the shell header.

The mark carries the authority the 900 weight was being asked for, which is what
lets the wordmark drop to **Cinzel 600 at 0.12em**. `.type-wordmark` also carries
`margin-right: -0.12em`, because `letter-spacing` adds its gap after the last
letter too and that throws off both optical centring and the gap to whatever sits
right of it.

Size the mark to roughly **1.2× the wordmark's cap height** — at `text-xl` that is
`size-6`. Below that ratio the two read as separate objects.

### 18.3 Consequences

- **900 is no longer loaded.** The wordmark was its only consumer, so
  [app/[locale]/layout.tsx](../app/[locale]/layout.tsx) now requests Cinzel 600 alone. The identity
  change is net *negative* in font bytes; §13 item 4 is untouched, because no
  weight was added.
- **The public header drops the word below `sm`** and shows the mark alone. TD-35
  had already measured that row at its limit at 320; this buys roughly 40px back
  instead of spending any. The `<Link>` carries `aria-label="Sunnsteel"` in both
  states, so hiding the word costs no accessible name.
- **The splash brackets the whole lockup**, mark included — §11.11 allows one pair
  per screen, and the lockup is one object.
- **The collapsed rail carries the mark, and the collapse chevron moved to the
  topbar.** At `w-20` the sidebar header has 48px of content width; the 40px
  toggle filled it, so the two could not share the row. The chevron now sits in
  the topbar, which is where motion spec §2.3 already named it ("Sidebar collapse
  chevron (topbar)") — so this relocates a control to its documented home rather
  than deciding a new one. On desktop it takes the slot the mobile menu button
  occupies, so the two never coexist. The sidebar header is therefore brand only,
  in both states and at its unchanged 56/64 height: the full lockup expanded, the
  mark alone and centred when collapsed.
- **The app icon is the mark (2026-09-27).** The favicon and every installed-app
  icon replaced the illustrated emblem with the same five strokes, in Night
  `--foreground` on Night `--background`, generated by
  [scripts/generate-brand-icons.mjs](../scripts/generate-brand-icons.mjs). The
  SVG favicon is the bare mark and follows the colour scheme, as the header does;
  the raster icons keep the dark ground because a launcher or tab strip supplies
  no ink of its own.

### 18.4 Verification

Both gates were run on 2026-09-18 against a clean dev compile.

- **§15 gate 1 — compiled stylesheet: pass.** The served CSS carries
  `font-weight: 600; letter-spacing: .12em; margin-right: -.12em`, so the new
  rank is in the bundle and not merely in source.
- **§15 gate 3 — regression sweep: pass, 409/409.** `npm run ui:regression`
  across 320/390/430/768/1024/1280/1440 in both themes: 398 passed in the full
  sweep, and the remaining 11 passed on a targeted re-run after the two
  pre-existing defects below were dealt with. Both themes, the collapsed
  sidebar, the mobile drawer and the splash are covered by that set.

The sweep took three attempts to complete, and the two earlier aborts were
environmental rather than defects: a backend `--watch` restart mid-run, and a
production build written over the running dev server's `.next/` (the failure
mode CLAUDE.md describes — every route 500s and the pages photograph as blank).

**Two pre-existing defects surfaced, neither caused by this change.**

1. **The portfolio seed guard fired on every run.** `e2e/global-setup.ts` gated
   it on `config.projects.some(p => p.name === 'portfolio')`, but
   `FullConfig.projects` is the *configured* project list and never shrinks
   under `--project=regression`. The guard is unrelated to the sweep, so it
   blocked the check CLAUDE.md requires for every UI change. Fixed with
   `runsProject` in `e2e/preconditions.ts`, which reads the flag from
   `FullConfig.argv` and fails closed on anything it cannot parse.
2. **`expectDrawerClosed` asserted the scrim was unmounted.** It cannot be:
   motion spec §2.3 fades the scrim out, and an element cannot animate its own
   opacity after removal, so the layout keeps it mounted for as long as
   `isMobile` holds. Measured on a fresh `/dashboard` at 320 with the drawer
   never opened: one `.bg-scrim`, opacity 0, pointer-events none. The assertion
   now checks that it is not an interaction surface. Note that
   `not.toBeVisible()` would have been a false pass — Playwright's visibility
   check ignores opacity.

---

## 19. Amendment — rank identity (2026-09-23)

An owner-approved addition for `ACH-09`, taken outside an implementation batch
as §17 requires. The six Renaissance ranks (`INITIATE` … `LAUREATE`) each get a
crest and a colour so the rank reads at a glance, the way ranked leagues give
each tier its own crest. Nothing in §4 had a colour free for this: `honour`,
`success`, `warning-strong` and `destructive` each mean exactly one thing, and
a rank is none of them. Two crest families were drawn and compared in both
themes; the owner chose the richer one described in §19.3.

### 19.1 The palette

Six **mark-grade** tokens, named for Renaissance pigments from cheapest to
dearest, on a cool-to-regal hue path that rises in chroma with the rank. The
warm half of the wheel is fully occupied by crimson (28), warning (52), gold
(90) and green (152), so the palette lives in the cool half by necessity, not
taste.

| Token | Pigment | Light oklch | Dark oklch |
| --- | --- | --- | --- |
| `--rank-initiate` | Silverpoint | `oklch(0.53 0.02 240)` | `oklch(0.76 0.02 240)` |
| `--rank-apprentice` | Verdigris | `oklch(0.53 0.08 203)` | `oklch(0.77 0.08 203)` |
| `--rank-artisan` | Azurite | `oklch(0.5 0.115 248)` | `oklch(0.74 0.105 248)` |
| `--rank-maestro` | Ultramarine | `oklch(0.47 0.155 274)` | `oklch(0.7 0.135 274)` |
| `--rank-virtuoso` | Folium | `oklch(0.48 0.15 308)` | `oklch(0.72 0.135 308)` |
| `--rank-laureate` | Tyrian purple | `oklch(0.36 0.12 318)` | `oklch(0.66 0.1 316)` |

They follow §11.1: declared in `:root` and `.dark`, aliased in `@theme inline`
as `--color-rank-*`, consumed as `text-rank-*` on the crest and, since §24, in
the profile header's decoration.

**Laureate was revalued on 2026-10-01** (`ACH-11`, the owner's call). The first
value, `oklch(0.47 0.16 342)` / `oklch(0.72 0.14 342)`, read as pink, above all
in Night. The rank moved toward violet and became darker and less saturated,
closer to the dense, nearly black purple of the historical pigment. Under
higher contrast three light values change as well; §22.2 lists them.

### 19.2 Rules

1. **Rank colour is a mark, never text.** It colours the crest; the rank name
   beside it stays `--foreground`. The values clear 3:1, not 4.5:1, on
   purpose.
2. **A rank colour means that rank and nothing else.** Never completion, a
   record, risk, decoration or a fill behind content. The one exception is the
   holder's own profile header, which §24 decorates. Ranks never borrow
   `honour`, `success`, `warning-strong` or `destructive`, and no other role
   borrows a rank token. This retires the `text-honour` the `/achievements`
   rank title carried: a rank is earned by attendance, not by doing better than
   planned.
3. **The crest is never shown without the rank name** in the same row, so
   neither colour nor silhouette carries the rank alone (§4.3 rule 8). The crest
   is `aria-hidden`.
4. **Only a rank the member holds is coloured.** A rank not yet reached — the
   next rank on `/achievements`, the dashboard's upcoming milestone — draws its
   crest in `--ink-3`.
5. **Ranks do not count toward the honour cap**, because they are not honour;
   there is at most one rank crest per row.
6. **Keyed by the contract's stable rank ID**, never by title or index.
   [lib/utils/rank-identity.ts](../lib/utils/rank-identity.ts) owns the map.

### 19.3 The crest family

Inline SVG on `currentColor` in a 24-unit box, in
[features/achievements/rank-crest.tsx](../features/achievements/rank-crest.tsx) —
not a `ClassicalIcon`, for the reasons §18.2 gives for the brand mark. One
*testa di cavallo* shield, the horse-head shield of Italian Renaissance
heraldry, sits at a fixed place; each rank adds to it, so the ladder reads from
the silhouette alone:

| Rank | Crest |
| --- | --- |
| Initiate | Shield outline and a single point — the first mark on the page |
| Apprentice | A tinted field and a chevron |
| Artisan | A solid field with a bordure, a palla and the chevron cut into it |
| Maestro | Laurel sprigs tied at the base |
| Virtuoso | A star above |
| Laureate | A jewelled crown and the full wreath |

**Two tones only:** the rank colour, and that colour at 22% for the Apprentice
field — a flat tint, never a gradient. The Artisan-and-above cut-outs are an
SVG mask, whose white and black are luminance values rather than colours; they
are the only literals in the component. Minimum size 16px, where the inner
detail becomes texture and the outline and ornaments carry the rank. No glow,
shadow or animation.

Sizes in use: 40px on `/achievements`, 32px in the profile Achievements
section, 24px in the featured row and the dashboard milestone, 20px in the
Settings picker.

### 19.4 Verification

Computed with the §4.4 method, worst case across `--background`, `--surface`
and `--surface-sunk`; marks target 3:1.

| Token | Light | Dark | Nearest locked role (ΔEok, light / dark) |
| --- | --- | --- | --- |
| `rank-initiate` | 3.82 | 8.38 | `ink-3` 0.059 / `success` 0.098 |
| `rank-apprentice` | 3.70 | 8.92 | `success-strong` 0.091 / `success` 0.077 |
| `rank-artisan` | 4.33 | 7.83 | `ink-3` 0.129 / 0.152 |
| `rank-maestro` | 5.18 | 6.56 | `ink-3` 0.166 / 0.157 |
| `rank-virtuoso` | 5.11 | 6.86 | `ink-3` 0.157 / 0.163 |
| `rank-laureate` | 8.37 | 5.52 | `ink-3` 0.173 / 0.108 |

The Laureate row carries the 2026-10-01 value, which is 0.218 / 0.152 from
`destructive`. Two accepted trade-offs. Adjacent ranks sit 0.065–0.126 ΔEok apart, and under
simulated colour-vision deficiency the blue-violet steps converge (as low as
0.019); the silhouette and the printed name carry the order, which is why rule 3
exists. Initiate is a near-neutral cool grey — the unpigmented starting rank —
and sits 0.059 from `ink-3` in light mode, deliberately.

---

## 20. Amendment — long content (2026-09-27)

An owner-approved addition for `UX-01`, taken outside an implementation batch
as §17 requires. The owner's mobile review on 2026-09-27 measured pages that
state everything at once: Progress was 13,329px tall at 390, and Exercises
7,799px. Nothing in v1.0 said how much of a page shows first, and three
one-off answers had grown in its place: a native `<details>` in the Progress
timeline, a `max-height` toggle in the history filters, and a scroll box
inside /routines. These three patterns replace them. Every later `UX-*` item
applies them; none invents a fourth.

**The rule under all three: a page has one scroll.** The owner chose it on
2026-09-27. A list never scrolls in a box of its own inside a page that also
scrolls: on a phone that traps the thumb, chains scrolling unpredictably and
hides rows with no cue. A page whose content is one long list (History,
Exercises, Notifications, Routines) scrolls as a whole, and its controls stay
pinned at the top of `<main>` while it does.

### 20.1 Collapsible section

`components/layout/collapsible-section.tsx`.

- **The heading stays a heading.** Its whole text is a `button` inside the
  `h2` (or `h3`), with `aria-expanded` and `aria-controls`. The accessible
  name is the title, and the state is `aria-expanded`, never colour alone. A
  `ChevronDown` in `--ink-3` turns over when open.
- **A closed section still says something.** An optional one-line summary in
  Body small `--ink-3` shows only while it is closed. It states what the
  section holds, such as "Latest: Romanian Deadlift 85 kg × 10". It must not
  restate the screen's overall progress (§11.8).
- **Nothing animates its height.** The body is `hidden`, not unmounted, so
  its reads still run and it opens instantly. That satisfies §9.3 without a
  reduced-motion branch. The chevron turns without a transition.
- **The member's choice is remembered per device**, in `localStorage` under
  `ss-open:<section id>`. A phone and a desktop want different defaults, so it
  is not an account preference. Storage that throws only means the choice is
  not remembered.
- **Defaults are open, closed, or `'wide'`**: closed below `md`, open from
  it, until the member chooses. `md` is where the protected shell gains its
  sidebar (§10).
- A section that holds a screen's one primary action, or a warning the
  member should not miss, is never collapsible.

### 20.2 Bounded list

`components/layout/show-more.tsx`.

- Inside a page with several sections, a long list shows its first N rows,
  then a ghost "Show N more" that always names the count, then
  "Show fewer". A list that fits shows no control.
- A list that pages from the server keeps its own "Load more", which follows
  the shown rows.
- **Pinned controls.** On a page whose content is one list, the filters,
  search and page actions share one row that is `sticky top-0` inside
  `<main>`. It sits on an opaque `--background`, bled over `<main>`'s padding,
  with no shadow (§8), so the rows pass under it. One row means one: below
  the width where the controls fit, they collapse, for example into a
  `NativeSelect` (`TD-54`), rather than wrap.

### 20.3 Explanation on demand

`components/layout/explanation.tsx`.

- A page's rules are stated in one line, followed by a ghost "How this
  works" control (an `Info` glyph, the label and a chevron) that reveals the
  full text inline, under a 1px `--rule` left edge.
- **It opens on a tap or the keyboard, never on hover alone**, because touch
  has no hover. `tooltip.tsx` opens on hover and focus and is too small for
  several sentences. The Popover primitive was deleted in `TD-32`.
- It pushes the content below it down instead of floating over it, and it
  starts closed on every visit.
- **The rules stay reachable.** This shortens what is shown first. It never
  removes a rule a page used to state.

---

## 21. Amendment — page tabs (2026-09-27)

An owner-approved addition for `UX-10`, taken outside an implementation batch
as §17 requires. The owner asked to reach each part of a long page directly,
and delegated the groups, pages and links. On 2026-09-27 Settings measured
17,622px at 390 and Progress 6,128px, even after §20. A page that holds
several separate jobs is split into a few tabs, and never into one route per
section: a route per section loses the overview and splits sections that only
make sense together.

`components/layout/page-tabs.tsx`, with its rules in `lib/utils/page-tabs.ts`.

### 21.1 A tab is a route

- **Each tab is a URL segment** (`/progress/body`), under a shared
  `layout.tsx` that owns the masthead and the tab bar, so neither remounts
  when the tab changes. A tab reads only its own data.
- **The bare route is always the first tab**, so every existing link to the
  page keeps working. A view that already lives in a query (Activity's
  `?view=yours`) keeps it; the most specific match is the current tab.
- **Three to six tabs.** Fewer is not worth a bar; more means the groups are
  wrong.

### 21.2 Navigation, not a tablist

- Markup is a `nav` labelled for its page, with a list of links, and
  `aria-current="page"` on the current one. It is not an ARIA `tablist`,
  because every tab changes the URL, and Back must return to the tab before.
- Changing tab is an ordinary navigation (history push) and returns `<main>`
  to the top. The first render never scrolls, so a deep link keeps its
  position.

### 21.3 Look

- One row under the masthead, pinned at the top of `<main>` like §20.2's
  controls: `sticky`, with its negative top cancelling `<main>`'s padding,
  on an opaque `--background` with a 1px `--rule` below and no shadow (§8).
  It sits at `z-20`, above in-page sticky cells such as the muscle heatmap's
  first column. The bar and the tab content share one parent, or the bar
  stops pinning at the end of its wrapper.
- A tab is Button type (§5) in `--ink-2`. The current tab is `--foreground`
  over a 2px ink underline. **Never a filled block, and never `honour`**,
  which §11.10 grandfathers for the sidebar's marker only. Hover changes the
  colour only. The tab is 44px tall below `md` and 40px from it.
- **Below `sm`, the row is one `NativeSelect` labelled "Section"**, which
  navigates when changed. §20.2 collapses a row that does not fit rather
  than wrapping it, and a sideways-scrolling row would hide tabs with no cue.
  From `sm`, the links show.

### 21.4 Old anchors

- In-app links go straight to the tab that holds their target.
- An old `#id` link (a bookmark, a portfolio target, a notification from
  before the split) is forwarded by the bare tab to the tab that now holds
  the element, through `useHashForward`, with rules that match exact ids
  first and then id prefixes (`privacy-*`). Nothing renders while it
  forwards.
- The receiving tab lands on the element with `useScrollToHash` (TD-55).
  That call is made in each tab, not in the layout, because it must re-run
  when a tab mounts.

### 21.5 With §20

- §20 still applies inside a tab. A section that sits alone or with one other
  section in its tab does not collapse, because the tab is already the choice;
  bounded lists stay.
- **Unsaved drafts do not survive a tab change**, exactly as leaving the page
  never kept them. A tab holding a form keeps its one Save on that tab.

## 22. Amendment — higher contrast and larger controls (2026-09-28)

Owner-approved on 2026-09-28 with `A11Y-02`, whose hardest case is the live
workout screen (`LIVE-18`, gym mode). It adds two device preferences on top
of §4 and §10. It changes nothing for a member who has neither, apart from the
44px floor in §22.3, which was a defect.

### 22.1 Two device preferences

- **Higher contrast** and **Larger controls** live in Settings › Account ›
  Display, beside Motion (A11Y-01). Both are stored on the device
  (`ss-contrast`, `ss-controls`) and set as attributes on `<html>` before
  first paint (`data-contrast="more"`, `data-controls="large"`), exactly as
  `data-motion` is.
- **Higher contrast also follows the OS** (`prefers-contrast: more`). Like
  reduced motion, the device choice can add it but never turn off what the
  OS asked for; the checkbox then shows on and disabled, with a line saying
  why.
- **Larger controls is also a switch on the workout screen's masthead**
  (§22.4), the same device choice rather than a second mode.
- Two Tailwind variants carry them: `large-controls:` for sizes and
  `contrast-more:` for a boundary that only exists under higher contrast.
  Colour never comes from a variant; it comes from re-valued tokens.

### 22.2 Higher-contrast tokens

The standard values in §4.1 and §4.2 are unchanged. Under higher contrast
these roles are re-valued; the others keep their standard value because it
already clears the target. The ratios were **measured in the browser** on
2026-09-28, worst case across `--background`, `--surface` and
`--surface-sunk`.

| Role | Light | Measured | Dark | Measured | Target |
| --- | --- | --- | --- | --- | --- |
| `ink` | unchanged | 12.09 | unchanged | 15.11 | 7 |
| `ink-2`, `muted-foreground` | `oklch(0.32 0.013 62)` | 9.27 | `oklch(0.85 0.01 84)` | 11.37 | 7 |
| `ink-3` | `oklch(0.385 0.012 70)` | 7.10 | `oklch(0.715 0.01 80)` | 7.08 | 7 |
| `success` | `oklch(0.375 0.1 152)` | 7.11 | unchanged | 9.20 | 7 |
| `honour` | `oklch(0.385 0.09 90)` | 7.15 | unchanged | 9.62 | 7 |
| `destructive` | `oklch(0.4 0.17 28)` | 7.14 | `oklch(0.735 0.15 28)` | 7.21 | 7 |
| `success-strong` | `oklch(0.475 0.11 152)` | 4.61 | unchanged | 8.14 | 4.5 |
| `honour-strong` | `oklch(0.49 0.115 90)` | 4.54 | unchanged | 11.03 | 4.5 |
| `warning-strong` | `oklch(0.5 0.13 52)` | 4.55 | unchanged | 8.06 | 4.5 |
| `rule`, `border`, `input`, `sidebar-border` | `oklch(0.58 0.014 84)` | 3.10 | `oklch(0.51 0.012 72)` | 3.12 | 3 |
| `rule-faint` | `oklch(0.685 0.01 86)` | 2.06 | `oklch(0.415 0.01 72)` | 2.08 | 2 |
| `rank-initiate` | `oklch(0.485 0.02 240)` | 4.63* | unchanged | 8.38* | 4.5 |
| `rank-apprentice` | `oklch(0.475 0.08 203)` | 4.67* | unchanged | 8.92* | 4.5 |
| `rank-artisan` | `oklch(0.485 0.115 248)` | 4.63* | unchanged | 7.83* | 4.5 |

\* `ACH-11` added the three rank rows on 2026-10-01. They are **computed** with
the §4.4 method, not yet measured in the browser like the rows above them. The
other three ranks already clear 4.5:1 in both themes (in light, Maestro 5.18,
Virtuoso 5.11 and Laureate 8.37) and keep their values. Neighbouring ranks stay
0.066–0.126 ΔEok apart.

- Text roles reach WCAG AAA (7:1). Marks reach 4.5:1. Rules reach 3:1, the
  non-text minimum, so every field and control edge is visible in a bright
  room.
- **`ink-2` stays a step above `ink-3`.** Solving each role alone put both at
  the same light value, which would erase the caption rank (§3.3), so `ink-2`
  goes darker still in light and lighter in dark.
- Roles keep their meanings (§4.3). Nothing moves or changes size.
- **The focus indicator doubles.** Under higher contrast every
  `:focus-visible` element also takes a solid 3px outline in `--ring`, offset
  2px, because several primitives draw their ring at 40% and a translucent
  ring is the first thing bright light washes out.
- **A boundary where the standard design relies on tone.** The set-log
  fields (§11.7) have no resting border and sit in a sunk well; under higher
  contrast they draw a 1px `--rule` border (`contrast-more:`).
- The CSS carries the values twice, for the attribute and for the media
  query, and the two blocks change together, like the reduced-motion pair.
  Light blocks are scoped `:not(.dark)`, because a bare `:root` in the media
  block has the same specificity as `.dark` and would override Night.

### 22.3 Control sizes

**On every touch width, every control on the workout screen is at least
44px**, with or without Larger controls. Before this amendment the rest bar's
+15s and Skip were 36px, the swap, plate and note icons 40px, the Workout Note
button 36px, and the exercise header had no minimum. From `md` they keep their
compact desktop sizes.

Under **Larger controls**, through the primitives, so every page follows:

| Control | Standard | Larger |
| --- | --- | --- |
| Button, default | 40px | 48px |
| Button, `sm` | 36px | 44px |
| Button, `lg` | 44px | 48px |
| Icon button | 40px | 48px |
| Input, native select | 44px / 40px from `md`, 16px / 14px text | 48px, 18px text |
| Checkbox | 16px | 24px |
| Menu item | 44px / 32px from `md` | 48px |

`large-controls:` utilities are emitted after the responsive ones, so they
win over a call site's `md:` size too; that was measured at 1440 (Finish
Session 48px).

### 22.4 The workout screen under Larger controls (gym mode, LIVE-18)

Gym mode is not a separate mode with its own state: it is what the workout
screen does under Larger controls.

- **Bigger working surface:**
  - the Reps, Weight and RPE fields are 56px with 20px digits; placeholders
    stay at 16px so "Reps" fits the column at 320;
  - the completion tick is 32px inside a 56px hit area;
  - the rest countdown is 36px;
  - +15s and Skip are 56px.
- **Fewer secondary actions.**
  - Each exercise's swap, plate calculator and note move into one **More
    for <exercise>** menu, so the header keeps the exercise's name, its
    progress and one control.
  - Each set's "Same as set N", "Use last time" and Remove move into that
    set's own **Set N** menu, which already held its kind. The row keeps
    its fields and its tick.
  - The standard screen keeps every control where it was.
- **The switch is on the masthead**, as a 44px icon button with
  `aria-pressed`. Its glyph changes (zoom in, zoom out) and it takes a
  bordered fill when on, so its state is never carried by colour alone.

### 22.5 Verification

- §15 gate 2 was run for §22.2: every role in both themes, with and without
  higher contrast, measured in the page by painting each token and reading
  its sRGB. The standard values measured within 0.05 of §4.4.
- The regression sweep has two more routes, `session-display` and
  `dashboard-display`: the same pages with both preferences seeded before
  the app runs.

## 23. Amendment — legibility (2026-09-30)

Owner-approved on 2026-09-30 as the first of the `UX-14` to `UX-17` group in
the roadmap's Legibility and learning curve section. The owner's review: the
app reads as condensed, especially on a phone, and a new member meets
everything at once. This section collects the group's rules; each later item
adds its own subsection.

### 23.1 The body face (UX-14)

**Body and body small are Source Sans 3**, loaded through `next/font` as one
variable file (`--font-source-sans`) and exposed as `--font-sans`, so every
unranked run of text and every input inherits it. Oswald keeps the jobs it
does well at small sizes and short lengths: item titles (`type-panel`),
labels (`type-label`) and buttons (`type-button`).

- **Why:** Oswald is a condensed display face. As running text it set every
  paragraph tight and tall, which is most of what "condensed" meant in the
  review. Source Sans 3 is a humanist sans with open counters that sits beside
  Cinzel and Oswald without competing with either.
- **Chosen from screenshots.** Source Sans 3 and IBM Plex Sans were compared
  with the current face on the dashboard, Progress and Schedule at 390 and
  1440, in both themes, on the owner's account. Plex is wider: Plateau
  watch's rule paragraph ran four lines at 390 where Source Sans 3 and Oswald
  both ran three, and the page moved further down.
- **Payload.** One variable file, the first face added since CL-07: 28.8 kB
  for the Latin range a page downloads (the other ranges load only when a
  character needs them), measured from the production build. It is a
  deliberate font-payload decision, taken once; no other weight or face is
  added with it.
- **Sizes and line heights are unchanged** (§5.2). Source Sans 3 sets wider
  than Oswald at the same size, so a row that sat a text column beside a
  control must let the text wrap inside its own column (`min-w-0 flex-1`)
  rather than letting the control drop to a line of its own; the dashboard
  greeting was the one case found.
- **Not changed:** Cinzel, Bebas Neue and Space Mono, and the generated
  profile card (`profile-card.ts`), which draws its own type on a canvas and
  keeps Oswald as part of the image.

### 23.2 Fewer capitals (UX-15)

**Uppercase belongs to Cinzel inscriptions, short region labels
(`type-label`) and filled actions.** A control that is not filled reads in
sentence case.

- **Two button ranks.** `type-button` (Oswald 600, 14px, 0.04em, uppercase)
  stays on `default` and `destructiveSolid`. The new `type-action` (Oswald
  600, 14px, 0.01em, sentence case) is on `outline`, `secondary`, `ghost`,
  `link` and the destructive outline. The `Button` primitive sets the rank by
  variant, so a call site never picks one; the workout screen's rest-timer
  controls and Discard, which set `type-button` by hand on outline buttons,
  no longer do.
- **Why:** a screen such as the routine page carried six to eight uppercase
  controls side by side, so the region's one filled primary (§4.3 rule 1)
  had nothing left to stand out against. Casing now does that job without a
  new colour or weight.
- **The strings follow.** Uppercase had hidden Title Case labels. Every
  English label a non-filled control can show is sentence case ("Try again",
  "Add goal", "View history"), and the Spanish labels that capitalised a page
  name ("Abrir Ajustes", "Volver a Rutinas") follow suit. Headings, catalog
  names and page names in running text are unchanged. Found by reading the
  computed `text-transform` of every control on 26 signed-in pages, plus the
  labels of dialogs and states those pages did not show.
- **Not changed:** page tabs (§21) stay `type-button`, because a tab row is
  navigation read as a set of labels; filled controls; `type-label`.

### 23.3 Rhythm, measure and one number face (UX-16)

- **Body small is 14px at 1.5**, up from 13 at 1.45. It is the most used rank
  in the app (658 call sites, against 72 `text-sm`): almost every
  explanation, caption and row detail is set in it. Source Sans 3 has a lower
  x-height than the condensed Oswald it replaced (§23.1), roughly 6.3px
  against 7.5px at 13px, so the captions read smaller after UX-14 than
  before it. At 14px they are back near Oswald's apparent size with
  Source Sans's open shapes.
- **A paragraph stops at 70 characters** (`p.type-body-sm`, `max-width:
  70ch`). A centred or right-aligned paragraph, its own or its ancestor's,
  including a responsive `lg:text-right`, keeps its alignment inside the
  measure through `margin-inline: auto` or `margin-left: auto`, so empty
  states stay centred. Below `md` no column is wider than the measure, so the
  rule only shortens desktop lines.
- **A number inside a sentence takes the sentence's face.** An inline
  `span.type-data` or `span.type-data-strong` inside a Body small run
  inherits the family and size and keeps tabular figures (strong is 600).
  §5.3's "Data is Space Mono wherever a number is the point" is narrowed to
  data that stands alone: set fields, timers, durations, ledger columns and
  data lines. "Best 180 kg × 12 · est. 1RM 252 kg" no longer switches face
  three times in one line.
- **Not changed:** the region rhythm (§6: 32 / 48 / 64) and ruled lists.
  Measured at 390, the dashboard already separates its sections by 32px, as
  §6 says; the density came from small type, long lines and mixed faces, not
  from the gaps, and ruled lists stay the default because they are what
  makes a long list scannable. The "16px body below `md`" the roadmap
  carried from `UX-14` was already true: unranked text inherits the
  browser's 16px, and the text that read small was Body small.

### 23.4 A copy budget (UX-17)

- **A section's description is one line on a phone: about 90 characters in
  English, about 110 in Spanish.** The rest of what it says goes behind
  §20.3's "How this works" (`Explanation`): the summary stays visible, the
  full text opens on a tap. Nothing a page stated is deleted, and the long
  text is moved unchanged rather than rewritten; a new summary is written
  only where no existing short line fits, and it must be a true statement on
  its own, never a teaser.
- **What never folds:** warnings and their marks, errors, unsaved states,
  privacy caps, notices that something of the member's is hidden, and any
  sentence a control depends on to be understood before it is used (that a
  private setting does not revoke an existing link, that an activity
  default reaches past entries). §20.1 already says this for sections; it
  applies to sentences too.
- **Mastheads:** a subtitle that describes the page hides below `sm`
  (`HeroSection`), where it cost two or three lines before anything the page
  holds. A subtitle that states a fact or a rule of its own keeps showing
  (`subtitleOnPhone`): the Moderation queue's scope and the muscles an
  exercise trains.
- **Unless the summary would only restate it.** A description already
  close to one line (up to about 115 characters) stands as it is: a summary
  that repeats it behind a toggle that repeats it again costs a control and
  says nothing. The Privacy overview's two lines, the Notifications
  updates line and the record and progression timeline's line (on Progress
  and on an exercise page) are kept whole for that reason.
- **The dashboard keeps its inscription and greeting** and loses the
  tagline under the greeting ("Track your fitness journey and achieve your
  goals"), which stated nothing about the member's training.
- **A test holds the summaries to the budget** in both languages, so a
  later edit cannot let one grow back into a paragraph.
- **Out of scope:** dialog descriptions, empty states and toasts, which a
  member reads when they asked for them.

### 23.5 Terms defined in place (UX-18)

- **A screen that uses training terms carries one "Terms:" line**
  (`GlossaryLine`): each term is a text button with a dotted underline, and
  its definition opens under the whole line, one at a time, on a tap or the
  keyboard, never on hover. Tapping the open term closes it.
- **Why a line, not the term where it appears.** The terms sit in cells too
  narrow to hold a sentence: the RPE field of a set row and the RIR
  column of the builder are a few characters wide. A definition opened inside them
  would wrap to one word per line, so the line sits at the width of its
  section instead, once per screen, never once per row.
- **Where:** the workout screen (RPE, RIR, set kinds), the builder's day
  (RIR, progression, set kinds), the routine page (rotation for a rotation,
  training block, deload), Progress › Overview (estimated 1RM, RPE, deload)
  and Progress › Strength (estimated 1RM).
- **One source of definitions:** `core.glossary` in every language, keyed
  by `GLOSSARY_TERMS` (`lib/utils/glossary.ts`). A definition states what a
  thing is and how the app treats it, checked against the code it describes
  (the progression rule in the backend's `progression-changes.ts`, the set
  kinds in contracts' `countsAsWork` and `countsForProgression`), and never
  what it does for the member; a test refuses words of benefit or advice.

### 23.6 Advanced options folded (UX-20)

- **The builder's exercise card leads with sets, reps and load.** Its
  progression scheme and weight step, rest, each set's kind and RIR, the
  warm-up ramp and "Do in rounds with next" sit under a ghost **More
  options** control beside the note, with a caption naming what it holds.
  Folded, a set row drops its kind and RIR tracks for a five-track grid
  (`SET_ROW_COLUMNS_SIMPLE`) under matching headings, so nothing shifts
  column.
- **An option in use never folds.** A set that is not a working set, a
  generated warm-up or a link to the next exercise keeps the options shown,
  and the control is not offered (`usesAdvancedOptions`): a folded row can
  never hide a kind or a superset the routine has. The progression scheme,
  rest and RIR always hold a value, so having one is not using it; the
  values are kept and saved whether or not they show.
- **The routine page shows its days first** and folds Sharing, Training
  blocks, Deloads and Versions into one **Planning and sharing** group (a
  §20.1 `CollapsibleSection`, remembered per device and per routine). It
  opens with the page when the routine uses any of it: anyone else can find
  it, it has a training block or a deload, or moderation hid it
  (`planningInUse`). Closed, it keeps one line: who finds the routine and how
  many blocks and deloads it has. Its body stays mounted, so a suggested
  deload (`INTEL-02`) still opens its dialog.
- **Translated on the way:** the builder's "Set N", its kind label, "Rest",
  "Weight", "Note" and the day-name placeholders were English literals.

### 23.7 A phone groups the workout screen's actions (UX-21)

- **Below `sm` the workout screen uses gym mode's grouping** (§22.4) whatever
  the larger-controls setting: each exercise's swap, plate calculator and
  note sit in one **More for <exercise>** menu, and each set's "Same as set
  N", "Use last time" and Remove sit in its **Set N** menu beside its kind.
  `useCompactWorkout` is true under larger controls or at a phone's width
  (`(max-width: 639.98px)`, so it follows a rotation or a resize).
- **Larger controls keeps deciding sizes, and only sizes.** The 56px fields,
  the 32px tick and the large rest controls still come from the
  `large-controls:` variant; a phone without the setting gets the grouping at
  the standard sizes, with every control still at least 44px (§22.3).
- **Why:** a phone's set row had three fill and remove buttons under every
  set, and an exercise header three icon buttons beside a name that then
  wrapped; the actions are the same, they are one tap further away, and the
  fields a set is logged with keep the width.
- The regression sweep's plate-calculator dialog case opens the calculator
  from the menu below 640.

### 23.8 The phone's bottom navigation (UX-22)

- **Below `md` a bottom bar carries the main navigation:** Today
  (`/dashboard`), Train (`/workouts`, which resumes a workout in progress),
  Progress (`/progress`), Community (`/activity`) and More, which opens the
  drawer that still lists every page. The groups are the owner's
  (2026-09-30) and live once, in `NAV_GROUPS` (`lib/utils/nav-groups.ts`):
  Train holds Workouts, Routines and Schedule; Progress holds Progress,
  History and Achievements; Community holds Activity, Discover and
  Notifications; More holds Exercises, Moderation and Settings, and any page
  without an entry of its own.
- **It is the shell column's last row, not a layer.** `<main>` scrolls above
  it, so it never covers content and no page needs bottom padding for it; it
  carries the device's bottom safe area. Toasts sit above it below `md`. It
  steps aside on the workout screen, whose bottom belongs to the rest timer.
- **The active group** is ink over a 2px `honour-strong` top rule with its
  glyph in honour, the same mark the sidebar uses; a page inside a group
  marks the group (`aria-current="true"`). Train carries the count of
  workouts planned today and Community the unread notifications, on the
  glyph as in the collapsed sidebar, with the exact number in the link's
  name. Each item is at least 56px tall.
- **The sidebar and the drawer group their entries under the same headings**
  (Train, Progress, Community, More; Today's one entry needs none), as
  `type-label` rows of a fixed height. The sliding marker counts the heading
  rows above the active entry (`--nav-heading-pitch`), and a collapsed
  sidebar draws each heading as a short rule of the same height.
- **The header's menu button stays** below `md`: More and it open the same
  drawer, and the workout screen, which has no bottom bar, keeps a way in.
- Absorbs `NAV-04`: start or resume is Train, within thumb reach.

---

## 24. Amendment — rank decoration (2026-10-01)

Owner-approved for `ACH-11` on 2026-10-01, outside an implementation batch as
§17 requires. The approval was given against two references. The comps sit in
Figma (file `JH3yVonO0CbWpG9qCbCG5M`, frame "ACH-11 approval board"). The
motion was approved on a live prototype. A member's rank dresses their own
profile header. Each rank borrows one Renaissance decorative art and is richer
than the rank below it, so a Laureate's profile is the richest in the product
and an Initiate's is modest but already its own. A first set of hand-drawn comps
was rejected as too basic; the ornament is now generated vector of illustration
quality (§24.6).

### 24.1 Where a rank may decorate

- **Only the profile header**, on the authenticated `/profile/<identifier>`
  and the signed-out `/members/<identifier>`. Never search results,
  relationship lists, the activity feed, the dashboard, `/achievements` or
  Settings; there the rank stays the §19 crest beside its name.
- **Only the rank the member holds**, never the next one.
- **Only when the viewer may see the rank.** A visitor that the member's
  Rank privacy row (`ACH-10`) does not admit gets the neutral header (§11.11),
  and so does an account with no rank yet. The decoration can therefore never
  reveal a hidden rank. The owner always sees their own.
- This is the one place where §19.2 rule 2 lets a rank colour decorate, and
  the one place §4.3 rule 6 bends. Even here **no accent becomes a gradient,
  and no text sits on a pigment fill**. Text sits on a neutral ground
  (`background`, `surface` or `surface-sunk`), and pigment reaches the ground
  only as the two flat tints of §24.3.

### 24.2 The six treatments

| Rank | Art | Frame | Corners and head | Ground | Portrait |
| --- | --- | --- | --- | --- | --- |
| Initiate | Silverpoint | The double rule under the header in pigment, a hairline fleuron at its centre | — | — | A hairline ring with four compass points |
| Apprentice | The workshop | The double rule, with a running-dog (Vitruvian scroll) band on it and a boss at each end | — | — | A twisted copper cord |
| Artisan | Intarsia and strapwork | The header becomes a framed panel on `surface`: an outer and an inner rule | Interlaced eight-point knots with a palla; a bead-and-reel band along the foot | A lozenge diaper | A pearl ring with four palle |
| Maestro | The master's laurels | Framed panel | Acanthus scrolls flowering from rosettes; the Florentine giglio in a cartouche at the head | The giglio, sown | A laurel wreath tied with a ribbon |
| Virtuoso | The starry vault (Scrovegni) | Framed panel on `surface-sunk`, with rinceau bands at head and foot | Star blocks; a star in a radiant ring held by acanthus | Eight-point stars | A closed wreath under a star |
| Laureate | The illuminated page | A full border of rinceaux on a pigment field, all four sides | Flowering medallions; the crown in a laurelled cartouche; festoons of laurel and berries under the head | A pomegranate brocade | A radiant aureole behind a crowned wreath, with ribbons |

Below a 600px header width each treatment uses its compact pieces: smaller
corners, thinner bands and no festoons. The header reads as one region in both
cases. It keeps one filled primary action, and its controls do not change.

### 24.3 Colour

- **Only the holder's rank token and its flat tints.** The tints are:
  - the **field**: the pigment at 10% in Day and 14% in Night (15% and 20%
    inside a cartouche or medallion), behind border bands and cartouches;
  - the **ground pattern**: pigment marks at a single opacity per rank.
- Ornament is **cut into its ground**. Its highlights and veins take the
  ground token beneath it, and its shading takes `ink` in Day and
  `surface-sunk` in Night at about 30%.
- Nothing borrows `honour`, `success`, `warning-strong` or `destructive`.
- **The name's corner brackets** (§11.2 `.corner-brackets`) take the rank
  pigment on a decorated header, so the name is framed by its own rank. They
  keep `honour-strong` on the neutral header.
- **Text does not change.** The name, the rank name, the handle, the join date
  and the counts keep their ink roles in every theme. The §19 crest stays
  beside the rank name, so neither the crest nor the decoration ever carries
  the rank alone.

### 24.4 Motion — the third signature

§9.1 keeps two signatures, each used once. The rank decoration is the third,
and it is used only in the profile header.

1. **Entrance**, once each time the header mounts:
   - the frame draws in from the left: 240ms at Initiate, matching the rule
     draw, rising to 600ms at Laureate, `ease-standard`;
   - the corners and the head appear at `--motion-slow` as it passes;
   - the portrait ornament settles, turning 14° into place;
   - festoons, the aureole and the ground pattern come last.
   The whole entrance finishes within about 1.3s at the top rank. **Text never
   moves**: it is there from the first frame, as §9.1 requires of content.
2. **Ambient**, only while the header is on screen. **Every rank gets the same
   amount**: two motifs at one tempo. The ladder is carried by the design, not
   by how much moves.

   | Rank | Motif 1 | Motif 2 |
   | --- | --- | --- |
   | Initiate | The compass ring turns | The fleuron breathes |
   | Apprentice | The copper cord turns | The waves roll along the band |
   | Artisan | The pearl ring turns | The corner knots turn |
   | Maestro | The pearl ring inside the wreath turns | The corner rosettes turn |
   | Virtuoso | Stars of the vault breathe | The medallion's rays turn |
   | Laureate | The aureole turns and breathes | The corner flowers turn |

   The tempo is shared by every rank:
   - a turning piece makes one revolution every 160s;
   - breathing and twinkling run 8–9s per cycle;
   - the waves roll one period every 7s.

   Ambient motion pauses when the header leaves the screen. It changes opacity
   and rotation only. There is no glow, no gradient, no transform on hover and
   no scale.
3. **Reduced motion**, from either source (§9.3, `A11Y-01`): no entrance and
   no ambient. The finished decoration is simply there.

### 24.5 Higher contrast

Under higher contrast (§22) the ground pattern, every field tint and the
aureole are removed, leaving the whole text column on the plain neutral ground.
The ornament stays, as a mark. The light rank values that do not reach the
§22.2 mark target take the values listed there.

### 24.6 Assets are generated

The ornament is drawn by `scripts/generate-rank-decoration.mjs` from curves:
- leaves with lit and shaded halves and a cut midrib;
- multi-lobed acanthus;
- tapered stems and scrolls, rosettes and flowers;
- interlace, garlands and the aureole.

It writes one JSON module per rank under
`features/profile/rank-decoration/generated/`. The page loads only the module of
the rank it shows. **Never hand-edit a generated file.** Change the generator
and run `npm run rank-decoration:generate`. The colours in it are placeholders
that the stylesheet maps to tokens, so a token change never needs a
regeneration. Repeating pieces (bands and grounds) are tiles drawn as CSS
masks in the pigment.
