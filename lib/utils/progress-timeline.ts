import type {
	ProgressTimelinePersonalRecordItem,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import type { Translator } from '@/i18n/translator'

import { formatWeightAmount, getWeightUnitLabel } from './weight-unit'

function performanceLabel(
	performance: ProgressTimelinePersonalRecordItem['current'],
	unit: WeightUnit,
	locale: Locale,
) {
	return `${formatWeightAmount(performance.weightKg, unit, locale, 2)} ${getWeightUnitLabel(unit)} × ${performance.reps}`
}

export function getRecordTimelineExplanation(
	item: ProgressTimelinePersonalRecordItem,
	unit: WeightUnit,
	t: Translator<'progress.timeline'>,
	locale: Locale = 'en',
): string {
	if (!item.previous || item.reason === 'FIRST_RECORDED_BEST') {
		return t('firstBest')
	}
	if (item.reason === 'HEAVIER_LOAD') {
		return t('heavierLoad', {
			previous: performanceLabel(item.previous, unit, locale),
		})
	}
	return t('moreReps', { count: item.current.reps - item.previous.reps })
}

export function getRecordTimelinePerformanceLabel(
	item: ProgressTimelinePersonalRecordItem,
	unit: WeightUnit,
	locale: Locale = 'en',
) {
	return performanceLabel(item.current, unit, locale)
}
