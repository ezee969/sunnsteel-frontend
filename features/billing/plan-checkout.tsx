'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { InlineError } from '@/components/layout/inline-error'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import type { Locale } from '@/i18n/config'
import {
	useBilling,
	useCheckoutConfirmation,
	useStartCheckout,
} from '@/lib/api/hooks/useBilling'
import {
	checkoutOfferState,
	checkoutReturn,
	formatPlanPrice,
	showsTestMode,
} from '@/lib/utils/checkout'

/**
 * BILL-03: buying Pro. The member pays on Mercado Pago's own page and comes
 * back here naming the attempt (`?checkout=<id>`). **Coming back starts
 * nothing**: the page asks the server to read the provider, and says what the
 * answer was. It says no money is charged wherever checkout runs in the
 * sandbox.
 */
export function PlanCheckout() {
	const t = useTranslations('billing.checkout')
	const locale = useLocale() as Locale
	const returning = useSearchParams().get('checkout')
	const billing = useBilling()
	const start = useStartCheckout()
	const confirmation = useCheckoutConfirmation(returning)
	const errorText = useApiErrorMessage()

	if (!billing.data) return null

	const offer = checkoutOfferState(billing.data)
	const outcome = confirmation.data ? checkoutReturn(confirmation.data) : null

	const subscribe = () =>
		start.mutate(undefined, {
			onSuccess: data => {
				if (data.attempt.checkoutUrl) {
					window.location.assign(data.attempt.checkoutUrl)
				}
			},
		})
	const checkAgain = () => void confirmation.refetch()

	return (
		<div className="space-y-3">
			{returning && confirmation.isFetching ? (
				<p role="status" className="type-body text-ink-2">
					{t('confirming')}
				</p>
			) : null}
			{returning && confirmation.isError ? (
				<InlineError
					title={t('confirmErrorTitle')}
					message={errorText(confirmation.error)}
					onRetry={checkAgain}
				/>
			) : null}
			{outcome ? (
				<div role="status" className="space-y-2">
					<p className="type-body text-foreground">{t(`return.${outcome}`)}</p>
					{outcome === 'WAITING' ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={confirmation.isFetching}
							onClick={checkAgain}
						>
							{t('checkAgain')}
						</Button>
					) : null}
					{outcome === 'CONFIRMED' ? (
						<Button asChild variant="outline" size="sm">
							<Link href="/dashboard">{t('toDashboard')}</Link>
						</Button>
					) : null}
				</div>
			) : null}

			{offer.kind === 'unavailable' ? (
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{t('notForSale')}
				</p>
			) : null}

			{offer.kind === 'buy' || offer.kind === 'resume' ? (
				<div className="space-y-2">
					<p className="type-panel text-foreground">
						{t('price', { price: formatPlanPrice(offer.price, locale) })}
					</p>
					{billing.data.checkout.trialDays ? (
						<p className="type-body-sm max-w-[68ch] text-ink-2">
							{t('trial', {
								days: billing.data.checkout.trialDays,
								price: formatPlanPrice(offer.price, locale),
							})}
						</p>
					) : null}
					<p className="type-body-sm max-w-[68ch] text-ink-3">
						{t('howItWorks')}
					</p>
					{offer.kind === 'resume' ? (
						<Button asChild>
							<a href={offer.checkoutUrl}>{t('resume')}</a>
						</Button>
					) : (
						<Button
							type="button"
							disabled={start.isPending}
							onClick={subscribe}
						>
							{start.isPending ? t('opening') : t('subscribe')}
						</Button>
					)}
				</div>
			) : null}

			{start.isError ? (
				<InlineError
					title={t('startErrorTitle')}
					message={errorText(start.error)}
					onRetry={subscribe}
				/>
			) : null}

			{showsTestMode(billing.data) ? (
				<p className="type-body-sm max-w-[68ch] text-ink-3">{t('testMode')}</p>
			) : null}
		</div>
	)
}
