'use client'

import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { InfoTooltip } from '@/components/InfoTooltip'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { RoutineWizardData } from '../types'
import { PROGRAM_START_TOOLTIP } from '../constants'
import { isPastDate } from '../utils/date'

type ProgramScheduleMode = NonNullable<RoutineWizardData['programScheduleMode']>

interface ProgramStartDatePickerProps {
	mode: ProgramScheduleMode
	selectedDate?: Date
	isOpen: boolean
	onOpenChange: (next: boolean) => void
	onSelectDate: (date?: Date) => void
	onInputChange: (value: string) => void
}

export const ProgramStartDatePicker = forwardRef<HTMLDivElement, ProgramStartDatePickerProps>(
	function ProgramStartDatePicker(
		{ mode, selectedDate, isOpen, onOpenChange, onSelectDate, onInputChange },
		ref,
	) {
		if (mode !== 'TIMEFRAME') {
			return null
		}

		return (
			<div ref={ref} className="space-y-2">
				<div className="flex items-center gap-2">
					<Label htmlFor="program-start-date">Program start date</Label>
					<InfoTooltip content={PROGRAM_START_TOOLTIP} side="right" />
				</div>
				<Input
					id="program-start-date"
					type="date"
					value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
					onChange={(event) => onInputChange(event.target.value)}
					className="sr-only"
				/>
				<Popover open={isOpen} onOpenChange={onOpenChange}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								'w-full sm:w-72 justify-start text-left font-normal',
								!selectedDate && 'text-muted-foreground',
							)}
							aria-labelledby="program-start-date"
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span>Pick a date</span>}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={onSelectDate}
							disabled={(date) => isPastDate(date)}
						/>
					</PopoverContent>
				</Popover>
			</div>
		)
	},
)
