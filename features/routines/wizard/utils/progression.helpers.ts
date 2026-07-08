import type { ProgressionScheme } from '../types'
import {
	isRtfProgressionScheme,
	isRtfStandardScheme,
	isRtfHypertrophyScheme,
} from '@/lib/utils/rtf-week-calculator'

export const RTF_STANDARD_SET_COUNT = 5
export const RTF_HYPERTROPHY_SET_COUNT = 4

// Delegate to the canonical RtF scheme checks in lib/utils/rtf-week-calculator
// so the underlying string comparisons live in exactly one place.
export const isRtFStandard = (scheme: ProgressionScheme) => isRtfStandardScheme(scheme)

export const isRtFHypertrophy = (scheme: ProgressionScheme) => isRtfHypertrophyScheme(scheme)

export const isRtFExercise = (scheme: ProgressionScheme) => isRtfProgressionScheme(scheme)

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
