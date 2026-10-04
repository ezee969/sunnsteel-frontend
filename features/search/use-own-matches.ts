'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { exerciseLabel } from '@/i18n/catalog'
import { useExercises } from '@/lib/api/hooks/useExercises'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { matchExercises, matchOwnRoutines } from '@/lib/utils/search'

/**
 * NAV-01: the two categories matched in the client, over the reads the app
 * already caches -- the catalog with the member's own exercises, and the
 * member's own routines. Mount it only while a query is being searched: the
 * header renders on every page, and this asks for both reads.
 */
export function useOwnMatches(query: string) {
	const tExercises = useTranslations('catalog.exercises')
	const exercises = useExercises()
	const routines = useRoutines()
	return {
		exercises: useMemo(
			() =>
				matchExercises(exercises.data ?? [], query, name =>
					exerciseLabel(name, tExercises),
				),
			[exercises.data, query, tExercises],
		),
		exercisesLoading: exercises.isLoading,
		routines: useMemo(
			() => matchOwnRoutines(routines.data ?? [], query),
			[routines.data, query],
		),
		routinesLoading: routines.isLoading,
	}
}
