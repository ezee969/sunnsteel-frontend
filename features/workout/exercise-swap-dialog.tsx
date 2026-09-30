'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { exerciseLabel } from '@/i18n/catalog'
import { useExercises } from '@/lib/api/hooks'
import { useTrainingLocations } from '@/lib/api/hooks/useTrainingLocations'
import {
	useRevertExerciseSubstitution,
	useSubstituteExercise,
} from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types'
import { pickableExercises } from '@/lib/utils/custom-exercises'
import {
	describeAlternative,
	findExerciseAlternatives,
} from '@/lib/utils/exercise-alternatives'
import { matchesExerciseName } from '@/lib/utils/exercise-catalog'
import {
	defaultTrainingLocation,
	listedEquipmentAt,
} from '@/lib/utils/exercise-equipment'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'

export interface SwapTarget {
	routineExerciseId: string
	/** The exercise currently performed for the slot. */
	performed: { id: string; name: string }
	/** The routine's own exercise for the slot. */
	prescribed: { id: string; name: string }
	hasCompletedSets: boolean
}

interface ExerciseSwapDialogProps {
	sessionId: string
	routineId?: string
	/**
	 * ROUT-15: set when the session trains a training block, whose working
	 * copy -- not the routine -- is what "also use it" updates.
	 */
	trainingBlockName?: string
	/** ROUT-16: the session trains a deload, whose own copy "also use it" updates. */
	deload?: boolean
	target: SwapTarget | null
	/** Exercises performed in the day's other slots; never offered. */
	otherExerciseIds: string[]
	onClose: () => void
}

const SEARCH_LIMIT = 8

/**
 * LIVE-11: swap the exercise for one slot of the live session. Suggestions
 * come from the EXER-05 ranking against the routine's own exercise; search
 * reaches the rest of the catalog. Nothing changes until an option is chosen.
 */
export function ExerciseSwapDialog({
	sessionId,
	routineId,
	trainingBlockName,
	deload = false,
	target,
	otherExerciseIds,
	onClose,
}: ExerciseSwapDialogProps) {
	const t = useTranslations('workout.exerciseSwap')
	const tAlternatives = useTranslations('routines.alternatives')
	const tMuscles = useTranslations('routines.muscles')
	const tEquipment = useTranslations('routines.equipment')
	const tEx = useTranslations('catalog.exercises')
	const label = useMemo(() => (name: string) => exerciseLabel(name, tEx), [tEx])
	const plan = deload
		? t('planDeload')
		: trainingBlockName
			? t('planBlock', { name: trainingBlockName })
			: t('planRoutine')
	const Plan = plan[0].toUpperCase() + plan.slice(1)
	const { data: exercises, isLoading } = useExercises()
	const { data: locations } = useTrainingLocations()
	const gym = defaultTrainingLocation(locations)
	const substitute = useSubstituteExercise(sessionId, routineId)
	const revert = useRevertExerciseSubstitution(sessionId)
	const { push } = useToast()
	const [query, setQuery] = useState('')
	const [applyToRoutine, setApplyToRoutine] = useState(false)

	const slotId = target?.routineExerciseId
	useEffect(() => {
		setQuery('')
		setApplyToRoutine(false)
	}, [slotId])

	const excluded = useMemo(
		() =>
			new Set([...otherExerciseIds, ...(target ? [target.performed.id] : [])]),
		[otherExerciseIds, target],
	)
	const search = query.trim().toLowerCase()
	const options = useMemo(() => {
		const catalog = pickableExercises(exercises ?? [])
		if (search) {
			return catalog
				.filter(
					exercise =>
						!excluded.has(exercise.id) &&
						matchesExerciseName(exercise.name, search, label),
				)
				.slice(0, SEARCH_LIMIT)
				.map(exercise => ({
					exercise,
					reason: formatMuscleGroups(exercise.primaryMuscles, tMuscles),
				}))
		}
		const prescribed = catalog.find(
			exercise => exercise.id === target?.prescribed.id,
		)
		if (!prescribed) return []
		return findExerciseAlternatives(prescribed, catalog, {
			availableEquipment: listedEquipmentAt(gym),
			exclude: excluded,
		}).map(alternative => ({
			exercise: alternative.exercise,
			reason: describeAlternative(
				alternative,
				gym?.name,
				tAlternatives,
				tMuscles,
				tEquipment,
			),
		}))
	}, [
		label,
		exercises,
		search,
		excluded,
		target?.prescribed.id,
		gym,
		tAlternatives,
		tMuscles,
		tEquipment,
	])

	const busy = substitute.isPending || revert.isPending
	const isSwapped = !!target && target.performed.id !== target.prescribed.id

	const choose = (exercise: Pick<Exercise, 'id' | 'name'>) => {
		if (!target) return
		substitute.mutate(
			{
				routineExerciseId: target.routineExerciseId,
				exerciseId: exercise.id,
				applyToRoutine,
			},
			{
				onSuccess: result => {
					push({
						title: t('swappedToTitle', {
							exercise: exerciseLabel(exercise.name, tEx),
						}),
						description: !applyToRoutine
							? t('onlySessionChanged')
							: result.routineUpdated
								? t('planUsesFromNext', { plan: Plan })
								: t('planNoLongerHas', { plan: Plan }),
						variant: 'success',
					})
					onClose()
				},
				onError: error =>
					push({
						title: t('couldNotSwapTitle'),
						description: error.message,
						variant: 'destructive',
					}),
			},
		)
	}

	const switchBack = () => {
		if (!target) return
		revert.mutate(target.routineExerciseId, {
			onSuccess: () => {
				push({
					title: t('backToTitle', {
						exercise: exerciseLabel(target.prescribed.name, tEx),
					}),
					variant: 'success',
				})
				onClose()
			},
			onError: error =>
				push({
					title: t('couldNotSwitchBackTitle'),
					description: error.message,
					variant: 'destructive',
				}),
		})
	}

	return (
		<Dialog
			open={!!target}
			onOpenChange={open => {
				if (!open && !busy) onClose()
			}}
		>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t('dialogTitle')}</DialogTitle>
					<DialogDescription>
						{target
							? t('dialogDescription', {
									exercise: exerciseLabel(target.performed.name, tEx),
								})
							: null}
					</DialogDescription>
				</DialogHeader>

				{target?.hasCompletedSets ? (
					// §4.3 rule 4: risk is a mark and a glyph; the words stay in ink.
					<div
						role="status"
						className="mark mark-warning flex gap-2 bg-surface-sunk py-2 pl-3 pr-3"
					>
						<AlertTriangle
							className="mt-0.5 h-4 w-4 shrink-0 text-warning-strong"
							aria-hidden
						/>
						<p className="type-body-sm text-ink">
							{t('completedSetsWarning', {
								exercise: exerciseLabel(target.performed.name, tEx),
							})}
						</p>
					</div>
				) : target ? (
					<div className="space-y-4">
						{isSwapped && (
							<div className="flex items-center justify-between gap-3 border-b border-rule-faint pb-3">
								<p className="type-body-sm text-ink-2">
									{t('swappedFrom', {
										name: exerciseLabel(target.prescribed.name, tEx),
									})}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={switchBack}
									disabled={busy}
								>
									{t('switchBack')}
								</Button>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="swap-search">{t('searchLabel')}</Label>
							<Input
								id="swap-search"
								value={query}
								onChange={event => setQuery(event.target.value)}
								placeholder={t('searchPlaceholder')}
								autoComplete="off"
							/>
						</div>

						<div className="space-y-2">
							<h3 className="type-label text-ink-3">
								{search ? t('matches') : t('alternatives')}
							</h3>
							{isLoading ? (
								<p className="type-body-sm flex items-center gap-2 text-ink-3">
									<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
									{t('loadingExercises')}
								</p>
							) : options.length === 0 ? (
								<p className="type-body-sm text-ink-3">
									{search ? t('noMatches') : t('noAlternatives')}
								</p>
							) : (
								<ul
									aria-label={t('optionsAria')}
									className="border-y border-rule"
								>
									{options.map(({ exercise, reason }) => (
										<li key={exercise.id} className="rule-row">
											<button
												type="button"
												onClick={() => choose(exercise)}
												disabled={busy}
												className="w-full px-2 py-2.5 text-left transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface disabled:text-ink-3"
											>
												<span className="block text-sm font-medium text-foreground">
													{exerciseLabel(exercise.name, tEx)}
												</span>
												{reason ? (
													<span className="type-body-sm block text-ink-3">
														{reason}
													</span>
												) : null}
											</button>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="flex items-start gap-2">
							<Checkbox
								id="swap-apply-routine"
								checked={applyToRoutine}
								onCheckedChange={value => setApplyToRoutine(value === true)}
								disabled={busy}
							/>
							<Label
								htmlFor="swap-apply-routine"
								className="type-body-sm leading-snug"
							>
								{t('alsoUseIt', { plan })}
							</Label>
						</div>
						<p className="type-body-sm text-ink-3">{t('clearedNote')}</p>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}
