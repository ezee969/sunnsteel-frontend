import type {
	SessionComparisonExercise,
	SessionComparisonSession,
	SessionComparisonSet,
} from '@sunsteel/contracts'

export interface SessionSetComparison {
	setNumber: number
	latest: SessionComparisonSet | null
	previous: SessionComparisonSet | null
}

export interface SessionExerciseComparison {
	routineExerciseId: string
	exerciseId: string
	exerciseName: string
	latest: SessionComparisonExercise | null
	previous: SessionComparisonExercise | null
	sets: SessionSetComparison[]
}

function orderedExercises(session: SessionComparisonSession | null) {
	return [...(session?.exercises ?? [])].sort(
		(left, right) => left.order - right.order,
	)
}

export function buildSessionExerciseComparisons(
	latestSession: SessionComparisonSession,
	previousSession: SessionComparisonSession | null,
): SessionExerciseComparison[] {
	const latestExercises = orderedExercises(latestSession)
	const previousExercises = orderedExercises(previousSession)
	const previousById = new Map(
		previousExercises.map(exercise => [exercise.routineExerciseId, exercise]),
	)
	const seen = new Set<string>()
	const exercisePairs: Array<{
		latest: SessionComparisonExercise | null
		previous: SessionComparisonExercise | null
	}> = []

	for (const latest of latestExercises) {
		exercisePairs.push({
			latest,
			previous: previousById.get(latest.routineExerciseId) ?? null,
		})
		seen.add(latest.routineExerciseId)
	}
	for (const previous of previousExercises) {
		if (!seen.has(previous.routineExerciseId)) {
			exercisePairs.push({ latest: null, previous })
		}
	}

	return exercisePairs.map(({ latest, previous }) => {
		const identity = latest ?? previous!
		const latestSets = new Map(
			(latest?.sets ?? []).map(set => [set.setNumber, set]),
		)
		const previousSets = new Map(
			(previous?.sets ?? []).map(set => [set.setNumber, set]),
		)
		const setNumbers = [
			...new Set([...latestSets.keys(), ...previousSets.keys()]),
		].sort((left, right) => left - right)

		return {
			routineExerciseId: identity.routineExerciseId,
			exerciseId: identity.exerciseId,
			exerciseName: latest?.exerciseName ?? previous!.exerciseName,
			latest,
			previous,
			sets: setNumbers.map(setNumber => ({
				setNumber,
				latest: latestSets.get(setNumber) ?? null,
				previous: previousSets.get(setNumber) ?? null,
			})),
		}
	})
}
