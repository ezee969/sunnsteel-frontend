import type { RenaissanceRankProgress } from '@sunsteel/contracts'

import { Skeleton } from '@/components/ui/skeleton'
import { RankCrest } from '@/features/achievements/rank-crest'
import {
	formatNextRankRequirements,
	formatRankEvidence,
} from '@/lib/utils/achievements'

interface RenaissanceRankProps {
	rank?: RenaissanceRankProgress | null
	isPending: boolean
}

export function RenaissanceRank({ rank, isPending }: RenaissanceRankProps) {
	if (isPending) {
		return (
			<section aria-label="Loading Renaissance rank" className="space-y-4">
				<Skeleton className="h-16" />
				<Skeleton className="h-36" />
			</section>
		)
	}

	if (!rank) return null

	const nextRequirements = formatNextRankRequirements(rank)

	return (
		<section aria-labelledby="renaissance-rank" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="renaissance-rank" className="type-panel text-foreground">
					Renaissance rank
				</h2>
				<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
					Earned through completed sessions and active training weeks, never
					weight moved. An active week has at least one completed session.
				</p>
			</div>

			<div className="grid border-y border-rule lg:grid-cols-2">
				<div className="border-b border-rule py-4 lg:border-r lg:border-b-0 lg:pr-6">
					<p className="type-label text-ink-3">Current rank</p>
					<div className="mt-2 flex items-center gap-3">
						<RankCrest rankId={rank.currentRank.id} className="size-10" />
						<h3 className="type-panel text-foreground">
							{rank.currentRank.title}
						</h3>
					</div>
					<p className="type-body-sm mt-2 text-ink-2">
						{rank.currentRank.description}
					</p>
					<p className="type-data mt-3 text-foreground">
						{formatRankEvidence(rank)}
					</p>
				</div>

				<div className="py-4 lg:pl-6">
					{rank.nextRank && nextRequirements ? (
						<>
							<p className="type-label text-ink-3">Next rank</p>
							<div className="mt-2 flex items-center gap-3">
								<RankCrest
									rankId={rank.nextRank.id}
									reached={false}
									className="size-10"
								/>
								<h3 className="type-panel text-foreground">
									{rank.nextRank.title}
								</h3>
							</div>
							<p className="type-body-sm mt-2 text-ink-2">
								{rank.nextRank.description}
							</p>
							<p className="type-data mt-3 text-foreground">
								{nextRequirements}
							</p>
						</>
					) : (
						<>
							<p className="type-label text-ink-3">Rank ladder</p>
							<h3 className="type-panel mt-2 text-foreground">
								Highest rank reached
							</h3>
							<p className="type-body-sm mt-2 text-ink-2">
								Your participation has completed the Renaissance rank path.
							</p>
						</>
					)}
				</div>
			</div>
		</section>
	)
}
