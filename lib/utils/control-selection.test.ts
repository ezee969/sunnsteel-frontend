import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
	cancelsMultiClickSelection,
	CONTROL_SELECTORS,
	FIELD_SELECTORS,
} from './control-selection'

/** A target whose ancestors match exactly the selectors given. */
function inside(...matches: string[]) {
	return {
		closest: (selectors: string) =>
			selectors
				.split(/,(?![^[(]*[\])])/)
				.map(selector => selector.trim())
				.some(selector => matches.includes(selector))
				? {}
				: null,
	} as unknown as EventTarget
}

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

describe('multi-click selection on controls (UX-27)', () => {
	it('names the same controls and fields as the stylesheet', () => {
		const css = readFileSync(
			join(resolve(__dirname, '../..'), 'app/styles/selection.css'),
			'utf8',
		)
		const [controls, fields] = whereLists(css)
		expect([...CONTROL_SELECTORS]).toEqual(controls)
		expect([...FIELD_SELECTORS]).toEqual(fields)
	})

	it('cancels the second and third press on a control', () => {
		expect(cancelsMultiClickSelection(inside('button'), 2)).toBe(true)
		expect(cancelsMultiClickSelection(inside("[role='tab']"), 3)).toBe(true)
		expect(
			cancelsMultiClickSelection(inside("[data-clickable='true']"), 2),
		).toBe(true)
	})

	it('cancels it on what a call site drew as part of a control', () => {
		expect(cancelsMultiClickSelection(inside('.select-none'), 2)).toBe(true)
	})

	it('never touches a single press, which focuses and starts a drag', () => {
		expect(cancelsMultiClickSelection(inside('button'), 1)).toBe(false)
		expect(cancelsMultiClickSelection(inside('button'), 0)).toBe(false)
	})

	it('leaves content, fields and opted-in text selectable', () => {
		expect(cancelsMultiClickSelection(inside(), 2)).toBe(false)
		expect(cancelsMultiClickSelection(inside('label', 'input'), 2)).toBe(false)
		expect(cancelsMultiClickSelection(inside('button', 'textarea'), 3)).toBe(
			false,
		)
		expect(
			cancelsMultiClickSelection(inside('button', '.select-text'), 2),
		).toBe(false)
	})

	it('ignores a target that is not an element', () => {
		expect(cancelsMultiClickSelection(null, 2)).toBe(false)
		expect(cancelsMultiClickSelection({} as EventTarget, 2)).toBe(false)
	})
})
