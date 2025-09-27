'use client'

import type { TrainingDayInfo } from '../constants/training-days'

interface WeekdayConsistencyHintProps {
	readonly programStartDate: string | undefined
	readonly trainingDays: number[]
	readonly dayInfos: readonly TrainingDayInfo[]
	readonly className?: string
}

export const WeekdayConsistencyHint = ({
	programStartDate,
	trainingDays,
	dayInfos,
	className,
}: WeekdayConsistencyHintProps) => {
	if (!programStartDate || trainingDays.length === 0) {
		return null
	}

	const start = new Date(`${programStartDate}T00:00:00`)
	const startWeekday = start.getDay()
	const firstTraining = [...trainingDays].sort((a, b) => a - b)[0]
	const ok = startWeekday === firstTraining
	const weekdayName = dayInfos[startWeekday]?.name ?? ''
	const firstName = dayInfos[firstTraining]?.name ?? ''

	return (
		<p className={`text-xs ${ok ? 'text-muted-foreground' : 'text-destructive'} ${className ?? ''}`}>
			{ok
				? `Start date falls on your first training day (${firstName}).`
				: `Warning: start date is ${weekdayName}, which does not match your first training day (${firstName}).`}
		</p>
	)
}
