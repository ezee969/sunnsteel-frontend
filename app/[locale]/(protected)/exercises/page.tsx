'use client'

import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import {
	ExerciseCatalog,
	ExerciseCatalogSkeleton,
} from '@/features/exercises/exercise-catalog'

export default function ExercisesPage() {
	const t = useTranslations('catalog.exercisesPage')
	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection title={<>{t('title')}</>} subtitle={<>{t('subtitle')}</>} />
			{/* The filters live in the URL, and `useSearchParams` needs a
			    boundary to prerender the rest of the page. */}
			<Suspense fallback={<ExerciseCatalogSkeleton />}>
				<ExerciseCatalog />
			</Suspense>
		</div>
	)
}
