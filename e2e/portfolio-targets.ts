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
 *
 * With `extraSet` it also adds one set after the first exercise's last
 * (LIVE-15), which the cleanup removes before anything else.
 */
async function startScratchSession(
	page: Page,
	{
		extraSet = false,
		kindMenu = false,
	}: { extraSet?: boolean; kindMenu?: boolean } = {},
): Promise<Cleanup> {
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
	// LIVE-22: the set to log is always the current one, and a finished
	// exercise folds, so rows are found by their names, never by position.
	const logged: string[] = []
	const exerciseOf = (label: string) =>
		label.match(/^Mark set \d+ of (.+) complete$/)?.[1] ?? ''
	const removeExtra = async () => {
		const extra = rows.filter({ hasText: 'Extra' })
		if (!(await extra.count())) return
		// On the current row Remove is a button; off it, it is in the set's menu.
		const button = extra.first().getByRole('button', { name: /^Remove set / })
		if (await button.count()) {
			await button.click()
		} else {
			await extra
				.first()
				.getByRole('button', { name: /^Set \d+, / })
				.click()
			await page.getByRole('menuitem', { name: /^Remove set / }).click()
		}
		await expect(extra).toHaveCount(0)
	}
	const cleanup: Cleanup = async () => {
		await page.keyboard.press('Escape')
		await removeExtra()
		for (const label of logged) {
			const box = page.getByRole('checkbox', { name: label, exact: true })
			if (!(await box.count())) {
				// A finished exercise folds; open it to reach the set. Its toggle
				// is the button in the h3 that names exactly that exercise.
				await page
					.locator('h3')
					.filter({
						has: page.getByText(exerciseOf(label), { exact: true }),
					})
					.getByRole('button', { expanded: false })
					.first()
					.click()
				await expect(box).toBeVisible()
			}
			if ((await box.getAttribute('data-state')) === 'checked') {
				await box.click()
				// Unticking can move the current set and re-render the row, so
				// read the box again rather than holding the old element.
				await expect
					.poll(async () =>
						(await box.count())
							? await box.getAttribute('data-state')
							: 'unchecked',
					)
					.toBe('unchecked')
			}
		}
		await page.waitForLoadState('networkidle')
		await discard()
	}

	try {
		for (let index = 0; index < SETS_TO_LOG; index++) {
			const row = page.locator('[data-state="current"]').first()
			await expect(
				row,
				`The started day has fewer than ${SETS_TO_LOG} sets.`,
			).toBeVisible()
			const reps = row.getByLabel(/: reps$/)
			if (!(await reps.inputValue())) {
				// LIVE-22: a set that matches its exercise's prescription line
				// ("3 × 8 · 60 kg") has no caption of its own.
				const caption = row.getByText(/^Target: /)
				const line = row
					.locator('xpath=ancestor::*[.//h3][1]')
					.getByText(/^\d+ × \d+/)
				const target = (await caption.count())
					? await caption.first().innerText()
					: (((await line.count())
							? (await line.first().innerText()).match(/× (\d+)/)?.[1]
							: '') ?? '')
				await reps.fill(target.match(/\d+/)?.[0] ?? '8')
			}
			const weight = row.getByLabel(/: weight in /)
			// LIVE-22: a pre-filled target is a suggestion shown as the
			// placeholder, and ticking the set logs it. Without one, LIVE-21's
			// tick needs a weight; 0 is a bodyweight set.
			if (
				!(await weight.inputValue()) &&
				!/^\d/.test((await weight.getAttribute('placeholder')) ?? '')
			) {
				await weight.fill('0')
			}
			const box = row.getByRole('checkbox', {
				name: /^Mark set \d+ of .+ complete$/,
			})
			const label = (await box.getAttribute('aria-label')) ?? ''
			await box.click()
			logged.push(label)
			await expect(
				page.getByRole('checkbox', { name: label, exact: true }),
			).toHaveAttribute('data-state', 'checked')
		}
		await page.waitForLoadState('networkidle')
		if (extraSet) {
			await page
				.getByRole('button', { name: /^Add a set to / })
				.first()
				.click()
			const extra = rows.filter({ hasText: 'Extra' }).first()
			await expect(extra).toBeVisible()
			await page.waitForLoadState('networkidle')
			await extra.scrollIntoViewIfNeeded()
		}
		if (kindMenu) {
			// LIVE-12: the current set's kind menu, open; nothing is changed.
			const trigger = page
				.locator('[data-state="current"]')
				.first()
				.getByRole('button', { name: /^Set \d+, / })
			await trigger.scrollIntoViewIfNeeded()
			await trigger.click()
			await expect(page.getByRole('menuitemradio').first()).toBeVisible()
		}
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
			'DASH-05',
			'DASH-11',
			'DASH-06',
			'CORE-03',
		],
		ready: ['finished in all', 'of started workouts', 'lifted in all'],
		caption:
			"The member's rank and what the next one needs, today's workout with one adaptive primary action, the week, a single row of lifetime numbers and records, then the facts behind the last two finished weeks, the next milestones and a few updates from members you follow.",
	},
	{
		slug: 'dashboard-customize',
		route: '/dashboard',
		features: ['DASH-05', 'PREF-03'],
		setup: async page => {
			await page.getByRole('button', { name: 'Customize' }).click()
			const dialog = page.getByRole('dialog', { name: 'Customize dashboard' })
			await expect(dialog.getByText('Reset to default')).toBeVisible()
		},
		// The dialog is portalled outside <main>; setup waits for it.
		ready: ['finished in all', 'of started workouts'],
		caption:
			"Choosing the dashboard's order and which sections it shows, saved to the member's account; Today's Workouts always stays first.",
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
		slug: 'routine-builder-warm-ups',
		route: '/routines/edit/:routine',
		features: ['LIVE-13', 'LIVE-20'],
		setup: async page => {
			await openBuildDaysStep(page)
			// UX-20: warm-ups sit behind the exercise's "More options".
			const more = page
				.getByRole('button', { name: /^More options for / })
				.first()
			await expect(more).toBeVisible()
			await more.click()
			await expect(
				page.getByRole('button', { name: /^Fewer options for / }).first(),
			).toHaveAttribute('aria-expanded', 'true')
			const add = page
				.getByRole('button', { name: /^Add warm-up sets to / })
				.first()
			// The step re-renders once its exercises load; click waits for a
			// stable, attached button.
			await expect(add).toBeVisible()
			await add.click()
			await expect(
				page.getByRole('list', { name: 'Warm-up sets to add' }),
			).toBeVisible()
			// Nothing is inserted: the frame is the preview, closed by the run.
		},
		// The dialog is portalled outside <main>; setup waits for it.
		ready: ['Build Your Training Days', 'Sets'],
		caption:
			'Warm-up ramps: generated from the working load, the bar and your plates, previewed with what goes on each side, and able to follow the working weight as it progresses.',
	},
	{
		slug: 'routine-builder-linear-block',
		route: '/routines/edit/:routine',
		features: ['ROUT-17'],
		setup: async page => {
			await openBuildDaysStep(page)
			const more = page
				.getByRole('button', { name: /^More options for / })
				.first()
			await expect(more).toBeVisible()
			await more.click()
			await page
				.getByRole('combobox', { name: 'Progression scheme' })
				.first()
				.click()
			await page.getByRole('option', { name: '8-week block (LP)' }).click()
			const reference = page
				.getByRole('textbox', { name: /^Reference max for / })
				.first()
			await reference.fill('140')
			await reference.blur()
			const summary = page.getByText(/^Week 1 of 8 · 63%/).first()
			await expect(summary).toBeVisible()
			await summary.scrollIntoViewIfNeeded()
			// Nothing is saved: the frame is the builder's preview of the block.
		},
		ready: ['Build Your Training Days', 'Sets'],
		caption:
			'An 8-week block in the builder: a reference max sets every load, each working set shows its target RIR, and warm-ups stay editable.',
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
			const dialog = page.getByRole('dialog', { name: 'Plan a deload' })
			await expect(dialog.getByText('What changes')).toBeVisible()
		},
		// The dialog is portalled outside <main>; setup waits for it.
		ready: ['Autumn accumulation', 'Plan deload'],
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
		slug: 'search',
		route: '/search?q=press',
		features: ['NAV-01'],
		ready: ['Search results', 'Exercises'],
		caption:
			'One search across members, exercises, routines and your own workouts, each category one tab away.',
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
		features: ['PROG-08', 'PROG-09', 'PROG-10', 'UX-11'],
		ready: ['Plateau watch', /Sessions without a new best/i],
		caption:
			'Progress at a glance: goals, lifts without a new best and training signals, with the other views one tab away.',
	},
	{
		slug: 'progress-strength',
		route: '/progress/strength',
		features: ['PROG-01', 'PROG-02', 'PROG-07', 'UX-11'],
		ready: ['Record & progression timeline'],
		caption:
			'One lift at a time: its best set and estimated 1RM over time, every session behind them and the record timeline.',
	},
	{
		slug: 'progress-load',
		route: '/progress/load',
		features: ['PROG-03', 'PROG-04', 'UX-11'],
		ready: ['Muscle distribution', 'Load volume'],
		caption:
			'How the work spreads across muscles and weeks, with volume compared by muscle, routine and exercise.',
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
		// MSG-01. `db:seed:portfolio` writes one conversation with the training
		// partner, and its reset removes it before the peers go.
		slug: 'messages',
		route: '/messages',
		features: ['MSG-01', 'MSG-06'],
		ready: ['Messages', /Ken/],
		caption:
			'One-to-one conversations with other members, newest first, updated as messages arrive.',
	},
	{
		slug: 'messages-thread',
		route: '/messages',
		// MSG-09 for the report control on each of the partner's messages.
		features: ['MSG-01', 'MSG-09'],
		setup: async page => {
			await page
				.getByRole('link', { name: /Conversation with Ken/ })
				.first()
				.click()
			await page.waitForURL(/\/messages\/[0-9a-f-]{36}$/)
			await page.getByText('Bring chalk.', { exact: false }).waitFor()
		},
		ready: [/aren't end-to-end encrypted/, 'Send'],
		caption:
			'A conversation read as a ruled ledger rather than bubbles, saying plainly that messages are not end-to-end encrypted, with a report control on each message from the other member.',
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
		slug: 'custom-exercise',
		route: '/exercises',
		features: ['EXER-06'],
		setup: async page => {
			const create = page.getByRole('button', { name: 'New exercise' })
			await expect(create).toBeVisible()
			await create.click()
			await expect(
				page.getByRole('dialog', { name: 'New exercise' }),
			).toBeVisible()
			// Nothing is created: the frame is the empty form, closed by the run.
		},
		// The dialog is portalled outside <main>; setup waits for it.
		ready: ['Catalog'],
		caption:
			'Custom exercises: a movement the catalog lacks, with its muscles and equipment, private to the member who made it.',
	},
	{
		slug: 'body-progress',
		route: '/progress/body',
		features: ['PROG-12'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Body progress' })
				.evaluate(heading =>
					heading.closest('section')?.scrollIntoView({ block: 'start' }),
				)
		},
		ready: ['Body progress', 'Log measurements'],
		caption:
			'Body weight and measurements over time, read against a body-weight goal, and shared on the profile only when the member chooses.',
	},
	{
		slug: 'training-signals',
		route: '/progress',
		features: ['PROG-10', 'PROG-09'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Training signals' })
				.evaluate(heading =>
					heading.closest('section')?.scrollIntoView({ block: 'center' }),
				)
		},
		// UX-17: the intro's last line and the thresholds are behind "How this
		// works"; the one-line summary is what shows.
		ready: [
			'Training signals',
			'Four measures from your logged workouts',
			'Effort (RPE)',
		],
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
		features: ['PROF-12', 'PROF-04', 'PROF-05', 'PROF-06', 'ACH-10', 'ACH-11'],
		signedOut: true,
		ready: [/@/, /Workouts|Sessions|Volume/, 'Share Profile'],
		caption:
			"The public member profile as a signed-out visitor sees it: the member's rank under their name, and the header dressed in that rank's Renaissance ornament.",
	},
	{
		slug: 'settings-display',
		route: '/settings/account',
		features: ['A11Y-02', 'LIVE-18', 'A11Y-01'],
		ready: ['Display', 'Higher contrast', 'Larger controls'],
		caption:
			"This device's display choices: higher contrast, which also follows the operating system, and larger controls, which turn the workout screen into gym mode.",
	},
	{
		slug: 'settings-privacy',
		route: '/settings/privacy',
		features: ['PROF-06', 'PROF-09', 'UX-12'],
		ready: ['Privacy Overview', 'Profile Privacy'],
		caption:
			'Settings in five tabs; Privacy gathers who can find you and who sees each part of your profile and activity.',
	},
	{
		slug: 'training-partners-settings',
		route: '/settings/privacy#training-partners',
		features: ['SOC-08'],
		setup: async page => {
			await page
				.getByRole('heading', { name: 'Training Partners' })
				.scrollIntoViewIfNeeded()
		},
		// UX-17: the full description is behind "How this works".
		ready: ['Training Partners', 'A request shares nothing.'],
		caption:
			'Training-partner requests and independent access controls for schedule, progress, activity, routines and encouragement.',
	},
	{
		slug: 'download-data-settings',
		route: '/settings/account',
		features: ['EXPORT-01'],
		setup: async page => {
			// A card title is not a heading.
			await page
				.getByText('Download Your Data', { exact: true })
				.scrollIntoViewIfNeeded()
		},
		ready: ['Download Your Data', 'Download my data'],
		caption:
			'Download everything you own as one versioned JSON file, directly above account deletion.',
	},
	{
		slug: 'delete-account-settings',
		route: '/settings/account',
		features: ['TRUST-01'],
		setup: async page => {
			// A card title is not a heading.
			await page
				.getByText('Delete Account', { exact: true })
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
		features: [
			'LIVE-00',
			'LIVE-01',
			'LIVE-03',
			'LIVE-04',
			'LIVE-05',
			'LIVE-22',
		],
		mutates: true,
		setup: startScratchSession,
		// LIVE-22: the masthead's one progress statement ("3 of 12").
		ready: [/^\d+ of \d+$/, 'Discard'],
		caption:
			'A live session built around the current set: the prescription stated once, three sets logged, the rest timer and the last-time comparison.',
	},
	{
		slug: 'live-session-extra-set',
		route: '/workouts/sessions/:session',
		openAt: '/routines',
		features: ['LIVE-15'],
		mutates: true,
		setup: page => startScratchSession(page, { extraSet: true }),
		ready: ['Extra', 'No target', 'Add set'],
		caption:
			'Faster set editing: an extra set added after the prescription, one-tap fills from the set above, and only the last added set removable.',
	},
	{
		slug: 'live-session-set-kinds',
		route: '/workouts/sessions/:session',
		openAt: '/routines',
		features: ['LIVE-12'],
		mutates: true,
		setup: page => startScratchSession(page, { kindMenu: true }),
		// The open menu is portalled outside <main>; setup waits for it.
		// LIVE-22: the masthead's one progress statement ("3 of 12").
		ready: [/^\d+ of \d+$/, 'Discard'],
		caption:
			'Set kinds: any set can be marked warm-up, working, drop or optional, so only intended work reaches progression, records and analytics.',
	},
]
