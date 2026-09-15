'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
	MoveOccurrenceDialog,
	type MoveRequest,
} from '@/features/schedule/move-occurrence-dialog'
import { ScheduleMonthView } from '@/features/schedule/schedule-month-view'
import { ScheduleWeekView } from '@/features/schedule/schedule-week-view'
import { useScheduleData } from '@/features/schedule/use-schedule-data'
import {
	useSkipOccurrence,
	useUndoMove,
} from '@/lib/api/hooks/useScheduleOverrides'
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession'
import { logger } from '@/lib/utils/logger'
import {
	addMonths,
	buildScheduleMonth,
	scheduleMonthRange,
	startOfMonth,
} from '@/lib/utils/schedule-month'
import {
	addDays,
	buildScheduleWeek,
	localDateKey,
	moveTargets,
	scheduleWeekRange,
	startOfWeek,
} from '@/lib/utils/schedule-week'

type ScheduleView = 'week' | 'month'

const fromKey = (key: string) => {
	const [year, month, day] = key.split('-').map(Number)
	return new Date(year, month - 1, day)
}

export default function SchedulePage() {
	const [now] = useState(() => new Date())
	const [view, setView] = useState<ScheduleView>('week')
	const [weekStart, setWeekStart] = useState(() => startOfWeek(now))
	const [monthStart, setMonthStart] = useState(() => startOfMonth(now))
	const range = useMemo(
		() =>
			view === 'week'
				? scheduleWeekRange(weekStart)
				: scheduleMonthRange(monthStart),
		[view, weekStart, monthStart],
	)
	const data = useScheduleData(range)

	const router = useRouter()
	const startSession = useStartSession()
	const [startingDayId, setStartingDayId] = useState<string | null>(null)

	const ready =
		!data.isPending && !data.isError && data.routines && data.sessions
	const week = useMemo(() => {
		if (view !== 'week' || !ready || !data.routines || !data.sessions) return
		return buildScheduleWeek({
			weekStart,
			now,
			routines: data.routines,
			sessions: data.sessions,
			active: data.active,
			overrides: data.overrides,
		})
	}, [
		view,
		ready,
		data.routines,
		data.sessions,
		data.active,
		data.overrides,
		weekStart,
		now,
	])
	const month = useMemo(() => {
		if (view !== 'month' || !ready || !data.routines || !data.sessions) return
		return buildScheduleMonth({
			monthStart,
			now,
			routines: data.routines,
			sessions: data.sessions,
			active: data.active,
			overrides: data.overrides,
		})
	}, [
		view,
		ready,
		data.routines,
		data.sessions,
		data.active,
		data.overrides,
		monthStart,
		now,
	])

	// SCHED-04: moving opens a dialog with the allowed days; undoing is direct.
	const [moving, setMoving] = useState<MoveRequest | null>(null)
	const [undoingId, setUndoingId] = useState<string | null>(null)
	const undoMove = useUndoMove()
	const { push } = useToast()
	// SCHED-05: a passed day without a session is marked skipped directly.
	const skipOccurrence = useSkipOccurrence()
	const [skippingKey, setSkippingKey] = useState<string | null>(null)
	const handleSkip = async (
		routineId: string,
		date: string,
		target: string,
	) => {
		setSkippingKey(`${routineId}|${date}`)
		try {
			await skipOccurrence.mutateAsync({ routineId, date })
			push({
				title: 'Marked skipped',
				description: `${target} reads as skipped, not as not logged.`,
				variant: 'success',
			})
		} catch (error) {
			push({
				title: 'Not marked skipped',
				description: error instanceof Error ? error.message : undefined,
				variant: 'destructive',
			})
		} finally {
			setSkippingKey(null)
		}
	}
	const handleMove = (
		action: MoveRequest['action'],
		target: MoveRequest['target'],
	) => {
		const routine = data.routines?.find(r => r.id === action.routineId)
		if (!routine) return
		setMoving({
			action,
			target,
			targets: moveTargets({
				occurrenceDate: action.occurrenceDate,
				now,
				routine,
				overrides: data.overrides ?? [],
			}),
		})
	}
	const handleUndoMove = async (overrideId: string, target: string) => {
		setUndoingId(overrideId)
		try {
			await undoMove.mutateAsync(overrideId)
			push({
				// SCHED-05: undoes a move or a skip alike.
				title: 'Change undone',
				description: `${target} is back on its planned day.`,
				variant: 'success',
			})
		} catch (error) {
			push({
				title: 'Change not undone',
				description: error instanceof Error ? error.message : undefined,
				variant: 'destructive',
			})
		} finally {
			setUndoingId(null)
		}
	}

	// SCHED-03: start the day, then open the session; the hook toasts failures.
	const handleStart = async (routineId: string, routineDayId: string) => {
		setStartingDayId(routineDayId)
		try {
			const session = await startSession.mutateAsync({
				routineId,
				routineDayId,
			})
			if (session?.id) router.push(`/workouts/sessions/${session.id}`)
		} catch (error) {
			logger.error('Failed to start session from the schedule', error)
		} finally {
			setStartingDayId(null)
		}
	}

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Schedule</>}
				subtitle={
					<>
						Your planned routine days beside the workouts you logged, by week or
						by month.
					</>
				}
			/>
			<div role="group" aria-label="Schedule view" className="flex gap-1">
				{(['week', 'month'] as const).map(option => (
					<Button
						key={option}
						type="button"
						size="sm"
						variant={view === option ? 'secondary' : 'ghost'}
						aria-pressed={view === option}
						onClick={() => setView(option)}
					>
						{option === 'week' ? 'Week' : 'Month'}
					</Button>
				))}
			</div>
			{view === 'week' ? (
				<ScheduleWeekView
					week={week}
					now={now}
					isPending={data.isPending}
					isError={data.isError}
					hasActiveSession={data.active?.status === 'IN_PROGRESS'}
					startingDayId={startingDayId}
					onStart={(routineId, routineDayId) =>
						void handleStart(routineId, routineDayId)
					}
					onMove={handleMove}
					onUndoMove={(overrideId, target) =>
						void handleUndoMove(overrideId, target)
					}
					onSkip={(routineId, date, target) =>
						void handleSkip(routineId, date, target)
					}
					pendingKey={undoingId ?? skippingKey}
					isCurrentWeek={
						localDateKey(weekStart) === localDateKey(startOfWeek(now))
					}
					onPrevious={() => setWeekStart(start => addDays(start, -7))}
					onNext={() => setWeekStart(start => addDays(start, 7))}
					onToday={() => setWeekStart(startOfWeek(now))}
					onRetry={data.refetch}
				/>
			) : (
				<ScheduleMonthView
					month={month}
					now={now}
					isPending={data.isPending}
					isError={data.isError}
					headingId="schedule-month"
					isCurrentMonth={
						localDateKey(monthStart) === localDateKey(startOfMonth(now))
					}
					onPrevious={() => setMonthStart(start => addMonths(start, -1))}
					onNext={() => setMonthStart(start => addMonths(start, 1))}
					onToday={() => setMonthStart(startOfMonth(now))}
					onRetry={data.refetch}
					// A day opens its week, where it can be started or reviewed.
					onSelectDay={date => {
						setWeekStart(startOfWeek(fromKey(date)))
						setView('week')
					}}
				/>
			)}
			<MoveOccurrenceDialog request={moving} onClose={() => setMoving(null)} />
		</div>
	)
}
