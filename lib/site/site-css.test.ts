import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * SITE-01: app/site.css is a Tailwind build over only the folders it names
 * with `@source`, so a class in a file the site renders from anywhere else
 * would ship without its utility and render unstyled. This walks every
 * module the site's root imports and holds each one that writes classes to
 * those folders.
 */

const ROOT = resolve(__dirname, '../..')
const SITE_ROOT = join(ROOT, 'app', '[locale]', '(site)')
const EXTENSIONS = ['.tsx', '.ts', '/index.tsx', '/index.ts']

function siteSources(): string[] {
	const css = readFileSync(join(ROOT, 'app', 'site.css'), 'utf8')
	return [...css.matchAll(/^@source\s+'([^']+)';/gm)].map(([, path]) =>
		resolve(ROOT, 'app', path),
	)
}

function filesUnder(dir: string): string[] {
	return readdirSync(dir).flatMap(name => {
		const path = join(dir, name)
		if (statSync(path).isDirectory()) return filesUnder(path)
		return /\.tsx?$/.test(name) ? [path] : []
	})
}

function resolveImport(from: string, specifier: string): string | null {
	const base = specifier.startsWith('@/')
		? join(ROOT, specifier.slice(2))
		: specifier.startsWith('.')
			? resolve(dirname(from), specifier)
			: null
	if (!base) return null
	if (/\.tsx?$/.test(base) && existsSync(base)) return base
	for (const extension of EXTENSIONS) {
		if (existsSync(base + extension)) return base + extension
	}
	return null
}

function siteModules(): Set<string> {
	const seen = new Set<string>()
	const queue = filesUnder(SITE_ROOT)
	while (queue.length > 0) {
		const file = queue.pop() as string
		if (seen.has(file)) continue
		seen.add(file)
		const source = readFileSync(file, 'utf8')
		const specifiers = [
			...source.matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g),
		].map(([, specifier]) => specifier)
		for (const specifier of specifiers) {
			const next = resolveImport(file, specifier)
			if (next && !seen.has(next)) queue.push(next)
		}
	}
	return seen
}

const WRITES_CLASSES = /className=|\bcn\(|\bcva\(/

describe("the public site's stylesheet sources (SITE-01)", () => {
	it('covers every module the site renders that writes classes', () => {
		const sources = siteSources()
		expect(sources.length).toBeGreaterThan(0)
		const outside = [...siteModules()]
			.filter(file => WRITES_CLASSES.test(readFileSync(file, 'utf8')))
			.filter(file => !sources.some(source => file.startsWith(source)))
			.map(file => relative(ROOT, file).replaceAll('\\', '/'))
		expect(outside).toEqual([])
	})

	it('reaches the shared components the site is known to use', () => {
		const modules = [...siteModules()].map(file =>
			relative(ROOT, file).replaceAll('\\', '/'),
		)
		expect(modules).toContain('features/body-map/body-map.tsx')
		expect(modules).toContain('components/layout/root-document.tsx')
	})
})
