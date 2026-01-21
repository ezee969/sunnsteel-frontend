## Sunnsteel Frontend (Next.js App Router)

- The project is executed in Windows 11.
- Never try to mount/run the project by yourself; ask the user to do it.
- Keep documentation under `docs/` (avoid adding new root-level docs files).

### Developer workflows (from `package.json`)

- Run app: `npm run dev` (Next.js dev with Turbopack)
- Run both apps: `npm run dev:all` (PowerShell launcher in `start-dev.ps1`)
- Tests: `npm test` (Vitest), `npm run test:watch`, `npm run test:coverage`

### Auth + routing (cookie-based protection)

- Route protection is implemented in [middleware.ts](../middleware.ts):
	- Protected prefixes: `/dashboard`, `/workouts`, `/routines`.
	- Session detection is via cookies: prefer HttpOnly `ss_session=1`, fallback `has_session=1`.
	- Backend sets `ss_session` on `/auth/supabase/verify`.
	- Unauthenticated users are redirected to `/login?redirectTo=...` (original path) by the middleware.

### Supabase + backend verification flow

- Supabase client lives in [lib/supabase/client.ts](../lib/supabase/client.ts) (uses a “dummy client” during build if env vars are missing).
- Auth service calls:
	- Supabase auth (email/password or Google OAuth)
	- then verifies with backend using `/auth/supabase/verify` in [lib/api/services/supabaseAuthService.ts](../lib/api/services/supabaseAuthService.ts)

### API layer conventions

- Use the shared fetch wrapper in [lib/api/services/httpClient.ts](../lib/api/services/httpClient.ts):
	- Base URL comes from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`).
	- `secure: true` attaches `Authorization: Bearer <supabase access_token>`.
	- Always uses `credentials: 'include'` so cookies flow as well.
- Put endpoint calls in `lib/api/services/*` (example: [lib/api/services/routineService.ts](../lib/api/services/routineService.ts)) and React Query hooks in `lib/api/hooks/*`.
	- Service methods typically build query strings via `URLSearchParams` (see `getUserRoutines` in `routineService`).

### Shared contracts (`@sunsteel/contracts`)

- Prefer shared enums/types from `@sunsteel/contracts` via the wrappers in `lib/api/types/*` instead of redefining API shapes.

### Code style

- Match the surrounding file’s formatting (tabs/spaces and semicolon usage vary). Imports typically use the `@/` alias.