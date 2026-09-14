import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import {
	type CatalogFilters,
	EMPTY_CATALOG_FILTERS,
	parseCatalogFilters,
	serializeCatalogFilters,
} from '@/lib/utils/exercise-catalog'

/**
 * EXER-02: the catalog filters are mirrored into the URL, so a filtered view
 * survives a reload and can be shared. State is the source of every write;
 * the URL is only followed when something else navigates, such as the
 * sidebar link back to a bare `/exercises`.
 *
 * The URL can lag a write, so an earlier write can land after a later one
 * was requested. Those are remembered as pending and never read back as
 * navigation — reading the URL instead of state let a stale write undo
 * "Clear filters".
 */
export function useCatalogFilters() {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const urlSearch = serializeCatalogFilters(parseCatalogFilters(searchParams))

	const [committed, setCommitted] = useState(() =>
		parseCatalogFilters(searchParams),
	)
	// The typed search filters immediately and reaches the URL once it pauses.
	const [query, setQuery] = useState(committed.q)
	const debouncedQuery = useDebounce(query, 250)
	const lastDebouncedQuery = useRef(debouncedQuery)

	const latestWrite = useRef(urlSearch)
	const pendingWrites = useRef(new Set<string>())

	useEffect(() => {
		if (lastDebouncedQuery.current === debouncedQuery) return
		lastDebouncedQuery.current = debouncedQuery
		const q = debouncedQuery.trim()
		setCommitted(current => (current.q === q ? current : { ...current, q }))
	}, [debouncedQuery])

	const nextSearch = serializeCatalogFilters(committed)
	useEffect(() => {
		if (nextSearch === latestWrite.current) return
		latestWrite.current = nextSearch
		pendingWrites.current.add(nextSearch)
		// Filtering is client-only, so the history API is enough: Next syncs it
		// into `useSearchParams` without the server round trip `router.replace`
		// makes for every settled change.
		window.history.replaceState(
			null,
			'',
			nextSearch ? `${pathname}?${nextSearch}` : pathname,
		)
	}, [nextSearch, pathname])

	useEffect(() => {
		if (urlSearch === latestWrite.current) {
			pendingWrites.current.clear()
			return
		}
		if (pendingWrites.current.has(urlSearch)) return
		pendingWrites.current.clear()
		latestWrite.current = urlSearch
		const next = parseCatalogFilters(new URLSearchParams(urlSearch))
		setCommitted(next)
		setQuery(next.q)
	}, [urlSearch])

	const update = useCallback(
		(patch: Partial<Omit<CatalogFilters, 'q'>>) =>
			setCommitted(current => ({ ...current, ...patch, q: query.trim() })),
		[query],
	)

	const clear = useCallback(() => {
		setQuery('')
		setCommitted(EMPTY_CATALOG_FILTERS)
	}, [])

	const filters = useMemo(
		() => ({ ...committed, q: query }),
		[committed, query],
	)

	return { filters, setQuery, update, clear }
}
