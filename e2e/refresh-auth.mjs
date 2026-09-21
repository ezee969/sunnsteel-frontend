/**
 * Renews the saved sign-in without anyone typing a password.
 *
 * The access token in `.auth/state.json` lasts an hour, and a full
 * `ui:regression` run takes longer than that. When it expires mid-run, each
 * new test context refreshes from the same stored refresh token, which rotates
 * it: the PROF-10 sweep lost two cases to a 401 that way, and an earlier slice
 * needed an interactive `npm run ui:login` to recover. Running this first gives
 * the run a full hour of validity.
 *
 * It marks the cached session expired in `localStorage` and reloads, so
 * `supabase-js` renews through **its own** refresh path with the refresh token
 * the app already holds. No password is read, typed or stored.
 *
 * **One context per run, and always persist the state back** — looping several
 * contexts over one saved session rotates the refresh token repeatedly and
 * invalidates the sign-in, which only `npm run ui:login` can undo.
 *
 *   1. npm run dev            (and the backend)
 *   2. npm run ui:refresh
 *   3. npm run ui:regression
 */
import { writeFile } from 'node:fs/promises'

import { chromium } from '@playwright/test'

const BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:3000'
const STATE_PATH = '.auth/state.json'

/**
 * Whether a captured storage state is worth writing over the saved one. A
 * Supabase session lives in `localStorage` under `sb-<ref>-auth-token`; a
 * state without it is a signed-out browser, whatever else it carries.
 */
const holdsSession = state =>
	Boolean(
		state?.origins?.some(origin =>
			origin.localStorage?.some(
				item =>
					item.name?.startsWith('sb-') && item.name.endsWith('-auth-token'),
			),
		),
	)

/** The Supabase session as the browser stores it, whatever the project ref is. */
const readExpiry = page =>
	page.evaluate(() => {
		for (let index = 0; index < localStorage.length; index += 1) {
			const key = localStorage.key(index)
			if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
				return JSON.parse(localStorage.getItem(key)).expires_at ?? null
			}
		}
		return null
	})

const browser = await chromium.launch()
const context = await browser.newContext({
	storageState: STATE_PATH,
	baseURL: BASE_URL,
})
// The first request to a route compiles it under Turbopack, which the default
// 30s navigation timeout does not survive on a cold dev server.
context.setDefaultNavigationTimeout(90_000)
const page = await context.newPage()

try {
	await page.goto('/dashboard', { waitUntil: 'networkidle' })
	// A missing marker cookie lands on /login, where the provider verifies the
	// session and sets it again; waiting for the redirect is what saves it.
	await page.waitForURL(url => !url.pathname.startsWith('/login'), {
		timeout: 45_000,
	})

	const before = await readExpiry(page)
	if (!before) {
		console.error(
			`\nNo Supabase session in ${STATE_PATH}. Sign in once with "npm run ui:login".\n`,
		)
		process.exitCode = 1
	} else {
		await page.evaluate(() => {
			for (let index = 0; index < localStorage.length; index += 1) {
				const key = localStorage.key(index)
				if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
					const session = JSON.parse(localStorage.getItem(key))
					session.expires_at = Math.floor(Date.now() / 1000) - 60
					localStorage.setItem(key, JSON.stringify(session))
				}
			}
		})
		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForURL(url => !url.pathname.startsWith('/login'), {
			timeout: 45_000,
		})
		// The client refreshes on its own schedule; give it a moment to land.
		await page.waitForTimeout(3_000)

		const after = await readExpiry(page)
		if (!after || after <= before) {
			console.error(
				'\nThe session did not renew. Run "npm run ui:login" before a long sweep.\n',
			)
			process.exitCode = 1
		} else {
			console.log(
				`Session renewed. Valid until ${new Date(after * 1000).toISOString()}.`,
			)
		}
	}
} catch (error) {
	console.error(`\nCould not renew the session: ${error.message}\n`)
	process.exitCode = 1
} finally {
	// Written back even on failure, because the context may already hold newer
	// tokens than the file and leaving the file behind would strand them --
	// **but only when it still holds a session at all**. A refresh that fails
	// because the stored refresh token was rejected ends on `/login` with an
	// empty `localStorage`, and writing that back replaces a recoverable
	// sign-in with a signed-out one. That turns "your token expired" into
	// "your saved session is gone", which only an interactive `npm run
	// ui:login` can undo. It cost a sweep exactly that way on 2026-09-21.
	const captured = await context.storageState().catch(() => null)
	if (holdsSession(captured)) {
		await writeFile(STATE_PATH, `${JSON.stringify(captured, null, 2)}\n`)
	} else {
		console.error(
			`Left ${STATE_PATH} as it was: the browser ended without a session, and overwriting it would have discarded the saved sign-in. Run "npm run ui:login" to sign in again.`,
		)
		process.exitCode = 1
	}
	await browser.close()
}
