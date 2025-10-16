'use client'

import { useSidebar } from '@/hooks/use-sidebar'
import { format } from 'date-fns'
import { CommonSplitCard } from './components/CommonSplitCard'
import { TrainingDayButton } from './components/TrainingDayButton'
import { SelectedDaysSummary } from './components/SelectedDaysSummary'
import {
	COMMON_SPLITS,
	DAYS_OF_WEEK,
	isSameTrainingSplit,
} from './constants/training-days'
import { useProgramStartDay } from './hooks/useProgramStartDay'
import { useTrainingDaySelection } from './hooks/useTrainingDaySelection'
import type { RoutineWizardData } from './types'

interface TrainingDaysProps {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
	readonly isEditing?: boolean
}

export function TrainingDays({
	data,
	onUpdate,
	isEditing = false,
}: TrainingDaysProps) {
	const { isMobile } = useSidebar()
	const programStartWeekday = useProgramStartDay({ data, onUpdate })
	const { toggleDay, selectSplit } = useTrainingDaySelection({
		data,
		onUpdate,
		programStartWeekday,
	})

	
	const totalWeeks = (data.programWithDeloads ? 21 : 18) as 18 | 21

	return (
		<div className="space-y-4 md:space-y-6">
			{data.programStartDate && programStartWeekday !== null && (
				<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
							<span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
								i
							</span>
						</div>
						<div className="flex-1">
							<p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
								Program Start Day Selected
							</p>
							<p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
								Your program starts on
								{` ${format(
									new Date(`${data.programStartDate}T00:00:00`),
									'EEEE, MMMM d, yyyy',
								)}.`}
								 This day (
								{DAYS_OF_WEEK[programStartWeekday]?.name}
								) has been automatically selected and cannot be deselected.
							</p>
						</div>
					</div>
				</div>
			)}

			<div>
				<h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">
					Which days will you train?
					<span className="text-destructive ml-1">*</span>
				</h3>
				<div className="mb-3 md:mb-4">
					<p className="text-xs text-muted-foreground mb-1.5 md:mb-2">
						Quick select common splits:
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2">
						{COMMON_SPLITS.map((split) => (
							<CommonSplitCard
								key={split.name}
								split={split}
								isSelected={isSameTrainingSplit(data.trainingDays, split.days)}
								isMobile={isMobile}
								onSelect={() => selectSplit(split.days)}
							/>
						))}
					</div>
				</div>
				<div>
					<p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
						Or select days manually:
					</p>
					<div className="grid grid-cols-7 gap-1 md:gap-2">
						{DAYS_OF_WEEK.map((day) => {
							const isLocked =
								programStartWeekday !== null && day.id === programStartWeekday
							return (
								<TrainingDayButton
									key={day.id}
									day={day}
									isSelected={data.trainingDays.includes(day.id)}
									isLocked={isLocked}
									isMobile={isMobile}
									onToggle={toggleDay}
								/>
							)
						})}
					</div>
				</div>
			</div>

			<SelectedDaysSummary
				trainingDays={data.trainingDays}
				dayInfos={DAYS_OF_WEEK}
			/>
		</div>
	)
}
