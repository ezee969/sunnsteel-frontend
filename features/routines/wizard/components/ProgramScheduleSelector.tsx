'use client'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { InfoTooltip } from '@/components/InfoTooltip'
import type { RoutineWizardData } from '../types'
import {
	PROGRAM_SCHEDULE_OPTIONS,
	PROGRAM_SCHEDULE_TOOLTIP,
	ProgramScheduleOption,
} from '@/features/routines/wizard/constants'

type ProgramScheduleMode = NonNullable<RoutineWizardData['programScheduleMode']>

interface ProgramScheduleSelectorProps {
	value: ProgramScheduleMode
	onChange: (mode: ProgramScheduleMode) => void
	tooltipContent?: string
}

export function ProgramScheduleSelector({
	value,
	onChange,
	tooltipContent = PROGRAM_SCHEDULE_TOOLTIP,
}: ProgramScheduleSelectorProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Label className="text-muted-foreground">Program Schedule</Label>
				<InfoTooltip content={tooltipContent} side="right" />
			</div>
			<div className="space-y-1">
				<Select
					value={value ?? 'NONE'}
					onValueChange={next => onChange(next as ProgramScheduleMode)}
					disabled
				>
					<SelectTrigger
						aria-label="Program schedule"
						className="w-full sm:w-72"
					>
						<SelectValue placeholder="Choose schedule" />
					</SelectTrigger>
					<SelectContent className="max-w-[calc(100vw-2rem)]">
						{PROGRAM_SCHEDULE_OPTIONS.map((option: ProgramScheduleOption) => {
							const { value: optionValue, label } = option
							return (
								<SelectItem key={optionValue} value={optionValue}>
									<div className="flex flex-col text-left">
										<span>{label}</span>
									</div>
								</SelectItem>
							)
						})}
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
