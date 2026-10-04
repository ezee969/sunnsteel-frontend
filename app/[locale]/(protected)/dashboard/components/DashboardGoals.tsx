'use client'

import { RefreshCw, Target } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalSuggestionList } from '@/features/progress/goal-suggestions'
import { GoalRow } from '@/features/progress/personal-goals'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { Locale } from '@/i18n/config'
import { useGoalSuggestions } from '@/lib/api/hooks/useGoalSuggestions'
import { usePersonalGoals } from '@/lib/api/hooks/useWorkoutSession'
import { dashboardGoalsSummary } from '@/lib/utils/goal-suggestions'

import { DashboardSection } from './DashboardSection'

/**
 * DASH-04: the member's goals on the dashboard -- the same reads and numbers
 * Progress shows -- and ACH-06's suggestions while goal slots are free.
 * Nothing here ranks, grades or adds advice; changing a goal stays in
 * Settings.
 */
export default function DashboardGoals() {
	const locale = useLocale() as Locale
	const t = useTranslations('planning.dashboardGoals')
	const tSummaries = useTranslations('planning.dashboardSummaries')
	const tSuggestions = useTranslations('progress.goalSuggestions')
	const weightUnit = useWeightUnit()
	const goals = usePersonalGoals()
	const suggestions = useGoalSuggestions()
	const list = goals.data?.goals ?? []
	const suggested = suggestions.data?.suggestions ?? []

	return (
		<DashboardSection
			id="goals"
			icon={<Target className="h-4 w-4 text-ink-3" aria-hidden />}
			collapsible
			summary={dashboardGoalsSummary(
				goals.data?.goals,
				suggested.length,
				tSummaries,
				locale,
			)}
			action={
				<Link
					href="/settings/training"
					className="type-body-sm text-ink-2 underline-offset-4 hover:underline"
				>
					{t('manage')}
				</Link>
			}
		>
			{goals.isPending ? (
				<div
					role="status"
					aria-label={t('loadingAria')}
					className="space-y-3 py-3"
				>
					<Skeleton className="h-14" />
					<Skeleton className="h-14" />
				</div>
			) : goals.error ? (
				<div role="alert" className="space-y-3 py-3">
					<p className="type-body-sm text-foreground">{t('loadError')}</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => void goals.retry()}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : (
				<div className="space-y-6">
					{list.length ? (
						<ul className="border-t border-rule-faint">
							{list.map(goal => (
								<GoalRow key={goal.id} goal={goal} weightUnit={weightUnit} />
							))}
						</ul>
					) : suggested.length === 0 ? (
						<EmptyModule title={t('emptyTitle')} description={t('emptyBody')} />
					) : null}
					<GoalSuggestionList
						suggestions={suggested}
						weightUnit={weightUnit}
						heading={tSuggestions('heading')}
					/>
				</div>
			)}
		</DashboardSection>
	)
}
