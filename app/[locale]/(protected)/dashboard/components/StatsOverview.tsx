import { useLocale, useTranslations } from 'next-intl'

import { ClassicalIcon } from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { ClassicalLoader } from '@/components/ui/classical-loader'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import {
	formatWeightAmount,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

import { DashboardSection } from './DashboardSection'
import StatCard from './StatCard'

// FIX-08: these are shared app milestones, not the user's goals. Nothing in
// WorkoutStatsResponse or WorkoutProgressResponse carries a personal target, so
// the copy below must not call them one. PROG-08 (personal goals) supplies real
// per-user values; replace these constants when it lands.
const WEEKLY_MILESTONE = 4
const TOTAL_SESSIONS_MILESTONE = 50

function StatsOverviewBody() {
	const locale = useLocale() as Locale
	const t = useTranslations('planning.dashboardStats')
	const weightUnit = useWeightUnit()
	const { data, isPending, isError, refetch, isFetching } = useWorkoutStats()
	const { data: progress } = useWorkoutProgress()

	// The dashboard page gates the first paint, so this only shows when the stats
	// query restarts later — the week-bounded query key rolls over at midnight
	// on the week boundary. Matches the initial skeleton so nothing reflows.
	if (isPending) {
		return (
			<div className="flex min-h-40 items-center justify-center">
				<ClassicalLoader label={t('loading')} />
			</div>
		)
	}

	if (isError || !data) {
		return (
			<div
				role="alert"
				className="space-y-3 rounded-sm border border-rule bg-surface p-4"
			>
				<p className="type-body-sm text-foreground">{t('loadError')}</p>
				<Button onClick={() => refetch()} disabled={isFetching}>
					{t('retry')}
				</Button>
			</div>
		)
	}

	const {
		weeklyWorkoutsCount,
		activeDaysThisWeek,
		totalCompleted,
		completionRate,
	} = data
	const currentStreak = progress?.currentStreakDays ?? 0
	const bestStreak = progress?.bestStreakDays ?? 0
	const totalVolumeKg = progress?.totalVolumeKg ?? 0
	const displayVolume = kilogramsToDisplayWeight(totalVolumeKg, weightUnit)
	const compactVolume = displayVolume / 1000
	const compactVolumeUnit = weightUnit === 'KG' ? 't' : 'k lb'

	const weeklyWorkoutsProgress = Math.min(
		100,
		Math.round((weeklyWorkoutsCount / WEEKLY_MILESTONE) * 100),
	)
	const activeDaysProgress = Math.min(
		100,
		Math.round((activeDaysThisWeek / 7) * 100),
	)
	const sessionsToMilestone = Math.max(
		0,
		TOTAL_SESSIONS_MILESTONE - totalCompleted,
	)

	return (
		// §10.1 — the stat row is one ruled band, not a card grid. The 1px lines
		// are the container's own ground showing through a `gap-px`, so they run
		// unbroken in both directions and need no per-cell border bookkeeping.
		//
		// The third column arrives at `lg`, not `sm`, and the band never opens to
		// six. Both are the same measured constraint: the numeral rank steps to
		// 52px at 768, where the shell's main column is only 512px wide, so three
		// columns there gave a 170px cell for a value that can need ~196px — the
		// first sweep caught 16px of overflow at exactly that width. Six across at
		// 1440 fails the same way (§10.2 — a value is never clipped to fit a
		// column count).
		<div className="grid grid-cols-2 gap-px border-y border-rule bg-rule-faint lg:grid-cols-3">
			<StatCard
				icon={
					<ClassicalIcon
						name="two-dumbbells"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title={t('weeklyTitle')}
				value={String(weeklyWorkoutsCount)}
				unit={`/ ${WEEKLY_MILESTONE}`}
				subtitle={t('weeklySubtitle')}
				progress={weeklyWorkoutsProgress}
				progressText={t('weeklyProgress', {
					percent: weeklyWorkoutsProgress,
				})}
				additionalText={
					weeklyWorkoutsCount >= WEEKLY_MILESTONE
						? t('milestoneMet')
						: t('active')
				}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="compass"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title={t('activeDaysTitle')}
				value={String(activeDaysThisWeek)}
				unit="/ 7"
				subtitle={t('activeDaysSubtitle')}
				progress={activeDaysProgress}
				progressText={t('activeDaysProgress', { count: activeDaysThisWeek })}
				additionalText={
					activeDaysThisWeek >= 3 ? t('consistent') : t('resting')
				}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="laurel-wreath"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title={t('totalTitle')}
				value={String(totalCompleted)}
				subtitle={t('totalSubtitle')}
				progress={totalCompleted}
				progressMax={Math.max(TOTAL_SESSIONS_MILESTONE, totalCompleted)}
				progressText={t('totalProgress', { count: TOTAL_SESSIONS_MILESTONE })}
				additionalText={
					sessionsToMilestone > 0
						? t('toGo', { count: sessionsToMilestone })
						: t('milestoneMet')
				}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="shield"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title={t('rateTitle')}
				value={`${completionRate}%`}
				subtitle={t('rateSubtitle')}
				progress={completionRate}
				progressText={t('rateProgress')}
				additionalText={completionRate >= 90 ? t('excellent') : t('onTrack')}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="torch"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title={t('streakTitle')}
				value={String(currentStreak)}
				unit={t('streakUnit')}
				subtitle={t('streakSubtitle')}
				progress={currentStreak}
				progressMax={Math.max(bestStreak, currentStreak, 1)}
				progressText={t('streakBest', { count: bestStreak })}
				additionalText={currentStreak > 0 ? t('active') : t('resting')}
			/>
			<StatCard
				icon={
					<ClassicalIcon
						name="bicep-flexing"
						className="h-4 w-4 shrink-0"
						aria-hidden
					/>
				}
				title={t('volumeTitle')}
				value={numberFormatter(locale, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
					useGrouping: false,
				}).format(compactVolume)}
				unit={compactVolumeUnit}
				subtitle={t('volumeSubtitle')}
				progress={compactVolume}
				progressMax={Math.max(100, Math.ceil(compactVolume / 50) * 50)}
				progressText={t('volumeProgress', {
					amount: formatWeightAmount(totalVolumeKg, weightUnit, locale),
					unit: getWeightUnitLabel(weightUnit),
				})}
				additionalText={compactVolume >= 100 ? t('heavy') : t('building')}
			/>
		</div>
	)
}

/** DASH-05: the ruled stat band, as the configurable Training Stats section. */
export default function StatsOverview() {
	return (
		<DashboardSection id="stats" headingHidden>
			<StatsOverviewBody />
		</DashboardSection>
	)
}
