import type {
	EarnedPersonalRecord,
	PersonalRecordKind,
	WeightUnit,
} from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

import { formatWeight } from './weight-unit'

type Translated = Translator<'core.personalRecordCelebration'>

const kindLabel = (kind: PersonalRecordKind, t: Translated): string => {
	switch (kind) {
		case 'WEIGHT':
			return t('kindWeight')
		case 'REPS':
			return t('kindReps')
		case 'VOLUME':
			return t('kindVolume')
		case 'ESTIMATED_1RM':
			return t('kindEstimated1Rm')
	}
}

const singleRecordTitle = (kind: PersonalRecordKind, t: Translated): string => {
	switch (kind) {
		case 'WEIGHT':
			return t('singleWeightTitle')
		case 'REPS':
			return t('singleRepsTitle')
		case 'VOLUME':
			return t('singleVolumeTitle')
		case 'ESTIMATED_1RM':
			return t('singleEstimated1RmTitle')
	}
}

function formatRecordValue(
	record: EarnedPersonalRecord,
	weightUnit: WeightUnit,
): string {
	return record.kind === 'REPS'
		? String(record.value)
		: formatWeight(record.value, weightUnit)
}

export function buildPersonalRecordCelebration(
	records: EarnedPersonalRecord[],
	weightUnit: WeightUnit,
	t: Translated,
): { title: string; description: string } | null {
	if (records.length === 0) return null

	const title =
		records.length === 1
			? singleRecordTitle(records[0].kind, t)
			: t('multipleTitle', { count: records.length })
	const details = records
		.map(
			record =>
				`${kindLabel(record.kind, t)} ${formatRecordValue(record, weightUnit)}`,
		)
		.join(' · ')

	return {
		title,
		description: `${records[0].exerciseName} · ${details}`,
	}
}
