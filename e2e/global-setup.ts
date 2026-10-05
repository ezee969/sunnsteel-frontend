import type { FullConfig } from '@playwright/test'

import {
	assertSeedNewerThanLastCapture,
	BASE_URL,
	runsProject,
} from './preconditions'

/**
 * The shell's pages: every sidebar destination, the account menu's Profile,
 * and what `discoverIds` opens in each worker's `beforeAll`.
 */
const SHELL_PAGES = [
	'/dashboard',
	'/workouts',
	'/workouts/history',
	'/routines',
	'/routines/discover',
	'/progress',
	'/exercises',
	'/activity',
	'/settings',
	'/profile',
]

/**
 * Compiles the shell's pages one at a time before any worker starts (TD-59).
 *
 * Under `next dev --turbopack` a route compiles on its first request, and when
 * several workers ask for the same uncompiled route at once one of them can
 * get a 500 (`SyntaxError: Unexpected end of JSON input` in the server log),
 * which the sweep then reports as a console error. Asking for each page here,
 * in order, means no worker is ever first. A route that is already compiled
 * answers in well under a second, so a warm server loses almost nothing. The
 * marker cookie is all the middleware reads; the pages fetch their data in the
 * browser, so nothing is signed in or written. A failure here is not this
 * step's to report: the sweep meets the same page and says what is wrong.
 */
async function compileShellPages() {
	for (const path of SHELL_PAGES) {
		await fetch(new URL(path, BASE_URL), {
			headers: { cookie: 'ss_session=1' },
			redirect: 'manual',
			signal: AbortSignal.timeout(90_000),
		}).catch(() => undefined)
	}
}

/**
 * Run-level preconditions, checked once before any worker starts.
 *
 * The seed check cannot live in the spec's `beforeAll`. Playwright replaces the
 * worker after a failed test, and the worker it discards flushes the manifest
 * on the way out — so the retry compares the seed against timestamps this very
 * run just wrote, and refuses to continue. Here the manifest is still whatever
 * the previous run left behind, which is what the check is about.
 */
export default async function globalSetup(config: FullConfig) {
	const configured = config.projects.map(project => project.name)
	if (runsProject(config.argv, configured, 'regression')) {
		await compileShellPages()
	}
	if (!runsProject(config.argv, configured, 'portfolio')) return
	assertSeedNewerThanLastCapture('docs/portfolio/manifest.json')
}
