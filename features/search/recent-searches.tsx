'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { exerciseLabel } from '@/i18n/catalog'
import {
	useClearRecentSearches,
	useRecentSearches,
	useRecordRecentSearch,
	useRemoveRecentSearch,
} from '@/lib/api/hooks/useSearch'
import {
	recentEntries,
	recentTarget,
	type SuggestionEntry,
} from '@/lib/utils/search'

import { EntryContent } from './search-suggestions'

/**
 * NAV-03: the results the member last opened from search, on `/search`
 * before a query. Each opens where it opened from search (and moves to the
 * top again), each can be removed, and Clear all empties the list. Nothing
 * renders when the list is empty: the page's prompt already says what to do.
 */
export function RecentSearches() {
	const t = useTranslations('social.search')
	const tExercises = useTranslations('catalog.exercises')
	const headingId = useId()
	const recent = useRecentSearches()
	const record = useRecordRecentSearch()
	const remove = useRemoveRecentSearch()
	const clear = useClearRecentSearches()
	const entries = useMemo(
		() => recentEntries(recent.data?.items ?? []),
		[recent.data],
	)
	if (!entries.length) return null

	const nameOf = (entry: SuggestionEntry) => {
		switch (entry.kind) {
			case 'member':
				return [entry.member.name, entry.member.lastName]
					.filter(Boolean)
					.join(' ')
			case 'exercise':
				return exerciseLabel(entry.exercise.name, tExercises)
			case 'workout':
				return entry.session.routine.name
			default:
				return entry.routine.name
		}
	}

	return (
		<section aria-labelledby={headingId} className="space-y-1">
			<div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
				<h2 id={headingId} className="type-section">
					{t('recentTitle')}
				</h2>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-11 shrink-0 sm:h-9"
					disabled={clear.isPending}
					onClick={() => clear.mutate()}
				>
					{t('clearRecent')}
				</Button>
			</div>
			<p className="type-body-sm text-ink-3">{t('recentSummary')}</p>
			<ul>
				{entries.map(entry => (
					<li key={entry.key} className="rule-row flex items-center gap-2">
						<Link
							href={entry.href}
							onClick={() => record.mutate(recentTarget(entry))}
							className="flex min-w-0 flex-1 items-center gap-3 rounded-sm py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							<EntryContent entry={entry} />
						</Link>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="shrink-0"
							disabled={remove.isPending}
							aria-label={t('removeRecent', { name: nameOf(entry) })}
							onClick={() => remove.mutate(recentTarget(entry))}
						>
							<X aria-hidden />
						</Button>
					</li>
				))}
			</ul>
		</section>
	)
}
