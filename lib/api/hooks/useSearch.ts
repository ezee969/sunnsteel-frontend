import {
	normalizeSearchQuery,
	type RecentSearchesResponse,
	type RecentSearchKind,
	type SearchServerCategory,
} from '@sunsteel/contracts'
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'

import { searchService } from '@/lib/api/services/searchService'
import { useSupabaseAuth as useAuth } from '@/providers/supabase-auth-provider'

/**
 * NAV-01. Everything under `['search']`, so a block (which can remove a
 * member and their routines from any result) reaches every loaded search.
 * Results go stale after half a minute rather than the app's five: a
 * follow, a privacy change or a new workout changes what a query finds.
 */
export const searchKeys = {
	all: ['search'] as const,
	preview: (query: string) => ['search', 'preview', query] as const,
	page: (category: SearchServerCategory, query: string) =>
		['search', category, query] as const,
	recent: ['search', 'recent'] as const,
}

const SEARCH_STALE_MS = 30_000

/** The first few of each server category, behind the All view. */
export function useSearchPreview(rawQuery: string) {
	const { session } = useAuth()
	const query = normalizeSearchQuery(rawQuery)
	return useQuery({
		queryKey: searchKeys.preview(query ?? ''),
		queryFn: () => searchService.preview(query!),
		// Gated on the session, not on the backend verification — see TD-18.
		enabled: !!session && !!query,
		staleTime: SEARCH_STALE_MS,
	})
}

/** One category, page by page, behind its tab. */
export function useSearchPages<C extends SearchServerCategory>(
	category: C,
	rawQuery: string,
	enabled = true,
) {
	const { session } = useAuth()
	const query = normalizeSearchQuery(rawQuery)
	return useInfiniteQuery({
		queryKey: searchKeys.page(category, query ?? ''),
		queryFn: ({ pageParam }) =>
			searchService.page(category, query!, pageParam as string | undefined),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
		enabled: enabled && !!session && !!query,
		staleTime: SEARCH_STALE_MS,
	})
}

/**
 * NAV-03: the results the member last opened from search, on the account.
 * The server resolves every entry again on each read, so a block, a hide or
 * a routine made private takes an entry away here too.
 */
export function useRecentSearches(enabled = true) {
	const { session } = useAuth()
	return useQuery({
		queryKey: searchKeys.recent,
		queryFn: () => searchService.recent(),
		enabled: enabled && !!session,
		staleTime: SEARCH_STALE_MS,
	})
}

/** Every write answers with the whole list, which replaces the cache. */
function useRecentWrite<V>(
	write: (vars: V) => Promise<RecentSearchesResponse>,
) {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: write,
		onSuccess: response =>
			queryClient.setQueryData(searchKeys.recent, response),
	})
}

/**
 * Called as a result opens. It is fire-and-forget: a failure only means the
 * result is not listed later, never a message in the way of where the member
 * was going.
 */
export function useRecordRecentSearch() {
	return useRecentWrite(
		(target: { kind: RecentSearchKind; targetId: string }) =>
			searchService.recordRecent(target.kind, target.targetId),
	)
}

export function useRemoveRecentSearch() {
	return useRecentWrite(
		(target: { kind: RecentSearchKind; targetId: string }) =>
			searchService.removeRecent(target.kind, target.targetId),
	)
}

export function useClearRecentSearches() {
	return useRecentWrite<void>(() => searchService.clearRecent())
}
