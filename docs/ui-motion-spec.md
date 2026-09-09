# Sunnsteel Motion Spec — v1.0

Phase 10 of [ui-restyle-plan.md](ui-restyle-plan.md). Applies the **locked** motion
tokens of [ui-design-system.md](ui-design-system.md) §9 to every interactive
surface of the finished static UI captured in
[ui-restyle/screenshots/after/](ui-restyle/screenshots/after/).

**This document decides nothing new about duration or easing.** §9 of the locked
design system is the source of every value here; this spec assigns those values
to components, resolves the cases §9 left open (tabs, accordions, loading,
toasts, tooltips, exit pairing), and states the implementation constraints that
follow from the app being an installed PWA on iPhone with a broadly
re-rendering session screen. Where this document and §9 disagree, §9 wins and
this file carries a defect report.

Evidence read before writing: the `after/` captures (dashboard, history,
history-filters, routines menu, delete dialog, session, login, settings,
profile, search at 390/768/1440 in both themes), the Known Risks register in
[ui-restyle-progress.md](ui-restyle-progress.md), and the animation classes
currently shipped in `components/ui/`.

---

## 1. Tokens and ground rules

### 1.1 Tokens (locked, restated)

| Token | Value | Role in this spec |
| --- | --- | --- |
| `--motion-fast` | `120ms` | Colour, border, icon tint on hover/focus; checkbox and save-ring state; accordion reveal; tooltip enter |
| `--motion-base` | `200ms` | Control state change, tab switch, dropdown/popover enter, nav marker slide, chevron rotate, scrim enter, toast enter |
| `--motion-slow` | `300ms` | Dialog enter, drawer enter, theme crossfade, progress fill, set-completion mark and row settle |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Everything entering or changing |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Everything leaving |

Signature durations, also locked: rule draw **240ms** standard; set-completion
mark fill **300ms** standard; nav marker slide **200ms** standard.

Exits run at 60–70% of their enter duration. The resolved exit table:

| Surface | Enter | Exit |
| --- | --- | --- |
| Dropdown / select / popover / menu | 200ms standard | **140ms** exit |
| Dialog / alert dialog | 300ms standard | **180ms** exit |
| Drawer (mobile nav) | 300ms standard | **200ms** exit |
| Toast | 200ms standard | **140ms** exit |
| Tooltip | 120ms standard | **80ms** exit |
| Scrim (dialog) | 200ms standard | 180ms exit |
| Scrim (drawer) | 200ms standard | 140ms exit |

Declaration mechanics are locked (§9.5): durations are plain `:root` custom
properties consumed as `duration-[var(--motion-base)]`; `--ease-*` lives in
`@theme inline` and yields the `ease-standard` / `ease-exit` utilities. A
`--duration-*` theme entry would emit nothing — do not add one.

### 1.2 The property allow-list

Motion is restricted to compositor properties plus small-area paint. Nothing
else animates, anywhere, in either theme.

**May animate:**

- `transform` — translate, scale, rotate (nav marker, drawer, overlay enter/exit, chevron, press, progress fill, mark fill, spinner)
- `opacity` — scrims, overlay enter/exit, skeleton pulse, content reveal, toasts
- `color`, `background-color`, `border-color`, `text-decoration-color`, `fill`, `stroke` — hover, focus-adjacent tint, control state, row settle, theme crossfade
- `box-shadow` **colour only**, and only on the 16px set-checkbox save ring (§11.7) at `--motion-fast`

**Never animates:** `width`, `height`, `margin`, `padding`, `inset`,
`grid-template-rows`, `font-size`, `letter-spacing`, `line-height`,
`box-shadow` blur/offset/spread, `backdrop-filter`, `filter`,
`background-position`, any gradient. Layout is never the message.

Consequences for existing code, stated once here and itemised in §7:

- `accordion.tsx`'s `transition-[grid-template-rows]` is removed. Height changes
  are instant; the reveal is opacity only.
- No `transition-all` survives. Every transition lists its properties
  (`transition-colors`, `transition-opacity`, `transition-transform`, or an
  explicit `transition-[color,background-color,border-color]`).
- Press (`active:translate-y-[1px]`) stays at **0ms**: transform is not in any
  transition property list, so the press is instant and the release is instant.
  This is locked (§9.2) and is correct — an eased press reads as lag on a
  touch device.
- Focus rings appear at **0ms**. A eased focus ring delays a visibility
  affordance for keyboard users; `transition-colors` already excludes
  `box-shadow`, and it stays excluded.

### 1.3 Three structural rules

1. **Once per region per visit, never per re-render.** The rule draw runs when
   a region mounts, as a CSS animation with `animation-fill-mode: backwards`.
   React re-renders must not restart it: the animation lives on a stable
   element and its `animation-name` never toggles. No entrance animation
   repeats on list append, query refetch, tab return or unit toggle.
2. **Motion is feedback, not decoration.** Every animation in §2 answers one
   of: *where am I* (nav marker), *what layer opened* (overlay enter), *did my
   input land* (press, check, save ring, row settle), *what changed state*
   (tab, chevron, theme). Anything that cannot be phrased that way is removed.
3. **The session screen is CSS-only.** No `requestAnimationFrame`, no WAAPI,
   no JS timer writing style, no animation library — on any screen, but this
   is enforced on the session screen where re-renders are broad (Known Risks;
   TD-07). CSS transitions and mount-time keyframes only, driven by class or
   `data-state` changes.

---

## 2. Surface-by-surface spec

### 2.1 Buttons and controls

Applies to every `button.tsx` variant, icon buttons, the stepper's controls and
the checkbox.

| Trigger | Property | Duration / curve |
| --- | --- | --- |
| Hover | `background-color`, `border-color`, `color` | 120ms standard |
| Press | `transform: translateY(1px)` | 0ms |
| Focus-visible | ring (`box-shadow`) | 0ms |
| Checked / unchecked | `background-color`, `border-color` | 120ms standard |
| Check glyph | `opacity` | 120ms standard |
| Disabled | — | no motion; static `--ink-3` on `--surface-sunk` |

No scale on hover, no shadow on hover, no translate on hover. The shipped
`transition-colors duration-[var(--motion-fast)] ease-standard` on
`button.tsx`, `checkbox.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx` and
`badge.tsx` already matches this table; keep it.

A button in a pending state swaps its label for the spinner instantly; the
spinner motion is §2.8.

### 2.2 Hover states outside buttons

Nav items, ledger rows, menu items, search results, routine rows: hover changes
`background-color` and `color` only, 120ms standard. Ghost and link buttons add
an underline whose `text-decoration-color` transitions at 120ms standard; the
underline offset does not animate.

**No information depends on hover.** Hover and focus may only *reinforce* an
affordance that is already visible at rest — a border, a glyph, a label, the
nav marker, a chevron. Two current violations are fixed with this spec, not
later:

- `toast.tsx`'s close button is `opacity-0` until `group-hover` /
  `focus-visible`. On a touch PWA neither fires, so the affordance does not
  exist. At `@media (pointer: coarse)` it is opacity 1 at rest; at fine
  pointers the 120ms opacity reveal stays.
- Any row action hidden until hover must instead render at rest in `--ink-3`.
  The `after/` captures already show the kebab icons at rest; keep them there.

### 2.3 Navigation

| Element | Motion | Duration / curve |
| --- | --- | --- |
| Sidebar active marker (3px `--honour-strong`) | `transform: translateY` between items; one marker element, never two | 200ms standard |
| Marker on first mount of a page | none — it appears in place | 0ms |
| Nav item hover | `background-color`, `color` | 120ms standard |
| Sidebar collapse chevron (topbar) | `transform: rotate(180deg)` | 200ms standard |
| Mobile drawer enter | `transform: translateX(-100% → 0)` + scrim `opacity` 0→1 | 300ms standard / scrim 200ms standard |
| Mobile drawer exit | `translateX(0 → -100%)` + scrim `opacity` →0 | 200ms exit / scrim 140ms exit |
| Route change | **no page-level entrance animation** (locked §9.2). Content swaps instantly; each region draws its rule once (§2.9) | — |

The marker slides because it is one element translated, not because each item
grows a border: per-item borders cannot slide and would cross-fade instead.
Item heights are uniform (36px), so translate is exact and layout-free.

### 2.4 Dropdowns, menus, selects, popovers

Applies to `dropdown-menu.tsx`, `select.tsx`, `popover.tsx`, the routines kebab
menu, the user menu, the history FILTER popover at ≥640 and the search-bar
results panel.

| Phase | Property | Duration / curve |
| --- | --- | --- |
| Enter | `opacity` 0→1, `transform: scale(0.98 → 1)` plus the existing 8px side-translate toward the anchor, origin at the Radix transform-origin variable | 200ms standard |
| Exit | `opacity` →0, `scale(1 → 0.98)` | 140ms exit |
| Trigger chevron while open | `rotate(180deg)` | 200ms standard |
| Item hover inside | `background-color`, `color` | 120ms standard |

Scale enters at 0.98, not the shipped `zoom-in-95`'s 0.95: at 0.95 a 320px menu
visibly swims. Set `--tw-enter-scale: 0.98` / `--tw-exit-scale: 0.98` on the
content element rather than adding a keyframe. Enter and exit need different
durations, so the closed state carries its own
`data-[state=closed]:duration-[140ms]`; a single `duration-*` class applies to
both phases and is therefore wrong here.

The 390 history filter panel is **not** a popover — it expands inline under the
FILTER button. It is an accordion and follows §2.7.

### 2.5 Modals

Applies to `dialog.tsx`, `alert-dialog.tsx`, the session finish dialog and the
stale-session recovery dialog, at every width. Dialogs inset 16 at all widths
(§11.9), so 390 gets the same motion as 1440 — no sheet slide, ever.

| Phase | Property | Duration / curve |
| --- | --- | --- |
| Scrim enter | `opacity` 0→1 | 200ms standard |
| Panel enter | `opacity` 0→1 + `scale(0.98 → 1)`, centred, no translate | 300ms standard |
| Panel exit | `opacity` →0 + `scale(→ 0.98)` | 180ms exit |
| Scrim exit | `opacity` →0 | 180ms exit |
| Content inside the panel | none — no stagger, no cascade, no fade-up | 0ms |

`--shadow-overlay` is static: present at rest in light, `none` in dark, never
transitioned (blur/offset are on the never-list).

### 2.6 Tabs

Applies to the routines filter tabs and any `tabs.tsx` consumer.

- Trigger state change (`background-color`, `color`, icon tint): **200ms
  standard** — this is §9's "tab switch" at `--motion-base`.
- No sliding indicator. The four routine tabs are variable-width segments; a
  sliding pill would need measurement JS for a state change that colour already
  communicates. Underline-style tabs, if one ever ships, slide their underline
  with `transform` at 200ms standard.
- Panel content: **no entrance animation**. The swap is instant. A fade on
  every tab switch is a repeated entrance animation, which §1.3 rule 1 and the
  plan's avoid-list both forbid; the trigger colour plus the moved focus already
  state the change.
- The active tab's `shadow-sm` is removed (§8 retired it); removing a shadow is
  not a motion change and gets no transition.

### 2.7 Accordions and collapsibles

Applies to `accordion.tsx`, the history filter panel at <640, and the exercise
group collapse on the session screen.

| Element | Motion | Duration / curve |
| --- | --- | --- |
| Chevron | `rotate(180deg)` | 200ms standard |
| Expand | content mounts at full height **instantly**, `opacity` 0→1 | 120ms standard |
| Collapse | content unmounts instantly; chevron rotates | 0ms content / 200ms chevron |

The current `transition-[grid-template-rows] duration-300 ease-in-out` is a
layout animation and is deleted. The honest alternative — instant height,
120ms reveal — keeps the chevron as the state signal and costs zero layout
work per frame on a phone. `transition-all` on the accordion trigger becomes
`transition-colors`; its hover underline appears instantly.

### 2.8 Loading states and progress

| Element | Motion | Duration / curve |
| --- | --- | --- |
| Spinner (`classical-loader`, pending buttons, history "LOADING…") | `transform: rotate`, single arc, colour `--ink-2` — not gold (§4.3 rule 3) | 800ms linear infinite |
| Skeleton block | static `--surface-sunk` + `opacity` 1→0.55→1 | 1600ms ease-in-out infinite |
| Determinate progress fill (`progress.tsx`, session PROGRESS bar, stat-band bars) | `transform: scaleX`, origin left — Radix already drives the indicator by transform | 300ms standard |
| Route top bar | determinate `scaleX` 300ms standard; on completion `opacity` →0 then unmount | exit 140ms exit |
| Indeterminate loops, shimmer sweeps | **none** — a shimmer is an animated gradient (§6) | — |
| List append (infinite scroll, refetch) | none — new rows appear at rest | 0ms |

The skeleton pulse and the spinner are the only infinite animations in the app.
Both are single-property, both stop under reduced motion (§3), and neither
carries information: the "LOADING…" label and the skeleton's position carry it.

### 2.9 State transitions and the two signatures

**Signature 1 — the rule draw.** A region's heading rule scales
`scaleX(0 → 1)`, origin left, **240ms standard**, once per region per visit
(§1.3 rule 1). Content under the rule does not fade or rise; it is simply there
when the rule lands. Implemented as a mount-time CSS animation, not a
transition, so re-renders cannot replay it.

**Signature 2 — set completion.** On the session screen, when a set's checkbox
turns complete:

| Part | Motion | Duration / curve |
| --- | --- | --- |
| Left `.mark` | `transform: scaleY(0 → 1)`, origin top — the fill top-to-bottom | 300ms standard |
| Row background | `background-color` → completed tone | 300ms standard |
| Checkbox fill + border | `background-color`, `border-color` | 120ms standard |
| Check glyph | `opacity` 0→1 | 120ms standard |

Unchecking runs the same properties in reverse at the same durations with
`--ease-exit`. The mark is a transform, not a height: a growing border would
reflow the row on every set.

**Other state transitions:**

| Transition | Motion | Duration / curve |
| --- | --- | --- |
| Save-status ring on the set checkbox (idle/saving/saved/error) | `box-shadow` colour only | 120ms standard |
| Honour improvement mark (arrow + text) appearing on a row | `opacity` 0→1, once when the state arrives; no scale pop, no replay on re-render | 200ms standard |
| Stepper connector (current → complete) | `background-color`, `border-color` | 200ms standard |
| Theme crossfade | `color`, `background-color`, `border-color` app-wide via a temporary class on the shell, removed after the transition ends | 300ms standard |
| Rest timer digits | **none** — fixed mono slot (§5.4); a ticking numeral is information, not motion | 0ms |
| Rest timer crossing its warning threshold | `color` | 120ms standard |
| Toast enter | `opacity` 0→1 + `translateY(∓8px → 0)` from its docked edge | 200ms standard |
| Toast exit | reverse | 140ms exit |
| Tooltip enter / exit | `opacity` + `scale(0.98 → 1)` / reverse | 120ms standard / 80ms exit |

The theme crossfade is the one app-wide colour transition and it exists only
while toggling: a permanent `* { transition: background-color … }` would put a
paint transition on every node of a screen that re-renders broadly. The class
is added on toggle and removed on `transitionend` (or a 320ms fallback timer);
under reduced motion it is never added.

---

## 3. `prefers-reduced-motion`

Locked behaviour (§9.3), resolved per surface:

| Motion | Reduced |
| --- | --- |
| Rule draw | Instant final state — the rule is simply there |
| Set-completion mark fill | Instant; the row settles by **instant colour change** |
| Nav marker slide | Instant position |
| Overlay enter/exit (dropdown, dialog, drawer, toast, tooltip) | `opacity` only at **120ms standard**; no scale, no translate |
| Chevron rotate, press translate, progress scaleX | No transform animation: chevrons and progress snap, press stays instant as it already is |
| Spinner rotation, skeleton pulse | **Static.** The arc and the block hold; the label and the skeleton position carry the state |
| Theme crossfade | Instant |
| Hover / focus / control-state colour | Unchanged at 120ms — colour at this duration is not vestibular load |

Implementation: one `@media (prefers-reduced-motion: reduce)` block in
`globals.css` that (a) sets the three `--motion-*` properties to `120ms`,
(b) disables the transform/width keyframe animations by name
(`animation: none` on the spinner, pulse, rule-draw and mark-fill classes), and
(c) zeroes enter/exit scale and translate variables
(`--tw-enter-scale: 1; --tw-enter-translate-y: 0px;` and the exit pair).
Width and transform animations are off; opacity and colour survive at
`--motion-fast`. Nothing in the app may query the media feature in JS to decide
*what* to render — reduced motion changes how state arrives, never whether
information is shown.

---

## 4. Performance budget (installed PWA, iPhone cold start)

- **No new dependency.** No framer-motion, no GSAP, no WAAPI wrapper.
  `tailwindcss-animate` already ships and remains the only animation utility
  source, used solely for Radix `data-state` enter/exit keyframes.
- **CSS transitions and mount-time keyframes only.** The session screen gets no
  JS-driven style writes; verify with a grep for `requestAnimationFrame` and
  `animate(` under `features/workout/` and `hooks/` (the rest timer computes
  from an absolute deadline and writes text, never style — keep it that way).
- **Compositor-first.** Every transform/opacity animation runs on the composite
  thread; the colour transitions are small-area paint (controls, rows, markers).
  No animated property triggers layout (§1.2).
- **No permanent `will-change`.** Overlays exist only while open; Radix mounts
  them on demand. A persistent `will-change: transform` on the nav marker would
  pin a layer for the life of the shell — the 200ms slide does not justify it.
- **Keyframe inventory is closed:** `spin` (800ms), `pulse-opacity` (1600ms),
  `rule-draw` (240ms), `mark-fill` (300ms). A fifth keyframe needs a defect
  report against this section, not a silent addition.
- **`InitialLoadAnimation` keeps `children` mounted from the first frame**
  (Known Risks; TD-03). No motion in this spec may gate mounting, delay a query,
  or hold content behind an animation. Overlays animate opacity *on top of*
  already-rendered content, never instead of it.

---

## 5. Prohibited

Locked §9.2 plus the plan's avoid-list, restated as one list. A violation is a
defect, not a variation:

- page-level entrance animation (`animate-in fade-in slide-in-from-bottom` on
  whole pages — currently shipped and removed by this spec)
- fade-up per section, repeated entrance animations on refetch/append/tab return
- scale or translate on hover; hover changes colour only
- floating cards, elevation-on-hover, glowing or coloured borders
- animated gradients, shimmer sweeps, parallax
- layout animation of any kind (§1.2 never-list)
- `transition-all`
- eased press or eased focus ring
- any second signature motion. There are exactly two (§2.9); the nav marker
  slide is chrome, not a third

---

## 6. Deltas against the shipped primitives

What changes in `components/ui/` when this spec is implemented (Phase 10):

| File | Current | Spec |
| --- | --- | --- |
| `accordion.tsx` | `transition-[grid-template-rows] duration-300 ease-in-out`; trigger `transition-all`; chevron `duration-300 ease-in-out` | height instant + content `opacity` 120ms standard on open; trigger `transition-colors`; chevron 200ms standard |
| `dialog.tsx`, `alert-dialog.tsx` | `zoom-in-95`/`zoom-out-95`; one `duration-[var(--motion-slow)]` for both phases | `--tw-enter-scale/--tw-exit-scale: 0.98`; enter 300ms standard, `data-[state=closed]:duration-[180ms]` exit |
| `dropdown-menu.tsx`, `select.tsx`, `popover.tsx` | same zoom-95 pair, no explicit duration | scale 0.98; enter 200ms standard, exit 140ms exit |
| `tooltip.tsx` | `zoom-in-95`, no duration | scale 0.98; 120ms standard / 80ms exit |
| `tabs.tsx` | `transition-[color,box-shadow]` with no duration; active `shadow-sm` | `transition-colors duration-[var(--motion-base)] ease-standard`; shadow removed |
| `toast.tsx` | close button `opacity-0 group-hover:opacity-100` | opacity 1 at rest under `pointer: coarse`; enter/exit 200/140 with 8px translate |
| `progress.tsx` | `transition-transform duration-[var(--motion-slow)] ease-standard` | unchanged — already correct |
| `button.tsx`, `checkbox.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `badge.tsx`, `search-bar.tsx`, `stepper.tsx` | `transition-colors duration-[var(--motion-fast)] ease-standard` | unchanged — already correct |
| `skeleton.tsx`, `classical-loader.tsx` | static / ad-hoc | `pulse-opacity` 1600ms; `spin` 800ms linear, colour `--ink-2` |
| `top-progress-bar.tsx` | `transition-opacity duration-200` | enter opacity 120ms standard; exit 140ms exit |
| page wrappers | `animate-in fade-in slide-in-from-bottom` on whole pages | deleted (§5) |

---

## 7. Verification gates

Added to the §15 gates of the design system for any Phase 10 change:

1. **Compiled stylesheet.** Grep `.next/static/css/*.css` (both bundles) for
   `--motion-fast|base|slow`, `ease-standard`, `ease-exit` and each new
   keyframe name after the change; an undefined utility emits nothing and no
   error (TD-28, TD-29, Findings 43).
2. **Measured durations on rendered nodes** — 0.12s / 0.2s / 0.3s / 0.24s and
   the exit pair 0.14s / 0.18s / 0.2s — in both themes, as Phase 4 did.
3. **No layout thrash.** A Performance trace of: opening the delete dialog,
   opening the kebab menu, expanding the history filters, completing a set.
   Zero Layout events attributable to animation; only Compositor and Paint.
4. **Reduced motion emulated.** Every row of §3 observed: spinner static,
   overlays opacity-only at 120ms, signatures instant, information unchanged.
5. **`pointer: coarse` emulated.** Toast close and every row action visible at
   rest; nothing in §2.2 requires hover.
6. **Session screen CSS-only.** Grep `features/workout/`, `hooks/` for
   `requestAnimationFrame` / `.animate(` / `style.` writes driving animation;
   the set-completion and rule-draw motions must survive a forced re-render
   without replaying (rule 1.3.1).
7. **`npm run verify` with the dev server stopped** (§15 gate 5), and the dev
   server confirmed answering 200 before any screenshot comparison (Known
   Risks).
