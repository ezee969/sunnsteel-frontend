'use client'

import type { AddSessionExerciseSet } from '@sunsteel/contracts'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ExercisePickerDropdown } from '@/features/routines/wizard/components/ExercisePickerDropdown'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import { useExercises } from '@/lib/api/hooks'
import { useAddSessionExercise } from '@/lib/api/hooks/useWorkoutSession'
import { pickableExercises } from '@/lib/utils/custom-exercises'
import { sanitizeDecimalInput } from '@/lib/utils/decimal-input'
import { matchesExerciseName } from '@/lib/utils/exercise-catalog'
import { getWeightUnitLabel, parseWeightInput } from '@/lib/utils/weight-unit'

type Scheme = 'NONE' | 'DOUBLE_PROGRESSION' | 'DYNAMIC_DOUBLE_PROGRESSION'

const clampInt = (
	value: string,
	min: number,
	max: number,
	fallback: number,
) => {
	const parsed = Number.parseInt(value, 10)
	return Number.isFinite(parsed)
		? Math.min(max, Math.max(min, parsed))
		: fallback
}

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
 * there -- and today's workout at once. The builder's picker chooses it; its
 * sets are asked for the way the builder asks, with rest and progression
 * under More options (UX-20). An exercise for today only is not offered.
 */
export function AddSessionExerciseDialog({
	sessionId,
	open,
	onOpenChange,
	plan,
}: AddSessionExerciseDialogProps) {
	const t = useTranslations('workout.addExercise')
	const tEx = useTranslations('catalog.exercises')
	const tScheme = useTranslations('workout.addExercise.schemes')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const unit = useWeightUnit()
	const { data: exercises, isLoading } = useExercises()
	const add = useAddSessionExercise(sessionId)
	const pickerRef = useRef<HTMLDivElement>(null)

	const [pickerOpen, setPickerOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [exerciseId, setExerciseId] = useState<string | null>(null)
	const [sets, setSets] = useState('3')
	const [reps, setReps] = useState('10')
	const [weight, setWeight] = useState('')
	const [more, setMore] = useState(false)
	const [rest, setRest] = useState('90')
	const [scheme, setScheme] = useState<Scheme>('NONE')

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
	const chosen = (exercises ?? []).find(exercise => exercise.id === exerciseId)

	const reset = () => {
		setPickerOpen(false)
		setSearch('')
		setExerciseId(null)
		setSets('3')
		setReps('10')
		setWeight('')
		setMore(false)
		setRest('90')
		setScheme('NONE')
	}
	const close = (next: boolean) => {
		if (add.isPending) return
		if (!next) reset()
		onOpenChange(next)
	}

	const submit = () => {
		if (!chosen) return
		const count = clampInt(sets, 1, 10, 3)
		const repsValue = clampInt(reps, 1, 50, 10)
		const weightKg = parseWeightInput(weight, unit)
		const prescription: AddSessionExerciseSet[] = Array.from(
			{ length: count },
			(_, index) => ({
				setNumber: index + 1,
				repType: 'FIXED',
				reps: repsValue,
				weight: weightKg ?? null,
				kind: 'WORKING',
			}),
		)
		add.mutate(
			{
				exerciseId: chosen.id,
				restSeconds: clampInt(rest, 0, 600, 90),
				progressionScheme: scheme,
				sets: prescription,
			},
			{
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
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={close}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
					<DialogDescription>{t('description', { plan })}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{t('exerciseLabel')}</Label>
						{chosen ? (
							<div className="flex items-center justify-between gap-3 border-y border-rule-faint py-2">
								<span className="text-sm font-medium text-foreground">
									{label(chosen.name)}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setExerciseId(null)
										setPickerOpen(true)
									}}
								>
									{t('change')}
								</Button>
							</div>
						) : (
							<ExercisePickerDropdown
								ref={pickerRef}
								inline
								isOpen={pickerOpen}
								onToggle={() => setPickerOpen(value => !value)}
								onClose={() => setPickerOpen(false)}
								searchValue={search}
								onSearchChange={setSearch}
								exercises={filtered}
								isLoading={isLoading}
								onSelect={id => {
									setExerciseId(id)
									setPickerOpen(false)
								}}
							/>
						)}
					</div>

					{chosen ? (
						<>
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-1">
									<Label htmlFor="add-exercise-sets">{t('sets')}</Label>
									<Input
										id="add-exercise-sets"
										inputMode="numeric"
										value={sets}
										onChange={event =>
											setSets(event.target.value.replace(/[^0-9]/g, ''))
										}
										className="text-center"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="add-exercise-reps">{t('reps')}</Label>
									<Input
										id="add-exercise-reps"
										inputMode="numeric"
										value={reps}
										onChange={event =>
											setReps(event.target.value.replace(/[^0-9]/g, ''))
										}
										className="text-center"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="add-exercise-weight">
										{t('weight', { unit: getWeightUnitLabel(unit) })}
									</Label>
									<Input
										id="add-exercise-weight"
										inputMode="decimal"
										autoComplete="off"
										placeholder="0"
										value={weight}
										onChange={event =>
											setWeight(sanitizeDecimalInput(event.target.value))
										}
										className="text-center"
									/>
								</div>
							</div>

							<Button
								type="button"
								variant="link"
								className="type-body-sm h-auto p-0"
								aria-expanded={more}
								onClick={() => setMore(value => !value)}
							>
								{more ? t('fewerOptions') : t('moreOptions')}
							</Button>
							{more ? (
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label htmlFor="add-exercise-rest">{t('rest')}</Label>
										<Input
											id="add-exercise-rest"
											inputMode="numeric"
											value={rest}
											onChange={event =>
												setRest(event.target.value.replace(/[^0-9]/g, ''))
											}
											className="text-center"
										/>
									</div>
									<div className="space-y-1">
										<Label>{t('progression')}</Label>
										<Select
											value={scheme}
											onValueChange={value => setScheme(value as Scheme)}
										>
											<SelectTrigger aria-label={t('progression')}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{(
													[
														'NONE',
														'DOUBLE_PROGRESSION',
														'DYNAMIC_DOUBLE_PROGRESSION',
													] as const
												).map(option => (
													<SelectItem key={option} value={option}>
														{tScheme(option)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							) : null}
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
						disabled={!chosen || add.isPending}
					>
						{add.isPending ? t('adding') : t('add')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
