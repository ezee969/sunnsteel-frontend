import { ProgressionScheme } from '@sunsteel/contracts'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface Props {
	progressionScheme: ProgressionScheme
	exerciseIndex: number
	onUpdateProgressionScheme: (
		exerciseIndex: number,
		scheme: ProgressionScheme,
	) => void
}

export function ProgressionSelect({
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
				</SelectContent>
			</Select>
		</div>
	)
}
