'use client'

import {
	CONSUMER_REQUEST_DETAILS_MAX,
	CONSUMER_REQUEST_REFERENCE_MAX,
	type ConsumerRequestField,
	type ConsumerRequestKind,
	type ConsumerRequestReceipt,
} from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useState } from 'react'

import { InlineError } from '@/components/layout/inline-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useCreateConsumerRequest } from '@/lib/api/hooks/useConsumerRequests'
import {
	type ConsumerRequestDraft,
	consumerRequestToSend,
	EMPTY_CONSUMER_REQUEST,
} from '@/lib/utils/consumer-requests'

/**
 * BILL-07: the form behind the botón de arrepentimiento and the botón de
 * baja. No account is needed. The shared rules name a problem before anything
 * is sent; once sent, the code is the person's proof that they asked.
 */
export function ConsumerRequestForm({ kind }: { kind: ConsumerRequestKind }) {
	const t = useTranslations('billing.consumerRequest')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const id = useId()
	const [draft, setDraft] = useState<ConsumerRequestDraft>(
		EMPTY_CONSUMER_REQUEST,
	)
	const [attempted, setAttempted] = useState(false)
	const [receipt, setReceipt] = useState<ConsumerRequestReceipt | null>(null)
	const create = useCreateConsumerRequest()

	const { request, problems } = consumerRequestToSend(kind, draft)
	const shown = attempted ? problems : []
	const problemId = (field: ConsumerRequestField) => `${id}-${field}-problem`
	const invalid = (field: ConsumerRequestField) =>
		shown.includes(field) ? true : undefined
	const describedBy = (field: ConsumerRequestField) =>
		shown.includes(field) ? problemId(field) : undefined

	if (receipt) {
		return (
			<section
				className="mark mark-success flex flex-col gap-2 bg-surface-sunk p-4"
				aria-labelledby={`${id}-done`}
				role="status"
			>
				<h2 id={`${id}-done`} className="type-section">
					{t('receivedTitle')}
				</h2>
				<p className="type-body-sm text-ink-2">{t('codeLabel')}</p>
				<p className="type-data-strong text-foreground">{receipt.code}</p>
				<p className="type-body-sm text-ink-2 max-w-[68ch]">
					{t('receivedBody', {
						date: dateFormatter(locale, {
							dateStyle: 'long',
							timeStyle: 'short',
						}).format(new Date(receipt.createdAt)),
					})}
				</p>
				<p className="type-body-sm text-ink-2 max-w-[68ch]">
					{kind === 'REVOCATION' ? t('nextRevocation') : t('nextCancellation')}
				</p>
			</section>
		)
	}

	const set =
		(field: keyof ConsumerRequestDraft) =>
		(event: { target: { value: string } }) =>
			setDraft(current => ({ ...current, [field]: event.target.value }))

	const problemText: Record<ConsumerRequestField, string> = {
		kind: t('problemKind'),
		name: t('problemName'),
		email: t('problemEmail'),
		reference: t('problemTooLong', { max: CONSUMER_REQUEST_REFERENCE_MAX }),
		details: t('problemTooLong', { max: CONSUMER_REQUEST_DETAILS_MAX }),
	}

	return (
		<form
			className="flex max-w-xl flex-col gap-4"
			noValidate
			onSubmit={event => {
				event.preventDefault()
				setAttempted(true)
				if (problems.length > 0) return
				create.mutate(request, { onSuccess: setReceipt })
			}}
		>
			<div className="flex flex-col gap-1">
				<Label htmlFor={`${id}-name`}>{t('name')}</Label>
				<Input
					id={`${id}-name`}
					autoComplete="name"
					value={draft.name}
					onChange={set('name')}
					aria-invalid={invalid('name')}
					aria-describedby={describedBy('name')}
				/>
				{shown.includes('name') ? (
					<p id={problemId('name')} className="type-body-sm text-ink">
						{problemText.name}
					</p>
				) : null}
			</div>
			<div className="flex flex-col gap-1">
				<Label htmlFor={`${id}-email`}>{t('email')}</Label>
				<Input
					id={`${id}-email`}
					type="email"
					autoComplete="email"
					value={draft.email}
					onChange={set('email')}
					aria-invalid={invalid('email')}
					aria-describedby={describedBy('email')}
				/>
				{shown.includes('email') ? (
					<p id={problemId('email')} className="type-body-sm text-ink">
						{problemText.email}
					</p>
				) : null}
			</div>
			<div className="flex flex-col gap-1">
				<Label htmlFor={`${id}-reference`}>{t('reference')}</Label>
				<Input
					id={`${id}-reference`}
					value={draft.reference}
					onChange={set('reference')}
					aria-invalid={invalid('reference')}
					aria-describedby={describedBy('reference') ?? `${id}-reference-hint`}
				/>
				<p id={`${id}-reference-hint`} className="type-body-sm text-ink-3">
					{t('referenceHint')}
				</p>
				{shown.includes('reference') ? (
					<p id={problemId('reference')} className="type-body-sm text-ink">
						{problemText.reference}
					</p>
				) : null}
			</div>
			<div className="flex flex-col gap-1">
				<Label htmlFor={`${id}-details`}>{t('details')}</Label>
				<Textarea
					id={`${id}-details`}
					rows={3}
					value={draft.details}
					onChange={set('details')}
					aria-invalid={invalid('details')}
					aria-describedby={describedBy('details')}
				/>
				{shown.includes('details') ? (
					<p id={problemId('details')} className="type-body-sm text-ink">
						{problemText.details}
					</p>
				) : null}
			</div>
			{create.isError ? (
				<InlineError title={t('failed')} message={errorText(create.error)} />
			) : null}
			<div>
				<Button type="submit" disabled={create.isPending}>
					{create.isPending ? t('sending') : t('send')}
				</Button>
			</div>
			<p className="type-body-sm text-ink-3 max-w-[68ch]">{t('privacy')}</p>
		</form>
	)
}
