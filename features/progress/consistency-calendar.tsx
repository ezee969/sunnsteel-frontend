'use client'

import { messageProgressId } from '@sunsteel/contracts'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { SendInMessageDialog } from '@/features/messages/send-in-message'
import { ScheduleMonthView } from '@/features/schedule/schedule-month-view'
import { useScheduleData } from '@/features/schedule/use-schedule-data'
import { useWeekStartsOn } from '@/hooks/use-week-starts-on'
import type { Locale } from '@/i18n/config'
import { monthKey, progressMonthLabel } from '@/lib/utils/messages'
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
	const weekStartsOn = useWeekStartsOn()
	const range = useMemo(
		() => scheduleMonthRange(monthStart, weekStartsOn),
		[monthStart, weekStartsOn],
	)
	const data = useScheduleData(range)
	const locale = useLocale() as Locale
	const [sending, setSending] = useState(false)
	// MSG-14: a month that has begun and holds a finished workout can go.
	const sendable = monthKey(monthStart) <= monthKey(now)
	const monthId = monthKey(monthStart)
	const monthName = progressMonthLabel(monthId, locale)

	const month = useMemo(() => {
		if (data.isPending || data.isError || !data.routines || !data.sessions) {
			return
		}
		return buildScheduleMonth({
			monthStart,
			weekStartsOn,
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
		weekStartsOn,
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
				<div className="space-y-2">
					{sendable && month && month.totals.completed > 0 ? (
						<>
							<Button
								type="button"
								variant="link"
								className="type-body-sm h-auto w-fit gap-1 p-0"
								aria-label={t('sendMonthLabel', { month: monthName })}
								onClick={() => setSending(true)}
							>
								<MessageSquare className="size-3.5" aria-hidden />
								{t('sendMonth')}
							</Button>
							<SendInMessageDialog
								open={sending}
								onOpenChange={setSending}
								attach={{ kind: 'PROGRESS', id: messageProgressId(monthId) }}
								name={monthName}
							/>
						</>
					) : null}
					<p className="type-body-sm text-ink-3">
						{t('footer')}{' '}
						<Link
							href="/schedule"
							className="text-primary underline-offset-4 hover:underline"
						>
							{t('openSchedule')}
						</Link>
					</p>
				</div>
			}
		/>
	)
}
