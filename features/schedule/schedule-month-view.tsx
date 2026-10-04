'use client'

import type { WeekStartsOn } from '@sunsteel/contracts'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeekStartsOn } from '@/hooks/use-week-starts-on'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { cn } from '@/lib/utils'
import {
	describeConsistency,
	describeMonth,
	describeMonthCell,
	describeMonthTotals,
	formatMonth,
	type ScheduleMonth,
	type ScheduleMonthCell,
	scheduleStatusLabel,
} from '@/lib/utils/schedule-month'

import { SCHEDULE_STATUS } from './schedule-status'

// 1 January 2024 was a Monday, so seven days from it are Monday-first
// columns; a Sunday start begins the day before (PREF-04).
const weekdayLabels = (locale: Locale, weekStartsOn: WeekStartsOn) =>
	Array.from({ length: 7 }, (_, index) =>
		dateFormatter(locale, { weekday: 'short' }).format(
			new Date(2024, 0, 1 + index - (weekStartsOn === 0 ? 1 : 0)),
		),
	)

interface ScheduleMonthViewProps {
	month?: ScheduleMonth
	now: Date
	isPending: boolean
	isError: boolean
	isCurrentMonth: boolean
	headingId: string
	/** Replaces the month name as the heading, which then moves to the summary. */
	heading?: string
	onPrevious: () => void
	onNext: () => void
	onToday: () => void
	onRetry: () => void
	/** Opens a day's week; without it the cells are not interactive. */
	onSelectDay?: (date: string) => void
	footer?: ReactNode
}

function CellContent({ cell }: { cell: ScheduleMonthCell }) {
	const status = cell.state === 'EMPTY' ? null : SCHEDULE_STATUS[cell.state]
	const Icon = status?.Icon
	return (
		<span
			className={cn(
				'flex h-12 flex-col items-center justify-center gap-1 sm:h-16',
				// Today is a ring plus its accessible name, never colour alone.
				cell.isToday && 'ring-1 ring-inset ring-primary',
			)}
		>
			<span
				className={cn(
					'type-data',
					cell.inMonth ? 'text-foreground' : 'text-ink-3',
				)}
			>
				{Number(cell.date.slice(8))}
			</span>
			{Icon ? (
				<Icon className={cn('size-4', status.tone)} aria-hidden />
			) : (
				<span className="size-4" aria-hidden />
			)}
		</span>
	)
}

/**
 * PROG-05 / SCHED-02: a month as a table of Monday-based weeks. Each in-month
 * cell carries one glyph (the strongest of its day's entries) and a full
 * accessible name; days outside the month show only their number.
 */
export function ScheduleMonthView({
	month,
	now,
	isPending,
	isError,
	isCurrentMonth,
	headingId,
	heading,
	onPrevious,
	onNext,
	onToday,
	onRetry,
	onSelectDay,
	footer,
}: ScheduleMonthViewProps) {
	const locale = useLocale() as Locale
	const weekStartsOn = useWeekStartsOn()
	const t = useTranslations('planning.scheduleMonth')
	const monthLabel = month
		? describeMonth(month.monthStart, now, locale, t)
		: t('thisMonth')
	const consistency = month ? describeConsistency(month, t) : null
	return (
		<section aria-labelledby={headingId} className="space-y-4">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div>
					<h2 id={headingId} className="type-section text-foreground">
						{heading ?? monthLabel}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3" aria-live="polite">
						{month
							? [
									heading ? formatMonth(month.monthStart, locale) : null,
									describeMonthTotals(month.totals, t),
								]
									.filter(Boolean)
									.join(' · ')
							: ' '}
					</p>
					{consistency ? (
						<p className="type-body-sm text-ink-2">{consistency}</p>
					) : null}
				</div>
				<div
					role="group"
					aria-label={t('monthGroup')}
					className="flex items-center gap-1"
				>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-11 sm:size-9"
						aria-label={t('previousMonth')}
						onClick={onPrevious}
					>
						<ChevronLeft className="size-4" aria-hidden />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isCurrentMonth}
						onClick={onToday}
					>
						{t('thisMonth')}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-11 sm:size-9"
						aria-label={t('followingMonth')}
						onClick={onNext}
					>
						<ChevronRight className="size-4" aria-hidden />
					</Button>
				</div>
			</div>

			<ul
				aria-label={t('legend')}
				className="type-body-sm flex flex-wrap gap-x-4 gap-y-1 text-ink-3"
			>
				{(Object.keys(SCHEDULE_STATUS) as (keyof typeof SCHEDULE_STATUS)[]).map(
					state => {
						const { Icon, tone } = SCHEDULE_STATUS[state]
						return (
							<li key={state} className="flex items-center gap-1.5">
								<Icon className={cn('size-4', tone)} aria-hidden />
								{scheduleStatusLabel(state, t)}
							</li>
						)
					},
				)}
			</ul>

			{isPending ? (
				<div role="status" aria-label={t('loading')}>
					<Skeleton className="h-72" />
				</div>
			) : isError || !month ? (
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
				<table className="w-full table-fixed border-collapse">
					<caption className="sr-only">
						{formatMonth(month.monthStart, locale)}
					</caption>
					<thead>
						<tr>
							{weekdayLabels(locale, weekStartsOn).map(day => (
								<th
									key={day}
									scope="col"
									className="type-label pb-2 text-center text-ink-3"
								>
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{month.weeks.map(week => (
							<tr key={week[0].date}>
								{week.map(cell => (
									<td
										key={cell.date}
										className="border border-rule-faint p-0 align-top"
										aria-current={cell.isToday ? 'date' : undefined}
									>
										{onSelectDay && cell.inMonth ? (
											<button
												type="button"
												className="block w-full transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												aria-label={describeMonthCell(cell, locale, t)}
												onClick={() => onSelectDay(cell.date)}
											>
												<CellContent cell={cell} />
											</button>
										) : (
											<>
												<CellContent cell={cell} />
												{cell.inMonth ? (
													<span className="sr-only">
														{describeMonthCell(cell, locale, t)}
													</span>
												) : null}
											</>
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			)}
			{footer}
		</section>
	)
}
