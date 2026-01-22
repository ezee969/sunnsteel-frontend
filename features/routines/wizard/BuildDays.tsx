'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useExercises } from '@/lib/api/hooks'
import { parseTime } from '@/lib/utils/time'
import { RoutineWizardData, ProgressionScheme } from './types'
import { ExerciseList } from './components/ExerciseList'
import { ExercisePickerDropdown } from './components/ExercisePickerDropdown'
import { useRoutineDaySelection } from './hooks/useRoutineDaySelection'
import { useRoutineDayMutations } from './hooks/useRoutineDayMutations'

interface BuildDaysProps {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
	isEditing?: boolean
}

const DAYS_OF_WEEK = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
]

export function BuildDays({
	data,
	onUpdate,
	isEditing = false,
}: BuildDaysProps) {
	const [expandedMapByDay, setExpandedMapByDay] = useState<
		Record<number, Record<string, boolean>>
	>({})
	const [removingSets, setRemovingSets] = useState<Record<string, boolean>>({})
	const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null)
	const { data: exercises, isLoading: exercisesLoading } = useExercises()
	const canUseTimeframe = data.programScheduleMode === 'TIMEFRAME'

	const makeClientId = useCallback(
		() =>
			globalThis.crypto?.randomUUID?.() ??
			`${Date.now()}-${Math.random().toString(16).slice(2)}`,
		[],
	)
	const {
		selectedDay,
		setSelectedDay,
		dropdownRef,
		picker: {
			isOpen: isPickerOpen,
			toggle: togglePicker,
			close: closePicker,
			searchValue,
			setSearchValue,
			filteredExercises,
		},
	} = useRoutineDaySelection({
		exercises,
		trainingDays: data.trainingDays,
	})

	const {
		addExercise,
		removeExercise,
		updateExercise,
		updateExerciseNote,
		updateProgramTMKg,
		updateProgramRoundingKg,
		updateProgressionScheme,
		updateMinWeightIncrement,
		addSet,
		removeSet,
		stepFixedReps,
		stepRangeReps,
		stepWeight,
		updateSet,
		validateMinMaxReps,
		setRestSeconds,
	} = useRoutineDayMutations({
		data,
		onUpdate,
		selectedDayIndex: selectedDay,
		trainingDays: data.trainingDays,
		canUseTimeframe,
	})

	// Note: we compute day-specific data on-demand below to avoid stale references

	// If schedule is NONE, ensure no time-based progression remains selected
	useEffect(() => {
		if (canUseTimeframe) return
		const hasAnyTimeBased = data.days.some(day =>
			day.exercises.some(ex => ex.progressionScheme === 'PROGRAMMED_RTF'),
		)
		if (!hasAnyTimeBased) return
		const newDays = data.days.map(day => ({
			...day,
			exercises: day.exercises.map(ex => {
				if (ex.progressionScheme === 'PROGRAMMED_RTF') {
					return { ...ex, progressionScheme: 'NONE' as ProgressionScheme }
				}
				return ex
			}),
		}))
		onUpdate({ days: newDays })
	}, [canUseTimeframe, data.days, onUpdate])

	// Ensure each exercise has a stable clientId for UI (keys, drag-and-drop)
	useEffect(() => {
		const needsClientIds = data.days.some(day =>
			day.exercises.some(ex => !ex.clientId),
		)
		if (!needsClientIds) return

		const newDays = data.days.map(day => ({
			...day,
			exercises: day.exercises.map(ex =>
				ex.clientId ? ex : { ...ex, clientId: makeClientId() },
			),
		}))
		onUpdate({ days: newDays })
	}, [data.days, makeClientId, onUpdate])

	// Scroll after render to target exercise card if queued

	// After days update, if we have a pending target, scroll to it (with small retries)
	useEffect(() => {
		if (!pendingScrollKey) return

		let attempts = 0
		const maxAttempts = 5

		const tryScroll = () => {
			const el = exerciseRefs.current[pendingScrollKey!]
			if (el) {
				const rect = el.getBoundingClientRect()
				const absoluteTop = rect.top + window.scrollY
				const target = absoluteTop - window.innerHeight / 2 + rect.height / 2
				window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
				setPendingScrollKey(null)
				return
			}
			attempts += 1
			if (attempts < maxAttempts) {
				requestAnimationFrame(tryScroll)
			}
		}

		const raf = requestAnimationFrame(tryScroll)
		return () => cancelAnimationFrame(raf)
	}, [pendingScrollKey, data.days])

	const handleAddExercise = (exerciseId: string) => {
		const clientId = addExercise(exerciseId)
		if (!clientId) return
		closePicker()
		setPendingScrollKey(clientId)
	}

	const registerExerciseRef = useCallback(
		(key: string, node: HTMLDivElement | null) => {
			exerciseRefs.current[key] = node
		},
		[],
	)

	const selectedDayId = data.trainingDays[selectedDay]
	const selectedDayData = data.days.find(d => d.dayOfWeek === selectedDayId)
	const selectedDayExercisesCount = selectedDayData?.exercises?.length ?? 0
	const selectedDaySetsCount =
		selectedDayData?.exercises?.reduce(
			(sum, ex) => sum + (ex.sets?.length ?? 0),
			0,
		) ?? 0

	if (data.trainingDays.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<p>No training days selected. Go back to select training days first.</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium mb-4">
					Build Your Training Days
					<span className="text-destructive ml-1">*</span>
				</h3>

				{/* Overall Stats  */}
				<div className="grid grid-cols-3 gap-2 mb-4 sm:gap-4">
					<div className="rounded-md border bg-muted/20 p-2 text-center sm:p-3">
						<div className="text-base font-bold leading-none text-primary sm:text-xl">
							{selectedDayExercisesCount}
						</div>
						<div className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">
							Exercises
						</div>
					</div>
					<div className="rounded-md border bg-muted/20 p-2 text-center sm:p-3">
						<div className="text-base font-bold leading-none text-primary sm:text-xl">
							{selectedDaySetsCount}
						</div>
						<div className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">
							Sets
						</div>
					</div>
					<div className="rounded-md border bg-muted/20 p-2 text-center sm:p-3">
						<div className="text-base font-bold leading-none text-primary sm:text-xl">
							{data.days.filter(day => day.exercises.length > 0).length}/
							{data.days.length}
						</div>
						<div className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">
							Days Ready
						</div>
					</div>
				</div>

				{/* Day Tabs */}
				<Tabs
					value={selectedDay.toString()}
					onValueChange={(value: string) => setSelectedDay(parseInt(value))}
				>
					<TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 mb-2">
						{data.trainingDays.map((dayId, index) => (
							<TabsTrigger
								key={dayId}
								value={index.toString()}
								className="flex-shrink-0 whitespace-nowrap h-10 px-4"
							>
								{DAYS_OF_WEEK[dayId]}
								<Badge
									variant="secondary"
									className="ml-2 h-5 min-w-[1.25rem] px-1 text-[10px] leading-none flex items-center justify-center"
								>
									{data.days.find(d => d.dayOfWeek === dayId)?.exercises
										?.length ?? 0}
								</Badge>
							</TabsTrigger>
						))}
					</TabsList>

					{data.trainingDays.map((dayId, tabIndex) => {
						const day = data.days.find(d => d.dayOfWeek === dayId)

						const handleReorderExercises = (
							newExercises: RoutineWizardData['days'][number]['exercises'],
						) => {
							// Persist reorder at the wizard-state level (array order)
							const newDays = data.days.map(d =>
								d.dayOfWeek === dayId ? { ...d, exercises: newExercises } : d,
							)
							onUpdate({ days: newDays })
						}

						const handleToggleExpandByKey = (exerciseKey: string) => {
							setExpandedMapByDay(prev => {
								const dayMap = prev[dayId] ?? {}
								return {
									...prev,
									[dayId]: {
										...dayMap,
										[exerciseKey]: !(dayMap?.[exerciseKey] ?? true),
									},
								}
							})
						}

						const handleRemoveExercise = (exerciseIndex: number) => {
							const exerciseKey = day?.exercises?.[exerciseIndex]?.clientId
							removeExercise(exerciseIndex)
							if (!exerciseKey) return
							setExpandedMapByDay(prev => {
								const dayMap = prev[dayId]
								if (!dayMap || !(exerciseKey in dayMap)) return prev
								const nextDayMap = { ...dayMap }
								delete nextDayMap[exerciseKey]
								return { ...prev, [dayId]: nextDayMap }
							})
						}

						return (
							<TabsContent
								key={dayId}
								value={tabIndex.toString()}
								className="mt-4"
							>
								<Card>
									<CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6">
										<CardTitle>{DAYS_OF_WEEK[dayId]} Workout</CardTitle>
										<ExercisePickerDropdown
											ref={dropdownRef}
											isOpen={isPickerOpen}
											onToggle={togglePicker}
											onClose={closePicker}
											searchValue={searchValue}
											onSearchChange={setSearchValue}
											exercises={filteredExercises}
											isLoading={!!exercisesLoading}
											onSelect={handleAddExercise}
										/>
									</CardHeader>
									<CardContent className="p-4 sm:p-6">
										<ExerciseList
											tabIndex={tabIndex}
											day={day}
											exercisesCatalog={exercises}
											expandedMap={expandedMapByDay[dayId] ?? {}}
											onToggleExpand={handleToggleExpandByKey}
											onRemoveExercise={handleRemoveExercise}
											onReorderExercises={handleReorderExercises}
											onUpdateExercise={updateExercise}
											onUpdateRestTime={(exerciseIndex, value) =>
												setRestSeconds(exerciseIndex, parseTime(value))
											}
											onUpdateNote={updateExerciseNote}
											onUpdateProgressionScheme={updateProgressionScheme}
											onUpdateMinWeightIncrement={updateMinWeightIncrement}
											onUpdateProgramTMKg={updateProgramTMKg}
											onUpdateProgramRoundingKg={updateProgramRoundingKg}
											onAddSet={addSet}
											onRemoveSetAnimated={(exIdx, setIdx) => {
												const key = `${exIdx}-${setIdx}`
												setRemovingSets(prev => ({
													...prev,
													[key]: true,
												}))
												setTimeout(() => {
													removeSet(exIdx, setIdx)
													setRemovingSets(prev => {
														const next = { ...prev }
														delete next[key]
														return next
													})
												}, 180)
											}}
											onUpdateSet={updateSet}
											onValidateMinMaxReps={validateMinMaxReps}
											onStepFixedReps={stepFixedReps}
											onStepRangeReps={stepRangeReps}
											onStepWeight={stepWeight}
											isRemovingSet={(exIdx, setIdx) =>
												!!removingSets[`${exIdx}-${setIdx}`]
											}
											disableTimeBasedProgressions={!canUseTimeframe}
											registerRef={registerExerciseRef}
											exercises={exercises}
											isExercisesLoading={exercisesLoading}
										/>
									</CardContent>
								</Card>
							</TabsContent>
						)
					})}
				</Tabs>

				{/* RtF Program Start Week */}
				{(() => {
					const usesRtf = data.days.some(d =>
						d.exercises.some(
							ex =>
								ex.progressionScheme === 'PROGRAMMED_RTF' ||
								ex.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY',
						),
					)
					const totalWeeks = (data.programWithDeloads ? 21 : 18) as 18 | 21

					if (!usesRtf || isEditing) return null

					return (
						<div className="mt-6 p-4 bg-muted/30 rounded-lg">
							<div className="flex items-center justify-between gap-3">
								<div>
									<span className="text-sm font-medium">
										Start program at week
									</span>
									<p className="text-xs text-muted-foreground mt-0.5">
										Choose which week to begin this {totalWeeks}-week program
									</p>
								</div>
								<Select
									value={String(
										Math.min(
											Math.max(data.programStartWeek ?? 1, 1),
											totalWeeks,
										),
									)}
									onValueChange={value =>
										onUpdate({
											programStartWeek: parseInt(value, 10),
											programStartWeekExplicit: true,
										})
									}
								>
									<SelectTrigger
										aria-label="Program start week"
										className="w-40 h-9 text-sm"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Array.from(
											{ length: totalWeeks },
											(_, index) => index + 1,
										).map(week => (
											<SelectItem key={week} value={String(week)}>
												Week {week} of {totalWeeks}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)
				})()}
			</div>
		</div>
	)
}
