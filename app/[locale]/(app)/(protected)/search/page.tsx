'use client'

import { normalizeSearchQuery } from '@sunsteel/contracts'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { FollowSuggestions } from '@/features/profile/follow-suggestions'
import { RecentSearches } from '@/features/search/recent-searches'
import { SearchResults } from '@/features/search/search-results'
import { parseSearchView } from '@/lib/utils/search'

/**
 * NAV-01: the full results of the header search. Without a query it is the
 * place to start one: the member's recent searches (NAV-03) and the follow
 * suggestions it always had.
 */
export default function SearchPage() {
	const t = useTranslations('social.search')
	const searchParams = useSearchParams()
	const raw = searchParams.get('q') ?? ''
	const query = normalizeSearchQuery(raw)
	const view = parseSearchView(searchParams.get('type'))

	if (query) return <SearchResults query={query} view={view} />

	return (
		// Final review 8: the page inscription on the page grid (§11.11), not
		// a centred icon placeholder.
		<div className="mx-auto max-w-6xl">
			<div className="rule-heading pb-4">
				<h1 className="type-page corner-brackets inline-block text-foreground">
					{t('title')}
				</h1>
				<p className="mt-2 max-w-[68ch] text-sm text-ink-2 sm:text-base">
					{raw.trim() ? t('tooShort') : t('prompt')}
				</p>
			</div>
			<div className="mt-8 max-w-3xl space-y-10">
				<RecentSearches />
				<FollowSuggestions />
			</div>
		</div>
	)
}
