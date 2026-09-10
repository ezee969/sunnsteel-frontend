'use client'

import { TrendingUp } from 'lucide-react'

import type { StrengthDisplayPoint } from '@/lib/utils/strength-trend'
import {
	getStrengthChartCoordinates,
	getStrengthMetricDelta,
} from '@/lib/utils/strength-trend'

const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const CHART_PADDING = 24

interface StrengthTrendChartProps {
	id: string
	title: string
	description: string
	points: StrengthDisplayPoint[]
	getValue: (point: StrengthDisplayPoint) => number
	formatValue: (value: number) => string
	formatPointDetail?: (point: StrengthDisplayPoint) => string
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(value))
}

export function StrengthTrendChart({
	id,
	title,
	description,
	points,
	getValue,
	formatValue,
	formatPointDetail,
}: StrengthTrendChartProps) {
	const coordinates = getStrengthChartCoordinates(
		points,
		point => Date.parse(point.plottedAt),
		getValue,
		CHART_WIDTH,
		CHART_HEIGHT,
		CHART_PADDING,
	)
	const delta = getStrengthMetricDelta(points, getValue)
	const latest = points[points.length - 1]
	const path = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
	const firstDate = points[0]?.plottedAt
	const lastDate = latest?.plottedAt

	return (
		<section className="rounded-sm border border-rule bg-surface p-4 sm:p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 id={`${id}-title`} className="type-panel text-foreground">
						{title}
					</h2>
					<p id={`${id}-description`} className="type-body-sm mt-1 text-ink-3">
						{description}
					</p>
				</div>
				{latest ? (
					<div className="shrink-0 text-right">
						<p className="type-data type-data-strong text-foreground">
							{formatValue(getValue(latest))}
						</p>
						<p className="type-label text-ink-3">
							{delta === null
								? 'First record'
								: `${delta >= 0 ? '+' : ''}${formatValue(delta)}`}
						</p>
					</div>
				) : null}
			</div>

			{coordinates.length > 0 ? (
				<div className="mt-6">
					<svg
						role="img"
						aria-labelledby={`${id}-title ${id}-description`}
						viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
						className="h-auto w-full overflow-visible"
					>
						<line
							x1={CHART_PADDING}
							y1={CHART_HEIGHT - CHART_PADDING}
							x2={CHART_WIDTH - CHART_PADDING}
							y2={CHART_HEIGHT - CHART_PADDING}
							className="stroke-rule"
						/>
						<line
							x1={CHART_PADDING}
							y1={CHART_PADDING}
							x2={CHART_PADDING}
							y2={CHART_HEIGHT - CHART_PADDING}
							className="stroke-rule"
						/>
						{coordinates.length > 1 ? (
							<polyline
								points={path}
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinejoin="round"
								strokeLinecap="round"
								className="text-honour-strong"
							/>
						) : null}
						{coordinates.map(({ point, x, y }) => (
							<circle
								key={`${point.sessionId}-${point.achievedAt}`}
								cx={x}
								cy={y}
								r={point.isBaseline ? 4 : 5}
								fill="currentColor"
								className={
									point.isBaseline ? 'text-ink-3' : 'text-honour-strong'
								}
							>
								<title>
									{point.isBaseline ? 'Starting best: ' : ''}
									{formatDate(point.achievedAt)} ·{' '}
									{formatValue(getValue(point))}
									{formatPointDetail ? ` · ${formatPointDetail(point)}` : ''}
								</title>
							</circle>
						))}
					</svg>
					<div className="type-label mt-2 flex justify-between text-ink-3">
						<span>{firstDate ? formatDate(firstDate) : ''}</span>
						<span>{lastDate ? formatDate(lastDate) : ''}</span>
					</div>
				</div>
			) : (
				<div className="mt-6 flex min-h-48 flex-col items-center justify-center border border-dashed border-rule bg-surface-sunk p-6 text-center">
					<TrendingUp className="size-6 text-ink-3" aria-hidden />
					<p className="type-body-sm mt-3 text-ink-2">
						No record changes in this range.
					</p>
				</div>
			)}
		</section>
	)
}
