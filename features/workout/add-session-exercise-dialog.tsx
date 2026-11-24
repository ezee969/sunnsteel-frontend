'use client'

import type {
	AddSessionExerciseRequest,
	AddSessionExerciseSet,
} from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { ExerciseConfigSection } from '@/features/routines/wizard/components/ExerciseConfigSection'
import { ExercisePickerDropdown } from '@/features/routines/wizard/components/ExercisePickerDropdown'
import { SetListSection } from '@/features/routines/wizard/components/SetListSection'
import { useExerciseCardState } from '@/features/routines/wizard/hooks/useExerciseCardState'
import { useRoutineDayMutations } from '@/features/routines/wizard/hooks/useRoutineDayMutations'
import type {
	RoutineWizardData,
	RoutineWizardExercise,
} from '@/features/routines/wizard/types'
import { usesAdvancedOptions } from '@/features/routines/wizard/utils/advanced-options'
import { routineSetRequest } from '@/features/routines/wizard/utils/routine-summary'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import { useExercises } from '@/lib/api/hooks'
import { useAddSessionExercise } from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types'
import { pickableExercises } from '@/lib/utils/custom-exercises'
import { matchesExerciseName } from '@/lib/utils/exercise-catalog'
import { parseTime } from '@/lib/utils/time'

/** The most rest the server takes for an exercise added here, in seconds. */
const REST_MAX_SECONDS = 600

/**
 * The added exercise lives in a one-day builder draft, so the builder's own
 * mutations -- sets, rep ranges, kinds, RIR, rest, progression -- edit it
 * exactly as Build Days does.
 */
const EMPTY_DRAFT: RoutineWizardData = {
	name: '',
	scheduleMode: 'WEEKLY',
	trainingDays: [0],
	restDays: [],
	rotationWeekdays: [],
	days: [{ slot: 0, exercises: [] }],
}

type AddableScheme = AddSessionExerciseRequest['progressionScheme']

/** The draft's exercise as the add route takes it. */
const addRequest = (
	exercise: RoutineWizardExercise,
): AddSessionExerciseRequest => ({
	exerciseId: exercise.exerciseId,
	restSeconds: Math.min(exercise.restSeconds, REST_MAX_SECONDS),
	// The dialog never offers an 8-week block (`allowLinear={false}`).
	progressionScheme: exercise.progressionScheme as AddableScheme,
	minWeightIncrement: exercise.minWeightIncrement,
	...(exercise.note?.trim() ? { note: exercise.note.trim() } : {}),
	sets: exercise.sets.map(
		set => routineSetRequest(exercise, set) as AddSessionExerciseSet,
	),
})

interface AddSessionExerciseDialogProps {
	sessionId: string
	open: boolean
	onOpenChange: (open: boolean) => void
	/** The plan the exercise joins: a block's or deload's copy while one is in force. */
	plan: string
}

/**
 * LIVE-25: add an exercise to the day being trained, for good. It joins the
 * plan in force at the end of the day -- the move controls take it from
 * there -- and today's workout at once. The builder's picker chooses it and
 * the builder's own exercise editor prescribes it (sets, rep ranges, kinds and
 * RIR, rest and progression under More options), so it reads the same as in
 * Build Days. An exercise for today only is not offered.
 */
export function AddSessionExerciseDialog({
	sessionId,
	open,
	onOpenChange,
	plan,
}: AddSessionExerciseDialogProps) {
	const t = useTranslations('workout.addExercise')
	const tEx = useTranslations('catalog.exercises')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const weightUnit = useWeightUnit()
	const { data: exercises, isLoading } = useExercises()
	const add = useAddSessionExercise(sessionId)
	const pickerRef = useRef<HTMLDivElement>(null)

	const [pickerOpen, setPickerOpen] = useState(false)
	const [changing, setChanging] = useState(false)
	const [search, setSearch] = useState('')
	const [draft, setDraft] = useState<RoutineWizardData>(EMPTY_DRAFT)

	const mutations = useRoutineDayMutations({
		data: draft,
		onUpdate: updates => setDraft(current => ({ ...current, ...updates })),
		selectedDayIndex: 0,
		trainingDays: draft.trainingDays,
		weightUnit,
	})

	const label = useMemo(() => (name: string) => exerciseLabel(name, tEx), [tEx])
	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase()
		const pickable = pickableExercises(exercises ?? [])
		return query
			? pickable.filter(exercise =>
					matchesExerciseName(exercise.name, query, label),
				)
			: pickable
	}, [exercises, search, label])

	const draftExercise = draft.days[0]?.exercises[0]
	const chosen = draftExercise
		? (exercises ?? []).find(
				exercise => exercise.id === draftExercise.exerciseId,
			)
		: undefined
	const picking = !draftExercise || changing

	const reset = () => {
		setPickerOpen(false)
		setChanging(false)
		setSearch('')
		setDraft(EMPTY_DRAFT)
	}
	const close = (next: boolean) => {
		if (add.isPending) return
		if (!next) reset()
		onOpenChange(next)
	}

	const choose = (id: string) => {
		// Changing keeps the sets and options already written, as the
		// builder's own change does.
		if (draftExercise) mutations.updateExercise(0, id)
		else mutations.addExercise(id)
		setPickerOpen(false)
		setChanging(false)
		setSearch('')
	}

	const submit = () => {
		if (!draftExercise || !chosen) return
		add.mutate(addRequest(draftExercise), {
			onSuccess: () => {
				push({
					title: t('addedTitle', { exercise: label(chosen.name) }),
					description: t('addedDescription', {
						plan: plan[0].toUpperCase() + plan.slice(1),
					}),
					variant: 'success',
				})
				reset()
				onOpenChange(false)
			},
			onError: error =>
				push({
					title: t('failedTitle'),
					description: errorText(error),
					variant: 'destructive',
				}),
		})
	}

	return (
		<Dialog open={open} onOpenChange={close}>
			<DialogContent className="flex h-[min(40rem,calc(100dvh-2rem))] flex-col sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
					<DialogDescription>{t('description', { plan })}</DialogDescription>
				</DialogHeader>

				{/* The one scrolling region: the title and the actions stay put
				    whatever the sets need (the inset keeps focus rings visible). */}
				<div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
					<div
						className={
							picking
								? 'flex min-h-0 flex-1 flex-col gap-2'
								: 'flex flex-col gap-2'
						}
					>
						<Label>{t('exerciseLabel')}</Label>
						{picking ? (
							<ExercisePickerDropdown
								ref={pickerRef}
								inline
								isOpen={pickerOpen}
								onToggle={() => {
									// Closing the picker mid-change goes back to the exercise.
									if (pickerOpen && draftExercise) setChanging(false)
									setPickerOpen(value => !value)
								}}
								onClose={() => setPickerOpen(false)}
								searchValue={search}
								onSearchChange={setSearch}
								exercises={filtered}
								isLoading={isLoading}
								onSelect={choose}
							/>
						) : (
							<div className="flex items-center justify-between gap-3 border-y border-rule-faint py-2">
								<span className="text-sm font-medium text-foreground">
									{chosen ? label(chosen.name) : null}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setChanging(true)
										setPickerOpen(true)
									}}
								>
									{t('change')}
								</Button>
							</div>
						)}
					</div>

					{draftExercise && !picking ? (
						<>
							<AddedExerciseEditor
								exercise={draftExercise}
								exerciseData={chosen}
								weightUnit={weightUnit}
								mutations={mutations}
							/>
							<p className="type-body-sm text-ink-3">{t('endNote')}</p>
						</>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => close(false)}
						disabled={add.isPending}
					>
						{t('cancel')}
					</Button>
					<Button
						type="button"
						onClick={submit}
						disabled={!chosen || picking || add.isPending}
					>
						{add.isPending ? t('adding') : t('add')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

/**
 * The Build Days exercise editor (`WizardExerciseCard`'s body) for the one
 * exercise being added: its options and its sets, with More options folding
 * as the builder folds them (UX-20).
 */
function AddedExerciseEditor({
	exercise,
	exerciseData,
	weightUnit,
	mutations,
}: {
	exercise: RoutineWizardExercise
	exerciseData?: Exercise
	weightUnit: ReturnType<typeof useWeightUnit>
	mutations: ReturnType<typeof useRoutineDayMutations>
}) {
	const tEx = useTranslations('catalog.exercises')
	const tCard = useTranslations('routines.exerciseCard')
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
		exerciseIndex: 0,
		tabIndex: 0,
		onAddSet: mutations.addSet,
		onUpdateMinWeightIncrement: mutations.updateMinWeightIncrement,
		weightUnit,
	})
	// UX-20 (§23.6): folded unless something folded is in use.
	const inUse = usesAdvancedOptions(exercise)
	const [opened, setOpened] = useState(false)
	const advanced = inUse || opened
	const exerciseName = exerciseData?.name
		? exerciseLabel(exerciseData.name, tEx)
		: tCard('thisExercise')

	return (
		<div>
			<ExerciseConfigSection
				exercise={exercise}
				exerciseIndex={0}
				weightIncInput={weightIncInput}
				weightUnit={weightUnit}
				onWeightIncChange={handleWeightIncChange}
				onWeightIncBlur={handleWeightIncBlur}
				onUpdateRestTime={(index, value) =>
					mutations.setRestSeconds(index, parseTime(value))
				}
				onUpdateNote={mutations.updateExerciseNote}
				onUpdateProgressionScheme={mutations.updateProgressionScheme}
				advanced={advanced}
				onToggleAdvanced={inUse ? null : () => setOpened(value => !value)}
				exerciseName={exerciseName}
				rotation={false}
				onSetLinearPeriodization={mutations.setLinearPeriodization}
				allowLinear={false}
			/>
			<SetListSection
				advanced={advanced}
				weightUnit={weightUnit}
				exercise={exercise}
				exerciseIndex={0}
				tabIndex={0}
				setsExpanded={setsExpanded}
				onToggleSets={toggleSetsExpanded}
				onAddSet={handleAddSet}
				exerciseName={exerciseName}
				equipmentRequired={exerciseData?.equipmentRequired}
				onReplaceWarmUps={(warmUps, followLoad) =>
					mutations.replaceWarmUps(0, warmUps, followLoad)
				}
				onSetWarmUpsFollowLoad={followLoad =>
					mutations.setWarmUpsFollowLoad(0, followLoad)
				}
				registerSetRowRef={registerSetRowRef}
				onUpdateSet={mutations.updateSet}
				onValidateMinMaxReps={mutations.validateMinMaxReps}
				onStepFixedReps={mutations.stepFixedReps}
				onStepRangeReps={mutations.stepRangeReps}
				onStepWeight={mutations.stepWeight}
				onRemoveSetAnimated={mutations.removeSet}
				isRemovingSet={() => false}
				warmUpTools={false}
			/>
		</div>
	)
}
