import type { FeaturedProfileItem, WeightUnit } from '@sunsteel/contracts'
import { Bookmark } from 'lucide-react'
import Link from 'next/link'

import { formatTimeAgo } from '@/lib/utils/date'
import { formatWeight } from '@/lib/utils/weight-unit'

interface FeaturedAccomplishmentsProps {
	items: FeaturedProfileItem[]
	weightUnit: WeightUnit
	isOwnProfile: boolean
}

export function FeaturedAccomplishments({
	items,
	weightUnit,
	isOwnProfile,
}: FeaturedAccomplishmentsProps) {
	if (!items.length && !isOwnProfile) return null

	return (
		<section aria-labelledby="featured-accomplishments">
			<h2
				id="featured-accomplishments"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Bookmark className="size-4 text-ink-3" aria-hidden /> Featured
				Accomplishments
			</h2>
			{items.length ? (
				<div className="pt-1">
					{items.map(item => (
						<div
							key={`${item.kind}:${item.referenceId}`}
							className="rule-row grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
						>
							<div className="min-w-0">
								<p className="type-body-sm text-ink-3">
									{item.kind === 'RECORD'
										? 'Personal record'
										: item.kind === 'ACHIEVEMENT'
											? 'Achievement'
											: 'Renaissance rank'}
								</p>
								<h3 className="type-panel text-foreground">
									{item.kind === 'RECORD'
										? item.record.exerciseName
										: item.kind === 'ACHIEVEMENT'
											? item.achievement.title
											: item.rank.title}
								</h3>
								<p className="type-body-sm text-ink-2">
									{item.kind === 'RECORD' ? (
										<>
											<span className="type-data">
												{formatWeight(item.record.weight, weightUnit)}
											</span>{' '}
											for {item.record.reps} reps · est. 1RM{' '}
											<span className="type-data">
												{formatWeight(item.record.estimated1rm, weightUnit)}
											</span>
										</>
									) : item.kind === 'ACHIEVEMENT' ? (
										item.achievement.description
									) : (
										item.rank.description
									)}
								</p>
							</div>
							{item.kind === 'RECORD' ? (
								<span className="type-body-sm whitespace-nowrap text-ink-3">
									{formatTimeAgo(item.record.achievedAt)}
								</span>
							) : item.kind === 'ACHIEVEMENT' ? (
								<span className="type-body-sm whitespace-nowrap text-ink-3">
									{item.achievement.backfilled
										? 'Recognized from history'
										: formatTimeAgo(item.achievement.unlockedAt)}
								</span>
							) : null}
						</div>
					))}
				</div>
			) : (
				<p className="type-body-sm py-3 text-ink-3">
					Choose current records in{' '}
					<Link
						href="/settings"
						className="text-primary underline-offset-4 hover:underline"
					>
						Settings
					</Link>{' '}
					to build this profile ledger.
				</p>
			)}
		</section>
	)
}
