import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ClassicalLoader } from '@/components/ui/classical-loader'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import {
	useWorkoutProgress,
	useWorkoutStats,
} from '@/lib/api/hooks/useWorkoutSession'
import { cn } from '@/lib/utils'
import { kilogramsToDisplayWeight } from '@/lib/utils/weight-unit'

import { DashboardSection } from './DashboardSection'

/**
 * DASH-06 (design system §25.2): one row of the account's lifetime numbers,
 * each a label, a numeral and one line saying what it counts. The week is
 * This Week's to state (§11.8), milestones are Upcoming Milestones', and
 * nothing here grades the member: no bar, no "Heavy", no "On track".
 */
function Stat({
	label,
	value,
	unit,
	detail,
	className,
}: {
	label: string
	value: string
	unit?: string
	detail: string
	className?: string
}) {
	return (
		<div
			className={cn(
				'flex min-w-0 flex-col gap-1.5 border-l border-rule-faint px-3 py-4 first:border-l-0 first:pl-0 sm:px-4',
				className,
			)}
		>
			<dt className="type-label text-ink-3">{label}</dt>
			<dd className="flex flex-wrap items-baseline gap-x-1">
				<span className="type-numeral text-foreground">{value}</span>
				{unit ? <span className="type-data text-ink-3">{unit}</span> : null}
			</dd>
			<dd className="type-body-sm text-ink-3">{detail}</dd>
		</div>
	)
}

function StatsOverviewBody() {
	const locale = useLocale() as Locale
	const t = useTranslations('planning.dashboardStats')
	const weightUnit = useWeightUnit()
	const { data, isPending, isError, refetch, isFetching } = useWorkoutStats()
	const { data: progress } = useWorkoutProgress()

	// The dashboard page gates the first paint, so this only shows when the stats
	// query restarts later — the week-bounded query key rolls over at midnight
	// on the week boundary.
	if (isPending) {
		return (
			<div className="flex min-h-24 items-center justify-center">
				<ClassicalLoader label={t('loading')} />
			</div>
		)
	}

	if (isError || !data) {
		return (
			<div role="alert" className="space-y-3 py-4">
				<p className="type-body-sm text-foreground">{t('loadError')}</p>
				<Button onClick={() => refetch()} disabled={isFetching}>
					{t('retry')}
				</Button>
			</div>
		)
	}

	const integer = numberFormatter(locale, { maximumFractionDigits: 0 })
	const currentStreak = progress?.currentStreakDays ?? 0
	const bestStreak = progress?.bestStreakDays ?? 0
	// Lifetime volume in tonnes (or thousands of pounds), grouped and whole
	// once it passes 100, so it never reads as "150603.0".
	const thousands =
		kilogramsToDisplayWeight(progress?.totalVolumeKg ?? 0, weightUnit) / 1000
	const volume = numberFormatter(locale, {
		maximumFractionDigits: thousands >= 100 ? 0 : 1,
	}).format(thousands)
	const volumeUnit = weightUnit === 'KG' ? 't' : 'k lb'

	return (
		<>
			{/* One ruled band: rules above and below, a hairline between
			    numbers, no box around each. Three across until `xl`; the volume
			    joins the row there, where the shell leaves the column room for
			    its numeral and unit (at 1024 the unit dropped a line), and is a
			    line under the row before that. Each cell draws its own left
			    hairline: `divide-x` counted the hidden volume cell as the last
			    child and ruled the end of the row. */}
			<dl className="grid grid-cols-3 border-y border-rule xl:grid-cols-4">
				<Stat
					label={t('workoutsLabel')}
					value={integer.format(data.totalCompleted)}
					detail={t('workoutsDetail')}
				/>
				<Stat
					label={t('streakLabel')}
					value={integer.format(currentStreak)}
					unit={t('streakUnit', { count: currentStreak })}
					detail={t('streakDetail', { count: bestStreak })}
				/>
				<Stat
					label={t('rateLabel')}
					value={`${integer.format(data.completionRate)}%`}
					detail={t('rateDetail')}
				/>
				<Stat
					label={t('volumeLabel')}
					value={volume}
					unit={volumeUnit}
					detail={t('volumeDetail')}
					className="hidden xl:flex"
				/>
			</dl>
			<p className="type-body-sm pt-2 text-ink-3 xl:hidden">
				{t('volumeLine', { amount: volume, unit: volumeUnit })}
			</p>
		</>
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
