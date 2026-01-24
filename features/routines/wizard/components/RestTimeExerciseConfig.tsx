import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock } from 'lucide-react'

interface Props {
	restInput: string
	setRestInput: (value: string) => void
	exerciseIndex: number
	onUpdateRestTime: (exerciseIndex: number, value: string) => void
	formatTime: (seconds: number) => string
	parseTime: (timeStr: string) => number
	isValidTimeFormat: (timeStr: string) => boolean
	restSeconds: number
	setRestFocused: (focused: boolean) => void
}

export function RestTimeExerciseConfig({
	restInput,
	setRestInput,
	exerciseIndex,
	onUpdateRestTime,
	formatTime,
	parseTime,
	isValidTimeFormat,
	restSeconds,
	setRestFocused,
}: Props) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Clock className="h-4 w-4 text-muted-foreground" />
				<Label className="text-sm font-medium text-muted-foreground">
					Rest
				</Label>
			</div>
			<Input
				aria-label="Rest time"
				type="text"
				inputMode="numeric"
				pattern="[0-9:]*"
				placeholder="0:00"
				value={restInput}
				onFocus={() => setRestFocused(true)}
				onChange={event => {
					const raw = event.target.value
					let cleaned = raw.replace(/[^\d:]/g, '')
					const firstColon = cleaned.indexOf(':')
					if (firstColon !== -1) {
						cleaned =
							cleaned.slice(0, firstColon + 1) +
							cleaned.slice(firstColon + 1).replace(/:/g, '')
					}
					setRestInput(cleaned)
				}}
				onBlur={() => {
					const trimmed = restInput.trim()
					if (trimmed === '') {
						// revert to current value
						setRestInput(formatTime(restSeconds))
						setRestFocused(false)
						return
					}
					if (isValidTimeFormat(trimmed)) {
						// commit change upwards and format
						onUpdateRestTime(exerciseIndex, trimmed)
						const sec = parseTime(trimmed)
						setRestInput(formatTime(sec))
					} else {
						// invalid format: revert to last valid
						setRestInput(formatTime(restSeconds))
					}
					setRestFocused(false)
				}}
				className="w-32 sm:w-40 h-9 text-sm text-center"
			/>
		</div>
	)
}
