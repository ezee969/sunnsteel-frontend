# Baseline capture manifest — Phase 0

The exact checklist for the `before/` baseline. Every row is captured at **390,
768 and 1440** in **light and dark**, at **device pixel ratio 1**, full page.

File naming: `<slug>-<width>-<theme>.png` — e.g. `dashboard-390-dark.png`.

## Preconditions

1. Frontend dev server running on `:3000` (`npm run dev`). Backend on `:4000`.
2. A signed-in browser session. Every route below except `/login` sits behind
   `PROTECTED_PREFIXES` in `middleware.ts` and redirects to `/login` without one.
   The owner signs in; do not attempt to authenticate on their behalf.
3. Seed data present, otherwise most captures are empty states rather than the
   design being audited. `../sunnsteel-backend` has `npm run db:seed:portfolio`.
4. Theme is switched via the app's own control so `next-themes` writes the `.dark`
   class; emulating `prefers-color-scheme` alone is not equivalent here, because
   `@custom-variant dark (&:is(.dark *))` keys off the class, not the media query.

## Routes

| Slug | Route | Notes |
| --- | --- | --- |
| `login` | `/login` | Only public route in the set |
| `dashboard` | `/dashboard` | Hero, stat cards, records, recent activity |
| `routines` | `/routines` | List, filters, empty state if unseeded |
| `routines-new` | `/routines/new` | Wizard; capture each step separately if they differ structurally |
| `workouts` | `/workouts` | Redirects into the live session when one exists — capture both states |
| `history` | `/workouts/history` | List plus filter bar |
| `session` | `/workouts/sessions/<id>` | The highest-density screen in the app |
| `profile` | `/profile` | Own profile; also capture another user's profile |
| `search` | `/search?q=<term>` | Results grid and the no-query state |
| `settings` | `/settings` | Longest form in the app |

## Component and state captures

Capture at 390 and 1440, both themes, unless noted.

| Slug | What |
| --- | --- |
| `sidebar-expanded` | Desktop sidebar open (1440 only) |
| `sidebar-collapsed` | Desktop sidebar collapsed to icons (1440 only) |
| `sidebar-mobile` | Mobile drawer open (390 only) |
| `header-search` | Header search bar, focused with suggestions |
| `rest-timer` | Active rest timer bar during a session |
| `stale-session-dialog` | Stale-session recovery dialog |
| `confirm-finish` | Session finish confirmation dialog |
| `dropdown-profile` | Profile dropdown menu open |
| `toast` | A toast in its visible state |
| `loading` | One route mid-load, showing the skeletons |

## Responsive sweep

Separate from the baseline: a pass at each width looking for defects, recorded as
findings rather than as committed images. Capture an image only where a defect is
found, named `sweep-<slug>-<width>-<theme>.png`.

```text
320  375  390  430  768  1024  1280  1440
```

Look for: horizontal overflow, clipping, overlap, broken grids, navigation
wrapping, unexpected text wrapping, excessive whitespace, broken breakpoint
transitions.

Two things this codebase makes likely, from the Phase 1 audit:

- **320 and 375 are unverified territory.** The smallest declared breakpoint is
  `sm` (640px) and the only sub-`sm` rule in the app is one `max-[400px]:` on the
  dashboard hero. Everything from 320 to 639 renders identically.
- **1024, 1280 and 1440 are near-identical.** `lg:` appears 26 times and `xl:`
  once, so the layout stops adapting above 768. Expect wide viewports to show a
  stretched tablet layout rather than a desktop one.
