import type {
	AchievementCategoryProgress,
	AchievementsResponse,
} from '@sunsteel/contracts'
import { Check, Flag } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import {
	achievementCategoryLabel,
	formatMilestoneProgressDetail,
	formatMilestoneProgressEvidence,
	orderMilestoneProgress,
} from '@/lib/utils/achievements'

interface MilestoneProgressProps {
	data?: AchievementsResponse
	isPending: boolean
}

function MilestoneProgressRow({
	progress,
}: {
	progress: AchievementCategoryProgress
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('achievements.milestones')
	const tCategories = useTranslations('achievements.categories')
	const tProgress = useTranslations('achievements.progress')
	const isComplete = progress.nextMilestone === null

	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-2 sm:items-center">
			<div className="flex min-w-0 gap-3">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					{isComplete ? (
						<Check className="size-4 text-success-strong" aria-hidden />
					) : (
						<Flag className="size-4 text-ink-3" aria-hidden />
					)}
				</span>
				<div className="min-w-0">
					<p className="type-body-sm text-ink-3">
						{achievementCategoryLabel(progress.category, tCategories)}
					</p>
					<h3 className="type-panel mt-1 text-foreground">
						{progress.nextMilestone?.title ?? t('allRecorded')}
					</h3>
				</div>
			</div>
			<div className="pl-11 sm:max-w-md sm:pl-0 sm:text-right">
				<p className="type-data text-foreground">
					{formatMilestoneProgressEvidence(progress, locale, tProgress)}
				</p>
				<p className="type-body-sm mt-1 text-ink-3">
					{formatMilestoneProgressDetail(progress, locale, tProgress)}
				</p>
			</div>
		</li>
	)
}

export function MilestoneProgress({ data, isPending }: MilestoneProgressProps) {
	const t = useTranslations('achievements.milestones')
	if (isPending) {
		return (
			<section aria-label={t('loadingAria')} className="space-y-4">
				<Skeleton className="h-16" />
				<Skeleton className="h-44" />
			</section>
		)
	}

	const milestoneProgress = data?.milestoneProgress
	if (!data?.analyticsReady || !milestoneProgress?.length) return null

	const progress = orderMilestoneProgress(milestoneProgress)

	return (
		<section aria-labelledby="next-milestones" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="next-milestones" className="type-panel text-foreground">
					{t('title')}
				</h2>
				{/* UX-07: the safety guidance stays in view (ACH-04, design system
				    §20.1); only how the list is ordered moves behind the control. */}
				<Explanation className="mt-1" summary={t('summary')}>
					<p>{t('explanation')}</p>
				</Explanation>
			</div>

			<ul className="border-y border-rule">
				{progress.map(item => (
					<MilestoneProgressRow key={item.category} progress={item} />
				))}
			</ul>
		</section>
	)
}
