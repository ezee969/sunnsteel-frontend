'use client'

import { ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RankCrest } from '@/features/achievements/rank-crest'
import { useAchievements } from '@/lib/api/hooks/useAchievements'
import { buildDashboardRank } from '@/lib/utils/dashboard-rank'

/**
 * DASH-11. The member's rank leads the dashboard, the way a competitive rank
 * leads a player's profile: the crest, the rank and the attendance still
 * needed for the next one. It belongs to the masthead, not to the DASH-05
 * layout, so it cannot be hidden or moved. It reads the `/achievements` key
 * Upcoming Milestones already uses, so it adds no request while that section
 * is shown, and it is a link rather than a control: the one filled action
 * stays in Today's Workouts.
 */
export default function DashboardRank() {
	const t = useTranslations('planning.dashboardRank')
	const tRank = useTranslations('achievements.rank')
	const tCatalogRanks = useTranslations('catalog.ranks')
	const { data, isPending, isError, refetch, isFetching } = useAchievements()

	if (isPending) {
		return (
			<div role="status" aria-label={t('loadingAria')}>
				<Skeleton className="h-24 sm:h-20" />
			</div>
		)
	}

	if (isError) {
		return (
			<div
				role="alert"
				className="flex flex-wrap items-center gap-3 border-y border-rule py-4"
			>
				<p className="type-body-sm text-foreground">{t('loadError')}</p>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => refetch()}
					disabled={isFetching}
				>
					<RefreshCw className="size-4" aria-hidden />
					{t('retry')}
				</Button>
			</div>
		)
	}

	const rank = buildDashboardRank(
		{ rank: tRank, catalogRanks: tCatalogRanks },
		data,
	)
	if (!rank) return null

	return (
		<section aria-labelledby="dashboard-rank-heading">
			<h2 id="dashboard-rank-heading" className="sr-only">
				{t('heading')}
			</h2>
			<Link
				href="/achievements"
				className="group flex flex-col gap-4 border-y border-rule px-1 py-4 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-6"
			>
				<div className="flex min-w-0 flex-1 items-center gap-4">
					<RankCrest rankId={rank.rankId} className="size-12" />
					<div className="min-w-0">
						<p className="type-label text-ink-3">{tRank('current')}</p>
						<p className="type-panel mt-0.5 text-foreground">{rank.title}</p>
						<p className="type-data mt-0.5 text-ink-2">{rank.evidence}</p>
					</div>
				</div>

				<div className="flex min-w-0 items-center gap-3 sm:max-w-[50%]">
					{rank.next ? (
						<>
							<RankCrest rankId={rank.next.rankId} reached={false} />
							<div className="min-w-0">
								<p className="type-body-sm text-ink-3">
									{t('next', { title: rank.next.title })}
								</p>
								<p className="type-data mt-0.5 text-foreground">
									{rank.next.requirements}
								</p>
							</div>
						</>
					) : (
						<p className="type-body-sm text-ink-2">{tRank('highest')}</p>
					)}
					<ChevronRight
						className="ml-auto size-4 shrink-0 text-ink-3 transition-colors group-hover:text-foreground"
						aria-hidden
					/>
					<span className="sr-only">{t('open')}</span>
				</div>
			</Link>
		</section>
	)
}
