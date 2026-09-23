'use client'

import type { WeightUnit, WorkoutSessionRecap } from '@sunsteel/contracts'
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
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
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
import type { RecapSections } from '@/lib/utils/session-share'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const ALL_SECTIONS: RecapSections = {
	duration: true,
	volume: true,
	completedSets: true,
	comparison: true,
	records: true,
	progression: true,
	notes: true,
}

// A static map: Tailwind only emits classes it can see as whole strings.
const HEADLINE_GRID_COLUMNS: Record<number, string> = {
	1: 'sm:grid-cols-1',
	2: 'sm:grid-cols-2',
	3: 'sm:grid-cols-3',
}

interface SessionRecapContentProps {
	recap: WorkoutSessionRecap
	/**
	 * Display unit. Defaults to the viewer's preference; a shared recap passes
	 * its owner's unit because a signed-out visitor has none.
	 */
	weightUnit?: WeightUnit
	/** Regions to render. Hidden regions are omitted, never shown as zero. */
	sections?: Partial<RecapSections>
	/** LIVE-16: the owner's control for editing the notes, on history only. */
	notesAction?: ReactNode
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

function HeadlineMetric({
	icon,
	label,
	value,
}: {
	icon: ReactNode
	label: string
	value: ReactNode
}) {
	return (
		<div className="flex items-center gap-3 bg-surface-sunk p-3">
			{icon}
			<div className="min-w-0">
				<p className="type-body-sm text-ink-3">{label}</p>
				<p className="type-data type-data-strong text-foreground">{value}</p>
			</div>
		</div>
	)
}

export function SessionRecapContent({
	recap,
	weightUnit: unitOverride,
	sections,
	notesAction,
}: SessionRecapContentProps) {
	const viewerUnit = useWeightUnit()
	const weightUnit = unitOverride ?? viewerUnit
	const unitLabel = getWeightUnitLabel(weightUnit)
	const previous = recap.previousSession
	const show = { ...ALL_SECTIONS, ...sections }

	const headline = [
		show.duration ? (
			<HeadlineMetric
				key="duration"
				icon={<Clock3 className="size-5 shrink-0 text-ink-3" aria-hidden />}
				label="Duration"
				value={formatDuration(recap.durationSec)}
			/>
		) : null,
		show.volume ? (
			<HeadlineMetric
				key="volume"
				icon={<Weight className="size-5 shrink-0 text-ink-3" aria-hidden />}
				label="Volume"
				value={`${formatWeightAmount(recap.totalVolumeKg, weightUnit, 1)} ${unitLabel}`}
			/>
		) : null,
		show.completedSets ? (
			<HeadlineMetric
				key="completedSets"
				icon={<CheckCheck className="size-5 shrink-0 text-ink-3" aria-hidden />}
				label="Completed sets"
				value={recap.completedSets}
			/>
		) : null,
	].filter(Boolean)

	return (
		<div className="space-y-6">
			{/* Headline figures: wells, square, on the tonal step below the surface
			    they sit on (§8). They were translucent `bg-muted/30` boxes. */}
			{headline.length > 0 ? (
				<div
					className={`grid grid-cols-1 gap-px bg-rule-faint ${HEADLINE_GRID_COLUMNS[headline.length]}`}
				>
					{headline}
				</div>
			) : null}

			{show.comparison ? (
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
						<p className="type-body-sm text-ink-3">
							This is the first completed session for this routine day.
						</p>
					)}
				</section>
			) : null}

			{show.records ? (
				<section className="space-y-3">
					{/* §4.3 rule 3 — records are exactly what `--honour` means, but at
					    most two marks per viewport. The heading glyph is this section's
					    one mark; the rows below stay neutral, as the dashboard's
					    Personal Records ledger does. Gold on every record would spend
					    the whole budget on one list. */}
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
			) : null}

			{show.progression ? (
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
			) : null}

			{show.notes ? (
				<section className="space-y-3">
					<div className="rule-row flex items-center gap-2 pb-2">
						<NotebookPen className="size-4 text-ink-3" aria-hidden />
						<h3 className="type-panel text-foreground">Session notes</h3>
					</div>
					{recap.notes?.trim() || !recap.exerciseNotes?.length ? (
						<p className="type-body-sm whitespace-pre-line bg-surface-sunk p-3 text-ink-2">
							{recap.notes?.trim() || 'No notes were added to this session.'}
						</p>
					) : null}
					{recap.exerciseNotes?.length ? (
						<ul className="space-y-2" aria-label="Exercise notes">
							{recap.exerciseNotes.map(item => (
								<li key={item.routineExerciseId} className="type-body-sm">
									<span className="text-foreground">{item.exerciseName}</span>
									<span className="whitespace-pre-line text-ink-2">
										{' '}
										{item.note}
									</span>
								</li>
							))}
						</ul>
					) : null}
					{notesAction}
				</section>
			) : null}
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

/**
 * The recap on the history detail page. A record region, so it is ruled rather
 * than boxed (§11.5): a section heading over a single rule — the page's one
 * double rule belongs to its masthead (§11.2).
 */
export function SessionRecapPanel({
	recap,
	action,
	notesAction,
}: SessionRecapContentProps & { action?: ReactNode }) {
	return (
		<section aria-labelledby="session-recap-heading" className="space-y-4">
			<div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2">
				<div className="min-w-0">
					<h2
						id="session-recap-heading"
						className="type-section text-foreground"
					>
						Session recap
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						{recap.routineName}
						{recap.dayName ? ` · ${recap.dayName}` : ''}
					</p>
				</div>
				{action}
			</div>
			<SessionRecapContent recap={recap} notesAction={notesAction} />
		</section>
	)
}
