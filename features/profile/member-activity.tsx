'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Loader2, Rss } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityEntryList } from '@/features/activity/activity-entry-list'
import { useMemberActivity } from '@/lib/api/hooks/useActivity'

/**
 * SOC-03 on another member's profile: their activity as this viewer may see
 * it. Only inside the authenticated shell -- activity is never shown signed
 * out. An empty list reads the same whether the member shared nothing or
 * shared nothing with this viewer, because saying which would disclose it.
 */
export function MemberActivity({
	identifier,
	weightUnit,
}: {
	identifier: string
	weightUnit: WeightUnit
}) {
	const query = useMemberActivity(identifier)
	const entries = useMemo(
		() => query.data?.pages.flatMap(page => page.entries) ?? [],
		[query.data],
	)
	return (
		<section aria-labelledby="profile-activity">
			<h2
				id="profile-activity"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Rss className="h-4 w-4 text-ink-3" aria-hidden /> Activity
			</h2>
			{query.isPending ? (
				<div className="space-y-3 pt-3" aria-label="Loading activity">
					<Skeleton className="h-16" />
					<Skeleton className="h-16" />
				</div>
			) : query.isError ? (
				<div className="flex flex-wrap items-center gap-3 py-3">
					<p className="type-body-sm text-ink-3">
						Activity could not be loaded.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void query.refetch()}
					>
						Retry
					</Button>
				</div>
			) : entries.length === 0 ? (
				<p className="type-body-sm py-3 text-ink-3">
					No activity you can see yet.
				</p>
			) : (
				<div className="space-y-4">
					<ActivityEntryList
						entries={entries}
						weightUnit={weightUnit}
						showAuthor={false}
						label="Activity"
						ruled={false}
					/>
					{query.hasNextPage ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void query.fetchNextPage()}
							disabled={query.isFetchingNextPage}
						>
							{query.isFetchingNextPage ? (
								<Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
							) : null}
							Show more
						</Button>
					) : null}
				</div>
			)}
		</section>
	)
}
