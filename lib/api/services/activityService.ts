import type {
	ActivityFeedResponse,
	ActivityPage,
	ActivityPageQuery,
	ActivityPreviewAudience,
	ActivitySharingSettings,
	MemberActivityResponse,
	OwnActivityResponse,
	SetActivityEntryAudienceRequest,
	SetActivityEntryAudienceResponse,
	SetActivityReactionRequest,
	SetActivityReactionResponse,
	UpdateActivitySharingRequest,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

/** Only the parameters that are set, so an absent cursor is not sent as "". */
export function buildActivityParams(
	query: ActivityPageQuery & { audience?: ActivityPreviewAudience },
): string {
	const params = new URLSearchParams()
	if (query.audience) params.set('audience', query.audience)
	if (typeof query.limit === 'number') params.set('limit', String(query.limit))
	if (query.cursor) params.set('cursor', query.cursor)
	const serialized = params.toString()
	return serialized ? `?${serialized}` : ''
}

/** SOC-03/SOC-04: generated activity and the owner's sharing controls. */
export const activityService = {
	feed: (query: ActivityPageQuery = {}): Promise<ActivityFeedResponse> =>
		httpClient.get<ActivityFeedResponse>(
			`/activity/feed${buildActivityParams(query)}`,
			true,
		),

	member: (
		identifier: string,
		query: ActivityPageQuery = {},
	): Promise<MemberActivityResponse> =>
		httpClient.get<MemberActivityResponse>(
			`/activity/members/${encodeURIComponent(identifier)}${buildActivityParams(query)}`,
			true,
		),

	mine: (query: ActivityPageQuery = {}): Promise<OwnActivityResponse> =>
		httpClient.get<OwnActivityResponse>(
			`/activity/mine${buildActivityParams(query)}`,
			true,
		),

	preview: (
		audience: ActivityPreviewAudience,
		query: ActivityPageQuery = {},
	): Promise<ActivityPage> =>
		httpClient.get<ActivityPage>(
			`/activity/mine/preview${buildActivityParams({ ...query, audience })}`,
			true,
		),

	sharing: (): Promise<ActivitySharingSettings> =>
		httpClient.get<ActivitySharingSettings>('/activity/sharing', true),

	updateSharing: (
		request: UpdateActivitySharingRequest,
	): Promise<ActivitySharingSettings> =>
		httpClient.request<ActivitySharingSettings>('/activity/sharing', {
			method: 'PUT',
			body: JSON.stringify(request),
			secure: true,
		}),

	setReaction: (
		request: SetActivityReactionRequest,
	): Promise<SetActivityReactionResponse> =>
		httpClient.request<SetActivityReactionResponse>(
			'/activity/entries/reaction',
			{ method: 'PUT', body: JSON.stringify(request), secure: true },
		),

	setEntryAudience: (
		request: SetActivityEntryAudienceRequest,
	): Promise<SetActivityEntryAudienceResponse> =>
		httpClient.request<SetActivityEntryAudienceResponse>(
			'/activity/entries/audience',
			{ method: 'PUT', body: JSON.stringify(request), secure: true },
		),
}
