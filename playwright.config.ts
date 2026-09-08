import { defineConfig } from '@playwright/test'

import type { CaptureOptions } from './e2e/fixtures'

/**
 * Playwright exists in this repo for one purpose: reproducible UI screenshots
 * for the restyle (see docs/ui-restyle-plan.md). It is not a functional test
 * suite. Vitest stays Node-only for logic, auth orchestration and contracts —
 * that boundary is deliberate and documented in docs/roadmaps/technical-debt.md.
 *
 * Specs are named `*.spec.ts` on purpose: vitest includes `**\/*.test.ts`, so the
 * two runners cannot pick up each other's files.
 */
export default defineConfig<CaptureOptions>({
	testDir: './e2e',
	testMatch: '**/*.spec.ts',
	// Screenshots must be deterministic and ordered, so never parallelise them.
	workers: 1,
	fullyParallel: false,
	// A capture run is long; it is not a flaky test suite, so never retry.
	retries: 0,
	timeout: 120_000,
	reporter: [['list']],
	use: {
		baseURL: process.env.UI_BASE_URL ?? 'http://localhost:3000',
		// DPR 1 keeps the committed baseline to a sane size. The plan is explicit
		// about this: a full set at DPR 2 across two themes is tens of megabytes.
		deviceScaleFactor: 1,
		trace: 'off',
		video: 'off',
	},
	projects: [
		{ name: 'before', use: { captureDir: 'before' } },
		{ name: 'after', use: { captureDir: 'after' } },
	],
	webServer: {
		command: 'npm run dev',
		url: process.env.UI_BASE_URL ?? 'http://localhost:3000',
		// Reuse the owner's dev server when one is already up rather than fighting
		// over the same .next/ directory.
		reuseExistingServer: true,
		timeout: 180_000,
		stdout: 'ignore',
		stderr: 'pipe',
	},
})
