import { InfoTooltip } from '@/components/InfoTooltip'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProgressionScheme } from '@sunsteel/contracts'

interface Props {
	disableTimeBasedProgressions?: boolean
	progressionScheme: ProgressionScheme
	exerciseIndex: number
	onUpdateProgressionScheme: (
		exerciseIndex: number,
		scheme: ProgressionScheme,
	) => void
}

export function ProgressionSelect({
	disableTimeBasedProgressions,
	progressionScheme,
	exerciseIndex,
	onUpdateProgressionScheme,
}: Props) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Label className="text-sm font-medium text-muted-foreground">
					Progression
				</Label>
				{disableTimeBasedProgressions && (
					<TooltipProvider>
						<InfoTooltip
							content="Time-based progressions are disabled. Switch Program Schedule to Timeframe in Basic Info to enable."
							side="right"
						/>
					</TooltipProvider>
				)}
			</div>
			<Select
				value={progressionScheme}
				onValueChange={value =>
					onUpdateProgressionScheme(exerciseIndex, value as ProgressionScheme)
				}
			>
				<SelectTrigger
					aria-label="Progression scheme"
					size="sm"
					className="w-32 sm:w-40 max-w-[60vw] h-9 truncate"
				>
					<SelectValue className="truncate" />
				</SelectTrigger>
				<SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-none">
					<SelectItem value="NONE">None</SelectItem>
					<SelectItem value="DOUBLE_PROGRESSION">Double Progression</SelectItem>
					<SelectItem value="DYNAMIC_DOUBLE_PROGRESSION">
						Dynamic Double Progression
					</SelectItem>
					<SelectItem
						value="PROGRAMMED_RTF"
						disabled={!!disableTimeBasedProgressions}
						title={
							disableTimeBasedProgressions
								? 'Requires Timeframe schedule (set in Basic Info)'
								: undefined
						}
					>
						RtF Standard (5 sets: 4 + 1 AMRAP)
					</SelectItem>
					<SelectItem
						value="PROGRAMMED_RTF_HYPERTROPHY"
						disabled={!!disableTimeBasedProgressions}
						title={
							disableTimeBasedProgressions
								? 'Requires Timeframe schedule (set in Basic Info)'
								: undefined
						}
					>
						RtF Hypertrophy (4 sets: 3 + 1 AMRAP)
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	)
}
