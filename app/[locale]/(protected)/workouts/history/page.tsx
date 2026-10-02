'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { useWorkoutHistoryFilters } from '@/features/workout/use-workout-history-filters'
import { WorkoutHistoryFilters } from '@/features/workout/workout-history-filters'
import { WorkoutHistoryList } from '@/features/workout/workout-history-list'
import { useSidebar } from '@/hooks/use-sidebar'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useSessions } from '@/lib/api/hooks/useWorkoutSession'
import type {
	ListSessionsParams,
	WorkoutSessionListStatus,
} from '@/lib/api/types/workout.type'
import { hasActiveHistoryFilters } from '@/lib/utils/empty-states'

function WorkoutHistoryContent() {
	const t = useTranslations('workout.historyPage')
	const { isMobile } = useSidebar()

	const {
		status,
		setStatus,
		routineId,
		setRoutineId,
		from,
		setFrom,
		to,
		setTo,
		q,
		setQ,
		sort,
		setSort,
		isFiltersOpen,
		setIsFiltersOpen,
		isDateInvalid,
		params,
		applyUrl,
		buildParams,
		handleClearAll,
		handleToggleFilters,
	} = useWorkoutHistoryFilters(isMobile)

	const filtersContentRef = useRef<HTMLDivElement | null>(null)
	const [filtersMaxHeight, setFiltersMaxHeight] = useState<number>(0)
	const sentinelRef = useRef<HTMLDivElement | null>(null)

	const { data: routines } = useRoutines()
	const {
		data,
		isLoading,
		isError,
		error,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
		refetch,
	} = useSessions({ ...params, limit: 20 })

	// Measure filters content height for smooth collapse animation
	useEffect(() => {
		if (!isFiltersOpen) return
		if (!filtersContentRef.current) return
		setFiltersMaxHeight(filtersContentRef.current.scrollHeight)
	}, [isFiltersOpen, status, routineId, from, to, q, sort, routines])

	useEffect(() => {
		const onResize = () => {
			if (!isFiltersOpen) return
			if (!filtersContentRef.current) return
			setFiltersMaxHeight(filtersContentRef.current.scrollHeight)
		}
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [isFiltersOpen])

	// Infinite scroll intersection observer logic
	useEffect(() => {
		if (!sentinelRef.current) return
		const el = sentinelRef.current
		const observer = new IntersectionObserver(
			entries => {
				const entry = entries[0]
				if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{ rootMargin: '200px' },
		)
		observer.observe(el)
		return () => observer.unobserve(el)
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages?.length])

	const items = useMemo(() => {
		return (data?.pages ?? []).flatMap(p => p.items)
	}, [data])

	const handleApplyFilters = () => {
		setIsFiltersOpen(false)
		applyUrl(buildParams(), false)
		refetch()
	}

	// None of these call refetch(). Changing a filter changes `params`, which
	// changes the query key, which makes TanStack Query fetch the new key on its
	// own. The refetch() that used to be here ran against the query object of the
	// *current* render — i.e. the OLD key — so every filter change fired two
	// requests: one with the previous filters whose result was thrown away, and
	// then the real one. Verified in the browser. See TD-10.
	const handleChangeStatus = (val: WorkoutSessionListStatus | undefined) => {
		setStatus(val)
		applyUrl(buildParams({ status: val }))
	}

	const handleChangeRoutine = (val: string) => {
		setRoutineId(val)
		applyUrl(buildParams({ routineId: val }))
	}

	const handleChangeSort = (val: NonNullable<ListSessionsParams['sort']>) => {
		setSort(val)
		applyUrl(buildParams({ sort: val }))
	}

	const handleClearFilter = (key: string) => {
		switch (key) {
			case 'status':
				setStatus(undefined)
				applyUrl(buildParams({ status: undefined }))
				break
			case 'routine':
				setRoutineId('')
				applyUrl(buildParams({ routineId: '' }))
				break
			case 'date':
				setFrom('')
				setTo('')
				applyUrl(buildParams({ from: '', to: '' }))
				break
			case 'q':
				setQ('')
				applyUrl(buildParams({ q: '' }))
				break
			case 'sort':
				setSort('finishedAt:desc')
				applyUrl(buildParams({ sort: 'finishedAt:desc' }))
				break
		}
		// Same reason as the handlers above: clearing a filter changes the key.
	}

	return (
		<div className="mx-auto max-w-3xl pb-4 sm:p-4 xl:max-w-[var(--content-max)]">
			<HeroSection
				sectionClassName="mb-4 sm:mb-6"
				title={<>{t('title')}</>}
				subtitle={<>{t('subtitle')}</>}
			/>
			{/* §11.5 — the archive is a ruled ledger, so the panel that used to box
			    the whole list is gone. The section heading and its rule carry the
			    region instead. */}
			<section>
				<p className="type-body-sm text-ink-3">{t('description')}</p>
				{/* UX-03 and design system §20.2: the list is the page, so the page
				    scrolls and this row stays pinned with the Filter control on it.
				    `shell-pin` cancels <main>'s gutter; below `sm` `shell-bleed`
				    reaches its edges, and from `sm` `-mx-4` cancels this page's
				    own padding, so rows pass under an opaque edge (§26.3). */}
				<div className="rule-heading shell-pin shell-bleed z-10 flex items-center justify-between gap-3 bg-background pb-2 pt-2 sm:-mx-4 sm:px-4">
					<h2 className="type-section text-foreground">{t('heading')}</h2>
					<Button
						variant="outline"
						size="sm"
						onClick={handleToggleFilters}
						aria-expanded={isFiltersOpen}
						aria-controls="workout-history-filters"
						className="inline-flex h-11 shrink-0 items-center gap-1 sm:h-9"
					>
						<span>{t('filter')}</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform duration-[var(--motion-base)] ease-standard ${
								isFiltersOpen ? 'rotate-180' : ''
							}`}
							aria-hidden="true"
						/>
					</Button>
				</div>
				<div className="pt-4">
					<WorkoutHistoryFilters
						filters={{
							status,
							routineId,
							from,
							to,
							q,
							sort,
							isFiltersOpen,
							isDateInvalid,
							setFrom,
							setTo,
							setQ,
							handleClearAll,
						}}
						layout={{ filtersContentRef, filtersMaxHeight }}
						routines={routines}
						actions={{
							handleApplyFilters,
							handleChangeStatus,
							handleChangeRoutine,
							handleChangeSort,
							handleClearFilter,
						}}
					/>

					<WorkoutHistoryList
						data={{ items, isLoading, isError, error }}
						pagination={{
							hasNextPage,
							isFetchingNextPage,
							fetchNextPage,
							sentinelRef,
						}}
						emptyState={{
							hasActiveFilters: hasActiveHistoryFilters(params),
							onClearFilters: handleClearAll,
						}}
					/>
				</div>
			</section>
		</div>
	)
}

export default function WorkoutHistoryPage() {
	const t = useTranslations('workout.historyPage')
	return (
		<Suspense
			fallback={
				<div className="mx-auto max-w-3xl pb-4 sm:p-4 xl:max-w-[var(--content-max)]">
					<div className="type-body-sm flex h-40 items-center justify-center text-ink-3">
						{t('loading')}
					</div>
				</div>
			}
		>
			<WorkoutHistoryContent />
		</Suspense>
	)
}
