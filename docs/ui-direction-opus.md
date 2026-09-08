# Visual Exploration — Opus

Phase 2 of [ui-restyle-plan.md](ui-restyle-plan.md). Two directions, grounded in
the 60 baseline screenshots and the Phase 1 inventory in
[ui-restyle-progress.md](ui-restyle-progress.md).

Specification only. No implementation, no code changes. Values are proposals for
Phase 3 to formalise, not final tokens.

---

## What the baseline actually shows

Four observations that both directions have to answer. They come from the
screenshots, not from taste.

**The classical identity is decoration, not structure.** The theme lives in
photographic hero backdrops, gold corner brackets, gradient buttons and marble
overlays — all applied *around* the content. The content itself is generic
shadcn. Nothing about the way a workout is presented says "Sunnsteel".

**The data is the weakest thing on screen.** In `history-1440-dark`, the status
of each session — `COMPLETED` / `ABORTED`, the single most scannable fact in the
row — is the lowest-contrast element in it: tiny, uppercase, muted grey, pushed
to the far right. Meanwhile the labels `Started` / `Ended` / `Duration` are set at
the same weight as their values, so every row reads as eight items instead of
four facts.

**Desktop is not stretched, it is starved.** At 1440 the history list sits in a
~740px column with roughly 500px of dead margin. `routines-1440-light` is the
opposite failure: a single routine card spans ~1130px to hold four short lines,
so "Next session" and "Sunday" end up at opposite ends of the viewport. The app
has no opinion about width in either direction.

**Density is uniformly too low.** Routine cards are ~280px tall for four lines.
The settings page pairs a card containing an avatar and one caption against a
card containing seven fields, and stretches the first to match. Whitespace is
being used as a substitute for hierarchy.

---

## Shared corrections

These are not stylistic choices. Both directions include them, and Phase 3 should
treat them as fixed.

1. **One gold.** Nine hardcoded hex golds, an `amber-*` ramp and two `--ss-gold`
   variables collapse into a single accent token with one hover state.
2. **`--destructive-foreground` stops equalling `--destructive`** in light mode.
3. **Every colour token is defined per theme.** The current palette is chroma-0
   greyscale, so both themes are the same design at different lightness.
4. **Numeric data uses tabular figures.** Space Mono is already loaded and
   effectively unused; weights, reps, durations and volumes should never reflow
   as digits change.
5. **The 16px mobile font size on inputs is untouchable.** It is an iOS
   zoom-on-focus mitigation (TD-29), not a type choice.
6. **Status becomes a primary signal**, not a caption.

---

# Direction A — "Quiet Authority"

Conservative. Same layout, same components, same identity. The premise is that
this UI is not badly designed, it is *under-decided*: nine golds, nine radii, the
full shadow ladder, three ways to build a card. A picks one of each and applies
it everywhere.

Someone who uses the app today would recognise every screen and find it calmer,
denser and easier to scan.

### Color palette

Warm the neutral ramp. Chroma 0 against gold accents and marble textures is what
makes the current UI read as a default theme with an ornament bolted on.

**Light**

| Role | Value |
| --- | --- |
| `bg` | `oklch(0.985 0.004 85)` |
| `surface` | `oklch(1 0 0)` |
| `surface-raised` | `oklch(0.995 0.003 85)` |
| `text` | `oklch(0.20 0.010 60)` |
| `text-2` | `oklch(0.45 0.008 60)` |
| `text-3` | `oklch(0.60 0.006 60)` |
| `border` | `oklch(0.90 0.006 70)` |
| `border-strong` | `oklch(0.82 0.010 70)` |
| `accent` | `oklch(0.72 0.130 78)` |
| `accent-hover` | `oklch(0.66 0.130 78)` |
| `accent-weak` | `oklch(0.95 0.040 82)` |
| `success` | `oklch(0.58 0.120 150)` |
| `warning` | `oklch(0.75 0.140 75)` |
| `danger` | `oklch(0.55 0.200 27)` |
| `danger-fg` | `oklch(0.99 0 0)` |

**Dark**

| Role | Value |
| --- | --- |
| `bg` | `oklch(0.16 0.006 70)` |
| `surface` | `oklch(0.20 0.007 70)` |
| `surface-raised` | `oklch(0.24 0.008 70)` |
| `text` | `oklch(0.96 0.004 85)` |
| `text-2` | `oklch(0.75 0.006 80)` |
| `text-3` | `oklch(0.60 0.006 80)` |
| `border` | `oklch(0.30 0.008 70)` |
| `border-strong` | `oklch(0.38 0.010 70)` |
| `accent` | `oklch(0.80 0.120 82)` |
| `danger` | `oklch(0.62 0.180 27)` |

Rule: **at most one gold element per card, two per viewport.** Gold marks the
primary action and the active nav item. It never fills a large area and never
appears as a gradient.

### Backgrounds and surfaces

Exactly three levels: `bg`, `surface`, `surface-raised`. The `bg-card/50 +
backdrop-blur-sm` pattern is retired in favour of opaque `surface` plus a 1px
border — translucency currently costs a blur on every card and buys nothing,
because there is no meaningful content behind them.

The marble radial stays on the page background at its current low opacity. The
parchment and vignette overlays stay on hero blocks only and come off content
areas.

### Typography

Bebas Neue currently covers `h1`–`h4` in uppercase with letter-spacing, which
flattens four ranks into one texture. A demotes it to two ranks.

| Role | Face | Size / line | Tracking | Case |
| --- | --- | --- | --- | --- |
| Page title | Bebas Neue | 32 / 36 | 0.04em | Upper |
| Section | Bebas Neue | 20 / 24 | 0.03em | Upper |
| Card title | Oswald 600 | 15 / 20 | 0.01em | Sentence |
| Body | Oswald 400 | 14 / 21 | 0 | Sentence |
| Label | Oswald 500 | 11 / 16 | 0.06em | Upper |
| Metric | Space Mono 500 | 20 / 24 | 0 | — |
| Metric inline | Space Mono 400 | 13 / 18 | 0 | — |

Mobile: page title 26/30, section 18/22. Body and inputs unchanged.

### Hierarchy

Three ranks per screen: page title → section → item. Within a list row, labels
drop to `Label` in `text-3` and values rise to `Body` in `text`. The status chip
becomes the loudest small element in the row: 11px uppercase on a `accent-weak`,
`success`-tinted or `danger`-tinted background with matching text.

The oversized watermark icons at 3–10% opacity on the stat cards are removed.
They add noise, no information, and they are the main reason those cards need to
be 180px tall.

### Spacing

4px base. Scale: **4, 8, 12, 16, 24, 32, 48, 64**.

| Context | Mobile | Desktop |
| --- | --- | --- |
| Card padding | 16 | 20 |
| List row vertical | 10 | 12 |
| Gap between cards | 12 | 16 |
| Section gap | 24 | 32 |
| Page gutter | 12 | 24 |
| Content max-width | — | 1120 |

The content cap of 1120 is the single change that fixes the dead margins in
history and settings.

### Borders

One `border` token at 1px, one `border-strong` for selected and hovered states.
The current mix of `border-border/40`, `/50`, `border-amber-500/20` and
`border-primary/20` collapses into those two. The only 2px border in the system
is the gold left bar on the active nav item, which is worth keeping — it is
distinctive and it costs nothing.

### Radii

Three steps, applied strictly:

- **4px** — inputs, badges, small buttons
- **8px** — buttons, cards
- **12px** — modals, hero blocks
- **full** — avatars and the theme toggle only

`rounded-full` currently appears 57 times, mostly on badges that should be 4px.
`rounded-2xl` and `rounded-xl` leave content entirely.

### Shadows

Two, both restrained:

- `shadow-1` — `0 1px 2px rgb(0 0 0 / 0.06)`, resting cards
- `shadow-2` — `0 8px 24px rgb(0 0 0 / 0.12)`, modals and dropdowns only

In dark mode shadows are close to invisible; elevation there comes from
`surface-raised` and `border-strong` instead. `shadow-lg` (currently 17 uses) and
`shadow-xl` disappear from cards.

### Buttons

Heights 32 / 36 / 44, the last for primary actions on mobile.

| Variant | Treatment |
| --- | --- |
| `primary` | Solid ink, inverse text, no gradient |
| `accent` | Flat gold fill, ink text — one per screen, the single most important action |
| `outline` | 1px `border`, transparent fill |
| `ghost` | No border, `surface-raised` on hover |
| `destructive` | Solid `danger` with real `danger-fg` |

`bronze` and `marble` are retired. They are near-duplicates of `accent` and they
dilute the one-gold rule. Removing them is a Phase 7 change, flagged here.

### Cards

Opaque `surface`, 1px `border`, 8px radius, 16/20 padding, `shadow-1`, no blur.
Structure: title row (card title + optional right-aligned meta), then content.
The routine card in particular tightens from ~280px to roughly 150px by removing
the watermark, the internal empty rows and the full-width label/value split.

### Inputs

40px tall, 44 on mobile. 4px radius, 1px `border`, `surface` fill. **16px font on
mobile, kept.** Focus is a 2px `accent` ring at 1px offset plus `border-strong`.
Labels sit above at `Label` scale. Errors: `danger` border plus 12px `danger`
text below, never colour alone.

### Navigation

Sidebar 240 expanded / 64 collapsed. The active item currently inverts to solid
black, which makes it the heaviest object on the screen; A changes it to
`surface-raised` with `text` and keeps the 2px gold left bar as the actual
signal. Disabled items sit at 45% opacity with the `SOON` badge reduced to 10px
uppercase `text-3` with no border box.

Header 56px, sticky, 1px bottom border, no shadow.

### Responsive

Give `md` and `lg` real jobs, since adaptation currently stops at `md`.

| Range | Behaviour |
| --- | --- |
| < 640 | Single column, 12px gutters, cards edge to edge |
| 640–1023 | Two columns where content allows, 16px gutters |
| 1024–1279 | Content max 960 |
| ≥ 1280 | Content max 1120; dashboard and history become primary + rail |

### Motion language

| Token | Value |
| --- | --- |
| `fast` | 120ms |
| `base` | 180ms |
| `slow` | 260ms |
| Standard easing | `cubic-bezier(0.2, 0, 0, 1)` |
| Exit easing | `cubic-bezier(0.4, 0, 1, 1)` |

- Hover changes background and border colour only. No transform, no scale.
- Press keeps the existing 1px `translateY`.
- Dialogs: opacity plus 4px `translateY`, `base`.
- **Page-level entrance animations are removed.** `animate-in fade-in
  slide-in-from-bottom` currently runs on whole pages, which delays perceived
  load and is the exact trope to avoid.
- The rest timer is the one place motion carries information: a linear countdown
  bar, no easing.
- `prefers-reduced-motion` collapses everything to opacity at 1ms.

---

# Direction B — "The Ledger"

Stronger. Same routes, same components, same responsive contract — but the
classical reference moves out of the decoration and into the structure.

The premise: Sunnsteel is a training **archive**. The screenshots even name it
one — `history` is titled "Training Archive". B takes that literally and designs
the app as a ledger: rules instead of boxes, columns instead of stacked pairs,
inscription typography instead of photographic backdrops, and gold as a
structural marker rather than a fill.

### Color palette

Two-tone ink and parchment with one oxidised gold. Dark mode is a distinct
"night" scheme, not an inversion.

**Day**

| Role | Value |
| --- | --- |
| `bg` | `oklch(0.970 0.012 85)` |
| `surface` | `oklch(0.990 0.006 85)` |
| `surface-sunken` | `oklch(0.945 0.014 85)` |
| `ink` | `oklch(0.18 0.015 55)` |
| `ink-2` | `oklch(0.42 0.012 55)` |
| `ink-3` | `oklch(0.58 0.010 55)` |
| `rule` | `oklch(0.86 0.012 70)` |
| `rule-strong` | `oklch(0.72 0.020 70)` |
| `gold` | `oklch(0.62 0.110 74)` |
| `crimson` | `oklch(0.46 0.160 25)` |
| `verdigris` | `oklch(0.50 0.110 150)` |

**Night**

| Role | Value |
| --- | --- |
| `bg` | `oklch(0.155 0.012 60)` |
| `surface` | `oklch(0.195 0.014 60)` |
| `surface-sunken` | `oklch(0.135 0.012 60)` |
| `ink` | `oklch(0.94 0.008 85)` |
| `ink-2` | `oklch(0.72 0.010 80)` |
| `ink-3` | `oklch(0.55 0.010 80)` |
| `rule` | `oklch(0.30 0.014 65)` |
| `gold` | `oklch(0.78 0.110 80)` |
| `crimson` | `oklch(0.62 0.150 25)` |

The gold is deliberately darker and less saturated than the current `#FFD700`.
Bright yellow reads as a warning colour; oxidised gold reads as material.

### Backgrounds and surfaces

**Most cards are removed.** The page becomes a single sheet, and sections are
separated by rules and space. Only three things stay boxed, because they are real
objects rather than groupings:

1. Modals and dropdowns
2. The set rows in an active session — a grid of editable fields needs edges
3. The dashboard "Today" block — the one thing that is a call to action

Texture: a single paper grain at ~2% on the page background. No vignette, no
blurred photography behind headings. The hero image blocks are replaced by a
typographic masthead, which also removes their weight from first paint.

### Typography

This is where B separates itself. **Cinzel is already loaded and used only
through inline styles.** It is the most classical face in the stack and it is
sitting idle; B promotes it to the masthead.

| Role | Face | Size / line | Tracking | Case |
| --- | --- | --- | --- | --- |
| Masthead | Cinzel 600 | 30 / 34 | 0.06em | Upper |
| Section | Bebas Neue | 18 / 22 | 0.08em | Upper |
| Column header | Oswald 500 | 11 / 14 | 0.10em | Upper |
| Item title | Oswald 600 | 16 / 22 | 0 | Sentence |
| Body | Oswald 400 | 14 / 22 | 0 | Sentence |
| Metric, large | Space Mono 700 | 28 / 30 | 0 | — |
| Metric, inline | Space Mono 400 | 13 / 18 | 0 | — |
| Epigraph | Cinzel 400 | 13 / 20 | 0.02em | Sentence |

Mobile: masthead 22/26, section 16/20, large metric 24/26.

Four ranks distinguished by **face and case**, not only size. Because the faces
differ, the sizes can sit closer together — which is what lets the layout get
denser without going flat.

### Hierarchy

Cinzel (page) → Bebas (section) → Oswald semibold (item) → Space Mono (data).

Status stops being a caption and becomes a **3px left rule** on the row in
`verdigris`, `crimson` or `ink-3`, paired with an 11px uppercase label. In a list
of thirty sessions you can find the aborted one without reading.

### Spacing

Base 4. Scale: **4, 8, 12, 16, 24, 40, 64**.

With boxes removed, spacing carries the structure:

| Context | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Ledger row padding | 10 | 10 | 10 |
| Between sections | 24 | 32 | 40 |
| Page gutter | 16 | 32 | 48 |
| Content max-width | — | — | 1200 |
| Prose max-width | — | 640 | 640 |

Ledger rows are separated by rules, not gaps — gap between rows is 0.

### Borders

Rules are the primary structural device:

- 1px `rule` between ledger rows
- 2px `rule-strong` beneath every section heading — a classical underline, and
  the thing that replaces the card boundary
- 3px `gold` left marker on the active nav item and on personal-record rows
- No box borders except the three boxed exceptions

### Radii

Near-zero, and this is B's sharpest departure:

- **2px** — buttons, inputs
- **4px** — modals
- **0** — ledger rows, section blocks, badges
- **full** — avatars only

Stone and inscription are not rounded. Dropping from the current nine radius
values to three is also the single most visible consistency gain.

### Shadows

**One shadow, used in two places**: modals and dropdowns, at
`0 16px 40px -12px rgb(0 0 0 / 0.35)`.

In night mode there are no shadows at all; depth comes from `surface-sunken`.
Everything currently carrying `shadow-sm`/`md`/`lg` switches to a rule.

### Buttons

Rectangular, 2px radius, heights 36 / 40 / 44. Labels Oswald 600 at 13px with
0.04em tracking.

| Variant | Treatment |
| --- | --- |
| `primary` | Solid `ink`, inverse text, uppercase |
| `accent` | Solid `gold`, `ink` text, uppercase — one per screen |
| `outline` | 1px `rule`, transparent |
| `ghost` | Text only, underline on hover — it fits the document metaphor |
| `destructive` | Solid `crimson` |

### Cards

Only the three exceptions above. Each: `surface`, 1px `rule`, 4px radius, 16/20
padding, **no shadow**. Everything currently boxed becomes a ruled section with a
Bebas heading and a 2px underline.

### Inputs

Underline-first: transparent fill, 1px bottom `rule`, no side borders. On focus
the bottom rule becomes 2px `gold` and the label shifts from `ink-3` to `ink`.
Heights 40 / 44. **16px on mobile, kept.**

One deliberate exception: the set-logger fields stay boxed on `surface-sunken`
with a 1px rule, Space Mono, tabular, centred. A dense grid of numeric inputs
needs edges to stay parseable, and that screen is where the app is actually used.

### Navigation

The sidebar becomes a **ledger index**: 220px, no distinct background fill,
separated from content by a single vertical `rule`. Items are 13px Oswald 500 in
sentence case at 36px height.

- Active: 3px `gold` left marker, `ink` text, `surface-sunken` fill
- Disabled: `ink-3`, and the `SOON` badge becomes the bare word "Soon" at 10px
  uppercase tracked, right-aligned, with no border box
- Collapsed: 56px, icons only, marker preserved

Header 48px, masthead in Cinzel at the left, search and avatar right, 1px bottom
rule, no shadow.

### Responsive

| Range | Behaviour |
| --- | --- |
| < 640 | Single column, 16px gutters. Ledger rows collapse to two lines: title, then inline metrics separated by middots. The status left-rule survives the collapse. |
| 640–1023 | 24px gutters, ledger keeps three columns |
| 1024–1279 | 32px gutters, content 960, dashboard two columns |
| ≥ 1280 | 48px gutters, content 1200, dashboard three columns with a persistent right rail: today's session, current streak, nearest record |
| ≥ 1536 | Content stays 1200, gutters absorb the rest. Line length never exceeds ~90ch. |

The right rail at ≥1280 is B's concrete answer to "what is desktop for". A wide
viewport stops being a wider phone and starts showing something a phone cannot.

### Motion language

Restrained and mechanical, matching the ledger metaphor.

| Token | Value |
| --- | --- |
| `fast` | 100ms |
| `base` | 160ms |
| `slow` | 240ms |
| Easing | `cubic-bezier(0.3, 0, 0.2, 1)` — no bounce, no spring |

Two signature motions, each used in exactly one place:

1. **The nav marker.** On navigation the 3px gold bar grows from 0 to full height
   in 160ms. It is the only animation in the chrome.
2. **Set completion.** When a set is marked done, its left rule fills top to
   bottom over 240ms and the row settles onto the completed surface. This is the
   one moment in the app that earns reward feedback, and giving it the *only*
   expressive motion is what keeps it meaningful.

Everything else: hover changes rule and text colour, dialogs fade with a 0.99→1
scale, and there are no page transitions at all.

`prefers-reduced-motion` reduces both signatures to an instant colour change.

---

## Comparison

| | A — Quiet Authority | B — The Ledger |
| --- | --- | --- |
| Recognisable as today's app | Yes, immediately | Same structure, clearly redesigned |
| Identity | Current identity, disciplined | Identity moved into structure |
| Radii | 4 / 8 / 12 | 0 / 2 / 4 |
| Cards | Kept, tightened | Mostly replaced by rules |
| Cinzel | Stays unused | Becomes the masthead |
| Desktop ≥1280 | Wider content, primary + rail | Three columns with a persistent rail |
| Risk | Low | Medium — the boxless layout must be proven on the session screen first |
| Distinctiveness | Modest | High |

### Cost, which is the same for both

Neither direction is a token swap. **436 raw palette classes** (`neutral-*`,
`amber-*`, and the rest) do not move when a token changes, and roughly 170 of
those are `neutral-*` standing in for text and border tokens. That migration is
the bulk of Phase 8 in either case, and it should be sized before the direction
is chosen rather than discovered during implementation.

B additionally removes card containers across most screens, which touches layout
markup rather than only class strings. It is the more expensive of the two by
perhaps a third — not double.

### Recommendation

**B, with A as the fallback if the Phase 4 proof of concept struggles.**

A is safe and would leave the product better. But it does not answer the question
the baseline actually raises: nothing in the current design says *this is
Sunnsteel*. The classical vocabulary is real and already paid for — Cinzel, Bebas,
the gold, the classical icon set — and A leaves most of it exactly where it is,
decorating the edges.

B is also the direction that solves the concrete defects rather than softening
them. Rules and columns fix the history row. A persistent rail gives ≥1280 a
reason to exist. Tabular metrics fix the numbers. Removing cards fixes the density
problem at its source instead of tuning padding.

The risk is real and it is localisable: a boxless layout can turn mushy. So the
Phase 4 proof of concept should be the **active session screen** — the densest
surface, the one with the most interactive states, the one where B's boxed
exception has to prove itself, and the one users spend the most time in. If B
holds there, it holds everywhere. If it does not, A is a clean retreat, because
the two share every colour role, the same spacing base and the same motion
principles.

---

## Reported, not changed

Two defects visible in the baseline that are **logic, not styling**, and so are
out of scope per the plan:

- `routines-1440-light` reads **"1 days/week"**. A pluralisation bug.
- `history-1440-dark` reads **"1320 min 3 sec"** for a 22-hour session. Duration
  formatting has no hour rollover, which also made the earlier stale session
  display as "21h 53m" on one screen and raw minutes on another.

Both belong in the product roadmap, not in this restyle.

## What Phase 3 must decide

1. A or B. The proof of concept target follows from it.
2. Whether `bronze` and `marble` button variants are retired.
3. Whether the hero image blocks survive. Both directions reduce them; B removes
   them entirely, which affects `HeroSection`, `HeroBackdrop`,
   `GoldVignetteOverlay`, `OrnateCorners` and `ParchmentOverlay`.
4. How the 436 raw palette classes are migrated: mechanically before the visual
   work, or per batch during Phase 8.
