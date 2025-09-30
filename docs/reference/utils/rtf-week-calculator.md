# rtf-week-calculator

Utility helpers to support Reps-to-Failure (RtF) programs in the frontend. These functions derive the current program week, detect deload weeks, and expose the active RtF variant for display logic in components like `ExerciseCard` and `RoutineDayAccordion`.

## Overview

- Drives week-aware UI: current week badge, deload indicator, and intensity context.
- Keeps UI logic simple by centralizing week/variant calculations.
- Safe defaults when routine data is incomplete to prevent UI crashes.

## Quick Start

```ts
import {
  getCurrentProgramWeek,
  isDeloadWeek,
  getRtfVariant,
  isRtfProgressionScheme,
} from "lib/utils/rtf-week-calculator";

const week = getCurrentProgramWeek(routine); // integer >= 1
const deload = isDeloadWeek(week, routine); // boolean
const variant = getRtfVariant(routine); // "STANDARD" | "HYPERTROPHY"
const isRtf = isRtfProgressionScheme(routine); // boolean
```

## Functions

### getCurrentProgramWeek(routine, date?) => number
- Returns the active program week number based on routine metadata.
- Inputs:
  - `routine`: routine object containing program start info.
  - `date?`: optional Date to compute against; defaults to `new Date()`.
- Behavior:
  - Uses `routine.programStartWeek` or start date metadata if available.
  - Clamps to `>= 1` and always returns an integer.
  - Stable across timezones; if start date is missing, returns `1`.

### isDeloadWeek(week, routine) => boolean
- Returns `true` if the provided week is configured as a deload for the routine.
- Inputs:
  - `week`: number returned by `getCurrentProgramWeek`.
  - `routine`: routine object containing deload configuration (e.g., `deloadWeeks: number[]`).
- Behavior:
  - Checks known deload slots in the program.
  - Defaults to `false` when configuration is missing.

### getRtfVariant(routine) => "STANDARD" | "HYPERTROPHY"
- Reports the active RtF variant for a routine.
- Inputs:
  - `routine`: routine object with variant/program style metadata.
- Behavior:
  - Derives from program style/variant fields.
  - Defaults to `"STANDARD"` if not set.

### isRtfProgressionScheme(routine) => boolean
- Indicates whether the routine uses an RtF progression scheme.
- Inputs:
  - `routine`: routine object with progression metadata.
- Behavior:
  - Returns `true` if program style/flags indicate RtF.
  - Safely returns `false` on missing metadata.

## Component Usage

### ExerciseCard badges
```tsx
const week = getCurrentProgramWeek(routine);
const deload = isDeloadWeek(week, routine);
const variant = getRtfVariant(routine);

<ExerciseCard
  exercise={exercise}
  routine={routine}
  // UI derives badges from the above values
/>
```

### RoutineDayAccordion integration
```tsx
const todayWeek = getCurrentProgramWeek(routine);
const isDeload = isDeloadWeek(todayWeek, routine);
// Use these values to adjust accordion labels or tooltips if needed
```

## Notes & Edge Cases
- Missing start metadata: `getCurrentProgramWeek` returns `1`.
- Unknown variant: falls back to `"STANDARD"`.
- No deload configuration: `isDeloadWeek` returns `false`.
- All functions are pure and side-effect free; they do not perform network calls.

## Related Docs
- Components: [ExerciseCard RtF UI](../components/features/README.md)
- Hooks: [useRtFWeekGoals](../hooks/README.md)
- Roadmap: [RTF Enhancements](../roadmaps/RTF_ENHANCEMENTS.md)
- Architecture: [Frontend Architecture](../architecture/README.md)