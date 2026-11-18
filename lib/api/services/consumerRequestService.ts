import type {
	ConsumerRequestReceipt,
	ConsumerRequestsResponse,
	ConsumerRequestSummary,
	CreateConsumerRequest,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/**
 * BILL-07: the botón de arrepentimiento and the botón de baja. Making a
 * request needs no account, so it is sent without the bearer token; reading
 * and settling them is a moderator's.
 */
export const consumerRequestService = {
	create: (request: CreateConsumerRequest): Promise<ConsumerRequestReceipt> =>
		httpClient.post<ConsumerRequestReceipt>('/consumer-requests', request),

	list: (): Promise<ConsumerRequestsResponse> =>
		httpClient.get<ConsumerRequestsResponse>(
			'/moderation/consumer-requests',
			true,
		),

	markDone: (id: string): Promise<ConsumerRequestSummary> =>
		httpClient.post<ConsumerRequestSummary>(
			`/moderation/consumer-requests/${encodeURIComponent(id)}/done`,
			undefined,
			true,
		),
}
