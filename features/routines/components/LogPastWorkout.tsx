'use client'

import { LP_BLOCK_STEPS, type Routine } from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

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
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useLogPastWorkout } from '@/lib/api/hooks/useWorkoutSession'
import {
	buildLoggedWorkoutRequest,
	defaultLoggedDate,
	loggableDateRange,
	loggableDays,
	loggedDraftForDay,
	type LoggedWorkoutDraft,
	withLoggedStep,
} from '@/lib/utils/logged-workouts'
import { routineDayTitle } from '@/lib/utils/routine-schedule'
import { getWeightUnitLabel } from '@/lib/utils/weight-unit'

/**
 * LIVE-23: on a routine created within the lookback, logging the workouts
 * its member did before it existed. One outline control opens the form; the
 * page's filled control stays the day to start.
 */
export function LogPastWorkout({ routine }: { routine: Routine }) {
	const t = useTranslations('routines.logPast')
	const [open, setOpen] = useState(false)
	const range = loggableDateRange(routine)
	const days = loggableDays(routine)
	if (!range || days.length === 0) return null
	return (
		<section aria-labelledby="log-past-heading" className="space-y-3">
			<div className="space-y-1">
				<h2 id="log-past-heading" className="type-section text-foreground">
					{t('entryTitle')}
				</h2>
				<p className="type-body-sm text-ink-2">{t('entryBody')}</p>
			</div>
			<Button type="button" variant="outline" onClick={() => setOpen(true)}>
				{t('open')}
			</Button>
			{open ? (
				<LogPastWorkoutDialog
					routine={routine}
					range={range}
					onClose={() => setOpen(false)}
				/>
			) : null}
		</section>
	)
}

function LogPastWorkoutDialog({
	routine,
	range,
	onClose,
}: {
	routine: Routine
	range: { first: string; last: string }
	onClose: () => void
}) {
	const t = useTranslations('routines.logPast')
	const tDate = useTranslations('routines.date')
	const tEx = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const unit = useWeightUnit()
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const logWorkout = useLogPastWorkout()
	const days = loggableDays(routine)
	const rotation = routine.scheduleMode === 'ROTATION'

	const name = (exercise: { exercise: { name: string } }) =>
		exerciseLabel(exercise.exercise.name, tEx)
	const draftFor = (dayId: string, date: string) =>
		loggedDraftForDay(
			days.find(day => day.id === dayId) ?? days[0],
			date,
			unit,
			name,
		)
	const [draft, setDraft] = useState<LoggedWorkoutDraft>(() =>
		draftFor(days[0].id, defaultLoggedDate(days[0], range)),
	)
	const [problems, setProblems] = useState<string[]>([])
	const day = days.find(item => item.id === draft.dayId) ?? days[0]

	const rangeLabel = useMemo(() => {
		const format = dateFormatter(locale, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		})
		const at = (date: string) => format.format(new Date(`${date}T12:00:00`))
		return { first: at(range.first), last: at(range.last) }
	}, [locale, range.first, range.last])

	const update = (
		change: (current: LoggedWorkoutDraft) => LoggedWorkoutDraft,
	) => setDraft(current => change(current))

	const setField = (
		exerciseIndex: number,
		setIndex: number,
		values: Partial<LoggedWorkoutDraft['exercises'][number]['sets'][number]>,
	) =>
		update(current => ({
			...current,
			exercises: current.exercises.map((exercise, i) =>
				i !== exerciseIndex
					? exercise
					: {
							...exercise,
							sets: exercise.sets.map((set, j) =>
								j === setIndex ? { ...set, ...values } : set,
							),
						},
			),
		}))

	const save = () => {
		const { request, problems: found } = buildLoggedWorkoutRequest(
			routine.id,
			draft,
			range,
			unit,
			t,
			rangeLabel,
		)
		setProblems(found)
		if (!request) return
		logWorkout.mutate(request, {
			onSuccess: () => {
				push({ title: t('logged'), variant: 'success' })
				onClose()
			},
			onError: error => setProblems([errorText(error)]),
		})
	}

	return (
		<Dialog
			open
			onOpenChange={next => !next && !logWorkout.isPending && onClose()}
		>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t('dialogTitle')}</DialogTitle>
					<DialogDescription>{t('dialogDescription')}</DialogDescription>
				</DialogHeader>
				<form
					id="log-past-workout-form"
					className="space-y-5"
					onSubmit={event => {
						event.preventDefault()
						save()
					}}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="log-past-day">{t('day')}</Label>
							<NativeSelect
								id="log-past-day"
								value={draft.dayId}
								onChange={event =>
									setDraft(current => ({
										// A day opens on the latest date on its own weekday.
										...draftFor(
											event.target.value,
											defaultLoggedDate(
												days.find(item => item.id === event.target.value) ??
													days[0],
												range,
											),
										),
										startTime: current.startTime,
										duration: current.duration,
									}))
								}
							>
								{days.map(item => (
									<option key={item.id} value={item.id}>
										{routineDayTitle(item, 'long', tDate)}
									</option>
								))}
							</NativeSelect>
						</div>
						<div className="space-y-2">
							<Label htmlFor="log-past-date">{t('date')}</Label>
							<Input
								id="log-past-date"
								type="date"
								value={draft.date}
								min={range.first}
								max={range.last}
								aria-describedby="log-past-date-hint"
								onChange={event =>
									update(current => ({ ...current, date: event.target.value }))
								}
							/>
							<p id="log-past-date-hint" className="type-body-sm text-ink-3">
								{t('dateHint', rangeLabel)}
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="log-past-time">{t('startTime')}</Label>
							<Input
								id="log-past-time"
								type="time"
								value={draft.startTime}
								onChange={event =>
									update(current => ({
										...current,
										startTime: event.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="log-past-duration">{t('duration')}</Label>
							<Input
								id="log-past-duration"
								inputMode="numeric"
								className="sm:w-40"
								value={draft.duration}
								aria-describedby="log-past-duration-hint"
								onChange={event =>
									update(current => ({
										...current,
										duration: event.target.value.replace(/[^0-9]/g, ''),
									}))
								}
							/>
							<p
								id="log-past-duration-hint"
								className="type-body-sm text-ink-3"
							>
								{t('durationHint')}
							</p>
						</div>
					</div>

					<ul className="divide-y divide-rule-faint border-y border-rule">
						{draft.exercises.map((exercise, exerciseIndex) => {
							const source = day.exercises[exerciseIndex]
							return (
								<li key={exercise.routineExerciseId} className="space-y-3 py-4">
									<h3 className="type-panel text-foreground">
										{exercise.exerciseName}
									</h3>
									{exercise.step !== null && source ? (
										<div className="flex items-center justify-between gap-3">
											<Label
												htmlFor={`log-past-step-${exercise.routineExerciseId}`}
												className="text-sm font-medium text-ink-3"
											>
												{t(rotation ? 'session' : 'week')}
											</Label>
											<NativeSelect
												id={`log-past-step-${exercise.routineExerciseId}`}
												aria-label={t(rotation ? 'sessionAria' : 'weekAria', {
													exercise: exercise.exerciseName,
												})}
												className="w-24"
												value={String(exercise.step)}
												onChange={event =>
													update(current => ({
														...current,
														exercises: current.exercises.map((item, i) =>
															i === exerciseIndex
																? withLoggedStep(
																		item,
																		source,
																		Number(event.target.value),
																		unit,
																	)
																: item,
														),
													}))
												}
											>
												{Array.from({ length: LP_BLOCK_STEPS }, (_, i) => (
													<option key={i + 1} value={i + 1}>
														{i + 1}
													</option>
												))}
											</NativeSelect>
										</div>
									) : null}
									<div className="grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_auto] items-center gap-x-2 gap-y-2">
										<span aria-hidden />
										<span className="type-label text-ink-3">{t('reps')}</span>
										<span className="type-label text-ink-3">
											{t('weight', { unit: getWeightUnitLabel(unit) })}
										</span>
										<span className="type-label text-ink-3">{t('done')}</span>
										{exercise.sets.map((set, setIndex) => {
											const label = (field: string) =>
												t('fieldAria', {
													number: set.setNumber,
													exercise: exercise.exerciseName,
													field,
												})
											return (
												<div key={set.setNumber} className="contents">
													<span className="type-body-sm text-ink-2">
														{t('setLabel', { number: set.setNumber })}
														{set.isWarmUp ? ` · ${t('warmUp')}` : ''}
													</span>
													<Input
														inputMode="numeric"
														aria-label={label(t('reps'))}
														value={set.reps}
														onChange={event =>
															setField(exerciseIndex, setIndex, {
																reps: event.target.value.replace(/[^0-9]/g, ''),
															})
														}
													/>
													<Input
														inputMode="decimal"
														aria-label={label(
															t('weight', { unit: getWeightUnitLabel(unit) }),
														)}
														value={set.weight}
														onChange={event =>
															setField(exerciseIndex, setIndex, {
																weight: event.target.value.replace(
																	/[^0-9.,]/g,
																	'',
																),
															})
														}
													/>
													<Checkbox
														aria-label={label(t('done'))}
														checked={set.isCompleted}
														onCheckedChange={checked =>
															setField(exerciseIndex, setIndex, {
																isCompleted: checked === true,
															})
														}
													/>
												</div>
											)
										})}
									</div>
								</li>
							)
						})}
					</ul>

					<p className="type-body-sm text-ink-2">{t('consequences')}</p>
					<div role="alert" className="space-y-1">
						{problems.map(problem => (
							<p key={problem} className="type-body-sm text-ink">
								{problem}
							</p>
						))}
					</div>
				</form>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={logWorkout.isPending}
					>
						{t('cancel')}
					</Button>
					<Button
						type="submit"
						form="log-past-workout-form"
						disabled={logWorkout.isPending}
					>
						{logWorkout.isPending ? t('saving') : t('save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
