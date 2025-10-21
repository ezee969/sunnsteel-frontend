# Active Session RtF UI: Fixed Sets + AMRAP-only Reps (2025-10-21)

## Summary
- **RtF Non-AMRAP sets are read-only**: Reps and weight are fixed by program and not editable.
- **RtF AMRAP set**: Only the reps field is editable; weight remains fixed.
- **Deload weeks**: Show only the first 3 sets for RtF exercises, all read-only; no AMRAP.
- **Week-specific targets**: Fixed values use week goals (`workingWeightKg`, `fixedReps`) when available.

## Files Updated
- `app/(protected)/workouts/sessions/[id]/page.tsx`
  - Injects week goals and determines AMRAP set index.
  - Forces set `weight` and `plannedWeight` to `workingWeightKg` for RtF.
  - Passes `isRtF` to downstream component.
- `components/workout/exercise-group.tsx`
  - Computes per-set disable flags for reps and weight inputs.
  - Disables reps for all non-AMRAP RtF sets (and all sets on deload).
  - Disables weight for all RtF sets.
- `components/workout/set-log-input.tsx`
  - Supports `disableRepsInput` and `disableWeightInput` props.
  - Renders static read-only text when disabled ("Fixed by program").

## Behavior Notes
- **Standard RtF**: 4 fixed sets + 1 AMRAP (reps editable only).
- **Hypertrophy RtF**: 3 fixed sets + 1 AMRAP (reps editable only).
- **Deload**: 3 fixed sets only, no AMRAP.
- **Non-RtF**: Unchanged.

## Tests
- Full suite passes with updated mocks for RtF goals in session page tests.
