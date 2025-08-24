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
│       ├── workouts/              #   Workouts session pages
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
  - `PATCH /api/workouts/sessions/:id/finish`
  - `PUT /api/workouts/sessions/:id/set-logs`
  - `DELETE /api/workouts/sessions/:id/set-logs/:routineExerciseId/:setNumber`
- Service: `lib/api/services/workoutService.ts`
  - `startSession({ routineId, routineDayId, notes? })`
  - `getActiveSession()`
  - `getSessionById(id)`
  - `finishSession(id, { status, notes? })`
  - `upsertSetLog(id, { routineExerciseId, exerciseId, setNumber, reps, weight?, rpe?, isCompleted? })`
  - `deleteSetLog(id, routineExerciseId, setNumber)`
- Hooks: `lib/api/hooks/useWorkoutSession.ts`
  - `useStartSession()`
  - `useActiveSession()`
  - `useSession(id)`
  - `useFinishSession(id)`
  - `useUpsertSetLog(id)`
  - `useDeleteSetLog(id)` with optimistic updates and cache rollback on error
- Active Session Page: `app/(protected)/workouts/sessions/[id]/page.tsx`
  - Mobile-first; shows status and basic controls to finish or abort.
  - Set Logs editor grouped by exercise name (when routine metadata is available via `useRoutine`).
  - Per-set autosave: saves on input blur (reps/weight/RPE) and when toggling completion. Toggle autosave now uses the next completion state to avoid a stale state bug. Save button remains available.
  - Quick add: "+ Set" button on each exercise group creates the next set via `useUpsertSetLog(id)`.
  - Uses `useUpsertSetLog(id)` and invalidates the session query after mutations.
  - Remove control per set: "Remove" button calls `useDeleteSetLog(id)`; disabled with spinner while pending; screen-reader labels provided.
  - Resume banner available in protected layout: `app/(protected)/layout.tsx`.

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
