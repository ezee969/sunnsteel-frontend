'use client'

import { ChevronRight, Dumbbell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useCreateRoutine, useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useActiveSession,
	useStartSession,
} from '@/lib/api/hooks/useWorkoutSession'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

// FIX-04 (decided 2026-09-07): the Quick Workout entry point is hidden, not
// removed. `handleStartEmptyWorkout` below creates a routine whose only day has
// `exercises: []`, so the session it opens has nothing loggable and no way to add
// anything. The replacement flow is LIVE-06, which is BLOCKED on a product
// decision that has not been made, so the handler stays wired behind this flag
// rather than being deleted: flipping this constant is the whole revert.
//
// The code it guards is deliberately unreachable. Do not remove it as dead code.
const SHOW_QUICK_WORKOUT_ENTRY: boolean = false

export default function WorkoutsIndexPage() {
	const router = useRouter()
	const { preloadOnHover } = useComponentPreloading()
	const { data: active, isLoading } = useActiveSession()
	const { data: routines } = useRoutines()
	const { mutate: createRoutine } = useCreateRoutine()
	const { mutate: startSession } = useStartSession()
	const { push } = useToast()
	const [isStartingEmpty, setIsStartingEmpty] = useState(false)

	useEffect(() => {
		if (active?.id) {
			router.replace(`/workouts/sessions/${active.id}`)
		}
	}, [active?.id, router])

	const handleStartEmptyWorkout = () => {
		setIsStartingEmpty(true)

		// 1. Check if "Quick Workout" routine already exists
		const existing = routines?.find(r => r.name === 'Quick Workout')
		if (existing && existing.days.length > 0) {
			startSession(
				{
					routineId: existing.id,
					routineDayId: existing.days[0].id,
				},
				{
					onSuccess: session => {
						if (session?.id) {
							router.push(`/workouts/sessions/${session.id}`)
						} else {
							setIsStartingEmpty(false)
						}
					},
					onError: () => {
						setIsStartingEmpty(false)
					},
				},
			)
			return
		}

		// 2. Create the "Quick Workout" routine first
		const today = new Date().getDay()
		createRoutine(
			{
				name: 'Quick Workout',
				description:
					'Quick training session started without a pre-made routine',
				isPeriodized: false,
				days: [
					{
						dayOfWeek: today,
						order: 1,
						exercises: [],
					},
				],
			},
			{
				onSuccess: newRoutine => {
					if (newRoutine && newRoutine.days.length > 0) {
						startSession(
							{
								routineId: newRoutine.id,
								routineDayId: newRoutine.days[0].id,
							},
							{
								onSuccess: session => {
									if (session?.id) {
										router.push(`/workouts/sessions/${session.id}`)
									} else {
										setIsStartingEmpty(false)
									}
								},
								onError: () => {
									setIsStartingEmpty(false)
								},
							},
						)
					} else {
						setIsStartingEmpty(false)
						push({
							title: 'Error',
							description: 'Failed to initialize routine day.',
						})
					}
				},
				onError: err => {
					setIsStartingEmpty(false)
					push({ title: 'Error starting workout', description: err.message })
				},
			},
		)
	}

	if (isLoading || isStartingEmpty) {
		return (
			<div className="flex h-[calc(100vh-300px)] items-center justify-center">
				<div className="type-body-sm flex items-center gap-2 text-ink-3">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>
						{isStartingEmpty
							? 'Initializing quick workout...'
							: 'Loading your workouts...'}
					</span>
				</div>
			</div>
		)
	}

	// If there is an active session, we'll navigate away; render a lightweight fallback meanwhile
	if (active?.id) {
		return (
			<div className="flex h-[calc(100vh-300px)] items-center justify-center">
				<div className="type-body-sm text-ink-3">
					Redirecting to your active session…
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
			<div className="mx-auto max-w-md text-center space-y-6">
				{/* Visual icon */}
				<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-sm bg-surface-sunk">
					<Dumbbell className="h-10 w-10 text-ink-3" aria-hidden />
				</div>

				{/* Heading & copy */}
				<div className="space-y-2">
					<h2 className="type-section text-foreground">No Active Workout</h2>
					<p className="type-body-sm text-ink-3">
						You don&apos;t have a workout in progress right now. Pick a routine
						to start training, or review your history.
					</p>
				</div>

				{/* Actions */}
				<div className="flex flex-wrap justify-center gap-3">
					{SHOW_QUICK_WORKOUT_ENTRY && (
						<Button
							variant="default"
							onClick={handleStartEmptyWorkout}
							disabled={isStartingEmpty}
						>
							<ClassicalIcon
								name="dumbbell"
								className="mr-2 h-4 w-4"
								aria-hidden
							/>
							Start Empty Workout
						</Button>
					)}
					<Button asChild variant="outline">
						<Link href="/routines">Go to Routines</Link>
					</Button>
					<Button asChild variant="outline">
						<Link
							href="/workouts/history"
							{...preloadOnHover('workoutHistoryPage')}
						>
							View History
						</Link>
					</Button>
					<Button asChild variant="secondary">
						<Link href="/dashboard">
							Dashboard
							<ChevronRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
