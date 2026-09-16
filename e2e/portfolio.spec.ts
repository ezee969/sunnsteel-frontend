import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import type { Page } from '@playwright/test'

import { discoverIds, type Ids } from './discover-ids'
import { expect, test } from './fixtures'
import {
	type Cleanup,
	PORTFOLIO_TARGETS,
	resolveRoute,
} from './portfolio-targets'
import { BASE_URL, findActiveSessionId, STATE_PATH } from './preconditions'
import { seedTheme } from './theme'

/**
 * Portfolio screenshots: one 1440×900 dark viewport frame per entry in
 * portfolio-targets.ts, plus docs/portfolio/manifest.json. Not part of CI.
 *
 *   npm run ui:login                 (once, or when the sign-in has expired)
 *   npm run ui:capture:portfolio     (dev server and backend running)
 *
 * `--grep <slug>` recaptures a subset; the manifest keeps the other entries.
 */

const VIEWPORT = { width: 1440, height: 900 }
const SCREENSHOT_DIR = 'docs/portfolio/screenshots'
const MANIFEST_PATH = 'docs/portfolio/manifest.json'
const PUBLIC_EMAIL = 'eze@sunnsteel.app'

type ManifestEntry = {
	slug: string
	route: string
	features: string[]
	capturedAt: string
	width: number
	height: number
}

const ids: Ids = {}
let ownerEmail = ''
const captured: ManifestEntry[] = []

test.use({ storageState: existsSync(STATE_PATH) ? STATE_PATH : undefined })

/**
 * The owner's address, read from the Supabase session saved by
 * `npm run ui:login` (UI_OWNER_EMAIL overrides it). A run that cannot find it
 * stops: it could not redact what it cannot recognise.
 */
function readOwnerEmail(): string {
	if (process.env.UI_OWNER_EMAIL) return process.env.UI_OWNER_EMAIL
	const state = JSON.parse(readFileSync(STATE_PATH, 'utf8')) as {
		origins: { localStorage: { name: string; value: string }[] }[]
	}
	for (const origin of state.origins) {
		for (const entry of origin.localStorage) {
			if (!/^sb-.+-auth-token$/.test(entry.name)) continue
			const raw = entry.value.startsWith('base64-')
				? Buffer.from(entry.value.slice(7), 'base64').toString('utf8')
				: entry.value
			const email = (JSON.parse(raw) as { user?: { email?: string } }).user
				?.email
			if (email) return email
		}
	}
	throw new Error(
		`No email in the Supabase session at ${STATE_PATH}. Set UI_OWNER_EMAIL ` +
			'so the capture can replace it.',
	)
}

test.beforeAll(async ({ browser }) => {
	// Also throws when the saved sign-in is missing or expired.
	const active = await findActiveSessionId(browser)
	if (active) {
		throw new Error(
			`A workout session (${active}) is active. It adds a Resume banner to ` +
				'every protected page. Finish or discard it, then re-run.',
		)
	}
	ownerEmail = readOwnerEmail()
	Object.assign(ids, await discoverIds(browser))
})

test.afterAll(() => {
	if (captured.length === 0) return
	const previous: ManifestEntry[] = existsSync(MANIFEST_PATH)
		? (JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).screenshots ?? [])
		: []
	const bySlug = new Map(previous.map(entry => [entry.slug, entry]))
	for (const entry of captured) bySlug.set(entry.slug, entry)
	// Target order, and nothing for a target that has been removed.
	const screenshots = PORTFOLIO_TARGETS.flatMap(target => {
		const entry = bySlug.get(target.slug)
		return entry ? [entry] : []
	})
	mkdirSync(dirname(MANIFEST_PATH), { recursive: true })
	writeFileSync(
		MANIFEST_PATH,
		`${JSON.stringify({ generatedBy: 'npm run ui:capture:portfolio', screenshots }, null, '\t')}\n`,
	)
})

/**
 * Everything that must be in place before the first app script runs: the
 * theme, reduced motion, the hidden Next.js dev indicator, and a redaction
 * that rewrites the owner's email in text, attributes and field values as the
 * DOM changes.
 */
async function prepare(page: Page) {
	await seedTheme(page, 'dark')
	await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
	await page.setViewportSize(VIEWPORT)
	await page.addInitScript(
		({ email, replacement }) => {
			const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const contains = new RegExp(escaped, 'i')
			const every = new RegExp(escaped, 'gi')
			const redact = (value: string | null) =>
				value && contains.test(value) ? value.replace(every, replacement) : null
			const scrub = (root: Node) => {
				const walker = document.createTreeWalker(
					root,
					NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
				)
				for (let node: Node | null = root; node; node = walker.nextNode()) {
					if (node.nodeType === Node.TEXT_NODE) {
						const next = redact(node.nodeValue)
						if (next !== null) node.nodeValue = next
						continue
					}
					const element = node as Element
					for (const attr of Array.from(element.attributes)) {
						const next = redact(attr.value)
						if (next !== null) element.setAttribute(attr.name, next)
					}
					if (
						element instanceof HTMLInputElement ||
						element instanceof HTMLTextAreaElement
					) {
						const next = redact(element.value)
						if (next !== null) element.value = next
					}
				}
			}
			const start = () => {
				const style = document.createElement('style')
				style.textContent =
					'nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button] ' +
					'{ display: none !important; }'
				document.head.appendChild(style)
				scrub(document.body)
				new MutationObserver(records => {
					for (const record of records) {
						if (record.type === 'childList') record.addedNodes.forEach(scrub)
						else scrub(record.target)
					}
				}).observe(document.body, {
					subtree: true,
					childList: true,
					characterData: true,
					attributes: true,
				})
			}
			if (document.body) start()
			else document.addEventListener('DOMContentLoaded', start)
		},
		{ email: ownerEmail, replacement: PUBLIC_EMAIL },
	)
}

/** Width and height from the PNG's IHDR chunk. */
function pngSize(path: string) {
	const header = readFileSync(path).subarray(16, 24)
	return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) }
}

async function capture(page: Page, slug: string) {
	// Field values are not DOM mutations, so scrub them once more right before
	// the shot, then prove nothing slipped through.
	await page.evaluate(
		({ email, replacement }) => {
			const pattern = new RegExp(
				email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
				'gi',
			)
			document.querySelectorAll('input, textarea').forEach(field => {
				const input = field as HTMLInputElement
				input.value = input.value.replace(pattern, replacement)
			})
		},
		{ email: ownerEmail, replacement: PUBLIC_EMAIL },
	)
	const leaked = await page.evaluate(email => {
		const needle = email.toLowerCase()
		const fields = Array.from(document.querySelectorAll('input, textarea'))
		return (
			document.body.innerHTML.toLowerCase().includes(needle) ||
			fields.some(f =>
				(f as HTMLInputElement).value.toLowerCase().includes(needle),
			)
		)
	}, ownerEmail)
	expect(leaked, `${slug} still shows the owner's email`).toBe(false)

	const path = `${SCREENSHOT_DIR}/${slug}.png`
	await page.screenshot({ path, fullPage: false, animations: 'disabled' })
	return { path, ...pngSize(path) }
}

for (const target of PORTFOLIO_TARGETS) {
	test(`portfolio ${target.slug}`, async ({ browser, page }) => {
		const resolved = resolveRoute(target, ids)
		if ('missing' in resolved) {
			throw new Error(
				`${target.slug} needs ${resolved.missing}, which the owner's data ` +
					'does not provide (see e2e/discover-ids.ts).',
			)
		}

		const context = target.signedOut
			? await browser.newContext({
					baseURL: BASE_URL,
					storageState: undefined,
					deviceScaleFactor: 1,
				})
			: null
		const shot = context ? await context.newPage() : page
		if (context) context.setDefaultNavigationTimeout(90_000)
		page.context().setDefaultNavigationTimeout(90_000)

		let cleanup: Cleanup | void = undefined
		try {
			await prepare(shot)
			await shot.goto(resolved.path, { waitUntil: 'networkidle' })
			const { pathname } = new URL(shot.url())
			if (target.signedOut) {
				expect(pathname, `${target.slug} redirected`).toBe(
					resolved.path.split('?')[0],
				)
			} else {
				expect(
					pathname,
					'redirected to /login — re-run "npm run ui:login"',
				).not.toMatch(/^\/login/)
			}

			if (target.setup) cleanup = await target.setup(shot)
			await shot.waitForLoadState('networkidle')
			await shot.mouse.move(0, 0)
			await shot.waitForTimeout(400)

			const { width, height } = await capture(shot, target.slug)
			captured.push({
				slug: target.slug,
				route: target.route,
				features: target.features,
				capturedAt: new Date().toISOString(),
				width,
				height,
			})
		} finally {
			try {
				if (cleanup) await cleanup()
			} finally {
				await context?.close()
			}
		}

		if (target.setup && !target.signedOut) {
			const survivor = await findActiveSessionId(browser)
			expect(
				survivor,
				`${target.slug} left session ${survivor} running — discard it by hand`,
			).toBeNull()
		}
	})
}
