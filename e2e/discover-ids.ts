import type { Browser } from '@playwright/test'
import { USERNAME_PATTERN_SOURCE } from '@sunsteel/contracts'

import { BASE_URL, STATE_PATH } from './preconditions'

/**
 * The routine the portfolio frames should show: the active routine written by
 * the backend's `db:seed:portfolio`. Set UI_SHOWCASE_ROUTINE to capture a
 * different one; an unmatched name falls back to the first routine listed.
 */
const SHOWCASE_ROUTINE_NAME =
	process.env.UI_SHOWCASE_ROUTINE ?? 'Upper / Lower - Autumn Block'

/** Ids of the owner's own records, for the routes that need one. */
export type Ids = {
	history?: string
	routine?: string
	username?: string
	exercise?: string
}

/** Finds seeded records to reach the routes that need an id. */
export async function discoverIds(browser: Browser): Promise<Ids> {
	const context = await browser.newContext({
		baseURL: BASE_URL,
		storageState: STATE_PATH,
		viewport: { width: 1440, height: 900 },
	})
	context.setDefaultNavigationTimeout(90_000)
	const page = await context.newPage()
	const found: Ids = {}
	try {
		await page.goto('/workouts/history', { waitUntil: 'networkidle' })
		const row = page
			.locator('main [role="button"][aria-label^="Open session"]')
			.first()
		if ((await row.count()) > 0) {
			await row.click()
			await page.waitForURL(/\/workouts\/history\/[^/]+$/)
			found.history = new URL(page.url()).pathname.split('/').pop()
		}

		await page.goto('/routines', { waitUntil: 'networkidle' })
		const actions = page.getByRole('button', { name: 'Routine actions' })
		if ((await actions.count()) > 0) {
			// Not `.first()`: the list is the owner's real one, so a scratch or
			// half-built routine can sit above the seeded showcase. The 2026-09-16
			// run captured a "Quick Workout" with no exercises into both the
			// builder and the detail frame. Card names and action buttons render
			// one-to-one in the same order, so the name picks the index.
			const names = (await page.locator('main p.type-panel').allInnerTexts())
				.map(name => name.trim())
			const preferred = names.indexOf(SHOWCASE_ROUTINE_NAME)
			await actions.nth(preferred === -1 ? 0 : preferred).click()
			const href = await page
				.getByRole('menuitem', { name: 'Open', exact: true })
				.getAttribute('href')
			found.routine = href?.split('/').pop()
			await page.keyboard.press('Escape')
		}

		// A trained exercise, so its page renders every section with real data.
		await page.goto('/exercises?trained=1', { waitUntil: 'networkidle' })
		const exercise = page.locator('main li h3 a').first()
		if ((await exercise.count()) > 0) {
			found.exercise = (await exercise.getAttribute('href'))?.split('/').pop()
		}

		// Built from the contract's own pattern: a hand-written `[a-z0-9_]` stopped
		// at the first hyphen of "codex-prof03-0909" and sent the members check to
		// a profile that does not exist.
		await page.goto('/profile', { waitUntil: 'networkidle' })
		const text = await page.locator('main').innerText()
		const username = new RegExp(`@(${USERNAME_PATTERN_SOURCE.slice(1, -1)})`)
		found.username = text.match(username)?.[1]
	} finally {
		await context.close()
	}
	return found
}
