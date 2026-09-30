'use client'

import type {
	DeloadSuggestionResponse,
	TrainingSignalsResponse,
	WeightUnit,
} from '@sunsteel/contracts'
import { Activity, AlertTriangle, CalendarRange, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { intlLocale } from '@/i18n/date-locale'
import { cn } from '@/lib/utils'
import {
	deloadSuggestionAction,
	deloadSuggestionHref,
	deloadSuggestionTitle,
	describeSuggestionEvidence,
	describeSuggestionPlan,
	hasDeloadSuggestion,
} from '@/lib/utils/deload-suggestion'
import {
	describeDecline,
	describeEffort,
	describeNoDeclines,
	describeRepTargets,
	describeSignalsIntro,
	describeSignalsRule,
	describeWorkouts,
	trainingSignalMarkedLabel,
	trainingSignalsTitle,
	trainingSignalTitles,
} from '@/lib/utils/training-signals'

interface TrainingSignalsProps {
	data?: TrainingSignalsResponse
	weightUnit: WeightUnit
	isPending: boolean
	isError: boolean
	onRetry: () => void
	/** INTEL-02: shown only when the server suggests a deload. */
	deloadSuggestion?: DeloadSuggestionResponse
}

/**
 * A marked signal carries the warning mark -- a left rule and a triangle,
 * never warning-coloured text -- plus the word, so the state never rests on
 * colour alone. It means a printed threshold was crossed, nothing more.
 */
function SignalRow({
	title,
	marked,
	children,
}: {
	title: string
	marked: boolean
	children: ReactNode
}) {
	const t = useTranslations('progress.signals')
	return (
		<li
			className={cn(
				'rule-row grid gap-1 py-4',
				marked && 'mark mark-warning bg-surface-sunk pl-3 pr-3',
			)}
		>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<h3 className="type-panel text-foreground">{title}</h3>
				{marked ? (
					<span className="type-body-sm inline-flex items-center gap-1 text-ink-2">
						<AlertTriangle
							className="size-3.5 shrink-0 text-warning-strong"
							aria-hidden
						/>
						{trainingSignalMarkedLabel(t)}
					</span>
				) : null}
			</div>
			{children}
		</li>
	)
}

/**
 * PROG-10: effort, rep targets, declining lifts and workouts, each over the
 * last two periods with its evidence. It states numbers and never a cause;
 * suggesting what to do with them belongs to `INTEL-02`.
 */
export function TrainingSignals({
	data,
	weightUnit,
	isPending,
	isError,
	onRetry,
	deloadSuggestion,
}: TrainingSignalsProps) {
	const t = useTranslations('progress.signals')
	const tDeload = useTranslations('progress.deloadSuggestion')
	const tEx = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const titles = trainingSignalTitles(t)
	const formatDate = (iso: string) =>
		new Intl.DateTimeFormat(intlLocale(locale), {
			month: 'short',
			day: 'numeric',
		}).format(new Date(iso))
	return (
		<section aria-labelledby="training-signals" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<Activity className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="training-signals" className="type-section text-foreground">
						{trainingSignalsTitle(t)}
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						{data
							? describeSignalsIntro(data.thresholds, t)
							: t('introFallback')}
					</p>
					{data ? (
						<p className="type-body-sm mt-1 max-w-3xl text-ink-3">
							{describeSignalsRule(data.thresholds, t, locale)}
						</p>
					) : null}
				</div>
			</div>

			{isPending ? (
				<div role="status" aria-label={t('loading')} className="space-y-3">
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : isError || !data ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">{t('unavailable')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('unavailableBody')}</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="mt-3"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : (
				<ul className="border-t border-rule-faint">
					<SignalRow title={titles.effort} marked={data.effort.marked}>
						<p className="type-body-sm text-ink-2">
							{describeEffort(data, t, locale)}
						</p>
					</SignalRow>
					<SignalRow title={titles.repTargets} marked={data.repTargets.marked}>
						<p className="type-body-sm text-ink-2">
							{describeRepTargets(data, t)}
						</p>
					</SignalRow>
					<SignalRow title={titles.declines} marked={data.declines.marked}>
						{data.declines.lifts.length === 0 ? (
							<p className="type-body-sm text-ink-2">
								{describeNoDeclines(data, t)}
							</p>
						) : (
							<ul className="grid gap-2">
								{data.declines.lifts.map(lift => (
									<li key={lift.exerciseId} className="type-body-sm text-ink-2">
										<Link
											href={`/exercises/${lift.exerciseId}`}
											className="text-foreground underline-offset-4 hover:underline"
										>
											{exerciseLabel(lift.exerciseName, tEx)}
										</Link>
										: {describeDecline(lift, weightUnit, formatDate, t, locale)}
									</li>
								))}
							</ul>
						)}
					</SignalRow>
					<SignalRow title={titles.workouts} marked={data.workouts.marked}>
						<p className="type-body-sm text-ink-2">
							{describeWorkouts(data, t, locale)}
						</p>
					</SignalRow>
					{hasDeloadSuggestion(deloadSuggestion) ? (
						<li className="rule-row grid gap-2 py-4">
							<h3 className="type-panel text-foreground">
								{deloadSuggestionTitle(tDeload)}
							</h3>
							<p className="type-body-sm text-ink-2">
								{describeSuggestionEvidence(
									deloadSuggestion.evidence,
									tDeload,
									locale,
									data,
								)}
							</p>
							<p className="type-body-sm text-ink-2">
								{describeSuggestionPlan(
									deloadSuggestion.suggestion,
									tDeload,
									locale,
								)}
							</p>
							<div>
								{/* Outline on purpose: a suggestion is never the page's primary action. */}
								<Button asChild size="sm" variant="outline">
									<Link
										href={deloadSuggestionHref(deloadSuggestion.suggestion)}
									>
										<CalendarRange className="size-4" aria-hidden />
										{deloadSuggestionAction(tDeload)}
									</Link>
								</Button>
							</div>
						</li>
					) : null}
				</ul>
			)}
		</section>
	)
}
