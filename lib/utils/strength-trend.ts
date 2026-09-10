import type {
	ExerciseStrengthTrendPoint,
	ExerciseStrengthTrendResponse,
} from '@sunsteel/contracts'

export const STRENGTH_RANGE_OPTIONS = [
	{ value: '30D', label: '30 days' },
	{ value: '90D', label: '90 days' },
	{ value: '6M', label: '6 months' },
	{ value: '1Y', label: '1 year' },
	{ value: 'ALL', label: 'All time' },
] as const

export type StrengthRange = (typeof STRENGTH_RANGE_OPTIONS)[number]['value']

export function getStrengthTrendRange(
	range: StrengthRange,
	now = new Date(),
): { from?: string; to: string } {
	const to = new Date(now)
	const from = new Date(now)
	if (range === 'ALL') return { to: to.toISOString() }
	if (range === '6M') from.setUTCMonth(from.getUTCMonth() - 6)
	else if (range === '1Y') from.setUTCFullYear(from.getUTCFullYear() - 1)
	else from.setUTCDate(from.getUTCDate() - (range === '30D' ? 30 : 90))
	return { from: from.toISOString(), to: to.toISOString() }
}

export interface StrengthDisplayPoint extends ExerciseStrengthTrendPoint {
	plottedAt: string
	isBaseline: boolean
}

export function getStrengthDisplayPoints(
	trend: ExerciseStrengthTrendResponse,
): StrengthDisplayPoint[] {
	const baseline = trend.baseline
		? [
				{
					...trend.baseline,
					plottedAt: trend.range.from ?? trend.baseline.achievedAt,
					isBaseline: true,
				},
			]
		: []
	return [
		...baseline,
		...trend.points.map(point => ({
			...point,
			plottedAt: point.achievedAt,
			isBaseline: false,
		})),
	]
}

export interface StrengthChartCoordinate<T> {
	point: T
	x: number
	y: number
}

export function getStrengthChartCoordinates<T>(
	points: T[],
	getTimestamp: (point: T) => number,
	getValue: (point: T) => number,
	width: number,
	height: number,
	padding = 20,
): StrengthChartCoordinate<T>[] {
	if (points.length === 0) return []
	const timestamps = points.map(getTimestamp)
	const values = points.map(getValue)
	const minTime = Math.min(...timestamps)
	const maxTime = Math.max(...timestamps)
	const minValue = Math.min(...values)
	const maxValue = Math.max(...values)
	const innerWidth = Math.max(0, width - padding * 2)
	const innerHeight = Math.max(0, height - padding * 2)
	return points.map((point, index) => ({
		point,
		x:
			minTime === maxTime
				? width / 2
				: padding +
					((timestamps[index] - minTime) / (maxTime - minTime)) * innerWidth,
		y:
			minValue === maxValue
				? height / 2
				: padding +
					(1 - (values[index] - minValue) / (maxValue - minValue)) *
						innerHeight,
	}))
}

export function getStrengthMetricDelta<T>(
	points: T[],
	getValue: (point: T) => number,
): number | null {
	if (points.length < 2) return null
	return getValue(points[points.length - 1]) - getValue(points[0])
}
