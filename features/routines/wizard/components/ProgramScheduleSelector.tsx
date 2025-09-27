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

/**
 * Renders a labeled program schedule selector with an info tooltip and a dropdown of options.
 *
 * @param value - The currently selected program schedule mode; the control displays `'NONE'` when `value` is undefined.
 * @param onChange - Callback invoked with the newly selected `ProgramScheduleMode` when the user picks an option.
 * @param tooltipContent - Optional tooltip text shown by the info icon; defaults to `PROGRAM_SCHEDULE_TOOLTIP`.
 * @returns The rendered Program Schedule selector React element.
 */
export function ProgramScheduleSelector({
	value,
	onChange,
	tooltipContent = PROGRAM_SCHEDULE_TOOLTIP,
}: ProgramScheduleSelectorProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Label>Program Schedule</Label>
				<InfoTooltip content={tooltipContent} side="right" />
			</div>
			<div className="space-y-1">
				<Select
					value={value ?? 'NONE'}
					onValueChange={(next) => onChange(next as ProgramScheduleMode)}
				>
					<SelectTrigger aria-label="Program schedule" className="w-full sm:w-72">
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
