'use client'

import { useTranslations } from 'next-intl'

import HeroSection from '@/components/layout/HeroSection'
import { AchievementLedger } from '@/features/achievements/achievement-ledger'
import { ComebackRecognition } from '@/features/achievements/comeback-recognition'
import { MilestoneProgress } from '@/features/achievements/milestone-progress'
import { RenaissanceRank } from '@/features/achievements/renaissance-rank'
import { useAchievements } from '@/lib/api/hooks/useAchievements'

export default function AchievementsPage() {
	const t = useTranslations('achievements.page')
	const achievements = useAchievements()

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />
			<RenaissanceRank
				rank={achievements.data?.rank}
				isPending={achievements.isPending}
			/>
			<ComebackRecognition
				data={achievements.data?.comeback}
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
