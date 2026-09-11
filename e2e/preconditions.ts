import { existsSync } from 'node:fs'

import type { Browser } from '@playwright/test'

export const STATE_PATH = '.auth/state.json'

export const BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:3000'

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

	const context = await browser.newContext({
		baseURL: BASE_URL,
		storageState: STATE_PATH,
		viewport: { width: 1440, height: 900 },
	})
	context.setDefaultNavigationTimeout(90_000)

	try {
		const page = await context.newPage()
		await page.goto('/workouts', { waitUntil: 'networkidle' })
		// The redirect waits on the active-session query, which only starts once
		// auth has resolved, so give it a second idle window before reading.
		await page.waitForTimeout(1000)
		await page.waitForLoadState('networkidle')

		const { pathname } = new URL(page.url())
		if (pathname.startsWith('/login')) {
			throw new Error(
				`The saved session at ${STATE_PATH} has expired. ` +
					'Run "npm run ui:login" again.',
			)
		}

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
