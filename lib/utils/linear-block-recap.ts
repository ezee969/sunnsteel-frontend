import {
	type LinearBlockChange,
	lpEstimate,
	type WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

import {
	lpNextLoadKg,
	lpPercentage,
	lpPercentLabel,
	lpPositionLabel,
} from './linear-periodization'
import {
	formatWeight,
	formatWeightAmount,
	getWeightUnitLabel,
} from './weight-unit'

// ROUT-17/ROUT-18: what a finished workout did to each 8-week block, as the
// owner's recap says it. Never shared: the block finishing names the
// reference max, which is the owner's.

type T = Translator<'workout.linearBlock'>
type TBlock = Translator<'routines.linearBlock'>

interface RecapOptions {
	/** The session's day is a rotation day: sessions, not weeks. */
	rotation: boolean
	unit: WeightUnit
	locale: Locale
}

interface ItemBase {
	routineExerciseId: string
	exerciseName: string
}

export type LinearBlockRecapItem =
	| (ItemBase & {
			/** A step of the block, or the recovery step, done. */
			kind: 'step' | 'recovery'
			done: string
			next: string | null
	  })
	| (ItemBase & {
			kind: 'finished'
			reference: string
			estimate: string
			/** The sets the estimate came from, in step and set order. */
			sets: Array<{ label: string; estimate: string }>
	  })

/** "Next: Week 4 of 8, 72 % · 72.5 kg". */
function nextLine(
	change: LinearBlockChange,
	options: RecapOptions,
	t: T,
	tBlock: TBlock,
): string | null {
	const load = lpNextLoadKg(change.after, change.minWeightIncrementKg)
	if (load === null) return null
	return t('next', {
		position: lpPositionLabel(change.after, options.rotation, tBlock),
		percent: lpPercentLabel(lpPercentage(change.after), options.locale),
		load: formatWeight(load, options.unit, options.locale),
	})
}

/** One recap line per block the workout moved, in the order the server sent. */
export function describeLinearBlockChanges(
	changes: readonly LinearBlockChange[] | undefined,
	options: RecapOptions,
	t: T,
	tBlock: TBlock,
): LinearBlockRecapItem[] {
	const { unit, locale, rotation } = options
	const weight = (kg: number) => formatWeight(kg, unit, locale)
	return (changes ?? []).flatMap((change): LinearBlockRecapItem[] => {
		const base = {
			routineExerciseId: change.routineExerciseId,
			exerciseName: change.exerciseName,
		}
		const { before, after } = change
		if (before.phase === 'BLOCK' && after.phase === 'FINISHED') {
			const estimate = lpEstimate(after.samples, change.minWeightIncrementKg)
			const estimatedMaxKg = after.estimatedMaxKg ?? estimate.estimatedMaxKg
			const rir = numberFormatter(locale, { maximumFractionDigits: 1 })
			return [
				{
					...base,
					kind: 'finished',
					reference: t('referenceUsed', {
						value: weight(before.referenceMaxKg),
					}),
					estimate:
						estimatedMaxKg != null
							? t('estimate', { value: weight(estimatedMaxKg) })
							: tBlock('noEstimate'),
					sets: estimate.sets.map(set => ({
						label: t(rotation ? 'sampleSession' : 'sampleWeek', {
							step: set.step,
							set: set.set,
							load: weight(set.loadKg),
							reps: set.reps,
							rir: rir.format(set.rir),
						}),
						estimate: `${formatWeightAmount(set.estimateKg, unit, locale, 1)} ${getWeightUnitLabel(unit)}`,
					})),
				},
			]
		}
		if (before.phase === 'RECOVERY') {
			return [
				{
					...base,
					kind: 'recovery',
					done: t('recoveryDone', { reference: weight(after.referenceMaxKg) }),
					next: nextLine(change, options, t, tBlock),
				},
			]
		}
		if (before.phase === 'BLOCK' && after.phase === 'BLOCK') {
			return [
				{
					...base,
					kind: 'step',
					done: t('stepDone', {
						position: lpPositionLabel(before, rotation, tBlock),
					}),
					next: nextLine(change, options, t, tBlock),
				},
			]
		}
		// A finished block waits for the member's choice; nothing else moves it.
		return []
	})
}
