import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * UX-27 (design system §34): in the app, controls do not select and content
 * does. The rule is one app-only stylesheet; these hold what it catches, what
 * it must never catch, and that only the app loads it.
 */

const ROOT = resolve(__dirname, '../..')
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')
const SELECTION = read('app/styles/selection.css')

/** The selectors inside the `:where(...)` that opens each rule, in order. */
function whereLists(css: string): string[][] {
	const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
	return [...withoutComments.matchAll(/:where\(([\s\S]*?)\)\s*\{/g)].map(
		([, list]) =>
			list
				.split(/,(?![^[]*\])/)
				.map(selector => selector.replace(/\s+/g, ' ').trim())
				.filter(Boolean),
	)
}

function filesUnder(dir: string): string[] {
	return readdirSync(dir).flatMap(name => {
		const path = join(dir, name)
		if (name === 'node_modules' || name.startsWith('.')) return []
		if (statSync(path).isDirectory()) return filesUnder(path)
		return /\.tsx$/.test(name) ? [path] : []
	})
}

describe('text selection in the app (UX-27)', () => {
	it('is loaded by the app and never by the public site', () => {
		expect(read('app/globals.css')).toMatch(
			/@import '\.\/styles\/shared\.css';\s*@import '\.\/styles\/selection\.css';/,
		)
		expect(read('app/site.css')).not.toContain('selection.css')
		expect(read('app/styles/shared.css')).not.toContain('selection.css')
	})

	it('catches every control by what it is, and whole-row links by their mark', () => {
		const [controls] = whereLists(SELECTION)
		expect(controls).toEqual([
			'button',
			'summary',
			'label',
			"[role='button']",
			"[role='tab']",
			"[role='option']",
			"[role='menuitem']",
			"[role='menuitemcheckbox']",
			"[role='menuitemradio']",
			"[role='checkbox']",
			"[role='radio']",
			"[role='switch']",
			"[data-slot='button']",
			"[data-clickable='true']",
		])
	})

	it('never catches a link in a sentence or a field that gains aria-controls', () => {
		const [controls] = whereLists(SELECTION)
		expect(controls).not.toContain('a')
		expect(controls.some(selector => selector.includes('aria-'))).toBe(false)
	})

	it('keeps fields selectable inside a control', () => {
		const [, fields] = whereLists(SELECTION)
		expect(fields).toEqual([
			'input',
			'textarea',
			'select',
			"[contenteditable]:not([contenteditable='false'])",
		])
		const fieldRule = SELECTION.slice(SELECTION.lastIndexOf(':where('))
		expect(fieldRule).toMatch(/[^-]user-select: text;/)
		expect(fieldRule).toMatch(/-webkit-user-select: text;/)
	})

	it('stays at zero specificity, so a call site can take select-text', () => {
		const rules = SELECTION.replace(/\/\*[\s\S]*?\*\//g, '')
			.split('{')
			.slice(1, -1)
			.map(chunk => chunk.slice(chunk.lastIndexOf('}') + 1).trim())
			.filter(selector => selector && !selector.startsWith('@layer'))
		expect(rules).toHaveLength(3)
		expect(
			rules.every(s => s.startsWith(':where(') || s === '::selection'),
		).toBe(true)
	})

	it('selects in ink on paper from the tokens, never a literal colour', () => {
		expect(SELECTION).toMatch(
			/::selection\s*\{\s*background-color: var\(--primary\);\s*color: var\(--primary-foreground\);\s*\}/,
		)
		expect(SELECTION).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/i)
	})

	it("marks a whole-row link only with data-clickable='true'", () => {
		const marks = ['app', 'components', 'features']
			.flatMap(dir => filesUnder(join(ROOT, dir)))
			.flatMap(file =>
				[...readFileSync(file, 'utf8').matchAll(/data-clickable=(\S+)/g)].map(
					([, value]) => ({
						file: relative(ROOT, file).replaceAll('\\', '/'),
						value,
					}),
				),
			)
		expect(marks.length).toBeGreaterThan(0)
		expect(marks.filter(({ value }) => value !== '"true"')).toEqual([])
	})
})
