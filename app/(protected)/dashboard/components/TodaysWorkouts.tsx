'use client'

import { Calendar, ChevronRight, Dumbbell, History } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import ClassicalIcon from '@/components/icons/ClassicalIcon'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { ClassicalLoader } from '@/components/ui/classical-loader'
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession'
import { cn } from '@/lib/utils'
import {
	getDashboardPrimaryCopy,
	resolveDashboardPrimaryAction,
} from '@/lib/utils/dashboard-primary-action'
import { weekdayName } from '@/lib/utils/date'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

import { useTodaysWorkouts } from '../hooks/useTodaysWorkouts'

export default function TodaysWorkouts() {
	const router = useRouter()
	const { preloadOnHover } = useComponentPreloading()
	const { mutateAsync: startSession, isPending } = useStartSession()

	const {
		todayDow,
		entries: visibleTodays,
		active,
		completedToday,
		error,
		isPending: isDataPending,
	} = useTodaysWorkouts()

	const [activeConflictOpen, setActiveConflictOpen] = useState(false)

	const handleStart = async (routineId: string, routineDayId: string) => {
		if (!routineId || !routineDayId) return

		if (active?.id && active.routineDayId !== routineDayId) {
			setActiveConflictOpen(true)
			return
		}

		const session = await startSession({ routineId, routineDayId })
		if (session?.id) router.push(`/workouts/sessions/${session.id}`)
	}

	// Reachable only after the first reveal (the page gates the initial load) —
	// e.g. a background refetch that invalidates the list. Keep it wordless so it
	// reads as the same surface still settling, not as new copy appearing.
	if (isDataPending) {
		return (
			<Card>
				<CardContent className="flex min-h-32 items-center justify-center">
					<ClassicalLoader size="md" label="Loading today’s workouts" />
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<p className="type-body-sm text-destructive">Error: {error.message}</p>
		)
	}

	// DASH-02: one dominant action for the user's current state — resume an
	// open session, start today's workout, review the one already finished, or
	// browse routines. §4.3 rule 1: it is the only filled control in the card;
	// every repeated row control is outline.
	const action = resolveDashboardPrimaryAction({
		active,
		entries: visibleTodays,
		completedToday,
	})
	const copy = getDashboardPrimaryCopy(action, {
		plannedCount: visibleTodays.length,
		todayName: weekdayName(todayDow, 'long'),
	})

	return (
		<>
			{/* One of the three things §11.5 keeps boxed: the screen's single
			    primary call to action. Everything else on this page is ruled. */}
			<Card>
				<CardHeader>
					<CardTitle className="type-section text-foreground">
						{copy.title}
					</CardTitle>
					<CardDescription>{copy.description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{action.kind === 'RESUME' ? (
						<Button
							type="button"
							onClick={() =>
								router.push(`/workouts/sessions/${action.sessionId}`)
							}
							{...preloadOnHover('activeWorkoutSession')}
						>
							<Dumbbell aria-hidden />
							Resume workout
						</Button>
					) : action.kind === 'REVIEW' ? (
						<Button asChild>
							<Link href={`/workouts/history/${action.sessionId}`}>
								<History aria-hidden />
								Review session
							</Link>
						</Button>
					) : action.kind === 'BROWSE' ? (
						<Button asChild>
							<Link href="/routines">
								<ClassicalIcon
									name={'scroll-unfurled'}
									aria-hidden
									className={cn(
										'h-4 w-4 transition-colors duration-[var(--motion-fast)] ease-standard',
										'text-primary-foreground',
									)}
								/>
								Browse Routines
							</Link>
						</Button>
					) : null}

					{visibleTodays.length > 0 ? (
						<div>
							{visibleTodays.map(({ routine, day, canStartToday }) => {
								const isActiveForThis =
									action.kind === 'RESUME' && action.routineDayId === day.id
								const isPrimary =
									action.kind === 'START' && action.routineDayId === day.id
								return (
									<div
										key={`${routine.id}:${day.id}`}
										className="rule-row py-3 first:pt-0 last:pb-0 sm:flex sm:items-center sm:justify-between"
									>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="type-panel min-w-0 truncate text-foreground">
													{routine.name}
												</span>
												{/* §4.3 rule 3 — a scheduled weekday is not an
												    achievement, so it is not an honour mark. */}
												<Badge variant="outline">
													<Calendar className="h-3 w-3" aria-hidden />
													{weekdayName(day.dayOfWeek)}
												</Badge>
											</div>
											{isActiveForThis ? (
												<p className="type-body-sm mt-1 text-ink-3">
													In progress
												</p>
											) : null}
										</div>
										<div
											className={cn(
												'mt-3 grid w-full gap-2 sm:mt-0 sm:ml-3 sm:flex sm:w-auto sm:shrink-0 sm:items-center',
												isActiveForThis ? 'grid-cols-1' : 'grid-cols-2',
											)}
										>
											{isActiveForThis ? null : (
												<Button
													type="button"
													className="w-full sm:w-auto"
													variant={isPrimary ? 'default' : 'outline'}
													aria-label={`Start ${routine.name}`}
													onClick={() => handleStart(routine.id, day.id)}
													disabled={isPending || !canStartToday}
													title={
														!canStartToday
															? `This workout is not scheduled for ${weekdayName(todayDow, 'long')}`
															: undefined
													}
													{...preloadOnHover('activeWorkoutSession')}
												>
													<Dumbbell aria-hidden />
													Start
												</Button>
											)}
											<Button
												asChild
												variant="outline"
												className="w-full sm:w-auto"
											>
												<Link
													href={`/routines/${routine.id}`}
													aria-label={`${routine.name} details`}
												>
													Details
													<ChevronRight aria-hidden />
												</Link>
											</Button>
										</div>
									</div>
								)
							})}
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Active session conflict dialog */}
			<AlertDialog
				open={activeConflictOpen}
				onOpenChange={setActiveConflictOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Active workout in progress</AlertDialogTitle>
						<AlertDialogDescription>
							You already have an active session
							{active?.routine?.name ? ` for "${active.routine.name}"` : ''}.
							You can resume it now. Starting another workout is not supported
							while a session is in progress.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Close</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setActiveConflictOpen(false)
								if (active?.id) router.push(`/workouts/sessions/${active.id}`)
							}}
						>
							Go to Active Session
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
