'use client'

import type {
	ExercisePlateau,
	PlateausResponse,
	WeightUnit,
} from '@sunsteel/contracts'
import { Gauge, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	describePlateauCount,
	describePlateauRule,
	formatClosestRatio,
	formatEstimate,
	formatPlateauSet,
	getPlateauEmptyState,
} from '@/lib/utils/plateaus'

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})
const formatDate = (iso: string) => DATE_FORMATTER.format(new Date(iso))

interface PlateauWatchProps {
	data?: PlateausResponse
	weightUnit: WeightUnit
	isPending: boolean
	isError: boolean
	onRetry: () => void
}

function PlateauRow({
	plateau,
	thresholds,
	weightUnit,
}: {
	plateau: ExercisePlateau
	thresholds: PlateausResponse['thresholds']
	weightUnit: WeightUnit
}) {
	const count = describePlateauCount(plateau, thresholds, formatDate)
	return (
		<li className="rule-row grid gap-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
			<div className="min-w-0">
				<h3 className="type-panel text-foreground">
					<Link
						href={`/exercises/${plateau.exerciseId}`}
						className="underline-offset-4 hover:underline"
					>
						{plateau.exerciseName}
					</Link>
				</h3>
				<p className="type-body-sm mt-0.5 text-ink-2">
					{count.headline} <span className="text-ink-3">{count.since}</span>
				</p>
			</div>
			<dl className="type-body-sm grid gap-1 text-ink-3 lg:text-right">
				<div>
					<dt className="inline">Best </dt>
					<dd className="inline">
						<span className="type-data text-ink-2">
							{formatPlateauSet(plateau.best, weightUnit)}
						</span>{' '}
						· est. 1RM{' '}
						<span className="type-data text-ink-2">
							{formatEstimate(plateau.best, weightUnit)}
						</span>
					</dd>
				</div>
				<div>
					<dt className="inline">Closest since </dt>
					<dd className="inline">
						<span className="type-data text-ink-2">
							{formatPlateauSet(plateau.closest, weightUnit)}
						</span>{' '}
						· {formatClosestRatio(plateau.closestRatio)} of that estimate
					</dd>
				</div>
			</dl>
		</li>
	)
}

/**
 * PROG-09: lifts that keep being trained without a new best. Neutral on
 * purpose — no honour, warning or destructive colour — because the numbers
 * describe what happened and never why (retained rule on automated insights).
 */
export function PlateauWatch({
	data,
	weightUnit,
	isPending,
	isError,
	onRetry,
}: PlateauWatchProps) {
	return (
		<section aria-labelledby="plateau-watch" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<Gauge className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="plateau-watch" className="type-section text-foreground">
						Plateau watch
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						{data
							? describePlateauRule(data.thresholds)
							: 'Lifts you keep training without a new best set.'}
					</p>
				</div>
			</div>

			{isPending ? (
				<div
					role="status"
					aria-label="Loading plateau watch"
					className="space-y-3"
				>
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : isError || !data ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">
						Plateau watch is unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not compare your recent sessions with your bests. Try
						again.
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="mt-3"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						Retry
					</Button>
				</div>
			) : data.plateaus.length === 0 ? (
				<EmptyModule
					{...getPlateauEmptyState(data.checkedExercises, data.thresholds)}
				/>
			) : (
				<ul className="border-t border-rule-faint">
					{data.plateaus.map(plateau => (
						<PlateauRow
							key={plateau.exerciseId}
							plateau={plateau}
							thresholds={data.thresholds}
							weightUnit={weightUnit}
						/>
					))}
				</ul>
			)}
		</section>
	)
}
