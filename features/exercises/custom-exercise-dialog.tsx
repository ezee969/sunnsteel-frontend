'use client'

import {
	CUSTOM_EXERCISE_NAME_MAX,
	CUSTOM_EXERCISE_NOTE_MAX,
	EXERCISE_EQUIPMENT,
	EXERCISE_MECHANICS,
	type ExerciseMechanic,
	MOVEMENT_PATTERNS,
	type MovementPattern,
	MUSCLE_GROUPS,
	type MuscleGroup,
} from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import {
	useCreateCustomExercise,
	useExercises,
	useUpdateCustomExercise,
} from '@/lib/api/hooks/useExercises'
import type { Exercise } from '@/lib/api/types/exercise.type'
import {
	customExerciseCopy,
	type CustomExerciseDraft,
	customExerciseDraftProblem,
	type CustomExerciseField,
	customExerciseInput,
	draftFromExercise,
	emptyCustomExerciseDraft,
	toggleIn,
	toggleMuscle,
} from '@/lib/utils/custom-exercises'
import {
	mechanicLabel,
	movementPatternLabel,
} from '@/lib/utils/exercise-catalog'
import { equipmentLabel } from '@/lib/utils/exercise-equipment'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'
import { remainingCharacters } from '@/lib/utils/session-notes'

function CheckboxGroup<T extends string>({
	legend,
	values,
	selected,
	label,
	onToggle,
	problemId,
}: {
	legend: string
	values: readonly T[]
	selected: readonly T[]
	label: (value: T) => string
	onToggle: (value: T) => void
	/** Set while the group holds the problem stopping the save. */
	problemId?: string
}) {
	const id = useId()
	return (
		<fieldset
			className="space-y-2"
			aria-invalid={problemId ? true : undefined}
			aria-describedby={problemId}
		>
			<legend className="type-body-sm text-ink-3">{legend}</legend>
			<div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
				{values.map(value => (
					<div key={value} className="flex items-center gap-2">
						<Checkbox
							id={`${id}-${value}`}
							checked={selected.includes(value)}
							onCheckedChange={() => onToggle(value)}
						/>
						<Label htmlFor={`${id}-${value}`} className="font-normal">
							{label(value)}
						</Label>
					</div>
				))}
			</div>
		</fieldset>
	)
}

/**
 * EXER-06: create or edit one of the member's own exercises. The same checks
 * the server makes run here first, so a refusal is explained before it is
 * sent; the server still decides.
 */
export function CustomExerciseDialog({
	open,
	onOpenChange,
	exercise,
	initialName,
	onSaved,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** The exercise being edited; absent to create one. */
	exercise?: Exercise
	/** A starting name, from a search that found nothing. */
	initialName?: string
	onSaved?: (exercise: Exercise) => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{open ? (
				<CustomExerciseForm
					exercise={exercise}
					initialName={initialName}
					onClose={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			) : null}
		</Dialog>
	)
}

function CustomExerciseForm({
	exercise,
	initialName,
	onClose,
	onSaved,
}: {
	exercise?: Exercise
	initialName?: string
	onClose: () => void
	onSaved?: (exercise: Exercise) => void
}) {
	const t = useTranslations('catalog.exercisesUi')
	const tNotes = useTranslations('workout.notes')
	const tMuscles = useTranslations('routines.muscles')
	const tCustom = useTranslations('routines.customExercise')
	const tEquipment = useTranslations('routines.equipment')
	const copy = customExerciseCopy(tCustom)
	const [draft, setDraft] = useState<CustomExerciseDraft>(() =>
		exercise
			? draftFromExercise(exercise)
			: emptyCustomExerciseDraft(initialName?.trim() ?? ''),
	)
	const [attempted, setAttempted] = useState(false)
	const { data: exercises = [] } = useExercises()
	const create = useCreateCustomExercise()
	const update = useUpdateCustomExercise()
	const pending = create.isPending || update.isPending
	const nameId = useId()
	const patternId = useId()
	const mechanicId = useId()
	const noteId = useId()
	const noteCountId = useId()
	const problemId = useId()

	const problem = useMemo(
		() => customExerciseDraftProblem(draft, exercises, tCustom, exercise?.id),
		[draft, exercises, exercise?.id, tCustom],
	)
	const shownProblem = attempted ? problem : null
	const problemFor = (field: CustomExerciseField) =>
		shownProblem?.field === field ? problemId : undefined

	const save = () => {
		setAttempted(true)
		if (problem) return
		const input = customExerciseInput(draft)
		const done = (saved: Exercise) => {
			onSaved?.(saved)
			onClose()
		}
		if (exercise) {
			update.mutate({ id: exercise.id, patch: input }, { onSuccess: done })
		} else {
			create.mutate(input, { onSuccess: done })
		}
	}

	return (
		<DialogContent
			className="max-h-[90vh] max-w-2xl overflow-y-auto"
			onInteractOutside={event => {
				if (pending) event.preventDefault()
			}}
			onEscapeKeyDown={event => {
				if (pending) event.preventDefault()
			}}
		>
			<DialogHeader>
				<DialogTitle>
					{exercise ? copy.editTitle : copy.createTitle}
				</DialogTitle>
				<DialogDescription>
					{copy.description}
					{exercise ? ` ${copy.editNote}` : ''}
				</DialogDescription>
			</DialogHeader>

			<form
				className="space-y-5"
				noValidate
				onSubmit={event => {
					event.preventDefault()
					save()
				}}
			>
				<div className="space-y-1">
					<Label htmlFor={nameId} className="type-body-sm text-ink-3">
						{t('name')}
					</Label>
					<Input
						id={nameId}
						value={draft.name}
						maxLength={CUSTOM_EXERCISE_NAME_MAX + 20}
						autoComplete="off"
						aria-invalid={problemFor('name') ? true : undefined}
						aria-describedby={problemFor('name')}
						onChange={event =>
							setDraft(current => ({ ...current, name: event.target.value }))
						}
					/>
				</div>

				<CheckboxGroup<MuscleGroup>
					legend={t('primaryMuscles')}
					values={MUSCLE_GROUPS}
					selected={draft.primaryMuscles}
					label={muscle => getFriendlyMuscleName(muscle, tMuscles)}
					problemId={problemFor('primaryMuscles')}
					onToggle={muscle =>
						setDraft(current => toggleMuscle(current, 'primary', muscle))
					}
				/>
				<CheckboxGroup<MuscleGroup>
					legend={t('secondaryLegend')}
					values={MUSCLE_GROUPS}
					selected={draft.secondaryMuscles}
					label={muscle => getFriendlyMuscleName(muscle, tMuscles)}
					problemId={problemFor('secondaryMuscles')}
					onToggle={muscle =>
						setDraft(current => toggleMuscle(current, 'secondary', muscle))
					}
				/>
				<CheckboxGroup
					legend={t('equipmentNeeded')}
					values={EXERCISE_EQUIPMENT}
					selected={draft.equipmentRequired}
					label={value => equipmentLabel(value, tEquipment)}
					problemId={problemFor('equipmentRequired')}
					onToggle={item =>
						setDraft(current => ({
							...current,
							equipmentRequired: toggleIn(current.equipmentRequired, item),
						}))
					}
				/>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-1">
						<Label htmlFor={patternId} className="type-body-sm text-ink-3">
							{t('movementPatternOptional')}
						</Label>
						<NativeSelect
							id={patternId}
							value={draft.movementPattern ?? ''}
							onChange={event =>
								setDraft(current => ({
									...current,
									movementPattern:
										(event.target.value as MovementPattern) || null,
								}))
							}
						>
							<option value="">{t('notSpecified')}</option>
							{MOVEMENT_PATTERNS.map(pattern => (
								<option key={pattern} value={pattern}>
									{movementPatternLabel(t, pattern)}
								</option>
							))}
						</NativeSelect>
					</div>
					<div className="space-y-1">
						<Label htmlFor={mechanicId} className="type-body-sm text-ink-3">
							{t('compoundOrIsolation')}
						</Label>
						<NativeSelect
							id={mechanicId}
							value={draft.mechanic ?? ''}
							onChange={event =>
								setDraft(current => ({
									...current,
									mechanic: (event.target.value as ExerciseMechanic) || null,
								}))
							}
						>
							<option value="">{t('notSpecified')}</option>
							{EXERCISE_MECHANICS.map(mechanic => (
								<option key={mechanic} value={mechanic}>
									{mechanicLabel(t, mechanic)}
								</option>
							))}
						</NativeSelect>
					</div>
				</div>

				<div className="space-y-1">
					<Label htmlFor={noteId} className="type-body-sm text-ink-3">
						{t('noteOptional')}
					</Label>
					<Textarea
						id={noteId}
						value={draft.note}
						rows={3}
						maxLength={CUSTOM_EXERCISE_NOTE_MAX}
						aria-invalid={problemFor('note') ? true : undefined}
						aria-describedby={[noteCountId, problemFor('note')]
							.filter(Boolean)
							.join(' ')}
						onChange={event =>
							setDraft(current => ({ ...current, note: event.target.value }))
						}
					/>
					<p id={noteCountId} className="type-body-sm text-ink-3">
						{copy.noteHint}{' '}
						{remainingCharacters(draft.note, CUSTOM_EXERCISE_NOTE_MAX, tNotes)}
					</p>
				</div>

				{shownProblem ? (
					<p id={problemId} role="alert" className="type-body-sm text-ink">
						{shownProblem.message}
					</p>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={pending}
					>
						{t('cancel')}
					</Button>
					<Button type="submit" disabled={pending}>
						{pending ? (
							<Loader2 className="size-4 animate-spin" aria-hidden />
						) : null}
						{exercise ? t('saveChanges') : t('createExercise')}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	)
}
