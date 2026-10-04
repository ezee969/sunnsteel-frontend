'use client'

import { CalendarDays, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SCHEDULE_STATUS } from '@/features/schedule/schedule-status'
import { useScheduleData } from '@/features/schedule/use-schedule-data'
import { useWeekStartsOn } from '@/hooks/use-week-starts-on'
import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'
import {
	buildWeekStrip,
	describeWeekStripToday,
	WEEK_STRIP_SCHEDULE_HREF,
	weekStripStates,
} from '@/lib/utils/dashboard-week'
import {
	describeMonthTotals,
	scheduleStatusLabel,
} from '@/lib/utils/schedule-month'
import {
	buildScheduleWeek,
	scheduleWeekRange,
	startOfWeek,
} from '@/lib/utils/schedule-week'

import { useTodaysWorkouts } from '../hooks/useTodaysWorkouts'
import { DashboardSection } from './DashboardSection'

/**
 * DASH-03: this week at a glance. The days are the SCHED-01 week builder's,
 * over the same reads and cache as /schedule, and today's line is the
 * dashboard's own today read -- nothing here builds a second week. Every day
 * is a link, never a button: the Today's Workouts card above keeps the one
 * filled action.
 */
export default function WeekStrip() {
	const locale = useLocale() as Locale
	const tDate = useTranslations('routines.date')
	const t = useTranslations('planning.weekStrip')
	const tMonth = useTranslations('planning.scheduleMonth')
	const [now] = useState(() => new Date())
	// PREF-04: the member's week, as on the Schedule.
	const weekStartsOn = useWeekStartsOn()
	const weekStart = useMemo(
		() => startOfWeek(now, weekStartsOn),
		[now, weekStartsOn],
	)
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
	const days = useMemo(
		() => (week ? buildWeekStrip(week, tDate, locale, t, tMonth) : []),
		[week, tDate, locale, t, tMonth],
	)
	const todayLine = today.isPending
		? null
		: describeWeekStripToday(
				{
					hasActiveSession: today.active?.status === 'IN_PROGRESS',
					remaining: today.entries.length,
					trainedToday: Boolean(today.completedToday),
				},
				t,
			)

	return (
		<DashboardSection
			id="this-week"
			icon={<CalendarDays className="h-4 w-4 text-ink-3" aria-hidden />}
			description={
				<p className="type-body-sm mt-1 text-ink-3" aria-live="polite">
					{week
						? [describeMonthTotals(week.totals, tMonth), todayLine]
								.filter(Boolean)
								.join(' · ')
						: ' '}
				</p>
			}
			action={
				<Link
					href={WEEK_STRIP_SCHEDULE_HREF}
					className="type-body-sm text-ink-2 underline-offset-4 hover:underline"
				>
					{t('openSchedule')}
				</Link>
			}
			bodyClassName="pt-3"
		>
			{data.isPending ? (
				<div role="status" aria-label={t('loadingAria')}>
					<Skeleton className="h-16 sm:h-20" />
				</div>
			) : data.isError || !week ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">{t('unavailableTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('unavailableBody')}</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="mt-3"
						onClick={data.refetch}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : (
				<>
					{/* DASH-06 (§25.3): a ruled band like the stat row below it --
					    rules above and below, a hairline between days, no box
					    around each day or at the ends. */}
					<ol className="grid grid-cols-7 divide-x divide-rule-faint border-y border-rule">
						{days.map(day => {
							const status =
								day.state === 'EMPTY' ? null : SCHEDULE_STATUS[day.state]
							const Icon = status?.Icon
							return (
								<li key={day.date}>
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
										<span className="type-label text-ink-3">{day.weekday}</span>
										<span className="type-data text-foreground">
											{day.dayOfMonth}
										</span>
										{Icon ? (
											<Icon className={cn('size-4', status.tone)} aria-hidden />
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
							aria-label={t('legend')}
							className="type-body-sm mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-3"
						>
							{weekStripStates(days).map(state => {
								if (state === 'EMPTY') return null
								const { Icon, tone } = SCHEDULE_STATUS[state]
								return (
									<li key={state} className="flex items-center gap-1.5">
										<Icon className={cn('size-4', tone)} aria-hidden />
										{scheduleStatusLabel(state, tMonth)}
									</li>
								)
							})}
						</ul>
					) : null}
				</>
			)}
		</DashboardSection>
	)
}
