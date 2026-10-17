import type { BillingStatus } from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** BILL-01: the caller's plan, decided by the server. */
export const billingService = {
	status: (): Promise<BillingStatus> =>
		httpClient.get<BillingStatus>('/billing/me', true),
}
