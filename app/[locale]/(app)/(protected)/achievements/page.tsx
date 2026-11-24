'use client'

import { useTranslations } from 'next-intl'

import HeroSection from '@/components/layout/HeroSection'
import { InlineError } from '@/components/layout/inline-error'
import { AchievementLedger } from '@/features/achievements/achievement-ledger'
import { ComebackRecognition } from '@/features/achievements/comeback-recognition'
import { MilestoneProgress } from '@/features/achievements/milestone-progress'
import { RenaissanceRank } from '@/features/achievements/renaissance-rank'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useAchievements } from '@/lib/api/hooks/useAchievements'

export default function AchievementsPage() {
	const t = useTranslations('achievements.page')
	const achievements = useAchievements()
	const errorText = useApiErrorMessage()
	// UX-26: the rank, comebacks, milestones and ledger all come from this one
	// read. When it fails the page says so once; the first three used to
	// render nothing, so the page looked like an account with nothing earned.
	const failed = achievements.isError && !achievements.data

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />
			{failed ? (
				<InlineError
					title={t('errorTitle')}
					message={errorText(achievements.error)}
					onRetry={() => void achievements.refetch()}
				/>
			) : (
				<>
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
				</>
			)}
		</div>
	)
}
