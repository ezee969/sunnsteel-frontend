'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { TrainingDayInfo } from '../constants/training-days'

interface TrainingDayButtonProps {
	readonly day: TrainingDayInfo
	readonly isSelected: boolean
	readonly isLocked: boolean
	readonly isMobile: boolean
	readonly onToggle: (dayId: number) => void
}

export const TrainingDayButton = ({
	day,
	isSelected,
	isLocked,
	isMobile,
	onToggle,
}: TrainingDayButtonProps) => (
	<Button
		variant={isSelected ? 'default' : 'outline'}
		onClick={() => onToggle(day.id)}
		disabled={isLocked}
		className={cn(
			'flex flex-col h-auto p-1.5 md:p-3 text-xs md:text-sm relative',
			isMobile && 'h-10 w-10 p-0 flex items-center justify-center',
			isLocked &&
				'bg-primary text-primary-foreground cursor-not-allowed opacity-90',
		)}
		size={isMobile ? 'icon' : 'sm'}
		title={
			isLocked ? 'This day is locked as your program start date' : undefined
		}
	>
		{isMobile ? (
			<span className="font-medium text-xs">{day.short.charAt(0)}</span>
		) : (
			<>
				<span className="font-medium">{day.short}</span>
				<span className="hidden sm:block text-[10px] md:text-xs opacity-80">
					{day.name.substring(0, 3)}
				</span>
			</>
		)}
		{isLocked && (
			<div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-none bg-warning-strong">
				<span className="text-[8px] leading-none">🔒</span>
			</div>
		)}
	</Button>
)
