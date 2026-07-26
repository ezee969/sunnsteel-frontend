# AGENTS.md

This file provides guidance to coding agents (Codex and others) when working with code in this repository.

Last verified against the tree on 2026-07-25 (audit + a real `next build`). If something here contradicts the code, the code wins — and fix this file.

## Project

Sunnsteel is a fitness/workout-tracking web app with a classical/Renaissance visual theme. It is the frontend half of a two-repo system: the NestJS backend lives at `../sunnsteel-backend` and the shared types package at `../sunsteel-contracts` (imported as `@sunsteel/contracts`).

Stack: **Next.js 15.5 (App Router) · React 18.3 · TypeScript 5 (strict) · TailwindCSS 4.3 · shadcn/ui + Radix · TanStack Query 5 · Supabase JS 2**.

**It is effectively an SPA hosted on Next.js.** Only `app/page.tsx` (a redirect based on a cookie), `app/api/session/route.ts` and the six `loading.tsx` files are Server Components. **Every other `page.tsx` and both group layouts are `'use client'`.** There is no RSC data fetching, no Server Actions, no `fetch` caching/`revalidate`, no streaming. All data is fetched client-side via TanStack Query against the external backend. Keep this in mind before reaching for a Next.js server feature — nothing else in the app uses one.

**`@sunsteel/contracts` is a published npm dependency (`^0.5.0` in [package.json](package.json)), not a `file:` link.** It must resolve from the registry because Vercel only clones this repo — pointing it at the local sibling (`file:../sunsteel-contracts`) breaks the deploy (the shared types silently degrade to `any`). Trade-off: local edits to `../sunsteel-contracts` are **not** picked up until you `npm publish` a new version and bump it here.

Runs on Windows 11. Do **not** start/run the app yourself — ask the user to run it.

## Commands

```bash
npm run dev            # Next.js dev server (Turbopack) on :3000
npm run dev:all        # PowerShell launcher: backend (:4000) + frontend (:3000) in separate windows
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run lint:fix       # eslint . --fix
npm run build          # next build
npm run verify         # lint + typecheck + build (run this before considering work done)
```

**Vitest is configured** (added in T-01) — `npm test` / `npm run test:watch`. `npm run verify` runs lint → typecheck → **test** → build, and CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) mirrors it on Node 20.

Coverage is deliberately narrow: **pure logic and API-contract only**, 33 tests across `lib/api/routines/routine-query.test.ts`, `lib/utils/session-validation.utils.test.ts` and `lib/api/services/workout-query.test.ts`. [vitest.config.ts](vitest.config.ts) uses `environment: 'node'` on purpose — there is no jsdom and no React Testing Library, so **hooks and components cannot be tested** without first deciding to add them. Don't write a component test and wonder why it fails.

**Never run `npm run verify` (or `npm run build`) while `npm run dev` is running.** Both write to the same `.next/` directory, so the production build overwrites the dev server's manifests and the running server starts answering **500 on every route**. In this app that surfaces as a **black screen**, because the layout never mounts — it looks exactly like an auth bug and will send you chasing the wrong thing (`localStorage` throwing `SecurityError` and the tab title falling back to the URL are the tells that it's a dead server, not client code). This has already burned an hour once. Stop the dev server first, or verify only when you are done poking at the app.

There is no `docs:check` / `docs:update` script — both were broken (one pointed at a `.sh` that does not exist, the other was an `echo`) and were removed in CL-05.

## Architecture

### Layers (`lib/api/`)

Data flows through a strict service → hook → component layering:

- **Services** ([lib/api/services/](lib/api/services/)`*Service.ts`): raw endpoint calls. All go through `httpClient` in [lib/api/services/httpClient.ts](lib/api/services/httpClient.ts). Base URL is `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`).
- **Hooks** ([lib/api/hooks/](lib/api/hooks/)`use*.ts`): TanStack Query wrappers around services. Components consume these, not services directly.
- **Types** ([lib/api/types/](lib/api/types/)`*.type.ts`): prefer re-exporting/wrapping shared shapes from `@sunsteel/contracts` over redefining API shapes.

One known exception to the layering: [app/(protected)/settings/page.tsx](<app/(protected)/settings/page.tsx>) imports the Supabase client directly for avatar upload.

`httpClient` signature note: the secure flag is a **positional boolean**, e.g. `httpClient.get<T>(url, true)` / `httpClient.request(url, { method, secure: true })` — **not** an options object like `{ secure: true }`. `secure: true` attaches `Authorization: Bearer <supabase access_token>` (pulled from `supabase.auth.getSession()` on every call); all requests use `credentials: 'include'`. Use `requestWithMeta` (same file) when you need response headers/status without throwing — `workoutService.startSession` uses it to branch on 4xx via a `STATUS:<code>:<message>` error prefix.

### Auth

Two-step: Supabase auth (email/password or Google OAuth) → backend verification.

1. [lib/api/services/supabaseAuthService.ts](lib/api/services/supabaseAuthService.ts) signs in with Supabase.
2. `verifyToken()` posts the access token to the backend at `/auth/supabase/verify`.
3. On success it calls `POST /api/session` — **the frontend's own Route Handler** ([app/api/session/route.ts](app/api/session/route.ts)) — which sets the HttpOnly `ss_session=1` cookie (7-day maxAge). The cookie **cannot** be set by the backend: a cookie in the backend's response is scoped to the backend's domain and is never sent to this app's domain, so middleware would never see it.

[providers/supabase-auth-provider.tsx](providers/supabase-auth-provider.tsx) relies solely on `onAuthStateChange` (no parallel `getInitialSession`, to avoid a race). It re-runs `verifyToken` on every non-`TOKEN_REFRESHED` event, so a full page load costs `POST /auth/supabase/verify` + `POST /api/session`.

**That verification is deliberately not a gate — do not turn it back into one.** `isLoading` flips to `false` as soon as the provider knows *whether* there is a session, **before** the `await verifyToken`, and data hooks are enabled on `!!session`. This is safe because the backend's `SupabaseJwtGuard` re-verifies the token and get-or-creates the user on **every** protected request (`../sunnsteel-backend/src/auth/strategies/supabase-jwt.strategy.ts`), so `/auth/supabase/verify` duplicates that work rather than being a prerequisite for it. `isAuthenticated` is still `!!session && !!user`, but it now means "the verified profile has arrived" — use it only for UI that genuinely needs the profile, never to gate queries or rendering. Full reasoning in TD-18.

Route protection is in [middleware.ts](middleware.ts) and checks **only** `ss_session === '1'`. Protected prefixes: `/dashboard`, `/workouts`, `/routines`, `/profile`, `/settings`, `/search`. Unauthenticated hits redirect to `/login?redirectTo=<original>`; authenticated hits on `/login`/`/signup` redirect to `/dashboard`. [app/(protected)/layout.tsx](<app/(protected)/layout.tsx>) adds a second, client-side redirect: it bounces to `/login` when there is no Supabase session, or when the backend verification actually **failed** (`error && !user`) — not merely when the profile has yet to arrive.

**The middleware is a UX gate, not a security boundary.** The cookie's 7-day lifetime is independent of the Supabase session, so the two can drift in both directions. Real authorization is the bearer token on each backend request.

**Invariant: the marker cookie must be cleared *before any render can observe a null session*** — `await supabaseAuthService.clearSessionMarker()` (`DELETE /api/session`) runs before `setSession(null)`, and before `setError(...)` on the failed-verification path. If the marker outlives the Supabase session, middleware waves `/dashboard` through, the layout bounces to `/login`, middleware bounces back, and the app parks on `/dashboard` rendering its empty shell — **a black screen, not a visible loop**.

"Clear it before redirecting" is **not** a strong enough rule: it's the render that triggers the redirect. A first attempt cleared the cookie after `setSession(null)` and appeared to work only because `isLoading` happened to gate the layout's effect on first load — logout, where loading is already resolved, still broke. See TD-21. The ordering *is* the fix; preserve it when refactoring.

**Debugging trap, and it will get you more than once: the service worker masks the real state in dev.** It re-registers on every page load, so it comes back right after you clear it. Three distinct ways it lied during one session: (1) `fetch('/dashboard')` **from the page** returns cached HTML without ever reaching middleware, so it cannot tell you whether route protection works — use a real navigation; (2) `fetch('/site.webmanifest')` returned the *previous* manifest from `ss-precache-*` after the file had changed; (3) stale-while-revalidate on `/_next/static/*` served an **old JS bundle**, so a source fix appeared not to work at all. When a change "doesn't take effect", unregister the SW and delete all `ss-*` caches before believing the result.

The Supabase client ([lib/supabase/client.ts](lib/supabase/client.ts)) falls back to a dummy client when env vars are missing during build, and only throws at runtime on the client side.

### Query keys

Two coexisting styles — match whichever domain you are in:

- **Routines**: `routineQueryKeys` in [lib/api/routines/routine-query.ts](lib/api/routines/routine-query.ts) → `['routines']`, `['routines', <serialized filters>]`, `['routines', <id>]`. The same file holds `RoutineFilters`, filter serialization and the `URLSearchParams` builders — build query strings via those helpers, not ad hoc. Note lists and details share the `['routines']` prefix, so invalidating it hits both.
- **Workouts**: a local `qk` object inside [lib/api/hooks/useWorkoutSession.ts](lib/api/hooks/useWorkoutSession.ts) → `['workout','session','active']`, `['workout','session',id]`, `['workout','sessions',<serialized params>]`.
- Everything else is an inline literal: `['user']`, `['exercises']`, `['users','search',q,limit]`.

**If you add a prefetch, it must use the exact key the consuming hook reads.** A hand-rolled data-prefetch layer that wrote to keys nobody read (`hooks/use-navigation-prefetch.ts`) was deleted for exactly this reason — see TD-01 in [docs/roadmaps/technical-debt.md](docs/roadmaps/technical-debt.md). Route prefetching is `next/link`'s job; don't reimplement it.

### Caching

- **TanStack Query** ([providers/query-provider.tsx](providers/query-provider.tsx)): `staleTime` 5 min, `gcTime` 10 min, `refetchOnMount: true`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`, no retry on 4xx (the predicate reads `error.status`, which `httpClient` supplies via `HttpError`).
- **Next.js Router Cache** ([next.config.ts](next.config.ts)): `experimental.staleTimes` = `{ dynamic: 30, static: 180 }` seconds. Without it Next 15 defaults `dynamic` to 0 and the five `ƒ` routes refetch their RSC payload on every navigation (TD-19). It does not affect data freshness — data comes from TanStack Query, not the RSC payload. **`refetchOnMount: 'always'`** is set, which in practice cancels the `staleTime` for navigations, since every page is a client component that remounts.
- **Service worker** ([public/sw.js](public/sw.js)): hand-written, no Workbox/next-pwa. Network-first for HTML, stale-while-revalidate for same-origin static assets, cache-first for same-origin `/api/*`. `CACHE_VERSION` is bumped **manually**. Registered by [providers/pwa-provider.tsx](providers/pwa-provider.tsx), which does skipWaiting + a one-time reload on `controllerchange`.
- **No persisted query cache** — no IndexedDB, no `persistQueryClient`.

### State

- Server state: TanStack Query (~90% of real state).
- Local state: plain `useState` per page/component.
- Context: `SupabaseAuthContext`, `ToastProvider`, `next-themes`. No Redux (imports are commented out in [providers/app-provider.tsx](providers/app-provider.tsx)), no Zustand.
- One hand-rolled global store: [lib/utils/save-status-store.ts](lib/utils/save-status-store.ts) — a `Map` + listener `Set` driving per-set save status (`idle/pending/saving/saved/error`) in the active session.

### Directory map

- `app/` — App Router. `(auth)` = public login/signup/OAuth callback; `(protected)` = the authed shell (dashboard, routines, workouts, profile, settings, search). `app/api/session/` is the only Route Handler.
- `features/` — feature-scoped components/hooks (`routines/` + `routines/wizard/`, `workout/`, `shell/`, `initial-load-animation/`).
- `components/ui/` — shadcn/ui primitives (`new-york` style), extended with classical theme variants via `cva`.
- `providers/` — nested in [providers/app-provider.tsx](providers/app-provider.tsx): `QueryProvider` → `SupabaseAuthProvider` → `AppToastProvider`. `ThemeProvider` and `PwaProvider` sit above it in [app/layout.tsx](app/layout.tsx).
- `lib/config/env.ts` — `PUBLIC_ENV` and the `SHOULD_*` flags (performance panel/logs, debug logs). `schema/env.client.ts` validates client env at mount (never throws; warns).
- `hooks/` — standalone (non-API) React hooks.

## Conventions

- **Formatting is inconsistent across the repo — match the surrounding file.** [.prettierrc](.prettierrc) says tabs, single quotes, no semicolons, `printWidth` 80, `arrowParens: avoid`, but Prettier is **not** wired into ESLint or CI. `lib/api/services/*` follow it; `middleware.ts`, `providers/*` and `lib/config/env.ts` use 2-space + semicolons. Do not reformat existing code.
- Imports use the `@/` alias (maps to repo root).
- Naming: PascalCase components/types, `use*` hooks, `*Service.ts` services, `*.type.ts` types, kebab-case multi-word filenames, `UPPER_SNAKE_CASE` constants.
- `@typescript-eslint/no-explicit-any` is turned **off** — `any` is permitted.
- `eslint-plugin-prettier`, `eslint-plugin-import` and `eslint-plugin-simple-import-sort` are installed but **not configured** in [eslint.config.mjs](eslint.config.mjs).

## Gotchas

These are verified and will bite you if you assume otherwise:

- **There is no `tailwind.config.ts`, and you must not add one.** Tailwind is v4 with CSS-first config: [app/globals.css](app/globals.css) starts with `@import 'tailwindcss'` + `@theme inline` + `@plugin "tailwindcss-animate"`, there is no `@config` directive, and `components.json` has `"config": ""`. A config file is only loaded via `@config`, so one would be silently ignored. Theme tokens and utilities (`heading-classical`, `bg-marble-light`, `hide-scrollbar`) live in `globals.css`. The old dead config was deleted in TD-12.
- **RtF (Reps-to-Failure) is gone.** Earlier versions of this file described a large dormant RtF codebase (`etag-client.ts`, `rtf-offline-cache.ts`, `useRtF.ts`, `Rtf*` components, `tm-trend.ts`). **None of it exists anymore.** The only residue is the unused `NEXT_PUBLIC_ENABLE_RTF_DEBUG` var in [schema/env.client.ts](schema/env.client.ts). Do not go looking for it; do not reintroduce it.
- **`refetchOnMount` is `true`, not `'always'`** (changed in TD-02), so `staleTime` is now load-bearing: a fresh query is served from cache on navigation and does not hit the network. If a hook must never serve stale data, give it its own `staleTime: 0` — `useSession` does, because it backs the live training session.
- **`next/dynamic` is used only for the two heavy wizard steps** (`BuildDays`, `ReviewAndCreate`, in both `routines/new` and `routines/edit/[id]`) and the perf debug panel. There is no `React.lazy` and **no `React.memo` anywhere** — and adding memo to the session screen would not help, because `groupSetLogsByExercise` rebuilds every object on each call, so every prop is a fresh reference (see TD-07).
- **[lib/utils/dynamic-imports.tsx](lib/utils/dynamic-imports.tsx) is preload-on-*hover* only.** `preloadAllCriticalComponents`, which eagerly `import()`ed ~11 page modules 2 s after auth, was removed (TD-06); `preloadComponents` now holds only the 3 entries `preloadOnHover` actually uses. Don't reintroduce eager preloading. `DashboardStats` in that file is a dead export (CL-03).
- **The mobile splash mounts `children` immediately.** [InitialLoadAnimation.tsx](features/initial-load-animation/InitialLoadAnimation.tsx) is an overlay *on top of* the app, not a gate *in front of* it. It used to withhold `children` for 3.4 s, which meant no page query started until it finished (TD-03). If you touch it, keep `children` mounted from the first frame and animate only opacity.
- **Eruda is gone** (TD-05). It used to be a devDependency imported from app code that shipped a 488 KB chunk. `NEXT_PUBLIC_ENABLE_ERUDA` may still exist in the Vercel env; nothing reads it.
- **Icons/assets are generated, not hand-made.** `icon-192/512/512-maskable.png`, `apple-touch-icon.png` and `og-image.jpg` were produced from the original 1024px `logo.png` with `sharp` (a transitive dep of `next`, so no install needed). The 1.76 MB `logo.png` and the 5.23 MB hero original were **deleted from the tree but remain in git history** — `git show HEAD~1:public/logo.png` to recover. If you need another size, regenerate from there rather than resizing a derivative.
- **There are no routine mocks and no `next/dynamic` component exports left.** `features/routines/mocks/`, `components/ui/command.tsx`, `DashboardStats` and four dead `lib/utils` modules were deleted in block 5 (CL-03/CL-04), along with eight unused dependencies (`@dnd-kit/*`, `recharts`, `@supabase/ssr`, `@tanstack/react-query-devtools`, `cmdk`, `concurrently`). Don't reintroduce them looking for something that "used to be there".
- **The service worker has no `/api/*` branch, on purpose.** One existed and was unreachable — the backend is cross-origin and the only same-origin `/api` route accepts POST/DELETE only, while the handler returns early on non-GET. Verified in the browser: `ss-api-*` never got created. See TD-13.

Known issues, with evidence and file:line references, are tracked in [docs/roadmaps/technical-debt.md](docs/roadmaps/technical-debt.md). Read it before "optimizing" anything performance-related — several existing optimizations are net negative.

## Documentation rule

**Never create doc files at repo root** (except this file, `CLAUDE.md` and `README`). All project docs live under `docs/` (`docs/roadmaps/`, `docs/history/`, `docs/reference/`). The `docs/` tree was fully deleted at some point and is being rebuilt — check what exists before assuming a path.

`CLAUDE.md` is the Claude Code-facing twin of this file. **Keep the two in sync**: if you change one, mirror the change in the other.
