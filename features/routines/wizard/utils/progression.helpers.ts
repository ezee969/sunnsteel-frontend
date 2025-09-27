import type { ProgressionScheme } from '../types'

export const RTF_STANDARD_SET_COUNT = 5
export const RTF_HYPERTROPHY_SET_COUNT = 4

export const isRtFStandard = (scheme: ProgressionScheme) => scheme === 'PROGRAMMED_RTF'

export const isRtFHypertrophy = (scheme: ProgressionScheme) =>
	scheme === 'PROGRAMMED_RTF_HYPERTROPHY'

export const isRtFExercise = (scheme: ProgressionScheme) =>
	isRtFStandard(scheme) || isRtFHypertrophy(scheme)

export interface RtfSetSummary {
	totalSets: number
	fixedSets: number
	repRange: string
}

export const getRtfSetSummary = (scheme: ProgressionScheme): RtfSetSummary => {
	if (isRtFStandard(scheme)) {
		return { totalSets: RTF_STANDARD_SET_COUNT, fixedSets: 4, repRange: '1-5' }
	}
	if (isRtFHypertrophy(scheme)) {
		return { totalSets: RTF_HYPERTROPHY_SET_COUNT, fixedSets: 3, repRange: '5-10' }
	}
	return { totalSets: 0, fixedSets: 0, repRange: '' }
}

export const getPresetSetCountForScheme = (
	scheme: ProgressionScheme,
	defaultCount: number,
) => {
	if (isRtFStandard(scheme)) {
		return RTF_STANDARD_SET_COUNT
	}
	if (isRtFHypertrophy(scheme)) {
		return RTF_HYPERTROPHY_SET_COUNT
	}
	return defaultCount
}

export const requiresWeightIncrementField = (scheme: ProgressionScheme) =>
	scheme !== 'NONE' && !isRtFExercise(scheme)
