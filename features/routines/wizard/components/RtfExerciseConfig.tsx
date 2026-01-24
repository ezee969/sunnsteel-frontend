import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface Props {
	tmInput: string
	tmMissing: boolean
	tmHelpId: string
	exerciseIndex: number
	onTmInputChange: (value: string) => void
	onTmBlur: () => void
	programRoundingKg?: number
	onUpdateProgramRoundingKg: (exerciseIndex: number, roundingKg: number) => void
}

export function RtfExerciseConfig({
	tmInput,
	tmMissing,
	tmHelpId,
	exerciseIndex,
	onTmInputChange,
	onTmBlur,
	programRoundingKg,
	onUpdateProgramRoundingKg,
}: Props) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:gap-3">
			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium text-muted-foreground">
							TM
						</Label>
					</div>
					<Input
						aria-label="Training Max"
						aria-invalid={tmMissing}
						aria-describedby={tmHelpId}
						type="text"
						inputMode="decimal"
						pattern="[0-9]*[.]?[0-9]*"
						placeholder="e.g. 110"
						value={tmInput}
						onChange={event => onTmInputChange(event.target.value)}
						onBlur={onTmBlur}
						className={`w-32 sm:w-40 h-8 text-sm text-center ${
							tmMissing
								? 'border-destructive focus-visible:ring-destructive'
								: ''
						}`}
					/>
				</div>
			</div>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Label className="text-sm font-medium text-muted-foreground">
						Rounding
					</Label>
				</div>
				<Select
					value={(programRoundingKg ?? 2.5).toString()}
					onValueChange={value =>
						onUpdateProgramRoundingKg(exerciseIndex, parseFloat(value))
					}
				>
					<SelectTrigger
						aria-label="Rounding increment"
						size="sm"
						className="w-32 sm:w-40 truncate"
					>
						<SelectValue className="truncate" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0.5">0.5</SelectItem>
						<SelectItem value="1">1.0</SelectItem>
						<SelectItem value="2.5">2.5</SelectItem>
						<SelectItem value="5">5.0</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
