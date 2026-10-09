'use client'

import { ROUTINE_DAY_NAME_MAX } from '@sunsteel/contracts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

import { GlossaryLine } from '@/components/layout/glossary-line'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useExercises } from '@/lib/api/hooks'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import { defaultTrainingLocation } from '@/lib/utils/exercise-equipment'
import { linksAfterReorder, withLinks } from '@/lib/utils/exercise-links'
import { parseTime } from '@/lib/utils/time'

import { ExerciseList } from './components/ExerciseList'
import { ExercisePickerDropdown } from './components/ExercisePickerDropdown'
import { useRoutineDayMutations } from './hooks/useRoutineDayMutations'
import { useRoutineDaySelection } from './hooks/useRoutineDaySelection'
import { RoutineWizardData } from './types'
import { renameWizardDay, wizardDayLabel } from './utils/schedule'
import { builderWarmUpEquipment } from './utils/set-kinds'

interface BuildDaysProps {
	data: RoutineWizardData
	onUpdate: (updates: Partial<RoutineWizardData>) => void
	isEditing?: boolean
}

/**
 * Render the training-day builder UI used by the routine wizard.
 *
 * Renders tabs for each selected training day, per-day cards that list and manage exercises
 * (add, remove, reorder-agnostic operations), controls for progression, sets, reps, weights,
 * and an exercise picker that scrolls newly added exercises into view.
 *
 * @param data - Current routine wizard state used to populate days and exercises
 * @param onUpdate - Callback invoked with partial updates to the RoutineWizardData
 * @returns A JSX element containing the training-days builder interface
 */
export function BuildDays({ data, onUpdate }: BuildDaysProps) {
	const t = useTranslations('routines.builder')
	const [expandedMapByDay, setExpandedMapByDay] = useState<
		Record<number, Record<string, boolean>>
	>({})
	const [removingSets, setRemovingSets] = useState<Record<string, boolean>>({})
	const exerciseRefs = useRef<Record<string, HTMLElement | null>>({})
	const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null)
	const { data: exercises, isLoading: exercisesLoading } = useExercises()
	// LIVE-20: following warm-ups load from the default gym, as on the server.
	const { data: locations } = useTrainingLocations()
	const weightUnit = useWeightUnit()

	// Fade hints on the day-tabs scroll container so it's clear there are
	// more tabs off-screen when the list overflows (e.g. 4+ training days).
	const dayTabsRef = useRef<HTMLDivElement>(null)
	const [dayTabsOverflow, setDayTabsOverflow] = useState({
		left: false,
		right: false,
	})

	const updateDayTabsOverflow = useCallback(() => {
		const el = dayTabsRef.current
		if (!el) return
		setDayTabsOverflow({
			left: el.scrollLeft > 4,
			right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
		})
	}, [])

	useEffect(() => {
		updateDayTabsOverflow()
		const el = dayTabsRef.current
		if (!el) return

		el.addEventListener('scroll', updateDayTabsOverflow, { passive: true })
		const resizeObserver = new ResizeObserver(updateDayTabsOverflow)
		resizeObserver.observe(el)

		return () => {
			el.removeEventListener('scroll', updateDayTabsOverflow)
			resizeObserver.disconnect()
		}
	}, [updateDayTabsOverflow, data.trainingDays.length])

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
		updateProgressionScheme,
		updateMinWeightIncrement,
		addSet,
		replaceWarmUps,
		setWarmUpsFollowLoad,
		setLinkedToNext,
		removeSet,
		stepFixedReps,
		stepRangeReps,
		stepWeight,
		updateSet,
		validateMinMaxReps,
		setRestSeconds,
		setLinearPeriodization,
	} = useRoutineDayMutations({
		data,
		onUpdate,
		selectedDayIndex: selectedDay,
		trainingDays: data.trainingDays,
		weightUnit,
		warmUpEquipment: exercise =>
			builderWarmUpEquipment({
				equipmentRequired: exercises?.find(e => e.id === exercise.exerciseId)
					?.equipmentRequired,
				gym: defaultTrainingLocation(locations),
				unit: weightUnit,
				incrementKg: exercise.minWeightIncrement,
			}),
	})

	// Note: we compute day-specific data on-demand below to avoid stale references

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
		(key: string, node: HTMLElement | null) => {
			exerciseRefs.current[key] = node
		},
		[],
	)

	const selectedDayId = data.trainingDays[selectedDay]
	const selectedDayData = data.days.find(d => d.slot === selectedDayId)
	const selectedDayExercisesCount = selectedDayData?.exercises?.length ?? 0
	const selectedDaySetsCount =
		selectedDayData?.exercises?.reduce(
			(sum, ex) => sum + (ex.sets?.length ?? 0),
			0,
		) ?? 0

	// ROUT-11: a day's tab and title use its name, else its weekday or rotation letter.
	const labelFor = (slot: number, index: number) =>
		wizardDayLabel(
			data.scheduleMode,
			data.days.find(d => d.slot === slot) ?? { slot },
			index,
		)

	if (data.trainingDays.length === 0) {
		return (
			<div className="text-center py-8 text-ink-3">
				<p>{t('noTrainingDays')}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="type-section mb-4 text-foreground">
					{t('buildYourDays')}
					<span className="text-destructive ml-1">*</span>
				</h3>

				{/* Overall Stats. v1.1: a ruled band, as the dashboard's (§25.3) --
				    a rule above and below, hairlines between -- rather than three
				    translucent boxed tiles with bold primary numbers. */}
				<dl className="mb-4 grid grid-cols-3 border-y border-rule">
					<div className="flex flex-col-reverse px-2 py-2 text-center sm:py-3">
						<dt className="type-label text-ink-3">{t('statExercises')}</dt>
						<dd className="mb-1 type-data type-data-strong text-base text-foreground">
							{selectedDayExercisesCount}
						</dd>
					</div>
					<div className="flex flex-col-reverse border-l border-rule-faint px-2 py-2 text-center sm:py-3">
						<dt className="type-label text-ink-3">{t('statSets')}</dt>
						<dd className="mb-1 type-data type-data-strong text-base text-foreground">
							{selectedDaySetsCount}
						</dd>
					</div>
					<div className="flex flex-col-reverse border-l border-rule-faint px-2 py-2 text-center sm:py-3">
						<dt className="type-label text-ink-3">{t('statDaysReady')}</dt>
						<dd className="mb-1 type-data type-data-strong text-base text-foreground">
							{data.days.filter(day => day.exercises.length > 0).length}/
							{data.days.length}
						</dd>
					</div>
				</dl>

				{/* Day Tabs */}
				<Tabs
					value={selectedDay.toString()}
					onValueChange={(value: string) => setSelectedDay(parseInt(value))}
				>
					<div className="relative mb-2">
						<TabsList
							ref={dayTabsRef}
							className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap"
						>
							{data.trainingDays.map((dayId, index) => (
								<TabsTrigger
									key={dayId}
									value={index.toString()}
									className="flex-shrink-0 whitespace-nowrap px-4"
								>
									{labelFor(dayId, index)}
									<Badge
										variant="secondary"
										className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center px-1 leading-none"
									>
										{data.days.find(d => d.slot === dayId)?.exercises?.length ??
											0}
									</Badge>
								</TabsTrigger>
							))}
						</TabsList>
						{/* UX-24: §4.3 rule 6 allows no gradient, so the cue that more
						    days sit off the edge is a chevron on an opaque patch. */}
						{dayTabsOverflow.left && (
							<div
								aria-hidden
								className="pointer-events-none absolute inset-y-0 left-0 mb-1 flex w-6 items-center justify-start bg-background"
							>
								<ChevronLeft aria-hidden className="size-4 text-ink-3" />
							</div>
						)}
						{dayTabsOverflow.right && (
							<div
								aria-hidden
								className="pointer-events-none absolute inset-y-0 right-0 mb-1 flex w-6 items-center justify-end bg-background"
							>
								<ChevronRight aria-hidden className="size-4 text-ink-3" />
							</div>
						)}
					</div>

					{data.trainingDays.map((dayId, tabIndex) => {
						const day = data.days.find(d => d.slot === dayId)

						const handleReorderExercises = (
							newExercises: RoutineWizardData['days'][number]['exercises'],
						) => {
							// Persist reorder at the wizard-state level (array order).
							// ROUT-12: a link stands only while its pair stays together.
							const previous =
								data.days.find(d => d.slot === dayId)?.exercises ?? []
							const relinked = withLinks(
								newExercises,
								linksAfterReorder(previous, newExercises),
							)
							const newDays = data.days.map(d =>
								d.slot === dayId ? { ...d, exercises: relinked } : d,
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
								{/* UX-25 (§28.3): a day is a ruled section; its exercises are
								    the boxes. */}
								<div>
									<div className="flex flex-col items-start justify-between gap-3 border-b border-rule pb-3 sm:flex-row sm:items-center">
										<h3 className="type-panel text-foreground">
											{t('dayWorkout', { day: labelFor(dayId, tabIndex) })}
										</h3>
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
									</div>
									<div className="pt-4">
										<div className="mb-4 max-w-sm space-y-2">
											<Label htmlFor={`day-name-${dayId}`}>
												{t('dayNameOptional')}
											</Label>
											<Input
												id={`day-name-${dayId}`}
												value={day?.name ?? ''}
												maxLength={ROUTINE_DAY_NAME_MAX}
												placeholder={
													data.scheduleMode === 'ROTATION'
														? t('dayNamePlaceholderRotation')
														: t('dayNamePlaceholderWeekly')
												}
												onChange={event =>
													onUpdate(
														renameWizardDay(data, dayId, event.target.value),
													)
												}
											/>
										</div>
										<GlossaryLine
											terms={['rir', 'progression', 'setKinds']}
											className="mb-3"
										/>
										<ExerciseList
											weightUnit={weightUnit}
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
											rotation={data.scheduleMode === 'ROTATION'}
											onSetLinearPeriodization={setLinearPeriodization}
											onAddSet={addSet}
											onReplaceWarmUps={replaceWarmUps}
											onSetWarmUpsFollowLoad={setWarmUpsFollowLoad}
											onSetLinkedToNext={setLinkedToNext}
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
											registerRef={registerExerciseRef}
											exercises={exercises}
											isExercisesLoading={exercisesLoading}
										/>
									</div>
								</div>
							</TabsContent>
						)
					})}
				</Tabs>
			</div>
		</div>
	)
}
