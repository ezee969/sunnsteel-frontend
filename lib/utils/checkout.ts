import type {
	BillingStatus,
	CheckoutAttemptSummary,
	PlanPrice,
	SubscriptionSummary,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'

/**
 * BILL-03: what `/plans` offers, from the server's answer alone. Nothing here
 * decides access: `pro` is the plan the server reports, and Pro starts only
 * from a confirmed read of the provider.
 */
export type CheckoutOfferState =
	/** Already on Pro, from any source: nothing to buy. */
	| { kind: 'pro' }
	/** No provider is configured: Pro can't be bought. */
	| { kind: 'unavailable' }
	| { kind: 'buy'; price: PlanPrice }
	/** An attempt is waiting: go back to it rather than open another. */
	| { kind: 'resume'; price: PlanPrice; checkoutUrl: string }

export function checkoutOfferState(status: BillingStatus): CheckoutOfferState {
	if (status.plan === 'PRO') return { kind: 'pro' }
	if (!status.checkout.available) return { kind: 'unavailable' }
	const url = status.checkout.pending?.checkoutUrl
	return url
		? { kind: 'resume', price: status.checkout.price, checkoutUrl: url }
		: { kind: 'buy', price: status.checkout.price }
}

/** What the page says after returning from the provider. */
export type CheckoutReturn =
	/** Mercado Pago authorized it, and the server granted Pro. */
	| 'CONFIRMED'
	/** Not decided yet: nothing changes until the provider confirms. */
	| 'WAITING'
	| 'CANCELED'
	/** It failed or ran out of time, and a new one may start. */
	| 'CLOSED'

export function checkoutReturn(
	attempt: Pick<CheckoutAttemptSummary, 'status'>,
): CheckoutReturn {
	switch (attempt.status) {
		case 'COMPLETED':
			return 'CONFIRMED'
		case 'PENDING':
			return 'WAITING'
		case 'CANCELED':
			return 'CANCELED'
		default:
			return 'CLOSED'
	}
}

/**
 * Every billing surface says no money is charged while payments run in the
 * sandbox -- wherever checkout is offered, and for a member who holds a
 * sandbox subscription.
 */
export function showsTestMode(status: BillingStatus): boolean {
	return (
		status.checkout.testMode &&
		(status.checkout.available || status.subscription !== null)
	)
}

/** The price as the member's language writes it, without cents. */
export function formatPlanPrice(price: PlanPrice, locale: Locale): string {
	return numberFormatter(locale, {
		style: 'currency',
		currency: price.currency,
		maximumFractionDigits: 0,
	}).format(price.amount)
}

/**
 * BILL-04: what Settings › Account says about the member's subscription, from
 * the server's answer alone. A date is always the server's: the trial's end,
 * the next renewal, the end of the grace period after a failed payment, or
 * the last day of Pro once cancelled.
 */
export type SubscriptionState =
	| { kind: 'TRIALING'; until: string | null }
	| { kind: 'ACTIVE'; renews: string | null }
	| { kind: 'PAST_DUE'; until: string | null }
	| { kind: 'CANCELED'; until: string | null }

export function subscriptionState(
	subscription: SubscriptionSummary | null,
): SubscriptionState | null {
	if (!subscription) return null
	switch (subscription.status) {
		case 'TRIALING':
			return { kind: 'TRIALING', until: subscription.trialEndsAt }
		case 'ACTIVE':
			return subscription.cancelAtPeriodEnd
				? { kind: 'CANCELED', until: subscription.currentPeriodEnd }
				: { kind: 'ACTIVE', renews: subscription.currentPeriodEnd }
		case 'PAST_DUE':
			return { kind: 'PAST_DUE', until: subscription.graceEndsAt }
		case 'CANCELED':
			return { kind: 'CANCELED', until: subscription.currentPeriodEnd }
	}
}

/** Whether there is anything left to cancel: something would renew. */
export function canCancelSubscription(
	subscription: SubscriptionSummary | null,
): boolean {
	return (
		subscription !== null &&
		!subscription.cancelAtPeriodEnd &&
		(subscription.status === 'TRIALING' ||
			subscription.status === 'ACTIVE' ||
			subscription.status === 'PAST_DUE')
	)
}

/** The last day of Pro if the member cancels now, as the server would keep it. */
export function proUntilIfCancelled(
	subscription: SubscriptionSummary,
): string | null {
	if (subscription.status === 'PAST_DUE') return subscription.graceEndsAt
	// Nothing was paid during a trial, so Pro ends with it (as the server does).
	if (subscription.status === 'TRIALING') return subscription.trialEndsAt
	return subscription.currentPeriodEnd
}
