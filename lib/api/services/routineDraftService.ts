import type {
	CreateRoutineDraftRequest,
	RoutineDraftResult,
	RoutineDraftUsage,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** INTEL-03: a Pro member's monthly drafts and the writing of one. */
export const routineDraftService = {
	usage: (): Promise<RoutineDraftUsage> =>
		httpClient.get<RoutineDraftUsage>('/routine-drafts/usage', true),
	create: (body: CreateRoutineDraftRequest): Promise<RoutineDraftResult> =>
		httpClient.post<RoutineDraftResult>('/routine-drafts', body, true),
}
