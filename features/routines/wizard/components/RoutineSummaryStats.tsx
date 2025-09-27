import { RoutineTotals } from '../utils/routine-summary'

interface RoutineSummaryStatsProps {
	totals: RoutineTotals
}

export function RoutineSummaryStats({ totals }: RoutineSummaryStatsProps) {
	return (
		<div className="rounded-lg border bg-card text-card-foreground p-4">
			<h3 className="text-base font-semibold leading-none tracking-tight mb-3 text-center">
				Routine Summary
			</h3>
			<div className="flex justify-around text-center">
				<div>
					<p className="text-xl font-bold text-primary">{totals.trainingDays}</p>
					<p className="text-xs text-muted-foreground">Days</p>
				</div>
				<div>
					<p className="text-xl font-bold text-primary">{totals.totalExercises}</p>
					<p className="text-xs text-muted-foreground">Exercises</p>
				</div>
				<div>
					<p className="text-xl font-bold text-primary">{totals.totalSets}</p>
					<p className="text-xs text-muted-foreground">Sets</p>
				</div>
			</div>
		</div>
	)
}
