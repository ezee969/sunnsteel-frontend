import { existsSync, readFileSync } from 'node:fs'

import type { Browser } from '@playwright/test'

export const STATE_PATH = '.auth/state.json'

export const BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:3000'

export const API_URL = process.env.UI_API_URL ?? 'http://localhost:4000/api'

/**
 * The backend's portfolio seed manifest, when the two repos sit side by side
 * as they do in the workspace. Absent on a machine that only has this repo.
 */
const SEED_MANIFEST_PATH =
	process.env.UI_SEED_MANIFEST ??
	'../sunnsteel-backend/prisma/.portfolio-seed-manifest.json'

/**
 * Refuses to capture over the previous run's leftovers.
 *
 * A capture run is not repeatable on its own. The `live-session` target has to
 * start a real session, and the API has no way to remove one — discarding sets
 * it to ABORTED, which the schedule and the dashboard both render as "Ended
 * early". So a run that reaches that target changes the data the next run
 * photographs.
 *
 * Re-seeding is what makes them identical: the reset deletes every session on
 * the seeded routines, residue included, and rebuilds the history relative to
 * the day it runs. This asserts that it happened since the last run that wrote
 * anything — `mutatedAt` in the manifest, not the capture times, because a run
 * that only read pages left nothing to clean up and should not cost a re-seed.
 *
 * Set UI_SKIP_SEED_CHECK=1 to capture against the data as it stands.
 */
export function assertSeedNewerThanLastCapture(manifestPath: string): void {
	if (process.env.UI_SKIP_SEED_CHECK === '1') return
	if (!existsSync(SEED_MANIFEST_PATH) || !existsSync(manifestPath)) return

	const seededAt = Date.parse(
		(
			JSON.parse(readFileSync(SEED_MANIFEST_PATH, 'utf8')) as {
				generatedAt?: string
			}
		).generatedAt ?? '',
	)
	const mutatedAt = Date.parse(
		(JSON.parse(readFileSync(manifestPath, 'utf8')) as { mutatedAt?: string })
			.mutatedAt ?? '',
	)
	if (!Number.isFinite(seededAt) || !Number.isFinite(mutatedAt)) return
	if (seededAt > mutatedAt) return

	throw new Error(
		`A capture run wrote data at ${new Date(mutatedAt).toISOString()} and the
portfolio seed has not been rebuilt since (${new Date(seededAt).toISOString()}),
so this run would photograph that run's leftovers: an aborted scratch session
reads "Ended early" on the schedule and the dashboard. Re-seed first, in
sunnsteel-backend:

  npm run db:seed:portfolio

Or set UI_SKIP_SEED_CHECK=1 to capture the data as it stands.`,
	)
}

/**
 * Whether this run will execute the project called `name`.
 *
 * `FullConfig.projects` is the *configured* project list, never the selected
 * one: it still holds all four after `--project=regression`, so a guard written
 * as `config.projects.some(p => p.name === 'portfolio')` is true on every run
 * and fires unconditionally. That is how the portfolio seed check came to block
 * `npm run ui:regression`, which CLAUDE.md requires for every UI change, over
 * the state of a screenshot set the sweep never writes to.
 *
 * Playwright does not hand `globalSetup` the filtered set, so the flag is read
 * back out of the runner's own argv (`FullConfig.argv`).
 *
 * It fails **closed**: `--project` also accepts patterns, and a token that is
 * not an exact configured name could still match `name`, so an unrecognised one
 * answers true rather than silently skipping the guard.
 */
export function runsProject(
	argv: readonly string[],
	configuredNames: readonly string[],
	name: string,
): boolean {
	const selected: string[] = []
	let filtered = false

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index]

		if (arg.startsWith('--project=')) {
			filtered = true
			selected.push(arg.slice('--project='.length))
			continue
		}
		if (arg !== '--project') continue

		filtered = true
		let next = index + 1
		if (next < argv.length && !argv[next].startsWith('-')) {
			selected.push(argv[next])
			next += 1
			// `--project` is variadic. Keep consuming only tokens that name a real
			// project, so a trailing file filter is not swallowed as one.
			while (next < argv.length && configuredNames.includes(argv[next])) {
				selected.push(argv[next])
				next += 1
			}
		}
		index = next - 1
	}

	if (!filtered) return true
	// A flag with no readable value tells us nothing, so it is not a reason to
	// skip the guard either.
	if (selected.length === 0) return true
	if (selected.includes(name)) return true
	return selected.some(token => !configuredNames.includes(token))
}

/**
 * With the backend down, verification fails and the protected layout bounces
 * to /login — which looks exactly like an expired sign-in. Phase 14's first run
 * lost 136 tests to a backend restart reported as "session expired".
 */
async function assertBackendUp() {
	try {
		const response = await fetch(`${API_URL}/health`)
		if (response.ok) return
		throw new Error(`status ${response.status}`)
	} catch (error) {
		throw new Error(
			`The backend at ${API_URL} is not answering (${String(error)}). ` +
				'Start it before a run: without it the app redirects to /login.',
		)
	}
}

/**
 * Returns the id of the owner's live workout session, or null when there is
 * none. Throws when the saved sign-in is missing or has expired.
 *
 * It asks the app rather than the API, because the app's behaviour is what
 * invalidates a run (TD-34): `/workouts` replaces itself with the live session
 * whenever one exists, and the shell adds a "Resume" banner to every other
 * protected page. Nine Batch 4 captures were taken under that banner before
 * anyone noticed; nothing in the harness checked for it.
 */
export async function findActiveSessionId(
	browser: Browser,
): Promise<string | null> {
	if (!existsSync(STATE_PATH)) {
		throw new Error(
			`No saved session at ${STATE_PATH}. Run "npm run ui:login" first — ` +
				'without it every protected route redirects to /login.',
		)
	}
	await assertBackendUp()

	const context = await browser.newContext({
		baseURL: BASE_URL,
		storageState: STATE_PATH,
		viewport: { width: 1440, height: 900 },
	})
	context.setDefaultNavigationTimeout(90_000)

	try {
		const page = await context.newPage()

		// The three requests that decide whether the app keeps the session. A
		// bounce to /login is reported with these, not guessed at: Phase 14's
		// second run called a cold-compile bounce an "expired" sign-in.
		const auth: string[] = []
		page.on('response', response => {
			const url = response.url()
			if (
				url.includes('/auth/v1/token') ||
				url.includes('/auth/supabase/verify') ||
				url.endsWith('/api/session')
			) {
				const { pathname } = new URL(url)
				auth.push(
					`${response.request().method()} ${pathname} ${response.status()}`,
				)
			}
		})
		page.on('requestfailed', request => {
			if (
				/auth\/v1\/token|auth\/supabase\/verify|\/api\/session$/.test(
					request.url(),
				)
			) {
				auth.push(`${request.method()} ${request.url()} failed`)
			}
		})

		await page.goto('/workouts', { waitUntil: 'networkidle' })
		// The redirect waits on the active-session query, which only starts once
		// auth has resolved, so give it a second idle window before reading.
		await page.waitForTimeout(1000)
		await page.waitForLoadState('networkidle')

		const { pathname } = new URL(page.url())
		if (pathname.startsWith('/login')) {
			throw new Error(
				`The app signed the saved session out (auth traffic: ` +
					`${auth.join(', ') || 'none observed'}). A 400 from /auth/v1/token ` +
					'means the sign-in has expired — run "npm run ui:login". A failed ' +
					'verify or /api/session means the backend or dev server was not ' +
					'ready; re-run once both answer.',
			)
		}

		// Persist the refreshed tokens. The saved access token lasts an hour, so
		// after that every context in a run refreshed it from the same stored
		// refresh token — hundreds of refreshes per run. Starting from a fresh
		// token, a run never needs to refresh at all.
		await context.storageState({ path: STATE_PATH })

		const live = pathname.match(/^\/workouts\/sessions\/([^/]+)/)
		if (live) return live[1]

		const resume = page.getByRole('link', { name: 'Resume active session' })
		if ((await resume.count()) > 0) {
			const href = await resume.first().getAttribute('href')
			return href?.split('/').pop() ?? 'unknown'
		}

		return null
	} finally {
		await context.close()
	}
}
