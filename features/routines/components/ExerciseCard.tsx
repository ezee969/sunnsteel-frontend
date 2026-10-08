'use client'

import {
	type LinearPeriodizationState,
	type SetKind,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { lpWorkingSetTarget } from '@/features/routines/wizard/utils/linear-block'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { lpSummary } from '@/lib/utils/linear-periodization'
import {
	lpRecoveryLine,
	progressionSchemeLabel,
} from '@/lib/utils/routine-progression'
import { setKindLabel } from '@/lib/utils/set-kind-label'
import { formatTime } from '@/lib/utils/time'
import { formatWeight } from '@/lib/utils/weight-unit'

import { LinearBlockContinueDialog } from './LinearBlockContinueDialog'

interface ExerciseCardProps {
	exercise: {
		id: string
		exercise?: {
			name: string
		}
		note?: string | null
		restSeconds?: number | null
		progressionScheme?: string
		minWeightIncrement?: number
		/** ROUT-17: where an exercise on an 8-week block stands. */
		linearPeriodization?: LinearPeriodizationState | null
		warmUpsFollowLoad?: boolean
		linkedToNext?: boolean
		sets?: {
			id?: string
			setNumber?: number
			reps?: number | null
			minReps?: number | null
			maxReps?: number | null
			weight?: number | null
			rir?: number | null
			rpe?: number
			kind?: SetKind
		}[]
	}
	routineId?: string
	weightUnit: WeightUnit
	/** ROUT-12: "Superset A1", or null for an exercise on its own. */
	groupLabel?: string | null
	/** ROUT-17: a rotation counts a block's steps as sessions. */
	rotation?: boolean
}

/**
 * One exercise in a routine day, as a ruled entry in the day's list rather than
 * a boxed card (§11.5). Its prescription is read-only data, so it sits on the
 * row ground in Space Mono, with no badge and no numbered tiles (§11.12). It
 * was a bordered `bg-card` box with an outlined scheme badge (TD-38).
 */
export const ExerciseCard = ({
	exercise,
	routineId,
	weightUnit,
	groupLabel,
	rotation = false,
}: ExerciseCardProps) => {
	const locale = useLocale() as Locale
	const t = useTranslations('routines.setRow')
	const tKinds = useTranslations('workout.setKinds')
	const tEx = useTranslations('catalog.exercises')
	const tBuilder = useTranslations('routines.builder')
	const tBlock = useTranslations('routines.linearBlock')
	const exerciseName = exercise.exercise?.name
		? exerciseLabel(exercise.exercise.name, tEx)
		: t('unknownExercise')
	// ROUT-17: an exercise on an 8-week block, and where it stands.
	const linear = exercise.progressionScheme === 'LINEAR_PERIODIZATION'
	const isBlockSet = (set: { kind?: SetKind }) =>
		linear && set.kind !== 'WARMUP'
	const block = linear ? (exercise.linearPeriodization ?? null) : null
	const incrementKg = exercise.minWeightIncrement ?? 2.5
	const schemeLabel = progressionSchemeLabel(
		exercise.progressionScheme,
		tBuilder,
	)
	return (
		<div className="py-4">
			{/* ROUT-12: its place in a superset or circuit. */}
			{groupLabel ? (
				<p className="type-body-sm pb-1 text-ink-3">{groupLabel}</p>
			) : null}
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
				<div className="flex min-w-0 items-center gap-2">
					<h4 className="type-panel text-foreground">{exerciseName}</h4>
					{exercise.note && (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 relative"
								>
									<FileText aria-hidden className="h-4 w-4 text-foreground" />
									<span className="absolute top-0 right-0">
										<svg
											width="6"
											height="6"
											viewBox="0 0 10 10"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle cx="4" cy="4" r="4" className="fill-foreground" />
											<text
												x="4"
												y="6"
												textAnchor="middle"
												fontSize="5"
												className="fill-background"
												fontWeight="bold"
											>
												!
											</text>
										</svg>
									</span>
									<span className="sr-only">{t('viewNote')}</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>{t('exerciseNote')}</DialogTitle>
								</DialogHeader>
								<div className="bg-surface-sunk p-4">
									<p className="text-sm whitespace-pre-wrap">{exercise.note}</p>
								</div>
							</DialogContent>
						</Dialog>
					)}
				</div>
				<div className="type-body-sm flex items-center gap-3 text-ink-3">
					{exercise.restSeconds ? (
						<span className="flex items-center gap-1">
							<Clock className="h-3 w-3" aria-hidden />
							<span className="sr-only">{t('rest')}</span>
							<span className="type-data">
								{formatTime(exercise.restSeconds)}
							</span>
						</span>
					) : null}
					{schemeLabel ? <span>{schemeLabel}</span> : null}
					{exercise.warmUpsFollowLoad ? (
						<span>{t('warmUpsFollow')}</span>
					) : null}
				</div>
			</div>

			{linear ? (
				<LinearBlockStatus
					block={block}
					routineId={routineId}
					routineExerciseId={exercise.id}
					exerciseName={exerciseName}
					incrementKg={incrementKg}
					weightUnit={weightUnit}
					rotation={rotation}
				/>
			) : null}

			{exercise.sets && exercise.sets.length > 0 && (
				<>
					<p className="type-body-sm mt-2 text-ink-3">{t('setsHeading')}</p>
					<ol className="mt-1 space-y-1">
						{exercise.sets.map((set, index) => {
							// ROUT-17: a block's working set reads as its load and target.
							if (isBlockSet(set)) {
								const workingIndex = exercise
									.sets!.slice(0, index)
									.filter(other => isBlockSet(other)).length
								return (
									<li
										key={set.id || index}
										className="flex items-baseline gap-3"
									>
										<span className="type-data w-6 shrink-0 text-ink-3">
											{index + 1}
										</span>
										<span className="type-data text-foreground">
											{formatWeight(set.weight, weightUnit, locale)}
										</span>
										<span className="type-body-sm text-ink-3">
											{lpWorkingSetTarget(block, workingIndex, tBlock)}
										</span>
									</li>
								)
							}
							const repDisplay =
								set.minReps && set.maxReps
									? `${set.minReps}-${set.maxReps}`
									: String(set.reps || set.minReps || 0)

							return (
								<li key={set.id || index} className="flex items-baseline gap-3">
									<span className="type-data w-6 shrink-0 text-ink-3">
										{index + 1}
									</span>
									<span className="type-data text-foreground">
										{repDisplay}
										{set.weight
											? ` @ ${formatWeight(set.weight, weightUnit, locale)}`
											: ''}
										{set.rpe && ` (RPE ${set.rpe})`}
										{set.rir !== null &&
											set.rir !== undefined &&
											` (RIR ${set.rir})`}
									</span>
									{set.kind && set.kind !== 'WORKING' ? (
										<span className="type-body-sm text-ink-3">
											{setKindLabel(set.kind, tKinds)}
										</span>
									) : null}
								</li>
							)
						})}
					</ol>
				</>
			)}
		</div>
	)
}

/**
 * ROUT-17/ROUT-19: where an exercise on an 8-week block stands -- its step and
 * load, the recovery step, or a finished block with its evidence and the
 * choice of what follows. A cloned routine has no reference yet.
 */
function LinearBlockStatus({
	block,
	routineId,
	routineExerciseId,
	exerciseName,
	incrementKg,
	weightUnit,
	rotation,
}: {
	block: LinearPeriodizationState | null
	routineId?: string
	routineExerciseId: string
	exerciseName: string
	incrementKg: number
	weightUnit: WeightUnit
	rotation: boolean
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('routines.linearBlock')

	if (!block) {
		return (
			<p className="type-body-sm mt-1 text-ink-2">
				{t('noReference')}
				{routineId ? (
					<>
						{' · '}
						<Link
							href={`/routines/edit/${routineId}`}
							className="underline underline-offset-4"
						>
							{t('editRoutine')}
						</Link>
					</>
				) : null}
			</p>
		)
	}

	if (block.phase === 'RECOVERY') {
		return (
			<p className="type-body-sm mt-1 text-ink-2">
				{lpRecoveryLine(block, incrementKg, weightUnit, locale, t)}
			</p>
		)
	}

	if (block.phase === 'FINISHED') {
		return (
			<div className="mt-2 space-y-1 border-l-2 border-rule pl-3">
				<p className="type-body-sm text-foreground">{t('finished')}</p>
				<p className="type-body-sm text-ink-2">
					{t('referenceUsed', {
						value: formatWeight(block.referenceMaxKg, weightUnit, locale),
					})}
				</p>
				<p className="type-body-sm text-ink-2">
					{block.estimatedMaxKg
						? t('estimate', {
								value: formatWeight(block.estimatedMaxKg, weightUnit, locale),
							})
						: t('noEstimate')}
				</p>
				{routineId ? (
					<div className="pt-1">
						<LinearBlockContinueDialog
							routineId={routineId}
							routineExerciseId={routineExerciseId}
							exerciseName={exerciseName}
							state={block}
							incrementKg={incrementKg}
							weightUnit={weightUnit}
						/>
					</div>
				) : null}
			</div>
		)
	}

	return (
		<p className="type-body-sm mt-1 text-ink-2">
			{lpSummary(block, { rotation, incrementKg, unit: weightUnit, locale }, t)}
		</p>
	)
}
