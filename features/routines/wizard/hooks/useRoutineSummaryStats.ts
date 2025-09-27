import { useMemo } from 'react'
import type { RoutineWizardData } from '../types'
import { computeRoutineTotals } from '../utils/routine-summary'

export function useRoutineSummaryStats(data: RoutineWizardData) {
	return useMemo(() => computeRoutineTotals(data), [data])
}
