import type {
	EarnedPersonalRecord,
	PersonalRecordKind,
	WeightUnit,
} from '@sunsteel/contracts'

import { formatWeight } from './weight-unit'

const KIND_LABELS: Record<PersonalRecordKind, string> = {
	WEIGHT: 'Weight',
	REPS: 'Reps',
	VOLUME: 'Volume',
	ESTIMATED_1RM: 'Est. 1RM',
}

const SINGLE_RECORD_TITLES: Record<PersonalRecordKind, string> = {
	WEIGHT: 'New weight record',
	REPS: 'New rep record',
	VOLUME: 'New volume record',
	ESTIMATED_1RM: 'New estimated 1RM record',
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
): { title: string; description: string } | null {
	if (records.length === 0) return null

	const title =
		records.length === 1
			? SINGLE_RECORD_TITLES[records[0].kind]
			: `${records.length} new personal records`
	const details = records
		.map(
			record =>
				`${KIND_LABELS[record.kind]} ${formatRecordValue(record, weightUnit)}`,
		)
		.join(' · ')

	return {
		title,
		description: `${records[0].exerciseName} · ${details}`,
	}
}
