# Routine Wizard Schedule Reference

## Overview

This document centralizes the scheduling-related building blocks that power the routine wizard. It covers shared hooks, UI components, utilities, and accompanying tests that were introduced during the schedule refactor.

## Source Files

- `features/routines/wizard/hooks/useRoutineMetadataForm.ts`
- `features/routines/wizard/hooks/useProgramSchedule.ts`
- `features/routines/wizard/components/ProgramScheduleSelector.tsx`
- `features/routines/wizard/components/ProgramStartDatePicker.tsx`
- `features/routines/wizard/utils/date.ts`
- `test/features/routines/wizard/hooks/use-program-schedule.test.tsx`
- `test/features/routines/wizard/components/ProgramStartDatePicker.test.tsx`

## Hooks

### `useRoutineMetadataForm`

Encapsulates state bindings for the Routine Basic Info step.
- **Primary responsibilities**: manage controlled inputs for `name` and `description` while delegating persistence to the wizard via `onUpdate`.
- **Usage**: `RoutineBasicInfo` imports the hook to obtain setters and current values, reducing inline handlers.
- **Extensibility tips**: If future fields (e.g., tags) are introduced, add them here to keep Basic Info declarative.

### `useProgramSchedule`

Provides schedule-specific logic including timezone detection, calendar dialog state, date parsing/formatting, and mode transitions.
- **Key capabilities**:
  - Detect browser timezone when `programScheduleMode === 'TIMEFRAME'` and `programTimezone` is missing.
  - Normalize schedule mode transitions (clearing start date when switching to `NONE`).
  - Wrap calendar selection and manual input changes (`handleDateSelect`, `handleDateInputChange`).
- **Consumers**: `RoutineBasicInfo` and any future schedule-aware steps.
- **Testing**: Covered by `use-program-schedule.test.tsx`.

## Components

### `ProgramScheduleSelector`

Shadcn Select wrapper that renders schedule choices (`NONE`, `TIMEFRAME`) with tooltip guidance.
- Accepts current mode, change handler, and optional custom tooltip content.
- Lives in `features/routines/wizard/components/` for reuse across steps.

### `ProgramStartDatePicker`

Date picker composed of Shadcn Popover + Radix Calendar, including hidden `<input type="date">` for accessibility/testing.
- Props allow explicit control over open state, selected date, and change handlers.
- Guarded to return `null` when `mode !== 'TIMEFRAME'`.
- `isPastDate` utility enforces minimum of today.
- Tested via `ProgramStartDatePicker.test.tsx`.

## Utilities (`features/routines/wizard/utils/date.ts`)

- `parseWizardDate(value)` – safe `yyyy-MM-dd` parser returning `Date | undefined`.
- `formatWizardDate(date)` – formats `Date` to `yyyy-MM-dd` for payloads.
- `formatDateForDisplay(value)` – returns `dd/MM/yyyy` or fallback (`'—'`).
- `isPastDate(date)` – helper used by the date picker to disable past selections.
- `parseDateInput(value)` – gracefully handles empty input when user clears `<input type="date">`.

## Integration Notes

1. **RoutineBasicInfo**
   - Imports both hooks and both components.
   - Delegates all calendar operations to `useProgramSchedule`.
   - Maintains declarative JSX – no inline schedule logic remains.

2. **ReviewAndCreate**
   - Uses `formatDateForDisplay` to present start date in the review summary.

3. **BuildDays**
   - `useRoutineDayMutations` now respects `programScheduleMode` to invalidate RtF schemes when mode is set to `NONE` (documented here for schedule awareness).

## Testing Coverage

- `use-program-schedule.test.tsx`
  - Verifies timezone auto-detection, mode transitions, and handler behavior.
- `ProgramStartDatePicker.test.tsx`
  - Ensures conditional rendering, formatted label output, and handler wiring.

## Future Enhancements

- Add docs for potential server actions that may consume `programStartDate`/`programTimezone` when routines are created from the wizard.
- Consider adding visual examples (screenshots or storybook links) once the design reference is formalized.
- Track additional schedule modes (e.g., periodic rest days) here if introduced.
