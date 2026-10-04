'use client'

import { normalizeSearchQuery } from '@sunsteel/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { type ReactNode, useEffect, useMemo } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useSearchPreview } from '@/lib/api/hooks/useSearch'
import { cn } from '@/lib/utils'
import {
	isArchivedExercise,
	isCustomExercise,
} from '@/lib/utils/custom-exercises'
import { type SuggestionEntry, suggestionGroups } from '@/lib/utils/search'

import { useOwnMatches } from './use-own-matches'

/** The id of option `index` in the list `listId`, for `aria-activedescendant`. */
export const suggestionOptionId = (listId: string, index: number) =>
	`${listId}-option-${index}`

interface SearchSuggestionsProps {
	query: string
	listId: string
	/** The option the arrow keys are on; one past the entries is "See all". */
	activeIndex: number
	onEntriesChange: (entries: SuggestionEntry[]) => void
	onChoose: (entry: SuggestionEntry) => void
	onSeeAll: () => void
	onHover: (index: number) => void
}

/**
 * NAV-02: the header's grouped suggestions -- members, exercises, routines
 * and workouts, at most three of each, from `NAV-01`'s preview read and the
 * client-side matches, ending in "See all results". A `listbox` of
 * `option`s grouped by category, driven from the field (`combobox`), so the
 * arrow keys walk every suggestion and the footer without leaving the field.
 * It is mounted only while there is a query, because the client-side half
 * reads the catalog and the member's routines.
 */
export function SearchSuggestions({
	query,
	listId,
	activeIndex,
	onEntriesChange,
	onChoose,
	onSeeAll,
	onHover,
}: SearchSuggestionsProps) {
	const t = useTranslations('shell.search')
	const normalized = normalizeSearchQuery(query) ?? ''
	const preview = useSearchPreview(normalized)
	const own = useOwnMatches(normalized)

	const groups = useMemo(
		() =>
			suggestionGroups({
				members: preview.data?.members.items,
				exercises: own.exercises,
				ownRoutines: own.routines,
				sharedRoutines: preview.data?.routines.items,
				workouts: preview.data?.workouts.items,
			}),
		[preview.data, own.exercises, own.routines],
	)
	const entries = useMemo(
		() => groups.flatMap(group => group.entries),
		[groups],
	)
	useEffect(() => onEntriesChange(entries), [entries, onEntriesChange])

	const loading =
		preview.isLoading || own.exercisesLoading || own.routinesLoading
	let index = -1
	const seeAllIndex = entries.length

	return (
		<div>
			{/* Said once, above the list and outside it, so a screen reader
			    hears why it is short. The field's spinner shows loading; this
			    names the state. */}
			<p
				aria-live="polite"
				className="type-body-sm px-3 pt-3 text-ink-3 empty:hidden"
			>
				{loading && !entries.length
					? t('searching')
					: preview.isError
						? t('failed')
						: !entries.length
							? t('nothing', { query: normalized })
							: ''}
			</p>
			<ul
				id={listId}
				role="listbox"
				aria-label={t('listLabel', { query: normalized })}
				className="py-1"
			>
				{groups.map(group => (
					<li key={group.view} role="presentation">
						<ul role="group" aria-labelledby={`${listId}-${group.view}`}>
							<li
								role="presentation"
								id={`${listId}-${group.view}`}
								className="type-label px-3 pb-1 pt-2 text-ink-3"
							>
								{t(`groups.${group.view}`)}
							</li>
							{group.entries.map(entry => {
								index += 1
								const position = index
								return (
									<Option
										key={entry.key}
										id={suggestionOptionId(listId, position)}
										active={activeIndex === position}
										onChoose={() => onChoose(entry)}
										onHover={() => onHover(position)}
									>
										<EntryContent entry={entry} />
									</Option>
								)
							})}
						</ul>
					</li>
				))}
				<li role="presentation" className="mt-1 border-t border-rule-faint">
					<ul role="group" aria-label={t('viewAll', { query: normalized })}>
						<Option
							id={suggestionOptionId(listId, seeAllIndex)}
							active={activeIndex === seeAllIndex}
							onChoose={onSeeAll}
							onHover={() => onHover(seeAllIndex)}
							className="justify-center text-center"
						>
							<span className="type-body-sm text-ink-2">
								{t('viewAll', { query: normalized })}
							</span>
						</Option>
					</ul>
				</li>
			</ul>
		</div>
	)
}

function Option({
	id,
	active,
	onChoose,
	onHover,
	className,
	children,
}: {
	id: string
	active: boolean
	onChoose: () => void
	onHover: () => void
	className?: string
	children: ReactNode
}) {
	return (
		<li
			id={id}
			role="option"
			aria-selected={active}
			// Keep the field focused: a mouse press would blur it and close
			// the list before the click lands.
			onMouseDown={event => event.preventDefault()}
			onClick={onChoose}
			onMouseMove={onHover}
			className={cn(
				'flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5 transition-colors duration-[var(--motion-fast)] ease-standard',
				active && 'bg-muted',
				className,
			)}
		>
			{children}
		</li>
	)
}

function Lines({ title, caption }: { title: ReactNode; caption?: ReactNode }) {
	return (
		<span className="min-w-0">
			<span className="type-panel block truncate text-foreground">{title}</span>
			{caption ? (
				<span className="type-body-sm block truncate text-ink-3">
					{caption}
				</span>
			) : null}
		</span>
	)
}

/** How one entry reads, in the header list and in the recent list on /search. */
export function EntryContent({ entry }: { entry: SuggestionEntry }) {
	const t = useTranslations('social.search')
	const tExercises = useTranslations('catalog.exercises')
	const tUi = useTranslations('catalog.exercisesUi')
	const tStatus = useTranslations('planning.scheduleMonth.status')
	const locale = useLocale() as Locale

	switch (entry.kind) {
		case 'member': {
			const { member } = entry
			return (
				<>
					<Avatar className="h-8 w-8 shrink-0 border border-rule">
						<AvatarImage src={member.avatarUrl || ''} alt="" />
						<AvatarFallback className="type-body-sm bg-surface-sunk text-ink-2">
							{member.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<Lines
						title={[member.name, member.lastName].filter(Boolean).join(' ')}
						caption={`@${member.username}`}
					/>
				</>
			)
		}
		case 'exercise':
			return (
				<Lines
					title={exerciseLabel(entry.exercise.name, tExercises)}
					caption={
						isCustomExercise(entry.exercise)
							? tUi('yoursRow', {
									archived: isArchivedExercise(entry.exercise) ? 'yes' : 'no',
								})
							: undefined
					}
				/>
			)
		case 'routine': {
			const size = t('routineSize', {
				days: entry.routine.days.length,
				exercises: entry.routine.days.reduce(
					(total, day) => total + day.exercises.length,
					0,
				),
			})
			return (
				<Lines
					title={entry.routine.name}
					caption={
						entry.routine.isCompleted
							? `${t('archivedRoutine')} · ${size}`
							: size
					}
				/>
			)
		}
		case 'sharedRoutine': {
			const author = [entry.routine.author.name, entry.routine.author.lastName]
				.filter(Boolean)
				.join(' ')
			return (
				<Lines
					title={entry.routine.name}
					caption={t('byAuthor', { name: author })}
				/>
			)
		}
		case 'recentRoutine': {
			const { routine } = entry
			const size = t('routineSize', {
				days: routine.dayCount,
				exercises: routine.exerciseCount,
			})
			const author = routine.author
				? [routine.author.name, routine.author.lastName]
						.filter(Boolean)
						.join(' ')
				: null
			return (
				<Lines
					title={routine.name}
					caption={
						author
							? `${t('byAuthor', { name: author })} · ${size}`
							: routine.isArchived
								? `${t('archivedRoutine')} · ${size}`
								: size
					}
				/>
			)
		}
		case 'workout': {
			const { session } = entry
			return (
				<Lines
					title={
						session.routine.dayName
							? `${session.routine.name} · ${session.routine.dayName}`
							: session.routine.name
					}
					caption={t('workoutLine', {
						date: dateFormatter(locale, { dateStyle: 'medium' }).format(
							new Date(session.startedAt),
						),
						status: tStatus(session.status),
					})}
				/>
			)
		}
	}
}

interface RecentSuggestionsProps {
	listId: string
	activeIndex: number
	entries: SuggestionEntry[]
	onChoose: (entry: SuggestionEntry) => void
	onHover: (index: number) => void
	onClear: () => void
	clearing: boolean
}

/**
 * NAV-03: with the field focused and empty, the results the member last
 * opened from search, newest first, as the same options; the arrow keys walk
 * them, and "Clear recent searches" sits outside the list.
 */
export function RecentSuggestions({
	listId,
	activeIndex,
	entries,
	onChoose,
	onHover,
	onClear,
	clearing,
}: RecentSuggestionsProps) {
	const t = useTranslations('shell.search')
	return (
		<div>
			<ul
				id={listId}
				role="listbox"
				aria-labelledby={`${listId}-recent`}
				className="py-1"
			>
				<li
					role="presentation"
					id={`${listId}-recent`}
					className="type-label px-3 pb-1 pt-2 text-ink-3"
				>
					{t('recent')}
				</li>
				{entries.map((entry, index) => (
					<Option
						key={entry.key}
						id={suggestionOptionId(listId, index)}
						active={activeIndex === index}
						onChoose={() => onChoose(entry)}
						onHover={() => onHover(index)}
					>
						<EntryContent entry={entry} />
					</Option>
				))}
			</ul>
			<div className="border-t border-rule-faint px-1 py-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="w-full"
					disabled={clearing}
					onMouseDown={event => event.preventDefault()}
					onClick={onClear}
				>
					{t('clearRecent')}
				</Button>
			</div>
		</div>
	)
}
