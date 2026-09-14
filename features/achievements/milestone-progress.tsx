import type {
	AchievementCategoryProgress,
	AchievementsResponse,
} from '@sunsteel/contracts'
import { Check, Flag } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import {
	ACHIEVEMENT_CATEGORY_LABELS,
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
						{ACHIEVEMENT_CATEGORY_LABELS[progress.category]}
					</p>
					<h3 className="type-panel mt-1 text-foreground">
						{progress.nextMilestone?.title ?? 'All milestones recorded'}
					</h3>
				</div>
			</div>
			<div className="pl-11 sm:max-w-md sm:pl-0 sm:text-right">
				<p className="type-data text-foreground">
					{formatMilestoneProgressEvidence(progress)}
				</p>
				<p className="type-body-sm mt-1 text-ink-3">
					{formatMilestoneProgressDetail(progress)}
				</p>
			</div>
		</li>
	)
}

export function MilestoneProgress({ data, isPending }: MilestoneProgressProps) {
	if (isPending) {
		return (
			<section aria-label="Loading milestone progress" className="space-y-4">
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
					Next milestones
				</h2>
				<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
					One fixed next milestone in each category, with no deadline.
					Categories stay in a stable order, not ranked by what is closest.
					Follow your plan, use appropriate loads, and keep recovery days.
				</p>
			</div>

			<ul className="border-y border-rule">
				{progress.map(item => (
					<MilestoneProgressRow key={item.category} progress={item} />
				))}
			</ul>
		</section>
	)
}
