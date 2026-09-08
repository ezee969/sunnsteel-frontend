/**
 * Opens a real browser window so the owner can sign in once, then stores the
 * resulting session for the capture run.
 *
 * Deliberately a plain .mjs script run by node: no TypeScript step, no extra
 * tooling, and nothing that could be mistaken for a test.
 *
 * The password is typed by the owner into a real browser. It is never read,
 * stored or transmitted by this script — only the resulting cookies and
 * localStorage are written to .auth/state.json, which is gitignored.
 *
 *   1. npm run dev          (in another terminal)
 *   2. npm run ui:login     (this script)
 *   3. npm run ui:capture:before
 */
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { chromium } from '@playwright/test'

const BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:3000'
const STATE_PATH = '.auth/state.json'
const WAIT_MS = 10 * 60 * 1000

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ deviceScaleFactor: 1 })
const page = await context.newPage()

console.log(`\nOpening ${BASE_URL}/login`)
console.log('Sign in in the browser window that just opened.')
console.log('This script is only waiting; it does not read what you type.\n')

await page.goto(`${BASE_URL}/login`)

try {
	// The app redirects to /dashboard once the session marker is set. Waiting on
	// the URL rather than on a selector keeps this working if the login form is
	// restyled, which is the entire point of the project this supports.
	await page.waitForURL(url => !url.pathname.startsWith('/login'), {
		timeout: WAIT_MS,
	})
} catch {
	console.error('\nTimed out waiting for sign-in. Nothing was saved.')
	await browser.close()
	process.exit(1)
}

const cookies = await context.cookies()
const hasMarker = cookies.some(c => c.name === 'ss_session' && c.value === '1')
if (!hasMarker) {
	console.error(
		'\nLeft /login but the ss_session marker cookie is not set, so the capture' +
			'\nrun would be redirected back to /login. Nothing was saved.',
	)
	await browser.close()
	process.exit(1)
}

mkdirSync(dirname(STATE_PATH), { recursive: true })
await context.storageState({ path: STATE_PATH })

console.log(`Signed in. Session saved to ${STATE_PATH} (gitignored).`)
console.log('Next: npm run ui:capture:before\n')

await browser.close()
