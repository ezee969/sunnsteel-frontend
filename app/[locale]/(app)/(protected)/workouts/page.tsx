'use client'

import { ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { TrainAnotherDayDialog } from '@/features/workout/train-another-day-dialog'
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession'
import { useComponentPreloading } from '@/lib/utils/dynamic-imports'

export default function WorkoutsIndexPage() {
	const t = useTranslations('workout.page')
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
					<Loader2 aria-hidden className="h-5 w-5 animate-spin" />
					<span>{t('loadingWorkouts')}</span>
				</div>
			</div>
		)
	}

	// If there is an active session, we'll navigate away; render a lightweight fallback meanwhile
	if (active?.id) {
		return (
			<div className="flex h-[calc(100vh-300px)] items-center justify-center">
				<div className="type-body-sm text-ink-3">{t('redirecting')}</div>
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
					{t('title')}
				</h1>
				<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
					{t('description')}
				</p>
			</div>

			{/* LIVE-06. This is where the Quick Workout button was, and it is
			    the reason FIX-04 could only hide it: starting an empty routine
			    opened a session with nothing to log. This starts a real day of
			    the owner's own instead. UX-25 (§4.3 rule 1): it is the page's one
			    filled control; the rest are places to go, so they are links. */}
			<div>
				<Button variant="default" onClick={() => setPickingDay(true)}>
					<ClassicalIcon name="dumbbell" className="mr-2 h-4 w-4" aria-hidden />
					{t('trainAnotherDay')}
				</Button>
			</div>

			<nav aria-label={t('goTo')} className="max-w-[var(--cluster-max)]">
				<ul className="border-t border-rule">
					{(
						[
							['/routines', t('goToRoutines'), undefined],
							['/workouts/history', t('viewHistory'), 'workoutHistoryPage'],
							['/dashboard', t('dashboard'), undefined],
						] as const
					).map(([href, label, preload]) => (
						<li key={href} className="rule-row">
							<Link
								href={href}
								{...(preload ? preloadOnHover(preload) : {})}
								className="type-action flex min-h-11 items-center justify-between gap-2 py-2 text-foreground hover:text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								{label}
								<ChevronRight aria-hidden className="h-4 w-4 text-ink-3" />
							</Link>
						</li>
					))}
				</ul>
			</nav>

			<TrainAnotherDayDialog open={pickingDay} onOpenChange={setPickingDay} />
		</div>
	)
}
