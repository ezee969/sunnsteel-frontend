import type {
	ProgressionScheme,
	Routine,
	RoutineSet,
	RoutineVersion,
	RoutineVersionDay,
	RoutineVersionExercise,
	RoutineVersionSetup,
	WeightUnit,
} from '@sunsteel/contracts'
import { SET_KIND_LABELS } from '@sunsteel/contracts'

import { formatSetScheme } from './exercise-detail'
import { describeRoutineSchedule, routineDayTitle } from './routine-schedule'
import { areCanonicalWeightsEqual, formatWeight } from './weight-unit'

/**
 * ROUT-08: routine versions compared with the routine as it is now. Pure, so
 * it runs in the Node test environment. Every edit replaces the stored days,
 * so nothing is matched by id: days by weekday (or by position when either
 * side is a rotation) and exercises by catalog exercise within a day.
 */

/** The current routine in a version's shape, so the two compare directly. */
export function routineSetup(routine: Routine): RoutineVersionSetup {
	return {
		name: routine.name,
		description: routine.description ?? null,
		scheduleMode: routine.scheduleMode,
		restDays: [...routine.restDays],
		rotationWeekdays: [...(routine.rotationWeekdays ?? [])],
		days: routine.days.map(day => ({
			dayOfWeek: day.dayOfWeek,
			name: day.name,
			order: day.order,
			exercises: day.exercises.map(exercise => ({
				exercise: { id: exercise.exercise.id, name: exercise.exercise.name },
				order: exercise.order,
				restSeconds: exercise.restSeconds,
				note: exercise.note ?? null,
				progressionScheme: exercise.progressionScheme,
				minWeightIncrement: exercise.minWeightIncrement,
				sets: exercise.sets,
			})),
		})),
	}
}

export function versionTitle(
	version: Pick<RoutineVersion, 'number' | 'name'>,
): string {
	return version.name?.trim() || `Version ${version.number}`
}

/** "4 days · 18 exercises" */
export function describeSetupSize(setup: RoutineVersionSetup): string {
	const days = setup.days.length
	const exercises = setup.days.reduce(
		(total, day) => total + day.exercises.length,
		0,
	)
	return `${days} ${days === 1 ? 'day' : 'days'} · ${exercises} ${
		exercises === 1 ? 'exercise' : 'exercises'
	}`
}

/** Why a version exists when it was not saved by hand. */
export function describeVersionOrigin(
	version: Pick<RoutineVersion, 'kind' | 'restoredVersionNumber'>,
): string | null {
	if (version.kind !== 'BEFORE_RESTORE') return null
	return version.restoredVersionNumber
		? `Saved automatically before restoring Version ${version.restoredVersionNumber}`
		: 'Saved automatically before a restore'
}

export interface DayComparison {
	title: string
	status: 'ADDED' | 'REMOVED' | 'CHANGED'
	changes: string[]
}

export interface SetupComparison {
	/** Name, description and schedule. */
	routine: string[]
	days: DayComparison[]
	isEmpty: boolean
}

const PROGRESSION_LABELS: Partial<Record<ProgressionScheme, string>> = {
	NONE: 'none',
	DOUBLE_PROGRESSION: 'double progression',
	DYNAMIC_DOUBLE_PROGRESSION: 'dynamic double progression',
}

const unique = (values: string[]) => [...new Set(values)]

function loadsLabel(sets: readonly RoutineSet[], unit: WeightUnit): string {
	const loads = unique(
		sets.map(set => (set.weight ? formatWeight(set.weight, unit) : 'no load')),
	)
	return loads.length ? loads.join(', ') : 'no load'
}

function sameLoads(a: readonly RoutineSet[], b: readonly RoutineSet[]) {
	return (
		a.length === b.length &&
		a.every((set, index) =>
			areCanonicalWeightsEqual(set.weight ?? null, b[index].weight ?? null),
		)
	)
}

function rirLabel(sets: readonly RoutineSet[]): string {
	const values = unique(
		sets.map(set => (set.rir == null ? 'none' : String(set.rir))),
	)
	return values.join(', ')
}

/** LIVE-12: "2 warm-up, 3 working", in the order the kinds first appear. */
function kindsLabel(sets: readonly RoutineSet[]): string {
	const counts = new Map<string, number>()
	for (const set of sets) {
		const label = SET_KIND_LABELS[set.kind ?? 'WORKING'].toLowerCase()
		counts.set(label, (counts.get(label) ?? 0) + 1)
	}
	return [...counts].map(([label, n]) => `${n} ${label}`).join(', ')
}

const seconds = (value: number) => `${value} s`

function compareExercise(
	current: RoutineVersionExercise,
	target: RoutineVersionExercise,
	unit: WeightUnit,
): string[] {
	const name = target.exercise.name
	const changes: string[] = []
	const fromScheme = formatSetScheme(current.sets)
	const toScheme = formatSetScheme(target.sets)
	if (fromScheme !== toScheme) {
		changes.push(`${name}: ${fromScheme} → ${toScheme}`)
	}
	const fromKinds = kindsLabel(current.sets)
	const toKinds = kindsLabel(target.sets)
	// A plain change in the number of working sets is the scheme line above.
	const anyNonWorking = [...current.sets, ...target.sets].some(
		set => (set.kind ?? 'WORKING') !== 'WORKING',
	)
	if (anyNonWorking && fromKinds !== toKinds) {
		changes.push(`${name}: ${fromKinds} → ${toKinds} sets`)
	}
	if (!sameLoads(current.sets, target.sets)) {
		const from = loadsLabel(current.sets, unit)
		const to = loadsLabel(target.sets, unit)
		changes.push(
			from === to
				? `${name}: loads change per set`
				: `${name}: ${from} → ${to}`,
		)
	}
	const fromRir = rirLabel(current.sets)
	const toRir = rirLabel(target.sets)
	if (fromRir !== toRir) changes.push(`${name}: RIR ${fromRir} → ${toRir}`)
	if (current.restSeconds !== target.restSeconds) {
		changes.push(
			`${name}: rest ${seconds(current.restSeconds)} → ${seconds(target.restSeconds)}`,
		)
	}
	if (current.progressionScheme !== target.progressionScheme) {
		const label = (scheme: ProgressionScheme) =>
			PROGRESSION_LABELS[scheme] ?? scheme.toLowerCase()
		changes.push(
			`${name}: progression ${label(current.progressionScheme)} → ${label(target.progressionScheme)}`,
		)
	}
	if (
		!areCanonicalWeightsEqual(
			current.minWeightIncrement,
			target.minWeightIncrement,
		)
	) {
		changes.push(
			`${name}: load step ${formatWeight(current.minWeightIncrement, unit)} → ${formatWeight(target.minWeightIncrement, unit)}`,
		)
	}
	if ((current.note ?? '').trim() !== (target.note ?? '').trim()) {
		changes.push(
			target.note?.trim()
				? `${name}: note becomes “${target.note.trim()}”`
				: `${name}: note removed`,
		)
	}
	return changes
}

/** Pairs a day's exercises by catalog exercise, in order of appearance. */
function pairExercises(
	current: readonly RoutineVersionExercise[],
	target: readonly RoutineVersionExercise[],
) {
	const byOrder = (list: readonly RoutineVersionExercise[]) =>
		[...list].sort((a, b) => a.order - b.order)
	const remaining = byOrder(current)
	const pairs: Array<{
		current: RoutineVersionExercise | null
		target: RoutineVersionExercise | null
	}> = []
	for (const exercise of byOrder(target)) {
		const index = remaining.findIndex(
			candidate => candidate.exercise.id === exercise.exercise.id,
		)
		pairs.push({
			current: index >= 0 ? remaining.splice(index, 1)[0] : null,
			target: exercise,
		})
	}
	for (const exercise of remaining)
		pairs.push({ current: exercise, target: null })
	return pairs
}

function compareDay(
	current: RoutineVersionDay,
	target: RoutineVersionDay,
	unit: WeightUnit,
): string[] {
	const changes: string[] = []
	const fromName = current.name?.trim() || null
	const toName = target.name?.trim() || null
	if (fromName !== toName) {
		changes.push(
			toName
				? `Named “${toName}”${fromName ? ` instead of “${fromName}”` : ''}`
				: `Name “${fromName}” removed`,
		)
	}
	const pairs = pairExercises(current.exercises, target.exercises)
	for (const pair of pairs) {
		if (pair.current && pair.target) {
			changes.push(...compareExercise(pair.current, pair.target, unit))
		} else if (pair.target) {
			changes.push(
				`Adds ${pair.target.exercise.name} (${formatSetScheme(pair.target.sets)})`,
			)
		} else if (pair.current) {
			changes.push(`Removes ${pair.current.exercise.name}`)
		}
	}
	const kept = (list: readonly RoutineVersionExercise[], other: Set<string>) =>
		[...list]
			.sort((a, b) => a.order - b.order)
			.map(exercise => exercise.exercise.id)
			.filter(id => other.has(id))
	const currentIds = new Set(current.exercises.map(e => e.exercise.id))
	const targetIds = new Set(target.exercises.map(e => e.exercise.id))
	if (
		kept(current.exercises, targetIds).join('|') !==
		kept(target.exercises, currentIds).join('|')
	) {
		changes.push('Exercise order changes')
	}
	return changes
}

const withIds = (setup: RoutineVersionSetup) => ({
	...setup,
	days: setup.days.map(day => ({ ...day, id: String(day.order) })),
})

/**
 * What restoring `target` would change in `current`: routine-level lines,
 * then one entry per added, removed or changed day, in the target's order.
 */
export function compareRoutineSetups(
	current: RoutineVersionSetup,
	target: RoutineVersionSetup,
	unit: WeightUnit,
): SetupComparison {
	const routine: string[] = []
	if (current.name.trim() !== target.name.trim()) {
		routine.push(`Name: ${current.name} → ${target.name}`)
	}
	if (
		(current.description ?? '').trim() !== (target.description ?? '').trim()
	) {
		routine.push(
			target.description?.trim()
				? 'Description changes'
				: 'Description removed',
		)
	}
	const fromSchedule = describeRoutineSchedule(withIds(current))
	const toSchedule = describeRoutineSchedule(withIds(target))
	if (
		current.scheduleMode !== target.scheduleMode ||
		fromSchedule !== toSchedule
	) {
		routine.push(
			`Schedule: ${fromSchedule || 'no days'} → ${toSchedule || 'no days'}`,
		)
	}

	const byWeekday =
		current.scheduleMode === 'WEEKLY' && target.scheduleMode === 'WEEKLY'
	const key = (day: RoutineVersionDay) =>
		byWeekday ? `w${day.dayOfWeek}` : `o${day.order}`
	const currentDays = new Map(current.days.map(day => [key(day), day]))
	const targetKeys = new Set(target.days.map(key))
	const days: DayComparison[] = []
	for (const day of [...target.days].sort((a, b) => a.order - b.order)) {
		const before = currentDays.get(key(day))
		if (!before) {
			const count = day.exercises.length
			days.push({
				title: routineDayTitle(day),
				status: 'ADDED',
				changes: [
					`Adds this day with ${count} ${count === 1 ? 'exercise' : 'exercises'}`,
				],
			})
			continue
		}
		const changes = compareDay(before, day, unit)
		if (changes.length) {
			days.push({ title: routineDayTitle(day), status: 'CHANGED', changes })
		}
	}
	for (const day of [...current.days].sort((a, b) => a.order - b.order)) {
		if (!targetKeys.has(key(day))) {
			days.push({
				title: routineDayTitle(day),
				status: 'REMOVED',
				changes: ['Removes this day'],
			})
		}
	}
	return { routine, days, isEmpty: routine.length === 0 && days.length === 0 }
}

/**
 * Why a version cannot be restored right now, or null. The server refuses the
 * same cases; saying so first avoids a failed request.
 */
export function restoreBlockedReason({
	comparison,
	versionCount,
	max,
	hasLiveSession,
}: {
	comparison: SetupComparison
	versionCount: number
	max: number
	hasLiveSession: boolean
}): string | null {
	if (comparison.isEmpty)
		return 'This version matches the routine as it is now.'
	if (hasLiveSession) {
		return 'Finish the workout in progress on this routine before restoring.'
	}
	if (versionCount >= max) {
		return `This routine already keeps ${max} versions, and restoring saves the current setup first. Delete a version to restore this one.`
	}
	return null
}
