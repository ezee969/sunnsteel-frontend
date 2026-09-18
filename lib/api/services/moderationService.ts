import type {
	BlockedMembersResponse,
	CreateReportRequest,
	CreateReportResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** PROF-10: the viewer's own blocks, and filing a report. */
export const moderationService = {
	listBlocks: (): Promise<BlockedMembersResponse> =>
		httpClient.get<BlockedMembersResponse>('/users/me/blocks', true),

	block: (identifier: string): Promise<BlockedMembersResponse> =>
		httpClient.request<BlockedMembersResponse>(
			`/users/me/blocks/${encodeURIComponent(identifier)}`,
			{ method: 'PUT', secure: true },
		),

	unblock: (identifier: string): Promise<BlockedMembersResponse> =>
		httpClient.delete<BlockedMembersResponse>(
			`/users/me/blocks/${encodeURIComponent(identifier)}`,
			true,
		),

	report: (request: CreateReportRequest): Promise<CreateReportResponse> =>
		httpClient.post<CreateReportResponse>('/reports', request, true),
}
