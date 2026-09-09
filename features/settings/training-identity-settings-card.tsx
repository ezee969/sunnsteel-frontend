'use client'

import {
	type PreferredTrainingStyle,
	PROFILE_FAVORITE_EXERCISES_MAX,
	PROFILE_TRAINING_DISCIPLINES_MAX,
	PROFILE_TRAINING_GOALS_MAX,
	type TrainingDiscipline,
	type TrainingExperienceLevel,
	type TrainingGoal,
	type TrainingIdentity,
} from '@sunsteel/contracts'
import { Loader2, Plus, Target, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
import { useExercises } from '@/lib/api/hooks/useExercises'
import { useUpdateUser } from '@/lib/api/hooks/useUpdateUser'
import type { Exercise } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import {
	PREFERRED_TRAINING_STYLE_OPTIONS,
	TRAINING_DISCIPLINE_OPTIONS,
	TRAINING_EXPERIENCE_OPTIONS,
	TRAINING_GOAL_OPTIONS,
} from '@/lib/utils/training-identity'

interface TrainingIdentitySettingsCardProps {
	identity: TrainingIdentity
}

const EMPTY_EXERCISES: Exercise[] = []

const cloneIdentity = (identity: TrainingIdentity): TrainingIdentity => ({
	...identity,
	goals: [...identity.goals],
	disciplines: [...identity.disciplines],
	favoriteExercises: [...identity.favoriteExercises],
})

export function TrainingIdentitySettingsCard({
	identity,
}: TrainingIdentitySettingsCardProps) {
	const [draft, setDraft] = useState(() => cloneIdentity(identity))
	const [exerciseSearch, setExerciseSearch] = useState('')
	const exerciseQuery = useExercises()
	const exercises = exerciseQuery.data ?? EMPTY_EXERCISES
	const updateUser = useUpdateUser()
	const { push } = useToast()

	useEffect(() => {
		setDraft(cloneIdentity(identity))
	}, [identity])

	const selectedExerciseIds = useMemo(
		() => new Set(draft.favoriteExercises.map(exercise => exercise.id)),
		[draft.favoriteExercises],
	)
	const exerciseResults = useMemo(() => {
		const search = exerciseSearch.trim().toLowerCase()
		if (!search) return []
		return exercises
			.filter(
				exercise =>
					!selectedExerciseIds.has(exercise.id) &&
					exercise.name.toLowerCase().includes(search),
			)
			.slice(0, 8)
	}, [exerciseSearch, exercises, selectedExerciseIds])

	const hasChanges = JSON.stringify(draft) !== JSON.stringify(identity)
	const favoriteLimitReached =
		draft.favoriteExercises.length >= PROFILE_FAVORITE_EXERCISES_MAX

	const toggleGoal = (goal: TrainingGoal) => {
		setDraft(previous => {
			const selected = previous.goals.includes(goal)
			if (!selected && previous.goals.length >= PROFILE_TRAINING_GOALS_MAX) {
				return previous
			}
			return {
				...previous,
				goals: selected
					? previous.goals.filter(value => value !== goal)
					: [...previous.goals, goal],
			}
		})
	}

	const toggleDiscipline = (discipline: TrainingDiscipline) => {
		setDraft(previous => {
			const selected = previous.disciplines.includes(discipline)
			if (
				!selected &&
				previous.disciplines.length >= PROFILE_TRAINING_DISCIPLINES_MAX
			) {
				return previous
			}
			return {
				...previous,
				disciplines: selected
					? previous.disciplines.filter(value => value !== discipline)
					: [...previous.disciplines, discipline],
			}
		})
	}

	const addFavoriteExercise = (exerciseId: string) => {
		const exercise = exercises.find(candidate => candidate.id === exerciseId)
		if (!exercise || favoriteLimitReached) return
		setDraft(previous => ({
			...previous,
			favoriteExercises: [
				...previous.favoriteExercises,
				{ id: exercise.id, name: exercise.name },
			],
		}))
		setExerciseSearch('')
	}

	const removeFavoriteExercise = (exerciseId: string) => {
		setDraft(previous => ({
			...previous,
			favoriteExercises: previous.favoriteExercises.filter(
				exercise => exercise.id !== exerciseId,
			),
		}))
	}

	const handleSave = () => {
		updateUser.mutate(
			{
				trainingGoals: draft.goals,
				trainingExperienceLevel: draft.experienceLevel,
				trainingDisciplines: draft.disciplines,
				preferredTrainingStyle: draft.preferredStyle,
				favoriteExerciseIds: draft.favoriteExercises.map(
					exercise => exercise.id,
				),
			},
			{
				onSuccess: () => {
					push({
						title: 'Training identity updated',
						description: 'Your training preferences are now saved.',
						variant: 'success',
					})
				},
				onError: error => {
					push({
						title: 'Could not update training identity',
						description: error.message,
						variant: 'destructive',
					})
				},
			},
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Target className="h-5 w-5 text-primary" aria-hidden />
					<CardTitle>Training Identity</CardTitle>
				</div>
				<CardDescription>
					Describe how you train. These are profile signals, not measurable
					goals or prescriptions.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-7">
				<div
					className="space-y-3"
					role="group"
					aria-labelledby="training-goals-label"
				>
					<div className="flex items-baseline justify-between gap-3">
						<Label id="training-goals-label">Goals</Label>
						<span className="type-data text-xs text-ink-3">
							{draft.goals.length}/{PROFILE_TRAINING_GOALS_MAX}
						</span>
					</div>
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{TRAINING_GOAL_OPTIONS.map(option => {
							const selected = draft.goals.includes(option.value)
							return (
								<Button
									key={option.value}
									type="button"
									variant="outline"
									size="sm"
									aria-pressed={selected}
									onClick={() => toggleGoal(option.value)}
									disabled={
										!selected &&
										draft.goals.length >= PROFILE_TRAINING_GOALS_MAX
									}
									className={cn(
										'justify-start',
										selected && 'border-primary bg-primary/5',
									)}
								>
									{option.label}
								</Button>
							)
						})}
					</div>
				</div>

				<div className="grid gap-5 lg:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="training-experience">Experience level</Label>
						<Select
							value={draft.experienceLevel ?? 'NOT_SET'}
							onValueChange={value =>
								setDraft(previous => ({
									...previous,
									experienceLevel:
										value === 'NOT_SET'
											? null
											: (value as TrainingExperienceLevel),
								}))
							}
						>
							<SelectTrigger id="training-experience" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="NOT_SET">Not set</SelectItem>
								{TRAINING_EXPERIENCE_OPTIONS.map(option => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="preferred-training-style">Preferred style</Label>
						<Select
							value={draft.preferredStyle ?? 'NOT_SET'}
							onValueChange={value =>
								setDraft(previous => ({
									...previous,
									preferredStyle:
										value === 'NOT_SET'
											? null
											: (value as PreferredTrainingStyle),
								}))
							}
						>
							<SelectTrigger id="preferred-training-style" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="NOT_SET">Not set</SelectItem>
								{PREFERRED_TRAINING_STYLE_OPTIONS.map(option => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div
					className="space-y-3"
					role="group"
					aria-labelledby="training-disciplines-label"
				>
					<div className="flex items-baseline justify-between gap-3">
						<Label id="training-disciplines-label">Disciplines</Label>
						<span className="type-data text-xs text-ink-3">
							{draft.disciplines.length}/{PROFILE_TRAINING_DISCIPLINES_MAX}
						</span>
					</div>
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{TRAINING_DISCIPLINE_OPTIONS.map(option => {
							const selected = draft.disciplines.includes(option.value)
							return (
								<Button
									key={option.value}
									type="button"
									variant="outline"
									size="sm"
									aria-pressed={selected}
									onClick={() => toggleDiscipline(option.value)}
									disabled={
										!selected &&
										draft.disciplines.length >= PROFILE_TRAINING_DISCIPLINES_MAX
									}
									className={cn(
										'justify-start',
										selected && 'border-primary bg-primary/5',
									)}
								>
									{option.label}
								</Button>
							)
						})}
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-baseline justify-between gap-3">
						<Label htmlFor="favorite-exercise-search">Favorite exercises</Label>
						<span className="type-data text-xs text-ink-3">
							{draft.favoriteExercises.length}/{PROFILE_FAVORITE_EXERCISES_MAX}
						</span>
					</div>
					{draft.favoriteExercises.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{draft.favoriteExercises.map(exercise => (
								<Badge
									key={exercise.id}
									variant="secondary"
									className="gap-1.5"
								>
									{exercise.name}
									<button
										type="button"
										onClick={() => removeFavoriteExercise(exercise.id)}
										aria-label={`Remove ${exercise.name}`}
										className="text-ink-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										<X className="h-3.5 w-3.5" aria-hidden />
									</button>
								</Badge>
							))}
						</div>
					) : (
						<p className="type-body-sm text-ink-3">
							No favorite exercises selected.
						</p>
					)}
					<Input
						id="favorite-exercise-search"
						value={exerciseSearch}
						onChange={event => setExerciseSearch(event.target.value)}
						placeholder={
							favoriteLimitReached
								? 'Favorite exercise limit reached'
								: 'Search the exercise catalog'
						}
						disabled={favoriteLimitReached}
					/>
					{exerciseSearch.trim() ? (
						<div className="max-h-56 space-y-1 overflow-y-auto border border-rule bg-surface p-2">
							{exerciseQuery.isLoading ? (
								<p className="type-body-sm p-3 text-ink-3">
									Loading exercises...
								</p>
							) : exerciseResults.length > 0 ? (
								exerciseResults.map(exercise => (
									<Button
										key={exercise.id}
										type="button"
										variant="ghost"
										className="h-auto w-full justify-between gap-3 px-3 py-2 text-left"
										onClick={() => addFavoriteExercise(exercise.id)}
									>
										<span className="whitespace-normal">{exercise.name}</span>
										<Plus className="h-4 w-4 shrink-0" aria-hidden />
									</Button>
								))
							) : (
								<p className="type-body-sm p-3 text-ink-3">
									No exercises found.
								</p>
							)}
						</div>
					) : null}
				</div>

				<div className="flex justify-end">
					<Button
						type="button"
						onClick={handleSave}
						disabled={!hasChanges || updateUser.isPending}
					>
						{updateUser.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
						) : null}
						Save Training Identity
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
