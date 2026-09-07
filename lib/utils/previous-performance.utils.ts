import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'

type CurrentSetPerformance = {
	reps: number
	weight?: number | null
}

export function isSetPerformanceImproved(
	current: CurrentSetPerformance,
	previous: PreviousSetPerformance,
): boolean {
	if (!Number.isFinite(current.reps) || current.reps <= 0) return false

	const currentWeight = current.weight ?? 0
	const previousWeight = previous.weight ?? 0
	if (!Number.isFinite(currentWeight)) return false

	return (
		currentWeight > previousWeight ||
		(currentWeight === previousWeight && current.reps > previous.reps)
	)
}

export function formatPreviousPerformance(
	previous: PreviousSetPerformance,
): string {
	const reps = `${previous.reps} ${previous.reps === 1 ? 'rep' : 'reps'}`
	const weight =
		previous.weight === null ||
		previous.weight === undefined ||
		previous.weight === 0
			? ''
			: ` · ${previous.weight} kg`
	return `${reps}${weight}`
}
