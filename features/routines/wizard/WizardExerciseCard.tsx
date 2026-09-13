'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useMemo, useRef, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { Exercise } from '@/lib/api/types'

import { ExerciseConfigSection } from './components/ExerciseConfigSection'
import { ExerciseHeader } from './components/ExerciseHeader'
import { SetListSection } from './components/SetListSection'
import { useExerciseAccessibility } from './hooks/useExerciseAccessibility'
import { useExerciseCardState } from './hooks/useExerciseCardState'
import type { ProgressionScheme, RoutineWizardData } from './types'

export interface WizardExerciseCardProps {
	weightUnit: WeightUnit
	tabIndex: number
	exerciseIndex: number
	exercise: RoutineWizardData['days'][number]['exercises'][number]
	exerciseData?: Exercise
	expanded: boolean
	onToggleExpand: (exerciseIndex: number) => void
	onRemoveExercise: (exerciseIndex: number) => void
	onUpdateExercise: (exerciseIndex: number, newExerciseId: string) => void
	onUpdateRestTime: (exerciseIndex: number, timeStr: string) => void
	onUpdateNote: (exerciseIndex: number, note: string) => void
	onUpdateProgressionScheme: (
		exerciseIndex: number,
		scheme: ProgressionScheme,
	) => void
	onUpdateMinWeightIncrement: (exerciseIndex: number, increment: number) => void
	onAddSet: (exerciseIndex: number) => void
	isRemovingSet: (exerciseIndex: number, setIndex: number) => boolean
	onRemoveSetAnimated: (exerciseIndex: number, setIndex: number) => void
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight' | 'rir',
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
	exercises?: Exercise[]
	isExercisesLoading?: boolean
	dragHandle?: React.ReactNode
}

export const WizardExerciseCard: FC<WizardExerciseCardProps> = ({
	weightUnit,
	tabIndex,
	exerciseIndex,
	exercise,
	exerciseData,
	expanded,
	onToggleExpand,
	onRemoveExercise,
	onUpdateExercise,
	onUpdateRestTime,
	onUpdateNote,
	onUpdateProgressionScheme,
	onUpdateMinWeightIncrement,
	onAddSet,
	isRemovingSet,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	exercises = [],
	isExercisesLoading = false,
	dragHandle,
}) => {
	const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false)
	const [editSearchValue, setEditSearchValue] = useState('')
	const editDropdownRef = useRef<HTMLDivElement>(null)
	const {
		registerSetRowRef,
		setsExpanded,
		toggleSetsExpanded,
		handleAddSet,
		weightIncInput,
		handleWeightIncChange,
		handleWeightIncBlur,
	} = useExerciseCardState({
		exercise,
		exerciseIndex,
		tabIndex,
		onAddSet,
		onUpdateMinWeightIncrement,
		weightUnit,
	})

	const {
		controlsId,
		handleHeaderClick,
		handleHeaderKeyDown,
		handleToggleButtonClick,
		handleRemoveButtonClick,
	} = useExerciseAccessibility({
		tabIndex,
		exerciseIndex,
		expanded,
		onToggleExpand,
		onRemoveExercise,
	})

	// Filter exercises for edit dropdown
	const filteredExercises = useMemo(() => {
		if (!editSearchValue.trim()) return exercises
		const search = editSearchValue.toLowerCase()
		return exercises.filter(
			ex =>
				ex.name.toLowerCase().includes(search) ||
				ex.primaryMuscles?.some(m => m.toLowerCase().includes(search)) ||
				ex.equipment?.toLowerCase().includes(search),
		)
	}, [exercises, editSearchValue])

	// Close edit dropdown when clicking outside
	useEffect(() => {
		if (!isEditDropdownOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			if (
				editDropdownRef.current &&
				!editDropdownRef.current.contains(event.target as Node)
			) {
				setIsEditDropdownOpen(false)
				setEditSearchValue('')
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isEditDropdownOpen])

	const handleEditButtonClick = (
		event: React.MouseEvent<HTMLButtonElement>,
	) => {
		event.stopPropagation()
		event.preventDefault()
		setIsEditDropdownOpen(prev => !prev)
	}

	const handleEditExercise = (newExerciseId: string) => {
		onUpdateExercise(exerciseIndex, newExerciseId)
		setIsEditDropdownOpen(false)
		setEditSearchValue('')
	}

	return (
		<>
			<Card className="border-muted overflow-visible p-0">
				<div className="relative">
					<ExerciseHeader
						exercise={exercise}
						exerciseData={exerciseData}
						expanded={expanded}
						controlsId={controlsId}
						onHeaderClick={handleHeaderClick}
						onHeaderKeyDown={handleHeaderKeyDown}
						onToggleButtonClick={handleToggleButtonClick}
						onEditButtonClick={handleEditButtonClick}
						onRemoveButtonClick={handleRemoveButtonClick}
						dragHandle={dragHandle}
					/>
					{isEditDropdownOpen && (
						<div
							ref={editDropdownRef}
							className="absolute top-full right-2 z-[100] mt-1 w-[300px] rounded-md border border-rule bg-popover shadow-overlay duration-[var(--motion-base)] animate-in fade-in-0 zoom-in-95 dark:shadow-none max-h-[400px]"
						>
							<div className="p-3 border-b">
								<input
									type="text"
									aria-label="Search exercises"
									placeholder="Search exercises..."
									value={editSearchValue}
									onChange={e => setEditSearchValue(e.target.value)}
									className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
									autoFocus
								/>
							</div>
							<div className="max-h-[200px] overflow-y-auto p-2">
								{isExercisesLoading ? (
									<div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
										Loading...
									</div>
								) : filteredExercises.length > 0 ? (
									<div className="space-y-1">
										{filteredExercises.map(ex => (
											<button
												key={ex.id}
												onClick={() => handleEditExercise(ex.id)}
												className="w-full text-left px-3 py-3 rounded-md hover:bg-accent transition-colors"
											>
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">{ex.name}</span>
													<span className="text-xs text-muted-foreground">
														{ex.primaryMuscles?.length
															? ex.primaryMuscles.join(', ')
															: 'Unknown'}{' '}
														• {ex.equipment}
													</span>
												</div>
											</button>
										))}
									</div>
								) : (
									<div className="py-6 text-center text-sm text-muted-foreground">
										No exercises found
									</div>
								)}
							</div>
						</div>
					)}
				</div>
				<CardContent
					className={`overflow-hidden transition-[max-height] duration-[var(--motion-slow)] ease-standard ${
						expanded ? 'max-h-[3000px]' : 'max-h-0'
					}`}
					aria-hidden={!expanded}
				>
					<div
						id={controlsId}
						className={`p-0 sm:p-1 transition-opacity duration-[var(--motion-slow)] ease-standard ${
							expanded ? 'opacity-100' : 'opacity-0'
						}`}
					>
						<ExerciseConfigSection
							exercise={exercise}
							exerciseIndex={exerciseIndex}
							weightIncInput={weightIncInput}
							weightUnit={weightUnit}
							onWeightIncChange={handleWeightIncChange}
							onWeightIncBlur={handleWeightIncBlur}
							onUpdateRestTime={onUpdateRestTime}
							onUpdateNote={onUpdateNote}
							onUpdateProgressionScheme={onUpdateProgressionScheme}
						/>

						<SetListSection
							weightUnit={weightUnit}
							exercise={exercise}
							exerciseIndex={exerciseIndex}
							tabIndex={tabIndex}
							setsExpanded={setsExpanded}
							onToggleSets={toggleSetsExpanded}
							onAddSet={handleAddSet}
							registerSetRowRef={registerSetRowRef}
							onUpdateSet={onUpdateSet}
							onValidateMinMaxReps={onValidateMinMaxReps}
							onStepFixedReps={onStepFixedReps}
							onStepRangeReps={onStepRangeReps}
							onStepWeight={onStepWeight}
							onRemoveSetAnimated={onRemoveSetAnimated}
							isRemovingSet={isRemovingSet}
						/>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
