'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { useRoutines } from '@/lib/api/hooks/useRoutines'

import WorkoutFilters from './components/WorkoutFilters'
import WorkoutsList from './components/WorkoutsList'
import { WorkoutFilter } from './types'

export default function RoutinesPage() {
	const router = useRouter()
	const [activeFilter, setActiveFilter] = useState<WorkoutFilter>('all')

	const listFilters = useMemo(() => {
		if (activeFilter === 'favorites') return { isFavorite: true } as const
		if (activeFilter === 'completed') return { isCompleted: true } as const
		// 'all' and 'recent' currently map to no backend filters
		return {} as const
	}, [activeFilter])

	const { data: routines, isLoading, error } = useRoutines(listFilters)
	useEffect(() => {
		router.prefetch('/routines/new')
	}, [router])

	return (
		<div className="flex flex-col gap-4 sm:gap-6">
			<HeroSection
				title={<>Routines</>}
				subtitle={<>Plan, track, and refine your training.</>}
			/>
			{/* TD-54 and design system §20.2: the filters and Create Routine share
			    one row, pinned while the page scrolls. Its negative top cancels
			    <main>'s padding, which a sticky offset is measured inside, so no
			    row shows above it. The list is not a scroll box of its own; the
			    page is the one scroll. Create Routine matches the select's
			    height (44px until `md`) so the two line up. */}
			<div className="flex flex-col gap-4">
				<div className="sticky -top-3 z-10 -mx-3 -my-2 flex items-center gap-2 bg-background px-3 py-2 sm:-top-6 sm:-mx-6 sm:px-6">
					<WorkoutFilters
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
					<Button asChild className="ml-auto h-11 shrink-0 gap-2 md:h-10">
						<Link href="/routines/new" prefetch>
							<Plus className="h-4 w-4" />
							<span>Create Routine</span>
						</Link>
					</Button>
				</div>
				<WorkoutsList
					routines={routines}
					isLoading={isLoading}
					error={error}
					filtered={
						activeFilter === 'favorites' || activeFilter === 'completed'
					}
				/>
			</div>
		</div>
	)
}
