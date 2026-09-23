'use client'

import { Flag, RefreshCw } from 'lucide-react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RankCrest } from '@/features/achievements/rank-crest'
import { useAchievements } from '@/lib/api/hooks/useAchievements'
import {
	buildUpcomingMilestones,
	getUpcomingMilestonesEmptyState,
	type UpcomingMilestone,
} from '@/lib/utils/dashboard-milestones'

function MilestoneRow({ milestone }: { milestone: UpcomingMilestone }) {
	return (
		<li className="rule-row grid gap-2 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
			<div className="flex min-w-0 gap-3">
				{milestone.rankId ? (
					<RankCrest
						rankId={milestone.rankId}
						reached={false}
						className="mt-0.5"
					/>
				) : null}
				<div className="min-w-0">
					<p className="type-body-sm text-ink-3">{milestone.group}</p>
					<h3 className="type-panel mt-0.5 text-foreground">
						{milestone.title}
					</h3>
				</div>
			</div>
			<div className="lg:text-right">
				<p className="type-data text-ink-2">{milestone.evidence}</p>
				<p className="type-body-sm mt-1 text-ink-3">{milestone.detail}</p>
			</div>
		</li>
	)
}

/**
 * DASH-09. The next Renaissance rank and one next milestone per category, in
 * the catalog order `/achievements` uses. Nothing here is ranked by how close
 * it is, carries a deadline or states a percentage — those are the ACH-04
 * rules, and the dashboard does not get its own version of them.
 */
export default function UpcomingMilestones() {
	const { data, isPending, isError, refetch, isFetching } = useAchievements()
	const milestones = buildUpcomingMilestones(data)

	return (
		<section aria-labelledby="upcoming-milestones">
			<h2
				id="upcoming-milestones"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Flag className="h-4 w-4 text-ink-3" aria-hidden />
				Upcoming Milestones
			</h2>
			<div className="pt-1">
				{isPending ? (
					<div
						role="status"
						aria-label="Loading upcoming milestones"
						className="space-y-3 py-3"
					>
						<Skeleton className="h-14" />
						<Skeleton className="h-14" />
					</div>
				) : isError ? (
					<div role="alert" className="space-y-3 py-3">
						<p className="type-body-sm text-foreground">
							Upcoming milestones could not be loaded.
						</p>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => refetch()}
							disabled={isFetching}
						>
							<RefreshCw className="size-4" aria-hidden />
							Try again
						</Button>
					</div>
				) : milestones.length === 0 ? (
					<EmptyModule {...getUpcomingMilestonesEmptyState(data)} />
				) : (
					<ul className="border-t border-rule-faint">
						{milestones.map(milestone => (
							<MilestoneRow key={milestone.key} milestone={milestone} />
						))}
					</ul>
				)}
			</div>
		</section>
	)
}
