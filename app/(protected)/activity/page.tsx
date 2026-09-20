'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFeed } from '@/features/activity/activity-feed'
import { OwnActivity } from '@/features/activity/own-activity'

type ActivityView = 'following' | 'yours'

/** `?view=yours` so Settings can send the owner straight to their own list. */
function ActivityViews() {
	const router = useRouter()
	const pathname = usePathname()
	const params = useSearchParams()
	const view: ActivityView =
		params.get('view') === 'yours' ? 'yours' : 'following'

	const choose = (next: ActivityView) =>
		router.replace(next === 'yours' ? `${pathname}?view=yours` : pathname, {
			scroll: false,
		})

	return (
		<>
			<div role="group" aria-label="Activity view" className="flex gap-1">
				{(['following', 'yours'] as const).map(option => (
					<Button
						key={option}
						type="button"
						size="sm"
						variant={view === option ? 'secondary' : 'ghost'}
						aria-pressed={view === option}
						onClick={() => choose(option)}
					>
						{option === 'following' ? 'Following' : 'Yours'}
					</Button>
				))}
			</div>
			{view === 'following' ? <ActivityFeed /> : <OwnActivity />}
		</>
	)
}

export default function ActivityPage() {
	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Activity</>}
				subtitle={
					<>
						What members you follow did, and who sees what you did. Every entry
						comes from verified training; nothing is posted by hand.
					</>
				}
			/>
			<Suspense fallback={<Skeleton className="h-40" />}>
				<ActivityViews />
			</Suspense>
		</div>
	)
}
