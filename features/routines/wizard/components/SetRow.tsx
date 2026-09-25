import {
	SET_KIND_LABELS,
	SET_KINDS,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Minus, Plus, Trash2 } from 'lucide-react'

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

import { useSetRowInputs } from '../hooks/useSetRowInputs'
import type { ProgressionScheme, RoutineSet, SetField } from '../types'

/**
 * TD-50: the one-line row's columns from `lg`, shared with the header in
 * [SetListSection](./SetListSection.tsx) so both grids line up. Each track has
 * the floor its content needs -- the widest kind ("Optional"), a rep range of
 * two-digit fields, a five-character load, a two-digit RIR -- and numeric
 * tracks stop at `--field-max` (§10.2). Below `lg` the budget is too small
 * for one line (the shell leaves 306px at 768), so a row takes two.
 */
export const SET_ROW_COLUMNS =
	'lg:grid-cols-[3.5rem_minmax(6.25rem,1fr)_minmax(5.25rem,1fr)_minmax(6.75rem,1.5fr)_minmax(4.5rem,var(--field-max))_3.25rem_2rem]'

interface SetRowProps {
	weightUnit: WeightUnit
	exerciseIndex: number
	setIndex: number
	set: RoutineSet
	progressionScheme: ProgressionScheme
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: SetField,
		value: string | number | null,
	) => void
	onValidateMinMaxReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
	) => void
	onStepFixedReps: (
		exerciseIndex: number,
		setIndex: number,
		delta: number,
	) => void
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
	/** LIVE-12: the load follows the exercise's first working set. */
	weightLocked: boolean
}

/**
 * Render a responsive row UI for editing a single exercise set in the routine wizard.
 *
 * @param exerciseIndex - Index of the parent exercise containing this set
 * @param setIndex - Index of this set within the exercise
 * @param set - The set data to display and edit
 * @param progressionScheme - Progression mode; when not `'NONE'` rep type selection is disabled, and when `'DOUBLE_PROGRESSION'` weight editing is disabled for non-first sets
 * @param onUpdateSet - Callback to update a specific field of the set (`repType`, `reps`, `minReps`, `maxReps`, `weight`)
 * @param onValidateMinMaxReps - Callback invoked to validate min/max rep values after edits
 * @param onStepFixedReps - Callback invoked to increment/decrement fixed reps by a delta
 * @param onStepRangeReps - Callback invoked to increment/decrement `minReps` or `maxReps` by a delta
 * @param onStepWeight - Callback invoked to increment/decrement weight by a delta
 * @param onRemoveSet - Callback to remove this set
 * @param isRemoving - When true, apply removal animation/state
 * @param disableRemove - When true, disable remove controls
 *
 * @returns The rendered set row element
 */
export function SetRow({
	weightUnit,
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
	weightLocked,
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
		rirInput,
		handleRirChange,
	} = useSetRowInputs({
		set,
		exerciseIndex,
		setIndex,
		onUpdateSet,
		onValidateMinMaxReps,
		weightUnit,
	})

	return (
		<div
			className={`bg-card border border-muted rounded-md p-2 lg:p-0 lg:bg-transparent lg:border-0 lg:rounded-none transition-colors duration-[var(--motion-fast)] ease-standard ${
				isRemoving ? 'animate-out fade-out-0 duration-[140ms] ease-exit' : ''
			}`}
		>
			{/* TD-50: below `sm` a card of stacked fields with steppers; from `sm`
			    two lines -- the set, its kind, its rep type and remove, then its
			    fields -- and from `lg` one line under the column headings. */}
			<div
				className={`flex flex-col gap-2 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center ${SET_ROW_COLUMNS}`}
			>
				<div className="flex items-center justify-between gap-2 sm:contents">
					<Badge variant="outline" className="w-fit text-xs px-2 py-1">
						Set {set.setNumber}
					</Badge>

					<Button
						variant="ghost"
						size="sm"
						onClick={onRemoveSet}
						aria-label="Remove set"
						disabled={disableRemove}
						className="sm:hidden h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>

				{/* LIVE-12: the kind and the rep type wrap onto two lines in a
				    narrow card rather than pushing the rep type off its edge. */}
				<div className="flex w-full min-w-0 flex-wrap gap-2 sm:contents">
					<div className="min-w-[104px] flex-1 sm:min-w-0">
						<Select
							value={set.kind ?? 'WORKING'}
							onValueChange={value =>
								onUpdateSet(exerciseIndex, setIndex, 'kind', value)
							}
						>
							<SelectTrigger
								aria-label={`Set ${set.setNumber} kind`}
								className="w-full h-9 sm:h-8"
							>
								<SelectValue className="truncate" />
							</SelectTrigger>
							<SelectContent>
								{SET_KINDS.map(kind => (
									<SelectItem key={kind} value={kind}>
										{SET_KIND_LABELS[kind]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="min-w-[104px] flex-1 sm:min-w-0">
						<Select
							value={set.repType}
							onValueChange={value =>
								onUpdateSet(exerciseIndex, setIndex, 'repType', value)
							}
							disabled={progressionScheme !== 'NONE'}
						>
							<SelectTrigger
								aria-label="Rep type"
								className="w-full h-9 sm:h-8"
							>
								<SelectValue className="truncate" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="FIXED">Fixed</SelectItem>
								<SelectItem value="RANGE">Range</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Inputs: Reps gets its own row on mobile so its steppers/input aren't
				    squeezed by Weight/RIR sharing the same row; contents on desktop
				    (unchanged 12-col grid via col-span) */}
				<div className="flex flex-col gap-2 sm:col-span-full sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-2 lg:contents">
					{/* Reps Column */}
					<div className="space-y-1 lg:min-w-0">
						<Label className="lg:hidden">
							{set.repType === 'FIXED' ? 'Reps' : 'Reps Range'}
						</Label>
						{set.repType === 'FIXED' ? (
							<div className="flex items-center gap-2 w-full">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 p-0 shrink-0 sm:hidden"
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
									onChange={event => handleFixedRepsChange(event.target.value)}
									className="text-center h-10 sm:h-8 flex-1 min-w-[56px] sm:min-w-0 sm:w-16 sm:flex-none lg:w-full lg:max-w-[var(--field-max)]"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 p-0 shrink-0 sm:hidden"
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
											onClick={() =>
												onStepRangeReps(exerciseIndex, setIndex, 'minReps', -1)
											}
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
											onChange={event => handleMinChange(event.target.value)}
											onBlur={handleMinBlur}
											className="text-center h-9 sm:h-8 flex-1 min-w-0 sm:w-14 sm:flex-none lg:w-auto lg:flex-1"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Increase minimum reps"
											onClick={() =>
												onStepRangeReps(exerciseIndex, setIndex, 'minReps', 1)
											}
										>
											<Plus className="h-3 w-3" />
										</Button>
									</div>
									<span className="hidden sm:inline text-muted-foreground">
										-
									</span>
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Decrease maximum reps"
											onClick={() =>
												onStepRangeReps(exerciseIndex, setIndex, 'maxReps', -1)
											}
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
											onChange={event => handleMaxChange(event.target.value)}
											onBlur={handleMaxBlur}
											className="text-center h-9 sm:h-8 flex-1 min-w-0 sm:w-14 sm:flex-none lg:w-auto lg:flex-1"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="h-8 w-8 p-0 shrink-0 inline-flex sm:hidden"
											aria-label="Increase maximum reps"
											onClick={() =>
												onStepRangeReps(exerciseIndex, setIndex, 'maxReps', 1)
											}
										>
											<Plus className="h-3 w-3" />
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Weight and RIR each get their own full-width row on mobile —
					    two stepper groups (minus + input + plus) can't fit side by
					    side in a narrow card without the buttons overlapping; contents
					    on desktop (unchanged 12-col grid) */}
					<div className="flex flex-col gap-2 sm:contents">
						{/* Weight Column */}
						<div className="space-y-1 lg:min-w-0">
							<Label className="lg:hidden">
								Weight ({weightUnit === 'LB' ? 'lb' : 'kg'})
							</Label>
							<div className="flex items-center gap-2 w-full">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 p-0 shrink-0 sm:hidden"
									aria-label="Decrease weight"
									disabled={weightLocked}
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
									onChange={event => handleWeightChange(event.target.value)}
									onBlur={handleWeightBlur}
									disabled={weightLocked}
									className={`text-center h-10 sm:h-8 flex-1 min-w-[56px] sm:min-w-0 sm:w-20 sm:flex-none lg:w-full ${
										weightLocked ? 'cursor-not-allowed' : ''
									}`}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 p-0 shrink-0 sm:hidden"
									aria-label="Increase weight"
									disabled={weightLocked}
									onClick={() => onStepWeight(exerciseIndex, setIndex, 1)}
								>
									<Plus className="h-3 w-3" />
								</Button>
							</div>
						</div>

						{/* RIR Column */}
						<div className="space-y-1 lg:min-w-0">
							<Label className="lg:hidden">RIR</Label>
							<div className="flex items-center gap-2 w-full">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 p-0 shrink-0 sm:hidden"
									aria-label="Decrease RIR"
									onClick={() =>
										onUpdateSet(
											exerciseIndex,
											setIndex,
											'rir',
											Math.max(0, (set.rir ?? 0) - 1),
										)
									}
								>
									<Minus className="h-3 w-3" />
								</Button>
								<Input
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									autoComplete="off"
									aria-label="RIR"
									placeholder="0"
									value={rirInput}
									onChange={event => handleRirChange(event.target.value)}
									className="text-center h-10 sm:h-8 flex-1 min-w-[56px] sm:min-w-0 sm:w-14 sm:flex-none lg:w-full"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 p-0 shrink-0 sm:hidden"
									aria-label="Increase RIR"
									onClick={() =>
										onUpdateSet(
											exerciseIndex,
											setIndex,
											'rir',
											Math.min(10, (set.rir ?? 0) + 1),
										)
									}
								>
									<Plus className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Desktop-only delete button */}
				<div className="hidden sm:flex sm:col-start-4 sm:row-start-1 justify-end lg:col-start-auto lg:row-start-auto">
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
