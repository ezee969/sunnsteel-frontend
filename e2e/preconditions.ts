import { existsSync } from 'node:fs'

import type { Browser } from '@playwright/test'

export const STATE_PATH = '.auth/state.json'

export const BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:3000'

export const API_URL = process.env.UI_API_URL ?? 'http://localhost:4000/api'

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
