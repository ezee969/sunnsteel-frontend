import { useTranslations } from 'next-intl'

import { RoutineTotals } from '../utils/routine-summary'

interface RoutineSummaryStatsProps {
	totals: RoutineTotals
}

/**
 * Renders a compact summary card showing routine totals: training days, exercises, and sets.
 *
 * @param totals - Object with numeric totals to display; expects `trainingDays`, `totalExercises`, and `totalSets`.
 * @returns A JSX element containing the styled routine summary card.
 */
export function RoutineSummaryStats({ totals }: RoutineSummaryStatsProps) {
	const t = useTranslations('routines.builder')
	return (
		<div className="border-y border-rule py-4">
			<h3 className="type-panel mb-3 text-center text-foreground">
				{t('routineSummary')}
			</h3>
			<div className="flex justify-around text-center">
				<div>
					<p className="text-xl font-bold text-primary">
						{totals.trainingDays}
					</p>
					<p className="text-xs text-ink-3">{t('statDays')}</p>
				</div>
				<div>
					<p className="text-xl font-bold text-primary">
						{totals.totalExercises}
					</p>
					<p className="text-xs text-ink-3">{t('statExercises')}</p>
				</div>
				<div>
					<p className="text-xl font-bold text-primary">{totals.totalSets}</p>
					<p className="text-xs text-ink-3">{t('statSets')}</p>
				</div>
			</div>
		</div>
	)
}
