# UI Accessibility Review

1. **P0 — The active-session set controls are too small for the app's most
   touch-intensive flow.** In `features/workout/set-log-input.tsx`, the three
   numeric inputs are forced to `h-9` (36px) and the completion control to
   `size-5` (20px), overriding the design system's 44px mobile field height.
   The 20px checkbox is below WCAG 2.2's 24px target-size minimum unless the
   spacing exception can be demonstrated, and neither control provides a
   practical 44px touch area. This is repeated for every set in
   `session-full-390-{light,dark}.png`. Give each input and checkbox a minimum
   44px mobile hit area without shrinking the visible field or relying on the
   row around it to receive the event.

2. **P0 — Primary sidebar navigation creates duplicate, invalid keyboard
   targets.** `features/shell/components/Sidebar.tsx` wraps a real `<button>`
   (`Button` with `asChild={false}`) inside every enabled Next `<Link>`. Each
   destination can therefore produce an anchor stop and a nested button stop,
   with ambiguous activation semantics. The file's comment says the active
   link has `aria-current`, but no `aria-current` is rendered. Use one anchor
   per destination via `Button asChild`, and put `aria-current="page"` on the
   active link. This affects the persistent desktop navigation shown at 768 and
   1440 and the mobile drawer counterpart.

3. **P0 — The routine wizard stepper is pointer-only.** Both layouts in
   `components/ui/stepper.tsx` put `onClick` on plain `<div>` elements without
   `tabIndex`, a keyboard handler, a button/link role, or `aria-current="step"`.
   A keyboard user cannot return to a visited step even though the UI presents
   that step as clickable, and assistive technology cannot distinguish current,
   completed, visited, and unavailable steps. Render reachable steps as real
   buttons and expose the current and disabled states programmatically.

4. **P0 — Keyboard focus inside menus and selects is effectively invisible.**
   `DropdownMenuItem`, checkbox/radio menu items, sub-triggers, and `SelectItem`
   remove the outline and indicate focus only with `focus:bg-accent`. Against
   `--popover`, that state change is approximately **1.21:1 in light mode and
   1.11:1 in dark mode**, far below the 3:1 non-text contrast needed to identify
   a component state. The open menu screenshots show how little separation
   exists even before focus is considered. Add a persistent 2px focus indicator
   using `--ring`, or another focus treatment that reaches 3:1 in both themes;
   do not make keyboard focus depend on the neutral hover fill.

5. **P1 — Reduced-motion support does not cover the motion users actually
   receive.** The global media query disables four named CSS animations, but
   Framer Motion still writes transforms directly in the auth layout/pages,
   search suggestions, toasts, the initial-load animation, and wizard exercise
   list. The auth screen alone still moves the logo and whole form by 20px for
   500–800ms. Numerous stock `animate-spin`/`animate-pulse` instances also fall
   outside the query, including the active-routine dot visible in the routine
   screenshots. Read `prefers-reduced-motion` in the Framer components, remove
   layout/translate motion in that mode, and disable or replace every stock
   infinite animation so the implementation matches the locked motion rule.

6. **P1 — Search suggestions are not exposed as a keyboard-operable search
   composite.** `components/ui/search-bar.tsx` renders a text input and a visual
   popup without combobox/listbox relationships, `aria-expanded`,
   `aria-controls`, active-option state, or Arrow/Escape handling. More
   concretely, “View all results…” is a clickable `<div>` with no role or
   `tabIndex`, so it cannot be reached from the keyboard at all. Use an
   explicitly labelled combobox/listbox pattern and make every action a real
   button or link.

7. **P1 — Validation errors are visually present but not associated with the
   fields that caused them.** The history date range renders its error beside
   “To”, but the input receives neither `aria-invalid` nor `aria-describedby`;
   the set-log reps, weight and RPE inputs likewise add a red class without
   either attribute, and their shared error footer has no ID. A screen reader
   user editing one of several repeated fields cannot determine which field is
   invalid or hear the error when it appears. Set `aria-invalid`, connect each
   message with `aria-describedby`, and announce asynchronous save failures as
   errors rather than a generic polite status.

8. **P1 — Page heading semantics change with the viewport and frequently
   duplicate or skip levels.** The protected top bar is an `<h1>` but is
   `hidden` below `sm`; `HeroSection`, the visual page inscription, is always an
   `<h2>`. As a result, Settings and Workouts begin with an `<h2>` on mobile,
   while Search and History have two `<h1>` elements on desktop. Dashboard is
   ordered top-bar `<h1>` → inscription `<h2>` → greeting `<h1>`, and on mobile
   becomes `<h2>` → `<h1>`. Keep chrome text out of the document heading
   hierarchy and make the visible page inscription the single `<h1>` at every
   width, with section headings descending from it.

9. **P1 — Several visible selected states are not programmatically exposed.**
   The routine filter strip changes the active filter from outline to filled
   ink but supplies no `aria-pressed`, tablist semantics, or selected state.
   `CommonSplitCard` similarly changes its ring/background when selected while
   remaining only `role="button"`, and the theme button exposes only “Toggle
   theme” rather than the current/next state. Add `aria-pressed` or the correct
   tab/radio semantics so the filled, selected appearance shown in the routine
   and wizard screenshots is not visual-only.

10. **P1 — The login divider text fails WCAG AA contrast in both themes.**
    “OR” is `text-neutral-400` on white in light mode and
    `dark:text-neutral-500` on `neutral-950` in dark mode. Those pairs measure
    approximately **2.59:1** and **4.18:1**, respectively, below 4.5:1 for the
    12px text shown in every login screenshot. Replace the raw neutral colours
    with an AA-cleared text token such as `--ink-3` and verify the rendered pair
    in both themes.

11. **P1 — Repeated workout and wizard copy drops below the locked readable
    type scale.** The set rows use 10px labels for “Target”/“Optional” and 11px
    for RIR, previous performance and improvement text; `CommonSplitCard` also
    uses 10px descriptions and badges. The dense micro-caps are visibly the
    hardest text to read in the 390px session and wizard captures and contradict
    the design system's 12px label / 13px repeated-row body minimum. Move
    repeated-row captions to 13px sentence case and keep labels at 12px with the
    specified tracking.

12. **P2 — Mobile controls repeatedly meet neither the design system's 44px
    practical target nor a consistent expanded hit area.** The theme toggle,
    routine kebab/favourite/completion buttons and filter buttons are 36px; the
    header icon buttons are 40px; dropdown menu rows are about 32px; the toast
    dismiss control is roughly 22px. The screenshots show these controls in the
    390px layout where they are expected to be touched. Preserve the compact
    glyphs if desired, but expand their interactive boxes to at least 44×44px
    and keep adjacent targets from overlapping.

13. **P2 — Disabled semantics and disabled visuals disagree.** Sidebar “Soon”
    entries declare `aria-disabled="true"` but remain activatable and display a
    toast; the routine menu's “Start session with day” pseudo-heading is a live
    menu item made mouse-inert only with `pointer-events-none opacity-60`;
    session actions, tabs and accordions reintroduce 50–60% whole-control opacity
    despite the locked rule requiring `--ink-3` on `--surface-sunk`. Make
    unavailable controls genuinely disabled, use a menu label for non-actions,
    and remove opacity-based disabled styling so borders, text and focus cues do
    not all fade together.

14. **P2 — The active-session screenshots cannot validate the current state
    styling.** All six `session-full-*` captures show crimson checked boxes,
    crimson Finish Session controls and gold completion marks, while the current
    primitives map checked boxes to `--success-strong` and the primary action to
    `--primary`. They are also the only full-page captures older than the rest of
    the suite. Re-capture the active session at 390/768/1440 in both themes from
    the current build before using screenshots to sign off contrast, completion,
    focus or disabled states on that flow.
