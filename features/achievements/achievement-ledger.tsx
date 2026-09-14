import type {
	AchievementsResponse,
	EarnedAchievement,
} from '@sunsteel/contracts'
import { Check, Medal, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	ACHIEVEMENT_CATEGORY_LABELS,
	formatAchievementDate,
	groupAchievements,
} from '@/lib/utils/achievements'

interface AchievementLedgerProps {
	data?: AchievementsResponse
	isPending: boolean
	isError: boolean
	onRetry: () => void
}

function AchievementRow({ achievement }: { achievement: EarnedAchievement }) {
	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="flex min-w-0 gap-3">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-rule bg-surface">
					<Check className="size-4 text-foreground" aria-hidden />
				</span>
				<div className="min-w-0">
					<h4 className="type-panel text-foreground">{achievement.title}</h4>
					<p className="type-body-sm mt-1 text-ink-3">
						{achievement.description}
					</p>
				</div>
			</div>
			<div className="pl-11 sm:pl-0 sm:text-right">
				<p className="type-body-sm text-ink-3">
					{achievement.backfilled
						? 'Recognized from history'
						: `Earned ${formatAchievementDate(achievement.unlockedAt)}`}
				</p>
				{achievement.sourceSessionId ? (
					<Link
						href={`/workouts/history/${achievement.sourceSessionId}`}
						className="type-body-sm mt-1 inline-block text-primary underline-offset-4 hover:underline"
					>
						View session
					</Link>
				) : null}
			</div>
		</li>
	)
}

export function AchievementLedger({
	data,
	isPending,
	isError,
	onRetry,
}: AchievementLedgerProps) {
	const groups = groupAchievements(data?.achievements ?? [])

	return (
		<section aria-labelledby="earned-achievements" className="space-y-4">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-3 pb-4">
				<div>
					<h2 id="earned-achievements" className="type-section text-foreground">
						Earned milestones
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Verified from completed training, never manual claims.
					</p>
				</div>
				{data ? (
					<p className="type-data text-ink-2">
						{data.earnedCount} / {data.availableCount}
					</p>
				) : null}
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label="Loading achievements">
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">
						Achievements are unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not verify your milestones. Try again.
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						Retry
					</Button>
				</div>
			) : !data?.analyticsReady ? (
				<div role="status" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">
						Training history is preparing
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						Milestones will appear when your progress data is ready.
					</p>
				</div>
			) : groups.length === 0 ? (
				<EmptyModule
					title="Your first milestone is ahead"
					description="Complete a workout to begin earning verified session, set, volume, record, and streak milestones."
					action={{
						kind: 'link',
						label: 'Choose a workout',
						href: '/workouts',
					}}
				/>
			) : (
				<div className="space-y-8">
					{groups.map(group => (
						<section
							key={group.category}
							aria-labelledby={`achievement-${group.category}`}
						>
							<div className="flex items-center gap-2 border-b border-rule pb-2">
								<Medal className="size-4 text-ink-3" aria-hidden />
								<h3
									id={`achievement-${group.category}`}
									className="type-panel text-foreground"
								>
									{ACHIEVEMENT_CATEGORY_LABELS[group.category]}
								</h3>
							</div>
							<ul>
								{group.items.map(achievement => (
									<AchievementRow
										key={achievement.eventId}
										achievement={achievement}
									/>
								))}
							</ul>
						</section>
					))}
				</div>
			)}
		</section>
	)
}
