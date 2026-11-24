'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

function ActivityViews() {
	const t = useTranslations('social.activityPage')
	const params = useSearchParams()
	const yours = params.get('view') === 'yours'

	const tabs = [
		{ href: '/activity', label: t('following') },
		{ href: '/activity?view=yours', label: t('yours') },
	]

	return (
		<>
			<PageTabs label={t('viewsLabel')} tabs={tabs} />
			{yours ? <OwnActivity /> : <ActivityFeed />}
		</>
	)
}

export default function ActivityPage() {
	const t = useTranslations('social.activityPage')
	return (
		<div className="mx-auto flex max-w-4xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />
			<Suspense fallback={<Skeleton className="h-40" />}>
				<ActivityViews />
			</Suspense>
		</div>
	)
}
