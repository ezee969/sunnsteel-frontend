'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TrainingDayInfo } from '../constants/training-days'

interface SelectedDaysSummaryProps {
	readonly trainingDays: number[]
	readonly dayInfos: readonly TrainingDayInfo[]
}

export const SelectedDaysSummary = ({
	trainingDays,
	dayInfos,
}: SelectedDaysSummaryProps) => (
	<div className="bg-muted/50 p-3 md:p-4 rounded-lg">
		<h4 className="font-medium text-sm md:text-base mb-2 md:mb-3">
			Selected Training Days ({trainingDays.length} days/week)
		</h4>
		<div className="relative min-h-[56px] md:min-h-[28px]">
			<div
				className={cn(
					'absolute inset-0 flex items-center justify-center transition-opacity',
					trainingDays.length === 0
						? 'opacity-100'
						: 'opacity-0 pointer-events-none',
				)}
			>
				<p className="text-muted-foreground text-sm text-center">
					Select at least one training day to continue
				</p>
			</div>
			<div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 md:gap-2">
				{dayInfos.map((day) => (
					<Badge
						key={day.id}
						variant="secondary"
						className={cn(
							'w-full text-center text-xs md:text-sm px-1 py-1 transition-opacity duration-300',
							trainingDays.includes(day.id)
								? 'opacity-100'
								: 'opacity-0',
						)}
					>
						{day.name}
					</Badge>
				))}
			</div>
		</div>
	</div>
)
