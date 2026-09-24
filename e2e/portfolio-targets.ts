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
	 * `setup` writes data the API cannot fully take back — a discarded session
	 * stays as ABORTED and reads "Ended early". Running one of these obliges the
	 * next run to re-seed first; the manifest records that it happened.
	 */
	mutates?: boolean
	/**
	 * Brings the page into the state worth showing, after it has loaded. It may
	 * create data only if it returns the cleanup that removes it, and must never
	 * finish a workout session.
	 */
	setup?: (page: Page) => Promise<Cleanup | void>
	/**
	 * Text that has to be visible before the frame is worth photographing,
	 * checked after the route loads and again after `setup`.
	 *
	 * Required, because "the page loaded" is not the same as "the page has
	 * anything on it" and the run cannot tell the difference. The 2026-09-16
	 * run reported `achievements` as passed while photographing its loading
	 * skeleton, and an earlier one passed `routine-builder` and
	 * `routine-detail` while pointed at a routine with no exercises in it.
	 *
	 * Pick strings from the page's own content, not from the shell: the
	 * sidebar renders "Achievements" on every route.
	 */
	ready: readonly (string | RegExp)[]
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
	// The start occasionally resolves without routing anywhere. useStartSession
	// guards against parallel starts by returning whatever getActiveSession()
	// reports instead of starting again, and when that read lands before the new
	// session is visible it resolves to undefined, so the caller has no id to
	// push to. The session is created on the server either way — 201 with an id —
	// so recover through /workouts, which replaces itself with the live session.
	try {
		await page.waitForURL(/\/workouts\/sessions\/[^/]+$/, { timeout: 20_000 })
	} catch {
		await page.goto('/workouts', { waitUntil: 'networkidle' })
		await page.waitForURL(/\/workouts\/sessions\/[^/]+$/, { timeout: 30_000 })
	}
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
		ready: ['Welcome back', /Continue with Google/i],
		caption: 'Sign in with email or Google; password reset from the same form.',
	},
	{
		slug: 'dashboard',
		route: '/dashboard',
		features: [
			'DASH-01',
			'DASH-02',
			'DASH-03',
			'DASH-07',
			'DASH-09',
			'DASH-08',
			'CORE-03',
		],
		ready: ['Weekly Workouts', 'Total Workouts', 'Total Volume'],
		caption:
			"Today's workout with one adaptive primary action, weekly stats and records, then the facts behind the last two finished weeks, the next milestones and a few updates from members you follow.",
	},
	{
		slug: 'starter-templates',
		route: '/routines/new',
		features: ['ROUT-03'],
		ready: ['Start from a template', 'Full Body Foundations', 'Use template'],
		caption:
			'Starting a routine from a curated template: each opens in the builder as an editable draft, with the loads left to the member.',
	},
	{
		slug: 'routine-builder',
		route: '/routines/edit/:routine',
		features: ['ROUT-01', 'ROUT-02', 'ROUT-11'],
		setup: openBuildDaysStep,
		ready: ['Build Your Training Days', 'Exercises', 'Sets', 'Days Ready'],
		caption:
			'The routine builder on its days step: exercises, sets, reps, load and rest per day.',
	},
	{
		slug: 'routine-detail',
		route: '/routines/:routine',
		features: ['ROUT-01', 'ROUT-02', 'ROUT-08', 'ROUT-09', 'ROUT-15'],
		setup: async page => {
			await page
				.getByRole('region', { name: 'Training blocks' })
				.scrollIntoViewIfNeeded()
		},
		ready: ['Routine Days', /\d+ exercises/, 'Autumn accumulation'],
		caption:
			'A routine following its training block in force, with the authored block timeline and saved versions.',
	},
	{
		slug: 'training-block-comparison',
		route: '/routines/:routine',
		features: ['PROG-11', 'ROUT-09'],
		setup: async page => {
			await page
				.getByRole('button', { name: 'Compare training' })
				.first()
				.click()
			await page
				.getByRole('dialog')
				.getByText('Lifts trained in both')
				.waitFor()
		},
		// The dialog renders outside `main`, where `ready` looks, so the setup
		// waits for its content and `ready` names the page behind it.
		ready: ['Autumn accumulation', 'Compare training'],
		caption:
			'A training block beside the period before it: workouts against the plan, sets, load, effort, rep targets and every lift trained in both, stated and never ranked.',
	},
	{
		slug: 'routine-deload',
		route: '/routines/:routine',
		features: ['ROUT-16'],
		// Opens the dialog only: the preview is computed in the browser, so the
		// capture writes nothing.
		setup: async page => {
			await page.getByRole('button', { name: 'Plan deload' }).click()
		},
		ready: ['Plan a deload', 'What changes'],
		caption:
			'Planning a deload: a lighter copy of the plan in force, previewed exercise by exercise before it replaces those days.',
	},
	{
		slug: 'history',
		route: '/workouts/history',
		features: ['HIST-01'],
		ready: [/History/i, /\d{4}/],
		caption:
			'Paginated workout history with status, routine, date and sort filters.',
	},
	{
		slug: 'history-detail',
		route: '/workouts/history/:history',
		features: ['HIST-01', 'LIVE-09', 'SOC-07', 'LIVE-17'],
		ready: [/Volume|Sets|Duration/, /\d/],
		caption:
			'A finished session recap, shareable through a public link, and correctable for two days with every change kept.',
	},
	{
		slug: 'progress',
		route: '/progress',
		features: ['PROG-01', 'PROG-03', 'PROG-04', 'PROG-05'],
		ready: ['Plateau watch', /Sessions without a new best/i],
		caption:
			'Strength trends, muscle heatmap and volume comparisons over time.',
	},
	{
		slug: 'schedule-week',
		route: '/schedule',
		features: [
			'SCHED-01',
			'SCHED-03',
			'SCHED-04',
			'SCHED-05',
			'NAV-05',
			'ROUT-15',
		],
		ready: ['This week', /Planned|Not logged|Completed/],
		caption:
			'The weekly schedule, each day following the training block in force, plus restrained navigation indicators.',
	},
	{
		slug: 'achievements',
		route: '/achievements',
		features: ['ACH-01', 'ACH-02', 'ACH-04', 'ACH-05', 'ACH-09'],
		ready: ['Current rank', 'Next milestones'],
		caption:
			'Verified milestones, Renaissance ranks with their own crest and pigment, and the next goal per category.',
	},
	{
		slug: 'notifications',
		route: '/notifications',
		features: ['NOTIF-01', 'SOC-09'],
		ready: ['Updates', /Ken Watanabe sent encouragement: Good work/],
		caption:
			'Today’s training actions and a private fixed-prompt encouragement from a training partner.',
	},
	{
		// The owner's own list, because the local stack has one real account
		// and the feed would photograph an empty state. It is the SOC-04 half:
		// every entry with the audience that actually applies.
		slug: 'activity-yours',
		route: '/activity?view=yours',
		// SOC-06 is tagged for the comment control on each entry, not for a
		// conversation: the fixture leaves the owner's activity private, so no
		// peer may comment on it and seeding one would show a discussion the
		// shipped rule would have refused. SOC-05 is deliberately absent --
		// nobody may acknowledge their own work, so this page never shows it.
		features: ['SOC-03', 'SOC-04', 'SOC-06'],
		ready: ['See it as', /can see this|Withdrawn/],
		caption:
			'Activity generated from verified training, each entry with who can see it, a preview as each audience, and discussion attached to the entry rather than to a posting surface.',
	},
	{
		// TRUST-04. The queue is seeded by `db:seed:portfolio`, which files
		// three peer-about-peer reports and whose reset removes them in both
		// directions -- an empty queue is an honest state but it does not show
		// the feature. Never the owner as subject: a portfolio frame must not
		// show its author reported. One names a peer routine the owner cannot
		// read, so the no-bypass rule is visible in the screenshot itself.
		slug: 'moderation-queue',
		route: '/moderation',
		features: ['TRUST-04', 'PROF-10'],
		ready: ['same privacy rules', 'Reports'],
		caption:
			'The moderation queue: reports to review under the same privacy rules as any member, with every action kept in an uneditable record.',
	},
	{
		slug: 'exercise-detail',
		route: '/exercises/:exercise',
		features: ['EXER-01', 'EXER-07', 'PROG-02'],
		ready: ['Your best', 'Best set', 'Estimated 1RM'],
		caption:
			"A trained exercise's best set, estimated 1RM, recent sessions and progression.",
	},
	{
		slug: 'training-signals',
		route: '/progress#training-signals',
		features: ['PROG-10', 'PROG-09'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Training signals' })
				.evaluate(heading =>
					heading.closest('section')?.scrollIntoView({ block: 'center' }),
				)
		},
		ready: ['Training signals', 'They state what changed, not why.'],
		caption:
			'Effort, rep targets, declining lifts and workouts over the last two fortnights, each with its numbers and thresholds and never a cause.',
	},
	{
		slug: 'training-partner-profile',
		route: '/profile/ken-watanabe',
		features: ['SOC-08', 'SOC-09'],
		ready: ['Training Partner', 'Send Encouragement'],
		caption:
			'An active training partner profile with the four-prompt encouragement action granted by that partner.',
	},
	{
		slug: 'member-profile',
		route: '/members/:username',
		features: ['PROF-12', 'PROF-04', 'PROF-05', 'PROF-06', 'PROF-11'],
		signedOut: true,
		ready: [/@/, /Workouts|Sessions|Volume/, 'Share Profile Card'],
		caption:
			'The public member profile as a signed-out visitor sees it, with a branded image card ready to share or download.',
	},
	{
		slug: 'training-partners-settings',
		route: '/settings#training-partners',
		features: ['SOC-08'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Training Partners' })
				.scrollIntoViewIfNeeded()
		},
		ready: ['Training Partners', 'A request shares nothing by itself.'],
		caption:
			'Training-partner requests and independent access controls for schedule, progress, activity, routines and encouragement.',
	},
	{
		slug: 'download-data-settings',
		route: '/settings',
		features: ['EXPORT-01'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Download Your Data' })
				.scrollIntoViewIfNeeded()
		},
		ready: ['Download Your Data', 'Download My Data'],
		caption:
			'Download everything you own as one versioned JSON file, directly above account deletion.',
	},
	{
		slug: 'delete-account-settings',
		route: '/settings',
		features: ['TRUST-01'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Delete Account' })
				.scrollIntoViewIfNeeded()
		},
		ready: ['Delete Account', 'cannot be undone'],
		caption:
			'Account deletion: immediate and complete, confirmed by typing the username, and refused for a moderator account.',
	},
	// Last on purpose: while the scratch session is live every other protected
	// page shows its Resume banner, so nothing may be captured after a failed
	// cleanup. The spec also stops the run if the session survives.
	{
		slug: 'live-session',
		route: '/workouts/sessions/:session',
		openAt: '/routines',
		features: ['LIVE-00', 'LIVE-01', 'LIVE-03', 'LIVE-04', 'LIVE-05'],
		mutates: true,
		setup: startScratchSession,
		ready: [/^Target: /, 'Discard'],
		caption:
			'A live session with three sets logged, the rest timer and last-time comparison.',
	},
]
