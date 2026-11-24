import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * SITE-01: the site and the app are separate root layouts, but Next merges
 * the client manifests of every entry at the same level once route groups
 * are stripped: `(site)/layout`, `(app)/layout`, `(app)/(public)/layout` and
 * the rest all read as `[locale]/layout`. A client boundary that a site entry
 * and an app entry at that level both render directly can therefore be
 * mapped to the app's chunk, and the landing downloads it -- on 2026-11-24
 * that was the app's root, Supabase and all. Each root renders a boundary of
 * its own (`SiteRootProviders`, `AppRootProviders`); this holds them apart.
 */

const ROOT = resolve(__dirname, '../..')
const LOCALE = join(ROOT, 'app', '[locale]')

const SITE_ENTRIES = ['layout.tsx', 'error.tsx', 'not-found.tsx'].map(file =>
	join(LOCALE, '(site)', file),
)
const APP_ENTRIES = [
	'layout.tsx',
	'error.tsx',
	'not-found.tsx',
	'(auth)/layout.tsx',
	'(public)/layout.tsx',
	'(protected)/layout.tsx',
	'(protected)/loading.tsx',
].map(file => join(LOCALE, '(app)', file))

function resolveImport(from: string, specifier: string): string | null {
	const base = specifier.startsWith('@/')
		? join(ROOT, specifier.slice(2))
		: specifier.startsWith('.')
			? resolve(dirname(from), specifier)
			: null
	if (!base) return null
	for (const extension of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
		const path = base + extension
		if (/\.tsx?$/.test(path) && existsSync(path)) return path
	}
	return null
}

const isClient = (file: string) =>
	/^\s*['"]use client['"]/.test(readFileSync(file, 'utf8'))

/** The client boundaries an entry renders: through server modules, not past a boundary. */
function boundaries(entries: string[]): Set<string> {
	const found = new Set<string>()
	const seen = new Set<string>()
	const queue: string[] = []
	for (const entry of entries.filter(existsSync)) {
		// An error boundary is a client module itself: what it imports is
		// bundled into it, not referenced on its own.
		if (isClient(entry)) found.add(relative(ROOT, entry).replaceAll('\\', '/'))
		else queue.push(entry)
	}
	while (queue.length > 0) {
		const file = queue.pop() as string
		if (seen.has(file)) continue
		seen.add(file)
		const source = readFileSync(file, 'utf8')
		for (const [, specifier] of source.matchAll(
			/(?:from|import)\s*\(?\s*'([^']+)'/g,
		)) {
			const next = resolveImport(file, specifier)
			if (!next) continue
			if (isClient(next)) found.add(relative(ROOT, next).replaceAll('\\', '/'))
			else queue.push(next)
		}
	}
	return found
}

describe('the two root layouts (SITE-01)', () => {
	it('share no client boundary at the [locale] level', () => {
		const site = boundaries(SITE_ENTRIES)
		const app = boundaries(APP_ENTRIES)
		expect(site.size).toBeGreaterThan(0)
		expect(app.size).toBeGreaterThan(0)
		expect([...site].filter(file => app.has(file))).toEqual([])
	})

	it("keeps the app's providers out of the site's root", () => {
		expect(boundaries(SITE_ENTRIES)).toContain(
			'providers/site-root-providers.tsx',
		)
		expect(boundaries(SITE_ENTRIES)).not.toContain(
			'providers/app-root-providers.tsx',
		)
		const siteRoot = readFileSync(
			join(ROOT, 'providers', 'site-root-providers.tsx'),
			'utf8',
		)
		expect(siteRoot).not.toMatch(/app-provider/)
	})
})
