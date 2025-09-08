---
trigger: always_on
---

### UI/UX

- **Shadcn/ui**: Componentes base consistentes
- **TailwindCSS**: Styling utility-first
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Soporte para tema oscuro
- **Dark Mode / Theme Toggle**:
  - `ThemeProvider` global (next-themes) en `app/layout.tsx` con `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
  - Toggle accesible `ModeToggle` ubicado:
    - En el header protegido: `app/(protected)/components/Header.tsx`.
    - En el layout de auth (esquina superior derecha): `app/(auth)/layout.tsx`.
  - Transición suave de colores: `body` aplica `transition-colors duration-500` en `app/globals.css`.
- **Accessibility**: Componentes accesibles con Radix
- **Favorites UI**: Botón Heart accesible para marcar/desmarcar favoritos en `WorkoutsList`
- **Completed UI**: Botón ListChecks accesible para marcar/desmarcar como completada en `WorkoutsList`
- **Start Session UX**: Botón "Start" (inicia con el primer día) y menú para seleccionar día en `WorkoutsList`; navegación a página de sesión activa.
- **Routine Details UX**: Página de detalle accesible desde el dropdown de rutinas con opción "Open".
  - Quick Start prioriza el día de hoy si existe; si no, usa el primer día de la rutina.
  - Gating: cuando `programEndDate` ya pasó (programa RtF completado), los botones de Start se deshabilitan y se muestra un badge "Program ended".
  - Días colapsables con Accordion (shadcn/Radix). El día de hoy aparece expandido por defecto y con badge "Today".
  - Header de cada día: badge de weekday + número de día + contador de ejercicios. Se eliminaron los pills superiores redundantes.
  - Cada panel de día incluye su propio botón "Start" para iniciar ese día específico.
  - Muestra la estructura completa de la rutina: ejercicios (con descanso) y sets (tipo FIXED/RANGE con reps y peso) en orden.
  - Loading: El breadcrumb ("Routines / Nombre") permanece visible durante la carga mediante skeletons inline; se reemplazó el early return de loading por placeholders inline.
  - Si existe una sesión activa de otro día, se muestra un diálogo de conflicto para ir a la sesión activa.
  - Si se intenta iniciar un día distinto al de hoy, aparece una confirmación de desajuste de fecha (puede proceder igualmente).
  - Animación del Accordion: el contenido usa CSS `grid-template-rows` (0fr→1fr) + fade con `duration-300 ease-in-out` para un expand/contraer suave y estable (ver `components/ui/accordion.tsx`).
  - **Dashboard — Today’s Workouts (Mobile)**:
  - Las tarjetas solo muestran el nombre de la rutina y el badge del día (la descripción se oculta para evitar clipping).
  - Las acciones se presentan como dos botones de ancho completo en una grilla de 2 columnas (Start/Resume y Details) para evitar solapamiento/truncamiento de texto.
  - En pantallas grandes, las acciones se alinean en línea a la derecha como antes.
- **Routine Wizard UX**: En `BuildDays`, inputs accesibles que cambian entre `reps` fijos o rango (`minReps`/`maxReps`) según `repType` por set; validaciones y previsualización en `ReviewAndCreate`.
- **Stepper Advanced Navigation (Edit Mode)**: El `Stepper` ahora acepta props avanzadas para control fino:
  - `completedSteps?: Set<number>` para marcar pasos completos basados en validez de datos (no solo por posición).
  - `canStepClick?: (stepId: number) => boolean` para habilitar clicks directos a pasos permitidos.
  - En edición, el usuario puede saltar directamente a cualquier paso si todos los pasos previos son válidos, sin tener que navegar secuencialmente. En creación se mantiene el flujo secuencial.
- Refactor: `BuildDays` ahora compone `components/routines/create/ExerciseCard.tsx` (con `SetRow` interno) para modularizar la UI de ejercicios y sets.
- Jerarquía de header: el título del ejercicio se muestra por encima del timer/controles.
- **Rep Type** y **Progression** usan el componente `Select` de shadcn/ui para consistencia visual, mejor alineación del popover y comportamiento de apertura/cierre confiable en mobile/desktop.
- **Progression (Mobile Overflow Fixes)**:
  - El `Select` de Progression ahora está restringido en ancho en mobile (`w-36 sm:w-40 max-w-[60vw]`) y su dropdown clampa a viewport (`max-w-[calc(100vw-2rem)]`) para evitar overflow.
  - El campo "Weight Inc. (kg)" solo se muestra cuando `progressionScheme !== 'NONE'`.
  - En mobile, los botones +/- del incremento de peso se ocultan (`hidden sm:inline-flex`) para evitar desbordes; el input sigue editable.
  - Edición: Si el backend envía valores legados (`'DYNAMIC'`, `'DYNAMIC_DOUBLE'`), se mapean a los actuales para el wizard.
- Botones stepper (+/-) para `reps` y `weight` con clamping: fijos 1..50; rango `min`/`max` 1..50 con cross-clamp (min ≤ max); weight en incrementos de 0.5 (mínimo 0).
- Inputs de rango (`minReps`/`maxReps`) usan `type="text"` con `inputMode="numeric"` para permitir edición fluida.
- **Skeleton Loaders**: `components/ui/skeleton.tsx` para estados de carga en `WorkoutsList` y página de sesión activa.
- **Progress Bars**: `components/ui/progress.tsx` usado para:
  - Progreso de sesión en `app/(protected)/workouts/sessions/[id]/page.tsx` (sets completados vs total).
  - Indicador de finalización en tarjetas de `WorkoutsList`.
- **Button Feedback**: Micro-interacciones sutiles al presionar botones (scale/translate) en `components/ui/button.tsx`.
- **Sticky Navigation (Wizard)**:
  - Stepper pegajoso en la parte superior en `app/(protected)/routines/new/page.tsx` y también en `app/(protected)/routines/edit/[id]/page.tsx`.
  - Navegación inferior pegajosa (Previous/Next) en la página de creación para mejor alcance en mobile.
- **Tabs de Días (BuildDays) UX Fixes**:
  - El contador de ejercicios por día ahora siempre es visible como `Badge` y muestra `0` cuando el día está vacío.
  - Se eliminó el scroll vertical en la fila de días y se forzó únicamente scroll horizontal en mobile.
  - Estilos del `Badge` normalizados para evitar jumps de layout y aparición de scroll vertical intermitente.
- **ExerciseCard Expand/Collapse (Smoother)**:
- Animación simplificada tipo móvil: transición de `max-height` + `opacity` (300ms, ease-in-out) al expandir/contraer.
- Se movió el padding al contenedor interno para evitar saltos de layout durante la transición.
- Rotación del ícono `ChevronsUpDown` suavizada (300ms, ease-in-out).
- **Resume Banner**: Banner de reanudación de sesión activa en `app/(protected)/layout.tsx` visible cuando existe una sesión activa (oculto en la página de la sesión).
- **Set Logs Editor**: Editor agrupado por ejercicio (cuando hay metadata de rutina vía `useRoutine`) en `app/(protected)/workouts/sessions/[id]/page.tsx`:
  - Sin agregar/eliminar sets en sesión (estructura fija según la rutina).
  - Reps planeadas: de solo lectura (no editables).
  - Reps realizadas: input separado y editable.
  - Peso: input editable con pista del peso planeado.
  - RPE: no editable por ahora (oculto en la UI).
  - Usa `useUpsertSetLog(id)` e invalida el query de la sesión; el endpoint de borrar existe pero no se expone en la UI.
- **Autosave Toggle Fix**: El autosave al alternar "Completed" ahora usa el siguiente estado (no el estado previo) para evitar condiciones de estado obsoleto.

## Componentes Disponibles

### UI Components (Shadcn)

- **Form Components**: Button, Input, Label, Form
- **Layout Components**: Card, Separator, Scroll Area
- **Navigation**: Tabs, Dropdown Menu
- **Data Display**: Avatar, Badge, Progress
- **Loading**: Loading component, Skeleton

### Layout Components

- **Sidebar navigation**: Navegación lateral
- **Protected route wrappers**: Envoltorios de rutas protegidas
- **Auth layouts**: Layouts de autenticación
- **Loading component**: Componente de carga

## Configuración

### Variables de Entorno

- `NEXT_PUBLIC_API_URL`: URL del backend API
- `NEXT_PUBLIC_FRONTEND_URL`: URL del frontend

### Scripts Disponibles

- `npm run dev`: Desarrollo con Turbopack
- `npm run dev:all`: Frontend + Backend simultáneo
- `npm run build`: Build de producción
- `npm run lint`: Linting con ESLint
- `npm run test`: Ejecuta tests con Vitest una sola vez
- `npm run test:watch`: Ejecuta tests en modo watch
- `npm run test:coverage`: Ejecuta tests con cobertura (text + lcov)
