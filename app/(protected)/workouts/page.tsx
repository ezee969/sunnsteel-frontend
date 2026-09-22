'use client'

import { ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { TrainAnotherDayDialog } from '@/features/workout/train-another-day-dialog'
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

export default function WorkoutsIndexPage() {
	const router = useRouter()
	const { preloadOnHover } = useComponentPreloading()
	const { data: active, isLoading } = useActiveSession()
	const [pickingDay, setPickingDay] = useState(false)

	useEffect(() => {
		if (active?.id) {
			router.replace(`/workouts/sessions/${active.id}`)
		}
	}, [active?.id, router])

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-300px)] items-center justify-center">
				<div className="type-body-sm flex items-center gap-2 text-ink-3">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>Loading your workouts...</span>
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
		// Final review 8: a page-specific composition on the page grid, not a
		// centred placeholder. The message is the page inscription (§11.11) and
		// the actions share its left axis, capped to a readable measure.
		<div className="flex flex-col gap-6">
			<div className="rule-heading pb-4">
				<h1 className="type-page corner-brackets inline-block text-foreground">
					No Active Workout
				</h1>
				<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
					You don&apos;t have a workout in progress right now. Pick a routine to
					start training, or review your history.
				</p>
			</div>

			{/* Actions */}
			<div className="flex flex-wrap gap-3">
				{/* LIVE-06. This is where the Quick Workout button was, and it is
				    the reason FIX-04 could only hide it: starting an empty routine
				    opened a session with nothing to log. This starts a real day of
				    the owner's own instead. */}
				<Button variant="default" onClick={() => setPickingDay(true)}>
					<ClassicalIcon name="dumbbell" className="mr-2 h-4 w-4" aria-hidden />
					Train another day
				</Button>
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

			<TrainAnotherDayDialog open={pickingDay} onOpenChange={setPickingDay} />
		</div>
	)
}
