'use client'

import { CalendarDays, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SCHEDULE_STATUS } from '@/features/schedule/schedule-status'
import { useScheduleData } from '@/features/schedule/use-schedule-data'
import { cn } from '@/lib/utils'
import {
	buildWeekStrip,
	describeWeekStripToday,
	WEEK_STRIP_SCHEDULE_HREF,
	weekStripStates,
} from '@/lib/utils/dashboard-week'
import {
	buildScheduleWeek,
	describeScheduleTotals,
	scheduleWeekRange,
	startOfWeek,
} from '@/lib/utils/schedule-week'

import { useTodaysWorkouts } from '../hooks/useTodaysWorkouts'

/**
 * DASH-03: this week at a glance. The days are the SCHED-01 week builder's,
 * over the same reads and cache as /schedule, and today's line is the
 * dashboard's own today read -- nothing here builds a second week. Every day
 * is a link, never a button: the Today's Workouts card above keeps the one
 * filled action.
 */
export default function WeekStrip() {
	const [now] = useState(() => new Date())
	const weekStart = useMemo(() => startOfWeek(now), [now])
	const range = useMemo(() => scheduleWeekRange(weekStart), [weekStart])
	const data = useScheduleData(range)
	const today = useTodaysWorkouts()

	const week = useMemo(() => {
		if (data.isPending || data.isError || !data.routines || !data.sessions) {
			return undefined
		}
		return buildScheduleWeek({
			weekStart,
			now,
			routines: data.routines,
			sessions: data.sessions,
			active: data.active,
			overrides: data.overrides,
		})
	}, [
		data.isPending,
		data.isError,
		data.routines,
		data.sessions,
		data.active,
		data.overrides,
		weekStart,
		now,
	])
	const days = useMemo(() => (week ? buildWeekStrip(week) : []), [week])
	const todayLine = today.isPending
		? null
		: describeWeekStripToday({
				hasActiveSession: today.active?.status === 'IN_PROGRESS',
				remaining: today.entries.length,
				trainedToday: Boolean(today.completedToday),
			})

	return (
		<section aria-labelledby="week-strip">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-2">
				<div>
					<h2
						id="week-strip"
						className="type-section flex items-center gap-2 text-foreground"
					>
						<CalendarDays className="h-4 w-4 text-ink-3" aria-hidden />
						This Week
					</h2>
					<p className="type-body-sm mt-1 text-ink-3" aria-live="polite">
						{week
							? [describeScheduleTotals(week.totals), todayLine]
									.filter(Boolean)
									.join(' · ')
							: ' '}
					</p>
				</div>
				<Link
					href={WEEK_STRIP_SCHEDULE_HREF}
					className="type-body-sm text-ink-2 underline-offset-4 hover:underline"
				>
					Open schedule
				</Link>
			</div>

			<div className="pt-3">
				{data.isPending ? (
					<div role="status" aria-label="Loading this week">
						<Skeleton className="h-16 sm:h-20" />
					</div>
				) : data.isError || !week ? (
					<div role="alert" className="border border-rule bg-surface p-5">
						<p className="type-panel text-foreground">
							This week is unavailable
						</p>
						<p className="type-body-sm mt-1 text-ink-3">
							We could not load your routines or sessions for this week. Try
							again.
						</p>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="mt-3"
							onClick={data.refetch}
						>
							<RefreshCw className="size-4" aria-hidden />
							Retry
						</Button>
					</div>
				) : (
					<>
						<ol className="grid grid-cols-7 border-l border-t border-rule-faint">
							{days.map(day => {
								const status =
									day.state === 'EMPTY' ? null : SCHEDULE_STATUS[day.state]
								const Icon = status?.Icon
								return (
									<li
										key={day.date}
										className="border-b border-r border-rule-faint"
									>
										<Link
											href={day.href}
											aria-label={day.label}
											aria-current={day.isToday ? 'date' : undefined}
											className={cn(
												'flex h-16 flex-col items-center justify-center gap-1 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-20',
												// Today is a ring plus its accessible name, never colour alone.
												day.isToday && 'ring-1 ring-inset ring-primary',
											)}
										>
											<span className="type-label text-ink-3">
												{day.weekday}
											</span>
											<span className="type-data text-foreground">
												{day.dayOfMonth}
											</span>
											{Icon ? (
												<Icon
													className={cn('size-4', status.tone)}
													aria-hidden
												/>
											) : (
												<span className="size-4" aria-hidden />
											)}
										</Link>
									</li>
								)
							})}
						</ol>
						{weekStripStates(days).length > 0 ? (
							<ul
								aria-label="Legend"
								className="type-body-sm mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-3"
							>
								{weekStripStates(days).map(state => {
									if (state === 'EMPTY') return null
									const { Icon, label, tone } = SCHEDULE_STATUS[state]
									return (
										<li key={state} className="flex items-center gap-1.5">
											<Icon className={cn('size-4', tone)} aria-hidden />
											{label}
										</li>
									)
								})}
							</ul>
						) : null}
					</>
				)}
			</div>
		</section>
	)
}
