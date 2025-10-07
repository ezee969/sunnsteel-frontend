# History Workout Components

This guide describes the reusable pieces introduced for workout session history views.

## Components

### `HistorySessionHeader`
- Location: `components/workout/history-session-header.tsx`
- Responsibility: renders the page title, day/date, status badge, duration, completed set count, total volume, and optional notes. Accepts a back-navigation callback.
- Props:
  - `title?: string`
  - `metrics: SessionMetrics` from `lib/utils/workout-metrics`
  - `onBack: () => void`
- Usage: provide the metrics returned by `useWorkoutSessionData()` and wire `onBack` to router navigation.

### `HistoryExerciseGroup`
- Location: `components/workout/history-exercise-group.tsx`
- Responsibility: renders a collapsible card for an exercise with planned vs performed sets and accessibility keyboard handlers.
- Props:
  - `group: ExerciseGroup` from `lib/utils/exercise-groups`
  - `collapsed: boolean`
  - `onToggle: () => void`
- Usage: map over `exerciseGroups` from `useWorkoutSessionData()` and control collapse state with `useCollapseMap()`.

### `SetComparisonRow`
- Location: `components/workout/set-comparison-row.tsx`
- Responsibility: formats a single planned/performed set comparison including badges and responsive layout.
- Props:
  - `plannedSet: ExerciseGroup['plannedSets'][number]`
  - `performedSet?: SetLog`

## Hooks & Utilities

### `useWorkoutSessionData(sessionId)`
- Location: `hooks/use-workout-session-data.ts`
- Returns: `session`, `exerciseGroups`, `metrics`, plus loading and error state.
- Consolidates the query to `useSession`, builds `exerciseGroups`, and prepares formatted metrics.

### `useCollapseMap()`
- Location: `hooks/use-collapse-map.ts`
- Returns helpers `{ toggle, setCollapsed, isCollapsed, collapsed }` to manage keyed collapsible UIs.

### `workout-metrics.ts`
- Location: `lib/utils/workout-metrics.ts`
- Provides `buildSessionMetrics`, `calculateTotalVolume`, `getDayName`, and formatting helpers used across history views.

### `exercise-groups.ts`
- Location: `lib/utils/exercise-groups.ts`
- Provides `buildExerciseGroups()` which pairs planned sets with performed logs for rendering.

## Integration Checklist

1. Call `useWorkoutSessionData(sessionId)` in the page component.
2. Render `<HistorySessionHeader metrics={metrics} title={session?.routine?.name} onBack={...} />`.
3. Track collapsed state with `useCollapseMap()` and render `<HistoryExerciseGroup>` for each group.
4. Reuse `SetComparisonRow` when displaying planned vs performed sets elsewhere.

## Testing

- Existing Vitest suites cover the shared utilities.
- Add targeted tests when integrating into new screens to ensure layout assumptions hold.
