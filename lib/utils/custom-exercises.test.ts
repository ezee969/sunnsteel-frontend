import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/lib/api/types/exercise.type'

import {
	catalogExercises,
	customExerciseDraftProblem,
	customExerciseInput,
	describeCustomExerciseError,
	draftFromExercise,
	emptyCustomExerciseDraft,
	pickableExercises,
	toggleMuscle,
} from './custom-exercises'
import {
	EMPTY_CATALOG_FILTERS,
	filterCatalog,
	getCatalogEmptyState,
} from './exercise-catalog'

const exercise = (over: Partial<Exercise> = {}): Exercise => ({
	id: 'e1',
	name: 'Bench Press',
	primaryMuscles: ['PECTORAL'],
	secondaryMuscles: ['TRICEPS'],
	equipment: 'barbell',
	movementPattern: 'HORIZONTAL_PUSH',
	mechanic: 'COMPOUND',
	equipmentRequired: ['barbell', 'bench'],
	substitutionGroup: null,
	instructions: [],
	mediaUrl: null,
	createdAt: '2026-09-25T00:00:00.000Z',
	updatedAt: '2026-09-25T00:00:00.000Z',
	...over,
})

const bench = exercise()
const landmine = exercise({
	id: 'c1',
	name: 'Landmine Press',
	isCustom: true,
	note: 'Elbows in.',
	archivedAt: null,
	inUse: true,
})
const oldOne = exercise({
	id: 'c2',
	name: 'Old Press',
	isCustom: true,
	archivedAt: '2026-09-20T00:00:00.000Z',
})
const all = [bench, landmine, oldOne]

const valid = () => ({
	...emptyCustomExerciseDraft('Zercher Squat'),
	primaryMuscles: ['QUADRICEPS' as const],
	equipmentRequired: ['barbell' as const],
})

describe('custom exercises in lists (EXER-06)', () => {
	it('keeps an archived exercise out of pickers but in the cache', () => {
		expect(pickableExercises(all).map(e => e.id)).toEqual(['e1', 'c1'])
		expect(all).toHaveLength(3)
	})

	it('keeps public favorites to the catalog', () => {
		expect(catalogExercises(all).map(e => e.id)).toEqual(['e1'])
	})

	it('shows archived ones only under Yours, and only the member own there', () => {
		const context = {
			trainedIds: null,
			listedEquipment: null,
			starredIds: null,
		}
		expect(
			filterCatalog(all, EMPTY_CATALOG_FILTERS, context).map(e => e.id),
		).toEqual(['e1', 'c1'])
		expect(
			filterCatalog(all, { ...EMPTY_CATALOG_FILTERS, mine: true }, context).map(
				e => e.id,
			),
		).toEqual(['c1', 'c2'])
	})

	it('says so when the member has none of their own', () => {
		expect(
			getCatalogEmptyState({
				catalogSize: 1,
				filters: { ...EMPTY_CATALOG_FILTERS, mine: true },
				hasTrainedExercises: null,
				hasCustomExercises: false,
			}).title,
		).toBe('No exercises of your own yet')
	})
})

describe('the custom exercise draft (EXER-06)', () => {
	it('never holds a muscle as primary and secondary at once', () => {
		let draft = toggleMuscle(valid(), 'secondary', 'GLUTES')
		draft = toggleMuscle(draft, 'primary', 'GLUTES')
		expect(draft.primaryMuscles).toEqual(['QUADRICEPS', 'GLUTES'])
		expect(draft.secondaryMuscles).toEqual([])
		draft = toggleMuscle(draft, 'secondary', 'QUADRICEPS')
		expect(draft.primaryMuscles).toEqual(['GLUTES'])
		expect(draft.secondaryMuscles).toEqual(['QUADRICEPS'])
	})

	it('names the field of the first problem', () => {
		expect(
			customExerciseDraftProblem({ ...valid(), name: ' ' }, all)?.field,
		).toBe('name')
		expect(
			customExerciseDraftProblem({ ...valid(), primaryMuscles: [] }, all)
				?.field,
		).toBe('primaryMuscles')
		expect(
			customExerciseDraftProblem({ ...valid(), equipmentRequired: [] }, all)
				?.field,
		).toBe('equipmentRequired')
		expect(customExerciseDraftProblem(valid(), all)).toBeNull()
	})

	it('refuses a name the catalog or the member already has, but not its own', () => {
		expect(
			customExerciseDraftProblem({ ...valid(), name: 'bench  press' }, all),
		).toEqual({
			field: 'name',
			message:
				'You already have an exercise by that name, or the catalog does.',
		})
		expect(
			customExerciseDraftProblem({ ...valid(), name: 'old press' }, all)?.field,
		).toBe('name')
		expect(
			customExerciseDraftProblem(draftFromExercise(landmine), all, 'c1'),
		).toBeNull()
	})

	it('sends an empty note as none', () => {
		expect(customExerciseInput({ ...valid(), note: '   ' }).note).toBeNull()
		expect(draftFromExercise(landmine).note).toBe('Elbows in.')
	})

	it('words a refusal without its code', () => {
		expect(
			describeCustomExerciseError(
				'NAME_TAKEN: you already have an exercise by that name, or the catalog does',
			),
		).toBe('You already have an exercise by that name, or the catalog does.')
		expect(describeCustomExerciseError('')).toBe(
			'The exercise was not saved. Try again in a moment.',
		)
	})
})
