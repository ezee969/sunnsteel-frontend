import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { ProgressionScheme, RoutineSet } from '../types'
import { useSetRowInputs } from '../hooks/useSetRowInputs'

interface SetRowProps {
	exerciseIndex: number
	setIndex: number
	set: RoutineSet
	progressionScheme: ProgressionScheme
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
		value: string,
	) => void
	onValidateMinMaxReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
	) => void
	onStepFixedReps: (exerciseIndex: number, setIndex: number, delta: number) => void
	onStepRangeReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
		delta: number,
	) => void
	onStepWeight: (exerciseIndex: number, setIndex: number, delta: number) => void
	onRemoveSet: () => void
	isRemoving: boolean
	disableRemove: boolean
}

export function SetRow({
	exerciseIndex,
	setIndex,
	set,
	progressionScheme,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	onRemoveSet,
	isRemoving,
	disableRemove,
}: SetRowProps) {
	const {
		minInput,
		maxInput,
		weightInput,
		handleFixedRepsChange,
		handleMinChange,
		handleMinBlur,
		handleMaxChange,
		handleMaxBlur,
		handleWeightChange,
		handleWeightBlur,
	} = useSetRowInputs({
		set,
		exerciseIndex,
		setIndex,
		onUpdateSet,
		onValidateMinMaxReps,
	})

	return (
		<div
			className={`bg-card border border-muted rounded-lg p-2 sm:p-0 sm:bg-transparent sm:border-0 sm:rounded-none transition-all duration-200 ${
				isRemoving ? 'animate-out fade-out-0 slide-out-to-top-2' : 'animate-in fade-in-0 slide-in-from-top-2'
			}`}
		>
			<div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2 items-start sm:items-center">
				<div className="sm:col-span-2">
					<div className="flex items-center justify-between sm:justify-start">
						<Badge variant="outline" className="text-xs px-2 py-1">
							Set {set.setNumber}
						</Badge>
						<Button
							variant="ghost"
							size="sm"
							onClick={onRemoveSet}
							aria-label="Remove set"
							disabled={disableRemove}
							className="sm:hidden h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					</div>
				</div>

				<div className="sm:col-span-3">
					<div className="space-y-1">
						<Label className="sm:hidden text-xs font-medium text-muted-foreground">
							Rep Type
						</Label>
						<Select
							value={set.repType}
							onValueChange={(value) =>
								onUpdateSet(exerciseIndex, setIndex, 'repType', value)
							}
							disabled={progressionScheme !== 'NONE'}
						>
							<SelectTrigger aria-label="Rep type" className="w-full">
								<SelectValue className="truncate" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="FIXED">Fixed Reps</SelectItem>
								<SelectItem value="RANGE">Rep Range</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="sm:col-span-3">
					<div className="space-y-1">
						<Label className="sm:hidden text-xs font-medium text-muted-foreground">
							{set.repType === 'FIXED' ? 'Reps' : 'Rep Range'}
						</Label>
						{set.repType === 'FIXED' ? (
							<div className="flex items-center gap-2 w-full">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-9 w-9 p-0 shrink-0 sm:hidden"
									aria-label="Decrease reps"
									onClick={() => onStepFixedReps(exerciseIndex, setIndex, -1)}
								>
									<Minus className="h-3 w-3" />
								</Button>
								<Input
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									autoComplete="off"
									aria-label="Reps"
									placeholder="0"
									value={set.reps ?? ''}
									onChange={(event) => handleFixedRepsChange(event.target.value)}
									className="text-center h-8 flex-1 min-w-0"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-9 w-9 p-0 shrink-0 sm:hidden"
									aria-label="Increase reps"
									onClick={() => onStepFixedReps(exerciseIndex, setIndex, 1)}
								>
									<Plus className="h-3 w-3" />
								</Button>
							</div>
						) : (
							<div className="w-full">
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 w-full">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Decrease minimum reps"
											onClick={() => onStepRangeReps(exerciseIndex, setIndex, 'minReps', -1)}
										>
											<Minus className="h-3 w-3" />
										</Button>
										<Input
											type="text"
											aria-label="Min reps"
											inputMode="numeric"
											pattern="[0-9]*"
											placeholder="Min"
											autoComplete="off"
											value={minInput}
											onChange={(event) => handleMinChange(event.target.value)}
											onBlur={handleMinBlur}
											className="text-center h-8 flex-1 min-w-0 sm:min-w-[64px]"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Increase minimum reps"
											onClick={() => onStepRangeReps(exerciseIndex, setIndex, 'minReps', 1)}
										>
											<Plus className="h-3 w-3" />
										</Button>
									</div>
									<span className="hidden sm:inline text-muted-foreground">-</span>
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Decrease maximum reps"
											onClick={() => onStepRangeReps(exerciseIndex, setIndex, 'maxReps', -1)}
										>
											<Minus className="h-3 w-3" />
										</Button>
										<Input
											type="text"
											aria-label="Max reps"
											inputMode="numeric"
											pattern="[0-9]*"
											placeholder="Max"
											autoComplete="off"
											value={maxInput}
											onChange={(event) => handleMaxChange(event.target.value)}
											onBlur={handleMaxBlur}
											className="text-center h-8 flex-1 min-w-0"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Increase maximum reps"
											onClick={() => onStepRangeReps(exerciseIndex, setIndex, 'maxReps', 1)}
										>
											<Plus className="h-3 w-3" />
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="sm:col-span-2">
					<div className="space-y-1">
						<Label className="sm:hidden text-xs font-medium text-muted-foreground">
							Weight
						</Label>
						<div className="flex items-center gap-2 w-full">
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-9 w-9 p-0 shrink-0 sm:hidden"
								aria-label="Decrease weight"
								disabled={progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0}
								onClick={() => onStepWeight(exerciseIndex, setIndex, -1)}
							>
								<Minus className="h-3 w-3" />
							</Button>
							<Input
								type="text"
								inputMode="decimal"
								pattern="[0-9]*[.]?[0-9]*"
								autoComplete="off"
								aria-label="Weight"
								placeholder="0"
								value={weightInput}
								onChange={(event) => handleWeightChange(event.target.value)}
								onBlur={handleWeightBlur}
								disabled={progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0}
								className={`text-center h-8 flex-1 min-w-0 ${
									progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0
										? 'cursor-not-allowed opacity-60'
										: ''
								}`}
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-9 w-9 p-0 shrink-0 sm:hidden"
								aria-label="Increase weight"
								disabled={progressionScheme === 'DOUBLE_PROGRESSION' && setIndex > 0}
								onClick={() => onStepWeight(exerciseIndex, setIndex, 1)}
							>
								<Plus className="h-3 w-3" />
							</Button>
						</div>
					</div>
				</div>

				<div className="hidden sm:flex sm:col-span-2 justify-end">
					<Button
						variant="ghost"
						size="sm"
						onClick={onRemoveSet}
						aria-label="Remove set"
						disabled={disableRemove}
						className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}

