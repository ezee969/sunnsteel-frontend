import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { describePlanningSummary, planningInUse } from './routine-planning'

const base = {
	visibility: 'PRIVATE',
	trainingBlocks: [],
	temporaryOverrides: [],
	isHiddenByModeration: false,
} as never as Parameters<typeof planningInUse>[0]

describe('routine planning group (UX-20)', () => {
	it('stays folded for a private routine with nothing planned', () => {
		expect(planningInUse(base)).toBe(false)
	})

	it.each([
		['shared with followers', { visibility: 'FOLLOWERS' }],
		['public', { visibility: 'PUBLIC' }],
		['with a training block', { trainingBlocks: [{}] }],
		['with a deload', { temporaryOverrides: [{}] }],
		['hidden by moderation', { isHiddenByModeration: true }],
	])('opens when the routine is %s', (_label, change) => {
		expect(planningInUse({ ...base, ...change } as never)).toBe(true)
	})

	it('names who finds it, the blocks and the deloads in both languages', () => {
		const routine = {
			...base,
			visibility: 'FOLLOWERS',
			trainingBlocks: [{}, {}],
		} as never
		expect(
			describePlanningSummary(
				routine,
				translatorFor('en', 'routines.detail'),
				translatorFor('en', 'routines.sharing'),
			),
		).toBe('Found by: Followers · 2 training blocks · no deloads')
		expect(
			describePlanningSummary(
				routine,
				translatorFor('es', 'routines.detail'),
				translatorFor('es', 'routines.sharing'),
			),
		).toMatch(/^La encuentra: .+ · 2 bloques de entrenamiento · sin descargas$/)
	})
})
