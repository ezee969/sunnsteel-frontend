'use client'

import { useSidebar } from '@/hooks/use-sidebar'

import { CommonSplitCard } from './components/CommonSplitCard'
import { SelectedDaysSummary } from './components/SelectedDaysSummary'
import { TrainingDayButton } from './components/TrainingDayButton'
import {
	COMMON_SPLITS,
	DAYS_OF_WEEK,
	isSameTrainingSplit,
} from './constants/training-days'
import { useTrainingDaySelection } from './hooks/useTrainingDaySelection'
import type { RoutineWizardData } from './types'

interface TrainingDaysProps {
	readonly data: RoutineWizardData
	readonly onUpdate: (updates: Partial<RoutineWizardData>) => void
	readonly isEditing?: boolean
}

export function TrainingDays({ data, onUpdate }: TrainingDaysProps) {
	const { isMobile } = useSidebar()
	const { toggleDay, selectSplit } = useTrainingDaySelection({
		data,
		onUpdate,
	})
	return (
		<div className="space-y-4 md:space-y-6">
			<div>
				<h3 className="type-section mb-3 text-foreground md:mb-4">
					Which days will you train?
					<span className="text-destructive ml-1">*</span>
				</h3>
				<div className="mb-3 md:mb-4">
					<p className="text-xs text-muted-foreground mb-1.5 md:mb-2">
						Quick select common splits:
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2">
						{COMMON_SPLITS.map(split => (
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
						{DAYS_OF_WEEK.map(day => (
							<TrainingDayButton
								key={day.id}
								day={day}
								isSelected={data.trainingDays.includes(day.id)}
								isLocked={false}
								isMobile={isMobile}
								onToggle={toggleDay}
							/>
						))}
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
