import { test as base } from '@playwright/test'

/**
 * `captureDir` selects which screenshot set a run writes to. It is a Playwright
 * project option rather than an environment variable on purpose: `VAR=x cmd`
 * does not work in cmd.exe, and this repo runs on Windows.
 *
 *   npm run ui:capture:before   ->  --project=before
 *   npm run ui:capture:after    ->  --project=after
 */
export type CaptureOptions = {
	captureDir: 'before' | 'after'
}

export const test = base.extend<CaptureOptions>({
	captureDir: ['before', { option: true }],
})

export { expect } from '@playwright/test'
