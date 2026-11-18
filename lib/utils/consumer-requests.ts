import {
	type ConsumerRequestField,
	type ConsumerRequestKind,
	consumerRequestProblems,
	type CreateConsumerRequest,
	normalizeConsumerRequest,
} from '@sunsteel/contracts'

/** BILL-07: the form as typed. */
export interface ConsumerRequestDraft {
	name: string
	email: string
	reference: string
	details: string
}

export const EMPTY_CONSUMER_REQUEST: ConsumerRequestDraft = {
	name: '',
	email: '',
	reference: '',
	details: '',
}

/**
 * What would be sent, and the fields the server would refuse -- the same
 * shared rules it applies, so a refusal is named before anything is sent.
 */
export function consumerRequestToSend(
	kind: ConsumerRequestKind,
	draft: ConsumerRequestDraft,
): { request: CreateConsumerRequest; problems: ConsumerRequestField[] } {
	const request = normalizeConsumerRequest({
		kind,
		name: draft.name,
		email: draft.email,
		reference: draft.reference,
		details: draft.details,
	})
	return { request, problems: consumerRequestProblems(request) }
}

/** Where a request's page lives: the law names them by these buttons. */
export const CONSUMER_REQUEST_PATHS: Record<ConsumerRequestKind, string> = {
	REVOCATION: '/arrepentimiento',
	CANCELLATION: '/baja',
}
