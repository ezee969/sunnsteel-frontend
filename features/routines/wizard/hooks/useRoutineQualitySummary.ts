import type { TrainingLocationPreference } from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { Exercise } from '@/lib/api/types'

import type { RoutineWizardData } from '../types'
import { buildRoutineQualitySummary } from '../utils/routine-quality'

/**
 * Memoize the ROUT-10 quality summary for the routine being reviewed.
 */
export function useRoutineQualitySummary(
	data: RoutineWizardData,
	exerciseMap: Record<string, Exercise>,
	locations: TrainingLocationPreference[] | undefined,
) {
	const tDate = useTranslations('routines.date')
	const tQuality = useTranslations('routines.quality')
	return useMemo(
		() =>
			buildRoutineQualitySummary(
				data,
				exerciseMap,
				locations,
				tDate,
				tQuality,
			),
		[data, exerciseMap, locations, tDate, tQuality],
	)
}
