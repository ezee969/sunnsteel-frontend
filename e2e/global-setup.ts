import type { FullConfig } from '@playwright/test'

import { assertSeedNewerThanLastCapture, runsProject } from './preconditions'

/**
 * Run-level preconditions, checked once before any worker starts.
 *
 * The seed check cannot live in the spec's `beforeAll`. Playwright replaces the
 * worker after a failed test, and the worker it discards flushes the manifest
 * on the way out — so the retry compares the seed against timestamps this very
 * run just wrote, and refuses to continue. Here the manifest is still whatever
 * the previous run left behind, which is what the check is about.
 */
export default function globalSetup(config: FullConfig) {
	const configured = config.projects.map(project => project.name)
	if (!runsProject(config.argv, configured, 'portfolio')) return
	assertSeedNewerThanLastCapture('docs/portfolio/manifest.json')
}
