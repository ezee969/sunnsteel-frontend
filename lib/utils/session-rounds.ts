import {
	exerciseGroupLabel,
	exerciseGroupPosition,
	exerciseGroups,
	type SetKind,
} from '@sunsteel/contracts'

/**
 * LIVE-14: a workout runs a routine's supersets and circuits (ROUT-12) in
 * rounds. Warm-ups come first, exercise by exercise; then each round is every
 * member's next working, drop or optional set in order, and a member with
 * fewer sets drops out of the later rounds. Pure, so it runs in the Node test
 * environment.
 */

export interface RoundSlot {
	exerciseId: string
	exerciseName: string
	linkedToNext?: boolean
	sets: ReadonlyArray<{
		setNumber: number
		isCompleted: boolean
		kind: SetKind
	}>
}

export interface SetTarget {
	exerciseId: string
	exerciseName: string
	setNumber: number
}

const isWarmUp = (set: { kind: SetKind }) => set.kind === 'WARMUP'
const target = (slot: RoundSlot, setNumber: number): SetTarget => ({
	exerciseId: slot.exerciseId,
	exerciseName: slot.exerciseName,
	setNumber,
})

/** Every set of the day in the order it is meant to be done. */
export function trainingSequence(slots: readonly RoundSlot[]): SetTarget[] {
	const groups = exerciseGroups(slots)
	const startOf = new Map(groups.map(group => [group.indices[0], group]))
	const sequence: SetTarget[] = []
	let index = 0
	while (index < slots.length) {
		const group = startOf.get(index)
		if (!group) {
			const slot = slots[index]
			slot.sets.forEach(set => sequence.push(target(slot, set.setNumber)))
			index += 1
			continue
		}
		const members = group.indices.map(i => slots[i])
		members.forEach(slot =>
			slot.sets
				.filter(isWarmUp)
				.forEach(set => sequence.push(target(slot, set.setNumber))),
		)
		const work = members.map(slot => slot.sets.filter(set => !isWarmUp(set)))
		const rounds = Math.max(0, ...work.map(sets => sets.length))
		for (let round = 0; round < rounds; round += 1) {
			members.forEach((slot, m) => {
				const set = work[m][round]
				if (set) sequence.push(target(slot, set.setNumber))
			})
		}
		index = group.indices[group.indices.length - 1] + 1
	}
	return sequence
}

const same = (a: SetTarget, b: { exerciseId: string; setNumber: number }) =>
	a.exerciseId === b.exerciseId && a.setNumber === b.setNumber

/**
 * The set to do after `just`: the next one not done after it in the day's
 * order, else the first not done before it, else null when all are done.
 * `just` counts as done even before the cache says so.
 */
export function nextSetAfter(
	slots: readonly RoundSlot[],
	just: { exerciseId: string; setNumber: number } | null,
): SetTarget | null {
	const sequence = trainingSequence(slots)
	const done = new Set(
		slots.flatMap(slot =>
			slot.sets
				.filter(set => set.isCompleted)
				.map(set => `${slot.exerciseId}:${set.setNumber}`),
		),
	)
	if (just) done.add(`${just.exerciseId}:${just.setNumber}`)
	const open = (t: SetTarget) => !done.has(`${t.exerciseId}:${t.setNumber}`)
	const at = just ? sequence.findIndex(t => same(t, just)) : -1
	return (
		sequence.slice(at + 1).find(open) ??
		sequence.slice(0, Math.max(at, 0)).find(open) ??
		null
	)
}

export interface RoundStatus {
	/** "Superset A1", "Circuit B3". */
	label: string
	/** The round in progress, 1-based; equal to `rounds` once all are done. */
	round: number
	rounds: number
	finished: boolean
}

/** Where one exercise of the day stands in its group, or null on its own. */
export function roundStatus(
	slots: readonly RoundSlot[],
	index: number,
): RoundStatus | null {
	const position = exerciseGroupPosition(slots, index)
	if (!position) return null
	const work = position.group.indices.map(i =>
		slots[i].sets.filter(set => !isWarmUp(set)),
	)
	const rounds = Math.max(0, ...work.map(sets => sets.length))
	let round = 0
	while (
		round < rounds &&
		work.every(sets => !sets[round] || sets[round].isCompleted)
	) {
		round += 1
	}
	return {
		label: exerciseGroupLabel(position),
		round: Math.min(round + 1, Math.max(rounds, 1)),
		rounds,
		finished: round >= rounds,
	}
}

/** "Round 2 of 3", or "All 3 rounds done". */
export function describeRound(status: RoundStatus): string {
	if (status.finished) {
		return status.rounds === 1
			? 'Round done'
			: `All ${status.rounds} rounds done`
	}
	return `Round ${status.round} of ${status.rounds}`
}

/** The line a group member shows while the next set is its own. */
export const describeUpNext = (next: SetTarget) =>
	`Up next: set ${next.setNumber}`
