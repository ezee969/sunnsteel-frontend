'use client'

import type { ConsumerRequestSummary } from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'

import { EmptyModule } from '@/components/layout/empty-module'
import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	useConsumerRequests,
	useMarkConsumerRequestDone,
} from '@/lib/api/hooks/useConsumerRequests'

/**
 * BILL-07: the revocation and cancellation requests people made, open ones
 * first. Nothing here cancels or refunds: the moderator does that in
 * Mercado Pago and then marks the request done.
 */
export function ConsumerRequestsList() {
	const t = useTranslations('social.moderationPage.requestsSection')
	const errorText = useApiErrorMessage()
	const requests = useConsumerRequests()

	return (
		<section className="flex flex-col gap-4">
			<p className="type-body-sm text-ink-3 max-w-[68ch]">{t('howTo')}</p>
			{requests.isLoading ? (
				<LoadingRows label={t('loading')} />
			) : requests.isError ? (
				<InlineError
					title={t('failed')}
					message={errorText(requests.error)}
					onRetry={() => void requests.refetch()}
					retrying={requests.isFetching}
				/>
			) : !requests.data?.requests.length ? (
				<EmptyModule title={t('none')} description={t('noneDetail')} />
			) : (
				<ul className="flex flex-col">
					{requests.data.requests.map(request => (
						<RequestRow key={request.id} request={request} />
					))}
				</ul>
			)}
		</section>
	)
}

function RequestRow({ request }: { request: ConsumerRequestSummary }) {
	const t = useTranslations('social.moderationPage.requestsSection')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const markDone = useMarkConsumerRequestDone()
	const date = (iso: string) =>
		dateFormatter(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(iso),
		)

	return (
		<li className="flex flex-col gap-2 border-b border-rule py-4 first:pt-0">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<p className="type-body">
					{t('kind', { kind: request.kind })}{' '}
					<span className="type-data text-ink-2">{request.code}</span>
				</p>
				<p className="type-body-sm text-ink-3">{date(request.createdAt)}</p>
			</div>
			<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 type-body-sm">
				<dt className="text-ink-3">{t('name')}</dt>
				<dd>{request.name}</dd>
				<dt className="text-ink-3">{t('email')}</dt>
				<dd className="break-all">{request.email}</dd>
				{request.reference ? (
					<>
						<dt className="text-ink-3">{t('reference')}</dt>
						<dd className="break-all">{request.reference}</dd>
					</>
				) : null}
				{request.details ? (
					<>
						<dt className="text-ink-3">{t('details')}</dt>
						<dd className="whitespace-pre-line">{request.details}</dd>
					</>
				) : null}
			</dl>
			{request.status === 'DONE' && request.handledAt ? (
				<p className="type-body-sm text-ink-3">
					{t('doneOn', { date: date(request.handledAt) })}
				</p>
			) : (
				<div>
					<Button
						variant="outline"
						size="sm"
						disabled={markDone.isPending}
						onClick={() => markDone.mutate(request.id)}
					>
						{t('markDone')}
					</Button>
				</div>
			)}
			{markDone.isError ? (
				<InlineError
					title={t('markFailed')}
					message={errorText(markDone.error)}
				/>
			) : null}
		</li>
	)
}
