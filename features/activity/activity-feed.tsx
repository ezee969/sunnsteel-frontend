'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityEntryList } from '@/features/activity/activity-entry-list'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useActivityFeed } from '@/lib/api/hooks/useActivity'
import {
	ACTIVITY_FEED_SCOPE_NOTE,
	describeEmptyFeed,
} from '@/lib/utils/activity'

/** SOC-03: what the members the viewer follows did, as they chose to share it. */
export function ActivityFeed() {
	const query = useActivityFeed()
	const weightUnit = useWeightUnit()
	const entries = useMemo(
		() => query.data?.pages.flatMap(page => page.entries) ?? [],
		[query.data],
	)
	const first = query.data?.pages[0]

	return (
		<section aria-labelledby="activity-following" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="activity-following" className="type-section text-foreground">
					Following
				</h2>
				<p className="type-body-sm mt-1 max-w-[68ch] text-ink-3">
					{ACTIVITY_FEED_SCOPE_NOTE}
				</p>
			</div>

			{query.isPending ? (
				<div className="space-y-3" aria-label="Loading activity">
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : query.isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">Activity is unavailable</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load it. Try again.
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={() => void query.refetch()}
					>
						<RefreshCw className="size-4" aria-hidden />
						Retry
					</Button>
				</div>
			) : entries.length === 0 ? (
				<EmptyModule
					{...describeEmptyFeed(first?.followedCount ?? 0)}
					action={
						(first?.followedCount ?? 0) === 0
							? { kind: 'link', href: '/search', label: 'Find members' }
							: undefined
					}
				/>
			) : (
				<>
					{first?.followedTruncated ? (
						<p role="status" className="type-body-sm text-ink-2">
							You follow more members than the feed reads at once, so some of
							their activity is not shown here. Their profiles still show it.
						</p>
					) : null}
					<ActivityEntryList
						entries={entries}
						weightUnit={weightUnit}
						showAuthor
						label="Activity from members you follow"
						canReact
					/>
					{query.hasNextPage ? (
						<Button
							type="button"
							variant="outline"
							onClick={() => void query.fetchNextPage()}
							disabled={query.isFetchingNextPage}
						>
							{query.isFetchingNextPage ? (
								<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
							) : null}
							Show more
						</Button>
					) : null}
				</>
			)}
		</section>
	)
}
