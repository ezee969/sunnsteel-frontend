import {
	PLANS,
	ROUTINE_DRAFT_REQUEST_MAX,
	type RoutineDraft,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	draftRequestFits,
	draftsLeft,
	draftToWizard,
	forgetDraft,
	keepDraft,
	readKeptDraft,
} from './routine-draft'

const DRAFT: RoutineDraft = {
	name: 'Torso y pierna',
	description: 'Dos días.',
	scheduleMode: 'WEEKLY',
	days: [
		{
			slot: 1,
			name: 'Torso',
			exercises: [
				{
					exerciseId: 'bench',
					sets: 3,
					minReps: 8,
					maxReps: 12,
					restSeconds: 120,
					minWeightIncrement: 2.5,
				},
			],
		},
		{ slot: 4, name: 'Pierna', exercises: [] },
	],
}

function memoryStorage(initial: string | null = null) {
	let value = initial
	return {
		getItem: () => value,
		setItem: (_: string, next: string) => {
			value = next
		},
		removeItem: () => {
			value = null
		},
	}
}

const blocked = {
	getItem: () => {
		throw new Error('SecurityError')
	},
	setItem: () => {
		throw new Error('SecurityError')
	},
	removeItem: () => {
		throw new Error('SecurityError')
	},
}

describe('INTEL-03 routine drafts', () => {
	it('opens a draft as wizard data with blank loads and working sets', () => {
		const data = draftToWizard(DRAFT)
		expect(data.name).toBe('Torso y pierna')
		expect(data.trainingDays).toEqual([1, 4])
		expect(data.restDays).toEqual([])
		expect(data.goal).toBeUndefined()
		expect(data.experienceLevel).toBeUndefined()
		const [exercise] = data.days[0].exercises
		expect(exercise.progressionScheme).toBe('DOUBLE_PROGRESSION')
		expect(exercise.clientId).toBeTruthy()
		expect(exercise.sets).toHaveLength(3)
		expect(exercise.sets[2]).toMatchObject({
			setNumber: 3,
			repType: 'RANGE',
			minReps: 8,
			maxReps: 12,
			weight: null,
		})
	})

	it('measures the text as the server does', () => {
		expect(draftRequestFits('   too short  ')).toBe(false)
		expect(draftRequestFits('three days a week')).toBe(true)
		expect(draftRequestFits('x'.repeat(ROUTINE_DRAFT_REQUEST_MAX))).toBe(true)
		expect(draftRequestFits('x'.repeat(ROUTINE_DRAFT_REQUEST_MAX + 1))).toBe(
			false,
		)
	})

	it('counts what is left, never below none', () => {
		const usage = {
			state: 'READY' as const,
			used: 3,
			limit: PLANS.PRO.limits.ROUTINE_DRAFTS_PER_MONTH!,
			resetsAt: '2026-12-01T00:00:00.000Z',
		}
		expect(draftsLeft(usage)).toBe(7)
		expect(draftsLeft({ ...usage, used: 12 })).toBe(0)
	})

	it('keeps a delivered draft for a reload and forgets it', () => {
		const storage = memoryStorage()
		expect(readKeptDraft(storage)).toBeNull()
		keepDraft(storage, DRAFT)
		expect(readKeptDraft(storage)).toEqual(DRAFT)
		forgetDraft(storage)
		expect(readKeptDraft(storage)).toBeNull()
	})

	it('survives blocked storage and anything else stored there', () => {
		expect(() => keepDraft(blocked, DRAFT)).not.toThrow()
		expect(readKeptDraft(blocked)).toBeNull()
		expect(() => forgetDraft(blocked)).not.toThrow()
		expect(readKeptDraft(memoryStorage('not json'))).toBeNull()
		expect(readKeptDraft(memoryStorage('{"days":3}'))).toBeNull()
	})

	it('says every state and the limits of the box in both languages', () => {
		for (const locale of ['en', 'es'] as const) {
			const t = translatorFor(locale, 'routines.drafts')
			expect(t('left', { left: 1, limit: 10, date: 'x' })).toContain('1')
			expect(t('quotaReached', { limit: 10, date: 'x' })).toContain('10')
			expect(t('paused')).not.toBe('')
			expect(t('unavailable')).not.toBe('')
			expect(t('notMedical')).not.toBe('')
		}
	})

	it('never says the draft was saved, or anything about healing', () => {
		for (const locale of ['en', 'es'] as const) {
			const t = translatorFor(locale, 'routines.drafts')
			const words = [t('intro'), t('started'), t('notMedical'), t('disclosure')]
				.join(' ')
				.toLowerCase()
			expect(words).not.toMatch(/\bheal|\bcure|\bcurar|\bsanar|diagnos/)
		}
	})
})
