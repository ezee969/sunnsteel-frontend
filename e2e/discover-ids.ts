import type { Browser } from '@playwright/test'
import { USERNAME_PATTERN_SOURCE } from '@sunsteel/contracts'

import { BASE_URL, STATE_PATH } from './preconditions'

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
			await actions.first().click()
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
