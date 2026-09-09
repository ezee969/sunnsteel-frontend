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
		// §5.3 — captions inside a repeated item are Body small in sentence case.
		// The tracked uppercase micro-cap this had is the region-caption rank, and
		// three of them in a row is the "visual chatter" QA 10 flagged.
		<div className="bg-surface-sunk p-3">
			<p className="type-body-sm text-ink-3">{label}</p>
			<p className="type-data type-data-strong mt-2 text-foreground">
				{current}
			</p>
			<p className="type-body-sm text-ink-3">Previous {previous}</p>
			<p className="type-data mt-1 text-ink-2">{change}</p>
		</div>
	)
}

export function SessionRecapContent({ recap }: SessionRecapContentProps) {
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const previous = recap.previousSession

	return (
		<div className="space-y-6">
			{/* Headline figures: wells, square, on the tonal step below the surface
			    they sit on (§8). They were translucent `bg-muted/30` boxes. */}
			<div className="grid grid-cols-1 gap-px bg-rule-faint sm:grid-cols-3">
				<div className="flex items-center gap-3 bg-surface-sunk p-3">
					<Clock3 className="size-5 shrink-0 text-ink-3" aria-hidden />
					<div className="min-w-0">
						<p className="type-body-sm text-ink-3">Duration</p>
						<p className="type-data type-data-strong text-foreground">
							{formatDuration(recap.durationSec)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 bg-surface-sunk p-3">
					<Weight className="size-5 shrink-0 text-ink-3" aria-hidden />
					<div className="min-w-0">
						<p className="type-body-sm text-ink-3">Volume</p>
						<p className="type-data type-data-strong text-foreground">
							{formatWeightAmount(recap.totalVolumeKg, weightUnit, 1)}{' '}
							{unitLabel}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 bg-surface-sunk p-3">
					<CheckCheck className="size-5 shrink-0 text-ink-3" aria-hidden />
					<div className="min-w-0">
						<p className="type-body-sm text-ink-3">Completed sets</p>
						<p className="type-data type-data-strong text-foreground">
							{recap.completedSets}
						</p>
					</div>
				</div>
			</div>

			<section className="space-y-3">
				<div className="rule-row flex items-center gap-2 pb-2">
					<GitCompareArrows className="size-4 text-ink-3" aria-hidden />
					<h3 className="type-panel text-foreground">
						Compared with last time
					</h3>
				</div>
				{previous ? (
					<>
						<p className="type-body-sm text-ink-3">
							Previous session finished{' '}
							{new Date(previous.endedAt).toLocaleDateString()}.
						</p>
						<div className="grid grid-cols-1 gap-px bg-rule-faint sm:grid-cols-3">
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
					<p className="type-body-sm border border-dashed border-rule p-3 text-ink-3">
						This is the first completed session for this routine day.
					</p>
				)}
			</section>

			<section className="space-y-3">
				{/* §4.3 rule 3 — records are exactly what `--honour` means, but at most
				    two marks per viewport. The heading glyph is this section's one
				    mark; the rows below stay neutral, as the dashboard's Personal
				    Records ledger does. Gold on every record would spend the whole
				    budget on one list. */}
				<div className="rule-row flex items-center gap-2 pb-2">
					<Trophy className="size-4 text-honour" aria-hidden />
					<h3 className="type-panel text-foreground">Personal records</h3>
				</div>
				{recap.records.length > 0 ? (
					<ul className="grid grid-cols-1 gap-px bg-rule-faint sm:grid-cols-2">
						{recap.records.map(record => (
							<li
								key={`${record.exerciseId}:${record.kind}`}
								className="bg-surface-sunk p-3"
							>
								<p className="type-panel text-foreground">
									{record.exerciseName}
								</p>
								<p className="type-body-sm text-ink-3">
									{RECAP_RECORD_LABELS[record.kind]} · Set {record.setNumber}
								</p>
								<p className="type-data type-data-strong mt-1 text-foreground">
									{formatRecapRecordValue(record, weightUnit)}
								</p>
							</li>
						))}
					</ul>
				) : (
					<p className="type-body-sm text-ink-3">
						No new personal records in this session.
					</p>
				)}
			</section>

			<section className="space-y-3">
				{/* The second and last honour mark: a raised prescription is the
				    definition of "better than planned". */}
				<div className="rule-row flex items-center gap-2 pb-2">
					<TrendingUp className="size-4 text-honour" aria-hidden />
					<h3 className="type-panel text-foreground">Progression changes</h3>
				</div>
				{recap.progressionChanges.length > 0 ? (
					<div className="space-y-px bg-rule-faint">
						{recap.progressionChanges.map(change => (
							<div
								key={change.routineExerciseId}
								className="bg-surface-sunk p-3"
							>
								<p className="type-panel text-foreground">
									{change.exerciseName}
								</p>
								<p className="type-body-sm mt-1 text-ink-3">
									{getProgressionRuleExplanation(change, weightUnit)}
								</p>
								<ul className="mt-2 space-y-1">
									{change.sets.map(set => {
										const presentation = getProgressionSetPresentation(
											set,
											weightUnit,
										)
										return (
											<li
												key={set.setNumber}
												className="type-data flex flex-wrap justify-between gap-2 text-ink-2"
											>
												<span>
													{presentation.setLabel} · {presentation.repsLabel}
												</span>
												<span className="type-data-strong text-foreground">
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
					<p className="type-body-sm text-ink-3">
						No prescriptions changed after this session.
					</p>
				)}
			</section>

			<section className="space-y-3">
				<div className="rule-row flex items-center gap-2 pb-2">
					<NotebookPen className="size-4 text-ink-3" aria-hidden />
					<h3 className="type-panel text-foreground">Session notes</h3>
				</div>
				<p className="type-body-sm bg-surface-sunk p-3 text-ink-2">
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
							{/* §11.9 — one reading axis. This medallion was centred below
							    `sm` while the title and body stayed left. §7 also keeps
							    `rounded-full` for avatars. */}
							<div className="flex size-10 items-center justify-center rounded-sm bg-surface-sunk text-ink-2">
								<Sparkles className="size-5" aria-hidden />
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
				<CardTitle className="type-section text-foreground">
					Session recap
				</CardTitle>
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
