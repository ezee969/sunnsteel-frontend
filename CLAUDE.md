# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sunnsteel is a fitness/workout-tracking web app (Next.js 15 App Router, React 18, TypeScript, TailwindCSS v4, shadcn/ui). It is the frontend half of a two-repo system; the NestJS backend lives at `../sunnsteel-backend` and the shared types package at `../sunsteel-contracts` (imported as `@sunsteel/contracts`, a `file:` dependency). It has a classical/Renaissance visual theme.

Runs on Windows 11. Do **not** start/run the app yourself — ask the user to run it.

## Commands

```bash
npm run dev            # Next.js dev server (Turbopack) on :3000
npm run dev:all        # PowerShell launcher: starts backend (:4000) + frontend (:3000) in separate windows
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run lint:fix       # eslint . --fix
npm run build          # next build
npm run verify         # lint + typecheck + build (run this before considering work done)
```

There is **no test runner configured** — no Vitest, no test files exist despite older docs referencing Vitest/RTL. Do not assume `npm test` works; verify via `npm run verify`.

## Architecture

### Layers (`lib/api/`)
Data flows through a strict service → hook → component layering:

- **Services** (`lib/api/services/*Service.ts`): raw endpoint calls. All go through `httpClient` in [lib/api/services/httpClient.ts](lib/api/services/httpClient.ts). Base URL is `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`).
- **Hooks** (`lib/api/hooks/use*.ts`): TanStack Query wrappers around services. Components consume these, not services directly.
- **Types** (`lib/api/types/*.type.ts`): prefer re-exporting/wrapping shared shapes from `@sunsteel/contracts` over redefining API shapes.

`httpClient` signature note: the secure flag is a **positional boolean**, e.g. `httpClient.get<T>(url, true)` / `httpClient.request(url, { method, secure: true })` — **not** an options object like `{ secure: true }` (older docs are wrong on this). `secure: true` attaches `Authorization: Bearer <supabase access_token>` (pulled from `supabase.auth.getSession()`); all requests use `credentials: 'include'` so cookies also flow. Use `requestWithMeta` (same file) when you need response headers/status (e.g. ETag flows).

### Auth
Two-step: Supabase auth (email/password or Google OAuth) → backend verification. [lib/api/services/supabaseAuthService.ts](lib/api/services/supabaseAuthService.ts) calls Supabase, then verifies the access token with the backend at `/auth/supabase/verify`. The backend sets an HttpOnly `ss_session=1` cookie on success.

Route protection is in [middleware.ts](middleware.ts): it checks only `ss_session === '1'`. Protected prefixes: `/dashboard`, `/workouts`, `/routines`, `/profile`, `/settings`, `/search`. Unauthenticated hits redirect to `/login?redirectTo=<original>`; authenticated hits on `/login` or `/signup` redirect to `/dashboard`.

The Supabase client ([lib/supabase/client.ts](lib/supabase/client.ts)) falls back to a dummy client when env vars are missing during build, and only throws at runtime on the client side.

### RtF (Reps-to-Failure) — DISABLED / dormant code
RtF was a planned program type (per-week goals, timelines, forecasts, TM adjustments) with its own caching stack. **It is currently disabled across the whole frontend and the corresponding backend endpoints have been deleted — the feature will not be implemented until some future date.**

A large amount of RtF frontend code still exists but is effectively dead and calls endpoints that no longer exist. This includes, among others:
- [lib/api/etag-client.ts](lib/api/etag-client.ts) (`rtfApi`), [lib/api/rtf-offline-cache.ts](lib/api/rtf-offline-cache.ts) (IndexedDB `sunsteel-rtf-cache`), [lib/api/hooks/useRtF.ts](lib/api/hooks/useRtF.ts), `useRtfWeekGoals.ts`, `use-tm-adjustments.ts`.
- `features/routines/components/Rtf*`, `TmAdjustmentPanel`, `features/routines/wizard/Rtf*`, and `lib/utils/reps-to-failure.ts` / `rtf-*` / `lib/analytics/tm-trend.ts`.

Do **not** build on this code, wire it into live flows, or treat it as a working feature. If asked to touch RtF, confirm intent first — the likely correct action is leaving it dormant or removing it, not extending it. Do not spend effort "fixing" it to match the (now-gone) backend.

### Query keys
Centralized per-domain, e.g. `routineQueryKeys` in [lib/api/routines/routine-query.ts](lib/api/routines/routine-query.ts) (also holds `RoutineFilters`, filter serialization, and `URLSearchParams` builders). Follow this pattern — build query strings via the shared helpers, not ad hoc.

### Directory map
- `app/` — App Router. `(auth)` = public login/signup/OAuth callback; `(protected)` = the authed shell (dashboard, routines, workouts, profile, settings, search).
- `features/` — feature-scoped components/hooks (`routines/`, `workout/`, `shell/`, `initial-load-animation/`).
- `components/ui/` — shadcn/ui primitives, extended with classical theme variants (via `cva`).
- `providers/` — nested in [providers/app-provider.tsx](providers/app-provider.tsx): `QueryProvider` → `SupabaseAuthProvider` → `AppToastProvider`.
- `lib/config/env.ts` — `PUBLIC_ENV` and `SHOULD_*` feature flags (Eruda mobile console, performance panel/logs, debug logs). `schema/env.client.ts` validates client env at mount.
- `hooks/` — standalone (non-API) React hooks.

## Conventions

- **Formatting is inconsistent across the repo — match the surrounding file.** Prettier config ([.prettierrc](.prettierrc)) is tabs, single quotes, no semicolons, `printWidth` 80, `arrowParens: avoid`. Many files (e.g. `lib/api/services/*`) use tabs+no-semi, but others (middleware, providers, `lib/config/env.ts`) use 2-space+semicolons. Do not reformat existing code; follow whatever the file you're editing already does.
- Imports use the `@/` alias (maps to repo root).
- Naming: PascalCase components/types, `use*` hooks, `*Service.ts` services, `*.type.ts` types, kebab-case multi-word filenames, `UPPER_SNAKE_CASE` constants.
- `@typescript-eslint/no-explicit-any` is turned **off** — `any` is permitted.

## Documentation rule

**Never create doc files at repo root** (except this file and README). All project docs live under `docs/` (`docs/roadmaps/`, `docs/history/`, `docs/reference/`, etc.). Note: the working tree currently has the entire `docs/` tree staged for deletion — check `git status` before assuming a doc path exists.
