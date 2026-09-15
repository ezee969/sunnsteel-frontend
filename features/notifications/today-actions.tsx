'use client'

import { Dumbbell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useTodaysWorkouts } from '@/app/(protected)/dashboard/hooks/useTodaysWorkouts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession'
import { logger } from '@/lib/utils/logger'
import { routineDayTitle } from '@/lib/utils/routine-schedule'

/**
 * NOTIF-01: what can be acted on now, derived from the plan rather than
 * stored, so it has no read state: a live session to resume, else today's
 * planned workouts to start (the same list as the dashboard's).
 */
export function TodayActions() {
	const router = useRouter()
	const { entries, active, isPending, error } = useTodaysWorkouts()
	const startSession = useStartSession()
	const [startingDayId, setStartingDayId] = useState<string | null>(null)
	const live = active?.status === 'IN_PROGRESS' ? active : null

	const handleStart = async (routineId: string, routineDayId: string) => {
		setStartingDayId(routineDayId)
		try {
			const session = await startSession.mutateAsync({
				routineId,
				routineDayId,
			})
			if (session?.id) router.push(`/workouts/sessions/${session.id}`)
		} catch (failure) {
			logger.error('Failed to start session from notifications', failure)
		} finally {
			setStartingDayId(null)
		}
	}

	return (
		<section aria-labelledby="notifications-today" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="notifications-today" className="type-section text-foreground">
					Today
				</h2>
				<p className="type-body-sm mt-1 text-ink-3">
					What you can act on now. It follows your plan, so it is never counted
					as unread.
				</p>
			</div>
			{isPending ? (
				<Skeleton className="h-12" aria-label="Loading today’s workouts" />
			) : error ? (
				<p className="type-body-sm text-ink-3">
					Today’s plan is unavailable right now.
				</p>
			) : live ? (
				<ul>
					<li className="rule-row flex flex-wrap items-center justify-between gap-3 py-3">
						<p className="type-body-sm min-w-0 text-foreground">
							{live.routine?.name ?? 'Your workout'} is in progress
						</p>
						<Button asChild variant="outline" size="sm">
							<Link href={`/workouts/sessions/${live.id}`}>
								<Dumbbell className="size-4" aria-hidden />
								Resume
							</Link>
						</Button>
					</li>
				</ul>
			) : entries.length === 0 ? (
				<p className="type-body-sm text-ink-3">Nothing planned for today.</p>
			) : (
				<ul>
					{entries.map(({ routine, day, canStartToday }) => {
						const target = `${routine.name} · ${routineDayTitle(day)}`
						return (
							<li
								key={`${routine.id}:${day.id}`}
								className="rule-row flex flex-wrap items-center justify-between gap-3 py-3"
							>
								<p className="type-body-sm min-w-0 text-foreground">
									{target} is planned today
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-label={`Start ${target}`}
									disabled={!canStartToday || startingDayId !== null}
									onClick={() => void handleStart(routine.id, day.id)}
								>
									{startingDayId === day.id ? (
										<Loader2 className="size-4 animate-spin" aria-hidden />
									) : (
										<Dumbbell className="size-4" aria-hidden />
									)}
									Start
								</Button>
							</li>
						)
					})}
				</ul>
			)}
		</section>
	)
}
