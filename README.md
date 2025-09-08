## Project structure
#### Review (RtF)

- The Review step includes a summary card “Program Settings (RtF)” showing:
  - Include deload weeks: Yes/No
  - Start date
  - Timezone
  - Start Program Week: `Week N of 18|21`


```
project-root/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout with providers
│   ├── (auth)/                    # Auth route group
│   │   ├── login/                 #   Login page
│   │   └── signup/                #   Registration page
│   └── (protected)/               # Protected routes
│       ├── dashboard/             #   Dashboard page
│       ├── routines/              #   Routines page
│       ├── workouts/              #   Workouts pages
│       │   ├── page.tsx           #     Index: redirects to active session or shows hub
│       │   ├── history/            #     Workout history page
│       │   └── sessions/[id]/     #     Active session page
│       └── layout.tsx             #   Protected routes layout
├── components/                    # Reusable UI components
│   ├── ui/                        #   Base UI components
│   └── routines/                  #   Routine management components
├── lib/                           # Application logic
│   ├── api/                       #   API integration with TanStack Query
│   │   ├── hooks/                 #     Domain hooks (auth, routines, user)
│   │   ├── services/              #     HTTP services (auth, user, routine)
│   │   └── types/                 #     API request/response types
│   └── utils/                     #   Utilities
├── providers/                     # Application providers
│   ├── app-provider.tsx           #   Combined providers wrapper
│   ├── query-provider.tsx         #   TanStack Query provider
│   ├── auth-provider.tsx          #   Auth context provider
│   └── theme-provider.tsx         #   next-themes ThemeProvider wrapper (attribute="class")
├── hooks/                         # Custom React hooks
├── utils/                         # General utility functions
├── types/                         # TypeScript type definitions
├── middleware.ts                  # Middleware for handling requests before reaching the route handlers
└── public/                        # Static assets
```

### Feature: Routine Favorites

- Routine cards in `app/(protected)/routines/components/WorkoutsList.tsx` include a Heart button to mark/unmark favorites.
- API: `PATCH /api/routines/:id/favorite` with body `{ isFavorite: boolean }`.
- Service: `lib/api/services/routineService.ts` method `toggleFavorite(id, isFavorite)`.
- Hook: `lib/api/hooks/useRoutines.ts` exports `useToggleRoutineFavorite()` with optimistic updates.

### Feature: Routine Completed + Filters

- Routine cards in `app/(protected)/routines/components/WorkoutsList.tsx` include a ListChecks button to mark/unmark completed.
- API:
  - `PATCH /api/routines/:id/completed` with body `{ isCompleted: boolean }`.
  - `GET /api/routines?isCompleted=true|false` and `?isFavorite=true|false` for filtering.
- Service: `lib/api/services/routineService.ts`
  - `toggleCompleted(id, isCompleted)`
  - `getUserRoutines({ isFavorite?, isCompleted? })` builds query string.
- Hooks: `lib/api/hooks/useRoutines.ts`
  - `useRoutines(filters?)` where filters is `{ isFavorite?, isCompleted? }` and part of the queryKey.
  - `useToggleRoutineCompleted()` with optimistic updates.
- UI Filters: `app/(protected)/routines/components/WorkoutFilters.tsx`
  - Tabs: All, Favorites, Completed. Page passes filters to hook from selection.

### Layout Components

- **Sidebar navigation**: Navegación lateral
- Nav items: Dashboard, Workouts, Routines. Future (disabled): Progress, Exercises, Schedule, Achievements.
- **Protected Header (dynamic title)**: `app/(protected)/layout.tsx` sets the header title based on the current route:
  - Dashboard, Workouts, Workout History, Active Session, Routines, New Routine, Edit Routine.

### Routine Creation/Edit Wizard

- Shared type: `components/routines/create/types.ts` exports `RoutineWizardData`, `RepType`, and `ProgressionScheme`.
- `RoutineWizardData` incluye `programScheduleMode?: 'TIMEFRAME' | 'NONE'` para elegir si el programa es por calendario o indefinido.
- Rep types per set:
  - `repType: 'FIXED' | 'RANGE'`
  - When `FIXED`: use `reps`.
  - When `RANGE`: use `minReps` and `maxReps`.
- Exercise progression schemes per exercise:
  - `progressionScheme: 'NONE' | 'DOUBLE_PROGRESSION' | 'DYNAMIC_DOUBLE_PROGRESSION' | 'PROGRAMMED_RTF'`
  - `minWeightIncrement`: number (default 2.5kg)
  - **NONE**: No progression applied (default option)
  - **DOUBLE_PROGRESSION**: Increases weight on all sets when all sets hit or exceed target reps
  - **DYNAMIC_DOUBLE_PROGRESSION**: Increases weight per individual set when that set hits or exceed target reps
  - **PROGRAMMED_RTF**: Date-driven, fixed program that schedules 4 fixed sets + 1 AMRAP per week. Requires routine-level program settings (see below) and per-exercise RtF fields (Training Max and Rounding).
  - **Note**: When progression is not NONE, all sets automatically use RANGE rep type (fixed reps are disabled)
  - **Weight Increment UI**: The "Weight Inc. (kg)" input only appears when progression is active (not `NONE`). On mobile, +/- buttons are hidden to prevent overflow; the input remains editable.
  - **Edit compatibility mapping**: When editing existing routines, legacy backend values are mapped for compatibility — `'DYNAMIC'` ➜ `'DOUBLE_PROGRESSION'`, `'DYNAMIC_DOUBLE'` ➜ `'DYNAMIC_DOUBLE_PROGRESSION'`. Missing/unknown values default to `'NONE'`.
- Wizard steps/components (all use the shared type):
  - `RoutineBasicInfo` → name/description + Program Schedule
    - Selector: `None (indefinite)` o `Timeframe (date-driven)`
    - Si se elige `Timeframe`, se muestra `Program start date` aquí mismo y la `programTimezone` se detecta automáticamente del navegador (IANA TZ).
  - `TrainingDays` → select `trainingDays`
  - `BuildDays` → manage `days[].exercises[].sets[]` with per-set `repType` and conditional inputs, plus progression settings
    - Cuando `programScheduleMode === 'NONE'`, las opciones de progresión con calendario (`PROGRAMMED_RTF` y `PROGRAMMED_RTF_HYPERTROPHY`) aparecen deshabilitadas y cualquier selección previa se normaliza a `NONE`.
    - Mobile layout: set rows stack vertically on small screens; header row hidden on mobile for space.
    - Mobile/Desktop UX improvements:
      - Refactor: `BuildDays` now composes `components/routines/create/ExerciseCard.tsx` (with internal `SetRow`). This modularization improves readability and maintainability.
      - Exercise header: exercise title is displayed above the timer/controls for clearer hierarchy.
      - Rep type and progression scheme now use the shadcn/ui Select component for consistent styling and proper dropdown alignment/behavior across devices.
      - Progression Select on mobile is width-constrained and the dropdown content is clamped to viewport to avoid overflow.
      - PROGRAMMED_RTF adds per-exercise inputs: `TM (kg)` and `Rounding (kg)` with options 0.5, 1.0, 2.5, 5.0.
      - TM (kg) validation UI: when RtF is selected and TM is missing/invalid, the TM input shows a red border and helper text. TM is clamped to 0–500 kg and rounded to 0.5 kg increments on change.
      - Stepper buttons (+/-) for reps and weight with clamping:
        - Fixed reps: 1..50
        - Range reps: min/max are individually stepped, clamped 1..50, and cross-clamped so min ≤ max
        - Weight: increments of 0.5, minimum 0
      - Range reps inputs use `type="text"` with `inputMode="numeric"` to allow smooth typing and full editability.
      - Exercise header (title area) is tappable on mobile to expand/collapse sets with proper `aria-expanded` and `aria-controls`. Keyboard accessible (Enter/Space).
      - Toggle buttons and controls include ARIA attributes for accessibility (`aria-pressed`, `aria-label`).
      - Exercise names are no longer over-truncated: full name shows with two lines on mobile and truncates elegantly on desktop.
      - Inputs now include placeholders (Reps, Min, Max, Weight) for better affordance when empty or focused.
      - Stepper icons are slightly smaller for better visual balance.
      - Desktop column alignment fixed: header columns (Set, Type, Reps, Weight) align with their corresponding inputs using a 12-col grid.
      - Animations added:
        - Exercise picker dropdown fades/zooms in.
        - Set list expands/collapses smoothly (height + opacity transition) when toggled.
        - Adding/removing sets animates in/out for clearer feedback.
    - Inputs: no forced leading zeros. Empty fields stay empty (not auto-filled with 0). Weight shows empty when undefined (no placeholder 0).
  - `ReviewAndCreate` → prepares payload mapping sets according to `repType` and creates/updates routine
  - When any exercise uses `PROGRAMMED_RTF` and `programScheduleMode === 'TIMEFRAME'`, includes routine-level fields in the payload: `programWithDeloads`, `programStartDate` (yyyy-mm-dd), and `programTimezone` (IANA TZ).
  - Create-only: `programStartWeek` is included when using `PROGRAMMED_RTF` (default 1; range 1..(18|21) depending on deloads).
  - Per-exercise fields for RtF (`programTMKg`, `programRoundingKg`) are included only for exercises with `PROGRAMMED_RTF`.
  - Safety net: if RtF is used and `programTimezone` is missing, the payload falls back to the browser IANA timezone during submission.

#### RtF Program Settings (TrainingDays)

- When any exercise is set to `PROGRAMMED_RTF`, the `TrainingDays` step shows a settings panel to configure:
  - `Include deload weeks` (boolean)
  - `Start program at week` (create-only)
    - Default: 1
    - Range: 1..(18|21) depending on `Include deload weeks`
    - If deloads are toggled off and the selected start week is > 18, the UI clamps it to 18
- `Program start date` se configura en `RoutineBasicInfo`. A hint warns when the selected start date weekday does not match the first selected training day.
- Pages:
  - New: `app/(protected)/routines/new/page.tsx`
  - Edit: `app/(protected)/routines/edit/[id]/page.tsx` (maps backend routine to `RoutineWizardData` including `repType/minReps/maxReps`). The Stepper is now sticky at the top like in the create page.

Notes:

- The backend persists `programStartWeek` and returns it in routine responses. The UI uses this field only during creation (create-only UX), but it may be displayed read-only in details in the future.

### Services

- The canonical routines client is `lib/api/services/routineService.ts`.
- Any previous `routinesService.ts` has been removed; use `routineService.ts` for all routines API calls.

### Utilities

- `lib/utils/reps-to-failure.ts`
  - `generateRepsToFailureProgram(config, performance)`
    - Strength variant: 5 sets (4 + 1 AMRAP).
    - Deloads at 60% with goal `3x5 @ RPE 6` (no AMRAP target).
  - `generateRepsToFailureHypertrophyProgram(config, performance)`
    - Hypertrophy variant: 4 sets (3 + 1 AMRAP), uses weekly goals in `weeklyGoalDataHypertrophy`.
    - Deloads at 60% with goal `4x5` and “no rep targets”.
  - TM adjustment rules based on last set AMRAP vs target:
    - 2+ reps below target: −5.00%
    - 1 rep below target: −2.00%
    - Exactly on target: 0.00%
    - +1 rep: +0.50%
    - +2 reps: +1.00%
    - +3 reps: +1.50%
    - +4 reps: +2.00%
    - +5+ reps: +3.00%

### Feature: Workout Sessions

- Start a workout session from routine cards in `app/(protected)/routines/components/WorkoutsList.tsx`.
  - Quick Start button starts with the first routine day.
  - Dropdown allows selecting a specific day to start.
- API Endpoints used:
  - `POST /api/workouts/sessions/start`
  - `GET /api/workouts/sessions/active`
  - `GET /api/workouts/sessions/:id`
  - `GET /api/workouts/sessions` (history list with filters & pagination)
  - `PATCH /api/workouts/sessions/:id/finish`
  - `PUT /api/workouts/sessions/:id/set-logs`
  - `DELETE /api/workouts/sessions/:id/set-logs/:routineExerciseId/:setNumber` (existe pero la UI no permite eliminar sets durante la sesión)
- Service: `lib/api/services/workoutService.ts`
  - `startSession({ routineId, routineDayId, notes? })`
  - `getActiveSession()`
  - `getSessionById(id)`
  - `listSessions({ status?, routineId?, from?, to?, q?, cursor?, limit?, sort? })`
  - `finishSession(id, { status, notes? })`
  - `upsertSetLog(id, { routineExerciseId, exerciseId, setNumber, reps, weight?, rpe?, isCompleted? })`
  - `deleteSetLog(id, routineExerciseId, setNumber)`
- Hooks: `lib/api/hooks/useWorkoutSession.ts`
  - `useStartSession()`
  - `useActiveSession()`
  - `useSession(id)`
  - `useSessions(params)` — `useInfiniteQuery` for paginated history listing; accepts filters `{ status?, routineId?, from?, to?, q?, sort? }` and `limit`.
  - `useFinishSession(id)`
  - `useUpsertSetLog(id)`
- Active Session Page: `app/(protected)/workouts/sessions/[id]/page.tsx`

  - Mobile-first; shows status and basic controls to finish or abort.
  - Set Logs are rendered from the Routine template (exercises and their predefined sets, in order). Users do not add/remove sets during a session.
  - Each set shows planned values from the template:
    - Planned reps: read-only (non-editable). For ranged sets, the range is reflected in the template; user logs actual reps.
    - Planned weight: shown as hint; weight input is editable.
    - Performed reps: separate editable input to record actual reps.
    - RPE: not editable for now (hidden in UI).
  - Autosave on input blur and on completion toggle (uses next state). A Save button is also available.
  - Uses `useUpsertSetLog(id)` and invalidates the session query after mutations.
  - Resume banner available in protected layout: `app/(protected)/layout.tsx`.

- Workouts Index Page: `app/(protected)/workouts/page.tsx`
  - If an active session exists, redirects to `/workouts/sessions/[id]`.
  - Otherwise, shows a simple hub with CTAs to go to Routines (to start a workout), View History, or Dashboard.

### Workout History Page

- Page: `app/(protected)/workouts/history/page.tsx`
- Features:
  - Filters: Status, Routine, From/To date, text search on notes, Sort (finished/started asc/desc)
  - Query params (backend DTO):
    - `status`: `IN_PROGRESS | COMPLETED | ABORTED`
    - `routineId?`: UUID
    - `from?`, `to?`: `YYYY-MM-DD`
    - `q?`: string (busca en notas)
    - `sort?`: `'finishedAt:desc' | 'finishedAt:asc' | 'startedAt:desc' | 'startedAt:asc'`
    - `cursor?`: UUID (paginación por cursor)
    - `limit?`: number (1..50)
  - Pagination: Infinite scroll con IntersectionObserver y fallback de "Load more"
  - Uses `useSessions` con `workoutService.listSessions`
  - Mobile-first, accessible controls, TailwindCSS utility classes

### Routine Details

- Page: `app/(protected)/routines/[id]/page.tsx`
- Start controls:
  - Quick Start prefers today's day if available; otherwise uses the first routine day.
  - Each day section includes its own Start button (inside the day panel).
  - Weekday mismatch confirmation: if you start a day different from today, a dialog warns you and lets you proceed or cancel.
  - Active session conflict handling: if there’s an in-progress session for another day, a dialog prompts you to resume the active session instead of starting a new one.
  - Program gating: when `programEndDate` has passed (RtF program completed), Start controls are disabled and a "Program ended" badge is shown.
- Routine structure display:
  - Collapsible days using shadcn/Radix Accordion. Today's day is expanded by default and shows a "Today" badge.
  - Accordion animation: content uses CSS `grid-template-rows` (0fr→1fr) + fade with `duration-300 ease-in-out` (see `components/ui/accordion.tsx`).
  - Day header: weekday badge + day order + exercises count. Reduced redundancy from previous design (no separate day pill buttons at the top).
  - Exercises per day: shows exercise name and rest seconds.
  - Sets per exercise: lists set number and formatted reps (FIXED: `reps`; RANGE: `min-max`) with optional weight hints.
- Loading & error states: skeletons during load, friendly error messages on failure.
- Navigation: from routines list dropdown, select "Open" to navigate to details page.

### Dashboard — Today’s Workouts

- Component: `app/(protected)/dashboard/components/TodaysWorkouts.tsx`
- Behavior:
  - Fetches routines and filters the ones scheduled for today’s weekday.
  - Displays loading skeletons, error state, or empty state with CTA to browse routines.
  - Provides Start/Resume controls:
    - Resume when an active session matches today’s routine day.
    - Start when no matching active session exists.
  - Details button navigates to `app/(protected)/routines/[id]/page.tsx`.
  - Active session conflict dialog: if trying to start a different day from the active session’s day, shows a modal to resume the active session.
  - Mobile UI:
    - Cards only show the routine name and weekday badge (description is hidden to avoid clipping).
    - Actions are displayed as a two-column grid of full-width buttons (Start/Resume and Details) to prevent text overlap/truncation.
    - On larger screens, actions align inline to the right as before.
- Hooks & utilities: `useRoutines`, `useActiveSession`, `useStartSession`, `getTodayDow()`, `weekdayName()`.

### UI/UX Enhancements

- **Skeleton Loaders**
  - Reusable `Skeleton` component at `components/ui/skeleton.tsx`.
  - Used in:
    - `app/(protected)/workouts/sessions/[id]/page.tsx` (active session loading)
    - `app/(protected)/routines/components/WorkoutsList.tsx` (list loading)
    - `app/(protected)/layout.tsx` (protected layout global loading)
    - `app/(protected)/routines/[id]/page.tsx` (routine details loading)
- **Progress Bars**
  - `components/ui/progress.tsx` displays:
    - Session progress (completed sets vs total) in the Active Session page.
    - Simple completion indicator in routine cards within WorkoutsList.
- **Button Press Feedback**
  - Subtle micro-interactions on `components/ui/button.tsx` using GPU transforms with active scale/translate for a haptic feel.
- **Sticky Navigation (Routine Wizard)**
  - `app/(protected)/routines/new/page.tsx`:
    - Stepper is sticky at the top for quick step switching.
    - Bottom navigation (Previous/Next) is sticky at the bottom for better mobile reachability.
    - Added container bottom padding to ensure content never hides behind the sticky bar.
  
- **BuildDays Tabs (UX Fixes)**
  - `components/routines/create/BuildDays.tsx`:
    - The exercise count badge per day is always visible and shows 0 for empty days.
    - Horizontal-only scrolling in the days row (no vertical scroll) with `overflow-y-hidden` and `whitespace-nowrap`.
    - Normalized badge sizing to prevent layout jump and accidental vertical scrollbar.

- **ExerciseCard Expand/Collapse (Smoother)**
  - `components/routines/create/ExerciseCard.tsx`:
    - Simplified mobile-like animation using `max-height` + `opacity` with 300ms ease-in-out.
    - Padding moved to inner wrapper to prevent layout jump during the transition.
    - Rotación del ícono `ChevronsUpDown` suavizada (300ms, ease-in-out).

- **Theme Toggle (Dark/Light/System)**
  - `ThemeProvider` global en `app/layout.tsx` usando `next-themes` con `attribute="class"`, `defaultTheme="system"` y `enableSystem`.
  - `ModeToggle` agregado en:
    - Header de rutas protegidas: `app/(protected)/components/Header.tsx`.
    - Layout de auth: `app/(auth)/layout.tsx` (esquina superior derecha).
  - Transición suave de colores: `body` aplica `transition-colors duration-300` en `app/globals.css`.
  - Dependencia: `next-themes` agregada a `package.json`.

- **Stepper Advanced Navigation (Edit Mode)**
  - `components/ui/stepper.tsx` supports:
    - `completedSteps?: Set<number>` to drive completed state by data validity.
    - `canStepClick?: (stepId: number) => boolean` to unlock direct navigation.
  - `app/(protected)/routines/edit/[id]/page.tsx`:
    - Users can jump directly to any step when all previous steps are valid (based on current form data), avoiding forced sequential navigation.
    - Create flow remains sequential; edit flow is flexible.

### Testing (Frontend)

- **Stack**: Vitest + Testing Library (React) sobre `jsdom`
- **Framework**: Vitest para test runner, React Testing Library para component testing
- **Coverage**: @vitest/coverage-v8 para reportes de cobertura
- **Mocking**: vi (Vitest) para mocks y stubs

#### Test Configuration

- `vitest.config.ts`: Configuración principal
  - `test.environment = 'jsdom'` para DOM testing
  - `test.globals = true` para funciones globales
  - `resolve.alias` mapea `@` a la raíz del proyecto
- `test/setup.ts`: Setup global con jest-dom matchers
  - Mock de `Element.prototype.scrollIntoView` (no-op) para evitar errores de Radix UI Select en jsdom
- `test/utils.tsx`: Utilidades de test incluye `createQueryWrapper(client?)`

#### Test Coverage

Current test modules:
- **Auth Components**: Login page, auth hooks (useLogin, useRegister, useLogout)
- **Routine Components**: WorkoutsList component and routine hooks
- **Workout Sessions**: Active session pages, session management
- **UI Components**: Button and base component testing
- **Utilities**: Time helpers and common functions

#### Running Tests

```bash
# run all tests
npm run test

# run tests in watch mode
npm run test:watch

# run tests with coverage
npm run test:coverage
```

#### Test Maintenance Guidelines

⚠️ **Important**: When making code changes, always:

1. **Update existing tests** if component interfaces or behavior changes
2. **Add new tests** for new features, components, or bug fixes
3. **Mock external dependencies** appropriately for unit tests
4. **Use `createQueryWrapper`** for components that use React Query
5. **Test user interactions** with fireEvent or userEvent
6. **Verify accessibility** attributes in component tests
7. **Run tests locally** before committing to catch issues early

#### Writing New Tests

- Use **Vitest syntax** (`vi.mock`, `describe`, `it`, `expect`)
- Import from **`@testing-library/react`** for component testing
- Use **`createQueryWrapper`** for components needing React Query
- Follow **AAA pattern**: Arrange, Act, Assert
- Test **behavior, not implementation** details for `app/(protected)/workouts/sessions/[id]/page.tsx`.

Commands:

```bash
npm run test         # Run tests once
npm run test:watch   # Watch mode
npm run test:coverage# Coverage (text + lcov)
```

### Continuous Integration (CI)

- Workflow: `.github/workflows/ci.yml`
- Triggers: on push (main/master/develop) and all PRs
- Steps:
  - `npm ci`
  - `npm run test:coverage` (Vitest + Coverage V8)
  - Uploads coverage artifact (`coverage/`)
