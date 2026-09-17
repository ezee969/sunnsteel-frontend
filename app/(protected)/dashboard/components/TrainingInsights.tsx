'use client'

import { Gauge, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { usePlateaus, useVolumeTrend } from '@/lib/api/hooks/useWorkoutSession'
import {
	buildDashboardInsights,
	DASHBOARD_INSIGHTS_EMPTY_STATE,
	type DashboardInsight,
	describeDashboardInsightSources,
} from '@/lib/utils/dashboard-insights'

const WEEK_FORMATTER = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	// The rollup's week starts are calendar dates, so they are read in UTC to
	// stop a negative offset showing the Sunday before the Monday.
	timeZone: 'UTC',
})
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})

const formatWeek = (weekStart: string) =>
	WEEK_FORMATTER.format(new Date(`${weekStart}T00:00:00.000Z`))
const formatDate = (iso: string) => DATE_FORMATTER.format(new Date(iso))

function InsightRow({ insight }: { insight: DashboardInsight }) {
	return (
		<li className="rule-row grid gap-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
			<div className="min-w-0">
				<p className="type-body-sm text-ink-3">{insight.label}</p>
				<h3 className="type-panel mt-0.5 text-foreground">
					<Link
						href={insight.href}
						className="underline-offset-4 hover:underline"
					>
						{insight.subject}
					</Link>
				</h3>
				<p className="type-body-sm mt-0.5 text-ink-2">{insight.statement}</p>
			</div>
			<p className="type-data text-ink-2 lg:text-right">{insight.evidence}</p>
		</li>
	)
}

/**
 * DASH-07. Concise facts placed from reads that already exist: the DATA-03
 * weekly rollup and the PROG-09 plateau watch. Neutral on purpose and in a
 * fixed order — the numbers say what happened, never why, and the screen does
 * not decide which of them matters most.
 */
export default function TrainingInsights() {
	const weightUnit = useWeightUnit()
	const plateaus = usePlateaus()
	const volume = useVolumeTrend(4)

	const isPending = plateaus.isPending || volume.isPending
	const isError = Boolean(plateaus.isError || volume.error)
	const insights = buildDashboardInsights({
		plateaus: plateaus.data,
		volume: volume.data,
		weightUnit,
		formatWeek,
		formatDate,
	})

	const retry = () => {
		void plateaus.refetch()
		void volume.retry()
	}

	return (
		<section aria-labelledby="training-insights">
			<h2
				id="training-insights"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Gauge className="h-4 w-4 text-ink-3" aria-hidden />
				Training Insights
			</h2>
			<div className="pt-1">
				{isPending ? (
					<div
						role="status"
						aria-label="Loading training insights"
						className="space-y-3 py-3"
					>
						<Skeleton className="h-14" />
						<Skeleton className="h-14" />
					</div>
				) : isError ? (
					<div role="alert" className="space-y-3 py-3">
						<p className="type-body-sm text-foreground">
							Training insights could not be loaded.
						</p>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={retry}
							disabled={plateaus.isFetching || volume.isFetching}
						>
							<RefreshCw className="size-4" aria-hidden />
							Try again
						</Button>
					</div>
				) : insights.length === 0 ? (
					<EmptyModule {...DASHBOARD_INSIGHTS_EMPTY_STATE} />
				) : (
					<>
						<p className="type-body-sm max-w-2xl pt-1 pb-2 text-ink-3">
							{describeDashboardInsightSources(plateaus.data)}
						</p>
						<ul className="border-t border-rule-faint">
							{insights.map(insight => (
								<InsightRow key={insight.key} insight={insight} />
							))}
						</ul>
					</>
				)}
			</div>
		</section>
	)
}
