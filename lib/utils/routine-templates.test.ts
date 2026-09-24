import { ROUTINE_DAYS_MAX } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeTemplateSize,
	findRoutineTemplate,
	ROUTINE_TEMPLATES,
	templateDraft,
} from './routine-templates'

const names = [
	...new Set(
		ROUTINE_TEMPLATES.flatMap(template =>
			template.days.flatMap(day => day.exercises.map(e => e.name)),
		),
	),
]
const catalog = names.map((name, index) => ({ id: `ex-${index}`, name }))

describe('starter templates (ROUT-03)', () => {
	it('are the three approved programmes, found by slug', () => {
		expect(ROUTINE_TEMPLATES.map(t => t.slug)).toEqual([
			'full-body-foundations',
			'upper-lower',
			'push-pull-legs',
		])
		expect(findRoutineTemplate('upper-lower')?.name).toBe('Upper / Lower')
		expect(findRoutineTemplate('nope')).toBeNull()
		expect(findRoutineTemplate(null)).toBeNull()
		expect(describeTemplateSize(ROUTINE_TEMPLATES[0])).toBe('12 exercises')
	})

	it('are valid routines: distinct slots, no repeated exercise in a day', () => {
		for (const template of ROUTINE_TEMPLATES) {
			expect(template.days.length).toBeLessThanOrEqual(ROUTINE_DAYS_MAX)
			const slots = template.days.map(day => day.slot)
			expect(new Set(slots).size).toBe(slots.length)
			if (template.scheduleMode === 'ROTATION') {
				expect(slots).toEqual(slots.map((_, index) => index))
			} else {
				expect(template.rotationWeekdays).toEqual([])
				for (const slot of slots) expect(slot).toBeGreaterThanOrEqual(0)
			}
			for (const day of template.days) {
				expect(day.name.length).toBeLessThanOrEqual(40)
				const exercises = day.exercises.map(e => e.name)
				expect(new Set(exercises).size).toBe(exercises.length)
				for (const e of day.exercises) {
					expect(e.minReps).toBeLessThan(e.maxReps)
				}
			}
		}
	})

	it('opens as a complete draft with blank loads and double progression', () => {
		const result = templateDraft(ROUTINE_TEMPLATES[2], catalog)
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const { draft } = result
		expect(draft).toMatchObject({
			name: 'Push / Pull / Legs',
			scheduleMode: 'ROTATION',
			trainingDays: [0, 1, 2],
			rotationWeekdays: [1, 2, 3, 4, 5, 6],
			restDays: [],
			goal: 'MUSCLE_GROWTH',
			experienceLevel: 'INTERMEDIATE',
		})
		expect(draft.days.map(day => day.name)).toEqual(['Push', 'Pull', 'Legs'])
		const bench = draft.days[0].exercises[0]
		expect(bench.exerciseId).toBe(
			catalog.find(c => c.name === 'Bench Press')!.id,
		)
		expect(bench.progressionScheme).toBe('DOUBLE_PROGRESSION')
		expect(bench.minWeightIncrement).toBe(2.5)
		expect(bench.restSeconds).toBe(150)
		expect(bench.sets).toHaveLength(4)
		expect(bench.sets[0]).toEqual({
			setNumber: 1,
			repType: 'RANGE',
			reps: null,
			minReps: 6,
			maxReps: 8,
			weight: null,
			rir: 2,
		})
		const everySet = draft.days.flatMap(day =>
			day.exercises.flatMap(e => e.sets),
		)
		expect(everySet.every(set => set.weight === null)).toBe(true)
		// Dumbbell work steps by 2 kg, isolations rest shorter.
		const lateral = draft.days[0].exercises.find(
			e => e.exerciseId === catalog.find(c => c.name === 'Lateral Raises')!.id,
		)!
		expect(lateral.minWeightIncrement).toBe(2)
		expect(lateral.restSeconds).toBe(75)
		// Each exercise gets its own client id for the builder's keys.
		const ids = draft.days.flatMap(day => day.exercises.map(e => e.clientId))
		expect(new Set(ids).size).toBe(ids.length)
	})

	it('keeps a weekly template on its weekdays', () => {
		const result = templateDraft(ROUTINE_TEMPLATES[1], catalog)
		if (!result.ok) throw new Error('expected a draft')
		expect(result.draft.scheduleMode).toBe('WEEKLY')
		expect(result.draft.trainingDays).toEqual([1, 2, 4, 5])
	})

	it('refuses to open with an exercise the catalog does not have', () => {
		const result = templateDraft(
			ROUTINE_TEMPLATES[0],
			catalog.filter(c => c.name !== 'Dead Bug' && c.name !== 'Squat'),
		)
		expect(result).toEqual({ ok: false, missing: ['Squat', 'Dead Bug'] })
	})
})
