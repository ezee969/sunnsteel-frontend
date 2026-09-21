import type {
	BlockedMembersResponse,
	CreateReportRequest,
	CreateReportResponse,
	ModerationHistoryQuery,
	ModerationHistoryResponse,
	ModerationQueueQuery,
	ModerationQueueResponse,
	ReviewReportRequest,
	ReviewReportResponse,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** Only the parameters that are set, so an absent cursor is not sent as "". */
export function buildModerationParams(
	query: ModerationQueueQuery & ModerationHistoryQuery,
): string {
	const params = new URLSearchParams()
	if (query.status) params.set('status', query.status)
	if (typeof query.limit === 'number') params.set('limit', String(query.limit))
	if (query.cursor) params.set('cursor', query.cursor)
	if (query.subjectKind) params.set('subjectKind', query.subjectKind)
	if (query.subjectId) params.set('subjectId', query.subjectId)
	const serialized = params.toString()
	return serialized ? `?${serialized}` : ''
}

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

/**
 * TRUST-04: the review side. Every route here answers 404 to an account
 * without the moderator flag, so a non-moderator cannot tell the queue exists.
 *
 * `recordView` is a POST that writes nothing a caller wants back except the
 * record itself: it is the audit row for opening somebody's reported content,
 * and the UI must await it **before** navigating, not alongside.
 */
export const moderationReviewService = {
	queue: (query: ModerationQueueQuery = {}): Promise<ModerationQueueResponse> =>
		httpClient.get<ModerationQueueResponse>(
			`/moderation/queue${buildModerationParams(query)}`,
			true,
		),

	history: (
		query: ModerationHistoryQuery = {},
	): Promise<ModerationHistoryResponse> =>
		httpClient.get<ModerationHistoryResponse>(
			`/moderation/actions${buildModerationParams(query)}`,
			true,
		),

	recordView: (reportId: string): Promise<ReviewReportResponse> =>
		httpClient.post<ReviewReportResponse>(
			`/moderation/reports/${encodeURIComponent(reportId)}/views`,
			{},
			true,
		),

	dismiss: (
		reportId: string,
		request: ReviewReportRequest = {},
	): Promise<ReviewReportResponse> =>
		httpClient.post<ReviewReportResponse>(
			`/moderation/reports/${encodeURIComponent(reportId)}/dismiss`,
			request,
			true,
		),

	hide: (
		reportId: string,
		request: ReviewReportRequest = {},
	): Promise<ReviewReportResponse> =>
		httpClient.post<ReviewReportResponse>(
			`/moderation/reports/${encodeURIComponent(reportId)}/hide`,
			request,
			true,
		),

	restore: (
		reportId: string,
		request: ReviewReportRequest = {},
	): Promise<ReviewReportResponse> =>
		httpClient.post<ReviewReportResponse>(
			`/moderation/reports/${encodeURIComponent(reportId)}/restore`,
			request,
			true,
		),
}
