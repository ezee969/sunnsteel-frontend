'use client'

import { Dumbbell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useTodaysWorkouts } from '@/app/[locale]/(protected)/dashboard/hooks/useTodaysWorkouts'
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
	const t = useTranslations('social.notifications')
	const tDate = useTranslations('routines.date')
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
					{t('todayTitle')}
				</h2>
				<p className="type-body-sm mt-1 text-ink-3">{t('todayBody')}</p>
			</div>
			{isPending ? (
				<Skeleton className="h-12" aria-label={t('todayLoading')} />
			) : error ? (
				<p className="type-body-sm text-ink-3">{t('todayError')}</p>
			) : live ? (
				<ul>
					<li className="rule-row flex flex-wrap items-center justify-between gap-3 py-3">
						<p className="type-body-sm min-w-0 text-foreground">
							{t('todayLive', {
								name: live.routine?.name ?? t('todayLiveFallback'),
							})}
						</p>
						<Button asChild variant="outline" size="sm">
							<Link href={`/workouts/sessions/${live.id}`}>
								<Dumbbell className="size-4" aria-hidden />
								{t('todayResume')}
							</Link>
						</Button>
					</li>
				</ul>
			) : entries.length === 0 ? (
				<p className="type-body-sm text-ink-3">{t('todayNone')}</p>
			) : (
				<ul>
					{entries.map(({ routine, day, canStartToday }) => {
						const target = `${routine.name} · ${routineDayTitle(day, 'long', tDate)}`
						return (
							<li
								key={`${routine.id}:${day.id}`}
								className="rule-row flex flex-wrap items-center justify-between gap-3 py-3"
							>
								<p className="type-body-sm min-w-0 text-foreground">
									{t('todayPlanned', { target })}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-label={t('todayStartAria', { target })}
									disabled={!canStartToday || startingDayId !== null}
									onClick={() => void handleStart(routine.id, day.id)}
								>
									{startingDayId === day.id ? (
										<Loader2 className="size-4 animate-spin" aria-hidden />
									) : (
										<Dumbbell className="size-4" aria-hidden />
									)}
									{t('todayStart')}
								</Button>
							</li>
						)
					})}
				</ul>
			)}
		</section>
	)
}
