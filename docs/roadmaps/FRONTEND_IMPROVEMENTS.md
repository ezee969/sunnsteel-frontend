<!--
NOTE: This file tracks near-term frontend improvements. For structured
roadmaps and historical completion reports, see docs/roadmaps and
docs/history. Do not duplicate roadmap tables here.
-->

# Frontend Improvement & Modernization Plan

This document tracks actionable, low-risk improvements separated from the main `README.md`.

---
## 1. High-level Architecture Notes

Auth is now **fully unified on Supabase**:
- `auth-provider.tsx`, `authService`, and `tokenService` have been removed.
- `useAuth` adapter points directly to `supabase-auth-provider`.
- `httpClient` only injects Supabase access token when `secure: true`.

Routing currently trusts **client-side guards** (middleware is disabled for SSR redirects). Once auth is unified, a minimal middleware can re‑enable initial protection.

Dynamic preloading (`lib/utils/dynamic-imports.tsx`) covers dashboard stats; can be extended to wizard/session flows.

### Backend Coordination
For RtF related backend roadmap tasks see backend: `docs/roadmaps/RTF_ENHANCEMENTS.md` (tasks RTF-B01..B13). Frontend counterparts will mirror with F-codes when added.

---
## 2. Quick Win Improvement Opportunities

| Area | Issue / Observation | Low-effort Action | Effort | Impact |
|------|---------------------|-------------------|--------|--------|
| Auth duplication | Two providers (`auth-provider`, `supabase-auth-provider`) | ✅ Unified on Supabase provider; legacy removed | S | DONE |
| Routine types duplication | `RepType` / `ProgressionScheme` duplicated; extra hypertrophy enum only in wizard | ✅ Created `lib/api/types/routine.shared.ts` with unified types + barrel exports | S | DONE |
| `httpClient` complexity | Mixed legacy token + Supabase session logic | ✅ Simplified to Supabase session only (no legacy refresh) | M | DONE |
| Env safety | No runtime validation of `NEXT_PUBLIC_*` vars | ✅ Added `schema/env.client.ts` (Zod) + `validateClientEnv()` in `AppProvider` | S | DONE |
| Barrel exports | Deep relative import chains | ✅ Added `lib/api/hooks/index.ts`, `lib/api/services/index.ts` with import cleanup | S | DONE |
| Preloading scope | Only dashboard stats + a few pages | ✅ Extended `preloadComponents` with wizard pages & active sessions; added hover preloading to Create/Start buttons | S | DONE |
| Middleware | Disabled (only debug headers) | ✅ Implemented edge redirect for protected routes without Supabase auth cookies → `/login` | M | DONE |
| Performance metrics | `performance-monitor.ts` unused | ✅ Added hydration + first data fetch timing with opt-in debug panel | S | DONE |
| Accessibility | Some clickable divs lack keyboard semantics | ✅ Refactored to proper button semantics with keyboard handlers | S | DONE |
| Error boundaries | Missing `error.tsx` for some route groups | ✅ Added `error.tsx` to workout sessions and routine editing with retry | S | DONE |
| Query key stability | Filters object identity may cause refetch churn | ✅ Normalized filters with stable serialization in useRoutines and useSessions | S | DONE |
| Set log autosave UX | Silent debounce may confuse user | ✅ Added "● Saved" / "Unsaved" indicators with instant feedback & cancel unchanged | M | DONE |
| Design tokens docs | Colors only described in prose | ✅ Created `STYLE_GUIDE.md` with CSS vars + usage rules & patterns | S | DONE |

Legend: Effort (S=Small, M=Medium, L=Large), Impact (H=High, M=Medium, S=Small)

---
## 3. Suggested Near-term Task Order

2. Env validation (DONE)
5. Add `error.tsx` boundaries (routines/workouts) (DONE)
6. Barrel exports for hooks/services/types (DONE)
8. Accessibility adjustments (exercise expanders, collapsibles) (DONE) 
9. (Optional) Performance instrumentation hook (DONE)
10. UX feedback for set log autosave (DONE)

---
## 4. Implementation Sketches

### 4.1 useAuth Adapter
```ts
// providers/use-auth-adapter.ts
export { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'
```
Legacy guidance deprecated: adapter + removal completed.
export type RepType = 'FIXED' | 'RANGE'
export type ProgressionScheme =
  | 'PROGRAMMED_RTF'
  | 'PROGRAMMED_RTF_HYPERTROPHY' // keep optional usage
### 4.3 Env Validation
```ts
import { z } from 'zod'

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  if (validated) return validated
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    console.warn('[env] Client env validation failed', parsed.error.flatten())
  validated = (parsed.success ? parsed.data : {}) as ClientEnv
  return validated
}
```
Call `getClientEnv()` once in `AppProvider` (client only) to surface issues early.

### 4.4 Error Boundary Template
```tsx
      <h2 className="text-xl font-semibold">Failed to load routines</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
```
```ts
function stableFilters<T extends Record<string, unknown>>(f: T | undefined) {
```

- Full design token extraction into tooling (post-MVP)

| Auth unification | All references to legacy `useAuth` removed except adapter file; `auth-provider.tsx` deletable |
| Reduced bundle | `auth-provider` & unused legacy refresh logic removed → bundle diff negative |

---
---
## 8. Next Action Proposal
## 9. (Planned) Reintroduction of PROGRAMMED_RTF_HYPERTROPHY Variant


### 9.1 Goals
1. Avoid UI-only ghost enum values that drift from persisted data.
2. Provide clear differentiated semantics (not just a label) vs `PROGRAMMED_RTF`.
3. Keep rollback simple if usage is low.

### 9.2 Proposed Phased Implementation

| Phase | Scope | Backend Change | Risk | Outcome |
|-------|-------|----------------|------|---------|
| 1 (Preset) | Treat Hypertrophy as a style/preset of `PROGRAMMED_RTF` (no new enum) | No | Low | Users pick style; payload still uses `PROGRAMMED_RTF` + `programStyle: 'HYPERTROPHY'` |
| 2 (Shadow Enum) | Add UI enum `PROGRAMMED_RTF_HYPERTROPHY` but map to base on save | No | Low/Med | Simplifies conditionals; still single persisted value |
| 3 (Full Enum) | Add real enum value to backend + migration | Yes (Prisma + API) | Med | Distinct persistence; analytics separation |
| 4 (Differentiated Engine) | Separate progression algorithm (volume ramp, rep targets) | Yes | Med/High | True unique training model |

### 9.3 Functional Differentiators (Draft)
Assumptions to validate before coding:
- Default weekly structure: 4 straight sets @ target reps + 1 AMRAP (same as base) BUT
  - If AMRAP reps >= upper band + 2 -> increase TM by rounding increment.
- Optional volume ramp weeks (Weeks 1–3 up, Week 4 deload, repeat).

### 9.4 Data Shape Extensions (Phase 1 / 2)
```
// Routine-level (only when any programmed rtf exercise)
programStyle?: 'STANDARD' | 'HYPERTROPHY'

// Per-exercise (only when style === 'HYPERTROPHY')
programRepLower?: number // e.g. 8
programRepUpper?: number // e.g. 12
programAutoTm?: boolean  // allow auto TM suggestion updates
```

### 9.5 UI Changes (Phase 1)
- Add style selector when any exercise uses programmed RtF.
- If style = Hypertrophy → show rep range inputs + auto TM toggle.
- Display badge in Review step (RtF • Hypertrophy).
- Serialize style + rep band + auto flag.

### 9.6 Backend (Deferred until Phase 3)
- Prisma enum addition: `PROGRAMMED_RTF_HYPERTROPHY`.
- Migration + backfill existing programmed rtf rows to `PROGRAMMED_RTF`.
- Extend validation + API DTOs.

### 9.7 Testing Plan
- Unit: mapping logic (style to payload) & rep band validation.
- Component: ExerciseCard shows additional fields when style selected.
- E2E (later): Create hypertrophy routine, fetch, assert style fields persisted (Phase 3+).

### 9.8 Telemetry / Analytics (Optional)
- Count selections of each style (feature adoption gating before Phase 3).

### 9.9 Open Questions (Need Confirmation)
- Desired default rep band? (8–12 vs 10–15?)
- Should deload cadence differ automatically? (Every 4th week?)
- Auto TM increment rule (fixed kg vs % of TM)?

### 9.10 Task Checklist (Phase 1 Execution)
- [ ] Add `programStyle` local wizard state (default 'STANDARD').
- [ ] Add style selector UI (shown if any programmed RtF exercise).
- [ ] Add rep band + auto TM controls (visible only when style = HYPERTROPHY).
- [ ] Inject serialized fields into create/update payload.
- [ ] Adjust Review step summary (badge + band display).
- [ ] Update `IMPROVEMENTS.md` status after merge.
- [ ] Add basic unit tests for serialization & visibility logic.

### 9.11 Rollback Strategy
Remove style-dependent UI + payload fields; existing saved routines default to standard behavior (fields ignored by backend).

---
Pending your confirmation of the assumptions above before coding Phase 1.