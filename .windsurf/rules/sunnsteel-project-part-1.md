---
trigger: always_on
---

---

## alwaysApply: true

# Sunnsteel Frontend - Fitness Application

Este es el proyecto frontend para Sunnsteel, una aplicación de fitness y entrenamiento.

## Stack Tecnológico

- **Framework**: Next.js 15.2.1 (App Router) con TypeScript
- **UI Library**: React 19 con TailwindCSS v4
- **Componentes**: Shadcn/ui con Radix UI primitives
- **Estado**: TanStack Query (React Query) para server state
- **Formularios**: React Hook Form con Zod validation
- **Iconos**: Lucide React
- **Fuentes**: Geist Sans y Geist Mono
- **Autenticación**: JWT con refresh tokens

## Estructura del Proyecto

### App Router Structure

- **`app/(auth)/`**: Páginas de autenticación (login, signup)
- **`app/(protected)/`**: Páginas protegidas (dashboard, routines)
- **`app/layout.tsx`**: Layout principal con providers
- **`app/page.tsx`**: Página de inicio

### Páginas Disponibles

- **`app/(auth)/login/page.tsx`**: Página de inicio de sesión
- **`app/(auth)/signup/page.tsx`**: Página de registro
- **`app/(protected)/dashboard/page.tsx`**: Dashboard principal con widget dinámico "Today's Workouts" que lista rutinas del día actual y permite iniciar/reanudar sesiones o ver detalles.
- **`app/(protected)/routines/page.tsx`**: Gestión de rutinas
- Heart toggle en tarjetas de rutinas para favoritos
- ListChecks toggle para marcar rutinas como completadas
- **`app/(protected)/routines/[id]/page.tsx`**: Detalle de rutina con controles para iniciar sesión por día o Quick Start
- **`app/(protected)/routines/new/page.tsx`**: Creación de rutina (wizard)
- **`app/(protected)/routines/edit/[id]/page.tsx`**: Edición de rutina (wizard con mapeo desde backend a estado local)
- **`app/(protected)/workouts/page.tsx`**: Índice de entrenamientos. Si existe sesión activa redirige a `/workouts/sessions/[id]`; de lo contrario, muestra un hub con CTAs para ir a Rutinas o al Dashboard.
- **`app/(protected)/workouts/sessions/[id]/page.tsx`**: Sesión activa de entrenamiento (mobile-first)
- **`app/(protected)/workouts/history/page.tsx`**: Historial de sesiones con filtros e infinite scroll
- **`app/page.tsx`**: Página de inicio pública

### Directorios Principales

- **`components/`**: Componentes reutilizables
  - `ui/`: Componentes base de Shadcn/ui (12 componentes disponibles)
  - `layout/`: Componentes de layout
- **`providers/`**: Context providers (Auth, App, Query)
- **`hooks/`**: Custom hooks (useAuthProtection, useSidebar)
- **`lib/`**: Utilidades y servicios
  - `api/`: Servicios de API y hooks (9 servicios disponibles)
    - `workoutService.ts`:
      - `startSession({ routineId, routineDayId, notes? })`
      - `getActiveSession()`
      - `getSessionById(id)`
      - `finishSession(id, { status, notes? })`
      - `upsertSetLog(id, { routineExerciseId, exerciseId, setNumber, reps, weight?, rpe?, isCompleted? })`
      - `deleteSetLog(id, routineExerciseId, setNumber)`
    - `utils.ts`: Utilidades generales
  - `utils/reps-to-failure.ts`: Utilidades de programación RtF
    - `generateRepsToFailureProgram(config, performance)`: variante de fuerza (5 sets: 4 + 1 AMRAP). Deloads al 60% con `3x5 @ RPE 6`.
    - `generateRepsToFailureHypertrophyProgram(config, performance)`: variante de hipertrofia (4 sets: 3 + 1 AMRAP). Deloads al 60% con `4x5` y “no rep targets”.
    - Reglas de ajuste de TM por desempeño en última serie AMRAP: −5% (−2+ reps), −2% (−1), 0% (objetivo), +0.5% (+1), +1% (+2), +1.5% (+3), +2% (+4), +3% (+5+).
- **`schema/`**: Esquemas de validación Zod (loginSchema, signupSchema)

### Routine Creation/Edit Wizard

- Tipo compartido: `components/routines/create/types.ts` exporta `RoutineWizardData` y `RepType`.
- Repeticiones por set:
  - `repType`: `'FIXED' | 'RANGE'`
  - `FIXED` → usar `reps`.
  - `RANGE` → usar `minReps` y `maxReps`.
- Componentes del wizard (todos usan el tipo compartido):
  - `RoutineBasicInfo` → nombre/descripción
  - `TrainingDays` → selección de `trainingDays`
  - `BuildDays` → gestionar `days[].exercises[].sets[]` con `repType` por set e inputs condicionales, y progresión por ejercicio
  - `ReviewAndCreate` → prepara payload según `repType` y crea/actualiza la rutina
- Páginas:
  - Nueva: `app/(protected)/routines/new/page.tsx`
  - Edición: `app/(protected)/routines/edit/[id]/page.tsx` (mapea rutina del backend a `RoutineWizardData`, incluyendo `repType/minReps/maxReps`)
  - Compatibilidad (Edit): Valores legados de backend para `progressionScheme` se mapean automáticamente — `'DYNAMIC'` → `'DOUBLE_PROGRESSION'`, `'DYNAMIC_DOUBLE'` → `'DYNAMIC_DOUBLE_PROGRESSION'`. Valores faltantes o desconocidos se normalizan a `'NONE'`.

#### PROGRAMMED_RTF (RtF) — Integración Frontend

- `progressionScheme` ahora incluye: `'NONE' | 'DOUBLE_PROGRESSION' | 'DYNAMIC_DOUBLE_PROGRESSION' | 'PROGRAMMED_RTF'`.
- En `BuildDays` cuando se selecciona `PROGRAMMED_RTF`:
  - Se muestran campos por ejercicio:
    - `programTMKg` (Training Max en kg)
    - `programRoundingKg` (0.5 | 1.0 | 2.5 | 5.0)
  - Si `scheme !== 'NONE'`, los sets se convierten automáticamente a `RANGE` (si eran `FIXED`) con `min=max=reps` como fallback, y se limpian `reps`.
  - Se inicializa `programRoundingKg` a 2.5 si no estaba definido.
- En `TrainingDays` se muestra un panel de configuración del programa RtF cuando cualquier ejercicio usa RtF:
  - `programWithDeloads` (boolean)
  - `programStartDate` (YYYY-MM-DD)
  - `programTimezone` (IANA TZ)
  - `programStartWeek` (solo creación): Default 1; rango 1..(18|21) según deloads. Si se apagan deloads y el valor supera 18, se clampa a 18.
  - Aviso si el día de `programStartDate` no coincide con el primer día seleccionado en `trainingDays`.
- Navegación/gating:
  - Para avanzar de "Build Days" a "Review", si existe RtF se requiere `programStartDate`.
- En `ReviewAndCreate` el payload incluye:
  - Campos de rutina (solo si hay RtF): `programWithDeloads`, `programStartDate`, `programTimezone`.
  - En creación, además `programStartWeek`.
  - Por ejercicio (solo para RtF): `programTMKg`, `programRoundingKg`.

Notas:

- El backend persiste `programStartWeek` y lo retorna en las respuestas de rutina. La UI lo usa solo en la creación (create-only), y podría mostrarse de forma read-only en detalles más adelante.

### Middleware

- **`middleware.ts`**: Protección de rutas y redirecciones
- Rutas protegidas: `/dashboard`, `/workouts`, `/profile`, `/settings`
- Rutas de auth: `/login`, `/signup`

## Patrones de Desarrollo

### Autenticación

- **AuthProvider**: Context para estado de autenticación
- **useAuth**: Hook para acceder al estado de auth
- **useAuthProtection**: Hook para proteger rutas
- **useSidebar**: Hook para manejo de sidebar
- **Token Management**: Access tokens en localStorage, refresh tokens en cookies
- **Auto-refresh**: Renovación automática de tokens

### API Integration

- **httpClient**: Cliente HTTP centralizado con interceptors
- **Services**:
  - `authService.ts`: Servicios de autenticación
  - `userService.ts`: Servicios de usuario
  - `tokenService.ts`: Servicios de tokens
  - `routineService.ts`:
    - `toggleFavorite(id, isFavorite)`
    - `toggleCompleted(id, isCompleted)`
    - `getUserRoutines({ isFavorite?, isCompleted? })` soporta filtros vía querystring
  - `workoutService.ts`:
    - `startSession({ routineId, routineDayId, notes? })`
    - `getActiveSession()`
    - `getSessionById(id)`
    - `listSessions({ status?, routineId?, from?, to?, q?, cursor?, limit?, sort? })`
    - `finishSession(id, { status, notes? })`
    - `upsertSetLog(id, { routineExerciseId, exerciseId, setNumber, reps, weight?, rpe?, isCompleted? })`
    - `deleteSetLog(id, routineExerciseId, setNumber)`
- **API Hooks**:
  - `useRegister.ts`, `useLogin.ts`, `useLogout.ts`
  - `useUser.ts`, `useRefreshToken.ts`
  - `useRoutines.ts`:
    - `useRoutines(filters?)` donde `filters` = `{ isFavorite?, isCompleted? }` y forma parte del `queryKey`
    - `useToggleRoutineFavorite()` con optimistic updates
    - `useToggleRoutineCompleted()` con optimistic updates
  - `useWorkoutSession.ts`:
    - `useStartSession()`
    - `useActiveSession()`
    - `useSession(id)`
    - `useSessions(params)` (lista paginada de historial con filtros y cursor)
    - `useFinishSession(id)`
    - `useUpsertSetLog(id)`
- **Types**: `auth.type.ts` para tipos de autenticación
  - `routine.type.ts`: `Routine` incluye `isFavorite: boolean` e `isCompleted: boolean`
  - `components/routines/create/types.ts`: `RoutineWizardData` y `RepType` para el wizard de rutinas
  - `workout.type.ts`: Tipos para `WorkoutSession`, `SetLog` y DTOs (start/finish/upsert)
- **TanStack Query**: Para cache y estado del servidor
- **Error Handling**: Manejo centralizado de errores

### Formularios

- **React Hook Form**: Para manejo de formularios
- **Zod Schemas**: Validación de tipos y runtime
- **Schemas disponibles**:
  - `loginSchema`: Validación de login
  - `signupSchema`: Validación de registro
