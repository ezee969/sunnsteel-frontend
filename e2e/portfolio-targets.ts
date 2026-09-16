import type { Page } from '@playwright/test'

import type { Ids } from './discover-ids'
import { expect } from './fixtures'

/**
 * The portfolio screenshot set: one 1440×900 dark frame per user-facing page,
 * written to docs/portfolio/screenshots/<slug>.png by portfolio.spec.ts.
 *
 * When a user-facing page ships or visibly changes, add or update its entry
 * here in the same change (CLAUDE.md, "Portfolio screenshots").
 *
 *   npm run ui:capture:portfolio     (dev server and backend running, signed in)
 */

/** Undoes whatever a setup step created. Always runs, even after a failure. */
export type Cleanup = () => Promise<void>

export type PortfolioTarget = {
	/** File name: docs/portfolio/screenshots/<slug>.png. */
	slug: string
	/**
	 * The route, with `:routine`, `:history`, `:exercise` and `:username`
	 * resolved from the owner's own data (discover-ids.ts). It is recorded in
	 * the manifest as written.
	 */
	route: string
	/**
	 * Where to open the page when `route` holds an id only the setup step can
	 * create (e.g. a scratch session). Defaults to the resolved `route`.
	 */
	openAt?: string
	/** Roadmap IDs (docs/roadmaps/product-roadmap.md) the frame shows. */
	features: string[]
	/** Captured as a visitor with no session: middleware bounces a signed-in one. */
	signedOut?: boolean
	/**
	 * Brings the page into the state worth showing, after it has loaded. It may
	 * create data only if it returns the cleanup that removes it, and must never
	 * finish a workout session.
	 */
	setup?: (page: Page) => Promise<Cleanup | void>
	/** What a caption for this frame should say. */
	caption: string
}

const ID_PLACEHOLDERS: Record<string, keyof Ids> = {
	':routine': 'routine',
	':history': 'history',
	':exercise': 'exercise',
	':username': 'username',
}

/**
 * Returns the path to open, or the placeholder that no discovered id could
 * fill (the owner has no routine, finished session, trained exercise, …).
 */
export function resolveRoute(
	target: PortfolioTarget,
	ids: Ids,
): { path: string } | { missing: string } {
	let path = target.openAt ?? target.route
	for (const [placeholder, key] of Object.entries(ID_PLACEHOLDERS)) {
		if (!path.includes(placeholder)) continue
		const id = ids[key]
		if (!id) return { missing: placeholder }
		path = path.replace(placeholder, id)
	}
	const leftover = path.match(/:[a-z]+/)
	return leftover ? { missing: leftover[0] } : { path }
}

async function openBuildDaysStep(page: Page) {
	const step = page.getByRole('button', { name: /^Step 3 of 4: Build Days/ })
	await step.click()
	await expect(step).toHaveAttribute('aria-current', 'step')
	await page.waitForLoadState('networkidle')
}

const SETS_TO_LOG = 3

/**
 * Starts a scratch session from the first routine that can start today, logs
 * three sets at their prescription, and returns the cleanup that un-completes
 * them and discards the session. It never finishes one: a finished session
 * writes records, progression and achievements. An aborted session writes none
 * of those, and un-completing the sets first keeps them out of the exercise
 * performance and plateau reads, which count sets from aborted sessions.
 */
async function startScratchSession(page: Page): Promise<Cleanup> {
	const start = page.locator(
		'button[aria-label="Start session"]:not([disabled])',
	)
	await expect(
		start.first(),
		'No routine can start a session today. Add a rotation routine, or one ' +
			'scheduled for today, to capture the live session.',
	).toBeVisible()
	await start.first().click()
	await page.waitForURL(/\/workouts\/sessions\/[^/]+$/, { timeout: 30_000 })
	await page.waitForLoadState('networkidle')

	const discard: Cleanup = async () => {
		await page.getByRole('button', { name: 'Discard', exact: true }).click()
		const dialog = page.getByRole('alertdialog')
		await dialog.getByRole('button', { name: 'Discard Session' }).click()
		await page.waitForURL(url => !/\/workouts\/sessions\//.test(url.pathname), {
			timeout: 30_000,
		})
	}

	const rows = page.getByTestId('set-log-container')
	const logged: number[] = []
	const cleanup: Cleanup = async () => {
		for (const index of logged) {
			const box = rows.nth(index).getByRole('checkbox', {
				name: 'Mark set as complete',
			})
			if ((await box.getAttribute('data-state')) === 'checked') {
				await box.click()
				await expect(box).toHaveAttribute('data-state', 'unchecked')
			}
		}
		await page.waitForLoadState('networkidle')
		await discard()
	}

	try {
		await expect(
			rows.nth(SETS_TO_LOG - 1),
			`The started day has fewer than ${SETS_TO_LOG} sets.`,
		).toBeVisible()

		for (let index = 0; index < SETS_TO_LOG; index++) {
			const row = rows.nth(index)
			const reps = row.getByLabel('Performed reps')
			if (!(await reps.inputValue())) {
				const target = await row
					.getByText(/^Target: /)
					.first()
					.innerText()
				await reps.fill(target.match(/\d+/)?.[0] ?? '8')
			}
			const weight = row.getByLabel(/^Performed weight in /)
			if (!(await weight.inputValue())) {
				const target = await row
					.getByText(/^Target: /)
					.nth(1)
					.innerText()
				const load = target.match(/\d+(\.\d+)?/)?.[0]
				if (load) await weight.fill(load)
			}
			const box = row.getByRole('checkbox', { name: 'Mark set as complete' })
			await box.click()
			logged.push(index)
			await expect(box).toHaveAttribute('data-state', 'checked')
		}
		await page.waitForLoadState('networkidle')
		// The rest timer and any record celebration arrive with the last save.
		await page.waitForTimeout(800)
	} catch (error) {
		await cleanup()
		throw error
	}

	return cleanup
}

export const PORTFOLIO_TARGETS: PortfolioTarget[] = [
	{
		slug: 'login',
		route: '/login',
		features: ['CORE-01', 'FIX-11'],
		signedOut: true,
		caption: 'Sign in with email or Google; password reset from the same form.',
	},
	{
		slug: 'dashboard',
		route: '/dashboard',
		features: ['DASH-01', 'DASH-02', 'CORE-03'],
		caption:
			"Today's workout with one adaptive primary action, weekly stats and records.",
	},
	{
		slug: 'routine-builder',
		route: '/routines/edit/:routine',
		features: ['ROUT-01', 'ROUT-02', 'ROUT-11'],
		setup: openBuildDaysStep,
		caption:
			'The routine builder on its days step: exercises, sets, reps, load and rest per day.',
	},
	{
		slug: 'routine-detail',
		route: '/routines/:routine',
		features: ['ROUT-01', 'ROUT-02', 'ROUT-08'],
		caption: "A routine's days and prescriptions, with Start on today's day.",
	},
	{
		slug: 'history',
		route: '/workouts/history',
		features: ['HIST-01'],
		caption:
			'Paginated workout history with status, routine, date and sort filters.',
	},
	{
		slug: 'history-detail',
		route: '/workouts/history/:history',
		features: ['HIST-01', 'LIVE-09', 'SOC-07'],
		caption: 'A finished session recap, shareable through a public link.',
	},
	{
		slug: 'progress',
		route: '/progress',
		features: ['PROG-01', 'PROG-03', 'PROG-04', 'PROG-05'],
		caption:
			'Strength trends, muscle heatmap and volume comparisons over time.',
	},
	{
		slug: 'schedule-week',
		route: '/schedule',
		features: ['SCHED-01', 'SCHED-03', 'SCHED-04', 'SCHED-05'],
		caption:
			'The weekly schedule: planned, completed and moved workouts, never "missed".',
	},
	{
		slug: 'achievements',
		route: '/achievements',
		features: ['ACH-01', 'ACH-02', 'ACH-04', 'ACH-05'],
		caption:
			'Verified milestones, Renaissance ranks and the next goal per category.',
	},
	{
		slug: 'exercise-detail',
		route: '/exercises/:exercise',
		features: ['EXER-01', 'EXER-07', 'PROG-02'],
		caption:
			"A trained exercise's best set, estimated 1RM, recent sessions and progression.",
	},
	{
		slug: 'member-profile',
		route: '/members/:username',
		features: ['PROF-12', 'PROF-04', 'PROF-05', 'PROF-06'],
		signedOut: true,
		caption: 'The public member profile as a signed-out visitor sees it.',
	},
	// Last on purpose: while the scratch session is live every other protected
	// page shows its Resume banner, so nothing may be captured after a failed
	// cleanup. The spec also stops the run if the session survives.
	{
		slug: 'live-session',
		route: '/workouts/sessions/:session',
		openAt: '/routines',
		features: ['LIVE-00', 'LIVE-01', 'LIVE-03', 'LIVE-04', 'LIVE-05'],
		setup: startScratchSession,
		caption:
			'A live session with three sets logged, the rest timer and last-time comparison.',
	},
]
