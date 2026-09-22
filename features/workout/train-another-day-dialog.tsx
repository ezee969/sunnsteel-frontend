'use client'

import { CalendarCheck, Dumbbell, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/toast'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useStartSession } from '@/lib/api/hooks/useWorkoutSession'
import {
	TRAIN_ANOTHER_DAY_DESCRIPTION,
	TRAIN_ANOTHER_DAY_EMPTY,
	trainableDays,
} from '@/lib/utils/train-another-day'

/**
 * LIVE-06. Starting a day of your own that today's plan does not call for.
 *
 * It replaces Quick Workout, which built a routine with an empty day and
 * opened a session with nothing loggable (`FIX-04` hid it). Every day here
 * carries a real prescription, so what it starts is an ordinary session:
 * the same snapshot, progression, records and activity as any other.
 */
export function TrainAnotherDayDialog({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const router = useRouter()
	const { push } = useToast()
	const { data: routines, isLoading } = useRoutines()
	const start = useStartSession()
	const [startingDayId, setStartingDayId] = useState<string | null>(null)

	const days = useMemo(
		() => trainableDays(routines, new Date().getDay()),
		[routines],
	)

	const startDay = (routineId: string, dayId: string) => {
		setStartingDayId(dayId)
		start.mutate(
			{ routineId, routineDayId: dayId },
			{
				onSuccess: session => {
					if (session?.id) {
						onOpenChange(false)
						router.push(`/workouts/sessions/${session.id}`)
						return
					}
					setStartingDayId(null)
				},
				onError: (error: unknown) => {
					setStartingDayId(null)
					push({
						title: 'Could not start this workout',
						// The hook types its error as unknown, as the others here do.
						description: error instanceof Error ? error.message : String(error),
						variant: 'destructive',
					})
				},
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Train another day</DialogTitle>
					<DialogDescription>{TRAIN_ANOTHER_DAY_DESCRIPTION}</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<p className="type-body-sm flex items-center gap-2 py-6 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						Loading your routines…
					</p>
				) : days.length === 0 ? (
					<p className="type-body-sm py-6 text-ink-3">
						{TRAIN_ANOTHER_DAY_EMPTY}
					</p>
				) : (
					<ScrollArea className="max-h-[60vh]">
						<ul>
							{days.map(day => (
								<li key={day.dayId} className="rule-row py-2">
									<div className="flex items-center justify-between gap-3">
										<div className="min-w-0">
											<p className="type-panel flex items-center gap-2 text-foreground">
												<span className="truncate">{day.dayLabel}</span>
												{day.isToday ? (
													<span className="type-body-sm inline-flex items-center gap-1 text-ink-3">
														<CalendarCheck className="size-3.5" aria-hidden />
														Today
													</span>
												) : null}
											</p>
											<p className="type-body-sm truncate text-ink-3">
												{day.routineName} ·{' '}
												{day.exerciseCount === 1
													? '1 exercise'
													: `${day.exerciseCount} exercises`}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											aria-label={`Start ${day.dayLabel} from ${day.routineName}`}
											disabled={start.isPending}
											onClick={() => startDay(day.routineId, day.dayId)}
										>
											{startingDayId === day.dayId ? (
												<Loader2
													className="mr-2 size-4 animate-spin"
													aria-hidden
												/>
											) : (
												<Dumbbell className="mr-2 size-4" aria-hidden />
											)}
											Start
										</Button>
									</div>
								</li>
							))}
						</ul>
					</ScrollArea>
				)}
			</DialogContent>
		</Dialog>
	)
}
