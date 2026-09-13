import type { ExerciseEquipment, MuscleGroup } from '@sunsteel/contracts'

import type { Exercise } from '@/lib/api/types'

import { EQUIPMENT_LABELS } from './exercise-equipment'
import { getFriendlyMuscleName } from './muscle-groups'

/**
 * EXER-05: substitutions for one exercise, from EXER-09 catalog metadata only.
 *
 * - `SUBSTITUTION_GROUP`: the catalog marks the two as near-identical.
 * - `MOVEMENT_PATTERN`: same movement pattern and at least one shared primary
 *   muscle, so the swap trains the same thing a different way.
 *
 * Equipment never hides a suggestion. When the user's gym lists equipment,
 * alternatives that fit it rank first and the rest say what is not listed.
 * Nothing is applied automatically; the caller asks the user to choose.
 */

export type AlternativeMatch = 'SUBSTITUTION_GROUP' | 'MOVEMENT_PATTERN'

export interface ExerciseAlternative {
	exercise: Exercise
	match: AlternativeMatch
	sharedPrimaryMuscles: MuscleGroup[]
	/** Required equipment not listed at the gym; empty when the gym is unknown. */
	unlistedEquipment: ExerciseEquipment[]
}

export interface AlternativeOptions {
	/** Equipment listed at the user's gym, or null when unknown. */
	availableEquipment?: Set<ExerciseEquipment> | null
	/** Exercise ids that must not be suggested, e.g. the rest of the day. */
	exclude?: Iterable<string>
	limit?: number
}

export const ALTERNATIVES_LIMIT = 5

const MATCH_RANK: Record<AlternativeMatch, number> = {
	SUBSTITUTION_GROUP: 0,
	MOVEMENT_PATTERN: 1,
}

const overlap = (a: MuscleGroup[], b: MuscleGroup[]) => {
	const shared = a.filter(muscle => b.includes(muscle))
	const union = new Set([...a, ...b]).size
	return { shared, score: union === 0 ? 0 : shared.length / union }
}

export function findExerciseAlternatives(
	target: Exercise,
	catalog: Exercise[],
	{
		availableEquipment = null,
		exclude = [],
		limit = ALTERNATIVES_LIMIT,
	}: AlternativeOptions = {},
): ExerciseAlternative[] {
	if (!target.movementPattern && !target.substitutionGroup) return []
	const excluded = new Set(exclude)
	excluded.add(target.id)

	const ranked: Array<{ alternative: ExerciseAlternative; score: number }> = []
	for (const candidate of catalog) {
		if (excluded.has(candidate.id)) continue
		const { shared, score } = overlap(
			target.primaryMuscles,
			candidate.primaryMuscles,
		)
		let match: AlternativeMatch | null = null
		if (
			target.substitutionGroup &&
			candidate.substitutionGroup === target.substitutionGroup
		) {
			match = 'SUBSTITUTION_GROUP'
		} else if (
			target.movementPattern &&
			candidate.movementPattern === target.movementPattern &&
			shared.length > 0
		) {
			match = 'MOVEMENT_PATTERN'
		}
		if (!match) continue

		ranked.push({
			alternative: {
				exercise: candidate,
				match,
				sharedPrimaryMuscles: shared,
				unlistedEquipment: availableEquipment
					? candidate.equipmentRequired.filter(
							item => item !== 'bodyweight' && !availableEquipment.has(item),
						)
					: [],
			},
			score,
		})
	}

	return ranked
		.sort(
			({ alternative: a, score: aScore }, { alternative: b, score: bScore }) =>
				MATCH_RANK[a.match] - MATCH_RANK[b.match] ||
				Number(a.unlistedEquipment.length > 0) -
					Number(b.unlistedEquipment.length > 0) ||
				bScore - aScore ||
				a.exercise.name.localeCompare(b.exercise.name),
		)
		.slice(0, limit)
		.map(({ alternative }) => alternative)
}

/** One-line reason shown under a suggestion. */
export function describeAlternative(
	alternative: ExerciseAlternative,
	locationName?: string,
): string {
	const reason =
		alternative.match === 'SUBSTITUTION_GROUP'
			? 'Near-identical movement'
			: `Same movement · ${alternative.sharedPrimaryMuscles
					.map(getFriendlyMuscleName)
					.join(', ')}`
	if (alternative.unlistedEquipment.length === 0) return reason
	const items = alternative.unlistedEquipment
		.map(item => EQUIPMENT_LABELS[item])
		.join(', ')
	return `${reason} · ${items} not listed${locationName ? ` at ${locationName}` : ''}`
}
