import { existsSync } from 'node:fs'

import type { Browser, Locator, Page, TestInfo } from '@playwright/test'
import { USERNAME_PATTERN_SOURCE } from '@sunsteel/contracts'

import { REGRESSION_WIDTHS, THEMES } from './capture-targets'
import { expect, test as base } from './fixtures'
import { BASE_URL, findActiveSessionId, STATE_PATH } from './preconditions'

/**
 * Phase 14 — the automated regression sweep (docs/ui-restyle-plan.md).
 *
 * Asserts, at every width in REGRESSION_WIDTHS: no horizontal overflow, no
 * console errors or uncaught exceptions, navigation, dialogs, dropdown
 * placement, hover and keyboard-focus states, and the mobile drawer.
 *
 * This is a regression net for a UI-only restyle, so it checks what the app
 * already does. A failure here is a finding to report, not a test to relax:
 * do not loosen an assertion to make a run pass.
 *
 *   npm run ui:regression      (dev server and backend running, signed in)
 */

type Theme = (typeof THEMES)[number]

type ConsoleLog = { errors: string[]; warnings: string[] }

type Ids = { history?: string; routine?: string; username?: string }

/** `hooks/use-sidebar.ts` swaps the sidebar for a drawer below 768. */
const MOBILE_MAX = 767

const VIEWPORT_HEIGHT = 900

/** §11.9: dialogs are inset from the viewport by 16px at every width. */
const DIALOG_INSET = 16

const ids: Ids = {}

function pathOf(page: Page) {
	try {
		return new URL(page.url()).pathname
	} catch {
		return page.url()
	}
}

function watchConsole(page: Page): ConsoleLog {
	const log: ConsoleLog = { errors: [], warnings: [] }
	page.on('console', message => {
		if (message.type() === 'error') {
			log.errors.push(`${pathOf(page)} console.error: ${message.text()}`)
		} else if (message.type() === 'warning') {
			log.warnings.push(`${pathOf(page)} ${message.text()}`)
		}
	})
	page.on('pageerror', error => {
		log.errors.push(`${pathOf(page)} uncaught: ${error.message}`)
	})
	return log
}

/**
 * Errors fail the test. Warnings are recorded as annotations, because the
 * plan's bar is "no new console errors" and React's dev warnings are warnings.
 */
function reportConsole(log: ConsoleLog, testInfo: TestInfo) {
	for (const warning of new Set(log.warnings)) {
		testInfo.annotations.push({
			type: 'console warning',
			description: warning.slice(0, 400),
		})
	}
	expect(log.errors, 'console errors or uncaught exceptions').toEqual([])
}

/** Every test's own page is watched automatically, interactions included. */
const test = base.extend<{ consoleLog: ConsoleLog }>({
	consoleLog: [
		async ({ page }, use, testInfo) => {
			const log = watchConsole(page)
			await use(log)
			reportConsole(log, testInfo)
		},
		{ auto: true },
	],
})

test.use({ storageState: existsSync(STATE_PATH) ? STATE_PATH : undefined })

test.beforeAll(async ({ browser }) => {
	const active = await findActiveSessionId(browser)
	if (active) {
		throw new Error(
			`A workout session (${active}) is active. It redirects /workouts, adds ` +
				'a banner to every protected page and changes what the navigation ' +
				'checks mean. Finish or discard it, then re-run.',
		)
	}
	Object.assign(ids, await discoverIds(browser))
})

/** Finds seeded records to reach the routes that need an id. */
async function discoverIds(browser: Browser): Promise<Ids> {
	const context = await browser.newContext({
		baseURL: BASE_URL,
		storageState: STATE_PATH,
		viewport: { width: 1440, height: VIEWPORT_HEIGHT },
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
			found.history = pathOf(page).split('/').pop()
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

async function prepare(page: Page, width: number, theme: Theme) {
	// next-themes keys the dark variant off a class, not the media query, so
	// seed its storage before any app script runs (same as baseline.spec.ts).
	await page.addInitScript(value => {
		try {
			window.localStorage.setItem('theme', value)
		} catch {
			// Blocked storage: fall through to the default theme.
		}
	}, theme)
	await page.emulateMedia({ colorScheme: theme })
	await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
}

/**
 * Below 1024 every full load starts with `InitialLoadAnimation`'s splash, a
 * fixed overlay above the whole app for ~1.7s. Nothing underneath is clickable
 * until it has gone, so every check waits for it.
 */
async function settle(page: Page) {
	await expect(
		page.getByText('Preparing Your Journey'),
		'the mobile splash never cleared',
	).toHaveCount(0, { timeout: 15_000 })
	// The content layer fades in over 500ms as the splash leaves.
	await page.waitForTimeout(250)
}

async function load(page: Page, path: string) {
	await page.goto(path, { waitUntil: 'networkidle' })
	await settle(page)
}

/** Resolves once CSS and Web Animations on the element have finished. */
async function animationsDone(locator: Locator) {
	await locator.evaluate(element =>
		Promise.all(
			element
				.getAnimations({ subtree: true })
				.filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
				.map(a => a.finished.catch(() => undefined)),
		),
	)
}

async function box(locator: Locator, label: string) {
	const rect = await locator.boundingBox()
	expect(rect, `${label} has no layout box`).not.toBeNull()
	return rect!
}

async function expectWithinViewport(
	page: Page,
	locator: Locator,
	label: string,
	inset = 0,
) {
	await animationsDone(locator)
	const rect = await box(locator, label)
	const viewport = page.viewportSize()!
	expect.soft(rect.x, `${label}: left edge`).toBeGreaterThanOrEqual(inset - 0.5)
	expect
		.soft(rect.x + rect.width, `${label}: right edge`)
		.toBeLessThanOrEqual(viewport.width - inset + 0.5)
	expect.soft(rect.y, `${label}: top edge`).toBeGreaterThanOrEqual(-0.5)
	expect
		.soft(rect.y + rect.height, `${label}: bottom edge`)
		.toBeLessThanOrEqual(viewport.height + 0.5)
}

/** True when a computed `box-shadow` paints something visible. */
function paintsShadow(value: string) {
	if (!value || value === 'none') return false
	return value.split(/,(?![^(]*\))/).some(part => {
		const color = part.match(/(rgba?|oklch|oklab|lab|lch|hsla?|color)\([^)]*\)/)
		const transparent =
			!!color &&
			(/rgba\([^)]*,\s*0\)$/.test(color[0]) || /\/\s*0\)$/.test(color[0]))
		const lengths = part.replace(color?.[0] ?? '', '').match(/-?[\d.]+px/g)
		const blur = parseFloat(lengths?.[2] ?? '0')
		const spread = parseFloat(lengths?.[3] ?? '0')
		return !transparent && (blur > 0 || spread > 0)
	})
}

type FocusStyle = { visible: boolean; shadow: string; outline: string }

async function focusStyle(locator: Locator): Promise<FocusStyle> {
	return locator.evaluate(element => {
		const style = getComputedStyle(element)
		return {
			visible: element.matches(':focus-visible'),
			shadow: style.boxShadow,
			outline:
				style.outlineStyle === 'none'
					? 'none'
					: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
		}
	})
}

/** A keyboard-focused control must match :focus-visible and paint a ring. */
async function expectFocusIndicator(locator: Locator, label: string) {
	const focused = await focusStyle(locator)
	expect.soft(focused.visible, `${label}: not :focus-visible`).toBe(true)
	expect
		.soft(
			paintsShadow(focused.shadow) || focused.outline !== 'none',
			`${label}: no visible focus indicator (box-shadow ${focused.shadow}, ` +
				`outline ${focused.outline})`,
		)
		.toBe(true)
	return focused
}

/**
 * Presses Tab until the focused element matches `selector`. Returns the
 * elements focused on the way that sat outside the viewport — a focus ring
 * nobody can see.
 */
async function tabTo(
	page: Page,
	selector: string,
	{ backwards = false, max = 80 } = {},
) {
	const offscreen: string[] = []
	for (let i = 0; i < max; i++) {
		await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab')
		const state = await page.evaluate(target => {
			const active = document.activeElement
			if (!active || active === document.body) return null
			const rect = active.getBoundingClientRect()
			const inView =
				rect.right > 0 &&
				rect.bottom > 0 &&
				rect.left < window.innerWidth &&
				rect.top < window.innerHeight
			const name =
				active.getAttribute('aria-label') ??
				(active.textContent ?? '').trim().slice(0, 30)
			return {
				done: active.matches(target),
				inView,
				name: `${active.tagName.toLowerCase()} "${name}"`,
			}
		}, selector)
		// `nextjs-portal` is Next's development indicator, injected by `next dev`
		// and absent from a production build; it is tooling, not the app.
		if (state && !state.inView && !state.name.startsWith('nextjs-portal')) {
			offscreen.push(state.name)
		}
		if (state?.done) return { reached: true, offscreen }
	}
	return { reached: false, offscreen }
}

function sidebarNav(page: Page) {
	return page.locator('nav', {
		has: page.getByRole('link', { name: 'Dashboard', exact: true }),
	})
}

function sidebarLink(page: Page, name: string) {
	return sidebarNav(page).getByRole('link', { name, exact: true })
}

function sidebarPanel(page: Page) {
	return page.locator('div.fixed.inset-y-0', { has: sidebarNav(page) })
}

async function openDrawer(page: Page) {
	await page.getByRole('button', { name: 'Toggle Menu' }).click()
	await expect
		.poll(async () => (await sidebarLink(page, 'Dashboard').boundingBox())?.x, {
			message: 'the drawer did not slide into view',
		})
		.toBeGreaterThanOrEqual(0)
}

async function expectDrawerClosed(page: Page) {
	await expect
		.poll(
			async () => {
				const rect = await sidebarLink(page, 'Dashboard').boundingBox()
				return rect ? rect.x + rect.width : 0
			},
			{ message: 'the drawer is still on screen' },
		)
		.toBeLessThanOrEqual(0)
	await expect(page.locator('.bg-scrim')).toHaveCount(0)
}

/**
 * A dropdown opens attached to its trigger, end-aligned (every menu here uses
 * `align="end"`), inside the viewport; Escape closes it and returns focus.
 */
async function checkMenu(page: Page, trigger: Locator, label: string) {
	// Measured before opening: an open Radix menu marks everything outside it
	// `aria-hidden`, so a role-based locator for the trigger finds nothing until
	// the menu closes. Opening a menu does not move its trigger.
	const t = await box(trigger, `${label} trigger`)
	await trigger.click()
	const menu = page.getByRole('menu')
	await expect(menu, `${label} did not open`).toBeVisible()
	await expectWithinViewport(page, menu, label)

	const m = await box(menu, label)
	const below = m.y - (t.y + t.height)
	const above = t.y - (m.y + m.height)
	expect
		.soft(
			(below >= 0 && below <= 12) || (above >= 0 && above <= 12),
			`${label} is detached from its trigger (gap below ${below}px, above ${above}px)`,
		)
		.toBe(true)
	expect
		.soft(
			Math.abs(m.x + m.width - (t.x + t.width)),
			`${label} is not end-aligned with its trigger`,
		)
		.toBeLessThanOrEqual(2)

	await page.keyboard.press('Escape')
	await expect(menu, `${label} did not close on Escape`).toHaveCount(0)
	await expect(trigger, `${label} did not return focus`).toBeFocused()
}

async function expectHoverState(
	page: Page,
	target: Locator,
	property: string,
	label: string,
) {
	await page.mouse.move(1, VIEWPORT_HEIGHT - 1)
	const read = () =>
		target.evaluate(
			(element, name) => getComputedStyle(element).getPropertyValue(name),
			property,
		)
	const resting = await read()
	await target.hover()
	await expect
		.poll(read, { message: `${label} shows no hover state (${property})` })
		.not.toBe(resting)
}

// ---------------------------------------------------------------------------
// Layout: overflow, console, rendered content — every route, width and theme.
// ---------------------------------------------------------------------------

type SweepRoute = {
	slug: string
	path: (found: Ids) => string | undefined
	signedOut?: boolean
	/** Why `path` can come back empty. */
	needs?: string
}

const ROUTES: SweepRoute[] = [
	{ slug: 'login', path: () => '/login', signedOut: true },
	{ slug: 'signup', path: () => '/signup', signedOut: true },
	{
		slug: 'members',
		path: found => found.username && `/members/${found.username}`,
		signedOut: true,
		needs: 'a username, read from /profile',
	},
	{ slug: 'dashboard', path: () => '/dashboard' },
	{ slug: 'routines', path: () => '/routines' },
	{ slug: 'routines-new', path: () => '/routines/new' },
	{
		slug: 'routine-detail',
		path: found => found.routine && `/routines/${found.routine}`,
		needs: 'at least one routine',
	},
	{
		slug: 'routine-edit',
		path: found => found.routine && `/routines/edit/${found.routine}`,
		needs: 'at least one routine',
	},
	{ slug: 'workouts', path: () => '/workouts' },
	{ slug: 'history', path: () => '/workouts/history' },
	{
		slug: 'history-detail',
		path: found => found.history && `/workouts/history/${found.history}`,
		needs: 'at least one finished session',
	},
	{
		// The session screen renders any session by id; a finished one shows it
		// with real data and without starting anything.
		slug: 'session',
		path: found => found.history && `/workouts/sessions/${found.history}`,
		needs: 'at least one finished session',
	},
	{ slug: 'progress', path: () => '/progress' },
	{ slug: 'profile', path: () => '/profile' },
	{ slug: 'search', path: () => '/search?q=press' },
	{ slug: 'settings', path: () => '/settings' },
]

async function expectSoundLayout(page: Page) {
	const m = await page.evaluate(() => {
		const doc = document.documentElement
		const main = document.querySelector('main')
		const width = doc.clientWidth
		const label = (element: Element) => {
			const rect = element.getBoundingClientRect()
			const classes =
				typeof element.className === 'string'
					? element.className.split(/\s+/).slice(0, 4).join('.')
					: ''
			return `${element.tagName.toLowerCase()}.${classes} (right ${Math.round(rect.right)})`
		}
		const offenders = [...document.querySelectorAll('body *')]
			.filter(element => {
				const rect = element.getBoundingClientRect()
				return rect.width > 0 && rect.height > 0 && rect.right > width + 1
			})
			.slice(0, 5)
			.map(label)
		const headings = [...document.querySelectorAll('h1')]
			.filter(h => {
				const rect = h.getBoundingClientRect()
				const style = getComputedStyle(h)
				return (
					rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden'
				)
			})
			.map(h => (h.textContent ?? '').trim())
		return {
			width,
			document: doc.scrollWidth,
			main: main && { scroll: main.scrollWidth, client: main.clientWidth },
			offenders,
			headings,
			text: (main ?? document.body).innerText.trim().length,
		}
	})

	const offenders = m.offenders.join(' | ') || 'none found'
	expect
		.soft(m.document, `the document scrolls sideways; widest: ${offenders}`)
		.toBeLessThanOrEqual(m.width + 1)
	if (m.main) {
		expect
			.soft(m.main.scroll, `<main> scrolls sideways; widest: ${offenders}`)
			.toBeLessThanOrEqual(m.main.client + 1)
	}
	expect.soft(m.text, 'the page rendered no content').toBeGreaterThan(0)
	expect
		.soft(m.headings, 'exactly one visible h1 (Phase 13 outline rule)')
		.toHaveLength(1)
}

for (const route of ROUTES) {
	for (const width of REGRESSION_WIDTHS) {
		for (const theme of THEMES) {
			test(`layout ${route.slug} @ ${width} ${theme}`, async ({
				browser,
				page,
			}, testInfo) => {
				const path = route.path(ids)
				expect(path, `${route.slug} needs ${route.needs}`).toBeTruthy()

				if (!route.signedOut) {
					await prepare(page, width, theme)
					await load(page, path!)
					expect(
						pathOf(page),
						'redirected to /login — re-run "npm run ui:login"',
					).not.toMatch(/^\/login/)
					await expectSoundLayout(page)
					return
				}

				// A visitor with no session at all: middleware bounces a signed-in
				// visitor away from /login and /signup.
				const context = await browser.newContext({
					baseURL: BASE_URL,
					storageState: undefined,
				})
				context.setDefaultNavigationTimeout(90_000)
				try {
					const visitor = await context.newPage()
					const log = watchConsole(visitor)
					await prepare(visitor, width, theme)
					await load(visitor, path!)
					expect(pathOf(visitor), `${route.slug} redirected`).toBe(
						path!.split('?')[0],
					)
					await expectSoundLayout(visitor)
					reportConsole(log, testInfo)
				} finally {
					await context.close()
				}
			})
		}
	}
}

// ---------------------------------------------------------------------------
// Interactions, once per width.
// ---------------------------------------------------------------------------

const NAV_TARGETS: Array<[string, RegExp]> = [
	['Routines', /\/routines$/],
	['History', /\/workouts\/history$/],
	['Progress', /\/progress$/],
	['Settings', /\/settings$/],
	['Dashboard', /\/dashboard$/],
]

for (const width of REGRESSION_WIDTHS) {
	const mobile = width <= MOBILE_MAX

	test(`navigation @ ${width}`, async ({ page }) => {
		await prepare(page, width, 'light')
		await load(page, '/dashboard')

		for (const [name, url] of NAV_TARGETS) {
			if (mobile) await openDrawer(page)
			await sidebarLink(page, name).click()
			await expect(page, `${name} did not navigate`).toHaveURL(url)
			await page.waitForLoadState('networkidle')
			if (mobile) {
				await expectDrawerClosed(page)
			} else {
				await expect(sidebarLink(page, name)).toHaveAttribute(
					'aria-current',
					'page',
				)
			}
		}

		// A destination reached through a dropdown rather than the sidebar.
		await page.getByRole('button', { name: 'Account menu' }).click()
		await page.getByRole('menuitem', { name: 'Profile' }).click()
		await expect(page).toHaveURL(/\/profile$/)
	})

	if (mobile) {
		test(`mobile drawer @ ${width}`, async ({ page }) => {
			await prepare(page, width, 'light')
			await load(page, '/dashboard')

			const toggle = page.getByRole('button', { name: 'Toggle Menu' })
			await expect(toggle).toBeVisible()
			const t = await box(toggle, 'menu button')
			expect.soft(t.width, 'menu button width').toBeGreaterThanOrEqual(44)
			expect.soft(t.height, 'menu button height').toBeGreaterThanOrEqual(44)

			await openDrawer(page)
			const panel = await box(sidebarPanel(page), 'drawer')
			expect.soft(panel.x, 'drawer left edge').toBe(0)
			expect
				.soft(panel.width, 'drawer width (85%, max 300px)')
				.toBeLessThanOrEqual(Math.min(300, width * 0.85) + 1)
			await expect(page.locator('.bg-scrim')).toBeVisible()
			await expectWithinViewport(
				page,
				sidebarLink(page, 'Settings'),
				'Settings',
			)

			// Tapping the scrim beside the drawer dismisses it.
			await page.mouse.click(width - 8, VIEWPORT_HEIGHT / 2)
			await expectDrawerClosed(page)
		})

		test(`mobile drawer close control @ ${width}`, async ({ page }) => {
			await prepare(page, width, 'light')
			await load(page, '/dashboard')
			await openDrawer(page)
			const close = page.getByRole('button', { name: 'Close navigation' })
			await expect(
				close,
				'Sidebar.tsx renders "Close navigation" only when isSidebarOpen && ' +
					'isMobile, and use-sidebar.ts sets isSidebarOpen false below 768',
			).toBeVisible()
			await close.click()
			await expectDrawerClosed(page)
		})
	} else {
		test(`desktop sidebar @ ${width}`, async ({ page }) => {
			await prepare(page, width, 'light')
			await load(page, '/dashboard')

			await expect(
				page.getByRole('button', { name: 'Toggle Menu' }),
			).toHaveCount(0)
			await expectWithinViewport(page, sidebarPanel(page), 'sidebar')

			const main = page.locator('main')
			const expectColumns = async (sidebarWidth: number) => {
				await expect
					.poll(async () => (await box(sidebarPanel(page), 'sidebar')).width)
					.toBe(sidebarWidth)
				await expect
					.poll(async () => (await box(main, 'main')).x, {
						message: 'the content column does not start at the sidebar edge',
					})
					.toBe(sidebarWidth)
			}

			await expectColumns(256)
			await page.getByRole('button', { name: 'Collapse sidebar' }).click()
			await expectColumns(80)
			await page.getByRole('button', { name: 'Expand sidebar' }).click()
			await expectColumns(256)
		})
	}

	test(`alert dialog @ ${width}`, async ({ page }) => {
		await prepare(page, width, 'light')
		await load(page, '/routines')

		const actions = page.getByRole('button', { name: 'Routine actions' })
		const routines = await actions.count()
		expect(routines, 'needs at least one routine').toBeGreaterThan(0)

		// Opens the delete confirmation and closes it without confirming, twice.
		// Nothing here ever presses Delete.
		for (const dismiss of ['Escape', 'Cancel'] as const) {
			await actions.first().click()
			await page.getByRole('menuitem', { name: 'Delete' }).click()
			const dialog = page.getByRole('alertdialog')
			await expect(dialog).toBeVisible()
			await expect(
				page.locator('[data-slot="alert-dialog-overlay"]'),
			).toBeVisible()
			await expectWithinViewport(page, dialog, 'alert dialog', DIALOG_INSET)
			await expect
				.poll(() => dialog.evaluate(d => d.contains(document.activeElement)), {
					message: 'focus did not move into the dialog',
				})
				.toBe(true)

			if (dismiss === 'Escape') await page.keyboard.press('Escape')
			else await dialog.getByRole('button', { name: 'Cancel' }).click()
			await expect(dialog, `did not close on ${dismiss}`).toHaveCount(0)
		}

		await expect(actions).toHaveCount(routines)
	})

	test(`dialog @ ${width}`, async ({ page }) => {
		expect(ids.history, 'needs at least one finished session').toBeTruthy()
		await prepare(page, width, 'light')
		await load(page, `/workouts/sessions/${ids.history}`)

		const trigger = page
			.getByRole('button', { name: /^Calculate plates for / })
			.first()
		await expect(
			trigger,
			'the discovered session has no weighted exercise to open the plate calculator on',
		).toBeVisible()

		for (const dismiss of ['Escape', 'outside click'] as const) {
			await trigger.click()
			const dialog = page.getByRole('dialog')
			await expect(dialog).toBeVisible()
			await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible()
			await expectWithinViewport(page, dialog, 'dialog', DIALOG_INSET)
			await expect
				.poll(() => dialog.evaluate(d => d.contains(document.activeElement)), {
					message: 'focus did not move into the dialog',
				})
				.toBe(true)

			if (dismiss === 'Escape') await page.keyboard.press('Escape')
			else await page.mouse.click(4, 4)
			await expect(dialog, `did not close on ${dismiss}`).toHaveCount(0)
		}
	})

	test(`dropdowns @ ${width}`, async ({ page }) => {
		await prepare(page, width, 'light')
		await load(page, '/routines')

		await checkMenu(
			page,
			page.getByRole('button', { name: 'Account menu' }),
			'account menu',
		)
		await checkMenu(
			page,
			page.getByRole('button', { name: 'Routine actions' }).first(),
			'routine actions menu',
		)

		// The header search suggestions are a custom panel, not a Radix menu.
		const search = page.getByPlaceholder('Search by name or @username...')
		await search.fill('ez')
		const panel = page
			.locator('div.top-full')
			.filter({ hasText: /Top Results|No users found/ })
		await expect(panel, 'search suggestions did not open').toBeVisible({
			timeout: 10_000,
		})
		await expect(async () => {
			const field = await box(search, 'search field')
			const suggestions = await box(panel, 'search suggestions')
			const gap = suggestions.y - (field.y + field.height)
			expect(
				gap,
				'suggestions are detached from the field',
			).toBeGreaterThanOrEqual(0)
			expect(gap).toBeLessThanOrEqual(12)
			expect(suggestions.x).toBeGreaterThanOrEqual(-0.5)
			expect(suggestions.x + suggestions.width).toBeLessThanOrEqual(width + 0.5)
		}).toPass({ timeout: 3000 })

		await page.mouse.click(width - 8, VIEWPORT_HEIGHT - 8)
		await expect(
			panel,
			'suggestions did not close on an outside click',
		).toHaveCount(0)
	})

	test(`hover @ ${width}`, async ({ page }) => {
		await prepare(page, width, 'light')
		await load(page, '/routines')

		const row = page
			.getByRole('button', { name: 'Routine actions' })
			.first()
			.locator('xpath=ancestor::div[contains(@class, "rule-row")][1]')
		await expectHoverState(page, row, 'background-color', 'routine row')

		if (mobile) await openDrawer(page)
		await expectHoverState(
			page,
			sidebarLink(page, 'History'),
			'background-color',
			'sidebar item',
		)
	})

	for (const theme of THEMES) {
		test(`keyboard focus @ ${width} ${theme}`, async ({ page }) => {
			await prepare(page, width, theme)
			await load(page, '/routines')

			const toTrigger = await tabTo(page, '[aria-label="Account menu"]')
			expect(toTrigger.reached, 'Tab never reached the account menu').toBe(true)
			expect
				.soft(
					toTrigger.offscreen,
					'Tab stops outside the viewport, where their focus ring cannot be seen',
				)
				.toEqual([])

			const trigger = page.getByRole('button', { name: 'Account menu' })
			const ring = await expectFocusIndicator(trigger, 'account menu trigger')
			await trigger.evaluate(element => (element as HTMLElement).blur())
			expect
				.soft(
					(await focusStyle(trigger)).shadow,
					'the account menu trigger looks the same focused and blurred',
				)
				.not.toBe(ring.shadow)

			// Menu items (a11y review 4): the keyboard-highlighted row is ringed.
			await trigger.focus()
			await page.keyboard.press('Enter')
			await expect(page.getByRole('menu')).toBeVisible()
			await page.keyboard.press('ArrowDown')
			const item = page.locator('[role="menuitem"]:focus')
			await expect(item).toHaveCount(1)
			// Polled: Radix moves the highlight on the keydown, and the computed
			// style is read a frame later on a slow dev server.
			await expect.soft
				.poll(async () => paintsShadow((await focusStyle(item)).shadow), {
					message: 'the focused menu item has no ring',
				})
				.toBe(true)
			await page.keyboard.press('Escape')
			await expect(trigger).toBeFocused()

			// A text field: the header search sits before the account menu.
			const toField = await tabTo(
				page,
				'input[placeholder^="Search by name"]',
				{
					backwards: true,
					max: 6,
				},
			)
			expect(toField.reached, 'Shift+Tab never reached the search field').toBe(
				true,
			)
			await expectFocusIndicator(
				page.getByPlaceholder('Search by name or @username...'),
				'search field',
			)
		})
	}
}
