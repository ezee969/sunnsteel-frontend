import type {
	VolumeTrendPoint,
	VolumeTrendResponse,
	VolumeTrendSeries,
} from '@sunsteel/contracts'

import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'

export const VOLUME_TREND_WEEK_OPTIONS = [4, 8, 12] as const
export type VolumeTrendWeeks = (typeof VOLUME_TREND_WEEK_OPTIONS)[number]
export type VolumeTrendScope = 'overall' | 'muscle' | 'routine' | 'exercise'

export interface VolumeTrendSelection {
	id: string
	name: string
	points: VolumeTrendPoint[]
}

export function getVolumeTrendSeries(
	data: VolumeTrendResponse,
	scope: Exclude<VolumeTrendScope, 'overall'>,
): VolumeTrendSeries[] {
	if (scope === 'muscle') {
		return data.muscles.map(series => ({
			...series,
			name: getFriendlyMuscleName(series.id),
		}))
	}
	return scope === 'routine' ? data.routines : data.exercises
}

export function getSelectedVolumeTrend(
	data: VolumeTrendResponse,
	scope: VolumeTrendScope,
	selectedId?: string,
): VolumeTrendSelection {
	if (scope === 'overall') {
		return { id: 'overall', name: 'All training', points: data.overall }
	}
	const series = getVolumeTrendSeries(data, scope)
	const selected = series.find(item => item.id === selectedId) ?? series[0]
	return (
		selected ?? {
			id: '',
			name: '',
			points: data.overall.map(point => ({
				...point,
				volumeKg: 0,
				completedSets: 0,
			})),
		}
	)
}

export function getVolumeTrendSummary(points: VolumeTrendPoint[]) {
	const totalVolumeKg = points.reduce((sum, point) => sum + point.volumeKg, 0)
	const completedSets = points.reduce(
		(sum, point) => sum + point.completedSets,
		0,
	)
	const completeWeeks = points.filter(point => !point.isCurrentWeek)
	const latestCompleteWeek = completeWeeks.at(-1) ?? null
	const previousCompleteWeek = completeWeeks.at(-2) ?? null
	const changePercent =
		latestCompleteWeek && previousCompleteWeek?.volumeKg
			? ((latestCompleteWeek.volumeKg - previousCompleteWeek.volumeKg) /
					previousCompleteWeek.volumeKg) *
				100
			: null
	return {
		totalVolumeKg,
		completedSets,
		latestCompleteWeek,
		previousCompleteWeek,
		changePercent,
	}
}

export function getVolumeBarPercent(value: number, points: VolumeTrendPoint[]) {
	const peak = Math.max(...points.map(point => point.volumeKg), 0)
	return peak > 0 ? Math.max((value / peak) * 100, value > 0 ? 4 : 0) : 0
}
