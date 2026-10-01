'use client'

import {
	MEASURABLE_GOALS_MAX,
	type MeasurableGoalDirection,
	type MeasurableGoalType,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Loader2, Plus, Target, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Explanation } from '@/components/layout/explanation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useExercises } from '@/lib/api/hooks/useExercises'
import {
	useMeasurableGoals,
	useReplaceMeasurableGoals,
} from '@/lib/api/hooks/useMeasurableGoals'
import {
	buildMeasurableGoalsRequest,
	convertMeasurableGoalDrafts,
	createMeasurableGoalDraft,
	getMeasurableGoalLabel,
	isWeightGoal,
	MEASURABLE_GOAL_TYPES,
	type MeasurableGoalDraft,
	measurableGoalsToDrafts,
} from '@/lib/utils/measurable-goals'
import {
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

interface MeasurableGoalsSettingsCardProps {
	weightUnit: WeightUnit
}

const NON_EXERCISE_TYPES = new Set<MeasurableGoalType>([
	'WEEKLY_SESSIONS',
	'WEEKLY_VOLUME',
	'STREAK_DAYS',
	'BODY_WEIGHT',
])

export function MeasurableGoalsSettingsCard({
	weightUnit,
}: MeasurableGoalsSettingsCardProps) {
	const errorText = useApiErrorMessage()
	const tGoals = useTranslations('progress.goals')
	const t = useTranslations('settings.measurableGoals')
	const goalsQuery = useMeasurableGoals()
	const replaceGoals = useReplaceMeasurableGoals()
	const exercisesQuery = useExercises()
	const { push } = useToast()
	const [drafts, setDrafts] = useState<MeasurableGoalDraft[]>([])
	const [newType, setNewType] = useState<MeasurableGoalType>('WEEKLY_SESSIONS')
	const [formError, setFormError] = useState<string | null>(null)
	const weightUnitRef = useRef(weightUnit)

	useEffect(() => {
		if (!goalsQuery.data) return
		setDrafts(measurableGoalsToDrafts(goalsQuery.data, weightUnitRef.current))
		setFormError(null)
	}, [goalsQuery.data])

	useEffect(() => {
		const previousUnit = weightUnitRef.current
		if (previousUnit === weightUnit) return
		setDrafts(current =>
			convertMeasurableGoalDrafts(current, previousUnit, weightUnit),
		)
		weightUnitRef.current = weightUnit
	}, [weightUnit])

	const usedNonExerciseTypes = useMemo(
		() =>
			new Set(
				drafts
					.filter(draft => NON_EXERCISE_TYPES.has(draft.type))
					.map(draft => draft.type),
			),
		[drafts],
	)
	const addOptions = MEASURABLE_GOAL_TYPES.filter(
		type =>
			type === 'EXERCISE_ESTIMATED_1RM' || !usedNonExerciseTypes.has(type),
	)
	const selectedAddType = addOptions.includes(newType) ? newType : addOptions[0]
	const canAdd = drafts.length < MEASURABLE_GOALS_MAX && !!selectedAddType

	const updateDraft = (
		key: string,
		update: (draft: MeasurableGoalDraft) => MeasurableGoalDraft,
	) => {
		setDrafts(current =>
			current.map(draft => (draft.key === key ? update(draft) : draft)),
		)
		setFormError(null)
	}

	const addGoal = () => {
		if (!canAdd || !selectedAddType) return
		setDrafts(current => [
			...current,
			createMeasurableGoalDraft(selectedAddType),
		])
		setFormError(null)
	}

	const save = () => {
		try {
			const request = buildMeasurableGoalsRequest(drafts, weightUnit, tGoals)
			setFormError(null)
			replaceGoals.mutate(request, {
				onSuccess: () => {
					push({
						title: t('savedTitle'),
						description: t('savedDescription'),
						variant: 'success',
					})
				},
				onError: error => setFormError(errorText(error)),
			})
		} catch (error) {
			setFormError(error instanceof Error ? error.message : t('fallbackError'))
		}
	}

	return (
		<Card>
			<CardHeader className="gap-3 xl:flex-row xl:items-start xl:justify-between">
				<div className="space-y-1.5">
					<CardTitle className="flex items-center gap-2">
						<Target className="size-4 text-ink-3" aria-hidden />
						{t('title')}
					</CardTitle>
					<Explanation summary={t('descriptionSummary')}>
						<p>{t('description')}</p>
					</Explanation>
				</div>
				<div className="flex flex-wrap gap-2">
					<Select
						value={selectedAddType}
						onValueChange={value => setNewType(value as MeasurableGoalType)}
						disabled={!addOptions.length || goalsQuery.isLoading}
					>
						<SelectTrigger
							className="w-full sm:w-52"
							aria-label={t('newGoalType')}
						>
							<SelectValue placeholder={t('goalTypePlaceholder')} />
						</SelectTrigger>
						<SelectContent>
							{addOptions.map(type => (
								<SelectItem key={type} value={type}>
									{getMeasurableGoalLabel(type, tGoals)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						type="button"
						variant="outline"
						onClick={addGoal}
						disabled={!canAdd || goalsQuery.isLoading}
					>
						<Plus className="size-4" aria-hidden />
						{t('add')}
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{goalsQuery.isLoading ? (
					<div className="type-body-sm flex items-center justify-center gap-2 py-8 text-ink-3">
						<Loader2 className="size-4 animate-spin" aria-hidden />
						{t('loading')}
					</div>
				) : goalsQuery.error ? (
					<div
						role="alert"
						className="border border-destructive bg-surface p-4"
					>
						<p className="type-body-sm text-destructive">
							{errorText(goalsQuery.error)}
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => void goalsQuery.refetch()}
						>
							{t('tryAgain')}
						</Button>
					</div>
				) : (
					<>
						{drafts.length === 0 ? (
							<div className="border border-dashed border-rule p-6 text-center">
								<p className="type-panel text-foreground">{t('emptyTitle')}</p>
								<p className="type-body-sm mt-1 text-ink-3">{t('emptyBody')}</p>
							</div>
						) : null}

						<div className="rule-list">
							{drafts.map((draft, index) => {
								const unit = isWeightGoal(draft.type)
									? getWeightUnitLabel(weightUnit)
									: draft.type === 'WEEKLY_SESSIONS'
										? t('unitSessions')
										: t('unitDays')
								return (
									<div
										key={draft.key}
										className="rule-row grid gap-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(9rem,0.65fr)_2.75rem] xl:items-end"
									>
										<div className="space-y-2">
											<label
												htmlFor={`goal-type-${draft.key}`}
												className="type-body-sm text-ink-3"
											>
												{t('goal')}
											</label>
											<Select
												value={draft.type}
												onValueChange={value =>
													updateDraft(draft.key, current => ({
														...current,
														type: value as MeasurableGoalType,
														target: '',
														direction: 'AT_LEAST',
														exerciseId: '',
													}))
												}
											>
												<SelectTrigger
													id={`goal-type-${draft.key}`}
													className="w-full"
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{MEASURABLE_GOAL_TYPES.map(type => (
														<SelectItem key={type} value={type}>
															{getMeasurableGoalLabel(type, tGoals)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										{draft.type === 'EXERCISE_ESTIMATED_1RM' ? (
											<div className="space-y-2">
												<label
													htmlFor={`goal-exercise-${draft.key}`}
													className="type-body-sm text-ink-3"
												>
													{t('exercise')}
												</label>
												<Select
													value={draft.exerciseId}
													onValueChange={value =>
														updateDraft(draft.key, current => ({
															...current,
															exerciseId: value,
														}))
													}
													disabled={exercisesQuery.isLoading}
												>
													<SelectTrigger
														id={`goal-exercise-${draft.key}`}
														className="w-full"
													>
														<SelectValue placeholder={t('chooseExercise')} />
													</SelectTrigger>
													<SelectContent>
														{exercisesQuery.data?.map(exercise => (
															<SelectItem key={exercise.id} value={exercise.id}>
																{exercise.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										) : draft.type === 'BODY_WEIGHT' ? (
											<div className="space-y-2">
												<label
													htmlFor={`goal-direction-${draft.key}`}
													className="type-body-sm text-ink-3"
												>
													{t('direction')}
												</label>
												<Select
													value={draft.direction}
													onValueChange={value =>
														updateDraft(draft.key, current => ({
															...current,
															direction: value as MeasurableGoalDirection,
														}))
													}
												>
													<SelectTrigger
														id={`goal-direction-${draft.key}`}
														className="w-full"
													>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="AT_LEAST">
															{t('atLeast')}
														</SelectItem>
														<SelectItem value="AT_MOST">
															{t('atMost')}
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										) : (
											<div className="type-body-sm flex items-end text-ink-3 xl:pb-2">
												{t('updatesAutomatically', {
													goal: getMeasurableGoalLabel(draft.type, tGoals),
												})}
											</div>
										)}

										<div className="space-y-2">
											<label
												htmlFor={`goal-target-${draft.key}`}
												className="type-body-sm text-ink-3"
											>
												{t('target', { unit })}
											</label>
											<Input
												id={`goal-target-${draft.key}`}
												type="number"
												min={
													draft.type === 'BODY_WEIGHT'
														? kilogramsToDisplayWeight(20, weightUnit)
														: draft.type === 'EXERCISE_ESTIMATED_1RM'
															? kilogramsToDisplayWeight(0.1, weightUnit)
															: 1
												}
												step={
													draft.type === 'WEEKLY_SESSIONS' ||
													draft.type === 'STREAK_DAYS'
														? 1
														: 0.1
												}
												value={draft.target}
												onChange={event =>
													updateDraft(draft.key, current => ({
														...current,
														target: event.target.value,
													}))
												}
											/>
										</div>

										<Button
											type="button"
											variant="ghost"
											size="icon"
											aria-label={t('removeGoal', {
												goal: getMeasurableGoalLabel(draft.type, tGoals),
												number: index + 1,
											})}
											onClick={() => {
												setDrafts(current =>
													current.filter(goal => goal.key !== draft.key),
												)
												setFormError(null)
											}}
										>
											<Trash2 className="size-4 text-destructive" aria-hidden />
										</Button>
									</div>
								)
							})}
						</div>

						{formError ? (
							<p role="alert" className="type-body-sm text-destructive">
								{formError}
							</p>
						) : null}

						<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
							<p className="type-body-sm text-ink-3">
								{t('count', {
									count: drafts.length,
									max: MEASURABLE_GOALS_MAX,
								})}
							</p>
							<Button
								type="button"
								onClick={save}
								disabled={replaceGoals.isPending}
							>
								{replaceGoals.isPending ? (
									<Loader2 className="size-4 animate-spin" aria-hidden />
								) : null}
								{t('save')}
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
