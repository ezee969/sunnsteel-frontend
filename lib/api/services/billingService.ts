import type { BillingStatus, CheckoutConfirmation } from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** BILL-01: the caller's plan, decided by the server. */
export const billingService = {
	status: (): Promise<BillingStatus> =>
		httpClient.get<BillingStatus>('/billing/me', true),
	/** BILL-03: opens the member's one waiting attempt, or returns it. */
	startCheckout: (): Promise<CheckoutConfirmation> =>
		httpClient.post<CheckoutConfirmation>('/billing/checkout', undefined, true),
	/** BILL-04: cancels at the provider; Pro lasts to the end of what was paid. */
	cancelSubscription: (): Promise<BillingStatus> =>
		httpClient.post<BillingStatus>(
			'/billing/subscription/cancel',
			undefined,
			true,
		),
	/** Asks the server to read the provider; only that can start Pro. */
	confirmCheckout: (id: string): Promise<CheckoutConfirmation> =>
		httpClient.post<CheckoutConfirmation>(
			`/billing/checkout/${encodeURIComponent(id)}/confirm`,
			undefined,
			true,
		),
}
