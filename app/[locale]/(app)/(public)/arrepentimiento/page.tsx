'use client'

import { REVOCATION_WINDOW_DAYS } from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'

import { ConsumerRequestForm } from '@/features/legal/consumer-request-form'

/**
 * BILL-07: the botón de arrepentimiento. Argentina's consumer law lets a
 * purchase made online be revoked within ten days, without giving a reason
 * and without an account; the request is recorded with a code at once, and
 * the owner cancels and refunds it by hand.
 */
export default function RevocationPage() {
	const t = useTranslations('billing.revocationPage')
	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
			<div className="flex flex-col gap-3">
				<h1 className="type-page">{t('title')}</h1>
				<p className="type-body max-w-[68ch]">
					{t('intro', { days: REVOCATION_WINDOW_DAYS })}
				</p>
				<p className="type-body-sm text-ink-3 max-w-[68ch]">{t('noAccount')}</p>
			</div>
			<ConsumerRequestForm kind="REVOCATION" />
		</div>
	)
}
