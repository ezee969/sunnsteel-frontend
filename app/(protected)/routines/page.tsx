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
		<div className="h-full min-h-0 flex flex-col gap-4 sm:gap-6">
			{/* Classical Hero */}
			<HeroSection
				title={<>Routines</>}
				subtitle={<>Plan, track, and refine your training.</>}
			/>
			{/* Header Section — the empty spacer div that used to sit opposite this
			    button left a band of dead space under the masthead. */}
			<div className="flex justify-end">
				<Button asChild className="gap-2">
					<Link href="/routines/new" prefetch>
						<Plus className="h-4 w-4" />
						<span>Create Routine</span>
					</Link>
				</Button>
			</div>

			<div className="flex min-h-0 flex-1 flex-col gap-4">
				<WorkoutFilters
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
				<WorkoutsList routines={routines} isLoading={isLoading} error={error} />
			</div>
		</div>
	)
}
