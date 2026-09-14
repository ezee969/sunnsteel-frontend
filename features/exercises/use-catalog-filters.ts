import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import {
	type CatalogFilters,
	EMPTY_CATALOG_FILTERS,
	parseCatalogFilters,
	serializeCatalogFilters,
} from '@/lib/utils/exercise-catalog'

/**
 * EXER-02: the URL is the source of truth for the catalog filters, so a
 * filtered view survives reloads, Back and shared links. The name search keeps
 * a local value while typing and writes the URL once typing pauses.
 */
export function useCatalogFilters() {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const urlFilters = useMemo(
		() => parseCatalogFilters(searchParams),
		[searchParams],
	)
	const [query, setQuery] = useState(urlFilters.q)
	const debouncedQuery = useDebounce(query, 250)
	// The search this hook last wrote, so its own URL update is not mistaken
	// for navigation and does not overwrite what the user is still typing.
	const writtenQuery = useRef<string | null>(null)
	const lastDebouncedQuery = useRef(debouncedQuery)

	const replaceUrl = useCallback(
		(next: CatalogFilters) => {
			const q = next.q.trim()
			if (q !== urlFilters.q) writtenQuery.current = q
			const search = serializeCatalogFilters(next)
			router.replace(search ? `${pathname}?${search}` : pathname, {
				scroll: false,
			})
		},
		[pathname, router, urlFilters.q],
	)

	// Back, Forward or a shared link changed the search: follow it.
	useEffect(() => {
		if (writtenQuery.current === urlFilters.q) {
			writtenQuery.current = null
			return
		}
		setQuery(urlFilters.q)
	}, [urlFilters.q])

	// Only a settled change of the typed value writes the URL.
	useEffect(() => {
		if (lastDebouncedQuery.current === debouncedQuery) return
		lastDebouncedQuery.current = debouncedQuery
		const q = debouncedQuery.trim()
		if (q !== urlFilters.q) replaceUrl({ ...urlFilters, q })
	}, [debouncedQuery, replaceUrl, urlFilters])

	const update = useCallback(
		(patch: Partial<Omit<CatalogFilters, 'q'>>) =>
			replaceUrl({ ...urlFilters, ...patch, q: query }),
		[query, replaceUrl, urlFilters],
	)

	const clear = useCallback(() => {
		setQuery('')
		replaceUrl(EMPTY_CATALOG_FILTERS)
	}, [replaceUrl])

	const filters = useMemo(
		() => ({ ...urlFilters, q: query }),
		[query, urlFilters],
	)

	return { filters, setQuery, update, clear }
}
