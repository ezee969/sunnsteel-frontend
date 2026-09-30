'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { ScheduleMonthView } from '@/features/schedule/schedule-month-view'
import { useScheduleData } from '@/features/schedule/use-schedule-data'
import {
	addMonths,
	buildScheduleMonth,
	scheduleMonthRange,
	startOfMonth,
} from '@/lib/utils/schedule-month'
import { localDateKey } from '@/lib/utils/schedule-week'

/**
 * PROG-05: the Schedule's month, on Progress, as a consistency record. Same
 * rules and reads as the Schedule page; its cells are not interactive here,
 * and the footer opens the full schedule.
 */
export function ConsistencyCalendar() {
	const t = useTranslations('progress.consistency')
	const [now] = useState(() => new Date())
	const [monthStart, setMonthStart] = useState(() => startOfMonth(now))
	const range = useMemo(() => scheduleMonthRange(monthStart), [monthStart])
	const data = useScheduleData(range)

	const month = useMemo(() => {
		if (data.isPending || data.isError || !data.routines || !data.sessions) {
			return
		}
		return buildScheduleMonth({
			monthStart,
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
		monthStart,
		now,
	])

	return (
		<ScheduleMonthView
			month={month}
			now={now}
			isPending={data.isPending}
			isError={data.isError}
			headingId="consistency-calendar"
			heading={t('heading')}
			isCurrentMonth={
				localDateKey(monthStart) === localDateKey(startOfMonth(now))
			}
			onPrevious={() => setMonthStart(start => addMonths(start, -1))}
			onNext={() => setMonthStart(start => addMonths(start, 1))}
			onToday={() => setMonthStart(startOfMonth(now))}
			onRetry={data.refetch}
			footer={
				<p className="type-body-sm text-ink-3">
					{t('footer')}{' '}
					<Link
						href="/schedule"
						className="text-primary underline-offset-4 hover:underline"
					>
						{t('openSchedule')}
					</Link>
				</p>
			}
		/>
	)
}
