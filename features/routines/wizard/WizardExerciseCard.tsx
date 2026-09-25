'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useMemo, useRef, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { useStarredExercises } from '@/lib/api/hooks/useExercises'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { useTrainedExercises } from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types'
import {
	describeAlternative,
	findExerciseAlternatives,
} from '@/lib/utils/exercise-alternatives'
import {
	defaultTrainingLocation,
	listedEquipmentAt,
} from '@/lib/utils/exercise-equipment'
import { groupPickerExercises } from '@/lib/utils/exercise-picker'

import { ExerciseConfigSection } from './components/ExerciseConfigSection'
import { ExerciseHeader } from './components/ExerciseHeader'
import { SetListSection } from './components/SetListSection'
import { useExerciseAccessibility } from './hooks/useExerciseAccessibility'
import { useExerciseCardState } from './hooks/useExerciseCardState'
import type { ProgressionScheme, RoutineWizardData, SetField } from './types'

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
	/** LIVE-13: replace this exercise's warm-ups with a generated ramp. */
	onReplaceWarmUps: (
		exerciseIndex: number,
		warmUps: { weightKg: number; reps: number; share: number }[],
		followLoad: boolean,
	) => void
	/** LIVE-20: keep the warm-ups following the working load, or not. */
	onSetWarmUpsFollowLoad: (exerciseIndex: number, followLoad: boolean) => void
	isRemovingSet: (exerciseIndex: number, setIndex: number) => boolean
	onRemoveSetAnimated: (exerciseIndex: number, setIndex: number) => void
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
	exercises?: Exercise[]
	isExercisesLoading?: boolean
	/** Exercises already on this day, never offered as alternatives. */
	dayExerciseIds?: string[]
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
	onReplaceWarmUps,
	onSetWarmUpsFollowLoad,
	isRemovingSet,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	exercises = [],
	isExercisesLoading = false,
	dayExerciseIds,
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

	// EXER-05: offered at the top of the change dropdown, ranked by the
	// equipment the default gym lists. Never applied without a choice.
	const { data: locations } = useTrainingLocations()
	const gym = defaultTrainingLocation(locations)
	const alternatives = useMemo(() => {
		if (!isEditDropdownOpen || !exerciseData) return []
		return findExerciseAlternatives(exerciseData, exercises, {
			availableEquipment: listedEquipmentAt(gym),
			exclude: dayExerciseIds,
		})
	}, [isEditDropdownOpen, exerciseData, exercises, gym, dayExerciseIds])
	const showAlternatives =
		!isExercisesLoading && !editSearchValue.trim() && alternatives.length > 0

	// EXER-07: below the alternatives, starred and recently trained exercises
	// lead the rest of the catalog; a search shows plain matches.
	const stars = useStarredExercises()
	const trained = useTrainedExercises()
	const pickerGroups = useMemo(
		() =>
			editSearchValue.trim()
				? [{ key: 'matches', label: null, exercises: filteredExercises }]
				: groupPickerExercises(filteredExercises, {
						starred: stars.data?.items.map(item => item.exerciseId),
						recent: trained.data,
						recentPending: trained.isPending,
					}),
		[
			editSearchValue,
			filteredExercises,
			stars.data,
			trained.data,
			trained.isPending,
		],
	)

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
							className="absolute top-full right-2 left-2 z-[100] mt-1 rounded-md sm:left-auto sm:w-[300px] border border-rule bg-popover shadow-overlay duration-[var(--motion-base)] animate-in fade-in-0 zoom-in-95 dark:shadow-none max-h-[400px]"
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
							<div className="max-h-[320px] overflow-y-auto p-2">
								{showAlternatives && (
									<>
										<p className="type-label px-3 pb-1 pt-1 text-ink-3">
											Alternatives
										</p>
										<ul
											aria-label="Alternatives"
											className="mb-2 space-y-1 border-b border-rule-faint pb-2"
										>
											{alternatives.map(alternative => (
												<li key={alternative.exercise.id}>
													<button
														type="button"
														onClick={() =>
															handleEditExercise(alternative.exercise.id)
														}
														className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
													>
														<span className="block text-sm font-medium">
															{alternative.exercise.name}
														</span>
														<span className="type-body-sm block text-ink-3">
															{describeAlternative(alternative, gym?.name)}
														</span>
													</button>
												</li>
											))}
										</ul>
									</>
								)}
								{isExercisesLoading ? (
									<div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
										Loading...
									</div>
								) : filteredExercises.length > 0 ? (
									pickerGroups.map(group => (
										<div key={group.key} className="mb-2 last:mb-0">
											{group.label ? (
												<p className="type-label px-3 pb-1 pt-1 text-ink-3">
													{group.label}
												</p>
											) : null}
											{'pending' in group && group.pending ? (
												<div
													role="status"
													className="type-body-sm flex items-center gap-2 px-3 py-2 text-ink-3"
												>
													<Loader2
														className="size-4 animate-spin"
														aria-hidden
													/>
													Loading recent exercises…
												</div>
											) : null}
											<div className="space-y-1">
												{group.exercises.map(ex => (
													<button
														key={ex.id}
														onClick={() => handleEditExercise(ex.id)}
														className="w-full text-left px-3 py-3 rounded-md hover:bg-accent transition-colors"
													>
														<div className="flex flex-col items-start">
															<span className="text-sm font-medium">
																{ex.name}
															</span>
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
										</div>
									))
								) : (
									<div className="py-6 text-center text-sm text-muted-foreground">
										No exercises found
									</div>
								)}
							</div>
						</div>
					)}
				</div>
				{/* TD-50: inset like the header above it (`p-3 sm:p-4`), not the
				    card's default `px-6`, which left a set row 128px at 320. */}
				<CardContent
					className={`px-3 sm:px-4 overflow-hidden transition-[max-height] duration-[var(--motion-slow)] ease-standard ${
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
							exerciseName={exerciseData?.name ?? 'this exercise'}
							equipmentRequired={exerciseData?.equipmentRequired}
							onReplaceWarmUps={(warmUps, followLoad) =>
								onReplaceWarmUps(exerciseIndex, warmUps, followLoad)
							}
							onSetWarmUpsFollowLoad={followLoad =>
								onSetWarmUpsFollowLoad(exerciseIndex, followLoad)
							}
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
