import { defineConfig } from '@playwright/test'

import type { CaptureOptions } from './e2e/fixtures'

/**
 * Playwright exists in this repo for the UI restyle (see
 * docs/ui-restyle-plan.md): reproducible screenshots (`before` / `after`) and,
 * since Phase 14, a regression sweep of layout and interaction states
 * (`regression`). It runs against the local dev server and is not part of
 * `npm run verify` or CI. Vitest stays Node-only for logic, auth orchestration
 * and contracts — that boundary is deliberate and documented in
 * docs/roadmaps/technical-debt.md.
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
	// Each project names its spec: without `testMatch`, `--project=after` would
	// also run the regression sweep, and the sweep would write screenshots.
	projects: [
		{
			name: 'before',
			testMatch: 'baseline.spec.ts',
			use: { captureDir: 'before' },
		},
		{
			name: 'after',
			testMatch: 'baseline.spec.ts',
			use: { captureDir: 'after' },
		},
		{
			name: 'regression',
			testMatch: 'regression.spec.ts',
			// The first request to each route compiles it under Turbopack.
			use: { navigationTimeout: 90_000 },
		},
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
