# Active Session RtF Support Improvements (2025-10-20)

## Summary
- **AMRAP detection (RtF-only)**: Only shows AMRAP on RtF exercises.
  - Standard: AMRAP set 5.
  - Hypertrophy: AMRAP set 4.
- **Deload-aware display**: RtF exercises trimmed to first 3 sets on deload weeks; AMRAP label hidden.
- **Week-specific targets**: Integrated RTF week goals to display planned weight and fixed reps for RtF sets in the active session page.
- **AMRAP target label**: AMRAP set rows display "Target: AMRAP".

## Files Updated
- `app/(protected)/workouts/sessions/[id]/page.tsx`
  - Fetches week goals via `useRtfWeekGoals(routineId, currentWeek)`.
  - Maps `workingWeightKg` and `fixedReps` to planned targets for RtF exercises.
  - Computes AMRAP set from goals and hides it during deload weeks.
  - Trims RtF sets to 3 on deload for grouping and progress.
- `hooks/use-session-management.ts`
  - Accepts `isDeloadWeek` to compute progress and completion against deload-trimmed RtF sets.
- `components/workout/exercise-group.tsx`
  - Passes `isAmrap` flag into set rows.
- `components/workout/set-log-input.tsx`
  - Shows `Target: AMRAP` for AMRAP rows; otherwise shows week goals or template targets.

## Behavior Notes
- **Deload weeks**: AMRAP is disabled (no label, no "Target: AMRAP").
- **Non-RtF exercises**: Never show AMRAP; use template planned targets.
- **Fallback**: If week goals are unavailable, the UI falls back to template targets.

## Next Steps (Optional)
- Display week-specific rep ranges or additional annotations if backend provides them.
- Add tests for AMRAP detection and deload trimming in active session UI.
