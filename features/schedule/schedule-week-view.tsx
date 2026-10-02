'use client'

import {
	CalendarSync,
	ChevronLeft,
	ChevronRight,
	Loader2,
	RefreshCw,
	Repeat,
	SkipForward,
	Undo2,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'
import {
	describeMonthTotals,
	scheduleStatusLabel,
} from '@/lib/utils/schedule-month'
import {
	describeScheduleDay,
	describeShortDate,
	describeWeek,
	rotationStartAction,
	type ScheduleAction,
	type ScheduleEntry,
	scheduleEntryAction,
	type ScheduleMoveAction,
	scheduleMoveAction,
	type ScheduleWeek,
} from '@/lib/utils/schedule-week'

import { SCHEDULE_STATUS } from './schedule-status'

interface ScheduleWeekViewProps {
	week?: ScheduleWeek
	now: Date
	isPending: boolean
	isError: boolean
	isCurrentWeek: boolean
	/** SCHED-03: nothing starts while a session is live; it can be resumed. */
	hasActiveSession: boolean
	/** The routine day being started, while its request runs. */
	startingDayId: string | null
	onStart: (routineId: string, routineDayId: string) => void
	/** SCHED-04: opens the move dialog for a planned weekly workout. */
	onMove: (
		action: Extract<ScheduleMoveAction, { kind: 'MOVE' }>,
		target: string,
	) => void
	onUndoMove: (overrideId: string, target: string) => void
	/** SCHED-05: marks a passed day without a session skipped. */
	onSkip: (routineId: string, occurrenceDate: string, target: string) => void
	/** The override being undone, or `routineId|date` being skipped. */
	pendingKey: string | null
	onPrevious: () => void
	onNext: () => void
	onToday: () => void
	onRetry: () => void
}

const entryState = (entry: ScheduleEntry): keyof typeof SCHEDULE_STATUS =>
	entry.kind === 'SESSION' ? entry.status : entry.kind

const entryHref = (entry: ScheduleEntry) => {
	if (entry.kind !== 'SESSION') return `/routines/${entry.routineId}`
	return entry.status === 'IN_PROGRESS'
		? `/workouts/sessions/${entry.sessionId}`
		: `/workouts/history/${entry.sessionId}`
}

interface ActionProps {
	action: ScheduleAction
	/** What the action starts, for its accessible name. */
	target: string
	startingDayId: string | null
	onStart: (routineId: string, routineDayId: string) => void
}

/** Repeated row controls are outline, never the region's primary (§4.3). */
function EntryAction({ action, target, startingDayId, onStart }: ActionProps) {
	const t = useTranslations('planning.scheduleWeek')
	if (!action) return null
	if (action.kind === 'RESUME') {
		return (
			<Button asChild size="sm" variant="outline" className="shrink-0">
				<Link
					href={`/workouts/sessions/${action.sessionId}`}
					aria-label={t('resumeAria', { target })}
				>
					{t('resume')}
				</Link>
			</Button>
		)
	}
	return (
		<Button
			type="button"
			size="sm"
			variant="outline"
			className="shrink-0"
			aria-label={t('startAria', { target })}
			disabled={startingDayId !== null}
			onClick={() => onStart(action.routineId, action.routineDayId)}
		>
			{startingDayId === action.routineDayId ? (
				<Loader2 className="size-4 animate-spin" aria-hidden />
			) : null}
			{t('start')}
		</Button>
	)
}

interface MoveProps {
	moveAction: ScheduleMoveAction
	onMove: ScheduleWeekViewProps['onMove']
	onUndoMove: ScheduleWeekViewProps['onUndoMove']
	onSkip: ScheduleWeekViewProps['onSkip']
	pendingKey: string | null
}

/**
 * SCHED-04/05: a quiet row control, beside Start rather than competing with
 * it: Reschedule on a planned workout, Undo on a moved or skipped one, and
 * Mark skipped on a passed day without a session.
 */
function MoveControl({
	moveAction,
	target,
	onMove,
	onUndoMove,
	onSkip,
	pendingKey,
}: MoveProps & { target: string }) {
	const t = useTranslations('planning.scheduleWeek')
	if (!moveAction) return null
	if (moveAction.kind === 'UNDO' || moveAction.kind === 'SKIP') {
		const key =
			moveAction.kind === 'UNDO'
				? moveAction.overrideId
				: `${moveAction.routineId}|${moveAction.occurrenceDate}`
		const Icon = moveAction.kind === 'UNDO' ? Undo2 : SkipForward
		return (
			<Button
				type="button"
				size="sm"
				variant="ghost"
				className="shrink-0"
				aria-label={
					moveAction.kind === 'UNDO'
						? t('undoAria', { target })
						: t('markSkippedAria', { target })
				}
				disabled={pendingKey !== null}
				onClick={() =>
					moveAction.kind === 'UNDO'
						? onUndoMove(moveAction.overrideId, target)
						: onSkip(moveAction.routineId, moveAction.occurrenceDate, target)
				}
			>
				{pendingKey === key ? (
					<Loader2 className="size-4 animate-spin" aria-hidden />
				) : (
					<Icon className="size-4" aria-hidden />
				)}
				{moveAction.kind === 'UNDO' ? t('undo') : t('markSkipped')}
			</Button>
		)
	}
	return (
		<Button
			type="button"
			size="sm"
			variant="ghost"
			className="shrink-0"
			aria-label={t('rescheduleAria', { target })}
			onClick={() => onMove(moveAction, target)}
		>
			<CalendarSync className="size-4" aria-hidden />
			{t('reschedule')}
		</Button>
	)
}

function EntryRow({
	entry,
	moveAction,
	onMove,
	onUndoMove,
	onSkip,
	pendingKey,
	...actionProps
}: { entry: ScheduleEntry } & Omit<ActionProps, 'target'> & MoveProps) {
	const locale = useLocale() as Locale
	const tDate = useTranslations('routines.date')
	const t = useTranslations('planning.scheduleWeek')
	const tMonth = useTranslations('planning.scheduleMonth')
	const state = entryState(entry)
	const { Icon, tone } = SCHEDULE_STATUS[state]
	const label =
		entry.kind === 'MOVED'
			? t('movedTo', { date: describeShortDate(entry.toDate, tDate, locale) })
			: scheduleStatusLabel(state, tMonth)
	const movedFrom =
		(entry.kind === 'PLANNED' || entry.kind === 'NOT_LOGGED') && entry.movedFrom
			? entry.movedFrom
			: null
	const target = entry.dayName
		? `${entry.routineName} · ${entry.dayName}`
		: entry.routineName
	return (
		// v1.1 §26.8: the routine and day own the first line, status and notes
		// follow as a quieter second line, and below `sm` the actions sit under
		// the text (aligned past the glyph) instead of squeezing it into a
		// 160px column beside them.
		<li className="flex flex-wrap items-start gap-x-2 gap-y-1 py-1.5">
			<Icon className={cn('mt-0.5 size-4 shrink-0', tone)} aria-hidden />
			<span className="min-w-0 flex-1 basis-[calc(100%-1.5rem)] sm:basis-40">
				<Link
					href={entryHref(entry)}
					className="type-body-sm block w-fit text-foreground underline-offset-4 hover:underline"
				>
					{entry.routineName}
					{entry.dayName ? ` · ${entry.dayName}` : ''}
				</Link>
				<span className={cn('type-body-sm', tone)}>{label}</span>
				{entry.trainingBlockName ? (
					<span className="type-body-sm ml-2 text-ink-3">
						· {entry.trainingBlockName}
					</span>
				) : null}
				{entry.deload ? (
					<span className="type-body-sm ml-2 text-ink-3">
						· {t('deloadTag')}
					</span>
				) : null}
				{movedFrom ? (
					<span className="type-body-sm ml-2 text-ink-3">
						·{' '}
						{t('movedFrom', {
							date: describeShortDate(movedFrom, tDate, locale),
						})}
					</span>
				) : null}
			</span>
			<span className="flex shrink-0 gap-1 max-sm:-ml-2 max-sm:pl-6">
				<EntryAction target={target} {...actionProps} />
				<MoveControl
					moveAction={moveAction}
					target={target}
					onMove={onMove}
					onUndoMove={onUndoMove}
					onSkip={onSkip}
					pendingKey={pendingKey}
				/>
			</span>
		</li>
	)
}

/** SCHED-01: one Monday-based week as a ruled list of days (§11.5). */
export function ScheduleWeekView({
	week,
	now,
	isPending,
	isError,
	isCurrentWeek,
	hasActiveSession,
	startingDayId,
	onStart,
	onMove,
	onUndoMove,
	onSkip,
	pendingKey,
	onPrevious,
	onNext,
	onToday,
	onRetry,
}: ScheduleWeekViewProps) {
	const locale = useLocale() as Locale
	const tDate = useTranslations('routines.date')
	const t = useTranslations('planning.scheduleWeek')
	const tMonth = useTranslations('planning.scheduleMonth')
	return (
		<section aria-labelledby="schedule-week" className="space-y-4">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div>
					<h2 id="schedule-week" className="type-section text-foreground">
						{week
							? describeWeek(week.weekStart, now, locale, t)
							: t('thisWeek')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3" aria-live="polite">
						{week ? describeMonthTotals(week.totals, tMonth) : ' '}
					</p>
				</div>
				<div
					role="group"
					aria-label={t('weekGroup')}
					className="flex items-center gap-1"
				>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-11 sm:size-9"
						aria-label={t('previousWeek')}
						onClick={onPrevious}
					>
						<ChevronLeft className="size-4" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isCurrentWeek}
						onClick={onToday}
					>
						{t('thisWeek')}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-11 sm:size-9"
						aria-label={t('followingWeek')}
						onClick={onNext}
					>
						<ChevronRight className="size-4" aria-hidden />
					</Button>
				</div>
			</div>

			<Explanation summary={t('explanationSummary')}>
				<p>{t('explanation1')}</p>
				<p>{t('explanation2')}</p>
				<p>{t('explanation3')}</p>
				<p>{t('explanation4')}</p>
			</Explanation>

			{isPending ? (
				<div role="status" aria-label={t('loading')} className="space-y-3">
					<Skeleton className="h-14" />
					<Skeleton className="h-14" />
					<Skeleton className="h-14" />
				</div>
			) : isError || !week ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">{t('unavailableTitle')}</p>
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
				<>
					{week.rotations.length > 0 ? (
						<ul aria-label={t('rotations')} className="space-y-1">
							{week.rotations.map(rotation => (
								<li
									key={rotation.routineId}
									className="type-body-sm flex items-start gap-2 text-ink-3"
								>
									<Repeat className="mt-0.5 size-4 shrink-0" aria-hidden />
									<span className="min-w-0 flex-1">
										{t.rich('rotationLine', {
											routineName: rotation.routineName,
											nextName: rotation.nextDayName,
											routine: chunks => (
												<Link
													href={`/routines/${rotation.routineId}`}
													className="text-foreground underline-offset-4 hover:underline"
												>
													{chunks}
												</Link>
											),
											next: chunks => (
												<span className="text-ink-2">{chunks}</span>
											),
											extra:
												rotation.trainingBlockName || rotation.deload
													? ` (${[
															rotation.trainingBlockName,
															rotation.deload ? t('deloadLower') : null,
														]
															.filter(Boolean)
															.join(', ')})`
													: '',
										})}
									</span>
									<EntryAction
										action={rotationStartAction(
											rotation,
											week,
											hasActiveSession,
										)}
										target={`${rotation.routineName} · ${rotation.nextDayName}`}
										startingDayId={startingDayId}
										onStart={onStart}
									/>
								</li>
							))}
						</ul>
					) : null}

					<ol className="border-t border-rule">
						{week.days.map(day => {
							const { weekday, date } = describeScheduleDay(day, tDate, locale)
							return (
								<li
									key={day.date}
									aria-current={day.isToday ? 'date' : undefined}
									className={cn(
										'rule-row mark grid gap-1 py-3 pl-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4',
										day.isToday && 'border-l-primary',
									)}
								>
									<div>
										<p className="type-panel text-foreground">{weekday}</p>
										<p className="type-body-sm text-ink-3">
											{day.isToday ? t('dateToday', { date }) : date}
										</p>
									</div>
									{day.entries.length > 0 ? (
										<ul>
											{day.entries.map(entry => (
												<EntryRow
													key={
														entry.kind === 'SESSION'
															? entry.sessionId
															: `${entry.kind}-${entry.routineId}-${entry.dayName}`
													}
													entry={entry}
													action={scheduleEntryAction(
														entry,
														day,
														hasActiveSession,
													)}
													startingDayId={startingDayId}
													onStart={onStart}
													moveAction={scheduleMoveAction(entry, day, now)}
													onMove={onMove}
													onUndoMove={onUndoMove}
													onSkip={onSkip}
													pendingKey={pendingKey}
												/>
											))}
										</ul>
									) : (
										<p className="type-body-sm py-1 text-ink-3">
											{t('nothingPlanned')}
										</p>
									)}
								</li>
							)
						})}
					</ol>
				</>
			)}
		</section>
	)
}
