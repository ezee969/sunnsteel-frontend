'use client'

import HeroSection from '@/components/layout/HeroSection'
import { AchievementLedger } from '@/features/achievements/achievement-ledger'
import { MilestoneProgress } from '@/features/achievements/milestone-progress'
import { RenaissanceRank } from '@/features/achievements/renaissance-rank'
import { useAchievements } from '@/lib/api/hooks/useAchievements'

export default function AchievementsPage() {
	const achievements = useAchievements()

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Achievements</>}
				subtitle={
					<>
						A record of training milestones verified from your completed work.
					</>
				}
			/>
			<RenaissanceRank
				rank={achievements.data?.rank}
				isPending={achievements.isPending}
			/>
			<MilestoneProgress
				data={achievements.data}
				isPending={achievements.isPending}
			/>
			<AchievementLedger
				data={achievements.data}
				isPending={achievements.isPending}
				isError={achievements.isError}
				onRetry={() => void achievements.refetch()}
			/>
		</div>
	)
}
