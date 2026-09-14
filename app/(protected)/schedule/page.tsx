'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { ScheduleWeekView } from '@/features/schedule/schedule-week-view'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useActiveSession,
	useSessions,
	useStartSession,
} from '@/lib/api/hooks/useWorkoutSession'
import { logger } from '@/lib/utils/logger'
import {
	addDays,
	buildScheduleWeek,
	localDateKey,
	scheduleWeekRange,
	startOfWeek,
} from '@/lib/utils/schedule-week'

export default function SchedulePage() {
	const [now] = useState(() => new Date())
	const [weekStart, setWeekStart] = useState(() => startOfWeek(now))
	const range = useMemo(() => scheduleWeekRange(weekStart), [weekStart])

	const router = useRouter()
	const startSession = useStartSession()
	const [startingDayId, setStartingDayId] = useState<string | null>(null)
	const routines = useRoutines()
	const active = useActiveSession()
	const sessions = useSessions({ ...range, sort: 'startedAt:asc', limit: 50 })
	const { hasNextPage, isFetchingNextPage, fetchNextPage } = sessions

	// A week is bounded, so read every page rather than showing part of it.
	useEffect(() => {
		if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const isPending =
		routines.isPending ||
		sessions.isPending ||
		Boolean(hasNextPage) ||
		isFetchingNextPage
	const isError = routines.isError || sessions.isError

	const week = useMemo(() => {
		if (isPending || isError || !routines.data || !sessions.data) return
		return buildScheduleWeek({
			weekStart,
			now,
			routines: routines.data,
			sessions: sessions.data.pages.flatMap(page => page.items),
			active: active.data,
		})
	}, [
		isPending,
		isError,
		routines.data,
		sessions.data,
		active.data,
		weekStart,
		now,
	])

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
						Your planned routine days beside the workouts you logged, by week.
					</>
				}
			/>
			<ScheduleWeekView
				week={week}
				now={now}
				isPending={isPending}
				isError={isError}
				hasActiveSession={active.data?.status === 'IN_PROGRESS'}
				startingDayId={startingDayId}
				onStart={(routineId, routineDayId) =>
					void handleStart(routineId, routineDayId)
				}
				isCurrentWeek={
					localDateKey(weekStart) === localDateKey(startOfWeek(now))
				}
				onPrevious={() => setWeekStart(start => addDays(start, -7))}
				onNext={() => setWeekStart(start => addDays(start, 7))}
				onToday={() => setWeekStart(startOfWeek(now))}
				onRetry={() => {
					void routines.refetch()
					void sessions.refetch()
				}}
			/>
		</div>
	)
}
