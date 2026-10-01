'use client'

import { Flag, RefreshCw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import { useAchievements } from '@/lib/api/hooks/useAchievements'
import {
	buildUpcomingMilestones,
	getUpcomingMilestonesEmptyState,
	type UpcomingMilestone,
} from '@/lib/utils/dashboard-milestones'
import { upcomingMilestonesSummary } from '@/lib/utils/dashboard-summaries'

import { DashboardSection } from './DashboardSection'

function MilestoneRow({ milestone }: { milestone: UpcomingMilestone }) {
	return (
		<li className="rule-row grid gap-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
			<div className="min-w-0">
				<p className="type-body-sm text-ink-3">{milestone.group}</p>
				<h3 className="type-panel mt-0.5 text-foreground">{milestone.title}</h3>
			</div>
			<div className="lg:text-right">
				<p className="type-data text-ink-2">{milestone.evidence}</p>
				<p className="type-body-sm mt-1 text-ink-3">{milestone.detail}</p>
			</div>
		</li>
	)
}

/**
 * DASH-09. One next milestone per category, in the catalog order `/achievements` uses. Nothing here is ranked by how close
 * it is, carries a deadline or states a percentage — those are the ACH-04
 * rules, and the dashboard does not get its own version of them.
 */
export default function UpcomingMilestones() {
	const locale = useLocale() as Locale
	const tSummaries = useTranslations('planning.dashboardSummaries')
	const t = useTranslations('planning.dashboardMilestones')
	const tCategories = useTranslations('achievements.categories')
	const tProgress = useTranslations('achievements.progress')
	const tCatalogAchievements = useTranslations('catalog.achievements')
	const { data, isPending, isError, refetch, isFetching } = useAchievements()
	const milestones = buildUpcomingMilestones(
		locale,
		{
			categories: tCategories,
			progress: tProgress,
			catalogAchievements: tCatalogAchievements,
		},
		data,
	)

	return (
		<DashboardSection
			id="upcoming-milestones"
			icon={<Flag className="h-4 w-4 text-ink-3" aria-hidden />}
			collapsible
			summary={upcomingMilestonesSummary(milestones, tSummaries)}
		>
			{isPending ? (
				<div
					role="status"
					aria-label={t('loadingAria')}
					className="space-y-3 py-3"
				>
					<Skeleton className="h-14" />
					<Skeleton className="h-14" />
				</div>
			) : isError ? (
				<div role="alert" className="space-y-3 py-3">
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
			) : milestones.length === 0 ? (
				<EmptyModule {...getUpcomingMilestonesEmptyState(t, data)} />
			) : (
				<ul className="border-t border-rule-faint">
					{milestones.map(milestone => (
						<MilestoneRow key={milestone.key} milestone={milestone} />
					))}
				</ul>
			)}
		</DashboardSection>
	)
}
