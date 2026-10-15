import { defineConfig } from '@playwright/test'

/**
 * PLAT-03: the end-to-end check CI runs on every pull request
 * (`.github/workflows/e2e.yml`). Unlike `playwright.config.ts`, it has no
 * global setup, no saved sign-in and no dev server: the workflow builds and
 * starts both apps on a local Supabase and passes a member created for the run
 * through `E2E_EMAIL`/`E2E_PASSWORD`. The visual sweep stays local.
 */
export default defineConfig({
	testDir: './e2e/ci',
	testMatch: '**/*.spec.ts',
	workers: 1,
	fullyParallel: false,
	retries: 0,
	timeout: 240_000,
	expect: { timeout: 15_000 },
	reporter: [
		['list'],
		['html', { open: 'never', outputFolder: 'playwright-report' }],
	],
	use: {
		baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
		locale: 'en-US',
		navigationTimeout: 60_000,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'off',
	},
})
