import type { ProgressionScheme } from '../types'

export const requiresWeightIncrementField = (scheme: ProgressionScheme) =>
	scheme !== 'NONE'
