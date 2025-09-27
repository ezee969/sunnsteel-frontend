# Frontend Architecture Overview

This document outlines key structure and patterns relevant to the Routines area and recent refactors.

## Feature Structure

- `features/routines/components/`
  - `RoutineCard.tsx`: Presentational card for a routine row (header, actions, progress, badges)
  - `ProgramStatusBadge.tsx`: Shows "Program ended" or `X weeks left` based on `programEndDate`
  - `RoutinesSkeletonList.tsx`: Reusable loading skeleton for routines list
  - `EmptyRoutinesState.tsx`: Reusable empty-state with CTA to create a routine
- `features/routines/hooks/`
  - `useRoutineListActions.ts`: Encapsulates actions and UI state for list items (delete, favorite, completed, start session)

## Integration Points

- `app/(protected)/routines/components/WorkoutsList.tsx`
  - Now delegates to `RoutineCard` for each routine
  - Uses `useRoutineListActions` to handle all item actions and async flags
  - Uses `RoutinesSkeletonList` and `EmptyRoutinesState` for loading/empty states

## Utilities

- `lib/utils/date.ts`
  - `weekdayName(dow, style)`: Short/long weekday names used across UI
  - `weeksRemainingFromEndDate(dateISO)`: Computes weeks left (date-only)
- `lib/utils/a11y.ts`
  - `onPressEnterOrSpace(handler)`: Consistent keyboard activation helper

## Patterns & Conventions

- Prefer small, focused components for presentational pieces
- Extract side-effects and mutations into feature hooks
- Keep accessibility consistent with keyboard helpers
- Reuse skeleton/empty state components to ensure visual consistency

## Next Candidates

- Extract `RoutineProgress` component if progress UI grows
- Apply `onPressEnterOrSpace` in other interactive components for consistency
