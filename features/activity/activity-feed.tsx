'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Explanation } from '@/components/layout/explanation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityEntryList } from '@/features/activity/activity-entry-list'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useActivityFeed } from '@/lib/api/hooks/useActivity'
import { describeEmptyFeed } from '@/lib/utils/activity'

/** SOC-03: what the members the viewer follows did, as they chose to share it. */
export function ActivityFeed() {
	const t = useTranslations('social.activityUi')
	const tActivity = useTranslations('social.activity')
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
					{t('following')}
				</h2>
				{/* UX-17 (§23.4): one line shown, the full scope one tap away. */}
				<Explanation summary={tActivity('feedScopeSummary')} className="mt-1">
					<p>{tActivity('feedScopeNote')}</p>
				</Explanation>
			</div>

			{query.isPending ? (
				<div className="space-y-3" aria-label={t('loading')}>
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : query.isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">{t('errorTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={() => void query.refetch()}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : entries.length === 0 ? (
				<EmptyModule
					{...describeEmptyFeed(first?.followedCount ?? 0, tActivity)}
					action={
						(first?.followedCount ?? 0) === 0
							? { kind: 'link', href: '/search', label: t('findMembers') }
							: undefined
					}
				/>
			) : (
				<>
					{first?.followedTruncated ? (
						<p role="status" className="type-body-sm text-ink-2">
							{t('truncated')}
						</p>
					) : null}
					<ActivityEntryList
						entries={entries}
						weightUnit={weightUnit}
						showAuthor
						label={t('feedLabel')}
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
							{t('showMore')}
						</Button>
					) : null}
				</>
			)}
		</section>
	)
}
