import type { FeaturedProfileItem, WeightUnit } from '@sunsteel/contracts'
import { Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { RankCrest } from '@/features/achievements/rank-crest'
import { achievementText, exerciseLabel, rankText } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { formatTimeAgo } from '@/lib/utils/date'
import { describeRoutineSummary } from '@/lib/utils/routine-sharing'
import { formatWeight } from '@/lib/utils/weight-unit'

interface FeaturedAccomplishmentsProps {
	items: FeaturedProfileItem[]
	weightUnit: WeightUnit
	isOwnProfile: boolean
	/**
	 * PROF-08: where a featured routine opens, when it can be opened at all.
	 * The signed-out profile passes nothing, because reading one needs an
	 * account — the row still states what the routine is.
	 */
	routineHref?: (routineId: string) => string
}

export function FeaturedAccomplishments({
	items,
	weightUnit,
	isOwnProfile,
	routineHref,
}: FeaturedAccomplishmentsProps) {
	const locale = useLocale() as Locale
	const tExercises = useTranslations('catalog.exercises')
	const tAchievements = useTranslations('catalog.achievements')
	const tRanks = useTranslations('catalog.ranks')
	const tSharing = useTranslations('routines.sharing')
	const t = useTranslations('social.profile')
	if (!items.length && !isOwnProfile) return null

	return (
		<section aria-labelledby="featured-accomplishments">
			<h2
				id="featured-accomplishments"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<Bookmark className="size-4 text-ink-3" aria-hidden /> {t('featured')}
			</h2>
			{items.length ? (
				<div className="pt-1">
					{items.map(item => (
						<div
							key={`${item.kind}:${item.referenceId}`}
							className="rule-row grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
						>
							<div className="flex min-w-0 gap-3">
								{item.kind === 'RANK' ? (
									<RankCrest rankId={item.rank.id} className="mt-0.5" />
								) : null}
								<div className="min-w-0">
									<p className="type-body-sm text-ink-3">
										{item.kind === 'RECORD'
											? t('kindRecord')
											: item.kind === 'ACHIEVEMENT'
												? t('kindAchievement')
												: item.kind === 'ROUTINE'
													? t('kindRoutine')
													: t('kindRank')}
									</p>
									<h3 className="type-panel text-foreground">
										{item.kind === 'RECORD' ? (
											exerciseLabel(item.record.exerciseName, tExercises)
										) : item.kind === 'ACHIEVEMENT' ? (
											achievementText(item.achievement, tAchievements).title
										) : item.kind === 'ROUTINE' ? (
											routineHref ? (
												<Link
													href={routineHref(item.referenceId)}
													className="underline-offset-4 hover:underline"
												>
													{item.routine.name}
												</Link>
											) : (
												item.routine.name
											)
										) : (
											rankText(item.rank, tRanks).title
										)}
									</h3>
									<p className="type-body-sm text-ink-2">
										{item.kind === 'RECORD'
											? t.rich('recordLine', {
													weight: formatWeight(
														item.record.weight,
														weightUnit,
														locale,
													),
													reps: item.record.reps,
													e1rm: formatWeight(
														item.record.estimated1rm,
														weightUnit,
														locale,
													),
													data: chunks => (
														<span className="type-data">{chunks}</span>
													),
												})
											: item.kind === 'ACHIEVEMENT'
												? achievementText(item.achievement, tAchievements)
														.description
												: item.kind === 'ROUTINE'
													? describeRoutineSummary(item.routine, tSharing)
													: rankText(item.rank, tRanks).description}
									</p>
								</div>
							</div>
							{item.kind === 'RECORD' ? (
								<span className="type-body-sm whitespace-nowrap text-ink-3">
									{formatTimeAgo(item.record.achievedAt, locale)}
								</span>
							) : item.kind === 'ACHIEVEMENT' ? (
								<span className="type-body-sm whitespace-nowrap text-ink-3">
									{item.achievement.backfilled
										? t('recognizedFromHistory')
										: formatTimeAgo(item.achievement.unlockedAt, locale)}
								</span>
							) : null}
						</div>
					))}
				</div>
			) : (
				<p className="type-body-sm py-3 text-ink-3">
					{t.rich('featuredEmpty', {
						link: chunks => (
							<Link
								href="/settings"
								className="text-primary underline-offset-4 hover:underline"
							>
								{chunks}
							</Link>
						),
					})}
				</p>
			)}
		</section>
	)
}
