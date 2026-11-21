'use client'

import { useTranslations } from 'next-intl'

import { MuscleMap } from '@/features/body-map/body-map'
import { MUSCLE_WEEKS, muscleSets } from '@/lib/site/landing-examples'

/**
 * SITE-01 §12.6: the app's own body map at full size, on the example's
 * final week (what the page shows without JavaScript and under reduced
 * motion). A client island because the map takes its sentences as functions.
 */
export function SiteMuscleMap({ week }: { week: number }) {
	const t = useTranslations('site.progress.map')
	return (
		<MuscleMap
			sets={muscleSets(MUSCLE_WEEKS[week - 1])}
			emptyText={t('empty')}
			untrainedText={muscles => t('untrained', { muscles })}
		/>
	)
}
