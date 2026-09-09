'use client'

import type { WorkoutSessionRecap } from '@sunsteel/contracts'
import {
	CheckCheck,
	Clock3,
	GitCompareArrows,
	NotebookPen,
	Sparkles,
	TrendingUp,
	Trophy,
	Weight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'
import {
	formatRecapDurationDelta,
	formatRecapRecordValue,
	formatRecapSetsDelta,
	formatRecapWeightDelta,
	RECAP_RECORD_LABELS,
} from '@/lib/utils/session-recap'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

interface SessionRecapContentProps {
	recap: WorkoutSessionRecap
}

interface ComparisonMetricProps {
	label: string
	current: string
	previous: string
	change: string
}

function ComparisonMetric({
	label,
	current,
	previous,
	change,
}: ComparisonMetricProps) {
	return (
		<div className="rounded-lg border bg-background/70 p-3">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<p className="mt-2 font-semibold">{current}</p>
			<p className="text-xs text-muted-foreground">Previous {previous}</p>
			<p className="mt-1 text-sm font-medium">{change}</p>
		</div>
	)
}

export function SessionRecapContent({ recap }: SessionRecapContentProps) {
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const previous = recap.previousSession

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
					<Clock3 className="size-5 text-muted-foreground" aria-hidden />
					<div>
						<p className="text-xs text-muted-foreground">Duration</p>
						<p className="font-semibold">{formatDuration(recap.durationSec)}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
					<Weight className="size-5 text-muted-foreground" aria-hidden />
					<div>
						<p className="text-xs text-muted-foreground">Volume</p>
						<p className="font-semibold">
							{formatWeightAmount(recap.totalVolumeKg, weightUnit, 1)}{' '}
							{unitLabel}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
					<CheckCheck className="size-5 text-muted-foreground" aria-hidden />
					<div>
						<p className="text-xs text-muted-foreground">Completed sets</p>
						<p className="font-semibold">{recap.completedSets}</p>
					</div>
				</div>
			</div>

			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<GitCompareArrows className="size-5 text-primary" aria-hidden />
					<h3 className="font-semibold">Compared with last time</h3>
				</div>
				{previous ? (
					<>
						<p className="text-sm text-muted-foreground">
							Previous session finished{' '}
							{new Date(previous.endedAt).toLocaleDateString()}.
						</p>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<ComparisonMetric
								label="Duration"
								current={formatDuration(recap.durationSec)}
								previous={formatDuration(previous.durationSec)}
								change={formatRecapDurationDelta(previous.durationDeltaSec)}
							/>
							<ComparisonMetric
								label="Volume"
								current={`${formatWeightAmount(recap.totalVolumeKg, weightUnit, 1)} ${unitLabel}`}
								previous={`${formatWeightAmount(previous.totalVolumeKg, weightUnit, 1)} ${unitLabel}`}
								change={formatRecapWeightDelta(
									previous.volumeDeltaKg,
									weightUnit,
								)}
							/>
							<ComparisonMetric
								label="Completed sets"
								current={String(recap.completedSets)}
								previous={String(previous.completedSets)}
								change={formatRecapSetsDelta(previous.completedSetsDelta)}
							/>
						</div>
					</>
				) : (
					<p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
						This is the first completed session for this routine day.
					</p>
				)}
			</section>

			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<Trophy className="size-5 text-amber-600" aria-hidden />
					<h3 className="font-semibold">Personal records</h3>
				</div>
				{recap.records.length > 0 ? (
					<ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{recap.records.map(record => (
							<li
								key={`${record.exerciseId}:${record.kind}`}
								className="rounded-lg border bg-amber-500/5 p-3"
							>
								<p className="font-medium">{record.exerciseName}</p>
								<p className="text-sm text-muted-foreground">
									{RECAP_RECORD_LABELS[record.kind]} · Set {record.setNumber}
								</p>
								<p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">
									{formatRecapRecordValue(record, weightUnit)}
								</p>
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">
						No new personal records in this session.
					</p>
				)}
			</section>

			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<TrendingUp className="size-5 text-emerald-600" aria-hidden />
					<h3 className="font-semibold">Progression changes</h3>
				</div>
				{recap.progressionChanges.length > 0 ? (
					<div className="space-y-3">
						{recap.progressionChanges.map(change => (
							<div
								key={change.routineExerciseId}
								className="rounded-lg border bg-emerald-500/5 p-3"
							>
								<p className="font-medium">{change.exerciseName}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{getProgressionRuleExplanation(change, weightUnit)}
								</p>
								<ul className="mt-2 space-y-1 text-sm">
									{change.sets.map(set => {
										const presentation = getProgressionSetPresentation(
											set,
											weightUnit,
										)
										return (
											<li
												key={set.setNumber}
												className="flex flex-wrap justify-between gap-2"
											>
												<span>
													{presentation.setLabel} · {presentation.repsLabel}
												</span>
												<span className="font-medium">
													{presentation.weightLabel}
												</span>
											</li>
										)
									})}
								</ul>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						No prescriptions changed after this session.
					</p>
				)}
			</section>

			<section className="space-y-3">
				<div className="flex items-center gap-2">
					<NotebookPen className="size-5 text-primary" aria-hidden />
					<h3 className="font-semibold">Session notes</h3>
				</div>
				<p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
					{recap.notes?.trim() || 'No notes were added to this session.'}
				</p>
			</section>
		</div>
	)
}

interface SessionRecapDialogProps {
	recap: WorkoutSessionRecap | null
	onContinue: () => void
}

export function SessionRecapDialog({
	recap,
	onContinue,
}: SessionRecapDialogProps) {
	return (
		<Dialog
			open={Boolean(recap)}
			onOpenChange={open => {
				if (!open) onContinue()
			}}
		>
			<DialogContent
				className="max-h-[90vh] max-w-3xl overflow-y-auto"
				showCloseButton={false}
			>
				{recap ? (
					<>
						<DialogHeader>
							<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mx-0">
								<Sparkles className="size-6" aria-hidden />
							</div>
							<DialogTitle>Session complete</DialogTitle>
							<DialogDescription>
								{recap.routineName}
								{recap.dayName ? ` · ${recap.dayName}` : ''}
							</DialogDescription>
						</DialogHeader>
						<SessionRecapContent recap={recap} />
						<DialogFooter>
							<Button onClick={onContinue} className="w-full sm:w-auto">
								Continue to dashboard
							</Button>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	)
}

export function SessionRecapPanel({ recap }: SessionRecapContentProps) {
	return (
		<Card className="mb-6">
			<CardHeader>
				<CardTitle>Session recap</CardTitle>
				<CardDescription>
					{recap.routineName}
					{recap.dayName ? ` · ${recap.dayName}` : ''}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<SessionRecapContent recap={recap} />
			</CardContent>
		</Card>
	)
}
