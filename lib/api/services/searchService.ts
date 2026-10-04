import type {
	MemberSearchPage,
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
}
