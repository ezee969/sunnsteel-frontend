'use client'

import type { RoutineTrainingBlock, WeightUnit } from '@sunsteel/contracts'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { useTrainingBlockComparison } from '@/lib/api/hooks/useRoutineTrainingBlocks'
import {
	comparisonRows,
	describeComparisonScope,
	describeLift,
	describeNoLifts,
	periodDates,
	periodName,
} from '@/lib/utils/training-block-comparison'

/**
 * PROG-11: a block beside the block before it, measure by measure. Neutral on
 * purpose -- no honour, success or warning colour, and no ranking -- because
 * the numbers say what happened in each period and never which was better.
 */
export function TrainingBlockComparisonDialog({
	routineId,
	block,
	weightUnit,
	onClose,
}: {
	routineId: string
	block: RoutineTrainingBlock
	weightUnit: WeightUnit
	onClose: () => void
}) {
	const t = useTranslations('routines.listing')
	const tCompare = useTranslations('progress.blockComparison')
	const tEx = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const comparison = useTrainingBlockComparison(routineId, block.seriesId)
	const data = comparison.data

	return (
		<Dialog open onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Compare {block.name}</DialogTitle>
					<DialogDescription>
						{data
							? describeComparisonScope(data, tCompare)
							: t('comparisonNote')}
					</DialogDescription>
				</DialogHeader>

				{comparison.isPending ? (
					<div
						role="status"
						aria-label={t('loadingComparison')}
						className="space-y-3"
					>
						<Skeleton className="h-10" />
						<Skeleton className="h-10" />
						<Skeleton className="h-10" />
					</div>
				) : comparison.isError || !data ? (
					<div role="alert" className="border border-rule bg-surface p-5">
						<p className="type-panel text-foreground">
							{t('comparisonUnavailable')}
						</p>
						<p className="type-body-sm mt-1 text-ink-3">
							{comparison.error?.message ?? t('comparisonFailed')}
						</p>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="mt-3"
							onClick={() => void comparison.refetch()}
						>
							<RefreshCw className="size-4" aria-hidden />
							Retry
						</Button>
					</div>
				) : (
					<div className="space-y-6">
						<dl className="grid grid-cols-2 gap-3 border-b border-rule-faint pb-3">
							{[data.previous, data.current].map(period => (
								<div
									key={`${period.kind}-${period.startDate}`}
									className="min-w-0"
								>
									<dt className="type-label text-ink-3">
										{period === data.current ? t('thisBlock') : t('before')}
									</dt>
									<dd className="type-panel text-foreground">
										{periodName(period, tCompare)}
									</dd>
									<dd className="type-body-sm text-ink-3">
										{periodDates(period, tCompare, locale)}
									</dd>
								</div>
							))}
						</dl>

						<ul className="border-t border-rule-faint">
							{comparisonRows(data, weightUnit, tCompare, locale).map(row => (
								<li key={row.label} className="rule-row grid gap-1 py-3">
									<h3 className="type-panel text-foreground">{row.label}</h3>
									<div className="grid grid-cols-2 gap-3">
										<p className="type-body-sm min-w-0 text-ink-2">
											<span className="sr-only">
												{periodName(data.previous, tCompare)}:{' '}
											</span>
											{row.previous}
										</p>
										<p className="type-body-sm min-w-0 text-ink-2">
											<span className="sr-only">
												{periodName(data.current, tCompare)}:{' '}
											</span>
											{row.current}
										</p>
									</div>
									{row.change ? (
										<p className="type-body-sm text-ink-3">{row.change}</p>
									) : null}
								</li>
							))}
						</ul>

						<section
							aria-labelledby="block-comparison-lifts"
							className="space-y-2"
						>
							<h3
								id="block-comparison-lifts"
								className="type-panel text-foreground"
							>
								{t('liftsInBoth')}
							</h3>
							{data.lifts.length === 0 ? (
								<p className="type-body-sm text-ink-3">
									{describeNoLifts(tCompare)}
								</p>
							) : (
								<ul className="border-t border-rule-faint">
									{data.lifts.map(lift => (
										<li
											key={lift.exerciseId}
											className="rule-row type-body-sm py-2 text-ink-2"
										>
											<Link
												href={`/exercises/${lift.exerciseId}`}
												className="text-foreground underline-offset-4 hover:underline"
											>
												{exerciseLabel(lift.exerciseName, tEx)}
											</Link>
											: {describeLift(lift, weightUnit, tCompare, locale)}
										</li>
									))}
								</ul>
							)}
						</section>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
