'use client'

import { normalizeSearchQuery } from '@sunsteel/contracts'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react'

import {
	RecentSuggestions,
	SearchSuggestions,
	suggestionOptionId,
} from '@/features/search/search-suggestions'
import {
	useClearRecentSearches,
	useRecentSearches,
	useRecordRecentSearch,
	useSearchPreview,
} from '@/lib/api/hooks/useSearch'
import {
	moveActive,
	recentEntries,
	recentTarget,
	searchHref,
	type SuggestionEntry,
} from '@/lib/utils/search'

import { Input } from './input'

/**
 * The header's one search field (NAV-01 to NAV-03). Typing shows grouped
 * suggestions under it; Enter opens the full results, or the suggestion the
 * arrow keys are on. Focused and empty, it lists the results the member last
 * opened from search, and opening any result records it there. Its v1.1
 * presentation is unchanged (§26.6).
 */
export function SearchBar() {
	const t = useTranslations('shell.search')
	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const [isFocused, setIsFocused] = useState(false)
	const [activeIndex, setActiveIndex] = useState(-1)
	const entriesRef = useRef<SuggestionEntry[]>([])
	const router = useRouter()
	const containerRef = useRef<HTMLDivElement>(null)
	const listId = useId()

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedQuery(query), 300)
		return () => clearTimeout(handler)
	}, [query])

	// A new query starts with no suggestion chosen.
	useEffect(() => setActiveIndex(-1), [debouncedQuery])

	const normalized = normalizeSearchQuery(debouncedQuery)
	// The same key the suggestions read, so this only drives the spinner.
	const { isFetching } = useSearchPreview(debouncedQuery)

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsFocused(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// NAV-03: read only once the field is focused, so no page pays for it.
	const recent = useRecentSearches(isFocused)
	const recentList = useMemo(
		() => recentEntries(recent.data?.items ?? []),
		[recent.data],
	)
	const recordRecent = useRecordRecentSearch()
	const clearRecent = useClearRecentSearches()

	const showSuggestions = isFocused && !!normalized
	const showRecent = isFocused && !query.trim() && recentList.length > 0
	const showDropdown = showSuggestions || showRecent
	const currentEntries = () => (showRecent ? recentList : entriesRef.current)
	const onEntriesChange = useCallback((entries: SuggestionEntry[]) => {
		entriesRef.current = entries
		setActiveIndex(current => (current > entries.length ? -1 : current))
	}, [])

	const close = () => {
		setIsFocused(false)
		setActiveIndex(-1)
	}

	const openAll = () => {
		const value = query.trim()
		if (!value) return
		router.push(searchHref(value))
		close()
	}

	const openEntry = (entry: SuggestionEntry) => {
		recordRecent.mutate(recentTarget(entry))
		router.push(entry.href)
		setQuery('')
		setDebouncedQuery('')
		close()
	}

	const handleSearchSubmit = (event: React.FormEvent) => {
		event.preventDefault()
		const entries = currentEntries()
		if (showDropdown && activeIndex >= 0 && activeIndex < entries.length) {
			openEntry(entries[activeIndex])
		} else {
			openAll()
		}
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape') {
			if (showDropdown) {
				event.preventDefault()
				close()
			}
			return
		}
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		if (!normalized && !showRecent) return
		event.preventDefault()
		setIsFocused(true)
		// Every suggestion plus "See all results"; recent results alone.
		const total = showRecent ? recentList.length : entriesRef.current.length + 1
		setActiveIndex(current =>
			moveActive(current, total, event.key === 'ArrowDown' ? 1 : -1),
		)
	}

	return (
		<div className="relative w-full max-w-sm" ref={containerRef}>
			<form
				onSubmit={handleSearchSubmit}
				className="relative group"
				role="search"
			>
				<Search
					className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3 transition-colors duration-[var(--motion-fast)] ease-standard group-focus-within:text-foreground"
					aria-hidden
				/>
				{/* The field takes the primitive's own boundary (§11.6). */}
				<Input
					type="text"
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={showDropdown}
					aria-controls={showDropdown ? listId : undefined}
					aria-activedescendant={
						showDropdown && activeIndex >= 0
							? suggestionOptionId(listId, activeIndex)
							: undefined
					}
					placeholder={t('placeholder')}
					aria-label={t('label')}
					// v1.1 §26.6: a field too narrow for its placeholder ends it with
					// an ellipsis rather than a cut letter; the right padding still
					// clears the spinner.
					className="w-full text-ellipsis pl-9 pr-9"
					value={query}
					onChange={e => {
						setQuery(e.target.value)
						setIsFocused(true)
					}}
					onFocus={() => setIsFocused(true)}
					// Opening a suggestion keeps the field focused, so a click on
					// it must reopen the list without a new focus event.
					onClick={() => setIsFocused(true)}
					onKeyDown={handleKeyDown}
				/>
				{isFetching && (
					<Loader2
						aria-hidden
						className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ink-3"
					/>
				)}
			</form>

			<AnimatePresence>
				{showDropdown && (
					// §11.9/§8 — an overlay separates by shadow in light, by scrim and
					// a 1px rule in dark. Nothing here is translucent or blurred.
					// NAV-02: below `sm` the field is too narrow to read a suggestion
					// in, so the panel spans the screen under the topbar (16px
					// gutters, §26.3); its height is capped to the viewport and the
					// scroll is the overlay's own (§20).
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
						className="absolute top-full z-50 mt-2 w-full overflow-y-auto overscroll-contain rounded-md border border-rule bg-popover text-popover-foreground shadow-overlay max-sm:fixed max-sm:inset-x-4 max-sm:top-[3.75rem] max-sm:mt-0 max-sm:w-auto max-h-[min(70vh,32rem)] dark:shadow-none"
					>
						{showRecent ? (
							<RecentSuggestions
								listId={listId}
								activeIndex={activeIndex}
								entries={recentList}
								onChoose={openEntry}
								onHover={setActiveIndex}
								onClear={() => {
									clearRecent.mutate()
									setActiveIndex(-1)
								}}
								clearing={clearRecent.isPending}
							/>
						) : (
							<SearchSuggestions
								query={debouncedQuery}
								listId={listId}
								activeIndex={activeIndex}
								onEntriesChange={onEntriesChange}
								onChoose={openEntry}
								onSeeAll={openAll}
								onHover={setActiveIndex}
							/>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
