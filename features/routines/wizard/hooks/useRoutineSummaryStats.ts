import { useMemo } from 'react'
import type { RoutineWizardData } from '../types'
import { computeRoutineTotals } from '../utils/routine-summary'

/**
 * Compute and memoize aggregate totals for the given routine wizard data.
 *
 * Memoizes the result so totals are recomputed only when `data` changes.
 *
 * @param data - Routine wizard input used to derive the totals
 * @returns Aggregated totals computed from the provided `data`
 */
export function useRoutineSummaryStats(data: RoutineWizardData) {
	return useMemo(() => computeRoutineTotals(data), [data])
}
