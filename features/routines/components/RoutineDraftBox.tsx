'use client'

import {
	type AppLocale,
	ROUTINE_DRAFT_REQUEST_MAX,
	type RoutineDraft,
} from '@sunsteel/contracts'
import { Sparkles } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { InlineError } from '@/components/layout/inline-error'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { dateFormatter } from '@/i18n/date-locale'
import {
	useCreateRoutineDraft,
	useRoutineDraftUsage,
} from '@/lib/api/hooks/useRoutineDrafts'
import { draftRequestFits, draftsLeft } from '@/lib/utils/routine-draft'

/**
 * INTEL-03: a Pro member's own words to a routine draft. The server writes it
 * and the wizard opens it for editing; nothing is saved here. Only rendered
 * for an account the server said may draft: the page shows Free the locked
 * module instead. It is one of the ways to start, so the action is an outline
 * like Use template, and the wizard's Next stays the region's filled control.
 */
export function RoutineDraftBox({
	onDraft,
}: {
	onDraft: (draft: RoutineDraft) => void
}) {
	const t = useTranslations('routines.drafts')
	const locale = useLocale()
	const errorText = useApiErrorMessage()
	const fieldId = useId()
	const hintId = useId()
	const [text, setText] = useState('')
	const usage = useRoutineDraftUsage(true)
	const create = useCreateRoutineDraft()

	const data = usage.data
	const resets = data
		? dateFormatter(locale, {
				day: 'numeric',
				month: 'long',
				timeZone: 'UTC',
			}).format(new Date(data.resetsAt))
		: ''

	const submit = () => {
		create.mutate(
			{ request: text.trim(), locale: locale as AppLocale },
			{ onSuccess: result => onDraft(result.draft) },
		)
	}

	return (
		<section aria-labelledby="routine-draft" className="space-y-2">
			<div>
				<h3 id="routine-draft" className="type-section text-foreground">
					{t('heading')}
				</h3>
				<p className="type-body-sm mt-1 text-ink-3">{t('intro')}</p>
			</div>

			{usage.isError ? (
				<InlineError
					title={t('usageFailed')}
					message={errorText(usage.error)}
					onRetry={() => void usage.refetch()}
					retrying={usage.isFetching}
				/>
			) : null}

			{data?.state === 'UNAVAILABLE' ? (
				<p className="type-body-sm text-ink-2">{t('unavailable')}</p>
			) : null}
			{data?.state === 'PAUSED' ? (
				<p className="type-body-sm text-ink-2">{t('paused')}</p>
			) : null}
			{data?.state === 'QUOTA_REACHED' ? (
				<p className="type-body-sm text-ink-2">
					{t('quotaReached', { limit: data.limit, date: resets })}
				</p>
			) : null}

			{data?.state === 'READY' ? (
				<form
					className="max-w-[68ch] space-y-2"
					onSubmit={event => {
						event.preventDefault()
						if (draftRequestFits(text) && !create.isPending) submit()
					}}
				>
					<Label htmlFor={fieldId}>{t('label')}</Label>
					<Textarea
						id={fieldId}
						aria-describedby={hintId}
						rows={4}
						maxLength={ROUTINE_DRAFT_REQUEST_MAX}
						placeholder={t('placeholder')}
						value={text}
						disabled={create.isPending}
						onChange={event => setText(event.target.value)}
					/>
					<div id={hintId} className="space-y-1">
						<p className="type-body-sm text-ink-3">{t('disclosure')}</p>
						<p className="type-body-sm text-ink-3">
							{t('left', {
								left: draftsLeft(data),
								limit: data.limit,
								date: resets,
							})}
						</p>
					</div>
					{create.isError ? (
						<InlineError
							title={t('failed')}
							message={errorText(create.error)}
						/>
					) : null}
					<Button
						type="submit"
						variant="outline"
						size="sm"
						disabled={!draftRequestFits(text) || create.isPending}
					>
						<Sparkles aria-hidden />
						{create.isPending ? t('writing') : t('write')}
					</Button>
					{create.isPending ? (
						<p role="status" className="type-body-sm text-ink-2">
							{t('writingStatus')}
						</p>
					) : null}
				</form>
			) : null}
		</section>
	)
}
