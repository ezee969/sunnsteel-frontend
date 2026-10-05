'use client'

import type { WeightUnit, WorkoutSessionRecap } from '@sunsteel/contracts'
import {
	CalendarRange,
	CheckCheck,
	Clock3,
	GitCompareArrows,
	NotebookPen,
	Sparkles,
	TrendingUp,
	Trophy,
	Weight,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
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
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { describeLinearBlockChanges } from '@/lib/utils/linear-block-recap'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'
import {
	formatRecapDurationDelta,
	formatRecapRecordValue,
	formatRecapSetsDelta,
	formatRecapWeightDelta,
	recapRecordLabel,
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
	linearBlock: true,
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
	/** ROUT-17: the workout's day is a rotation's, so blocks count sessions. */
	rotation?: boolean
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
	const t = useTranslations('workout.recap')
	return (
		// §5.3 — captions inside a repeated item are Body small in sentence case.
		// The tracked uppercase micro-cap this had is the region-caption rank, and
		// three of them in a row is the "visual chatter" QA 10 flagged.
		// v1.1 §26.7: below `sm` the four lines pair up -- the label beside
		// today's value, last time beside the change -- instead of stacking.
		<div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 bg-surface-sunk p-3 sm:block">
			<p className="type-body-sm text-ink-3">{label}</p>
			<p className="type-data type-data-strong text-right text-foreground sm:mt-2 sm:text-left">
				{current}
			</p>
			<p className="type-body-sm text-ink-3">
				{t('previousValue', { value: previous })}
			</p>
			<p className="type-data text-right text-ink-2 sm:mt-1 sm:text-left">
				{change}
			</p>
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
		// v1.1 §26.7: one ruled line per figure below `sm`, label and value on
		// the same baseline; the panel it was from `sm`.
		<div className="flex items-center gap-3 bg-surface-sunk px-3 py-2 sm:py-3">
			{icon}
			<div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 sm:block">
				<p className="type-body-sm text-ink-3">{label}</p>
				<p className="type-data type-data-strong text-right text-foreground sm:text-left">
					{value}
				</p>
			</div>
		</div>
	)
}

export function SessionRecapContent({
	recap,
	weightUnit: unitOverride,
	sections,
	notesAction,
	rotation = false,
}: SessionRecapContentProps) {
	const t = useTranslations('workout.recap')
	const tChange = useTranslations('progress.progressionChange')
	const tEx = useTranslations('catalog.exercises')
	const tBlock = useTranslations('workout.linearBlock')
	const tRoutineBlock = useTranslations('routines.linearBlock')
	const locale = useLocale() as Locale
	const viewerUnit = useWeightUnit()
	const weightUnit = unitOverride ?? viewerUnit
	const unitLabel = getWeightUnitLabel(weightUnit)
	const previous = recap.previousSession
	const show = { ...ALL_SECTIONS, ...sections }
	const blockItems = show.linearBlock
		? describeLinearBlockChanges(
				recap.linearBlockChanges,
				{ rotation, unit: weightUnit, locale },
				tBlock,
				tRoutineBlock,
			)
		: []
	const routineHref = recap.routineId ? `/routines/${recap.routineId}` : null

	const headline = [
		show.duration ? (
			<HeadlineMetric
				key="duration"
				icon={<Clock3 className="size-5 shrink-0 text-ink-3" aria-hidden />}
				label={t('duration')}
				value={formatDuration(recap.durationSec)}
			/>
		) : null,
		show.volume ? (
			<HeadlineMetric
				key="volume"
				icon={<Weight className="size-5 shrink-0 text-ink-3" aria-hidden />}
				label={t('volume')}
				value={`${formatWeightAmount(recap.totalVolumeKg, weightUnit, locale, 1)} ${unitLabel}`}
			/>
		) : null,
		show.completedSets ? (
			<HeadlineMetric
				key="completedSets"
				icon={<CheckCheck className="size-5 shrink-0 text-ink-3" aria-hidden />}
				label={t('completedSets')}
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
							{t('comparedWithLastTime')}
						</h3>
					</div>
					{previous ? (
						<>
							<p className="type-body-sm text-ink-3">
								{t('previousSessionFinished', {
									date: dateFormatter(locale, { dateStyle: 'medium' }).format(
										new Date(previous.endedAt),
									),
								})}
							</p>
							<div className="grid grid-cols-1 gap-px bg-rule-faint sm:grid-cols-3">
								<ComparisonMetric
									label={t('duration')}
									current={formatDuration(recap.durationSec)}
									previous={formatDuration(previous.durationSec)}
									change={formatRecapDurationDelta(
										previous.durationDeltaSec,
										t,
									)}
								/>
								<ComparisonMetric
									label={t('volume')}
									current={`${formatWeightAmount(recap.totalVolumeKg, weightUnit, locale, 1)} ${unitLabel}`}
									previous={`${formatWeightAmount(previous.totalVolumeKg, weightUnit, locale, 1)} ${unitLabel}`}
									change={formatRecapWeightDelta(
										previous.volumeDeltaKg,
										weightUnit,
										t,
										locale,
									)}
								/>
								<ComparisonMetric
									label={t('completedSets')}
									current={String(recap.completedSets)}
									previous={String(previous.completedSets)}
									change={formatRecapSetsDelta(previous.completedSetsDelta, t)}
								/>
							</div>
						</>
					) : (
						<p className="type-body-sm text-ink-3">
							{t('firstCompletedSession')}
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
						<h3 className="type-panel text-foreground">
							{t('personalRecords')}
						</h3>
					</div>
					{recap.records.length > 0 ? (
						<ul className="grid grid-cols-1 gap-px bg-rule-faint sm:grid-cols-2">
							{recap.records.map(record => (
								<li
									key={`${record.exerciseId}:${record.kind}`}
									className="bg-surface-sunk p-3"
								>
									<p className="type-panel text-foreground">
										{exerciseLabel(record.exerciseName, tEx)}
									</p>
									<p className="type-body-sm text-ink-3">
										{t('recordCaption', {
											label: recapRecordLabel(record.kind, t),
											setNumber: record.setNumber,
										})}
									</p>
									<p className="type-data type-data-strong mt-1 text-foreground">
										{formatRecapRecordValue(record, weightUnit, t, locale)}
									</p>
								</li>
							))}
						</ul>
					) : (
						<p className="type-body-sm text-ink-3">{t('noNewRecords')}</p>
					)}
				</section>
			) : null}

			{/* An LP-only workout moved its blocks below, not a prescription:
			    "No prescriptions changed" would read as nothing moving. */}
			{show.progression &&
			!(recap.progressionChanges.length === 0 && blockItems.length > 0) ? (
				<section className="space-y-3">
					{/* The second and last honour mark: a raised prescription is the
					    definition of "better than planned". */}
					<div className="rule-row flex items-center gap-2 pb-2">
						<TrendingUp className="size-4 text-honour" aria-hidden />
						<h3 className="type-panel text-foreground">
							{t('progressionChanges')}
						</h3>
					</div>
					{recap.progressionChanges.length > 0 ? (
						<div className="space-y-px bg-rule-faint">
							{recap.progressionChanges.map(change => (
								<div
									key={change.routineExerciseId}
									className="bg-surface-sunk p-3"
								>
									<p className="type-panel text-foreground">
										{exerciseLabel(change.exerciseName, tEx)}
									</p>
									<p className="type-body-sm mt-1 text-ink-3">
										{getProgressionRuleExplanation(
											change,
											weightUnit,
											tChange,
											locale,
										)}
									</p>
									<ul className="mt-2 space-y-1">
										{change.sets.map(set => {
											const presentation = getProgressionSetPresentation(
												set,
												weightUnit,
												tChange,
												locale,
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
							{t('noProgressionChanges')}
						</p>
					)}
				</section>
			) : null}

			{blockItems.length > 0 ? (
				// ROUT-17/ROUT-18: where each 8-week block stands after this
				// workout. Owner-only (never in `sharedRecapToRecapView`), and in
				// ink: the honour budget is spent on records and progression.
				<section className="space-y-3">
					<div className="rule-row flex items-center gap-2 pb-2">
						<CalendarRange className="size-4 text-ink-3" aria-hidden />
						<h3 className="type-panel text-foreground">{tBlock('heading')}</h3>
					</div>
					<ul className="space-y-px bg-rule-faint">
						{blockItems.map(item => (
							<li
								key={item.routineExerciseId}
								className="space-y-1 bg-surface-sunk p-3"
							>
								<p className="type-panel text-foreground">
									{exerciseLabel(item.exerciseName, tEx)}
								</p>
								{item.kind === 'finished' ? (
									<>
										<p className="type-label text-foreground">
											{tRoutineBlock('finished')}
										</p>
										<p className="type-body-sm text-ink-2">{item.reference}</p>
										<p className="type-body-sm text-foreground">
											{item.estimate}
										</p>
										{item.sets.length > 0 ? (
											<div className="pt-1">
												<p className="type-body-sm text-ink-3">
													{tBlock('estimateFrom')}
												</p>
												<ul className="mt-1 space-y-0.5">
													{item.sets.map(line => (
														<li
															key={line.label}
															className="type-data flex flex-wrap justify-between gap-x-2 text-ink-2"
														>
															<span>{line.label}</span>
															<span className="text-foreground">
																{line.estimate}
															</span>
														</li>
													))}
												</ul>
											</div>
										) : null}
										{routineHref ? (
											<div className="pt-2">
												<Button asChild variant="outline" size="sm">
													<Link href={routineHref}>{tBlock('chooseNext')}</Link>
												</Button>
											</div>
										) : null}
									</>
								) : (
									<>
										<p className="type-body-sm text-ink-2">{item.done}</p>
										{item.next ? (
											<p className="type-data text-foreground">{item.next}</p>
										) : null}
									</>
								)}
							</li>
						))}
					</ul>
				</section>
			) : null}

			{show.notes ? (
				<section className="space-y-3">
					<div className="rule-row flex items-center gap-2 pb-2">
						<NotebookPen className="size-4 text-ink-3" aria-hidden />
						<h3 className="type-panel text-foreground">{t('sessionNotes')}</h3>
					</div>
					{recap.notes?.trim() || !recap.exerciseNotes?.length ? (
						<p className="type-body-sm whitespace-pre-line bg-surface-sunk p-3 text-ink-2">
							{recap.notes?.trim() || t('noNotesAdded')}
						</p>
					) : null}
					{recap.exerciseNotes?.length ? (
						<ul className="space-y-2" aria-label={t('exerciseNotesAria')}>
							{recap.exerciseNotes.map(item => (
								<li key={item.routineExerciseId} className="type-body-sm">
									<span className="text-foreground">
										{exerciseLabel(item.exerciseName, tEx)}
									</span>
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
	/** ROUT-17: the workout's day is a rotation's. */
	rotation?: boolean
}

export function SessionRecapDialog({
	recap,
	onContinue,
	rotation,
}: SessionRecapDialogProps) {
	const t = useTranslations('workout.recap')
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
							<DialogTitle>{t('sessionComplete')}</DialogTitle>
							<DialogDescription>
								{recap.routineName}
								{recap.dayName ? ` · ${recap.dayName}` : ''}
							</DialogDescription>
						</DialogHeader>
						<SessionRecapContent recap={recap} rotation={rotation} />
						{/* v1.1 §26.7: the body scrolls under a footer pinned to the
						    dialog's bottom edge, so Continue is in view from the start.
						    `-bottom-6` cancels the panel's padding, as `shell-pin`
						    cancels <main>'s. */}
						<DialogFooter className="sticky -bottom-6 -mx-6 -mb-6 border-t border-rule bg-popover px-6 py-4">
							<Button onClick={onContinue} className="w-full sm:w-auto">
								{t('continueToDashboard')}
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
	rotation,
}: SessionRecapContentProps & { action?: ReactNode }) {
	const t = useTranslations('workout.recap')
	return (
		<section aria-labelledby="session-recap-heading" className="space-y-4">
			<div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2">
				<div className="min-w-0">
					<h2
						id="session-recap-heading"
						className="type-section text-foreground"
					>
						{t('sessionRecap')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						{recap.routineName}
						{recap.dayName ? ` · ${recap.dayName}` : ''}
					</p>
				</div>
				{action}
			</div>
			<SessionRecapContent
				recap={recap}
				notesAction={notesAction}
				rotation={rotation}
			/>
		</section>
	)
}
