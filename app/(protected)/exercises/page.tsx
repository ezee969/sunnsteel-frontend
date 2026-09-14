'use client'

import { Suspense } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import {
	ExerciseCatalog,
	ExerciseCatalogSkeleton,
} from '@/features/exercises/exercise-catalog'

export default function ExercisesPage() {
	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Exercises</>}
				subtitle={
					<>
						Browse the catalog by muscle, equipment and movement, or narrow it
						to the exercises you have trained.
					</>
				}
			/>
			{/* The filters live in the URL, and `useSearchParams` needs a
			    boundary to prerender the rest of the page. */}
			<Suspense fallback={<ExerciseCatalogSkeleton />}>
				<ExerciseCatalog />
			</Suspense>
		</div>
	)
}
