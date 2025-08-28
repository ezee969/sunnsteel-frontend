## Project structure

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
│   └── auth-provider.tsx          #   Auth context provider
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

### Routine Creation/Edit Wizard

- Shared type: `components/routines/create/types.ts` exports `RoutineWizardData` and `RepType`.
- Rep types per set:
  - `repType: 'FIXED' | 'RANGE'`
  - When `FIXED`: use `reps`.
  - When `RANGE`: use `minReps` and `maxReps`.
- Wizard steps/components (all use the shared type):
  - `RoutineBasicInfo` → name/description
  - `TrainingDays` → select `trainingDays`
  - `BuildDays` → manage `days[].exercises[].sets[]` with per-set `repType` and conditional inputs
    - Mobile layout: set rows stack vertically on small screens; header row hidden on mobile for space.
    - Mobile/Desktop UX improvements:
      - Refactor: `BuildDays` now composes `components/routines/create/ExerciseCard.tsx` (with internal `SetRow`). This modularization improves readability and maintainability.
      - Exercise header: exercise title is displayed above the timer/controls for clearer hierarchy.
      - Rep type uses a native select dropdown (Fixed/Range) for simpler interaction and accessibility.
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
- Pages:
  - New: `app/(protected)/routines/new/page.tsx`
  - Edit: `app/(protected)/routines/edit/[id]/page.tsx` (maps backend routine to `RoutineWizardData` including `repType/minReps/maxReps`)

### Services

- The canonical routines client is `lib/api/services/routineService.ts`.
- Any previous `routinesService.ts` has been removed; use `routineService.ts` for all routines API calls.

### Feature: Workout Sessions

- Start a workout session from routine cards in `app/(protected)/routines/components/WorkoutsList.tsx`.
  - Quick Start button starts with the first routine day.
  - Dropdown allows selecting a specific day to start.
- API Endpoints used:
  - `POST /api/workouts/sessions/start`
  - `GET  /api/workouts/sessions/active`
  - `GET  /api/workouts/sessions/:id`
  - `GET  /api/workouts/sessions` (history list with filters & pagination)
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
  - Quick Start with first routine day.
  - Day buttons to start with a specific routine day.
  - From routines list dropdown, use "Open" to navigate to details page.

### Testing

- Stack: Vitest + Testing Library (React) with jsdom.
- Config: `vitest.config.ts` sets jsdom, globals, coverage (v8), alias `@` to project root.
- Setup: `test/setup.ts` extends Jest-DOM matchers.
- Utilities: `test/utils.tsx` exports `render` helper.
- Examples:
  - Unit: `test/lib/utils/time.test.ts` covers `lib/utils/time.ts` helpers.
  - UI: `test/components/ui/button.test.tsx` renders `components/ui/button.tsx`.
  - Page: `test/app/protected/workouts/sessions/active-session-page.test.tsx` covers finish/abort navigation and set log autosave/remove interactions for `app/(protected)/workouts/sessions/[id]/page.tsx`.

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
