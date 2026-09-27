'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { PageTabs } from '@/components/layout/page-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFeed } from '@/features/activity/activity-feed'
import { OwnActivity } from '@/features/activity/own-activity'

/**
 * `?view=yours` so Settings can send the owner straight to their own list.
 * The two views are page tabs (design system §21): links that keep their
 * URLs, so Back returns to the other view.
 */
const ACTIVITY_TABS = [
	{ href: '/activity', label: 'Following' },
	{ href: '/activity?view=yours', label: 'Yours' },
] as const

function ActivityViews() {
	const params = useSearchParams()
	const yours = params.get('view') === 'yours'

	return (
		<>
			<PageTabs label="Activity views" tabs={ACTIVITY_TABS} />
			{yours ? <OwnActivity /> : <ActivityFeed />}
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
