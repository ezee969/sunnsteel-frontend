import type {
	MemberSearchPage,
	RecentSearchesResponse,
	RecentSearchKind,
	RoutineSearchPage,
	SearchPreviewResponse,
	SearchServerCategory,
	WorkoutSearchPage,
} from '@sunsteel/contracts'

import { httpClient } from './httpClient'

type SearchPages = {
	members: MemberSearchPage
	routines: RoutineSearchPage
	workouts: WorkoutSearchPage
}

/** NAV-01: the server's half of search -- members, shared routines, workouts. */
export const searchService = {
	preview(query: string): Promise<SearchPreviewResponse> {
		const params = new URLSearchParams({ q: query })
		return httpClient.get<SearchPreviewResponse>(
			`/search?${params.toString()}`,
			true,
		)
	},

	page<C extends SearchServerCategory>(
		category: C,
		query: string,
		cursor?: string,
	): Promise<SearchPages[C]> {
		const params = new URLSearchParams({ q: query })
		if (cursor) params.set('cursor', cursor)
		return httpClient.get<SearchPages[C]>(
			`/search/${category}?${params.toString()}`,
			true,
		)
	},

	recent(): Promise<RecentSearchesResponse> {
		return httpClient.get<RecentSearchesResponse>('/search/recent', true)
	},

	recordRecent(
		kind: RecentSearchKind,
		targetId: string,
	): Promise<RecentSearchesResponse> {
		return httpClient.request<RecentSearchesResponse>('/search/recent', {
			method: 'POST',
			body: JSON.stringify({ kind, targetId }),
			secure: true,
		})
	},

	removeRecent(
		kind: RecentSearchKind,
		targetId: string,
	): Promise<RecentSearchesResponse> {
		return httpClient.request<RecentSearchesResponse>(
			`/search/recent/${kind}/${encodeURIComponent(targetId)}`,
			{ method: 'DELETE', secure: true },
		)
	},

	clearRecent(): Promise<RecentSearchesResponse> {
		return httpClient.request<RecentSearchesResponse>('/search/recent', {
			method: 'DELETE',
			secure: true,
		})
	},
}
