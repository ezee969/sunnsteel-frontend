'use client'

import type { GoalSuggestion, WeightUnit } from '@sunsteel/contracts'
import { Lightbulb, Loader2, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import {
	useAcceptGoalSuggestion,
	useDismissGoalSuggestion,
} from '@/lib/api/hooks/useGoalSuggestions'
import { describeGoalSuggestion } from '@/lib/utils/goal-suggestions'

function SuggestionRow({
	suggestion,
	weightUnit,
	Heading,
}: {
	suggestion: GoalSuggestion
	weightUnit: WeightUnit
	Heading: 'h3' | 'h4'
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.goalSuggestions')
	const tExercises = useTranslations('catalog.exercises')
	const errorText = useApiErrorMessage()
	const { push } = useToast()
	const accept = useAcceptGoalSuggestion()
	const dismiss = useDismissGoalSuggestion()
	const { title, basis } = describeGoalSuggestion(
		suggestion,
		weightUnit,
		locale,
		t,
		tExercises,
	)
	const busy = accept.isPending || dismiss.isPending

	return (
		<li className="rule-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div className="min-w-0">
				<Heading className="type-panel flex items-center gap-2 text-foreground">
					<Lightbulb className="size-4 shrink-0 text-ink-3" aria-hidden />
					<span className="min-w-0">{title}</span>
				</Heading>
				<p className="type-body-sm mt-1 text-ink-3">{basis}</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy}
					aria-label={t('addAria', { goal: title })}
					onClick={() =>
						accept.mutate(suggestion, {
							onSuccess: () =>
								push({
									title: t('added'),
									description: t('addedBody', { goal: title }),
									variant: 'success',
								}),
							onError: error =>
								push({
									title: t('addFailed'),
									description: errorText(error),
									variant: 'destructive',
								}),
						})
					}
				>
					{accept.isPending ? (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					) : (
						<Plus className="size-4" aria-hidden />
					)}
					{t('add')}
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={busy}
					aria-label={t('notNowAria', { goal: title })}
					onClick={() =>
						dismiss.mutate(suggestion, {
							onError: error =>
								push({
									title: t('dismissFailed'),
									description: errorText(error),
									variant: 'destructive',
								}),
						})
					}
				>
					{t('notNow')}
				</Button>
			</div>
		</li>
	)
}

/**
 * ACH-06: the goals the server suggests from the member's own training, each
 * with where its number came from. Adding one is the ordinary goals write;
 * "Not now" sets it aside on the account until the number would change.
 */
export function GoalSuggestionList({
	suggestions,
	weightUnit,
	heading,
}: {
	suggestions: readonly GoalSuggestion[]
	weightUnit: WeightUnit
	/** Shown above the list when the region already has its own heading. */
	heading?: string
}) {
	const t = useTranslations('progress.goalSuggestions')
	if (suggestions.length === 0) return null
	return (
		<div className="space-y-2">
			{heading ? (
				<p className="type-body-sm text-ink-2">{heading}</p>
			) : (
				<div>
					<h3 className="type-panel text-foreground">{t('heading')}</h3>
					<p className="type-body-sm mt-1 max-w-[68ch] text-ink-3">
						{t('description')}
					</p>
				</div>
			)}
			<ul className="border-t border-rule-faint">
				{suggestions.map(suggestion => (
					<SuggestionRow
						key={suggestion.key}
						suggestion={suggestion}
						weightUnit={weightUnit}
						// Under the list's own h3, or straight under the region's h2.
						Heading={heading ? 'h3' : 'h4'}
					/>
				))}
			</ul>
		</div>
	)
}
