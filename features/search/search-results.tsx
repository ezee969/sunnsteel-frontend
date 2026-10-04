'use client'

import type { SearchServerCategory } from '@sunsteel/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { type ReactNode, useId, useMemo } from 'react'

import { Explanation } from '@/components/layout/explanation'
import { PageTabs } from '@/components/layout/page-tabs'
import { ShowMoreButton, useShowMore } from '@/components/layout/show-more'
import { Button } from '@/components/ui/button'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useLoadMoreOnScroll } from '@/hooks/use-load-more-on-scroll'
import { useSearchPages, useSearchPreview } from '@/lib/api/hooks/useSearch'
import {
	SEARCH_ALL_VIEW_LIMIT,
	searchHref,
	searchTabs,
	type SearchView,
} from '@/lib/utils/search'

import {
	ExerciseResultRow,
	MemberResultRow,
	OwnRoutineResultRow,
	ResultRowsLoading,
	SharedRoutineResultRow,
	WorkoutResultRow,
} from './search-rows'
import { useOwnMatches } from './use-own-matches'

/** How many rows a client-matched list shows before "Show N more" (§20.2). */
const CLIENT_LIST_LIMIT = 20

/**
 * NAV-01: the full results page under one query. The tabs are design system
 * §21's route tabs with the view held in the query (`?type=`), All first.
 */
export function SearchResults({
	query,
	view,
}: {
	query: string
	view: SearchView
}) {
	const t = useTranslations('social.search')
	const tabs = useMemo(
		() => searchTabs(query, current => t(`views.${current}`)),
		[query, t],
	)
	return (
		// The masthead, tab bar and content sit as Progress's do (§21), one
		// gap apart; the "showing" line is the explanation's one line, so a
		// phone reaches the tabs a line sooner (§23.4).
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<div className="rule-heading pb-4">
				<h1 className="type-page corner-brackets inline-block text-foreground">
					{t('resultsTitle')}
				</h1>
				<Explanation
					className="mt-2"
					summary={t.rich('showing', {
						query,
						hl: chunks => (
							<span className="type-data text-foreground">{chunks}</span>
						),
					})}
				>
					<p className="type-body-sm text-ink-2">{t('summary')}</p>
					<ul className="type-body-sm mt-2 list-disc space-y-1 pl-5 text-ink-2">
						<li>{t('rulesMembers')}</li>
						<li>{t('rulesRoutines')}</li>
						<li>{t('rulesWorkouts')}</li>
					</ul>
				</Explanation>
			</div>
			<PageTabs label={t('tabsLabel')} tabs={tabs} />
			<div>
				{view === 'all' ? <AllResults query={query} /> : null}
				{view === 'members' ? <MemberPages query={query} /> : null}
				{view === 'exercises' ? <ExerciseList query={query} /> : null}
				{view === 'routines' ? <RoutineLists query={query} /> : null}
				{view === 'workouts' ? <WorkoutPages query={query} /> : null}
			</div>
		</div>
	)
}

function ResultSection({
	title,
	children,
	more,
}: {
	title: string
	children: ReactNode
	more?: { href: string; label: string } | null
}) {
	const id = useId()
	return (
		<section aria-labelledby={id} className="space-y-1">
			<h2 id={id} className="type-section border-b border-rule pb-2">
				{title}
			</h2>
			{children}
			{more ? (
				<Button asChild variant="ghost" size="sm" className="mt-1 h-11 sm:h-9">
					<Link href={more.href}>{more.label}</Link>
				</Button>
			) : null}
		</section>
	)
}

function AllResults({ query }: { query: string }) {
	const t = useTranslations('social.search')
	const apiError = useApiErrorMessage()
	const preview = useSearchPreview(query)
	const own = useOwnMatches(query)
	const limit = SEARCH_ALL_VIEW_LIMIT

	const members = preview.data?.members
	const shared = preview.data?.routines
	const workouts = preview.data?.workouts
	const loading =
		preview.isLoading || own.exercisesLoading || own.routinesLoading
	const nothing =
		!loading &&
		!preview.isError &&
		!members?.items.length &&
		!own.exercises.length &&
		!own.routines.length &&
		!shared?.items.length &&
		!workouts?.items.length

	if (nothing) return <NothingFound query={query} />

	return (
		<div className="space-y-10">
			{preview.isError ? (
				<p role="alert" className="type-body-sm text-destructive">
					{apiError(preview.error)}
				</p>
			) : null}
			{preview.isLoading ? (
				<ResultSection title={t('views.members')}>
					<ResultRowsLoading />
				</ResultSection>
			) : members?.items.length ? (
				<ResultSection
					title={t('views.members')}
					more={
						members.nextCursor
							? {
									href: searchHref(query, 'members'),
									label: t('seeAllMembers'),
								}
							: null
					}
				>
					<ul>
						{members.items.map(member => (
							<MemberResultRow key={member.id} member={member} />
						))}
					</ul>
				</ResultSection>
			) : null}

			{own.exercises.length ? (
				<ResultSection
					title={t('views.exercises')}
					more={
						own.exercises.length > limit
							? {
									href: searchHref(query, 'exercises'),
									label: t('seeAllExercises'),
								}
							: null
					}
				>
					<ul>
						{own.exercises.slice(0, limit).map(exercise => (
							<ExerciseResultRow key={exercise.id} exercise={exercise} />
						))}
					</ul>
				</ResultSection>
			) : null}

			{own.routines.length || shared?.items.length || preview.isLoading ? (
				<ResultSection
					title={t('views.routines')}
					more={
						own.routines.length > limit || shared?.nextCursor
							? {
									href: searchHref(query, 'routines'),
									label: t('seeAllRoutines'),
								}
							: null
					}
				>
					{own.routines.length ? (
						<RoutineGroup title={t('yourRoutines')}>
							{own.routines.slice(0, limit).map(routine => (
								<OwnRoutineResultRow key={routine.id} routine={routine} />
							))}
						</RoutineGroup>
					) : null}
					{preview.isLoading ? (
						<ResultRowsLoading rows={2} />
					) : shared?.items.length ? (
						<RoutineGroup title={t('sharedRoutines')}>
							{shared.items.map(routine => (
								<SharedRoutineResultRow
									key={routine.routineId}
									routine={routine}
								/>
							))}
						</RoutineGroup>
					) : null}
				</ResultSection>
			) : null}

			{preview.isLoading ? (
				<ResultSection title={t('views.workouts')}>
					<ResultRowsLoading />
				</ResultSection>
			) : workouts?.items.length ? (
				<ResultSection
					title={t('views.workouts')}
					more={
						workouts.nextCursor
							? {
									href: searchHref(query, 'workouts'),
									label: t('seeAllWorkouts'),
								}
							: null
					}
				>
					<ul>
						{workouts.items.map(session => (
							<WorkoutResultRow key={session.id} session={session} />
						))}
					</ul>
				</ResultSection>
			) : null}
		</div>
	)
}

function RoutineGroup({
	title,
	children,
}: {
	title: string
	children: ReactNode
}) {
	const id = useId()
	return (
		<div role="group" aria-labelledby={id} className="pt-3">
			<h3 id={id} className="type-label text-ink-3">
				{title}
			</h3>
			<ul>{children}</ul>
		</div>
	)
}

function NothingFound({ query }: { query: string }) {
	const t = useTranslations('social.search')
	return (
		<div className="max-w-[68ch] space-y-1">
			<h2 className="type-panel text-foreground">{t('noneTitle')}</h2>
			<p className="type-body-sm text-ink-3">{t('noneBody', { query })}</p>
		</div>
	)
}

function EmptyLine({ children }: { children: ReactNode }) {
	return <p className="type-body-sm py-3 text-ink-3">{children}</p>
}

/** One server category, page by page: Load more, or scrolling to its end. */
function useServerPages<C extends SearchServerCategory>(
	category: C,
	query: string,
) {
	const pages = useSearchPages(category, query)
	const sentinel = useLoadMoreOnScroll<HTMLDivElement>({
		enabled: !!pages.hasNextPage && !pages.isFetchingNextPage,
		onLoadMore: () => void pages.fetchNextPage(),
	})
	return { pages, sentinel }
}

function PageFooter({
	pages,
	sentinel,
}: {
	pages: {
		hasNextPage: boolean
		isFetchingNextPage: boolean
		fetchNextPage: () => unknown
	}
	sentinel: (element: HTMLDivElement | null) => void
}) {
	const t = useTranslations('social.search')
	if (!pages.hasNextPage) return null
	return (
		<div ref={sentinel} className="pt-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-11 sm:h-9"
				disabled={pages.isFetchingNextPage}
				onClick={() => void pages.fetchNextPage()}
			>
				{pages.isFetchingNextPage ? t('loadingMore') : t('loadMore')}
			</Button>
		</div>
	)
}

function PagesError({ error }: { error: unknown }) {
	const apiError = useApiErrorMessage()
	return (
		<p role="alert" className="type-body-sm text-destructive">
			{apiError(error)}
		</p>
	)
}

function MemberPages({ query }: { query: string }) {
	const t = useTranslations('social.search')
	const { pages, sentinel } = useServerPages('members', query)
	const items = pages.data?.pages.flatMap(page => page.items) ?? []
	if (pages.isLoading) return <ResultRowsLoading rows={5} />
	if (pages.isError) return <PagesError error={pages.error} />
	if (!items.length) {
		return (
			<>
				<EmptyLine>{t('membersNone', { query })}</EmptyLine>
				<p className="type-body-sm max-w-[68ch] text-ink-3">
					{t('rulesMembers')}
				</p>
			</>
		)
	}
	return (
		<>
			<ul>
				{items.map(member => (
					<MemberResultRow key={member.id} member={member} />
				))}
			</ul>
			<PageFooter pages={pages} sentinel={sentinel} />
		</>
	)
}

function ExerciseList({ query }: { query: string }) {
	const t = useTranslations('social.search')
	const own = useOwnMatches(query)
	const listId = useId()
	const more = useShowMore(own.exercises, CLIENT_LIST_LIMIT)
	if (own.exercisesLoading) return <ResultRowsLoading rows={5} />
	if (!own.exercises.length) {
		return <EmptyLine>{t('exercisesNone', { query })}</EmptyLine>
	}
	return (
		<>
			<ul id={listId}>
				{more.visible.map(exercise => (
					<ExerciseResultRow key={exercise.id} exercise={exercise} />
				))}
			</ul>
			<ShowMoreButton
				label={more.label}
				expanded={more.expanded}
				onToggle={more.toggle}
				controls={listId}
			/>
		</>
	)
}

function RoutineLists({ query }: { query: string }) {
	const t = useTranslations('social.search')
	const own = useOwnMatches(query)
	const ownListId = useId()
	const ownMore = useShowMore(own.routines, CLIENT_LIST_LIMIT)
	const { pages, sentinel } = useServerPages('routines', query)
	const shared = pages.data?.pages.flatMap(page => page.items) ?? []
	return (
		<div className="space-y-10">
			<ResultSection title={t('yourRoutines')}>
				{own.routinesLoading ? (
					<ResultRowsLoading />
				) : own.routines.length ? (
					<>
						<ul id={ownListId}>
							{ownMore.visible.map(routine => (
								<OwnRoutineResultRow key={routine.id} routine={routine} />
							))}
						</ul>
						<ShowMoreButton
							label={ownMore.label}
							expanded={ownMore.expanded}
							onToggle={ownMore.toggle}
							controls={ownListId}
						/>
					</>
				) : (
					<EmptyLine>{t('routinesNone', { query })}</EmptyLine>
				)}
			</ResultSection>
			<ResultSection title={t('sharedRoutines')}>
				{pages.isLoading ? (
					<ResultRowsLoading />
				) : pages.isError ? (
					<PagesError error={pages.error} />
				) : shared.length ? (
					<>
						<ul>
							{shared.map(routine => (
								<SharedRoutineResultRow
									key={routine.routineId}
									routine={routine}
								/>
							))}
						</ul>
						<PageFooter pages={pages} sentinel={sentinel} />
					</>
				) : (
					<EmptyLine>{t('sharedRoutinesNone', { query })}</EmptyLine>
				)}
			</ResultSection>
		</div>
	)
}

function WorkoutPages({ query }: { query: string }) {
	const t = useTranslations('social.search')
	const { pages, sentinel } = useServerPages('workouts', query)
	const items = pages.data?.pages.flatMap(page => page.items) ?? []
	if (pages.isLoading) return <ResultRowsLoading rows={5} />
	if (pages.isError) return <PagesError error={pages.error} />
	if (!items.length)
		return <EmptyLine>{t('workoutsNone', { query })}</EmptyLine>
	return (
		<>
			<ul>
				{items.map(session => (
					<WorkoutResultRow key={session.id} session={session} />
				))}
			</ul>
			<PageFooter pages={pages} sentinel={sentinel} />
		</>
	)
}
