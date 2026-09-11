import { existsSync } from 'node:fs'

import type { Page } from '@playwright/test'

import { ID_ENV, resolvePath, ROUTES, THEMES, WIDTHS } from './capture-targets'
import { expect, test } from './fixtures'
import { findActiveSessionId, STATE_PATH } from './preconditions'

/**
 * `/login` must be captured signed OUT. `middleware.ts` redirects an
 * authenticated visitor from `/login` to `/dashboard`, so reusing the saved
 * session here silently produces six more copies of the dashboard under the
 * login name — which is exactly what the first run did.
 */
const SIGNED_OUT_SLUGS = new Set(['login'])

/** Ceiling for the grown viewport, so a runaway page cannot produce a 40k image. */
const MAX_CAPTURE_HEIGHT = 8000

test.use({ storageState: existsSync(STATE_PATH) ? STATE_PATH : undefined })

/**
 * TD-34: a live workout session changes what most captures show — `/workouts`
 * redirects into it and every other protected page grows a "Resume" banner —
 * so a run under one produces plausible images that match nothing in
 * `before/`. The only deliberate exception is capturing the session screen
 * itself, declared by pointing UI_SESSION_ID at the live session.
 */
let activeSessionId: string | null = null

test.beforeAll(async ({ browser }) => {
	// Also throws when the saved sign-in is missing or expired — without one
	// every protected route redirects to /login and the run would silently
	// capture sixty copies of the login page.
	activeSessionId = await findActiveSessionId(browser)
	if (activeSessionId && activeSessionId !== process.env.UI_SESSION_ID) {
		throw new Error(
			`A workout session (${activeSessionId}) is active. Finish or discard ` +
				'it before capturing, or set UI_SESSION_ID to it to capture the ' +
				'session screen on purpose.',
		)
	}
})

async function capture(
	page: Page,
	opts: {
		path: string
		slug: string
		width: number
		theme: string
		captureDir: string
		expectSignedOut: boolean
	},
) {
	// next-themes is configured with attribute="class" and the default storage
	// key, so seeding localStorage before any app script runs gives a
	// deterministic theme with no flash. Emulating prefers-color-scheme alone
	// would not work: the dark variant is `&:is(.dark *)`, which keys off the
	// class, not the media query.
	await page.addInitScript(value => {
		try {
			window.localStorage.setItem('theme', value)
		} catch {
			// Private mode or blocked storage: fall through to the default theme
			// rather than failing the capture.
		}
	}, opts.theme)
	await page.emulateMedia({ colorScheme: opts.theme as 'light' | 'dark' })
	await page.setViewportSize({ width: opts.width, height: 900 })

	await page.goto(opts.path, { waitUntil: 'networkidle' })

	if (opts.expectSignedOut) {
		await expect(
			page,
			`${opts.slug} did not stay signed out — the fresh context inherited a ` +
				'session, so this would capture the dashboard instead.',
		).toHaveURL(/\/login/)
	} else {
		await expect(
			page,
			`${opts.slug} redirected to /login — the saved session has expired. ` +
				'Re-run "npm run ui:login".',
		).not.toHaveURL(/\/login/)
	}

	// The app animates in (`animate-in`, framer-motion on a couple of screens).
	// Let it settle so the baseline is not a half-faded frame.
	await page.waitForTimeout(600)

	// `fullPage` alone is useless on the authenticated shell: the protected
	// layout is `flex h-screen` with an inner `<main class="flex-1
	// overflow-auto">`, so the document never grows and a "full page" shot is
	// just the viewport. Grow the viewport to the content instead, which makes
	// `h-screen` expand and reveals everything below the fold.
	const needed = await page.evaluate(() => {
		const doc = document.documentElement.scrollHeight
		const main = document.querySelector('main')
		const hidden = main ? main.scrollHeight - main.clientHeight : 0
		return Math.ceil(doc + Math.max(0, hidden))
	})
	const height = Math.min(Math.max(needed, 900), MAX_CAPTURE_HEIGHT)
	if (height > 900) {
		await page.setViewportSize({ width: opts.width, height })
		// Reflow after the resize, then let any lazy content settle.
		await page.waitForTimeout(400)
	}

	await page.screenshot({
		path:
			`docs/ui-restyle/screenshots/${opts.captureDir}/` +
			`${opts.slug}-${opts.width}-${opts.theme}.png`,
		fullPage: true,
		animations: 'disabled',
	})
}

for (const target of ROUTES) {
	const path = resolvePath(target)

	// A route that needs an id we do not have is left out of the run. This must
	// not use `test.skip()`: called at module scope it skips the whole file, not
	// this route.
	if (path === null) {
		const env = target.requiresId ? ID_ENV[target.requiresId] : 'an id'
		console.warn(`skipping ${target.slug}: set ${env} to capture it`)
		continue
	}

	const signedOut = SIGNED_OUT_SLUGS.has(target.slug)

	for (const width of WIDTHS) {
		for (const theme of THEMES) {
			test(`${target.slug} @ ${width} ${theme}`, async ({
				browser,
				page,
				captureDir,
			}) => {
				// Only the session screen (which hides the banner) and signed-out
				// routes are valid while the declared session is live.
				if (
					activeSessionId &&
					!signedOut &&
					!path.startsWith('/workouts/sessions/')
				) {
					throw new Error(
						`${target.slug} cannot be captured while session ` +
							`${activeSessionId} is active: /workouts redirects into it and ` +
							'every other page shows its Resume banner. Capture the session ' +
							'screen alone (--grep session), then finish the session.',
					)
				}

				const shared = {
					path,
					slug: target.slug,
					width,
					theme,
					captureDir,
					expectSignedOut: signedOut,
				}

				if (!signedOut) {
					await capture(page, shared)
					return
				}

				// A context built without the saved storage state, so the app sees a
				// visitor with no session at all.
				// A manually created context does not inherit `use.baseURL` from the
				// config, so relative navigation would fail without this.
				const context = await browser.newContext({
					baseURL: process.env.UI_BASE_URL ?? 'http://localhost:3000',
					deviceScaleFactor: 1,
					storageState: undefined,
				})
				try {
					await capture(await context.newPage(), shared)
				} finally {
					await context.close()
				}
			})
		}
	}
}
