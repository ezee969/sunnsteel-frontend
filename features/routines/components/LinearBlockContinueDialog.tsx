'use client'

import {
	type LinearPeriodizationState,
	LP_REFERENCE_MAX_KG,
	lpRecommendation,
	type WeightUnit,
} from '@sunsteel/contracts'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { sanitizeDecimalInput } from '@/features/routines/wizard/utils/validation.helpers'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { useContinueLinearBlock } from '@/lib/api/hooks/useRoutines'
import {
	lpChangeLabel,
	lpRecommendationLine,
	lpRecoveryChoiceLabel,
	lpReferenceHint,
} from '@/lib/utils/routine-progression'
import {
	formatWeight,
	formatWeightInput,
	getWeightUnitLabel,
	parseWeightInput,
} from '@/lib/utils/weight-unit'

interface LinearBlockContinueDialogProps {
	routineId: string
	/** The routine exercise as rendered (a block's or deload's copy too). */
	routineExerciseId: string
	exerciseName: string
	/** A FINISHED slot. */
	state: LinearPeriodizationState
	incrementKg: number
	weightUnit: WeightUnit
}

/**
 * ROUT-19: the member chooses what follows a finished 8-week block. The
 * evidence comes first, the reference is pre-filled from contracts'
 * `lpRecommendation` and nothing happens until they submit.
 */
export function LinearBlockContinueDialog({
	routineId,
	routineExerciseId,
	exerciseName,
	state,
	incrementKg,
	weightUnit,
}: LinearBlockContinueDialogProps) {
	const t = useTranslations('routines.linearBlock')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const inputId = useId()
	const recoveryId = useId()
	const continueBlock = useContinueLinearBlock(routineId)
	const recommendation = useMemo(
		() =>
			lpRecommendation(
				state.referenceMaxKg,
				state.estimatedMaxKg ?? null,
				incrementKg,
			),
		[incrementKg, state.estimatedMaxKg, state.referenceMaxKg],
	)
	const prefilled = formatWeightInput(
		recommendation.nextReferenceMaxKg,
		weightUnit,
	)
	const [open, setOpen] = useState(false)
	const [input, setInput] = useState(prefilled)
	const [recovery, setRecovery] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const typedKg = parseWeightInput(input, weightUnit)
	const valid =
		typedKg !== undefined && typedKg > 0 && typedKg <= LP_REFERENCE_MAX_KG

	const onOpenChange = (next: boolean) => {
		if (continueBlock.isPending) return
		setOpen(next)
		if (next) {
			setInput(prefilled)
			setRecovery(false)
			setError(null)
		}
	}

	const submit = () => {
		if (!valid || typedKg === undefined) return
		setError(null)
		continueBlock.mutate(
			{
				routineExerciseId,
				data: { referenceMaxKg: typedKg, recovery },
			},
			{
				onSuccess: () => {
					push({ title: t('toastStarted'), variant: 'success' })
					setOpen(false)
				},
				onError: failure => setError(errorText(failure)),
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm">
					{t('chooseNext')}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t('dialogTitle', { exercise: exerciseName })}
					</DialogTitle>
					<DialogDescription>{t('dialogDescription')}</DialogDescription>
				</DialogHeader>

				<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-y border-rule-faint py-3">
					<dt className="type-body-sm text-ink-3">{t('evidenceReference')}</dt>
					<dd className="type-data text-foreground">
						{formatWeight(state.referenceMaxKg, weightUnit, locale)}
					</dd>
					<dt className="type-body-sm text-ink-3">{t('evidenceEstimate')}</dt>
					<dd className="type-data text-foreground">
						{state.estimatedMaxKg
							? formatWeight(state.estimatedMaxKg, weightUnit, locale)
							: t('noEstimateShort')}
					</dd>
					<dt className="type-body-sm text-ink-3">{t('evidenceChange')}</dt>
					<dd className="type-data text-foreground">
						{recommendation.change == null
							? '—'
							: lpChangeLabel(recommendation.change, locale)}
					</dd>
				</dl>
				<p className="type-body-sm text-ink-2">
					{lpRecommendationLine(recommendation, locale, t)}
				</p>

				<div className="space-y-1.5">
					<Label htmlFor={inputId}>
						{t('nextReference', { unit: getWeightUnitLabel(weightUnit) })}
					</Label>
					<Input
						id={inputId}
						type="text"
						inputMode="decimal"
						autoComplete="off"
						aria-invalid={!valid || undefined}
						aria-describedby={`${inputId}-hint`}
						value={input}
						onChange={event =>
							setInput(sanitizeDecimalInput(event.target.value))
						}
						className="w-40"
					/>
					<p id={`${inputId}-hint`} className="type-body-sm text-ink-3">
						{valid && typedKg !== undefined
							? lpReferenceHint(state.referenceMaxKg, typedKg, t)
							: t('invalidReference', {
									max: formatWeight(LP_REFERENCE_MAX_KG, weightUnit, locale),
								})}
					</p>
				</div>

				<div className="flex items-start gap-1">
					<label
						htmlFor={recoveryId}
						className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
					>
						<Checkbox
							id={recoveryId}
							checked={recovery}
							onCheckedChange={checked => setRecovery(checked === true)}
						/>
					</label>
					<Label htmlFor={recoveryId} className="cursor-pointer pt-3">
						{lpRecoveryChoiceLabel(state.referenceMaxKg, weightUnit, locale, t)}
					</Label>
				</div>

				{error ? (
					<p role="alert" className="type-body-sm text-ink">
						{error}
					</p>
				) : null}

				<DialogFooter>
					<DialogClose asChild>
						<Button
							type="button"
							variant="outline"
							disabled={continueBlock.isPending}
						>
							{t('cancel')}
						</Button>
					</DialogClose>
					<Button
						type="button"
						onClick={submit}
						disabled={!valid || continueBlock.isPending}
					>
						{continueBlock.isPending ? (
							<Loader2 className="size-4 animate-spin" aria-hidden />
						) : null}
						{t('submit')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
