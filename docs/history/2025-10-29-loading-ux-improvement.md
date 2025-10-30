# Loading UX Improvements for Protected Routes Navigation (2025-10-29)

## Summary
Improved perceived performance and feedback when navigating via the sidebar
between protected pages (`/dashboard`, `/routines`, `/workouts`).

## Changes
- Added a Suspense boundary with a skeleton fallback inside
  `app/(protected)/layout.tsx` to provide a loading state when children suspend.
- Introduced a lightweight top progress bar to signal navigation start
  immediately and finish once the route resolves.
- Removed a premature fade-out transition on pathname changes that could briefly
  hide content during navigation, preventing a "blank" feel.

## Affected Files
- `app/(protected)/layout.tsx` (added Suspense fallback, top progress bar,
  removed content fade-out during navigation)
- `features/shell/components/Sidebar.tsx` (new optional `onNavigateStart` prop
  to notify layout of navigation start)
- `components/ui/top-progress-bar.tsx` (new component)

## UX Impact
- Users now see immediate visual feedback (top progress bar) when clicking a
  sidebar item, avoiding the impression that nothing is happening.
- Existing route-level `loading.tsx` files still handle initial page load
  skeletons per segment.
- Previous content remains visible until the new route is ready, avoiding a
  jarring blank state.

## Notes
- No API changes.
- Accessibility: the progress bar is `aria-hidden` and purely decorative.
- Styling follows the existing brand aesthetic (gold accent) and light footprint.
