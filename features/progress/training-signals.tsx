'use client'

import type {
	DeloadSuggestionResponse,
	TrainingSignalsResponse,
	WeightUnit,
} from '@sunsteel/contracts'
import { Activity, AlertTriangle, CalendarRange, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
	DELOAD_SUGGESTION_ACTION,
	DELOAD_SUGGESTION_TITLE,
	deloadSuggestionHref,
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
	TRAINING_SIGNAL_MARKED_LABEL,
	TRAINING_SIGNAL_TITLES,
	TRAINING_SIGNALS_TITLE,
} from '@/lib/utils/training-signals'

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
})
const formatDate = (iso: string) => DATE_FORMATTER.format(new Date(iso))

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
						{TRAINING_SIGNAL_MARKED_LABEL}
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
	return (
		<section aria-labelledby="training-signals" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<Activity className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="training-signals" className="type-section text-foreground">
						{TRAINING_SIGNALS_TITLE}
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						{data
							? describeSignalsIntro(data.thresholds)
							: 'Measures from your logged workouts over the last four weeks.'}
					</p>
					{data ? (
						<p className="type-body-sm mt-1 max-w-3xl text-ink-3">
							{describeSignalsRule(data.thresholds)}
						</p>
					) : null}
				</div>
			</div>

			{isPending ? (
				<div
					role="status"
					aria-label="Loading training signals"
					className="space-y-3"
				>
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : isError || !data ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">
						Training signals are unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not read your recent workouts. Try again.
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
			) : (
				<ul className="border-t border-rule-faint">
					<SignalRow
						title={TRAINING_SIGNAL_TITLES.effort}
						marked={data.effort.marked}
					>
						<p className="type-body-sm text-ink-2">{describeEffort(data)}</p>
					</SignalRow>
					<SignalRow
						title={TRAINING_SIGNAL_TITLES.repTargets}
						marked={data.repTargets.marked}
					>
						<p className="type-body-sm text-ink-2">
							{describeRepTargets(data)}
						</p>
					</SignalRow>
					<SignalRow
						title={TRAINING_SIGNAL_TITLES.declines}
						marked={data.declines.marked}
					>
						{data.declines.lifts.length === 0 ? (
							<p className="type-body-sm text-ink-2">
								{describeNoDeclines(data)}
							</p>
						) : (
							<ul className="grid gap-2">
								{data.declines.lifts.map(lift => (
									<li key={lift.exerciseId} className="type-body-sm text-ink-2">
										<Link
											href={`/exercises/${lift.exerciseId}`}
											className="text-foreground underline-offset-4 hover:underline"
										>
											{lift.exerciseName}
										</Link>
										: {describeDecline(lift, weightUnit, formatDate)}
									</li>
								))}
							</ul>
						)}
					</SignalRow>
					<SignalRow
						title={TRAINING_SIGNAL_TITLES.workouts}
						marked={data.workouts.marked}
					>
						<p className="type-body-sm text-ink-2">{describeWorkouts(data)}</p>
					</SignalRow>
					{hasDeloadSuggestion(deloadSuggestion) ? (
						<li className="rule-row grid gap-2 py-4">
							<h3 className="type-panel text-foreground">
								{DELOAD_SUGGESTION_TITLE}
							</h3>
							<p className="type-body-sm text-ink-2">
								{describeSuggestionEvidence(deloadSuggestion.evidence, data)}
							</p>
							<p className="type-body-sm text-ink-2">
								{describeSuggestionPlan(deloadSuggestion.suggestion)}
							</p>
							<div>
								{/* Outline on purpose: a suggestion is never the page's primary action. */}
								<Button asChild size="sm" variant="outline">
									<Link
										href={deloadSuggestionHref(deloadSuggestion.suggestion)}
									>
										<CalendarRange className="size-4" aria-hidden />
										{DELOAD_SUGGESTION_ACTION}
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
