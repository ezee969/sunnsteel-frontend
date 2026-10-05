import {
	type LinearPeriodizationState,
	LP_REFERENCE_MAX_KG,
	type WeightUnit,
} from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Locale } from '@/i18n/config'
import { lpSummary } from '@/lib/utils/linear-periodization'
import {
	formatWeight,
	formatWeightInput,
	getWeightUnitLabel,
	parseWeightInput,
} from '@/lib/utils/weight-unit'

import type { RoutineWizardExercise } from '../types'
import {
	canRestartBlock,
	restartLinearPeriodization,
	withReferenceMax,
} from '../utils/linear-block'
import { sanitizeDecimalInput } from '../utils/validation.helpers'

interface LinearBlockFieldProps {
	exercise: RoutineWizardExercise
	exerciseIndex: number
	exerciseName: string
	weightUnit: WeightUnit
	/** The routine runs as a rotation: steps are sessions, not weeks. */
	rotation: boolean
	onSetLinearPeriodization: (
		exerciseIndex: number,
		state: LinearPeriodizationState,
	) => void
}

/**
 * ROUT-17: an 8-week block's reference max and where the slot stands, beside
 * the exercise's load step. The reference is editable while the block runs;
 * once it finishes, what follows is chosen on the routine's page (ROUT-19),
 * and here only a restart is offered.
 */
export function LinearBlockField({
	exercise,
	exerciseIndex,
	exerciseName,
	weightUnit,
	rotation,
	onSetLinearPeriodization,
}: LinearBlockFieldProps) {
	const t = useTranslations('routines.linearBlock')
	const locale = useLocale() as Locale
	const inputId = useId()
	const state = exercise.linearPeriodization ?? null
	const editable = !state || state.phase === 'BLOCK'
	const current = formatWeightInput(state?.referenceMaxKg, weightUnit)
	const [input, setInput] = useState(current)
	const [focused, setFocused] = useState(false)
	const [invalid, setInvalid] = useState(false)

	useEffect(() => {
		if (!focused) setInput(current)
	}, [current, focused])

	const commit = () => {
		setFocused(false)
		const trimmed = input.trim()
		if (trimmed === '' || trimmed === current) {
			setInput(current)
			setInvalid(false)
			return
		}
		const kg = parseWeightInput(trimmed, weightUnit)
		if (kg === undefined || kg <= 0 || kg > LP_REFERENCE_MAX_KG) {
			setInvalid(true)
			return
		}
		setInvalid(false)
		onSetLinearPeriodization(exerciseIndex, withReferenceMax(state, kg))
	}

	const summary = state
		? lpSummary(
				state,
				{
					rotation,
					incrementKg: exercise.minWeightIncrement,
					unit: weightUnit,
					locale,
				},
				t,
			)
		: t('noReference')

	return (
		<div className="space-y-1.5">
			{editable ? (
				<div className="flex items-center justify-between gap-3">
					<Label
						htmlFor={inputId}
						className="text-sm font-medium text-muted-foreground"
					>
						{t('referenceMax', { unit: getWeightUnitLabel(weightUnit) })}
					</Label>
					<Input
						id={inputId}
						type="text"
						inputMode="decimal"
						pattern="[0-9]*[.]?[0-9]*"
						autoComplete="off"
						aria-label={t('referenceMaxAria', { exercise: exerciseName })}
						aria-invalid={invalid || undefined}
						aria-describedby={`${inputId}-summary`}
						placeholder="100"
						value={input}
						onFocus={() => setFocused(true)}
						onChange={event => {
							setInput(sanitizeDecimalInput(event.target.value))
							setInvalid(false)
						}}
						onBlur={commit}
						className="w-32 sm:w-40 h-9 text-sm text-center"
					/>
				</div>
			) : null}
			{invalid ? (
				<p role="alert" className="type-body-sm text-ink">
					{t('invalidReference', {
						max: formatWeight(LP_REFERENCE_MAX_KG, weightUnit, locale),
					})}
				</p>
			) : null}
			<p id={`${inputId}-summary`} className="type-body-sm text-ink-2">
				{summary}
			</p>
			{editable ? (
				<p className="type-body-sm text-ink-3">{t('referenceMaxHint')}</p>
			) : (
				<p className="type-body-sm text-ink-3">{t('chooseOnRoutine')}</p>
			)}
			{state && canRestartBlock(state) ? (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="-ml-3 h-11 sm:h-9"
						>
							{t('restart')}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t('restartTitle')}</AlertDialogTitle>
							<AlertDialogDescription>
								{t('restartBody', {
									exercise: exerciseName,
									reference: formatWeight(
										state.referenceMaxKg,
										weightUnit,
										locale,
									),
								})}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
							<AlertDialogAction
								onClick={() =>
									onSetLinearPeriodization(
										exerciseIndex,
										restartLinearPeriodization(state),
									)
								}
							>
								{t('restart')}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			) : null}
		</div>
	)
}
