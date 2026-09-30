import type { RenaissanceRankProgress } from '@sunsteel/contracts'
import { useLocale } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { Skeleton } from '@/components/ui/skeleton'
import { RankCrest } from '@/features/achievements/rank-crest'
import type { Locale } from '@/i18n/config'
import {
	formatNextRankRequirements,
	formatRankEvidence,
} from '@/lib/utils/achievements'

interface RenaissanceRankProps {
	rank?: RenaissanceRankProgress | null
	isPending: boolean
}

export function RenaissanceRank({ rank, isPending }: RenaissanceRankProps) {
	const locale = useLocale() as Locale
	if (isPending) {
		return (
			<section aria-label="Loading Renaissance rank" className="space-y-4">
				<Skeleton className="h-16" />
				<Skeleton className="h-36" />
			</section>
		)
	}

	if (!rank) return null

	const nextRequirements = formatNextRankRequirements(rank, locale)

	return (
		<section aria-labelledby="renaissance-rank" className="space-y-4">
			<div className="rule-heading pb-4">
				<h2 id="renaissance-rank" className="type-panel text-foreground">
					Renaissance rank
				</h2>
				{/* UX-07: the rule in one line, the definition one tap away. */}
				<Explanation
					className="mt-1"
					summary="Earned through completed sessions and active training weeks, never weight moved."
				>
					<p>An active week has at least one completed session.</p>
				</Explanation>
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
						{formatRankEvidence(rank, locale)}
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
