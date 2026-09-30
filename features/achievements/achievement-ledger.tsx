import type {
	AchievementsResponse,
	EarnedAchievement,
} from '@sunsteel/contracts'
import { Check, Medal, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { CollapsibleSection } from '@/components/layout/collapsible-section'
import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import {
	achievementCategoryLabel,
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
	const locale = useLocale() as Locale
	const t = useTranslations('achievements.ledger')
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
						? t('fromHistory')
						: t('earnedOn', {
								date: formatAchievementDate(achievement.unlockedAt, locale),
							})}
				</p>
				{achievement.sourceSessionId ? (
					<Link
						href={`/workouts/history/${achievement.sourceSessionId}`}
						className="type-body-sm mt-1 inline-block text-primary underline-offset-4 hover:underline"
					>
						{t('viewSession')}
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
	const t = useTranslations('achievements.ledger')
	const tCategories = useTranslations('achievements.categories')
	const groups = groupAchievements(data?.achievements ?? [])

	return (
		<section aria-labelledby="earned-achievements" className="space-y-4">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-3 pb-4">
				<div>
					<h2 id="earned-achievements" className="type-section text-foreground">
						{t('title')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">{t('subtitle')}</p>
				</div>
				{data ? (
					<p className="type-data text-ink-2">
						{data.earnedCount} / {data.availableCount}
					</p>
				) : null}
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label={t('loadingAria')}>
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">{t('errorTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : !data?.analyticsReady ? (
				<div role="status" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">{t('preparingTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('preparingBody')}</p>
				</div>
			) : groups.length === 0 ? (
				<EmptyModule
					title={t('emptyTitle')}
					description={t('emptyDescription')}
					action={{
						kind: 'link',
						label: t('emptyAction'),
						href: '/workouts',
					}}
				/>
			) : (
				// UX-07: each category closes to its heading and its count, closed
				// below `md` until the member opens it (design system §20.1).
				<div className="space-y-6">
					{groups.map(group => (
						<CollapsibleSection
							key={group.category}
							id={`achievement-${group.category}`}
							headingLevel="h3"
							headingClassName="type-panel"
							divider="single"
							defaultOpen="wide"
							icon={<Medal className="size-4 text-ink-3" aria-hidden />}
							title={
								<>
									{achievementCategoryLabel(group.category, tCategories)}
									<span className="text-ink-3">
										{' '}
										· {t('earnedCount', { count: group.items.length })}
									</span>
								</>
							}
							// Items arrive highest threshold first.
							summary={t('highest', { title: group.items[0].title })}
						>
							<ul>
								{group.items.map(achievement => (
									<AchievementRow
										key={achievement.eventId}
										achievement={achievement}
									/>
								))}
							</ul>
						</CollapsibleSection>
					))}
				</div>
			)}
		</section>
	)
}
