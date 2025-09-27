'use client'

import { useMemo } from 'react'
import type { Exercise } from '@/lib/api/types'

type ExerciseMap = Record<string, Exercise>

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
