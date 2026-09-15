'use client'

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
	describeConsistency,
	describeMonth,
	describeMonthCell,
	formatMonth,
	type ScheduleMonth,
	type ScheduleMonthCell,
} from '@/lib/utils/schedule-month'
import { describeScheduleTotals } from '@/lib/utils/schedule-week'

import { SCHEDULE_STATUS } from './schedule-status'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
	const monthLabel = month ? describeMonth(month.monthStart, now) : 'This month'
	const consistency = month ? describeConsistency(month) : null
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
									heading ? formatMonth(month.monthStart) : null,
									describeScheduleTotals(month.totals),
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
					aria-label="Month"
					className="flex items-center gap-1"
				>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-11 sm:size-9"
						aria-label="Previous month"
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
						This month
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-11 sm:size-9"
						aria-label="Next month"
						onClick={onNext}
					>
						<ChevronRight className="size-4" aria-hidden />
					</Button>
				</div>
			</div>

			<ul
				aria-label="Legend"
				className="type-body-sm flex flex-wrap gap-x-4 gap-y-1 text-ink-3"
			>
				{Object.values(SCHEDULE_STATUS).map(({ Icon, label, tone }) => (
					<li key={label} className="flex items-center gap-1.5">
						<Icon className={cn('size-4', tone)} aria-hidden />
						{label}
					</li>
				))}
			</ul>

			{isPending ? (
				<div role="status" aria-label="Loading month">
					<Skeleton className="h-72" />
				</div>
			) : isError || !month ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">Month is unavailable</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load your routines or sessions for this month. Try
						again.
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
				<table className="w-full table-fixed border-collapse">
					<caption className="sr-only">{formatMonth(month.monthStart)}</caption>
					<thead>
						<tr>
							{WEEKDAYS.map(day => (
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
												aria-label={describeMonthCell(cell)}
												onClick={() => onSelectDay(cell.date)}
											>
												<CellContent cell={cell} />
											</button>
										) : (
											<>
												<CellContent cell={cell} />
												{cell.inMonth ? (
													<span className="sr-only">
														{describeMonthCell(cell)}
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
