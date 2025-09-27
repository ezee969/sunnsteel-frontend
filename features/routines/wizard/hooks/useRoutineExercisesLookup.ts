'use client'

import { useMemo } from 'react'
import type { Exercise } from '@/lib/api/types'

type ExerciseMap = Record<string, Exercise>

/**
 * Create a memoized lookup map of exercises keyed by their `id`.
 *
 * @param exercises - Optional array of Exercise objects to include in the lookup
 * @returns An ExerciseMap mapping each exercise's `id` to the Exercise object; an empty object if `exercises` is undefined or has no elements
 */
export function useRoutineExercisesLookup(exercises?: Exercise[]) {
	return useMemo<ExerciseMap>(() => {
		if (!exercises || exercises.length === 0) {
			return {}
		}
		return exercises.reduce<ExerciseMap>((acc, exercise) => {
			acc[exercise.id] = exercise
			return acc
		}, {})
	}, [exercises])
}
