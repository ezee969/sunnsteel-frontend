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

Four faces, four jobs. No new font payload.

### 5.1 Loaded weights — a constraint, not a preference

| Face | Loaded | Job |
| --- | --- | --- |
| Cinzel | **600, 900 only** | Page and section inscriptions (600); wordmark (900) |
| Bebas Neue | **400 only** | Large numerals only |
| Oswald | 400, 500, 600, 700 | Body, labels, item titles, buttons |
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
| Body | Oswald 400 | 15 | 15 | 1.60 | 0 | Sentence |
| Body small | Oswald 400 | 13 | 13 | 1.45 | 0 | Sentence |
| Label | Oswald 500 | **12** | 12 | 1.30 | **0.06em** | UPPER |
| Button | Oswald 600 | 14 | 14 | 1 | 0.04em | UPPER |
| Numeral, large | Bebas Neue 400 | 40 | 52 | 0.95 | 0.02em | — |
| Data | Space Mono 400 | 13 | 13 | 1.50 | 0 | — |
| Data, emphatic | Space Mono 700 | 13 | 13 | 1.50 | 0 | — |
| Wordmark | Cinzel 900 | unchanged | — | — | UPPER |

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
- **Data** is Space Mono wherever a number is the point. It is monospaced,
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
14 uppercase 0.04em, press stays `translate-y-[1px]`.

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
  right edge, Cinzel 900 wordmark, items Oswald 500 at 14/36px.
- **Active item: no filled block.** A 3px `--honour-strong` left marker, ink text
  at 600, icon in `--honour-strong`. The light black slab and dark ivory slab
  both retire — that inversion is the heaviest object on every screen.
- Hover fills `--surface` and darkens text. Hover and active differ by colour,
  not geometry.
- Disabled / `SOON`: `--ink-3`, and `SOON` becomes the bare word at 10px
  uppercase tracked, right-aligned, no border box.
- Topbar 56 mobile / 64 desktop, ground-coloured, 1px `--rule` below, page
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
