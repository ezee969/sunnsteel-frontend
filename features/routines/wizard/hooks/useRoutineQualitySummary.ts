import type { TrainingLocationPreference } from '@sunsteel/contracts'
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
	return useMemo(
		() => buildRoutineQualitySummary(data, exerciseMap, locations),
		[data, exerciseMap, locations],
	)
}
