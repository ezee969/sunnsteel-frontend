'use client'

import { RefreshCw, Users } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	ActivityFact,
	AuthorHeader,
} from '@/features/activity/activity-entry-list'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useActivityFeed } from '@/lib/api/hooks/useActivity'
import { describeEmptyFeed } from '@/lib/utils/activity'
import {
	buildFollowingPreview,
	describeMoreFacts,
	getFollowingPreviewEmptyState,
} from '@/lib/utils/dashboard-following'

import { DashboardSection } from './DashboardSection'

/**
 * DASH-08. A few recent updates from the members the viewer follows, read
 * from the SOC-03 feed itself — the same query and cache as `/activity`, so
 * the server's SOC-04 audiences decide every entry and opening the Activity
 * page after the dashboard costs no second request. It never asks for a
 * further page: the preview is bounded, and the rest lives behind the link.
 */
export default function FollowingPreview() {
	const t = useTranslations('planning.dashboardFollowing')
	const tActivity = useTranslations('social.activity')
	const query = useActivityFeed()
	const weightUnit = useWeightUnit()
	const rows = useMemo(
		() =>
			buildFollowingPreview(
				query.data?.pages.flatMap(page => page.entries) ?? [],
			),
		[query.data],
	)
	const followedCount = query.data?.pages[0]?.followedCount ?? 0

	return (
		<DashboardSection
			id="following"
			icon={<Users className="h-4 w-4 text-ink-3" aria-hidden />}
		>
			{query.isPending ? (
				<div
					role="status"
					aria-label="Loading activity from members you follow"
					className="space-y-3 py-3"
				>
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : query.isError ? (
				<div role="alert" className="space-y-3 py-3">
					<p className="type-body-sm text-foreground">
						Activity from members you follow could not be loaded.
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => void query.refetch()}
						disabled={query.isFetching}
					>
						<RefreshCw className="size-4" aria-hidden />
						Try again
					</Button>
				</div>
			) : rows.length === 0 ? (
				<EmptyModule
					{...getFollowingPreviewEmptyState(
						followedCount,
						describeEmptyFeed(followedCount, tActivity),
						t,
					)}
				/>
			) : (
				<>
					<ul
						aria-label="Recent activity from members you follow"
						className="border-t border-rule-faint"
					>
						{rows.map(row => (
							<li key={row.key} className="rule-row space-y-3 py-4">
								<AuthorHeader entry={row.entries[0]} />
								<ul className="space-y-3">
									{row.entries.map(entry => (
										<li key={entry.id}>
											<ActivityFact
												entry={entry}
												weightUnit={weightUnit}
												discussion={false}
											/>
										</li>
									))}
								</ul>
								{row.moreCount > 0 ? (
									<p className="type-body-sm pl-7 text-ink-3">
										{describeMoreFacts(row.moreCount, t)}
									</p>
								) : null}
							</li>
						))}
					</ul>
					<div className="pt-4">
						<Button asChild variant="outline" size="sm">
							<Link href="/activity">See all activity</Link>
						</Button>
					</div>
				</>
			)}
		</DashboardSection>
	)
}
