import { Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { InfoTooltip } from '@/components/InfoTooltip'
import { TooltipProvider } from '@/components/ui/tooltip'
import { formatTime } from '@/lib/utils/time'
import type { RoutineWizardExercise, ProgressionScheme } from '../types'
import { isRtFExercise, requiresWeightIncrementField } from '../utils/progression.helpers'

interface ExerciseConfigSectionProps {
	exercise: RoutineWizardExercise
	exerciseIndex: number
	disableTimeBasedProgressions?: boolean
	tmInput: string
	tmMissing: boolean
	tmHelpId: string
	onTmInputChange: (value: string) => void
	onTmBlur: () => void
	weightIncInput: string
	onWeightIncChange: (value: string) => void
	onWeightIncBlur: () => void
	onUpdateRestTime: (exerciseIndex: number, value: string) => void
	onUpdateProgressionScheme: (
		exerciseIndex: number,
		scheme: ProgressionScheme,
	) => void
	onUpdateProgramRoundingKg: (exerciseIndex: number, roundingKg: number) => void
}

export function ExerciseConfigSection({
	exercise,
	exerciseIndex,
	disableTimeBasedProgressions,
	tmInput,
	tmMissing,
	tmHelpId,
	onTmInputChange,
	onTmBlur,
	weightIncInput,
	onWeightIncChange,
	onWeightIncBlur,
	onUpdateRestTime,
	onUpdateProgressionScheme,
	onUpdateProgramRoundingKg,
}: ExerciseConfigSectionProps) {
	const isRtF = isRtFExercise(exercise.progressionScheme)

	return (
		<div className="mb-3 p-2 sm:p-3 bg-muted/30 rounded-lg space-y-2 sm:space-y-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<Label className="text-sm font-medium text-muted-foreground">
						Rest
					</Label>
				</div>
				<Input
					aria-label="Rest time"
					placeholder="0:00"
					value={formatTime(exercise.restSeconds)}
					onChange={(event) => onUpdateRestTime(exerciseIndex, event.target.value)}
					className="w-32 sm:w-40 h-9 text-sm text-center"
				/>
			</div>

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
					value={exercise.progressionScheme}
					onValueChange={(value) =>
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

			{isRtF && (
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
								onChange={(event) => onTmInputChange(event.target.value)}
								onBlur={onTmBlur}
								className={`w-32 sm:w-40 h-8 text-sm text-center ${
									tmMissing ? 'border-destructive focus-visible:ring-destructive' : ''
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
							value={(exercise.programRoundingKg ?? 2.5).toString()}
							onValueChange={(value) =>
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
			)}

			{requiresWeightIncrementField(exercise.progressionScheme) && (
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium text-muted-foreground">
							Weight Inc.
						</Label>
					</div>
					<div className="flex items-center gap-2 sm:gap-2">
						<Input
							type="text"
							inputMode="decimal"
							pattern="[0-9]*[.]?[0-9]*"
							autoComplete="off"
							aria-label="Minimum weight increment"
							placeholder="2.5"
							value={weightIncInput}
							onChange={(event) => onWeightIncChange(event.target.value)}
							onBlur={onWeightIncBlur}
							className="w-32 sm:w-40 h-9 text-sm text-center"
						/>
					</div>
				</div>
			)}
		</div>
	)
}
